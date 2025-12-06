const express = require('express')
const cors = require('cors')
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


// middleware

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@gerund-server-1.t1uapv6.mongodb.net/?appName=Gerund-Server-1`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection =  client.db('bookArchive').collection('user');
    const booksCollection =  client.db('bookArchive').collection('books');
    const borrowCollection =  client.db('bookArchive').collection('borrow');

    // save user to db

    app.post('/users', async(req , res)=>{
        const userData = req.body;
        console.log(userData);
        const result = await userCollection.insertOne(userData);
        res.send(result);
    })

    // save added book to db

    app.post('/addbook' , async (req , res)=> {
        const bookData = req.body;
        const result = await booksCollection.insertOne(bookData);
        res.send(result);
    })

    // borrow book api

    app.post('/borrow/:id' , async(req , res)=> {
        const id = req.params.id;
        const {userEmail , returnDate} = req.body;

        const filter = {_id: new ObjectId(id)};

        const updateQuantity = {
            $inc: { quantity: -1 },
        }

        const book = await booksCollection.findOne(filter);

        if(!book || book.quantity <= 0){
            return res.status(400).send({message: 'Book is not available'})
        } 

        const result1 = await booksCollection.updateOne(filter , updateQuantity)


        // saving borrowed book details
        const borrowData = {
            bookId : id,
            bookName : book.name,
            userEmail,
            borrowedDate : new Date(),
            returnDate,

        } 

        const result2 = await borrowCollection.insertOne(borrowData);

        res.send(result1 , result2);
    })

    

    //  specific categorized book data from db

    app.get('/book-category/:category' , async(req , res)=> {
        const categoryName = req.params.category;
        const query = {category : categoryName};
        const result = await booksCollection.find(query).toArray();
        res.send(result);
    })

    // specific book data from db

    app.get('/book-detail/:id' , async(req , res)=> {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await booksCollection.findOne(query);
        res.send(result);
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req , res) => {
    res.send('Library Server Getting Ready')
})

app.listen(port , () => {
    console.log('library server running on port:' , port)
})
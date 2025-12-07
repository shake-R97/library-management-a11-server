const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());



let client;
let clientPromise;

if (!global._mongoClientPromise) {
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@gerund-server-1.t1uapv6.mongodb.net/?retryWrites=true&w=majority&appName=Gerund-Server-1`;

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;



app.get('/', (req, res) => {
    res.send("📚 Library Server Running on Vercel!");
});

// Save User
app.post('/users', async (req, res) => {
    try {
        const client = await clientPromise;
        const result = await client.db('bookArchive')
            .collection('user')
            .insertOne(req.body);

        res.send(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Add Book
app.post('/addbook', async (req, res) => {
    try {
        const client = await clientPromise;
        const result = await client.db('bookArchive')
            .collection('books')
            .insertOne(req.body);

        res.send(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Borrow Book
app.post('/borrow/:id', async (req, res) => {
    try {
        const client = await clientPromise;
        const db = client.db('bookArchive');

        const id = req.params.id;
        const { userEmail, returnDate } = req.body;

        const filter = { _id: new ObjectId(id) };

        const book = await db.collection('books').findOne(filter);

        if (!book || book.quantity <= 0) {
            return res.status(400).json({ message: "Book not available" });
        }

        // decrease quantity
        await db.collection('books').updateOne(filter, { $inc: { quantity: -1 } });

        // save borrow info
        const borrowData = {
            bookId: id,
            bookImg: book.image,
            bookName: book.name,
            userEmail,
            borrowedDate: new Date(),
            returnDate,
        };

        const result = await db.collection('borrow').insertOne(borrowData);

        res.send(result);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Category Books
app.get('/book-category/:category', async (req, res) => {
    try {
        const client = await clientPromise;
        const result = await client.db('bookArchive')
            .collection('books')
            .find({ category: req.params.category })
            .toArray();

        res.send(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Single Book Details
app.get('/book-detail/:id', async (req, res) => {
    try {
        const client = await clientPromise;
        const result = await client.db('bookArchive')
            .collection('books')
            .findOne({ _id: new ObjectId(req.params.id) });

        res.send(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Borrowed Books
app.get('/borrowed/:email', async (req, res) => {
    try {
        const client = await clientPromise;
        const result = await client.db('bookArchive')
            .collection('borrow')
            .find({ userEmail: req.params.email })
            .toArray();

        res.send(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// All Books
app.get('/all-books', async (req, res) => {
    try {
        const client = await clientPromise;
        const result = await client.db('bookArchive')
            .collection('books')
            .find({})
            .toArray();

        res.send(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = app;

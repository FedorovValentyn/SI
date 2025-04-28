import express from 'express';
import { exec } from 'child_process';  // Use ES import for 'exec'
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.resolve(); // This still works as path is an ES module-friendly import

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Valik25122005!',
    database: 'bookstore'
});

app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, title,description, subtitle, authors, categories, thumbnail, price FROM products');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Помилка сервера');
    }
});


app.post('/api/order', async (req, res) => {
    const { product_id, quantity } = req.body;
    await pool.query('INSERT INTO orders (product_id, quantity) VALUES (?, ?)', [product_id, quantity]);
    res.sendStatus(201);
});

app.post('/api/recommend', (req, res) => {
    const { bookName } = req.body;

    if (!bookName) {
        return res.status(400).json({ error: 'Book name is required.' });
    }

    const scriptPath = path.resolve(__dirname, 'recommend_books.py');
    exec(`python ${path.resolve(__dirname, 'recommend_books.py')} "${bookName}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }

        try {
            const recommendations = JSON.parse(stdout);
            return res.json(recommendations);
        } catch (err) {
            console.error('JSON parse error:', err);
            return res.status(500).json({ error: 'Invalid response from recommendation engine.' });
        }
    });
});


const PORT = 5000;  //
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

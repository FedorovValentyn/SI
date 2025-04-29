import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config(); // Завантажуємо змінні середовища з .env файлу

const __dirname = path.resolve();

const app = express();
app.use(cors());
app.use(express.json());

// Підключення до бази даних MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD || 'Valik25122005!',
    database: 'bookstore'
});

// Мідлвар для перевірки токену авторизації
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Authorization token is missing" });
    }

    try {
        // Перевірка токену з використанням секретного ключа
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Зберігаємо інформацію про користувача в запиті
        next(); // Йдемо до наступного обробника
    } catch (error) {
        console.error('JWT Error:', error);

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ error: 'Invalid token signature' });
        } else if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: 'Token has expired' });
        }

        return res.status(400).json({ error: 'Invalid token' });
    }
};

// Валідація замовлення за допомогою Joi
const orderSchema = Joi.object({
    productId: Joi.number().required(),
    quantity: Joi.number().required(),
    totalPrice: Joi.number().required(),
});

// Отримання списку продуктів
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, title, description, subtitle, authors, categories, published_year, thumbnail, price FROM products');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Помилка сервера');
    }
});

// Створення замовлення
app.post('/api/orders', verifyToken, async (req, res) => {
    const { error } = orderSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { productId, quantity, totalPrice } = req.body;
    const userId = req.user.id;

    try {
        const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
        if (product.length === 0) {
            return res.status(400).json({ error: 'Продукт не знайдено.' });
        }

        if (quantity > product[0].stock) {
            return res.status(400).json({ error: 'Недостатньо товару на складі.' });
        }

        const [result] = await pool.query(
            `INSERT INTO orders (user_id, product_id, quantity)
             VALUES (?, ?, ?)`,
            [userId, productId, quantity]
        );

        await pool.query(
            `UPDATE products SET stock = stock - ? WHERE id = ?`,
            [quantity, productId]
        );

        res.status(201).json({ message: 'Замовлення успішно створено!', orderId: result.insertId });
    } catch (error) {
        console.error('Помилка при створенні замовлення:', error);
        res.status(500).json({ error: 'Помилка сервера при створенні замовлення.' });
    }
});

// Маршрут для отримання замовлень користувача
app.get('/api/orders', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [orders] = await pool.query(`
            SELECT
                o.id,
                o.quantity,
                (o.quantity * p.price) AS total_price,
                o.status,
                DATE_FORMAT(o.order_date, '%Y-%m-%d') AS date,
                p.title, 
                p.price AS product_price
            FROM orders o
                JOIN products p ON o.product_id = p.id
            WHERE o.user_id = ?
        `, [userId]);

        if (orders.length === 0) {
            return res.status(404).json({ error: "No orders found" });
        }

        res.json(orders);
    } catch (error) {
        console.error('Error in /api/orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Реєстрація користувача
app.post('/api/register', async (req, res) => {
    const { email, password, firstName, lastName, phone, address } = req.body;

    if (!email || !password || !firstName || !lastName || !phone || !address) {
        return res.status(400).json({ error: 'Будь ласка, заповніть усі поля.' });
    }

    try {
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ error: 'Користувач з такою поштою вже існує.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (email, password, first_name, last_name, phone_number, delivery_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, firstName, lastName, phone, address]
        );

        res.status(201).json({ message: 'Реєстрація успішна!' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Помилка сервера під час реєстрації' });
    }
});

// Вхід користувача
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email та пароль обовʼязкові.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(400).json({ error: 'Невірний email або пароль.' });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Невірний email або пароль.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ message: 'Вхід успішний.', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера при вході.' });
    }
});

// Профіль користувача
app.get('/api/profile', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);

        if (user.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = user[0];
        res.json({
            firstName: userData.first_name,
            lastName: userData.last_name,
            email: userData.email,
            phone: userData.phone_number,
            deliveryAddress: userData.delivery_address
        });
    } catch (error) {
        console.error('Error in /api/profile:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Рекомендації книг (відправлення запиту до Python скрипта)
app.post('/api/recommend', (req, res) => {
    const { bookName } = req.body;

    if (!bookName) {
        return res.status(400).json({ error: 'Book name is required.' });
    }

    const scriptPath = path.resolve(__dirname, 'recommend_books.py');
    exec(`python ${scriptPath} "${bookName}"`, (error, stdout, stderr) => {
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

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

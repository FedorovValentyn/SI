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
        const [rows] = await pool.query('SELECT id, title,description, subtitle, authors, categories, published_year, thumbnail, price FROM products');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send('Помилка сервера');
    }
});


app.get('/api/orders', async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Authorization token is missing" });
    }

    try {
        // Декодуємо токен для отримання ID користувача
        const decoded = jwt.verify(token, 'your_secret_key');
        const userId = decoded.id;

        // Отримуємо замовлення користувача разом із продуктами
        const [orders] = await pool.query(
            `SELECT 
                o.id AS orderId, 
                o.order_date AS orderDate, 
                o.status AS orderStatus, 
                o.total_price AS totalPrice,
                p.title AS productName,
                p.price AS productPrice,
                op.quantity AS productQuantity
             FROM orders o
             JOIN order_products op ON o.id = op.order_id
             JOIN products p ON op.product_id = p.id
             WHERE o.user_id = ?
             ORDER BY o.order_date DESC`,
            [userId]
        );

        if (!orders.length) {
            return res.status(200).json([]);
        }

        // Форматуємо дані для відповіді
        const formattedOrders = orders.reduce((acc, order) => {
            const existingOrder = acc.find(o => o.orderId === order.orderId);
            const productDetails = {
                productName: order.productName,
                productPrice: order.productPrice,
                productQuantity: order.productQuantity,
            };

            if (existingOrder) {
                existingOrder.products.push(productDetails);
            } else {
                acc.push({
                    orderId: order.orderId,
                    orderDate: order.orderDate,
                    orderStatus: order.orderStatus,
                    totalPrice: order.totalPrice,
                    products: [productDetails],
                });
            }

            return acc;
        }, []);

        res.json(formattedOrders);
    } catch (error) {
        console.error('Error in /api/orders:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: "Internal server error" });
    }
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


app.post('/api/register', async (req, res) => {
    const { email, password, firstName, lastName, phone, address } = req.body;

    if (!email || !password || !firstName || !lastName || !phone || !address) {
        return res.status(400).json({ error: 'Будь ласка, заповніть усі поля.' });
    }

    try {
        // Перевірка чи вже існує користувач
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ error: 'Користувач з такою поштою вже існує.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Оновлений правильний SQL запит
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

        // Створення токена
        const token = jwt.sign(
            { id: user.id, email: user.email },
            'your_secret_key', // потрібно винести у змінні середовища
            { expiresIn: '7d' }
        );

        res.json({ message: 'Вхід успішний.', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера при вході.' });
    }
});

app.get('/api/profile', async (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Authorization token is missing" });
    }

    try {
        const decoded = jwt.verify(token, 'your_secret_key'); // Ensure key matches
        console.log('Decoded JWT:', decoded);

        const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

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
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});




const PORT = 5000;  //
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

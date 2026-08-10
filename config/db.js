require('dotenv').config();
const { Pool, Client } = require('pg');
const bcrypt = require('bcryptjs');
const initialProducts = require('../data/product');

const targetDB = process.env.DB_DATABASE || 'tokoAriesta';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '123kucing';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT, 10) || 5432;

// Memastikan database yang ditentukan di .env (misal: tokoAriesta) dibuat otomatis jika belum ada
const ensureDatabaseExists = async () => {
    const defaultClient = new Client({
        user: dbUser,
        password: dbPassword,
        host: dbHost,
        port: dbPort,
        database: 'postgres'
    });

    try {
        await defaultClient.connect();
        const res = await defaultClient.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [targetDB]
        );

        if (res.rowCount === 0) {
            console.log(`[DB] Database "${targetDB}" belum ada. Membuat database "${targetDB}"...`);
            const safeDBName = targetDB.replace(/"/g, '""');
            await defaultClient.query(`CREATE DATABASE "${safeDBName}"`);
            console.log(`[DB] Database "${targetDB}" berhasil dibuat.`);
        }
    } catch (err) {
        console.error(`[DB Warning] Gagal mengecek/membuat database "${targetDB}":`, err.message);
    } finally {
        await defaultClient.end();
    }
};

const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: targetDB
});

// Inisialisasi Tabel & Data Seed
const initDB = async () => {
    try {
        await ensureDatabaseExists();

        // Tabel Users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(30) DEFAULT 'Customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabel Products
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(50) NOT NULL,
                price NUMERIC(12, 2) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed Default Admin User jika belum ada
        const userCheck = await pool.query(`SELECT id FROM users LIMIT 1`);
        if (userCheck.rowCount === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                `INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)`,
                ['admin', 'admin@ibuaries.com', hashedPassword, 'Kasir/Admin']
            );
            console.log(`[DB] Default admin user initialized (admin / admin123) di database "${targetDB}"`);
        }

        // Seed Default Products jika belum ada
        const productCheck = await pool.query(`SELECT id FROM products LIMIT 1`);
        if (productCheck.rowCount === 0) {
            for (const p of initialProducts) {
                await pool.query(
                    `INSERT INTO products (name, category, price, stock, description,) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        p.name,
                        p.category,
                        p.price,
                        p.stock,
                        p.description,
                    ]
                );
            }
            console.log(`[DB] Initial products seeded into PostgreSQL database "${targetDB}"`);
        }

        console.log(`[DB] PostgreSQL database "${targetDB}" ready!`);
    } catch (err) {
        console.error(`[DB Error] Gagal inisialisasi database "${targetDB}":`, err.message);
    }
};

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    initDB
};

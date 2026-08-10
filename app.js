// app.js - Toko Sembako Ibu Aries (PostgreSQL & User Registration)
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi Database PostgreSQL
db.initDB();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key-toko-ibu-aries-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 Jam
}));

// Custom Logger Middleware (Mencatat Method + Endpoint + Waktu)
const loggerMiddleware = (req, res, next) => {
    console.log(`[LOGGER] [${req.method}] ${req.url} - ${new Date().toISOString()}`);
    next();
};
app.use(loggerMiddleware);

// Middleware agar user session bisa diakses di semua EJS View
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Middleware Auth untuk Memproteksi Rute Web Dashboard
const requireAuthWeb = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Middleware Auth untuk Memproteksi Rute API Mutasi (POST, PUT, DELETE)
const requireAuthAPI = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized: Anda wajib login terlebih dahulu."
        });
    }
    next();
};

// Konfigurasi EJS View Engine & Public Folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 1. WEB ROUTES (SERVER-SIDE RENDERING)
// ==========================================

// Beranda (GET /)
app.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY id ASC LIMIT 4');
        res.render('index', { featuredProducts: result.rows });
    } catch (err) {
        console.error('Error GET /:', err);
        res.render('index', { featuredProducts: [] });
    }
});

// Katalog Produk Publik (GET /produk)
app.get('/produk', async (req, res) => {
    try {
        const categoriesResult = await db.query('SELECT DISTINCT category FROM products');
        const categories = categoriesResult.rows.map(r => r.category);
        res.render('produk', {
            categories,
            selectedCategory: req.query.kategori || '',
            searchQuery: req.query.search || ''
        });
    } catch (err) {
        console.error('Error GET /produk:', err);
        res.render('produk', { categories: [], selectedCategory: '', searchQuery: '' });
    }
});

// Detail Produk Dinamis (GET /produk/:id)
app.get('/produk/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const result = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
        const product = result.rows[0] || null;

        if (!product) {
            return res.status(404).render('detail-produk', { product: null });
        }

        res.render('detail-produk', { product });
    } catch (err) {
        console.error('Error GET /produk/:id:', err);
        res.status(500).render('detail-produk', { product: null });
    }
});

// Tanya AI Page (GET /tanya-ai)
app.get('/tanya-ai', (req, res) => {
    res.render('tanya-ai');
});

// Halaman Login (GET /login)
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('login');
});

// Halaman Register (GET /register)
app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('register');
});

// Halaman Dashboard Admin (GET /dashboard) - Protected Web
app.get('/dashboard', requireAuthWeb, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY id ASC');
        res.render('dashboard', { products: result.rows });
    } catch (err) {
        console.error('Error GET /dashboard:', err);
        res.render('dashboard', { products: [] });
    }
});

// Halaman Logout (GET /logout)
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// ==========================================
// 2. REST API ENDPOINTS
// ==========================================

// Auth Endpoint: POST /api/register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                status: "error",
                message: "Username dan password wajib diisi."
            });
        }

        // Cek apakah username sudah dipakai
        const checkUser = await db.query('SELECT id FROM users WHERE username = $1', [username.trim()]);
        if (checkUser.rowCount > 0) {
            return res.status(400).json({
                status: "error",
                message: "Username sudah digunakan, silakan gunakan username lain."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Keamanan: Registrasi publik selalu menetapkan role sebagai 'Customer' (bukan Admin/Kasir)
        const userRole = 'Customer';

        // Simpan ke PostgreSQL
        const insertResult = await db.query(
            `INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`,
            [username.trim(), email ? email.trim() : null, hashedPassword, userRole]
        );

        return res.status(201).json({
            status: "success",
            message: "Registrasi akun berhasil! Silakan login.",
            data: insertResult.rows[0],
            redirectUrl: "/login"
        });
    } catch (err) {
        console.error('Error POST /api/register:', err);
        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan server saat registrasi: " + err.message
        });
    }
});

// Auth Endpoint: POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                status: "error",
                message: "Username dan password wajib diisi."
            });
        }

        // Cari user di database
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
        if (userResult.rowCount === 0) {
            return res.status(401).json({
                status: "error",
                message: "Username atau password salah!"
            });
        }

        const user = userResult.rows[0];

        // Verifikasi Hashed Password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({
                status: "error",
                message: "Username atau password salah!"
            });
        }

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        return res.json({
            status: "success",
            message: "Login berhasil!",
            redirectUrl: "/dashboard"
        });
    } catch (err) {
        console.error('Error POST /api/login:', err);
        return res.status(500).json({
            status: "error",
            message: "Terjadi kesalahan server saat login."
        });
    }
});

// GET /api/products — Read All / Filter Products (Public)
app.get('/api/products', async (req, res) => {
    try {
        const { kategori, search } = req.query;
        let queryText = 'SELECT * FROM products WHERE 1=1';
        const queryParams = [];

        if (kategori) {
            queryParams.push(kategori.toLowerCase());
            queryText += ` AND LOWER(category) = $${queryParams.length}`;
        }

        if (search) {
            queryParams.push(`%${search.toLowerCase()}%`);
            queryText += ` AND LOWER(name) LIKE $${queryParams.length}`;
        }

        queryText += ' ORDER BY id ASC';

        const result = await db.query(queryText, queryParams);

        res.json({
            status: "success",
            total: result.rowCount,
            data: result.rows
        });
    } catch (err) {
        console.error('Error GET /api/products:', err);
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil data produk dari database."
        });
    }
});

// GET /api/products/:id — Read Single Product (Public)
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const result = await db.query('SELECT * FROM products WHERE id = $1', [productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Produk tidak ditemukan"
            });
        }

        res.json({
            status: "success",
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error GET /api/products/:id:', err);
        res.status(500).json({
            status: "error",
            message: "Gagal mengambil detail produk."
        });
    }
});

// POST /api/products — Create Product (Protected API)
app.post('/api/products', requireAuthAPI, async (req, res) => {
    try {
        const { name, category, price, stock, description, image } = req.body;

        if (!name || !category || price === undefined || stock === undefined) {
            return res.status(400).json({
                status: "error",
                message: "Field name, category, price, dan stock wajib diisi."
            });
        }

        const defaultImage = "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80";
        const defaultDescription = "Produk sembako kualitas terbaik.";

        const insertQuery = `
            INSERT INTO products (name, category, price, stock, description, image)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [
            name.trim(),
            category.trim(),
            Number(price),
            Number(stock),
            description || defaultDescription,
            image || defaultImage
        ];

        const result = await db.query(insertQuery, values);

        res.status(201).json({
            status: "success",
            message: "Produk berhasil ditambahkan!",
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error POST /api/products:', err);
        res.status(500).json({
            status: "error",
            message: "Gagal menyimpan produk ke database."
        });
    }
});

// PUT /api/products/:id — Update Product (Protected API)
app.put('/api/products/:id', requireAuthAPI, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { name, category, price, stock, description, image } = req.body;

        const checkExist = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (checkExist.rowCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Produk tidak ditemukan."
            });
        }

        const current = checkExist.rows[0];
        const updatedName = name ? name.trim() : current.name;
        const updatedCategory = category ? category.trim() : current.category;
        const updatedPrice = price !== undefined ? Number(price) : current.price;
        const updatedStock = stock !== undefined ? Number(stock) : current.stock;
        const updatedDesc = description !== undefined ? description : current.description;
        const updatedImage = image !== undefined ? image : current.image;

        const updateQuery = `
            UPDATE products 
            SET name = $1, category = $2, price = $3, stock = $4, description = $5, image = $6
            WHERE id = $7
            RETURNING *;
        `;

        const result = await db.query(updateQuery, [
            updatedName,
            updatedCategory,
            updatedPrice,
            updatedStock,
            updatedDesc,
            updatedImage,
            productId
        ]);

        res.json({
            status: "success",
            message: "Produk berhasil diperbarui!",
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error PUT /api/products/:id:', err);
        res.status(500).json({
            status: "error",
            message: "Gagal mengutarakan pembaruan produk di database."
        });
    }
});

// DELETE /api/products/:id — Delete Product (Protected API)
app.delete('/api/products/:id', requireAuthAPI, async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: "error",
                message: "Produk tidak ditemukan."
            });
        }

        res.json({
            status: "success",
            message: "Produk berhasil dihapus!",
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error DELETE /api/products/:id:', err);
        res.status(500).json({
            status: "error",
            message: "Gagal menghapus produk dari database."
        });
    }
});

// POST /api/chat — Backend AI Chat Response (Keyword Matching / Rules)
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ reply: "Silakan masukkan pertanyaan Anda." });
    }

    const query = message.toLowerCase();
    let reply = "";

    if (query.includes("buka") || query.includes("jam")) {
        reply = "Toko Ibu Aries buka setiap hari Senin - Minggu dari jam 06.00 hingga 21.00 WIB.";
    } else if (query.includes("ongkir") || query.includes("antar") || query.includes("kirim")) {
        reply = "Kami melayani pengiriman sembako gratis ongkir untuk area kawasan Pasar Kranggan dengan minimal belanja Rp 50.000.";
    } else if (query.includes("bayar") || query.includes("pembayaran") || query.includes("transfer")) {
        reply = "Pembayaran dapat dilakukan secara tunai (COD), Transfer Bank (BCA/Mandiri), maupun QRIS.";
    } else if (query.includes("stok") || query.includes("ada") || query.includes("beras") || query.includes("minyak") || query.includes("gula")) {
        reply = "Stok beras, minyak goreng, gula, dan kebutuhan pokok kami selalu diperbarui setiap hari. Anda bisa cek ketersediaan langsung di halaman Katalog Produk.";
    } else {
        reply = `Terima kasih telah bertanya tentang "${message}". Asisten Ibu Aries siap membantu kebutuhan sembako Anda! Ada yang bisa kami bantu lagi?`;
    }

    res.json({
        status: "success",
        reply: reply
    });
});

// Alias Routes
app.get('/products', (req, res) => res.redirect('/produk'));
app.get('/products/:id', (req, res) => res.redirect(`/produk/${req.params.id}`));

// Handler Error 404
app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(PORT, () => {
    console.log(`Server Toko Ibu Aries berjalan di http://localhost:${PORT}`);
});

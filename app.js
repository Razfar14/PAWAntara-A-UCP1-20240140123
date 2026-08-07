// app.js - Toko Sembako Ibu Aries (Sprint 1 & Sprint 2)
const express = require('express');
const path = require('path');
const session = require('express-session');
const products = require('./data/product');

const app = express();
const PORT = process.env.PORT || 3000;

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Middleware
app.use(session({
    secret: 'secret-key-toko-ibu-aries-12345',
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
app.get('/', (req, res) => {
    const featuredProducts = products.slice(0, 4);
    res.render('index', { featuredProducts });
});

// Katalog Produk Publik (GET /produk)
app.get('/produk', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    res.render('produk', {
        categories,
        selectedCategory: req.query.kategori || '',
        searchQuery: req.query.search || ''
    });
});

// Detail Produk Dinamis (GET /produk/:id)
app.get('/produk/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).render('detail-produk', { product: null });
    }

    res.render('detail-produk', { product });
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

// Halaman Dashboard Admin (GET /dashboard) - Protected Web
app.get('/dashboard', requireAuthWeb, (req, res) => {
    res.render('dashboard', { products });
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

// Auth Endpoint: POST /api/login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin123') {
        req.session.user = { username: 'admin', role: 'Kasir/Admin' };
        return res.json({
            status: "success",
            message: "Login berhasil!",
            redirectUrl: "/dashboard"
        });
    }

    return res.status(401).json({
        status: "error",
        message: "Username atau password salah!"
    });
});

// GET /api/products — Read All / Filter Products (Public)
app.get('/api/products', (req, res) => {
    const { kategori, search } = req.query;
    let filteredProducts = products;

    if (kategori) {
        filteredProducts = filteredProducts.filter(p => 
            p.category.toLowerCase() === kategori.toLowerCase()
        );
    }

    if (search) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    res.json({
        status: "success",
        total: filteredProducts.length,
        data: filteredProducts
    });
});

// GET /api/products/:id — Read Single Product (Public)
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({
            status: "error",
            message: "Produk tidak ditemukan"
        });
    }

    res.json({
        status: "success",
        data: product
    });
});

// POST /api/products — Create Product (Protected API)
app.post('/api/products', requireAuthAPI, (req, res) => {
    const { name, category, price, stock, description, image } = req.body;

    if (!name || !category || price === undefined || stock === undefined) {
        return res.status(400).json({
            status: "error",
            message: "Field name, category, price, dan stock wajib diisi."
        });
    }

    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
        id: newId,
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        stock: Number(stock),
        image: image || "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
        description: description || "Produk sembako kualitas terbaik."
    };

    products.push(newProduct);

    res.status(201).json({
        status: "success",
        message: "Produk berhasil ditambahkan!",
        data: newProduct
    });
});

// PUT /api/products/:id — Update Product (Protected API)
app.put('/api/products/:id', requireAuthAPI, (req, res) => {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({
            status: "error",
            message: "Produk tidak ditemukan."
        });
    }

    const { name, category, price, stock, description, image } = req.body;

    if (name) products[productIndex].name = name.trim();
    if (category) products[productIndex].category = category.trim();
    if (price !== undefined) products[productIndex].price = Number(price);
    if (stock !== undefined) products[productIndex].stock = Number(stock);
    if (description !== undefined) products[productIndex].description = description;
    if (image !== undefined) products[productIndex].image = image;

    res.json({
        status: "success",
        message: "Produk berhasil diperbarui!",
        data: products[productIndex]
    });
});

// DELETE /api/products/:id — Delete Product (Protected API)
app.delete('/api/products/:id', requireAuthAPI, (req, res) => {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({
            status: "error",
            message: "Produk tidak ditemukan."
        });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    res.json({
        status: "success",
        message: "Produk berhasil dihapus!",
        data: deletedProduct
    });
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

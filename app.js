// app.js
const express = require('express');
const path = require('path');
const products = require('./data/product');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

//Bagian Sprint1
// Konfigurasi EJS View Engine & Public Folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
app.use(express.static(path.join(__dirname, 'public')));

// 1. Beranda (GET /)
app.get('/', (req, res) => {
    const featuredProducts = products.slice(0, 4);
    res.render('index', { featuredProducts });
});

// 2. Daftar Produk dengan Filter (GET /produk)
app.get('/produk', (req, res) => {
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

    const categories = [...new Set(products.map(p => p.category))];

    res.render('produk', {
        products: filteredProducts,
        categories,
        selectedCategory: kategori || '',
        searchQuery: search || ''
    });
});

// 3. Detail Produk Dinamis (GET /produk/:id)
app.get('/produk/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).render('detail-produk', { product: null });
    }

    res.render('detail-produk', { product });
});

// 4. Tanya AI (GET /tanya-ai)
app.get('/tanya-ai', (req, res) => {
    res.render('tanya-ai');
});

// 5. REST API Read-Only (GET /api/products)
app.get('/api/products', (req, res) => {
    res.json({
        status: "success",
        message: "Data produk dummy berhasil diambil",
        total: products.length,
        data: products
    });
});

// Alias Route /products -> /produk
app.get('/products', (req, res) => res.redirect('/produk'));
app.get('/products/:id', (req, res) => res.redirect(`/produk/${req.params.id}`));

// Handler Error 404
app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(PORT, () => {
    console.log(`Server Toko Ibu Aries berjalan di http://localhost:${PORT}`);
});


//Bagian Sprint 2
// 1. Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 2. Express Session Middleware
app.use(session({
    secret: 'secret-key-toko-ibu-aries',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 Jam
}));
// 3. Custom Logger Middleware (Mencatat Method + Endpoint + Waktu)
const loggerMiddleware = (req, res, next) => {
    console.log(`[LOGGER] [${req.method}] ${req.url} - ${new Date().toISOString()}`);
    next();
};
app.use(loggerMiddleware);
// Middleware Passing User Session ke EJS View
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});
// 4. Middleware Auth Proteksi Halaman Web Dashboard
const requireAuthWeb = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
};
// 5. Middleware Auth Proteksi Endpoint API Mutasi (POST, PUT, DELETE)
const requireAuthAPI = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized: Anda wajib login terlebih dahulu."
        });
    }
    next();
};
// EJS & Public Folder Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
app.use(express.static(path.join(__dirname, 'public')));

// Halaman Login (GET /login)
app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login');
});

// Endpoint Login (POST /api/login)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.user = { username: 'admin', role: 'Kasir/Admin' };
        return res.json({ status: "success", redirectUrl: "/dashboard" });
    }
    return res.status(401).json({ status: "error", message: "Username atau password salah!" });
});

// Fitur Logout (GET /logout)
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});


// GET /api/products (Public Read All & Filter)
app.get('/api/products', (req, res) => {
    const { kategori, search } = req.query;
    let filtered = products;
    if (kategori) filtered = filtered.filter(p => p.category.toLowerCase() === kategori.toLowerCase());
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    res.json({ status: "success", total: filtered.length, data: filtered });
});

// GET /api/products/:id (Public Read Single)
app.get('/api/products/:id', (req, res) => {
    const p = products.find(p => p.id === parseInt(req.params.id));
    if (!p) return res.status(404).json({ status: "error", message: "Produk tidak ditemukan" });
    res.json({ status: "success", data: p });
});

// POST /api/products (Create - Protected API)
app.post('/api/products', requireAuthAPI, (req, res) => {
    const { name, category, price, stock, description, image } = req.body;
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct = {
        id: newId,
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        stock: Number(stock),
        image: image || "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
        description: description || "Produk sembako pilihan."
    };
    products.push(newProduct);
    res.status(201).json({ status: "success", message: "Produk ditambahkan", data: newProduct });
});

// PUT /api/products/:id (Update - Protected API)
app.put('/api/products/:id', requireAuthAPI, (req, res) => {
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ status: "error", message: "Produk tidak ditemukan" });

    const { name, category, price, stock, description, image } = req.body;
    if (name) products[idx].name = name.trim();
    if (category) products[idx].category = category.trim();
    if (price !== undefined) products[idx].price = Number(price);
    if (stock !== undefined) products[idx].stock = Number(stock);
    if (description !== undefined) products[idx].description = description;
    if (image !== undefined) products[idx].image = image;

    res.json({ status: "success", message: "Produk diperbarui", data: products[idx] });
});

// DELETE /api/products/:id (Delete - Protected API)
app.delete('/api/products/:id', requireAuthAPI, (req, res) => {
    const idx = products.findIndex(p => p.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ status: "error", message: "Produk tidak ditemukan" });

    const deleted = products.splice(idx, 1)[0];
    res.json({ status: "success", message: "Produk dihapus", data: deleted });
});

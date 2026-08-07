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

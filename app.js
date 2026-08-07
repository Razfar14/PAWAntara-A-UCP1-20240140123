// app.js
const express = require('express');
const path = require('path');
const products = require('./data/product');

const app = express();
const PORT = process.env.PORT || 3000;

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

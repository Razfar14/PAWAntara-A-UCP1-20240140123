app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

//halaman utama
app.get("/",(req, res)=>{
    res.render("index.ejs")
})

//product
app.get("/produk", (req, res)=>{
    
})
app.get("/produk/:id", (req, res) =>{  
})

//AI
app.get("/tanya-ai")


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

//halaman utama
app.get("/",(req, res)=>{
    res.render("index.ejs")
})

//list product
app.get("/products", (req, res)=>{
    
})
app.get("/products/:id", (req, res) =>{  
})
app.get("/tentang", (req,res)=>{
    
})
app.get("/api/products",(req,res)=>{
  
})

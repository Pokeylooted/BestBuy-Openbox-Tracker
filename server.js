const express = require('express');
const { getAllActiveProducts } = require('./api/database.js');
const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.static("public"));
app.get('/api/products', (req, res) => {
    console.log('GET /api/products');
    getAllActiveProducts().then(products => {
        res.json({
            message: "Success",
            data: products
        });
    }).catch(error => {
        res.status(500).json({ error });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./bestbuy.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS products(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skuId TEXT UNIQUE,
            imageSrc TEXT,
            productTitle TEXT,
            productLink TEXT,
            originalPrice TEXT,
            currentPrice TEXT,
            inStoreAvailability BOOLEAN,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            removed BOOLEAN DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error('Error creating table ' + err.message);
            }
        });
    }
});

/**
 * Upserts a product into the database.
 * If the product already exists, it updates the existing record.
 * If the product does not exist, it inserts a new record.
 * @param {Object} product - The product object to be upserted.
 * @param {string} product.skuId - The SKU ID of the product.
 * @param {string} product.imageSrc - The image source URL of the product.
 * @param {string} product.productTitle - The title of the product.
 * @param {string} product.productLink - The link to the product.
 * @param {number} product.originalPrice - The original price of the product.
 * @param {number} product.currentPrice - The current price of the product.
 * @param {boolean} product.inStoreAvailability - The availability of the product in store.
 * @returns {Promise<Object>} A promise that resolves with an object containing the SKU ID and the operation result.
 * @throws {string} If there is an error during the upsert operation.
 */
function upsertProduct(product) {
    return new Promise((resolve, reject) => {
        const { skuId, imageSrc, productTitle, productLink, originalPrice, currentPrice, inStoreAvailability } = product;

        // Define a query to find an existing product based on various fields
        let query = `SELECT * FROM products WHERE `;
        const queryParams = [];
        if (skuId) {
            query += `skuId = ?`;
            queryParams.push(skuId);
        } else {
            // Build a conditional query based on available fields
            const conditions = [];
            if (imageSrc) {
                conditions.push(`imageSrc = ?`);
                queryParams.push(imageSrc);
            }
            if (productLink) {
                conditions.push(`productLink = ?`);
                queryParams.push(productLink);
            }
            if (productTitle) {
                conditions.push(`productTitle = ?`);
                queryParams.push(productTitle);
            }
            if (conditions.length === 0) {
                reject("Error: No valid identifiers provided.");
                return;
            }
            query += conditions.join(' OR ');
        }

        db.get(query, queryParams, (err, row) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                // Update existing product
                const updateQuery = `UPDATE products SET imageSrc = ?, productTitle = ?, productLink = ?, originalPrice = ?, currentPrice = ?, inStoreAvailability = ?, updatedAt = CURRENT_TIMESTAMP, removed = 0 ` + (skuId ? `WHERE skuId = ?` : `WHERE id = ?`);
                const updateParams = [imageSrc, productTitle, productLink, originalPrice, currentPrice, inStoreAvailability].concat(skuId ? [skuId] : [row.id]);
                
                db.run(updateQuery, updateParams, (err) => {
                    if (err) {
                        reject(err.message);
                    } else {
                        resolve({ identifier: skuId || row.id, updated: true });
                    }
                });
            } else {
                // Insert new product
                db.run(`INSERT INTO products (skuId, imageSrc, productTitle, productLink, originalPrice, currentPrice, inStoreAvailability) VALUES (?, ?, ?, ?, ?, ?, ?)`, [skuId || "ErrorFindingSkuID", imageSrc, productTitle, productLink, originalPrice, currentPrice, inStoreAvailability])
                .catch(err => {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        // Handle unique constraint error
                        console.error(`Product with skuId ${skuId} already exists.`);
                    } else {
                        // Re-throw other errors
                        throw err;
                    }
                })
                .then(() => {
                    resolve({ identifier: skuId || "ErrorFindingSkuID", inserted: true });
                });            }
        });
    });
}

function markProductsAsRemoved(skuIds) {
    return new Promise((resolve, reject) => {
        const placeholders = skuIds.map(() => '?').join(',');
        db.run(`UPDATE products SET removed = 1 WHERE skuId NOT IN (${placeholders})`, skuIds, function(err) {
            if (err) {
                reject(err.message);
            } else {
                resolve(this.changes);
            }
        });
    });
}

/**
 * Retrieves all active products from the database.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of active products.
 */
function getAllActiveProducts() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM products WHERE removed = 0`, [], (err, rows) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = { upsertProduct, markProductsAsRemoved, getAllActiveProducts };
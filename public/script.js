document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

function fetchProducts() {
    fetch('/api/products') // Adjust this URL to where your API is hosted
        .then(response => response.json())
        .then(data => displayProducts(data.data))
        .catch(error => console.error('Error fetching products:', error));
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Format timestamps
        const createdAtFormatted = formatDate(new Date(product.createdAt));
        const updatedAtFormatted = formatDate(new Date(product.updatedAt));

        // Timestamps
        const timestamps = document.createElement('div');
        timestamps.className = 'product-timestamps';
        timestamps.innerHTML = `Created:<br>${createdAtFormatted}<br>Updated:<br>${updatedAtFormatted}`;
        card.appendChild(timestamps);

        const imageContainer = document.createElement('div');
        imageContainer.className = 'product-image-container';
        const image = document.createElement('img');
        image.src = product.imageSrc;
        image.alt = product.productTitle;
        image.className = 'product-image';
        imageContainer.appendChild(image);

        const info = document.createElement('div');
        info.className = 'product-info';

        const title = document.createElement('h3');
        title.className = 'product-title';
        const link = document.createElement('a');
        link.href = product.productLink;
        link.textContent = product.productTitle;
        title.appendChild(link);

        const originalPrice = document.createElement('p');
        originalPrice.className = 'product-price';
        originalPrice.textContent = `Original Price: ${product.originalPrice}`;

        const currentPrice = document.createElement('p');
        currentPrice.className = 'product-price';
        currentPrice.textContent = `Current Price: ${product.currentPrice}`;

        const availability = document.createElement('p');
        availability.textContent = product.inStoreAvailability ? 'Available in store' : 'Not available in store';

        info.appendChild(title);
        info.appendChild(originalPrice);
        info.appendChild(currentPrice);
        info.appendChild(availability);

        card.appendChild(imageContainer);
        card.appendChild(info);

        container.appendChild(card);
    });
}

// Helper function to format dates
function formatDate(date) {
    const options = { month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit' };
    return date.toLocaleString('en-US', options);
}
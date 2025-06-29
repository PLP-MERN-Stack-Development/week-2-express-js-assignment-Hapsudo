// server.js - Full Product API with Express.js

// ==== Import Required Modules ====
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // For generating unique product IDs

// ==== Initialize App ====
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;


// ==== Custom Error Classes ====
// Handles 404 errors
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

// Handles validation errors
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// ==== Middleware ====

// Custom logger middleware - logs request method, URL, and time
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware to parse incoming JSON
app.use(bodyParser.json());

// Simple authentication middleware using API key
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== 'mysecurekey') {
    return next(new ValidationError('Forbidden. Invalid API Key.'));
  }
  next();
});

// ==== In-Memory Product Data ====
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// ==== Root Route ====
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Visit /api/products');
});

// ==== RESTful API Routes ====

// GET all products (with filtering, search, pagination)
app.get('/api/products', (req, res) => {
  let { category, search, page = 1, limit = 5 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  let filtered = [...products];

  // Filter by category if provided
  if (category) {
    filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // Search by name if provided
  if (search) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = filtered.slice(startIndex, endIndex);

  res.json({
    page,
    total: filtered.length,
    results: paginated
  });
});

// GET a single product by ID
app.get('/api/products/:id', (req, res, next) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return next(new NotFoundError('Product not found'));
  res.json(product);
});

console.log("POST /api/products route is registered");
// POST - Create a new product
app.post('/api/products', (req, res, next) => {
  const { name, description, price, category, inStock } = req.body;

  // Basic validation
  if (!name || !price || !category) {
    return next(new ValidationError('Name, price, and category are required'));
  }

  const newProduct = {
    id: uuidv4(),
    name,
    description,
    price,
    category,
    inStock: inStock ?? true
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT - Update an existing product
app.put('/api/products/:id', (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));

  // Update product with new data
  products[index] = { ...products[index], ...req.body };
  res.json(products[index]);
});

// DELETE - Remove a product
app.delete('/api/products/:id', (req, res, next) => {
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return next(new NotFoundError('Product not found'));

  const deleted = products.splice(index, 1);
  res.json({ message: 'Product deleted', product: deleted[0] });
});

// GET statistics - count of products per category
app.get('/api/products/stats', (req, res) => {
  const stats = {};
  products.forEach(p => {
    const cat = p.category;
    stats[cat] = (stats[cat] || 0) + 1;
  });
  res.json(stats);
});

// ==== Error Handling ====

// 404 Handler for unknown routes
app.use((req, res, next) => {
  next(new NotFoundError('Route not found'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.name}: ${err.message}`);
  res.status(err.statusCode || 500).json({
    error: err.name,
    message: err.message
  });
});

// ==== Start the Server ====
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // For testing or extending

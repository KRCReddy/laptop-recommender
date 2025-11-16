const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

// Helpers
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ----------------------------
// PUBLIC API
// ----------------------------

app.get('/api/products', (req, res) => {
  const q = req.query;
  let products = readJSON(PRODUCTS_FILE);

  if (q.purpose) {
    const wanted = Array.isArray(q.purpose) ? q.purpose : [q.purpose];
    products = products.filter(p => p.purpose && p.purpose.some(tag => wanted.includes(tag)));
  }
  if (q.ram) {
    products = products.filter(p => (p.ram_gb || 0) >= Number(q.ram));
  }
  if (q.storageType) {
    products = products.filter(p => (p.storage_type || '').toLowerCase() === q.storageType.toLowerCase());
  }
  if (q.minPrice) products = products.filter(p => p.price >= Number(q.minPrice));
  if (q.maxPrice) products = products.filter(p => p.price <= Number(q.maxPrice));
  if (q.q) {
    const t = q.q.toLowerCase();
    products = products.filter(p => (p.model + p.brand + (p.description || '')).toLowerCase().includes(t));
  }

  res.json({ count: products.length, results: products });
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

app.post('/api/inquiries', (req, res) => {
  const inquiries = readJSON(INQUIRIES_FILE);
  const entry = { ...req.body, created_at: new Date().toISOString() };
  inquiries.unshift(entry);
  writeJSON(INQUIRIES_FILE, inquiries);
  res.json({ ok: true });
});

// ----------------------------
// ADMIN API
// ----------------------------

const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

function isAdmin(pass) {
  return pass === ADMIN_PASS;
}

app.get('/api/admin/inquiries', (req, res) => {
  if (!isAdmin(req.query.pass)) return res.status(401).json({ error: "Unauthorized" });
  res.json(readJSON(INQUIRIES_FILE));
});

app.post('/api/admin/products', (req, res) => {
  if (!isAdmin(req.query.pass)) return res.status(401).json({ error: "Unauthorized" });
  const products = readJSON(PRODUCTS_FILE);
  const newProduct = { ...req.body };
  products.unshift(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ ok: true });
});

app.put('/api/admin/products/:id', (req, res) => {
  if (!isAdmin(req.query.pass)) return res.status(401).json({ error: "Unauthorized" });
  const products = readJSON(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Not found" });
  products[index] = { ...products[index], ...req.body };
  writeJSON(PRODUCTS_FILE, products);
  res.json({ ok: true });
});

app.delete('/api/admin/products/:id', (req, res) => {
  if (!isAdmin(req.query.pass)) return res.status(401).json({ error: "Unauthorized" });
  const products = readJSON(PRODUCTS_FILE).filter(p => p.id !== req.params.id);
  writeJSON(PRODUCTS_FILE, products);
  res.json({ ok: true });
});

// ----------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));

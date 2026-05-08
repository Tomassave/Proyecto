const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const productsRoutes = require('./routes/products.routes');
const cartRoutes = require('./routes/cart.routes');
const ordersRoutes = require('./routes/orders.routes');
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'sabana-market', tickets: 'TKT-01–TKT-12' });
});

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/products', productsRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', ordersRoutes);

app.use(express.static(path.join(__dirname, '..')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use((_req, res) => {
  res.status(404).json({ error: 'No encontrado' });
});

const pool = require('./config/db');
const { mapPgError, unwrapDriverError } = require('./utils/pgErrors');

const CREATE_TABLES = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, name TEXT NOT NULL, career TEXT, photo_url TEXT, role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')), status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','suspendido')), reputation NUMERIC(3,2), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS token_blacklist (token TEXT PRIMARY KEY, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT NOT NULL, price NUMERIC(12,2) NOT NULL CHECK (price > 0), category TEXT NOT NULL, state TEXT NOT NULL CHECK (state IN ('nuevo','usado')), image_urls TEXT[] DEFAULT '{}', seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS carts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS cart_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE, quantity INT NOT NULL CHECK (quantity > 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(cart_id, product_id));
CREATE TABLE IF NOT EXISTS orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','confirmada','entregada')), total NUMERIC(12,2) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS order_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL, seller_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL, price NUMERIC(12,2) NOT NULL, quantity INT NOT NULL CHECK (quantity > 0), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
`;

app.listen(PORT, async () => {
  console.log(`Sabana Market API http://localhost:${PORT}`);
  try {
    await pool.query(CREATE_TABLES);
    console.log('Tablas inicializadas OK');
  } catch (err) {
    console.error('Error al inicializar tablas:', err.message);
  }
  pool
    .query('SELECT 1')
    .then(() => console.log('Base de datos: conexión OK'))
    .catch((err) => {
      const m = mapPgError(err);
      const e = unwrapDriverError(err);
      console.error('Base de datos:', m ? m.message : e.message || err.message);
    });
});
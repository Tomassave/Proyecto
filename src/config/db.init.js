/**
 * npm run db:init
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./db');

const CREATE_TABLES = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  career      TEXT,
  photo_url   TEXT,
  role        TEXT        NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer','seller','admin')),
  status      TEXT        NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','suspendido')),
  reputation  NUMERIC(3,2),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_blacklist (
  token       TEXT        PRIMARY KEY,
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  price       NUMERIC(12,2) NOT NULL CHECK (price > 0),
  category    TEXT        NOT NULL,
  state       TEXT        NOT NULL CHECK (state IN ('nuevo','usado')),
  image_urls  TEXT[]      DEFAULT '{}',
  seller_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active   ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price    ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_seller   ON products(seller_id);

CREATE TABLE IF NOT EXISTS carts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id     UUID        NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT         NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT        NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','confirmada','entregada')),
  total       NUMERIC(12,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  seller_id   UUID        NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  price       NUMERIC(12,2) NOT NULL,
  quantity    INT         NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user       ON carts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart  ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user      ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function init() {
  let client;
  const connectAttempts = 15;
  for (let a = 1; a <= connectAttempts; a++) {
    try {
      client = await pool.connect();
      break;
    } catch (err) {
      console.log(`Conexión ${a}/${connectAttempts}: ${err.message}`);
      if (a === connectAttempts) {
        console.error('No se pudo conectar a PostgreSQL. ¿Está el contenedor arriba? (docker compose ps)');
        process.exit(1);
      }
      await sleep(1000 * a);
    }
  }

  try {
    console.log('Creando tablas…');
    await client.query(CREATE_TABLES);
    console.log('Tablas listas.');
    console.log('\nEjecuta: npm run dev\n');
  } catch (err) {
    console.error('Error al inicializar:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

init();

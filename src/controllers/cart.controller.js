const pool = require('../config/db');

/**
 * Snapshot del carrito del usuario (misma forma en POST/PUT/DELETE/GET).
 * @param {string} userId
 * @param {import('pg').Pool|import('pg').PoolClient} db
 */
async function getCartPayload(userId, db = pool) {
  const cartCheck = await db.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (!cartCheck.rowCount) {
    return { cartId: null, items: [], total: 0 };
  }
  const cartId = cartCheck.rows[0].id;
  const cartItems = await db.query(
    `SELECT ci.product_id, p.price, p.title, p.active AS available, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartId]
  );
  let total = 0;
  const items = cartItems.rows.map((row) => {
    const itemTotal = Number(row.price) * row.quantity;
    total += itemTotal;
    return {
      productId: row.product_id,
      title: row.title,
      price: Number(row.price),
      quantity: row.quantity,
      available: row.available === true,
    };
  });
  return { cartId, items, total };
}

/** GET /cart */
async function getCart(req, res) {
  try {
    const payload = await getCartPayload(req.user.id);
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[getCart]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/** TKT-11: POST /cart/items */
async function addToCart(req, res) {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  const qty = Number(quantity);
  if (!productId || !Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  try {
    await pool.query('BEGIN');

    const productCheck = await pool.query(
      'SELECT id, price, active FROM products WHERE id = $1',
      [productId]
    );

    if (!productCheck.rowCount || !productCheck.rows[0].active) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no disponible' });
    }

    const cartCheck = await pool.query('SELECT id FROM carts WHERE user_id = $1', [userId]);

    let cartId;
    if (cartCheck.rowCount) {
      cartId = cartCheck.rows[0].id;
    } else {
      const newCart = await pool.query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
        [userId]
      );
      cartId = newCart.rows[0].id;
    }

    const itemCheck = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, productId]
    );

    if (itemCheck.rowCount) {
      const newQuantity = itemCheck.rows[0].quantity + qty;
      await pool.query(
        'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE cart_id = $2 AND product_id = $3',
        [newQuantity, cartId, productId]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)',
        [cartId, productId, qty]
      );
    }

    await pool.query('COMMIT');

    const payload = await getCartPayload(userId);
    return res.status(200).json(payload);
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('[addToCart]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/** PUT /cart/items/:productId */
async function updateCartItem(req, res) {
  const { productId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;
  const qty = Number(quantity);

  if (!productId || !Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }

  try {
    await pool.query('BEGIN');

    const cartCheck = await pool.query('SELECT id FROM carts WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!cartCheck.rowCount) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    const cartId = cartCheck.rows[0].id;

    const upd = await pool.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW()
       WHERE cart_id = $2 AND product_id = $3
       RETURNING id`,
      [qty, cartId, productId]
    );

    if (!upd.rowCount) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Ítem no encontrado en el carrito' });
    }

    await pool.query('COMMIT');
    const payload = await getCartPayload(userId);
    return res.status(200).json(payload);
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('[updateCartItem]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/** DELETE /cart/items/:productId */
async function removeCartItem(req, res) {
  const { productId } = req.params;
  const userId = req.user.id;

  if (!productId) {
    return res.status(400).json({ error: 'Producto requerido' });
  }

  try {
    await pool.query('BEGIN');

    const cartCheck = await pool.query('SELECT id FROM carts WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!cartCheck.rowCount) {
      await pool.query('ROLLBACK');
      return res.status(200).json({ cartId: null, items: [], total: 0 });
    }
    const cartId = cartCheck.rows[0].id;

    await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);

    await pool.query('COMMIT');
    const payload = await getCartPayload(userId);
    return res.status(200).json(payload);
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('[removeCartItem]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, getCartPayload };

const pool = require('../config/db');

/**
 * TKT-12: Confirmar compra — crea orden y vacía el carrito.
 * POST /orders
 */
async function createOrder(req, res) {
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cartR = await client.query('SELECT id FROM carts WHERE user_id = $1 FOR UPDATE', [userId]);
    if (!cartR.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Carrito vacío' });
    }
    const cartId = cartR.rows[0].id;

    const lines = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.seller_id, p.active
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (!lines.rowCount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    let total = 0;
    const validated = [];
    for (const row of lines.rows) {
      if (!row.active) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Producto no disponible' });
      }
      if (String(row.seller_id) === String(userId)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No puedes comprar tu propio producto' });
      }
      const price = Number(row.price);
      const quantity = row.quantity;
      total += price * quantity;
      validated.push({
        productId: row.product_id,
        sellerId: row.seller_id,
        price,
        quantity,
      });
    }

    const orderIns = await client.query(
      `INSERT INTO orders (user_id, status, total)
       VALUES ($1, 'pendiente', $2)
       RETURNING id, status, total, created_at`,
      [userId, total]
    );
    const ord = orderIns.rows[0];

    const itemsOut = [];
    for (const v of validated) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [ord.id, v.productId, v.sellerId, v.price, v.quantity]
      );
      itemsOut.push({
        productId: v.productId,
        price: v.price,
        quantity: v.quantity,
      });
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    return res.status(201).json({
      orderId: ord.id,
      status: ord.status,
      items: itemsOut,
      total: Number(ord.total),
      createdAt: ord.created_at,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[createOrder]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
}

module.exports = { createOrder };

const pool = require('../config/db');

/** TKT-09/TKT-10: Listar productos con paginación, búsqueda y filtros */
async function listProducts(req, res) {
  const rawPage = req.query.page;
  const rawLimit = req.query.limit;
  const page = rawPage === undefined ? 1 : Number.parseInt(rawPage, 10);
  const parsedLimit = rawLimit === undefined ? 20 : Number.parseInt(rawLimit, 10);

  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    (rawPage !== undefined && !/^\d+$/.test(String(rawPage))) ||
    (rawLimit !== undefined && !/^\d+$/.test(String(rawLimit)))
  ) {
    return res.status(400).json({ error: 'Params inválidos' });
  }
  const limit = Math.min(100, parsedLimit);
  const offset = (page - 1) * limit;

  const search = req.query.search ? String(req.query.search).trim() : '';
  const category = req.query.category ? String(req.query.category).trim() : '';
  const state = req.query.state ? String(req.query.state).trim() : '';
  const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : null;

  if (state && !['nuevo', 'usado'].includes(state)) {
    return res.status(400).json({ error: 'Params inválidos' });
  }
  if ((minPrice !== null && !Number.isFinite(minPrice)) || (maxPrice !== null && !Number.isFinite(maxPrice))) {
    return res.status(400).json({ error: 'Params inválidos' });
  }
  if (minPrice !== null && minPrice < 0) {
    return res.status(400).json({ error: 'Params inválidos' });
  }
  if (maxPrice !== null && maxPrice < 0) {
    return res.status(400).json({ error: 'Params inválidos' });
  }
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return res.status(400).json({ error: 'Params inválidos' });
  }

  try {
    let countQuery = 'SELECT COUNT(*)::int AS n FROM products p WHERE p.active = TRUE';
    let dataQuery = `SELECT p.id, p.title, p.description, p.price, p.category, p.state, p.image_urls,
                            p.seller_id, p.created_at, p.updated_at,
                            u.name AS seller_name
                     FROM products p
                     JOIN users u ON u.id = p.seller_id
                     WHERE p.active = TRUE`;

    const params = [];
    let paramCount = 1;

    // Filtro de búsqueda textual (title + description)
    if (search) {
      const searchFilter = `(p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      countQuery += ` AND ${searchFilter}`;
      dataQuery += ` AND ${searchFilter}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filtro de categoría
    if (category) {
      countQuery += ` AND p.category = $${paramCount}`;
      dataQuery += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    // Filtro de estado (nuevo/usado)
    if (state) {
      countQuery += ` AND p.state = $${paramCount}`;
      dataQuery += ` AND p.state = $${paramCount}`;
      params.push(state);
      paramCount++;
    }

    // Filtro de rango de precios
    if (minPrice !== null && Number.isFinite(minPrice)) {
      countQuery += ` AND p.price >= $${paramCount}`;
      dataQuery += ` AND p.price >= $${paramCount}`;
      params.push(minPrice);
      paramCount++;
    }

    if (maxPrice !== null && Number.isFinite(maxPrice)) {
      countQuery += ` AND p.price <= $${paramCount}`;
      dataQuery += ` AND p.price <= $${paramCount}`;
      params.push(maxPrice);
      paramCount++;
    }

    // Contar total
    const countResult = await pool.query(countQuery, params.slice(0, paramCount - 1));
    const total = countResult.rows[0].n;

    // Obtener datos con paginación
    dataQuery += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const paramsWithLimit = [...params, limit, offset];

    const rows = await pool.query(dataQuery, paramsWithLimit);

    return res.status(200).json({
      total,
      page,
      limit,
      products: rows.rows,
    });
  } catch (err) {
    console.error('[listProducts]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function createProduct(req, res) {
  const { title, description, price, category, state, imageUrls } = req.body;
  const sellerId = req.user.id;

  const p = Number(price);
  if (!title || !description || !category || !state || !Number.isFinite(p) || p <= 0) {
    return res.status(400).json({ error: 'Campos requeridos' });
  }

  if (!['nuevo', 'usado'].includes(state)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  let imgs = [];
  if (Array.isArray(imageUrls)) imgs = imageUrls.map(String).filter(Boolean);
  else if (typeof imageUrls === 'string' && imageUrls.trim()) imgs = [imageUrls.trim()];

  try {
    const result = await pool.query(
      `INSERT INTO products (title, description, price, category, state, image_urls, seller_id)
       VALUES ($1, $2, $3, $4, $5, $6::text[], $7)
       RETURNING id, title, seller_id, created_at`,
      [String(title).trim(), String(description).trim(), p, String(category).trim(), state, imgs, sellerId]
    );

    const row = result.rows[0];
    return res.status(201).json({
      product: {
        id: row.id,
        title: row.title,
        sellerId: row.seller_id,
        createdAt: row.created_at,
      },
    });
  } catch (err) {
    console.error('[createProduct]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const body = req.body || {};

  try {
    const cur = await pool.query(
      `SELECT seller_id FROM products WHERE id = $1 AND active = TRUE`,
      [id]
    );
    if (!cur.rowCount) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (cur.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const sets = [];
    const vals = [];
    let i = 1;

    if (body.title !== undefined) {
      sets.push(`title = $${i++}`);
      vals.push(String(body.title).trim());
    }
    if (body.description !== undefined) {
      sets.push(`description = $${i++}`);
      vals.push(String(body.description).trim());
    }
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (!Number.isFinite(p) || p <= 0) {
        return res.status(400).json({ error: 'Precio inválido' });
      }
      sets.push(`price = $${i++}`);
      vals.push(p);
    }
    if (body.category !== undefined) {
      sets.push(`category = $${i++}`);
      vals.push(String(body.category).trim());
    }
    if (body.state !== undefined) {
      if (!['nuevo', 'usado'].includes(body.state)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      sets.push(`state = $${i++}`);
      vals.push(body.state);
    }
    if (body.imageUrls !== undefined) {
      let imgs = [];
      if (Array.isArray(body.imageUrls)) imgs = body.imageUrls.map(String).filter(Boolean);
      else if (typeof body.imageUrls === 'string' && body.imageUrls.trim()) imgs = [body.imageUrls.trim()];
      sets.push(`image_urls = $${i++}`);
      vals.push(imgs);
    }

    if (!sets.length) {
      return res.status(400).json({ error: 'Sin datos para actualizar' });
    }

    sets.push(`updated_at = NOW()`);
    vals.push(id);

    const q = `UPDATE products SET ${sets.join(', ')} WHERE id = $${i}
               RETURNING id, title, description, price, category, state, image_urls, seller_id, updated_at`;
    const result = await pool.query(q, vals);
    const row = result.rows[0];

    return res.status(200).json({
      product: {
        id: row.id,
        title: row.title,
        description: row.description,
        price: Number(row.price),
        category: row.category,
        state: row.state,
        imageUrls: row.image_urls,
        sellerId: row.seller_id,
        updatedAt: row.updated_at,
      },
    });
  } catch (err) {
    console.error('[updateProduct]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/** TKT-08: Eliminar producto propio (soft-delete) */
async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    const cur = await pool.query(
      `SELECT seller_id FROM products WHERE id = $1 AND active = TRUE`,
      [id]
    );
    if (!cur.rowCount) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (cur.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    // Soft-delete: marcar como inactivo
    await pool.query(
      `UPDATE products SET active = FALSE, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    return res.status(200).json({
      message: 'Producto retirado',
      productId: id,
    });
  } catch (err) {
    console.error('[deleteProduct]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct };

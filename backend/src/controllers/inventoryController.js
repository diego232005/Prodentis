import { query } from '../config/database.js'
import { mappers } from '../utils/mappers.js'
import { createId } from '../utils/id.js'

export async function listInventory(_req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM inventory_items ORDER BY name ASC')
    res.json(rows.map(mappers.inventory))
  } catch (e) {
    next(e)
  }
}

export async function getInventoryItem(req, res, next) {
  try {
    const { rows } = await query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id])
    if (!rows[0]) {
      const err = new Error('Insumo no encontrado')
      err.status = 404
      throw err
    }
    res.json(mappers.inventory(rows[0]))
  } catch (e) {
    next(e)
  }
}

export async function createInventoryItem(req, res, next) {
  try {
    const id = createId('i')
    const b = req.body
    const { rows } = await query(
      `INSERT INTO inventory_items (id, sku, name, category, unit, stock, min_stock, unit_cost, supplier, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [id, b.sku, b.name, b.category, b.unit, b.stock, b.minStock, b.unitCost, b.supplier ?? ''],
    )
    res.status(201).json(mappers.inventory(rows[0]))
  } catch (e) {
    if (e.code === '23505') {
      e.status = 409
      e.message = 'SKU duplicado'
    }
    next(e)
  }
}

export async function updateInventoryItem(req, res, next) {
  try {
    const cur = await query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id])
    if (!cur.rows[0]) {
      const err = new Error('Insumo no encontrado')
      err.status = 404
      throw err
    }
    const b = req.body
    const r = cur.rows[0]
    const { rows } = await query(
      `UPDATE inventory_items SET
        sku = $2, name = $3, category = $4, unit = $5, stock = $6,
        min_stock = $7, unit_cost = $8, supplier = $9, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        req.params.id,
        b.sku ?? r.sku,
        b.name ?? r.name,
        b.category ?? r.category,
        b.unit ?? r.unit,
        b.stock ?? r.stock,
        b.minStock ?? r.min_stock,
        b.unitCost ?? r.unit_cost,
        b.supplier ?? r.supplier,
      ],
    )
    res.json(mappers.inventory(rows[0]))
  } catch (e) {
    if (e.code === '23505') {
      e.status = 409
      e.message = 'SKU duplicado'
    }
    next(e)
  }
}

export async function deleteInventoryItem(req, res, next) {
  try {
    const { rowCount } = await query('DELETE FROM inventory_items WHERE id = $1', [req.params.id])
    if (!rowCount) {
      const err = new Error('Insumo no encontrado')
      err.status = 404
      throw err
    }
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}

export async function listMovements(req, res, next) {
  try {
    const itemId = req.query.itemId
    const { rows } = itemId
      ? await query('SELECT * FROM stock_movements WHERE item_id = $1 ORDER BY created_at DESC', [itemId])
      : await query('SELECT * FROM stock_movements ORDER BY created_at DESC')
    res.json(rows.map(mappers.movement))
  } catch (e) {
    next(e)
  }
}

export async function recordMovement(req, res, next) {
  const client = await (await import('../config/database.js')).pool.connect()
  try {
    const b = req.body
    const itemId = req.params.id
    await client.query('BEGIN')
    const itemRes = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [itemId])
    if (!itemRes.rows[0]) {
      const err = new Error('Insumo no encontrado')
      err.status = 404
      throw err
    }
    const delta = b.type === 'in' ? b.quantity : -b.quantity
    const newStock = itemRes.rows[0].stock + delta
    if (newStock < 0) {
      const err = new Error('Stock insuficiente')
      err.status = 400
      throw err
    }
    const movId = createId('m')
    const { rows } = await client.query(
      `INSERT INTO stock_movements (id, item_id, type, quantity, reason, related_treatment_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
      [movId, itemId, b.type, b.quantity, b.reason, b.relatedTreatmentId ?? null],
    )
    await client.query('UPDATE inventory_items SET stock = $2, updated_at = NOW() WHERE id = $1', [itemId, newStock])
    await client.query('COMMIT')
    res.status(201).json(mappers.movement(rows[0]))
  } catch (e) {
    await client.query('ROLLBACK')
    next(e)
  } finally {
    client.release()
  }
}

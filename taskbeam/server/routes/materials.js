const express = require('express')
const router = express.Router()
const pool = require('../db/pool')

// Get all materials for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM materials WHERE project_id = $1 ORDER BY created_at ASC',
      [req.params.projectId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch materials' })
  }
})

// Create material
router.post('/', async (req, res) => {
  const { project_id, room_id, name, application, unit_cost, custom_qty, notes } = req.body
  if (!project_id || !name) {
    return res.status(400).json({ error: 'project_id and name are required' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO materials (project_id, room_id, name, application, unit_cost, custom_qty, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [project_id, room_id, name, application, unit_cost || 0, custom_qty, notes]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create material' })
  }
})

// Update material
router.put('/:id', async (req, res) => {
  const { room_id, name, application, unit_cost, custom_qty, notes } = req.body
  try {
    const result = await pool.query(
      `UPDATE materials SET room_id = $1, name = $2, application = $3,
       unit_cost = $4, custom_qty = $5, notes = $6 WHERE id = $7 RETURNING *`,
      [room_id, name, application, unit_cost, custom_qty, notes, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update material' })
  }
})

// Delete material
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM materials WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete material' })
  }
})

module.exports = router
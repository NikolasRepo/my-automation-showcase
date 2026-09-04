const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireContractor } = require('../middleware/auth')

// Get all rooms for a project
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE project_id = $1 ORDER BY created_at ASC',
      [req.params.projectId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch rooms' })
  }
})

// Create room
router.post('/', requireAuth, requireContractor, async (req, res) => {
  const { project_id, name, length, width, height, status } = req.body
  if (!project_id || !name) {
    return res.status(400).json({ error: 'project_id and name are required' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO rooms (project_id, name, length, width, height, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [project_id, name, length, width, height, status || 'planned']
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create room' })
  }
})

// Update room
router.put('/:id', requireAuth, requireContractor, async (req, res) => {
  const { name, length, width, height, status, x, y } = req.body
  try {
    const result = await pool.query(
      `UPDATE rooms SET name = $1, length = $2, width = $3, height = $4, status = $5, x = $6, y = $7
       WHERE id = $8 RETURNING *`,
      [name, length, width, height, status, x || 0, y || 0, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update room' })
  }
})

// Update room position only
router.patch('/:id/position', requireAuth, requireContractor, async (req, res) => {
  const { x, y } = req.body
  try {
    const result = await pool.query(
      'UPDATE rooms SET x = $1, y = $2 WHERE id = $3 RETURNING *',
      [x || 0, y || 0, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update room position' })
  }
})

// Delete room
router.delete('/:id', requireAuth, requireContractor, async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete room' })
  }
})

module.exports = router
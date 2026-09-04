const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireContractor } = require('../middleware/auth')

// Get all labor costs for a project
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM labor_costs WHERE project_id = $1',
      [req.params.projectId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch labor costs' })
  }
})

// Upsert labor cost for a room
router.post('/', requireAuth, requireContractor, async (req, res) => {
  const { project_id, room_id, amount } = req.body
  if (!project_id || !room_id) {
    return res.status(400).json({ error: 'project_id and room_id are required' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO labor_costs (project_id, room_id, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, room_id)
       DO UPDATE SET amount = $3, updated_at = NOW()
       RETURNING *`,
      [project_id, room_id, amount || 0]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to save labor cost' })
  }
})

module.exports = router
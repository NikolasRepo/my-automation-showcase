const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireContractor } = require('../middleware/auth')

// Get all projects - only return projects owned by the logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get summary stats - only for projects owned by the logged-in user
router.get('/summary/all', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        COUNT(DISTINCT r.id) as room_count,
        COALESCE(SUM(r.length * r.width), 0) as total_area,
        COUNT(DISTINCT m.id) as material_count,
        COUNT(DISTINCT t.id) as task_count,
        COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) as tasks_done,
        COALESCE(SUM(
          CASE 
            WHEN m.application = 'floor' THEN r.length * r.width * 1.10 * m.unit_cost
            WHEN m.application = 'wall' THEN 2 * (r.length + r.width) * r.height * 1.12 * m.unit_cost
            WHEN m.application = 'ceiling' THEN r.length * r.width * 1.08 * m.unit_cost
            WHEN m.application = 'baseboard' THEN 2 * (r.length + r.width) * 1.10 * m.unit_cost
            WHEN m.application = 'custom' THEN m.custom_qty * m.unit_cost
            ELSE 0
          END
        ), 0) as material_cost
      FROM projects p
      LEFT JOIN rooms r ON r.project_id = p.id
      LEFT JOIN materials m ON m.project_id = p.id AND m.room_id = r.id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.owner_id = $1
      GROUP BY p.id
    `, [req.user.id])
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch project summaries' })
  }
})

// Get single project - only if owned by logged-in user
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

// Create project - set owner_id to logged-in user
router.post('/', requireAuth, requireContractor, async (req, res) => {
  const { name, client_name, budget, unit_system } = req.body
  if (!name) return res.status(400).json({ error: 'Project name is required' })
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, client_name, budget, unit_system, owner_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, client_name || null, budget || null, unit_system || 'imperial', req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// Update project - only if owned by logged-in user
router.put('/:id', requireAuth, requireContractor, async (req, res) => {
  const { name, client_name, budget, unit_system } = req.body
  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, client_name = $2, budget = $3, unit_system = $4 WHERE id = $5 AND owner_id = $6 RETURNING *',
      [name, client_name || null, budget || null, unit_system || 'imperial', req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// Delete project - only if owned by logged-in user
router.delete('/:id', requireAuth, requireContractor, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM projects WHERE id = $1 AND owner_id = $2',
      [req.params.id, req.user.id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

module.exports = router
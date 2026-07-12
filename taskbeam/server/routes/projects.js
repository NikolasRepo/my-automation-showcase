const express = require('express')
const router = express.Router()
const pool = require('../db/pool')

// Get all projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1',
      [req.params.id]
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

// Create project
router.post('/', async (req, res) => {
  const { name, client_name } = req.body
  if (!name) return res.status(400).json({ error: 'Project name is required' })
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, client_name) VALUES ($1, $2) RETURNING *',
      [name, client_name || null]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// Update project
router.put('/:id', async (req, res) => {
  const { name, client_name } = req.body
  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, client_name = $2 WHERE id = $3 RETURNING *',
      [name, client_name || null, req.params.id]
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

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

module.exports = router
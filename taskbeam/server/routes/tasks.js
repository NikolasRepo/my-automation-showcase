const express = require('express')
const router = express.Router()
const pool = require('../db/pool')

// Get all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at ASC',
      [req.params.projectId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Create task
router.post('/', async (req, res) => {
  const { project_id, room_id, title, priority, status, due_date, notes, client_visible } = req.body
  if (!project_id || !title) {
    return res.status(400).json({ error: 'project_id and title are required' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO tasks (project_id, room_id, title, priority, status, due_date, notes, client_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [project_id, room_id || null, title, priority || 'medium', status || 'todo', due_date || null, notes || null, client_visible || false]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Create task error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Update task
router.put('/:id', async (req, res) => {
  const { room_id, title, priority, status, due_date, notes, client_visible } = req.body
  try {
    const result = await pool.query(
      `UPDATE tasks SET room_id = $1, title = $2, priority = $3, status = $4,
       due_date = $5, notes = $6, client_visible = $7 WHERE id = $8 RETURNING *`,
      [room_id || null, title, priority, status, due_date || null, notes || null, client_visible, req.params.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Update task error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

module.exports = router
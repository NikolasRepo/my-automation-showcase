const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { requireAuth, requireContractor } = require('../middleware/auth')
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
require('dotenv').config()

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.S3_BUCKET

// Get all files for a project
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE project_id = $1 ORDER BY created_at DESC',
      [req.params.projectId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch files' })
  }
})

// Get presigned upload URL
router.post('/upload-url', requireAuth, requireContractor, async (req, res) => {
  const { project_id, name, mime_type, size } = req.body
  if (!project_id || !name || !mime_type) {
    return res.status(400).json({ error: 'project_id, name and mime_type are required' })
  }
  try {
    const s3_key = `projects/${project_id}/${Date.now()}-${name}`
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3_key,
      ContentType: mime_type,
    })
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })

    // Save file record to database
    const result = await pool.query(
      `INSERT INTO files (project_id, owner_id, name, s3_key, size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [project_id, req.user.id, name, s3_key, size || 0, mime_type]
    )

    res.json({ uploadUrl, file: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate upload URL' })
  }
})

// Get presigned download URL
router.get('/download-url/:fileId', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1',
      [req.params.fileId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }
    const file = result.rows[0]
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: file.s3_key,
    })
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    res.json({ downloadUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to generate download URL' })
  }
})

// Toggle client visibility
router.put('/:fileId/visibility', requireAuth, requireContractor, async (req, res) => {
  const { client_visible } = req.body
  try {
    const result = await pool.query(
      'UPDATE files SET client_visible = $1 WHERE id = $2 RETURNING *',
      [client_visible, req.params.fileId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update file visibility' })
  }
})

// Delete file
router.delete('/:fileId', requireAuth, requireContractor, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1',
      [req.params.fileId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }
    const file = result.rows[0]
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: file.s3_key,
    })
    await s3.send(command)
    await pool.query('DELETE FROM files WHERE id = $1', [req.params.fileId])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

module.exports = router
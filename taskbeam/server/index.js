const express = require('express')
const cors = require('cors')
require('dotenv').config()

const projectsRouter = require('./routes/projects')
const roomsRouter = require('./routes/rooms')
const materialsRouter = require('./routes/materials')
const tasksRouter = require('./routes/tasks')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskBeam API is running' })
})

app.use('/projects', projectsRouter)
app.use('/rooms', roomsRouter)
app.use('/materials', materialsRouter)
app.use('/tasks', tasksRouter)

app.listen(PORT, () => {
  console.log(`TaskBeam API running on port ${PORT}`)
})
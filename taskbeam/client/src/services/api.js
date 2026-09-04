import { getToken } from './auth'

const BASE_URL = '/api'

async function request(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Projects
  getProjects: () => request('GET', '/projects'),
  getProjectSummaries: () => request('GET', '/projects/summary/all'),
  createProject: (data) => request('POST', '/projects', data),
  updateProject: (id, data) => request('PUT', `/projects/${id}`, data),
  deleteProject: (id) => request('DELETE', `/projects/${id}`),

  // Rooms
  getRooms: (projectId) => request('GET', `/rooms/project/${projectId}`),
  createRoom: (data) => request('POST', '/rooms', data),
  updateRoom: (id, data) => request('PUT', `/rooms/${id}`, data),
  updateRoomPosition: (id, x, y) => request('PATCH', `/rooms/${id}/position`, { x, y }),
  deleteRoom: (id) => request('DELETE', `/rooms/${id}`),

  // Materials
  getMaterials: (projectId) => request('GET', `/materials/project/${projectId}`),
  createMaterial: (data) => request('POST', '/materials', data),
  updateMaterial: (id, data) => request('PUT', `/materials/${id}`, data),
  deleteMaterial: (id) => request('DELETE', `/materials/${id}`),

  // Tasks
  getTasks: (projectId) => request('GET', `/tasks/project/${projectId}`),
  createTask: (data) => request('POST', '/tasks', data),
  updateTask: (id, data) => request('PUT', `/tasks/${id}`, data),
  deleteTask: (id) => request('DELETE', `/tasks/${id}`),

  // Labor costs
  getLaborCosts: (projectId) => request('GET', `/labor/project/${projectId}`),
  saveLaborCost: (data) => request('POST', '/labor', data),

  // Files
  getFiles: (projectId) => request('GET', `/files/project/${projectId}`),
  getUploadUrl: (data) => request('POST', '/files/upload-url', data),
  getDownloadUrl: (fileId) => request('GET', `/files/download-url/${fileId}`),
  toggleFileVisibility: (fileId, client_visible) => request('PUT', `/files/${fileId}/visibility`, { client_visible }),
  deleteFile: (fileId) => request('DELETE', `/files/${fileId}`),
}
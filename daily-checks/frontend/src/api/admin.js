// frontend/src/api/admin.js
import api from './client'

// Production lines
export const createLine = (payload) => api.post('/admin/lines', payload)
export const updateLine = (id, payload) => api.patch(`/admin/lines/${id}`, payload)
export const deactivateLine = (id) => api.patch(`/admin/lines/${id}/deactivate`)
export const deleteLine = (id) => api.delete(`/admin/lines/${id}`)

// Stations
export const createStation = (payload) => api.post('/admin/stations', payload)
export const updateStation = (id, payload) => api.patch(`/admin/stations/${id}`, payload)
export const deactivateStation = (id) => api.patch(`/admin/stations/${id}/deactivate`)
export const deleteStation = (id) => api.delete(`/admin/stations/${id}`)

// Checklist items
export const createChecklistItem = (payload) => api.post('/admin/checklist-items', payload)
export const updateChecklistItem = (id, payload) => api.patch(`/admin/checklist-items/${id}`, payload)
export const deactivateChecklistItem = (id) => api.patch(`/admin/checklist-items/${id}/deactivate`)
export const deleteChecklistItem = (id) => api.delete(`/admin/checklist-items/${id}`)

// Users
export const listUsers = () => api.get('/auth/users')
export const createUser = (payload) => api.post('/auth/users', payload)
export const updateUser = (id, payload) => api.patch(`/auth/users/${id}`, payload)
export const resetPassword = (id, password) => api.patch(`/auth/users/${id}/password`, { password })
export const deactivateUser = (id) => api.patch(`/auth/users/${id}/deactivate`)
export const deleteUser = (id) => api.delete(`/auth/users/${id}`)
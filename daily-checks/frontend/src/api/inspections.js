// frontend/src/api/inspections.js
import api from './client'

export const getLines = () => api.get('/inspections/lines')
export const getChecklist = () => api.get('/inspections/checklist')
export const submitInspection = (payload) => api.post('/inspections', payload)
export const listInspections = () => api.get('/inspections')
export const getInspection = (id) => api.get(`/inspections/${id}`)
export const reviewInspection = (id, payload) => api.patch(`/inspections/${id}/review`, payload)

// Auth API helpers used by the login page
export const getOperators = () => api.get('/auth/users/operators')
export const listUsers = () => api.get('/auth/users')
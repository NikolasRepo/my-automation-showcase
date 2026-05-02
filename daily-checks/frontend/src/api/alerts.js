// frontend/src/api/alerts.js
import api from './client'

export const listAlerts = (unacknowledgedOnly = false) =>
  api.get('/alerts', { params: { unacknowledged_only: unacknowledgedOnly } })

export const acknowledgeAlert = (id) => api.patch(`/alerts/${id}/acknowledge`)
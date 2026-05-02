// frontend/src/api/reports.js
import api from './client'

export const exportReport = (dateFrom, dateTo) =>
  api.get('/reports/export', {
    params: { date_from: dateFrom, date_to: dateTo },
    responseType: 'blob',
  })
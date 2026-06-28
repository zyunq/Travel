import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000
})

export const groupApi = {
  getList: () => api.get('/groups'),
  getGroupNames: () => api.get('/groups/group-names'),
  getByName: (groupName) => api.get(`/groups/by-name/${encodeURIComponent(groupName)}`),
  getDetail: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  copyInfo: (id) => api.get(`/groups/${id}/copy`),
  merge: (data) => api.post('/groups/merge', data),
  deleteCategory: (category) => api.delete(`/groups/category/${encodeURIComponent(category)}`),
  exportSeats: (id) => api.get(`/groups/${id}/seats`, { responseType: 'blob' }),
  importWithMembers: (formData) => api.post('/groups/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const memberApi = {
  getList: (groupId) => api.get(`/groups/${groupId}/members`),
  create: (groupId, data) => api.post(`/groups/${groupId}/members`, data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
  refund: (id) => api.put(`/members/${id}/refund`),
  import: (groupId, formData) => api.post(`/groups/${groupId}/members/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/members/template', { responseType: 'arraybuffer' })
}

export const configApi = {
  get: () => api.get('/config'),
  update: (data) => api.put('/config', data)
}

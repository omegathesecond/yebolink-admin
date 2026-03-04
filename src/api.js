const BASE = 'https://api.yebolink.com/api/dashboard'

function getKey() {
  return localStorage.getItem('ybk_admin_key') || ''
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': getKey(),
      ...(options.headers || {}),
    },
  })
  if (res.status === 401) {
    localStorage.removeItem('ybk_admin_key')
    window.location.href = '/'
    throw new Error('Unauthorized')
  }
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'API error')
  return data.data
}

export const api = {
  stats: () => request('/stats'),
  workspaces: () => request('/workspaces'),
  workspace: (id) => request(`/workspaces/${id}`),
  addCredits: (id, amount, description) =>
    request(`/workspaces/${id}/credits`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),
  activate: (id) => request(`/workspaces/${id}/activate`, { method: 'POST' }),
  deactivate: (id) => request(`/workspaces/${id}/deactivate`, { method: 'POST' }),
}

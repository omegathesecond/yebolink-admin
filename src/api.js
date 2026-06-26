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

function qs(params = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, v)
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const api = {
  stats: () => request('/stats'),
  // GET /workspaces returns { workspaces, total }; unwrap to the array so
  // callers (Dashboard, Workspaces) get the list they expect.
  workspaces: () => request('/workspaces').then((r) => r.workspaces),
  workspace: (id) => request(`/workspaces/${id}`),
  addCredits: (id, amount, description) =>
    request(`/workspaces/${id}/credits`, {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),
  debitCredits: (id, amount, reason, allowNegative = false) =>
    request(`/workspaces/${id}/credits/debit`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason, allowNegative }),
    }),
  activate: (id) => request(`/workspaces/${id}/activate`, { method: 'POST' }),
  deactivate: (id) => request(`/workspaces/${id}/deactivate`, { method: 'POST' }),

  // Platform-wide message log search
  messages: (params) => request(`/messages${qs(params)}`),

  // Providers & senders config
  providers: () => request('/providers'),
  senders: (params) => request(`/senders${qs(params)}`),
  updateSender: (id, sms_sender_name) =>
    request(`/workspaces/${id}/sender`, {
      method: 'PATCH',
      body: JSON.stringify({ sms_sender_name }),
    }),

  // API key rotation (support)
  createApiKey: (id, name, scopes) =>
    request(`/workspaces/${id}/api-keys`, {
      method: 'POST',
      body: JSON.stringify({ name, scopes }),
    }),
  revokeApiKey: (id, keyId) =>
    request(`/workspaces/${id}/api-keys/${keyId}/revoke`, { method: 'POST' }),
}

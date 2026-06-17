import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Loader2, AlertCircle, Plus, CheckCircle, XCircle, X,
  MessageSquare, CreditCard, Key, LayoutDashboard, Globe, Mail, Phone,
  Calendar, Hash, User, Ban, Copy,
} from 'lucide-react'
import { api } from '../api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ active }) {
  return active
    ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
    : <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">Inactive</span>
}

function MsgStatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const map = {
    sent: 'bg-green-100 text-green-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-600',
    queued: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || 'bg-gray-100 text-gray-600'}`}>
      {status || '—'}
    </span>
  )
}

function ChannelBadge({ channel }) {
  const c = (channel || '').toLowerCase()
  const map = {
    sms: 'bg-blue-100 text-blue-700',
    email: 'bg-purple-100 text-purple-700',
    whatsapp: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[c] || 'bg-gray-100 text-gray-600'}`}>
      {channel || '—'}
    </span>
  )
}

function TxTypeBadge({ type }) {
  const t = (type || '').toLowerCase()
  const isCredit = t === 'credit'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isCredit ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    }`}>
      {type || '—'}
    </span>
  )
}

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString()
}

function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString()
}

// ─── Add Credits Modal ────────────────────────────────────────────────────────

function AddCreditsModal({ workspaceId, workspaceName, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) return setError('Enter a valid positive amount.')
    setLoading(true)
    setError('')
    try {
      await api.addCredits(workspaceId, num, description || undefined)
      onSuccess()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Add Credits</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-4">
            Adding credits to <span className="font-medium text-gray-800">{workspaceName}</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number" min="0.01" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="100" autoFocus
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Manual top-up"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !amount}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Adding…' : 'Add Credits'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Messages', 'Transactions', 'API Keys']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WorkspaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('Overview')
  const [showCredits, setShowCredits] = useState(false)
  const [toggling, setToggling] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.workspace(id)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Call the async loader via an IIFE — effects can't be async, and this keeps
  // the setState out of the effect's synchronous body (react-hooks/set-state-in-effect).
  useEffect(() => { (async () => { await fetchData() })() }, [fetchData])

  const toggleActive = async () => {
    if (!data?.workspace) return
    setToggling(true)
    try {
      if (data.workspace.is_active) {
        await api.deactivate(id)
      } else {
        await api.activate(id)
      }
      await fetchData()
    } catch (err) {
      alert(err.message)
    }
    setToggling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  const ws = data?.workspace || {}
  const messages = data?.messages || []
  const transactions = data?.transactions || []
  const apiKeys = data?.api_keys || []

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Workspaces
      </button>

      {/* Header Card */}
      <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{ws.name || 'Workspace'}</h1>
              <StatusBadge active={ws.is_active} />
            </div>
            <p className="text-indigo-200 text-sm">{ws.email || '—'}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <CreditCard className="w-4 h-4 text-indigo-300" />
              <span className="text-2xl font-bold">{ws.credits != null ? ws.credits.toLocaleString() : '—'}</span>
              <span className="text-indigo-300 text-sm ml-1">credits</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowCredits(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Credits
            </button>
            <button
              onClick={toggleActive}
              disabled={toggling}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
                ws.is_active
                  ? 'bg-red-500/30 hover:bg-red-500/50 text-white'
                  : 'bg-emerald-500/30 hover:bg-emerald-500/50 text-white'
              }`}
            >
              {toggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : ws.is_active ? (
                <><XCircle className="w-4 h-4" /> Deactivate</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Activate</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && <OverviewTab ws={ws} messages={messages} transactions={transactions} apiKeys={apiKeys} />}
      {tab === 'Messages' && <MessagesTab messages={messages} />}
      {tab === 'Transactions' && <TransactionsTab transactions={transactions} />}
      {tab === 'API Keys' && <ApiKeysTab apiKeys={apiKeys} workspaceId={id} onChange={fetchData} />}

      {/* Add Credits Modal */}
      {showCredits && (
        <AddCreditsModal
          workspaceId={id}
          workspaceName={ws.name}
          onClose={() => setShowCredits(false)}
          onSuccess={() => { setShowCredits(false); fetchData() }}
        />
      )}
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="p-1.5 bg-gray-100 rounded-lg flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium mt-0.5 break-all">{value || '—'}</p>
      </div>
    </div>
  )
}

function OverviewTab({ ws, messages, transactions, apiKeys }) {
  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Messages</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{messages.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Transactions</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">API Keys</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">{apiKeys.length}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Workspace Info</h3>
          <InfoRow icon={Hash} label="Workspace ID" value={ws.id} />
          <InfoRow icon={User} label="Name" value={ws.name} />
          <InfoRow icon={Mail} label="Email" value={ws.email} />
          <InfoRow icon={Globe} label="Country" value={ws.country} />
          <InfoRow icon={Phone} label="Phone" value={ws.phone} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Account Details</h3>
          <InfoRow icon={CreditCard} label="Credits Balance" value={ws.credits != null ? ws.credits.toLocaleString() : null} />
          <InfoRow icon={Calendar} label="Joined" value={fmtDate(ws.created_at)} />
          <InfoRow icon={Calendar} label="Last Updated" value={fmtDate(ws.updated_at)} />
          <InfoRow icon={LayoutDashboard} label="Plan" value={ws.plan || 'Default'} />
        </div>
      </div>
    </div>
  )
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────

function MessagesTab({ messages }) {
  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No messages yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Channel</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Recipient</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Content</th>
              <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Credits</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {messages.map((msg, i) => {
              const content = msg.text || msg.subject || msg.body || ''
              return (
                <tr key={msg.id || i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5"><ChannelBadge channel={msg.channel} /></td>
                  <td className="px-3 py-3.5 text-gray-600 font-mono text-xs max-w-[120px] truncate">
                    {msg.recipient || msg.to || '—'}
                  </td>
                  <td className="px-3 py-3.5 text-gray-600 max-w-[200px]">
                    <span className="truncate block" title={content}>
                      {content ? content.slice(0, 60) + (content.length > 60 ? '…' : '') : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center"><MsgStatusBadge status={msg.status} /></td>
                  <td className="px-3 py-3.5 text-right font-medium text-gray-700">
                    {msg.credits_used != null ? msg.credits_used : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmt(msg.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab({ transactions }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <CreditCard className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No transactions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Amount</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Description</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((tx, i) => {
              const isCredit = (tx.type || '').toLowerCase() === 'credit'
              return (
                <tr key={tx.id || i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5"><TxTypeBadge type={tx.type} /></td>
                  <td className={`px-3 py-3.5 text-right font-bold ${isCredit ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {isCredit ? '+' : '-'}{tx.amount != null ? tx.amount.toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-3.5 text-gray-600 max-w-[250px] truncate">
                    {tx.description || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmt(tx.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

function ApiKeysTab({ apiKeys, workspaceId, onChange }) {
  const [showCreate, setShowCreate] = useState(false)
  const [createdKey, setCreatedKey] = useState(null) // { key, name }
  const [revokingId, setRevokingId] = useState(null)
  const [error, setError] = useState('')

  const revoke = async (keyId) => {
    if (!window.confirm('Revoke this API key? It will stop working immediately.')) return
    setRevokingId(keyId)
    setError('')
    try {
      await api.revokeApiKey(workspaceId, keyId)
      await onChange()
    } catch (err) {
      setError(err.message)
    }
    setRevokingId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Rotate keys for locked-out customers. New keys are shown once.
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Create API Key
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      {apiKeys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Key className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No API keys</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Prefix</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Scopes</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Last Used</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Created</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apiKeys.map((k, i) => {
                  const active = k.is_active !== false
                  return (
                    <tr key={k.id || i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">{k.name || '—'}</td>
                      <td className="px-3 py-3.5">
                        <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
                          {k.key_prefix || k.prefix || '—'}
                        </code>
                      </td>
                      <td className="px-3 py-3.5 text-gray-600 text-xs">
                        {Array.isArray(k.scopes) ? k.scopes.join(', ') : (k.scopes || '—')}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {active
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Revoked</span>
                        }
                      </td>
                      <td className="px-3 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmt(k.last_used_at)}</td>
                      <td className="px-3 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmt(k.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        {active ? (
                          <button
                            onClick={() => revoke(k.id)}
                            disabled={revokingId === k.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {revokingId === k.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Revoke
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateApiKeyModal
          workspaceId={workspaceId}
          onClose={() => setShowCreate(false)}
          onCreated={async (data) => {
            setShowCreate(false)
            setCreatedKey({ key: data.key, name: data.name })
            await onChange()
          }}
        />
      )}

      {createdKey && (
        <NewKeyModal createdKey={createdKey} onClose={() => setCreatedKey(null)} />
      )}
    </div>
  )
}

// ─── Create API Key Modal ─────────────────────────────────────────────────────

const ALL_SCOPES = ['send_messages', 'read_messages']

function CreateApiKeyModal({ workspaceId, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState([...ALL_SCOPES])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleScope = (s) =>
    setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Enter a name for the key.')
    setLoading(true)
    setError('')
    try {
      const data = await api.createApiKey(workspaceId, name.trim(), scopes)
      onCreated(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Create API Key</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus
              placeholder="e.g. Production key (support reissue)"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Scopes</label>
            <div className="space-y-1.5">
              {ALL_SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <code className="text-xs">{s}</code>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || !name.trim() || scopes.length === 0}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating…' : 'Create Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── New Key (shown once) Modal ───────────────────────────────────────────────

function NewKeyModal({ createdKey, onClose }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(createdKey.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">API Key Created</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">{createdKey.name}</span> — copy this key now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <code className="text-xs font-mono text-gray-800 break-all flex-1">{createdKey.key}</code>
            <button onClick={copy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex-shrink-0">
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

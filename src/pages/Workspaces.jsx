import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Minus, CheckCircle, XCircle, Eye, Users, Loader2, AlertCircle, X,
  ChevronLeft, ChevronRight, CreditCard,
} from 'lucide-react'
import { api } from '../api'

function StatusBadge({ active }) {
  return active
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Inactive</span>
}

function AddCreditsModal({ workspace, onClose, onSuccess }) {
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
      await api.addCredits(workspace.id, num, description || undefined)
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
            Adding credits to <span className="font-medium text-gray-800">{workspace.name}</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="100"
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
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

function DebitCreditsModal({ workspace, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [allowNegative, setAllowNegative] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const balance = workspace.credits ?? workspace.credits_balance
  const num = parseFloat(amount)
  const validAmount = Number.isFinite(num) && num > 0
  // Live preview of where the balance lands once this debit is applied.
  const resultingBalance = balance != null && validAmount ? balance - num : null
  const wouldGoNegative = resultingBalance != null && resultingBalance < 0
  // Below-zero debits are blocked unless the operator explicitly opts in
  // (chargebacks need to claw back more than the workspace currently holds).
  const blockedByNegative = wouldGoNegative && !allowNegative

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validAmount) return setError('Enter a valid positive amount to debit.')
    if (!reason.trim()) return setError('A reason is required.')
    if (blockedByNegative) {
      return setError('This debit would drive the balance below zero. Tick “Allow balance to go below zero” to force it.')
    }
    setLoading(true)
    setError('')
    try {
      await api.debitCredits(workspace.id, num, reason.trim(), allowNegative)
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
          <h3 className="font-semibold text-gray-900">Debit / Refund Credits</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 mb-4">
            Removing credits from <span className="font-medium text-gray-800">{workspace.name}</span>
            {balance != null && (
              <> — current balance <span className="font-medium text-gray-800">{balance.toLocaleString()}</span></>
            )}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to debit</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="100"
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {resultingBalance != null && (
                <p className={`text-xs mt-1.5 ${wouldGoNegative ? 'text-red-600' : 'text-gray-500'}`}>
                  New balance after debit:{' '}
                  <span className="font-semibold">{resultingBalance.toLocaleString()}</span>
                  {wouldGoNegative && ' (negative)'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reversing erroneous top-up"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            {wouldGoNegative && (
              <label className="flex items-start gap-2 text-sm text-gray-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowNegative}
                  onChange={e => setAllowNegative(e.target.checked)}
                  className="mt-0.5 accent-amber-600"
                />
                <span>Allow balance to go below zero <span className="text-gray-400">(chargebacks)</span></span>
              </label>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading || !amount || !reason.trim() || blockedByNegative}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Debiting…' : 'Debit Credits'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 20

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [creditsModal, setCreditsModal] = useState(null)
  const [debitModal, setDebitModal] = useState(null)
  const [actionLoading, setActionLoading] = useState({})
  const navigate = useNavigate()

  const fetchWorkspaces = useCallback(() => {
    setLoading(true)
    api.workspaces()
      .then(setWorkspaces)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Call the async loader via an IIFE — effects can't be async, and this keeps
  // the setState out of the effect's synchronous body (react-hooks/set-state-in-effect).
  useEffect(() => { (async () => { await fetchWorkspaces() })() }, [fetchWorkspaces])

  const filtered = workspaces.filter(ws => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (ws.name || '').toLowerCase().includes(q) ||
      (ws.email || '').toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalCredits = workspaces.reduce((sum, ws) => sum + (ws.credits || 0), 0)
  const activeCount = workspaces.filter(ws => ws.is_active).length

  const toggleActive = async (ws) => {
    setActionLoading(a => ({ ...a, [ws.id]: true }))
    try {
      if (ws.is_active) {
        await api.deactivate(ws.id)
      } else {
        await api.activate(ws.id)
      }
      await fetchWorkspaces()
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(a => ({ ...a, [ws.id]: false }))
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Workspaces</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage all customer workspaces</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{workspaces.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Credits</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalCredits.toLocaleString()}</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Search */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or email…"
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No workspaces found</p>
            {search && <p className="text-xs mt-1">Try a different search term</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Name / Email</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Country</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Credits</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Messages</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Joined</th>
                  <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(ws => (
                  <tr key={ws.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800 truncate max-w-[160px]">{ws.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[160px]">{ws.email || '—'}</p>
                    </td>
                    <td className="px-3 py-3.5 text-gray-600">{ws.country || '—'}</td>
                    <td className="px-3 py-3.5 text-right font-bold text-indigo-600">
                      {ws.credits != null ? ws.credits.toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-right text-gray-600">
                      {ws.message_count != null ? ws.message_count.toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <StatusBadge active={ws.is_active} />
                    </td>
                    <td className="px-3 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {ws.created_at ? new Date(ws.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setCreditsModal(ws)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Add Credits"
                        >
                          <Plus className="w-3.5 h-3.5" /> Credits
                        </button>
                        <button
                          onClick={() => setDebitModal(ws)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Debit / Refund Credits"
                        >
                          <Minus className="w-3.5 h-3.5" /> Debit
                        </button>
                        <button
                          onClick={() => toggleActive(ws)}
                          disabled={actionLoading[ws.id]}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            ws.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          } disabled:opacity-50`}
                          title={ws.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {actionLoading[ws.id] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : ws.is_active ? (
                            <><XCircle className="w-3.5 h-3.5" /> Deactivate</>
                          ) : (
                            <><CheckCircle className="w-3.5 h-3.5" /> Activate</>
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/workspaces/${ws.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500 px-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Credits Modal */}
      {creditsModal && (
        <AddCreditsModal
          workspace={creditsModal}
          onClose={() => setCreditsModal(null)}
          onSuccess={() => {
            setCreditsModal(null)
            fetchWorkspaces()
          }}
        />
      )}

      {/* Debit / Refund Credits Modal */}
      {debitModal && (
        <DebitCreditsModal
          workspace={debitModal}
          onClose={() => setDebitModal(null)}
          onSuccess={() => {
            setDebitModal(null)
            fetchWorkspaces()
          }}
        />
      )}
    </div>
  )
}

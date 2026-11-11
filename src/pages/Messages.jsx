import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Loader2, AlertCircle, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../api'
import { contentPreview } from '../utils'

const PAGE_SIZE = 50

const CHANNELS = ['', 'sms', 'email', 'whatsapp']
const STATUSES = ['', 'queued', 'scheduled', 'sent', 'delivered', 'failed', 'cancelled']

function ChannelBadge({ channel }) {
  const c = (channel || '').toLowerCase()
  const map = {
    sms: 'bg-brand/10 text-brick',
    email: 'bg-brand/10 text-brick',
    whatsapp: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[c] || 'bg-surface text-mute'}`}>
      {channel || '—'}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const map = {
    sent: 'bg-green-100 text-green-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-600',
    queued: 'bg-yellow-100 text-yellow-700',
    scheduled: 'bg-brand/10 text-brick',
    cancelled: 'bg-gray-200 text-mute',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || 'bg-surface text-mute'}`}>
      {status || '—'}
    </span>
  )
}

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString()
}

const EMPTY_FILTERS = { recipient: '', channel: '', status: '', from: '', to: '' }

export default function Messages() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [result, setResult] = useState(null) // { messages, total, limit, offset }
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const runSearch = async (nextOffset = 0) => {
    setLoading(true)
    setError('')
    try {
      const params = {
        recipient: filters.recipient.trim() || undefined,
        channel: filters.channel || undefined,
        status: filters.status || undefined,
        // dates: backend treats `to` as inclusive timestamp — push to end of day
        from: filters.from ? `${filters.from}T00:00:00` : undefined,
        to: filters.to ? `${filters.to}T23:59:59` : undefined,
        limit: PAGE_SIZE,
        offset: nextOffset,
      }
      const data = await api.messages(params)
      setResult(data)
      setOffset(nextOffset)
      setSearched(true)
    } catch (err) {
      setError(err.message)
      setResult(null)
    }
    setLoading(false)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    runSearch(0)
  }

  const reset = () => {
    setFilters(EMPTY_FILTERS)
    setResult(null)
    setSearched(false)
    setError('')
    setOffset(0)
  }

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  const messages = result?.messages || []
  const total = result?.total || 0
  const pageStart = total === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + PAGE_SIZE, total)
  const hasPrev = offset > 0
  const hasNext = offset + PAGE_SIZE < total

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Message Log</h1>
        <p className="text-sm text-mute mt-1">Search messages across all workspaces.</p>
      </div>

      {/* Filters */}
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-rule shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-mute mb-1">Recipient</label>
            <input
              type="text" value={filters.recipient} onChange={set('recipient')}
              placeholder="+268… or email"
              className="w-full px-3 py-2 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1">Channel</label>
            <select value={filters.channel} onChange={set('channel')}
              className="w-full px-3 py-2 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink bg-white">
              {CHANNELS.map((c) => <option key={c} value={c}>{c ? c.toUpperCase() : 'All channels'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1">Status</label>
            <select value={filters.status} onChange={set('status')}
              className="w-full px-3 py-2 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink bg-white">
              {STATUSES.map((s) => <option key={s} value={s}>{s ? s[0].toUpperCase() + s.slice(1) : 'All statuses'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1">From</label>
            <input type="date" value={filters.from} onChange={set('from')}
              className="w-full px-3 py-2 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink" />
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1">To</label>
            <input type="date" value={filters.to} onChange={set('to')}
              className="w-full px-3 py-2 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button type="submit" disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-ink rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
          </button>
          <button type="button" onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2 border border-rule rounded-lg text-sm font-medium text-mute hover:bg-cream transition-colors">
            <X className="w-4 h-4" /> Clear
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {searched && !error && (
        <div className="bg-white rounded-xl border border-rule shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-rule">
            <p className="text-sm text-mute">
              {total > 0 ? <>Showing <span className="font-medium text-ink">{pageStart}–{pageEnd}</span> of <span className="font-medium text-ink">{total}</span></> : 'No results'}
            </p>
            {total > PAGE_SIZE && (
              <div className="flex items-center gap-1">
                <button disabled={!hasPrev || loading} onClick={() => runSearch(offset - PAGE_SIZE)}
                  className="p-1.5 rounded-lg border border-rule text-mute hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={!hasNext || loading} onClick={() => runSearch(offset + PAGE_SIZE)}
                  className="p-1.5 rounded-lg border border-rule text-mute hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-mute">
              <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No messages match your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rule bg-cream/50">
                    <th className="text-left text-xs font-semibold text-mute uppercase tracking-wider px-5 py-3">Workspace</th>
                    <th className="text-left text-xs font-semibold text-mute uppercase tracking-wider px-3 py-3">Channel</th>
                    <th className="text-left text-xs font-semibold text-mute uppercase tracking-wider px-3 py-3">Recipient</th>
                    <th className="text-left text-xs font-semibold text-mute uppercase tracking-wider px-3 py-3">Content</th>
                    <th className="text-center text-xs font-semibold text-mute uppercase tracking-wider px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-mute uppercase tracking-wider px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-shade">
                  {messages.map((m) => {
                    const content = contentPreview(m.content)
                    return (
                      <tr key={m.id} className="hover:bg-cream/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link to={`/workspaces/${m.workspace_id}`} className="text-brick hover:text-brick font-medium">
                            {m.workspace_name || '—'}
                          </Link>
                          {m.workspace_email && <p className="text-xs text-mute">{m.workspace_email}</p>}
                        </td>
                        <td className="px-3 py-3.5"><ChannelBadge channel={m.channel} /></td>
                        <td className="px-3 py-3.5 text-mute font-mono text-xs max-w-[140px] truncate" title={m.recipient}>
                          {m.recipient || '—'}
                        </td>
                        <td className="px-3 py-3.5 text-mute max-w-[240px]">
                          <span className="truncate block" title={content}>
                            {content ? content.slice(0, 80) + (content.length > 80 ? '…' : '') : '—'}
                          </span>
                          {m.error_message && <p className="text-xs text-red-500 truncate" title={m.error_message}>⚠ {m.error_message}</p>}
                        </td>
                        <td className="px-3 py-3.5 text-center"><StatusBadge status={m.status} /></td>
                        <td className="px-5 py-3.5 text-mute text-xs whitespace-nowrap">{fmt(m.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!searched && !error && (
        <div className="bg-white rounded-xl border border-rule shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-mute">
            <Search className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Enter filters and search to trace messages</p>
          </div>
        </div>
      )}
    </div>
  )
}

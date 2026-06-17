import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Loader2, AlertCircle, CheckCircle, XCircle, MessageSquare, Mail, Phone,
  Radio, Search, Pencil, Check, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { api } from '../api'

const CHANNEL_ICON = {
  sms: MessageSquare,
  whatsapp: Phone,
  email: Mail,
}

function ConfiguredBadge({ ok }) {
  return ok
    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Configured</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600"><XCircle className="w-3 h-3" /> Not configured</span>
}

// ─── Providers (read-only — credentials live in Cloud Run secrets) ─────────────

function ProvidersSection() {
  const [providers, setProviders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.providers()
      .then((d) => setProviders(d.providers || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-500" /> Providers
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Read-only. Credentials are managed as Cloud Run secrets, not editable here.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((p) => {
            const Icon = CHANNEL_ICON[p.channel] || Radio
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg"><Icon className="w-4 h-4 text-gray-500" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400 uppercase">{p.channel}</p>
                    </div>
                  </div>
                </div>
                <ConfiguredBadge ok={p.configured} />
                <dl className="mt-3 space-y-1.5">
                  {Object.entries(p.details || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2 text-xs">
                      <dt className="text-gray-400">{k.replace(/_/g, ' ')}</dt>
                      <dd className="font-mono text-gray-700 truncate max-w-[140px]" title={v || ''}>{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Senders (per-workspace SMS sender ID — read by the send path) ─────────────

function SenderRow({ ws, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(ws.sms_sender_name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const data = await api.updateSender(ws.id, value.trim())
      onSaved(ws.id, data.sms_sender_name)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  const cancel = () => {
    setValue(ws.sms_sender_name || '')
    setError('')
    setEditing(false)
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5">
        <Link to={`/workspaces/${ws.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium">{ws.name || '—'}</Link>
        {ws.email && <p className="text-xs text-gray-400">{ws.email}</p>}
      </td>
      <td className="px-3 py-3.5 text-gray-500 text-xs">{ws.country || '—'}</td>
      <td className="px-3 py-3.5">
        {editing ? (
          <div>
            <div className="flex items-center gap-1.5">
              <input
                autoFocus value={value} maxLength={11}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Sender ID"
                className="w-32 px-2 py-1 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={save} disabled={saving}
                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button onClick={cancel} disabled={saving}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-50">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Blank = use Twilio number. Max 11 alphanumeric.</p>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {ws.sms_sender_name
              ? <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">{ws.sms_sender_name}</code>
              : <span className="text-xs text-gray-400 italic">Twilio number</span>}
            <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </td>
      <td className="px-5 py-3.5 text-center">
        {ws.is_active !== false
          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Inactive</span>}
      </td>
    </tr>
  )
}

const SENDERS_PAGE_SIZE = 50

function SendersSection() {
  const [result, setResult] = useState(null) // { senders, total, limit, offset }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [offset, setOffset] = useState(0)

  // Debounce the filter box; any new query snaps back to the first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setOffset(0)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Server-side search + pagination. Re-runs on debounced query or page change.
  // The load runs via an async IIFE so the setState calls live outside the
  // effect's synchronous body (react-hooks/set-state-in-effect); runtime is
  // identical — the IIFE is still invoked synchronously when the effect runs.
  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const d = await api.senders({ search: debouncedQuery || undefined, limit: SENDERS_PAGE_SIZE, offset })
        if (active) setResult(d)
      } catch (err) {
        if (active) { setError(err.message); setResult(null) }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [debouncedQuery, offset])

  const onSaved = (id, sms_sender_name) => {
    setResult((r) => (r
      ? { ...r, senders: r.senders.map((w) => (w.id === id ? { ...w, sms_sender_name } : w)) }
      : r))
  }

  const senders = result?.senders || []
  const total = result?.total || 0
  const pageStart = total === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + SENDERS_PAGE_SIZE, total)
  const hasPrev = offset > 0
  const hasNext = offset + SENDERS_PAGE_SIZE < total

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" /> SMS Sender IDs
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            The alphanumeric sender shown on a workspace's SMS. Blank falls back to the Twilio number.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter workspaces…"
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /><p className="text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />}
              {total > 0
                ? <>Showing <span className="font-medium text-gray-700">{pageStart}–{pageEnd}</span> of <span className="font-medium text-gray-700">{total}</span></>
                : (loading ? 'Loading…' : 'No workspaces match.')}
            </p>
            {total > SENDERS_PAGE_SIZE && (
              <div className="flex items-center gap-1">
                <button disabled={!hasPrev || loading} onClick={() => setOffset((o) => Math.max(o - SENDERS_PAGE_SIZE, 0))}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={!hasNext || loading} onClick={() => setOffset((o) => o + SENDERS_PAGE_SIZE)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Workspace</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Country</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-3">Sender ID</th>
                  <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {senders.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">{loading ? 'Loading…' : 'No workspaces match.'}</td></tr>
                ) : (
                  senders.map((ws) => <SenderRow key={ws.id} ws={ws} onSaved={onSaved} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

export default function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform providers and sender configuration.</p>
      </div>
      <ProvidersSection />
      <SendersSection />
    </div>
  )
}

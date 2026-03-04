import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, CreditCard, MessageSquare, Loader2, AlertCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { api } from '../api'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ active }) {
  return active
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Inactive</span>
}

const CHANNEL_COLORS = { sms: '#6366f1', email: '#8b5cf6', whatsapp: '#10b981' }

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.stats(), api.workspaces()])
      .then(([s, w]) => {
        setStats(s)
        setWorkspaces(w)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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

  const channelData = stats?.messages?.by_channel
    ? [
        { name: 'SMS', count: stats.messages.by_channel.sms || 0, color: CHANNEL_COLORS.sms },
        { name: 'Email', count: stats.messages.by_channel.email || 0, color: CHANNEL_COLORS.email },
        { name: 'WhatsApp', count: stats.messages.by_channel.whatsapp || 0, color: CHANNEL_COLORS.whatsapp },
      ]
    : []

  const recent = workspaces.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">YeboLink platform overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Workspaces"
          value={stats?.workspaces?.total ?? '—'}
          color="bg-indigo-500"
        />
        <StatCard
          icon={Activity}
          label="Active Workspaces"
          value={stats?.workspaces?.active ?? '—'}
          color="bg-emerald-500"
        />
        <StatCard
          icon={CreditCard}
          label="Credits in System"
          value={stats?.workspaces?.credits_held != null ? stats.workspaces.credits_held.toLocaleString() : '—'}
          color="bg-purple-500"
          sub="Total credits held across all workspaces"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages Today"
          value={stats?.messages?.today ?? '—'}
          color="bg-orange-500"
          sub={`${stats?.messages?.total?.toLocaleString() ?? '—'} total`}
        />
      </div>

      {/* Chart + Recent Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Messages by Channel</h2>
          {channelData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No channel data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {channelData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Workspaces Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Workspaces</h2>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Users className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No workspaces yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">Email</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">Credits</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent.map(ws => (
                    <tr
                      key={ws.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/workspaces/${ws.id}`)}
                    >
                      <td className="py-3 font-medium text-gray-800 truncate max-w-[120px]">{ws.name}</td>
                      <td className="py-3 text-gray-500 truncate max-w-[150px]">{ws.email || '—'}</td>
                      <td className="py-3 text-right font-semibold text-indigo-600">
                        {ws.credits != null ? ws.credits.toLocaleString() : '—'}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge active={ws.is_active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

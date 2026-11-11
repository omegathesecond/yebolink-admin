import { YeboLogo } from '../components/YeboLogo'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { api } from '../api'

export default function Login() {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!key.trim()) return
    setLoading(true)
    setError('')
    localStorage.setItem('ybk_admin_key', key.trim())
    try {
      await api.stats()
      navigate('/dashboard')
    } catch {
      localStorage.removeItem('ybk_admin_key')
      setError('Invalid API key. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="admin-login">
      <aside className="admin-login-story">
        <YeboLogo onDark />
        <div>
          <p className="eyebrow !text-cream/60 mb-6">Behind every connection</p>
          <h2>
            A thoughtful platform.
            <br />
            <span className="text-brand-hot">Starts with you.</span>
          </h2>
          <p className="mt-7 text-cream/65 max-w-md leading-relaxed">
            A clear view of your workspaces, messaging activity, and the details that need your
            attention.
          </p>
        </div>
        <p className="eyebrow !text-cream/50">YeboLink / An Omevision company</p>
      </aside>
      <main className="admin-login-form">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="mb-10 lg:hidden">
              <YeboLogo />
            </div>
            <ShieldCheck className="h-6 w-6 text-brick mb-5" />
            <p className="eyebrow mb-3">Platform management</p>
            <h1 className="font-display text-3xl font-medium tracking-tight">Welcome back.</h1>
            <p className="text-mute mt-3 text-sm">Sign in with your admin API key.</p>
          </div>

          {/* Card */}
          <div className="">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="admin-key" className="block text-sm font-medium text-ink mb-1.5">
                  Admin API Key
                </label>
                <div className="relative">
                  <input
                    id="admin-key"
                    type={show ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your admin key…"
                    className="w-full px-3 py-2.5 pr-10 border border-rule rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent font-mono"
                    autoFocus
                  />
                  <button
                    type="button"
                    aria-label={show ? 'Hide API key' : 'Show API key'}
                    aria-pressed={show}
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-mute"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !key.trim()}
                className="w-full py-2.5 bg-brand text-ink rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying…' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

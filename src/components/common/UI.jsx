import { AlertTriangle, Loader2, Inbox, X, Check } from 'lucide-react'

// ── Status Badge ──────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    PENDING:     'status-pending',
    ACCEPTED:    'status-accepted',
    DISPATCHED:  'badge-orange',
    EN_ROUTE:    'badge-orange',
    ARRIVED:     'badge-blue',
    IN_TREATMENT:'badge-blue',
    COMPLETED:   'status-completed',
    CANCELLED:   'status-cancelled',
    REJECTED:    'status-rejected',
  }
  const dotMap = {
    PENDING: 'bg-yellow-400', ACCEPTED: 'bg-blue-400',
    DISPATCHED: 'bg-orange-400', EN_ROUTE: 'bg-orange-400',
    COMPLETED: 'bg-emerald-400', CANCELLED: 'bg-gray-500',
    REJECTED: 'bg-red-400', ARRIVED: 'bg-blue-400',
  }
  return (
    <span className={map[status] || 'badge-gray'}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status] || 'bg-gray-400'}`} />
      {status?.replace('_', ' ')}
    </span>
  )
}

// ── Priority Badge ────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const map = {
    CRITICAL: 'priority-critical',
    HIGH:     'priority-high',
    MEDIUM:   'priority-medium',
    LOW:      'priority-low',
  }
  const icons = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵' }
  return (
    <span className={map[priority] || 'badge-gray'}>
      {icons[priority]} {priority}
    </span>
  )
}

// ── Loading Spinner ───────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <Loader2 className={`${sizes[size]} animate-spin text-brand-500 ${className}`} />
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm animate-pulse">Loading data…</p>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here', message = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
        <Icon className="w-7 h-7 text-gray-600" />
      </div>
      <div>
        <p className="font-semibold text-gray-400">{title}</p>
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ── Confirm Modal ─────────────────────────────────────────
export function ConfirmModal({ open, title, message, onConfirm, onCancel,
                                confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-sm animate-slide-in">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                           ${danger ? 'bg-red-950 text-red-400' : 'bg-blue-950 text-blue-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={onConfirm}
            className={danger ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stats Card ────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'brand', trend, sub }) {
  const colors = {
    brand:   ['bg-brand-950',   'text-brand-400'],
    green:   ['bg-emerald-950', 'text-emerald-400'],
    blue:    ['bg-blue-950',    'text-blue-400'],
    yellow:  ['bg-yellow-950',  'text-yellow-400'],
    orange:  ['bg-orange-950',  'text-orange-400'],
    purple:  ['bg-purple-950',  'text-purple-400'],
    red:     ['bg-red-950',     'text-red-400'],
  }
  const [bg, text] = colors[color] ?? colors.brand
  return (
    <div className="stat-card">
      <div className={`stat-icon ${bg}`}>
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-display font-bold text-white mt-0.5">{value ?? '—'}</p>
        {sub  && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-display font-bold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

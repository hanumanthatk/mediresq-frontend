import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useWebSocket } from '../../context/WebSocketContext'
import {
  LayoutDashboard, Hospital, Ambulance, Activity, Users, Settings,
  LogOut, Menu, X, Bell, BedDouble, AlertTriangle, BarChart3,
  Search, Heart, ClipboardList, Shield, ChevronRight, Wifi, WifiOff
} from 'lucide-react'

const NAV = {
  PATIENT: [
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patient/hospitals',  icon: Search,          label: 'Find Hospitals' },
    { to: '/patient/emergency',  icon: AlertTriangle,   label: 'Emergency Request' },
    { to: '/patient/history',    icon: ClipboardList,   label: 'My Requests' },
  ],
  HOSPITAL: [
    { to: '/hospital/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hospital/emergency',  icon: AlertTriangle,   label: 'Emergency Queue' },
    { to: '/hospital/beds',       icon: BedDouble,       label: 'Bed Management' },
    { to: '/hospital/ambulances', icon: Ambulance,       label: 'Ambulances' },
  ],
  ADMIN: [
    { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/hospitals',  icon: Hospital,         label: 'Hospitals' },
    { to: '/admin/users',      icon: Users,            label: 'Users' },
    { to: '/admin/requests',   icon: Activity,         label: 'All Requests' },
  ],
}

export default function Layout({ children }) {
  const { user, logout }    = useAuth()
  const { connected }       = useWebSocket()
  const navigate            = useNavigate()
  const [open, setOpen]     = useState(false)
  const links               = NAV[user?.role] ?? []

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Mobile overlay ── */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden"
             onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-gray-900 border-r border-gray-800
        transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-[0_0_20px_rgba(229,29,29,0.5)]">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">Smart Emergency</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Medical Response</p>
          </div>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2">
            <div className={`w-2 h-2 rounded-full ${
              user?.role === 'ADMIN' ? 'bg-purple-400' :
              user?.role === 'HOSPITAL' ? 'bg-blue-400' : 'bg-emerald-400'
            }`} />
            <span className="text-xs text-gray-400 font-medium">{user?.role}</span>
            <span className="ml-auto text-xs text-gray-500 truncate max-w-24">{user?.name?.split(' ')[0]}</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-600">
            {connected
              ? <><Wifi className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-600">Live</span></>
              : <><WifiOff className="w-3 h-3" /> <span>Offline</span></>}
          </div>
          <button onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:text-red-400 hover:bg-red-950/30">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
          <button className="md:hidden btn-icon" onClick={() => setOpen(true)}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-900 border border-brand-700
                            flex items-center justify-center text-brand-400 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

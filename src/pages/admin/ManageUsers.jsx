import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState, ConfirmModal } from '../../components/common/UI'
import { adminApi } from '../../api/adminApi'
import { Users, Search, ToggleLeft, ToggleRight, RefreshCw, Shield, User, Hospital } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ROLE_ICON  = { ADMIN: Shield, HOSPITAL: Hospital, PATIENT: User }
const ROLE_COLOR = { ADMIN: 'purple', HOSPITAL: 'blue', PATIENT: 'green' }

export default function ManageUsers() {
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [roleFilter,setRoleFilter]= useState('ALL')
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(async () => {
    try { const { data } = await adminApi.getUsers(); setUsers(data) }
    catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id) => {
    try {
      const { data } = await adminApi.toggleUserStatus(id)
      setUsers(prev => prev.map(u => u.id === id ? data : u))
      toast.success(`User ${data.isActive ? 'activated' : 'deactivated'}`)
    } catch { toast.error('Action failed') }
    setConfirmId(null)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const counts = { ALL: users.length, PATIENT: 0, HOSPITAL: 0, ADMIN: 0 }
  users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++ })

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <ConfirmModal
        open={!!confirmId}
        title="Toggle User Status"
        message={`${users.find(u => u.id === confirmId)?.isActive ? 'Deactivate' : 'Activate'} this user?`}
        confirmLabel={users.find(u => u.id === confirmId)?.isActive ? 'Deactivate' : 'Activate'}
        danger={users.find(u => u.id === confirmId)?.isActive}
        onConfirm={() => handleToggle(confirmId)}
        onCancel={() => setConfirmId(null)} />

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">{users.length} total · {users.filter(u => u.isActive).length} active</p>
        </div>
        <button onClick={load} className="btn-icon mt-1"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {['ALL','PATIENT','HOSPITAL','ADMIN'].map(r => {
          const color = r === 'ALL' ? 'gray' : ROLE_COLOR[r]
          const Icon  = r === 'ALL' ? Users : ROLE_ICON[r]
          return (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`card text-center py-4 transition-all
                ${roleFilter === r ? 'border-brand-700 bg-brand-950/20' : 'hover:border-gray-700'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2
                bg-${color}-950 text-${color}-400`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-display font-bold text-white">{counts[r]}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{r}</p>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-10" placeholder="Search by name, email or phone…" />
      </div>

      {filtered.length === 0
        ? <EmptyState icon={Users} title="No users found" />
        : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const Icon  = ROLE_ICON[u.role] ?? User
                  const color = ROLE_COLOR[u.role] ?? 'gray'
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center
                            bg-${color}-950 text-${color}-400 font-bold text-sm flex-shrink-0`}>
                            {u.firstName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-200">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${color}-950 text-${color}-400 border-${color}-900`}>
                          <Icon className="w-3 h-3" /> {u.role}
                        </span>
                      </td>
                      <td><span className="font-mono text-xs">{u.phone}</span></td>
                      <td className="text-xs text-gray-500">
                        {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy') : '—'}
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setConfirmId(u.id)} className="btn-icon">
                          {u.isActive
                            ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                            : <ToggleLeft  className="w-4 h-4 text-gray-500" />}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </Layout>
  )
}

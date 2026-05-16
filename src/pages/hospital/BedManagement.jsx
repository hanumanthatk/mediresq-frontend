import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState, SectionHeader } from '../../components/common/UI'
import { hospitalApi } from '../../api/hospitalApi'
import { BedDouble, Save, Plus, Loader2, RefreshCw, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const BED_TYPES = ['GENERAL','ICU','CCU','NICU','HDU','ISOLATION','EMERGENCY']
const BED_INFO = {
  GENERAL:   { color: 'blue',   desc: 'Regular ward beds for standard patients' },
  ICU:       { color: 'red',    desc: 'Intensive care for critical patients' },
  CCU:       { color: 'orange', desc: 'Cardiac care unit beds' },
  NICU:      { color: 'purple', desc: 'Neonatal intensive care unit' },
  HDU:       { color: 'yellow', desc: 'High dependency unit' },
  ISOLATION: { color: 'gray',   desc: 'Isolation beds for infectious cases' },
  EMERGENCY: { color: 'green',  desc: 'Emergency department beds' },
}

function BedCard({ bed, onSave, saving }) {
  const [form, setForm] = useState({
    totalCount: bed?.totalCount ?? 0,
    availableCount: bed?.availableCount ?? 0,
    underMaintenance: bed?.underMaintenance ?? 0,
    costPerDay: bed?.costPerDay ?? '',
    notes: bed?.notes ?? '',
  })
  const [dirty, setDirty] = useState(false)

  const h = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setDirty(true)
  }

  const occupancy = form.totalCount > 0
    ? Math.round(((form.totalCount - form.availableCount) / form.totalCount) * 100)
    : 0
  const info = BED_INFO[bed.bedType] || {}

  return (
    <div className={`card border transition-all
      ${form.availableCount > 0 ? 'border-gray-800' : 'border-red-900/40 bg-red-950/5'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            bg-${info.color || 'gray'}-950 text-${info.color || 'gray'}-400`}>
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white">{bed.bedType}</h3>
            <p className="text-xs text-gray-500">{info.desc}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-display font-bold
            ${form.availableCount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {form.availableCount}
          </div>
          <div className="text-xs text-gray-500">available</div>
        </div>
      </div>

      {/* Occupancy bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Occupancy</span>
          <span>{occupancy}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all
            ${occupancy > 90 ? 'bg-red-500' : occupancy > 70 ? 'bg-orange-500' : 'bg-emerald-500'}`}
            style={{ width: `${occupancy}%` }} />
        </div>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="input-group">
          <label className="label text-[10px]">Total Beds</label>
          <input name="totalCount" type="number" min="0" value={form.totalCount} onChange={h} className="input text-sm py-2" />
        </div>
        <div className="input-group">
          <label className="label text-[10px]">Available Now</label>
          <input name="availableCount" type="number" min="0" max={form.totalCount} value={form.availableCount} onChange={h} className="input text-sm py-2" />
        </div>
        <div className="input-group">
          <label className="label text-[10px]">Maintenance</label>
          <input name="underMaintenance" type="number" min="0" value={form.underMaintenance} onChange={h} className="input text-sm py-2" />
        </div>
        <div className="input-group">
          <label className="label text-[10px]">Cost/Day (₹)</label>
          <input name="costPerDay" type="number" min="0" value={form.costPerDay} onChange={h} className="input text-sm py-2" />
        </div>
      </div>
      <div className="input-group mb-3">
        <label className="label text-[10px]">Notes</label>
        <input name="notes" value={form.notes} onChange={h} className="input text-sm py-2" placeholder="Optional notes…" />
      </div>

      <button
        onClick={() => { onSave({ bedType: bed.bedType, ...form, totalCount: Number(form.totalCount),
          availableCount: Number(form.availableCount), underMaintenance: Number(form.underMaintenance) }); setDirty(false) }}
        disabled={saving || !dirty}
        className={`btn w-full text-sm ${dirty ? 'btn-primary' : 'btn-secondary opacity-50'}`}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
      </button>
    </div>
  )
}

export default function BedManagement() {
  const [beds,    setBeds]    = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState({})
  const [addType, setAddType] = useState('')

  const load = useCallback(async () => {
    try {
      const { data } = await hospitalApi.getBeds()
      setBeds(data)
    } catch { toast.error('Failed to load bed data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (bedData) => {
    setSaving(s => ({ ...s, [bedData.bedType]: true }))
    try {
      const { data } = await hospitalApi.updateBed(bedData)
      setBeds(prev => {
        const idx = prev.findIndex(b => b.bedType === bedData.bedType)
        if (idx >= 0) { const u = [...prev]; u[idx] = data; return u }
        return [...prev, data]
      })
      toast.success(`${bedData.bedType} beds updated ✓`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally {
      setSaving(s => ({ ...s, [bedData.bedType]: false }))
    }
  }

  const addBedType = () => {
    if (!addType) return
    if (beds.find(b => b.bedType === addType)) return toast.error('Bed type already exists')
    setBeds(prev => [...prev, { bedType: addType, totalCount: 0, availableCount: 0,
      underMaintenance: 0, costPerDay: 0, notes: '' }])
    setAddType('')
  }

  const existingTypes = beds.map(b => b.bedType)
  const remainingTypes = BED_TYPES.filter(t => !existingTypes.includes(t))

  if (loading) return <Layout><PageLoader /></Layout>

  return (
    <Layout>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Bed Management</h1>
          <p className="page-subtitle">Update live bed availability — changes broadcast in real-time</p>
        </div>
        <button onClick={load} className="btn-icon mt-1"><RefreshCw className="w-4 h-4 text-gray-400" /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-display font-bold text-white">
            {beds.reduce((s, b) => s + (b.totalCount || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Beds</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-display font-bold text-emerald-400">
            {beds.reduce((s, b) => s + (b.availableCount || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Available</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-display font-bold text-red-400">
            {beds.reduce((s, b) => s + (b.occupiedCount || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Occupied</p>
        </div>
      </div>

      {/* Add bed type */}
      {remainingTypes.length > 0 && (
        <div className="card mb-6 flex items-center gap-3">
          <Plus className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <select value={addType} onChange={e => setAddType(e.target.value)} className="input flex-1">
            <option value="">Add a bed type…</option>
            {remainingTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <button onClick={addBedType} disabled={!addType} className="btn-primary btn-sm">Add</button>
        </div>
      )}

      {beds.length === 0
        ? <EmptyState icon={BedDouble} title="No bed types configured"
            message="Add bed types above to start managing availability" />
        : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {beds.map(bed => (
              <BedCard key={bed.bedType} bed={bed}
                onSave={handleSave}
                saving={!!saving[bed.bedType]} />
            ))}
          </div>
        )}
    </Layout>
  )
}

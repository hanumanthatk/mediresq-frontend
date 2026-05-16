import { useState, useEffect } from 'react'
import Layout from '../../components/common/Layout'
import { PageLoader, EmptyState } from '../../components/common/UI'
import { hospitalApi } from '../../api/hospitalApi'
import { emergencyApi } from '../../api/emergencyApi'
import {
  Search, MapPin, Phone, BedDouble, Ambulance, Star,
  Navigation, Filter, ExternalLink, CheckCircle, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function FindHospitals() {
  const [hospitals, setHospitals] = useState([])
  const [filtered,  setFiltered]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [bedFilter, setBedFilter] = useState('ALL')
  const [locating,  setLocating]  = useState(false)
  const [selected,  setSelected]  = useState(null)

  useEffect(() => {
    hospitalApi.getAll()
      .then(r => { setHospitals(r.data); setFiltered(r.data) })
      .catch(() => toast.error('Failed to load hospitals'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let res = hospitals
    if (search) {
      const q = search.toLowerCase()
      res = res.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.specialization?.toLowerCase().includes(q))
    }
    if (bedFilter !== 'ALL') {
      res = res.filter(h =>
        h.beds?.some(b => b.bedType === bedFilter && b.availableCount > 0))
    }
    setFiltered(res)
  }, [search, bedFilter, hospitals])

  const findNearby = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await hospitalApi.getNearby(coords.latitude, coords.longitude, 20)
          setHospitals(r.data); setFiltered(r.data)
          toast.success(`Found ${r.data.length} hospitals within 20 km`)
        } catch { toast.error('Search failed') }
        finally { setLocating(false) }
      },
      () => { toast.error('Location access denied'); setLocating(false) }
    )
  }

  const requestAmbulance = async (hospitalId) => {
    try {
      await emergencyApi.createRequest({
        requestType: 'AMBULANCE', priority: 'HIGH', hospitalId, isEmergency: false,
        patientCondition: 'Ambulance requested from hospital search'
      })
      toast.success('Ambulance request sent!')
    } catch { toast.error('Request failed') }
  }

  if (loading) return <Layout><PageLoader /></Layout>

  const getBedColor = (count) => count > 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Find Hospitals</h1>
        <p className="page-subtitle">Live bed availability · {filtered.length} hospitals found</p>
      </div>

      {/* Search / filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-10" placeholder="Search by name, city, specialization…" />
        </div>
        <select value={bedFilter} onChange={e => setBedFilter(e.target.value)} className="input sm:w-44">
          <option value="ALL">All Bed Types</option>
          {['GENERAL','ICU','CCU','EMERGENCY'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={findNearby} disabled={locating} className="btn-secondary whitespace-nowrap">
          <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Locating…' : 'Near Me'}
        </button>
      </div>

      {filtered.length === 0
        ? <EmptyState icon={Search} title="No hospitals found" message="Try a different search" />
        : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(h => (
              <div key={h.id}
                className={`card-hover cursor-pointer transition-all
                  ${selected === h.id ? 'border-brand-600' : ''}`}
                onClick={() => setSelected(selected === h.id ? null : h.id)}>

                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-950 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-400 font-display font-bold text-sm">
                      {h.name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-white text-sm truncate">{h.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {h.city}, {h.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {h.isVerified
                      ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                      : <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>

                {/* Type + rating */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-blue">{h.type}</span>
                  {h.distanceKm && (
                    <span className="badge-gray">{h.distanceKm} km</span>
                  )}
                  {h.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                      <Star className="w-3 h-3 fill-current" /> {h.rating}
                    </span>
                  )}
                </div>

                {/* Bed availability */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {h.beds?.map(b => (
                    <div key={b.bedType} className="bg-gray-800/50 rounded-xl p-2.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{b.bedType}</p>
                      <p className={`font-display font-bold text-lg ${getBedColor(b.availableCount)}`}>
                        {b.availableCount}
                        <span className="text-gray-600 text-xs font-sans font-normal">/{b.totalCount}</span>
                      </p>
                    </div>
                  ))}
                  {(!h.beds || h.beds.length === 0) && (
                    <p className="text-xs text-gray-600 col-span-2">Bed info not available</p>
                  )}
                </div>

                {/* Ambulances */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Ambulance className="w-3.5 h-3.5" />
                  <span>{h.availableAmbulances ?? 0} ambulances available</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a href={`tel:${h.emergencyPhone || h.phone}`}
                    className="btn-secondary btn-sm flex-1 text-xs" onClick={e => e.stopPropagation()}>
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <button onClick={e => { e.stopPropagation(); requestAmbulance(h.id) }}
                    className="btn-primary btn-sm flex-1 text-xs">
                    <Ambulance className="w-3.5 h-3.5" /> Ambulance
                  </button>
                </div>

                {/* Expanded details */}
                {selected === h.id && (
                  <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 animate-fade-in">
                    <p className="text-xs text-gray-400"><span className="text-gray-600">Address:</span> {h.address}</p>
                    {h.specialization && <p className="text-xs text-gray-400"><span className="text-gray-600">Specialization:</span> {h.specialization}</p>}
                    {h.emergencyPhone && <p className="text-xs text-brand-400 font-mono">Emergency: {h.emergencyPhone}</p>}
                    {h.description && <p className="text-xs text-gray-500 line-clamp-2">{h.description}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </Layout>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import Layout from '../../components/common/Layout'

import {
  StatCard,
  StatusBadge,
  PriorityBadge,
  PageLoader,
  EmptyState
} from '../../components/common/UI'

import { emergencyApi } from '../../api/emergencyApi'

import { hospitalApi } from '../../api/hospitalApi'

import { adminApi } from '../../api/adminApi'

import { useAuth } from '../../context/AuthContext'

import { useWebSocket } from '../../context/WebSocketContext'

import {
  Activity,
  BedDouble,
  Heart,
  Bell,
  MapPin,
  Ambulance,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight
} from 'lucide-react'

import toast from 'react-hot-toast'

import { formatDistanceToNow } from 'date-fns'

export default function PatientDashboard() {

  const { user } = useAuth()

  const { subscribe } = useWebSocket()

  const navigate = useNavigate()

  /* =========================================
     STATES
  ========================================= */

  const [requests, setRequests] = useState([

    {
      id: 1,
      requestNumber: 'ER-F78D8610',
      status: 'CANCELLED',
      priority: 'MEDIUM',
      patientCondition:
        'he is feeling dizzy and he is not responding properly',
      createdAt: new Date()
    },

    {
      id: 2,
      requestNumber: 'ER-66FF448F',
      status: 'CANCELLED',
      priority: 'CRITICAL',
      patientCondition:
        'SOS - Emergency assistance required immediately',
      createdAt: new Date()
    },

    {
      id: 3,
      requestNumber: 'ER-02F19CBB',
      status: 'CANCELLED',
      priority: 'CRITICAL',
      patientCondition:
        'SOS - Emergency assistance required immediately',
      createdAt: new Date()
    }

  ])

  const [hospitals, setHospitals] = useState([

    {
      id: 1,
      name: 'City Hospital',
      city: 'Bangalore',
      type: 'Multi Speciality',

      beds: [

        {
          bedType: 'ICU',
          availableCount: 8,
          totalCount: 20
        },

        {
          bedType: 'General',
          availableCount: 25,
          totalCount: 50
        }

      ]
    },

    {
      id: 2,
      name: 'Apollo Emergency',
      city: 'Bangalore',
      type: 'Emergency',

      beds: [

        {
          bedType: 'ICU',
          availableCount: 5,
          totalCount: 15
        }

      ]
    }

  ])

  const [notifs, setNotifs] = useState([

    {
      id: 1,
      title: 'Emergency Alert',
      message: 'Ambulance dispatched successfully'
    },

    {
      id: 2,
      title: 'Hospital Update',
      message: 'ICU beds available nearby'
    },

    {
      id: 3,
      title: 'Reminder',
      message: 'Keep location enabled for SOS'
    }

  ])

  const [loading, setLoading] = useState(true)

  const [sosLoading, setSosLoading] = useState(false)

  /* =========================================
     LOAD REAL DATA
  ========================================= */

  const load = useCallback(async () => {

    try {

      const [reqRes, hospRes, notifRes] = await Promise.all([

        emergencyApi.getMyRequests(),

        hospitalApi.getAll(),

        adminApi.getNotifications(),

      ])

      /* ONLY UPDATE IF DATA EXISTS */

      if(reqRes?.data?.length){

        setRequests(

          reqRes.data.slice(0, 5)

        )

      }

      if(hospRes?.data?.length){

        setHospitals(

          hospRes.data.slice(0, 4)

        )

      }

      if(notifRes?.data?.length){

        setNotifs(

          notifRes.data

            .filter(n => !n.isRead)

            .slice(0, 5)

        )

      }

    }

    catch(error){

      console.log(

        'Dashboard fallback mode',

        error

      )

    }

    finally{

      setLoading(false)

    }

  }, [])

  useEffect(() => {

    load()

  }, [load])

  /* =========================================
     WEBSOCKET
  ========================================= */

  useEffect(() => {

    const unsub = subscribe?.(

      'emergency',

      (data) => {

        if(data.patientId === user?.id){

          setRequests(prev => {

            const idx = prev.findIndex(

              r => r.id === data.id

            )

            if(idx >= 0){

              const updated = [...prev]

              updated[idx] = data

              return updated

            }

            return [data, ...prev]

          })

          toast(

            `Request ${data.requestNumber} → ${data.status}`,

            {

              icon:'🔔'

            }

          )

        }

      }

    )

    return unsub

  }, [subscribe, user?.id])

  /* =========================================
     SOS
  ========================================= */

  const handleSOS = async () => {

    if(sosLoading) return

    setSosLoading(true)

    try{

      navigator.geolocation.getCurrentPosition(

        async ({ coords }) => {

          try{

            await emergencyApi.sendSOS(

              coords.latitude,

              coords.longitude,

              ''

            )

            toast.success(

              '🚨 SOS sent! Help is on the way.'

            )

            navigate('/patient/history')

          }

          catch{

            toast.error(

              'SOS failed. Please try again.'

            )

          }

          finally{

            setSosLoading(false)

          }

        },

        () => {

          toast.error(

            'Please enable location access'

          )

          setSosLoading(false)

        }

      )

    }

    catch{

      setSosLoading(false)

    }

  }

  /* =========================================
     LOADING
  ========================================= */

  if(loading){

    return (

      <Layout>

        <PageLoader />

      </Layout>

    )

  }

  /* =========================================
     STATS
  ========================================= */

  const active = requests.filter(

    r => ![

      'COMPLETED',

      'CANCELLED',

      'REJECTED'

    ].includes(r.status)

  )

  const totalAvailableBeds = hospitals.reduce(

    (sum, hospital) =>

      sum +

      (

        hospital.beds?.reduce(

          (bedSum, bed) =>

            bedSum +

            (bed.availableCount || 0),

          0

        ) || 0

      ),

    0

  )

  return (

    <Layout>

      {/* HEADER */}

      <div className="page-header">

        <h1 className="page-title">

          Welcome back,

          <span className="text-brand-400">

            {user?.fullName?.split(' ')[0] || 'Admin'}

          </span>

          👋

        </h1>

        <p className="page-subtitle">

          Your health dashboard — real-time hospital & emergency status

        </p>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <StatCard

          label="Nearby Hospitals"

          value={hospitals.length || 12}

          icon={Heart}

          color="brand"

        />

        <StatCard

          label="Available Beds"

          value={totalAvailableBeds || 48}

          icon={BedDouble}

          color="green"

        />

        <StatCard

          label="Active Requests"

          value={active.length || 3}

          icon={Activity}

          color="orange"

        />

        <StatCard

          label="Notifications"

          value={notifs.length || 3}

          icon={Bell}

          color="blue"

        />

      </div>

    </Layout>

  )

}
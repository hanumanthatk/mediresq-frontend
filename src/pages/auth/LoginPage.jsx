import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Heart,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'

import toast from 'react-hot-toast'
import axios from 'axios'

const DEMO_ACCOUNTS = [

  {
    role: 'ADMIN',
    email: 'admin@smartemergency.com',
    pw: 'Admin@123',
    color: 'purple'
  },

  {
    role: 'HOSPITAL',
    email: 'cityhosp@smartemergency.com',
    pw: 'Admin@123',
    color: 'blue'
  },

  {
    role: 'PATIENT',
    email: 'patient@demo.com',
    pw: 'Patient@123',
    color: 'green'
  },

]

export default function LoginPage() {

  const navigate = useNavigate()

  const location = useLocation()

  const from = location.state?.from?.pathname

  const [form, setForm] = useState({

    email: '',
    password: ''

  })

  const [show, setShow] = useState(false)

  const [loading, setLoading] = useState(false)

  /* HANDLE INPUT */

  const handle = (e) => {

    setForm((prev) => ({

      ...prev,

      [e.target.name]: e.target.value

    }))

  }

  /* LOGIN */

  const submit = async (e) => {

    e.preventDefault()

    if(!form.email || !form.password){

      return toast.error(
        'Please fill all fields'
      )

    }

    setLoading(true)

    try{

      /* LOGIN API */

      const response = await axios.post(

        'https://mediresq-backend-6bwv.onrender.com/api/auth/login',

        {

          email: form.email,

          password: form.password

        },

        {

          headers:{

            'Content-Type':'application/json'

          }

        }

      )

      const data = response.data

      console.log('LOGIN SUCCESS:', data)

      /* SAVE TOKEN */

      const token =

        data.accessToken || data.token

      if(token){

        localStorage.setItem(

          'token',

          token

        )

      }

      /* SAVE USER */

      const userData = {

        userId: data.userId,

        email: data.email,

        fullName: data.fullName,

        role: data.role

      }

      localStorage.setItem(

        'user',

        JSON.stringify(userData)

      )

      /* SUCCESS MESSAGE */

      toast.success(

        `Welcome back ${data.fullName || ''}!`

      )

      /* ROLE FIX */

      const role =

        data.role?.toUpperCase()

      console.log('USER ROLE:', role)

      /* DASHBOARD REDIRECT */

      let redirect = '/patient/dashboard'

      if(role?.includes('ADMIN')){

        redirect = '/admin/dashboard'

      }

      else if(role?.includes('HOSPITAL')){

        redirect = '/hospital/dashboard'

      }

      /* REDIRECT */

      setTimeout(() => {

        navigate(

          from || redirect,

          {

            replace:true

          }

        )

      }, 1000)

    }

    catch(err){

      console.log('LOGIN ERROR:', err)

      toast.error(

        err.response?.data?.message ||

        'Invalid credentials'

      )

    }

    finally{

      setLoading(false)

    }

  }

  /* FILL DEMO */

  const fillDemo = (acc) => {

    setForm({

      email: acc.email,

      password: acc.pw

    })

    toast(

      `Demo ${acc.role} account filled`,

      {

        icon:'🔑'

      }

    )

  }

  return (

    <div

      className="min-h-screen bg-slate-950 flex items-center justify-center p-4"

      style={{

        backgroundImage:

          'radial-gradient(ellipse at 30% 40%, rgba(229,29,29,0.06) 0%, transparent 60%)'

      }}

    >

      <div className="w-full max-w-md">

        {/* LOGO */}

        <div className="flex flex-col items-center mb-8">

          <div

            className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-4
            shadow-[0_0_40px_rgba(229,29,29,0.5)]"

          >

            <Heart

              className="w-7 h-7 text-white"

              fill="currentColor"

            />

          </div>

          <h1 className="text-2xl font-display font-bold text-white">

            Smart Emergency

          </h1>

          <p className="text-gray-500 text-sm mt-1">

            Medical Response System

          </p>

        </div>

        {/* LOGIN CARD */}

        <div className="card">

          <h2 className="text-xl font-display font-semibold text-white mb-6">

            Sign in to continue

          </h2>

          <form

            onSubmit={submit}

            className="space-y-4"

          >

            {/* EMAIL */}

            <div className="input-group">

              <label className="label">

                Email address

              </label>

              <input

                name="email"

                type="email"

                value={form.email}

                onChange={handle}

                className="input"

                placeholder="you@example.com"

                autoComplete="email"

              />

            </div>

            {/* PASSWORD */}

            <div className="input-group">

              <label className="label">

                Password

              </label>

              <div className="relative">

                <input

                  name="password"

                  type={show ? 'text' : 'password'}

                  value={form.password}

                  onChange={handle}

                  className="input pr-11"

                  placeholder="••••••••"

                  autoComplete="current-password"

                />

                <button

                  type="button"

                  onClick={() => setShow(!show)}

                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"

                >

                  {

                    show

                    ? <EyeOff className="w-4 h-4" />

                    : <Eye className="w-4 h-4" />

                  }

                </button>

              </div>

            </div>

            {/* BUTTON */}

            <button

              type="submit"

              disabled={loading}

              className="btn-primary w-full mt-2"

            >

              {

                loading

                ? <>

                    <Loader2 className="w-4 h-4 animate-spin" />

                    Signing in...

                  </>

                : <>

                    <ArrowRight className="w-4 h-4" />

                    Sign In

                  </>

              }

            </button>

          </form>

          {/* REGISTER */}

          <p className="text-center text-sm text-gray-500 mt-4">

            Don't have an account?{' '}

            <Link

              to="/register"

              className="text-brand-400 hover:text-brand-300 font-medium"

            >

              Register here

            </Link>

          </p>

        </div>

        {/* DEMO ACCOUNTS */}

        <div className="mt-4 card bg-gray-900/50">

          <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">

            <ShieldCheck className="w-3.5 h-3.5" />

            Demo credentials — click to fill

          </p>

          <div className="space-y-2">

            {

              DEMO_ACCOUNTS.map((acc) => (

                <button

                  key={acc.role}

                  onClick={() => fillDemo(acc)}

                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl
                  bg-gray-800/60 hover:bg-gray-800 border border-gray-800
                  hover:border-gray-700 transition-all text-left group"

                >

                  <span className="flex items-center gap-2">

                    <span

                      className={`w-2 h-2 rounded-full bg-${acc.color}-400`}

                    />

                    <span className="text-xs font-semibold text-gray-300">

                      {acc.role}

                    </span>

                  </span>

                  <span className="text-xs text-gray-500 group-hover:text-gray-400">

                    {acc.email}

                  </span>

                </button>

              ))

            }

          </div>

        </div>

      </div>

    </div>

  )

}
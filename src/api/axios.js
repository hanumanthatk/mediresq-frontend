// src/api/axios.js

import axios from 'axios'

import toast from 'react-hot-toast'

/* =========================================
   BASE URL
========================================= */

const BASE_URL = import.meta.env.VITE_API_URL

  ? `${import.meta.env.VITE_API_URL}/api`

  : 'https://mediresq-backend-6bwv.onrender.com/api'

/* =========================================
   AXIOS INSTANCE
========================================= */

const api = axios.create({

  baseURL: BASE_URL,

  headers: {

    'Content-Type': 'application/json'

  },

  timeout: 60000

})

/* =========================================
   REQUEST INTERCEPTOR
========================================= */

api.interceptors.request.use(

  (config) => {

    /* GET TOKEN */

    const token =

      localStorage.getItem('token')

      ||

      localStorage.getItem('accessToken')

    /* ATTACH TOKEN */

    if(token){

      config.headers.Authorization =

        `Bearer ${token}`

    }

    console.log(

      'API REQUEST:',

      config.url,

      config.headers.Authorization

    )

    return config

  },

  (error) => {

    return Promise.reject(error)

  }

)

/* =========================================
   RESPONSE INTERCEPTOR
========================================= */

api.interceptors.response.use(

  (response) => {

    return response

  },

  async (error) => {

    const originalRequest = error.config

    console.log(

      'API ERROR:',

      error.response?.status,

      error.response?.data

    )

    /* =====================================
       NO RESPONSE
    ===================================== */

    if(!error.response){

      toast.error(

        'Server is waking up. Please wait and try again.',

        {

          duration:6000

        }

      )

      return Promise.reject(error)

    }

    /* =====================================
       401 UNAUTHORIZED
    ===================================== */

    if(

      error.response?.status === 401

      &&

      !originalRequest._retry

    ){

      originalRequest._retry = true

      try{

        const refreshToken =

          localStorage.getItem(

            'refreshToken'

          )

        if(!refreshToken){

          throw new Error(

            'No refresh token'

          )

        }

        const { data } = await axios.post(

          `${BASE_URL}/auth/refresh`,

          null,

          {

            headers:{

              'Refresh-Token': refreshToken

            },

            timeout:60000

          }

        )

        /* SAVE NEW TOKEN */

        localStorage.setItem(

          'token',

          data.accessToken

        )

        localStorage.setItem(

          'accessToken',

          data.accessToken

        )

        /* RETRY REQUEST */

        originalRequest.headers.Authorization =

          `Bearer ${data.accessToken}`

        return api(originalRequest)

      }

      catch(refreshError){

        console.log(

          'REFRESH ERROR:',

          refreshError

        )

        localStorage.clear()

        toast.error(

          'Session expired. Please login again.'

        )

        window.location.href = '/login'

        return Promise.reject(refreshError)

      }

    }

    /* =====================================
       403 FORBIDDEN
    ===================================== */

    if(error.response?.status === 403){

      toast.error(

        'Access denied. Invalid token or permissions.'

      )

    }

    /* =====================================
       404 NOT FOUND
    ===================================== */

    if(error.response?.status === 404){

      toast.error(

        'API endpoint not found.'

      )

    }

    /* =====================================
       500 SERVER ERROR
    ===================================== */

    if(error.response?.status === 500){

      toast.error(

        'Internal server error.'

      )

    }

    /* =====================================
       503 SERVICE UNAVAILABLE
    ===================================== */

    if(error.response?.status === 503){

      toast.error(

        'Server is starting. Try again in 30 seconds.',

        {

          duration:6000

        }

      )

    }

    return Promise.reject(error)

  }

)

export default api
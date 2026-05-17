import { Navigate, useLocation } from 'react-router-dom'

/* =========================================
   PRIVATE ROUTE
========================================= */

export function PrivateRoute({ children }) {

  const location = useLocation()

  /* GET TOKEN */

  const token = localStorage.getItem('token')

  /* NO TOKEN */

  if (!token) {

    return (

      <Navigate

        to="/login"

        state={{ from: location }}

        replace

      />

    )

  }

  return children

}

/* =========================================
   ROLE ROUTE
========================================= */

export function RoleRoute({

  children,

  allowedRoles

}) {

  /* GET USER */

  const user = JSON.parse(

    localStorage.getItem('user')

  )

  /* NO USER */

  if (!user) {

    return <Navigate to="/login" replace />

  }

  /* ROLE */

  const role =

    user.role?.toUpperCase()

  console.log('CURRENT ROLE:', role)

  /* ACCESS CHECK */

  const hasAccess = allowedRoles.some(

    (allowedRole) =>

      role?.includes(

        allowedRole.toUpperCase()

      )

  )

  /* ACCESS DENIED */

  if (!hasAccess) {

    let redirect = '/patient/dashboard'

    if(role?.includes('ADMIN')){

      redirect = '/admin/dashboard'

    }

    else if(role?.includes('HOSPITAL')){

      redirect = '/hospital/dashboard'

    }

    return (

      <Navigate

        to={redirect}

        replace

      />

    )

  }

  return children

}
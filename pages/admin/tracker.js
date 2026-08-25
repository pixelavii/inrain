// pages/tracker.jsx
import { Footer } from '@/components/footer/footer'
import { Navbar } from '@/components/navbar/navbar'
import { useState, useEffect } from 'react'
import Button from '@mui/material/Button'
import TripHistory from '@/components/Map/TravelData'
import ExpenseTable from '@/components/Map/ExpenseTable'

// disable SSR for the map component itself
// const LeafletMap = dynamic(() => import('@/components/Map/Leaflet'), {
//   ssr: false
// })

export default function TrackerPage () {
  const [position, setPosition] = useState({ lat: 51.505, lng: -0.09 })
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState({ id: '', name: '' })
  const [trip, setTrip] = useState([])
  const [tripCoordinates, setTripCoordinate] = useState([])
  const [openingBalance, setOpeningBalance] = useState('')
  const [showLedger, setShowLedger] = useState(false)

  const [date, setDate] = useState('')
  const [conveyanceMonth, setConveyanceMonth] = useState('')
  const [expenseMonth, setExpenseMonth] = useState('')

  // Live-track via browser geolocation
  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
      },
      err => console.error(err),
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Load users once on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true)
        const res = await fetch('/api/map/users', { method: 'GET' })
        if (res.ok) {
          const result = await res.json()
          setUsers(result)
          if (result.length > 0) setSelectedUserId(result[0].id)
        } else {
          setUsers([])
        }
      } catch (err) {
        setUsers([])
      } finally {
        setUsersLoading(false)
      }
    }
    loadUsers()
  }, [])

  const handleUserChange = e => {
    const id = e.target.value

    const selectedUser = users.find(user => String(user.id) === String(id))

    setSelectedUserId({
      id: selectedUser?.id ?? '',
      name: selectedUser?.name ?? ''
    })
  }

  const handleGetConveyance = async () => {
    if (!selectedUserId || !conveyanceMonth) return
    console.log('Fetch conveyance for', selectedUserId, conveyanceMonth)
    // wire this up to your actual endpoint, e.g.
    // fetch(`/api/conveyance?userId=${selectedUserId}&month=${conveyanceMonth}`)
  }

  // const handleGetExpenses = async () => {
  //   if (!selectedUserId || !expenseMonth) return
  //   console.log('Fetch expenses for', selectedUserId, expenseMonth)
  //   setUsersLoading(true)
  //   try {
  //     const data = await fetch(
  //       `/api/map/expense?userId=${selectedUserId}&month=${expenseMonth}`,
  //       { method: 'GET' }
  //     )
  //     const result = await data.json()
  //     console.log('THis is the result', result)
  //   } catch (err) {
  //     console.log(err)
  //   } finally {
  //     setUsersLoading(false)
  //   }
  // }

  const handleGetExpenses = () => {
    if (!selectedUserId || !expenseMonth) return
    const name = selectedUserId.name.split(' ')[0].trim()

    const params = new URLSearchParams({
      userId: selectedUserId.id,
      month: expenseMonth,
      format: 'csv',
      openingBalance: openingBalance,
      companyName: 'InRain Construction Pvt Ltd.',
      userName: name
    })
    window.location.href = `/api/map/expense?${params.toString()}`
  }

  const handleShowExpenses = () => {
    if (!selectedUserId || !expenseMonth) return
  }

  async function getUserTravelDetails () {
    if (!selectedUserId || !date) return
    setUsersLoading(true)
    try {
      const data = await fetch(
        `/api/map/travel-data?userId=${selectedUserId.id}&month=${date}`,
        { method: 'GET' }
      )
      const result = await data.json()
      setTrip(result)
    } catch (err) {
      console.log(err)
      setTrip([])
    } finally {
      setUsersLoading(false)
    }
  }

  const getMapRoute = async id => {
    if (!id) return
    setUsersLoading(true)
    try {
      const data = await fetch(`/api/map/trip-data?tripID=${id}`, {
        method: 'GET'
      })
      const result = await data.json()
      setTripCoordinate(result)
    } catch (err) {
      console.log(err)
      setTripCoordinate(null)
    } finally {
      setUsersLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <div className='min-h-screen bg-slate-50'>
        <div className='mx-auto max-w-6xl px-6 py-10'>
          <div className='mb-8'>
            <h1 className='text-2xl font-semibold text-slate-900'>
              Employee Dashboard
            </h1>
            <p className='text-sm text-slate-500'>
              Track team location, conveyance, and expenses.
            </p>
          </div>

          {/* User + date selection */}
          <section className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
            <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <label
                htmlFor='user'
                className='mb-2 block text-sm font-medium text-slate-700'
              >
                User
              </label>

              <select
                id='user'
                value={selectedUserId.id}
                onChange={handleUserChange}
                name='user'
                disabled={usersLoading}
                className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50'
              >
                <option value=''>Select User</option>

                {usersLoading && <option disabled>Loading users…</option>}

                {!usersLoading && users.length === 0 && (
                  <option disabled>No users found</option>
                )}

                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <label
                htmlFor='date'
                className='mb-2 block text-sm font-medium text-slate-700'
              >
                Date
              </label>
              <input
                id='month'
                type='month'
                value={date}
                onChange={e => setDate(e.target.value)}
                className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200'
              />
            </div>

            <div className='flex items-center justify-center'>
              <Button
                onClick={getUserTravelDetails}
                variant='contained'
                className='p-3 bg-sky-500 rounded-xl'
              >
                Get Travel Details
              </Button>
            </div>
          </section>

          {/* Trip history */}
          {/* <section className='mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <h3 className='mb-3 text-sm font-semibold text-slate-900'>
              Trip History
            </h3>
            <TripHistory getMapRoute={getMapRoute} trips={trip} />
          </section> */}

          {/* Reports */}
          <section className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <h3 className='mb-3 text-sm font-semibold text-slate-900'>
                Conveyance details
              </h3>
              <label
                htmlFor='conveyance-month'
                className='mb-2 block text-xs text-slate-500'
              >
                Select month and year
              </label>
              <div className='flex gap-2'>
                <input
                  id='conveyance-month'
                  type='month'
                  value={conveyanceMonth}
                  onChange={e => setConveyanceMonth(e.target.value)}
                  className='flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200'
                />
                <button
                  type='button'
                  disabled={!conveyanceMonth}
                  onClick={handleGetConveyance}
                  className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
                >
                  Get
                </button>
              </div>
            </div>

            <div className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
              <h3 className='mb-3 text-sm font-semibold text-slate-900'>
                Expense details
              </h3>
              <label
                htmlFor='expense-month'
                className='mb-2 block text-xs text-slate-500'
              >
                Select month and year
              </label>
              <div className='flex gap-2'>
                <input
                  id='expense-month'
                  type='month'
                  value={expenseMonth}
                  onChange={e => setExpenseMonth(e.target.value)}
                  className='flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200'
                />
                <input
                  id='opening-balance'
                  type='text'
                  value={openingBalance}
                  placeholder='Opening Balance'
                  onChange={e => setOpeningBalance(e.target.value)}
                  className='flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200'
                />
                <button
                  type='button'
                  disabled={!expenseMonth}
                  onClick={handleGetExpenses}
                  className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
                >
                  Get
                </button>
                <button
                  type='button'
                  disabled={!expenseMonth}
                  onClick={() => setShowLedger(true)}
                  className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
                >
                  Show
                </button>
              </div>
            </div>
          </section>

          {/* Live tracker — LeafletMap left exactly as-is */}
          {/* <section className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
            <h3 className='mb-3 text-sm font-semibold text-slate-900'>
              Live tracker
            </h3>
            <LeafletMap
              lat={tripCoordinates?.latitude}
              lng={tripCoordinates?.longitude}
              zoom={15}
              routePoints={tripCoordinates}
            />
          </section> */}

          <ExpenseTable
            isOpen={showLedger}
            onClose={() => setShowLedger(false)}
            userId={selectedUserId.id}
            month={expenseMonth}
            openingBalance={openingBalance}
            companyName='InRain Construction Pvt Ltd.'
            userName={selectedUserId.name}
          />
        </div>
      </div>

      <Footer />
    </>
  )
}

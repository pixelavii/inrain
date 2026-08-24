import { Button } from '@mui/material'

const formatDate = date => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = timestamp => {
  return new Date(Number(timestamp)).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (start, end) => {
  const diff = Number(end) - Number(start)

  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)

  if (hrs) return `${hrs}h ${mins}m`
  if (mins) return `${mins}m ${secs}s`

  return `${secs}s`
}

export default function TripHistory ({ trips, getMapRoute }) {
  if (!trips.length)
    return (
      <div className='m-3'>
        <div className='text-center'>
          <h2 className='text-lg font-semibold text-gray-800'>
            🚗 No trips found
          </h2>
        </div>
      </div>
    )
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-5'>
      {trips.map(trip => (
        <div
          key={trip.id}
          className='bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transition duration-300'
        >
          <div className='flex justify-between items-center p-3 border-b'>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>
                🚗 Trip #{trip.id}
              </h2>
            </div>

            <span className='text-sm font-medium text-gray-500'>
              {formatDate(trip.created_at)}
            </span>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-5 gap-4 items-center p-4'>
            <div>
              <p className='text-gray-500 text-sm'>Distance</p>

              <p className='text-lg font-semibold text-blue-600'>
                {trip.KM.toFixed(2)} KM
              </p>
            </div>

            <div>
              <p className='text-gray-500 text-sm'>Duration</p>

              <p className='text-lg font-semibold text-purple-600'>
                {formatDuration(trip.started_at, trip.ended_at)}
              </p>
            </div>

            <div>
              <p className='text-gray-500 text-sm'>Started</p>

              <p className='font-semibold text-green-600'>
                {formatTime(trip.started_at)}
              </p>
            </div>

            <div>
              <p className='text-gray-500 text-sm'>Ended</p>

              <p className='font-semibold text-red-600'>
                {formatTime(trip.ended_at)}
              </p>
            </div>

            <div>
              <Button
                onClick={() => getMapRoute(trip.id)}
                variant='contained'
                color='primary'
              >
                See Route
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

import { supabase } from './mapdb'

const TRIP_TABLE = 'Trip'

export default async function handler (req, res) {
  if (req.method === 'GET') {
    const { tripID } = req.query // month expected as "YYYY-MM", e.g. "2026-07"

    if (!tripID) {
      return res.status(400).json({ message: 'Trip ID Required' })
    }

    try {
      const { data, error } = await supabase
        .from(TRIP_TABLE)
        .select('*')
        .eq('trip_id', tripID)
        .single()

      if (error) throw error

      const points = data.latitude.map((lat, i) => ({
        latitude: lat,
        longitude: data.longitude[i],
        timestamp: data.timestamp[i],
        accuracy: data.accuracy[i]
      }))

      return res.status(200).json(points)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

import { supabase } from './mapdb'

const TRAVEL_TABLE = 'Travel'
const TRIP_TABLE = 'Trip'

export default async function handler (req, res) {
  if (req.method === 'GET') {
    const { userId, month } = req.query // month expected as "YYYY-MM", e.g. "2026-07"

    if (!userId || !month) {
      return res.status(400).json({ message: 'userId and month are required' })
    }

    // Build the start and end boundaries of the given month
    const startDate = `${month}-01T00:00:00.000Z`
    const endDate = new Date(
      Date.UTC(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)), // next month (JS Date months are 0-indexed, so this rolls over correctly)
        1
      )
    ).toISOString()

    console.log(userId, month, startDate, endDate)

    try {
      const { data, error } = await supabase
        .from(TRAVEL_TABLE)
        .select('*')
        .eq('User_ID', userId)
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      return res.status(200).json(data)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}

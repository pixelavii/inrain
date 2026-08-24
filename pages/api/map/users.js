import { supabase } from './mapdb'

export default async function handler (req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return await res.status(200).json(data)
    } catch (err) {
      console.error(err)
      return res.status(500).json({ message: 'Server error' })
    }
  }
}

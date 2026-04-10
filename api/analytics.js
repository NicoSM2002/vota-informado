import { createClient } from '@supabase/supabase-js'

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple password protection
  const password = req.headers['x-admin-password'] || req.query.password
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }

  try {
    // Get all logs
    const { data: logs, error } = await supabase
      .from('chat_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) throw error

    // Calculate stats
    const totalQuestions = logs.length
    const candidateCounts = {}
    const comparisonCounts = {}
    const questionsByDay = {}
    const recentQuestions = logs.slice(0, 50)

    for (const log of logs) {
      // Count by candidate
      candidateCounts[log.candidate_id] = (candidateCounts[log.candidate_id] || 0) + 1

      // Count comparisons
      if (log.is_comparison && log.compared_with) {
        for (const comp of log.compared_with) {
          const pair = [log.candidate_id, comp].sort().join(' vs ')
          comparisonCounts[pair] = (comparisonCounts[pair] || 0) + 1
        }
      }

      // Count by day
      const day = log.created_at?.split('T')[0] || 'unknown'
      questionsByDay[day] = (questionsByDay[day] || 0) + 1
    }

    res.json({
      totalQuestions,
      candidateCounts,
      comparisonCounts,
      questionsByDay,
      recentQuestions,
    })
  } catch (err) {
    console.error('Analytics error:', err.message)
    res.status(500).json({ error: 'Error fetching analytics' })
  }
}

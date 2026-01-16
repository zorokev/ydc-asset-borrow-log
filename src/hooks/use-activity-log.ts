import { useCallback, useEffect, useState } from "react"

import { supabase } from "@/lib/supabase/client"

export interface ActivityEntry {
  id: string
  borrow_request_id: string
  action: string
  actor_id: string | null
  notes: string | null
  created_at: string
}

interface UseActivityLogResult {
  data: ActivityEntry[]
  loading: boolean
  error: string | null
  refresh: (requestId: string) => Promise<void>
}

export function useActivityLog(requestId: string | undefined): UseActivityLogResult {
  const [data, setData] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      const { data: rows, error: err } = await supabase
        .from("activity_log")
        .select("*")
        .eq("borrow_request_id", id)
        .order("created_at", { ascending: false })

      if (err) {
        setError(err.message)
        setData([])
      } else if (rows) {
        setData(rows as ActivityEntry[])
      }
      setLoading(false)
    },
    []
  )

  useEffect(() => {
    if (requestId) {
      fetchData(requestId)
    }
  }, [requestId, fetchData])

  return { data, loading, error, refresh: fetchData }
}

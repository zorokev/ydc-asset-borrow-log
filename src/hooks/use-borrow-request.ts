import { useEffect, useState, useCallback } from "react"

import { supabase } from "@/lib/supabase/client"
import type { BorrowRequest } from "@/types/borrow"

interface UseBorrowRequestResult {
  data: BorrowRequest | null
  loading: boolean
  error: string | null
  refresh: (id: string) => Promise<void>
}

export function useBorrowRequest(id: string | undefined): UseBorrowRequestResult {
  const [data, setData] = useState<BorrowRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(
    async (requestId: string) => {
      setLoading(true)
      setError(null)
      const { data: row, error: err } = await supabase
        .from("borrow_requests")
        .select("*")
        .eq("id", requestId)
        .single()

      if (err) {
        setError(err.message)
        setData(null)
      } else if (row) {
        setData(row as BorrowRequest)
      }
      setLoading(false)
    },
    []
  )

  useEffect(() => {
    if (id) fetchData(id)
  }, [id, fetchData])

  return { data, loading, error, refresh: fetchData }
}

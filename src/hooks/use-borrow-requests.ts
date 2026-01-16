import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase/client"
import type { BorrowRequest, BorrowStatus } from "@/types/borrow"

interface UseBorrowRequestsResult {
  data: BorrowRequest[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateStatus: (opts: {
    id: string
    status: BorrowStatus
    due_at?: string
    notes?: string
  }) => Promise<void>
}

export function useBorrowRequests(): UseBorrowRequestsResult {
  const [data, setData] = useState<BorrowRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rows, error: err } = await supabase
      .from("borrow_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (err) {
      setError(err.message)
      toast.error("Failed to load borrow requests")
    } else if (rows) {
      setData(rows as BorrowRequest[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateStatus = useCallback(
    async ({
      id,
      status,
      due_at,
      notes,
    }: {
      id: string
      status: BorrowStatus
      due_at?: string
      notes?: string
    }) => {
      const { data: userData } = await supabase.auth.getUser()
      const actorId = userData.user?.id ?? null

      const { error: updateError } = await supabase
        .from("borrow_requests")
        .update({
          status,
          due_at: due_at ?? undefined,
        })
        .eq("id", id)

      if (updateError) {
        toast.error("Failed to update request")
        return
      }

      await supabase.from("activity_log").insert({
        borrow_request_id: id,
        action: actionLabel(status, due_at),
        actor_id: actorId,
        notes: notes ?? "",
      })

      toast.success(`Status updated to ${status}`)
      fetchData()
    },
    [fetchData]
  )

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    updateStatus,
  }
}

function actionLabel(status: BorrowStatus, due_at?: string) {
  if (due_at) return "extend"
  return `status:${status}`
}

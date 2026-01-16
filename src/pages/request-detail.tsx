import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Loader2,
  Printer,
  Shield,
  Ticket,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import type { BorrowRequest } from "@/types/borrow"
import { useBorrowRequest } from "@/hooks/use-borrow-request"
import { useActivityLog } from "@/hooks/use-activity-log"
import { toast } from "sonner"

const exampleRequest: BorrowRequest = {
  id: "1",
  request_code: "ABL-20260116-0001",
  ticket_id: "IT-12345",
  borrower_name: "Alex Reyes",
  borrower_email: "alex@example.com",
  department: "IT",
  asset_type: "laptop",
  asset_label: "LT-001",
  reason: "Home connectivity issue",
  status: "borrowed",
  borrowed_at: new Date().toISOString(),
  due_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
  returned_at: null,
  it_owner: null,
  notes: "Placeholder data; wire to Supabase",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function RequestDetailPage() {
  const params = useParams()
  const { data, loading, error } = useBorrowRequest(params.id)
  const { data: activity, loading: activityLoading, refresh: refreshActivity } = useActivityLog(
    params.id
  )
  const req = useMemo(() => data || exampleRequest, [data])
  const overdue =
    req.status !== "returned" && new Date(req.due_at).getTime() < Date.now()
  const [action, setAction] = useState<"return" | "extend" | "lost" | null>(null)
  const [dueInput, setDueInput] = useState("")
  const [reasonInput, setReasonInput] = useState("")

  const refreshAll = async () => {
    if (params.id) {
      await Promise.all([refreshActivity(params.id)])
    }
  }

  const handleAction = async () => {
    if (!params.id || !action) return
    if (action === "extend" && !dueInput) {
      toast.error("Due date is required for extension")
      return
    }
    const { data: userData } = await supabase.auth.getUser()
    const actorId = userData.user?.id ?? null
    const { error: updateError } = await supabase
      .from("borrow_requests")
      .update({
        status: action === "return" ? "returned" : action === "lost" ? "lost" : req.status,
        due_at: action === "extend" ? dueInput : undefined,
      })
      .eq("id", params.id)
    if (updateError) {
      toast.error("Failed to update request")
      return
    }
    await supabase.from("activity_log").insert({
      borrow_request_id: params.id,
      action: action === "extend" ? "extend" : `status:${action}`,
      actor_id: actorId,
      notes: reasonInput,
    })
    toast.success("Update saved")
    setAction(null)
    setDueInput("")
    setReasonInput("")
    refreshAll()
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground print-only">
            Asset Borrow Log • Print copy
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {req.request_code}
          </h1>
          <p className="text-muted-foreground">
            Ticket {req.ticket_id} • {req.asset_type} • Borrower {req.borrower_name}
          </p>
          {error && (
            <p className="text-xs text-destructive">
              Unable to load live data (showing placeholder): {error}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="print-hidden"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Badge className="self-start bg-blue-500 text-white print-hidden">
            {req.status}
          </Badge>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading request...
        </div>
      )}

      <Card className="print-hidden">
        <CardHeader className="pb-3">
          <CardDescription>Actions</CardDescription>
          <CardTitle className="text-lg">Status control</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="sm" onClick={() => setAction("return")}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark returned
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAction("extend")}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Extend due (requires reason)
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setAction("lost")}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Mark lost
          </Button>
        </CardContent>
      </Card>

      <Card className="print-card print-area">
        <CardHeader className="pb-3">
          <CardDescription>Borrow details</CardDescription>
          <CardTitle className="text-lg">Printable summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-md border border-dashed p-3 print-only">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ticket</p>
                <p className="font-mono text-sm">{req.ticket_id}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Borrower</p>
              <p className="font-medium">{req.borrower_name}</p>
              <p className="text-xs text-muted-foreground">{req.borrower_email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{req.department}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Asset type</p>
              <p className="font-medium capitalize">{req.asset_type}</p>
              <p className="text-xs text-muted-foreground">{req.asset_label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ticket ID</p>
              <p className="font-mono text-sm">{req.ticket_id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Borrowed at</p>
              <p className="font-medium">{formatDateTime(req.borrowed_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Due at</p>
              <p className={`font-medium ${overdue ? "text-red-500" : ""}`}>
                {formatDateTime(req.due_at)}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Reason</p>
            <p className="text-sm">{req.reason}</p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2 print-area">
            <div className="rounded-md border border-dashed p-3 signature-block">
              <p className="text-xs text-muted-foreground">Borrower signature</p>
              <div className="h-12" />
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">Date: ____________</p>
            </div>
            <div className="rounded-md border border-dashed p-3 signature-block">
              <p className="text-xs text-muted-foreground">IT signature</p>
              <div className="h-12" />
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">Date: ____________</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            On due-date extensions, reprint and re-sign this agreement; attach both copies to the ticket.
          </p>
        </CardContent>
      </Card>

      <Card className="print-card print-area">
        <CardHeader className="pb-3">
          <CardDescription>Audit preview</CardDescription>
          <CardTitle className="text-lg">Activity log skeleton</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {activityLoading && (
            <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activity...
            </div>
          )}
          {!activityLoading && activity.length === 0 && (
            <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 p-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>No activity logged yet.</span>
            </div>
          )}
          {!activityLoading &&
            activity.map((entry) => (
              <div key={entry.id} className="rounded-md border border-dashed p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">{entry.action}</Badge>
                  <span className="font-mono">{formatDateTime(entry.created_at)}</span>
                  {entry.notes && (
                    <span className="text-muted-foreground">Note: {entry.notes}</span>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <div className="print-only mt-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Asset Borrow Log - IT Department</p>
        <p>Request: {req.request_code} | Ticket: {req.ticket_id}</p>
        <p>Please return assets on or before the due date. For questions, contact IT.</p>
      </div>

      <Dialog open={action !== null} onOpenChange={() => setAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === "extend"
                ? "Extend due date"
                : action === "lost"
                  ? "Mark lost"
                  : "Mark returned"}
            </DialogTitle>
            <DialogDescription>
              {action === "extend"
                ? "Set a new due date and capture the reason. Remember to reprint and re-sign."
                : action === "lost"
                  ? "Capture notes about the lost item for audit."
                  : "Confirm the asset has been returned."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {action === "extend" && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">New due date/time</p>
                <Input
                  type="datetime-local"
                  value={dueInput}
                  onChange={(e) => setDueInput(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Notes (optional)</p>
              <Textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Reason or notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAction}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

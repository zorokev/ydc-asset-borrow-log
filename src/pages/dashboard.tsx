import { useMemo, useState } from "react"
import { CheckCircle2, Eye, List, MoreHorizontal, PackageSearch } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Toggle } from "@/components/ui/toggle"
import { Textarea } from "@/components/ui/textarea"
import type { BorrowRequest, BorrowStatus } from "@/types/borrow"
import { useBorrowRequests } from "@/hooks/use-borrow-requests"

const mockRequests: BorrowRequest[] = [
  {
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
    due_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // due soon
    returned_at: null,
    it_owner: null,
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    request_code: "ABL-20260114-0002",
    ticket_id: "IT-12222",
    borrower_name: "Jamie Cruz",
    borrower_email: "jamie@example.com",
    department: "Ops",
    asset_type: "monitor",
    asset_label: "MN-210",
    reason: "Temporary desk setup",
    status: "overdue",
    borrowed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // overdue
    returned_at: null,
    it_owner: null,
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    request_code: "ABL-20260110-0003",
    ticket_id: "IT-12001",
    borrower_name: "Rina Lopez",
    borrower_email: "rina@example.com",
    department: "Finance",
    asset_type: "yubikey",
    asset_label: "YK-09",
    reason: "MFA replacement",
    status: "returned",
    borrowed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    returned_at: new Date().toISOString(),
    it_owner: null,
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const statusColors: Record<BorrowStatus, string> = {
  pending: "bg-amber-500 text-white",
  approved: "bg-blue-500 text-white",
  borrowed: "bg-blue-500 text-white",
  returned: "bg-emerald-500 text-white",
  overdue: "bg-red-500 text-white",
  lost: "bg-red-500 text-white",
}

function formatDateShort(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isOverdue(item: BorrowRequest) {
  return item.status !== "returned" && new Date(item.due_at).getTime() < Date.now()
}

function isDueSoon(item: BorrowRequest) {
  const due = new Date(item.due_at).getTime()
  const now = Date.now()
  return item.status !== "returned" && due >= now && due <= now + 24 * 60 * 60 * 1000
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const { data, loading, error, updateStatus } = useBorrowRequests()
  const navigate = useNavigate()
  const [action, setAction] = useState<"return" | "extend" | "lost" | null>(null)
  const [selected, setSelected] = useState<BorrowRequest | null>(null)
  const [dueInput, setDueInput] = useState("")
  const [reasonInput, setReasonInput] = useState("")

  const items = data.length ? data : mockRequests

  const stats = useMemo(() => {
    const active = items.filter((r) => r.status !== "returned")
    const dueSoon = active.filter(isDueSoon)
    const overdue = active.filter(isOverdue)
    const returnedThisWeek = items.filter((r) => {
      if (!r.returned_at) return false
      const returned = new Date(r.returned_at).getTime()
      return returned >= Date.now() - 7 * 24 * 60 * 60 * 1000
    })
    const durations = items
      .filter((r) => r.returned_at)
      .map((r) => new Date(r.returned_at!).getTime() - new Date(r.borrowed_at).getTime())
    const avgDuration =
      durations.length > 0
        ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / (24 * 60 * 60 * 1000))} days`
        : "--"
    return {
      active: active.length,
      dueSoon: dueSoon.length,
      overdue: overdue.length,
      returnedThisWeek: returnedThisWeek.length,
      avgDuration,
    }
  }, [items])

  const handleAction = async (action: "return" | "extend" | "lost", item: BorrowRequest) => {
    if (loading) return
    setSelected(item)
    setAction(action)
    setDueInput("")
    setReasonInput("")
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between print-hidden">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">IT dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">Borrow monitoring</h1>
          <p className="text-muted-foreground">
            Toggleable card/table views with overdue cues, SLA stats, and quick actions for
            return/extend/lost.
          </p>
          {error && (
            <p className="text-xs text-destructive">Data load issue: {error}. Showing mock data.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Toggle
            pressed={viewMode === "grid"}
            onPressedChange={() => setViewMode("grid")}
            aria-label="Card view"
          >
            <Eye className="mr-2 h-4 w-4" />
            Cards
          </Toggle>
          <Toggle
            pressed={viewMode === "table"}
            onPressedChange={() => setViewMode("table")}
            aria-label="Table view"
          >
            <List className="mr-2 h-4 w-4" />
            Table
          </Toggle>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 print-hidden">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active borrows</CardDescription>
            <CardTitle className="text-2xl text-blue-500">{stats.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">status != returned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due in 24h</CardDescription>
            <CardTitle className="text-2xl text-amber-500">{stats.dueSoon}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">due_at within 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl text-red-500">{stats.overdue}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">now &gt; due_at, not returned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Returned this week</CardDescription>
            <CardTitle className="text-2xl text-emerald-500">{stats.returnedThisWeek}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">returned_at last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg duration</CardDescription>
            <CardTitle className="text-2xl">{stats.avgDuration}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">returned_at - borrowed_at</p>
          </CardContent>
        </Card>
      </div>

      <div className="print-only rounded-md border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
        SLA snapshot (print): Active {stats.active} | Due soon {stats.dueSoon} | Overdue{" "}
        {stats.overdue} | Returned this week {stats.returnedThisWeek} | Avg duration{" "}
        {stats.avgDuration}
      </div>
      <div className="print-only mt-2 rounded-md border border-dashed bg-muted/10 p-3 text-[11px] text-muted-foreground">
        For returns, submit signed copy to IT. Contact IT desk if overdue or due soon items cannot be returned by the deadline.
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const overdue = isOverdue(item)
            const dueSoon = isDueSoon(item)
            return (
              <Card
                key={item.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  overdue ? "border-red-500/60" : dueSoon ? "border-amber-400/60" : ""
                }`}
                onClick={() => navigate(`/request/${item.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{item.asset_type}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.request_code}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Row actions"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction("return", item)}>
                          Mark returned
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("extend", item)}>
                          Extend due
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleAction("lost", item)}
                        >
                          Mark lost
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[item.status]}>{item.status}</Badge>
                    {overdue ? (
                      <span className="text-xs font-medium text-red-500">Overdue</span>
                    ) : dueSoon ? (
                      <span className="text-xs font-medium text-amber-600">Due soon</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">On track</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{item.borrower_name}</p>
                    <p className="text-xs text-muted-foreground">{item.ticket_id}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Due: {formatDateShort(item.due_at)}</span>
                    <span>Borrowed: {formatDateShort(item.borrowed_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Actions log will record every change.</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const overdue = isOverdue(item)
                const dueSoon = isDueSoon(item)
                return (
                  <TableRow
                    key={item.id}
                    className={overdue ? "bg-red-500/5 cursor-pointer" : "cursor-pointer"}
                    onClick={() => navigate(`/request/${item.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <PackageSearch className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{item.asset_type}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {item.request_code}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[item.status]}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{item.borrower_name}</p>
                        <p className="text-xs text-muted-foreground">{item.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.ticket_id}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium">{formatDateShort(item.due_at)}</span>
                        {overdue && (
                          <span className="ml-2 text-red-500 font-semibold">Overdue</span>
                        )}
                        {!overdue && dueSoon && (
                          <span className="ml-2 text-amber-600 font-semibold">Due soon</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Row actions"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction("return", item)}>
                            Mark returned
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("extend", item)}>
                            Extend due
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleAction("lost", item)}
                          >
                            Mark lost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

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
                ? "Set a new due date/time and capture a reason."
                : action === "lost"
                  ? "Capture context for the lost item."
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
              <Button
                type="button"
                onClick={async () => {
                  if (!selected || !action) return
                  if (action === "extend" && !dueInput) {
                    alert("Due date required")
                    return
                  }
                  if (action === "extend") {
                    await updateStatus({
                      id: selected.id,
                      status: selected.status,
                      due_at: dueInput,
                      notes: reasonInput,
                    })
                  } else if (action === "return") {
                    await updateStatus({
                      id: selected.id,
                      status: "returned",
                      notes: reasonInput,
                    })
                  } else if (action === "lost") {
                    await updateStatus({
                      id: selected.id,
                      status: "lost",
                      notes: reasonInput,
                    })
                  }
                  setAction(null)
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

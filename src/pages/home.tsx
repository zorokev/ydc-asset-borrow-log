import { Link } from "react-router-dom"
import { ArrowRight, CheckCircle2, Clock3, MailCheck, Printer, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const setupTasks = [
  { label: "Theme + shadcn wiring", status: "Done" },
  { label: "Supabase schema + RLS", status: "Done" },
  { label: "Public borrow form + magic link", status: "Done" },
  { label: "Print layout with signatures", status: "Done" },
  { label: "IT dashboard + actions", status: "Done" },
  { label: "Reminder job + CI pipeline", status: "In progress" },
]

export default function HomePage() {
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Asset Borrow Log</p>
          <h1 className="text-2xl font-bold tracking-tight">Borrow, track, and return on time</h1>
          <p className="text-muted-foreground">
            Public borrow form with magic-link confirmation, IT dashboard with SLA cards and overdue
            cues, printable agreements with signature blocks, and daily reminders.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/request">
              <Printer className="mr-2 h-4 w-4" />
              Borrow &amp; print
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/dashboard">
              Go to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Progress</CardDescription>
          <CardTitle className="text-lg">Delivery checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {setupTasks.map((task) => (
              <div
                key={task.label}
                className={`flex items-center justify-between rounded-md border p-3 ${
                  task.status === "Done"
                    ? "border-primary/30 bg-primary/5"
                    : task.status === "In progress"
                      ? "border-amber-300/60 bg-amber-50 text-amber-700"
                      : "border-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      task.status === "Done"
                        ? "text-primary"
                        : task.status === "In progress"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">{task.label}</span>
                </div>
                <Badge
                  variant={
                    task.status === "Done"
                      ? "secondary"
                      : task.status === "In progress"
                        ? "outline"
                        : "outline"
                  }
                >
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>

          <Tabs defaultValue="borrower">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="borrower">Borrower flow</TabsTrigger>
              <TabsTrigger value="it">IT flow</TabsTrigger>
            </TabsList>
            <TabsContent value="borrower" className="space-y-3 pt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-md border border-dashed bg-primary/5 p-3 text-foreground">
                <MailCheck className="h-4 w-4 text-primary" />
                <span>Borrowers sign in via magic link before saving the form.</span>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 p-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Default due date is +1 day; future-only validation enforced.</span>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 p-3">
                <Printer className="h-4 w-4 text-muted-foreground" />
                <span>Print-ready copy includes borrower + IT signatures and reprint guidance.</span>
              </div>
            </TabsContent>
            <TabsContent value="it" className="space-y-3 pt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 rounded-md border border-dashed bg-destructive/5 p-3 text-destructive">
                <Shield className="h-4 w-4" />
                <span>Overdue items auto-flag red; daily reminders to borrower + IT.</span>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/50 p-3">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                <span>SLA cards, table/card views, quick actions for return/extend/lost, and activity log.</span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}

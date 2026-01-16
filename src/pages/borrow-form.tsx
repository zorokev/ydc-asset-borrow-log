import { zodResolver } from "@hookform/resolvers/zod"
import { addDays, formatISO } from "date-fns"
import {
  CalendarClock,
  Check,
  FileText,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Ticket,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import type { AssetType } from "@/types/borrow"
import { toast } from "sonner"

const assetTypes: { value: AssetType; label: string }[] = [
  { value: "headset", label: "Headset" },
  { value: "yubikey", label: "YubiKey" },
  { value: "keyboard", label: "Keyboard" },
  { value: "mouse", label: "Mouse" },
  { value: "laptop", label: "Laptop" },
  { value: "monitor", label: "Monitor" },
  { value: "lan_cable", label: "LAN Cable" },
  { value: "hdmi", label: "HDMI" },
  { value: "power_cable", label: "Power Cable" },
  { value: "projector", label: "Projector" },
  { value: "projector_screen", label: "Projector Screen" },
  { value: "led_tv", label: "LED TV" },
  { value: "flashdrive", label: "Flashdrive" },
  { value: "ups", label: "UPS" },
  { value: "type_c_adaptor", label: "Type C adaptor" },
  { value: "nuc", label: "NUC" },
  { value: "other", label: "Other" },
]

const formSchema = z.object({
  borrower_name: z.string().min(2, "Name is required"),
  borrower_email: z.string().email("Valid company email required"),
  department: z.string().optional(),
  ticket_id: z.string().regex(/^[A-Za-z0-9-]{4,}$/, "Ticket ID must be at least 4 chars"),
  asset_type: z.string().min(1, "Asset type is required"),
  asset_label: z.string().optional(),
  reason: z.string().min(4, "Reason is required"),
  due_at: z.string().min(1, "Due date is required"),
})

type FormValues = z.infer<typeof formSchema>

export default function BorrowFormPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [sendingLink, setSendingLink] = useState(false)

  const defaultDue = useMemo(() => formatISO(addDays(new Date(), 1)).slice(0, 16), [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      borrower_name: "",
      borrower_email: "",
      department: "",
      ticket_id: "",
      asset_type: "",
      asset_label: "",
      reason: "",
      due_at: defaultDue,
    },
  })

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSessionEmail(data.session?.user.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const requestMagicLink = async () => {
    const email = form.getValues("borrower_email")
    if (!email) {
      form.setError("borrower_email", { message: "Enter your email to receive a magic link" })
      return
    }
    setSendingLink(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    })
    setSendingLink(false)
    if (error) {
      toast.error("Could not send magic link. Try again.")
      return
    }
    toast.success("Magic link sent. Check your email to complete sign-in.")
  }

  const onSubmit = async (values: FormValues) => {
    const sessionMatch =
      sessionEmail && sessionEmail.toLowerCase() === values.borrower_email.toLowerCase()
    if (!sessionMatch) {
      toast.error("Sign in with a magic link using the same email before submitting.")
      return
    }
    setStatus("submitting")
    try {
      const { error } = await supabase.from("borrow_requests").insert({
        borrower_name: values.borrower_name,
        borrower_email: values.borrower_email.toLowerCase(),
        department: values.department,
        ticket_id: values.ticket_id,
        asset_type: values.asset_type as AssetType,
        asset_label: values.asset_label,
        reason: values.reason,
        due_at: values.due_at,
        status: "pending",
      })

      if (error) {
        throw error
      }

      setStatus("success")
      toast.success("Request saved. Print the agreement and return to IT.")
      form.reset({ ...form.getValues(), due_at: defaultDue })
    } catch (err) {
      console.error(err)
      setStatus("error")
      toast.error("Could not submit right now. Please try again.")
    }
  }

  const emailMatchesSession =
    sessionEmail &&
    form.watch("borrower_email") &&
    sessionEmail.toLowerCase() === form.watch("borrower_email").toLowerCase()

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Borrow form (public)</p>
          <h1 className="text-2xl font-bold tracking-tight">Request an asset</h1>
          <p className="text-muted-foreground">
            Magic-link sign-in will confirm your email before saving. Due date defaults
            to +1 day; IT can extend with a required reason and prompt reprint.
          </p>
        </div>
        <Badge variant="outline" className="self-start">
          Email confirmation required
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardDescription>Fill out to borrow an IT asset</CardDescription>
          <CardTitle className="text-lg">Borrow details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="borrower_name">Borrower name</Label>
                <Input
                  id="borrower_name"
                  placeholder="e.g., Alex Reyes"
                  {...form.register("borrower_name")}
                />
                {form.formState.errors.borrower_name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.borrower_name.message}
                  </p>
                )}
              </div>
            <div className="space-y-2">
              <Label htmlFor="borrower_email">Company email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="borrower_email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-9"
                    {...form.register("borrower_email")}
                  />
              </div>
              {form.formState.errors.borrower_email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.borrower_email.message}
                </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="Team/Dept" {...form.register("department")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_id">Ticket ID</Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="ticket_id"
                    placeholder="IT-12345"
                    className="pl-9 font-mono"
                    {...form.register("ticket_id")}
                  />
                </div>
                {form.formState.errors.ticket_id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.ticket_id.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset_type">Asset type</Label>
                <Select
                  onValueChange={(val) => form.setValue("asset_type", val)}
                  defaultValue={form.getValues("asset_type")}
                >
                  <SelectTrigger id="asset_type">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((asset) => (
                      <SelectItem key={asset.value} value={asset.value}>
                        {asset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.asset_type && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.asset_type.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset_label">Asset label/serial (optional)</Label>
                <Input
                  id="asset_label"
                  placeholder="Asset tag or serial"
                  {...form.register("asset_label")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_at">Due back (defaults +1 day)</Label>
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="due_at"
                    type="datetime-local"
                    className="pl-9"
                    min={defaultDue}
                    {...form.register("due_at")}
                  />
                </div>
                {form.formState.errors.due_at && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.due_at.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe why you need the asset"
                  rows={3}
                  {...form.register("reason")}
                />
                {form.formState.errors.reason && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.reason.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-md border border-dashed bg-muted/30 p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>
                  Print view will include signature lines and the generated request code.
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="font-medium text-primary">Borrowed at</span>
                <span>auto-set on submission</span>
              </div>
            </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={requestMagicLink}
              disabled={sendingLink}
            >
              {sendingLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Send magic link
                </>
              )}
            </Button>
            <Button
              type="submit"
              disabled={status === "submitting" || !emailMatchesSession}
              title={
                emailMatchesSession
                  ? "Submit request"
                  : "Sign in with magic link using this email first"
              }
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit request
                </>
              )}
            </Button>
            <Button variant="outline" type="button">
              Preview print layout
            </Button>
            {sessionEmail && (
              <Badge variant="outline" className="flex items-center gap-1">
                <LogOut className="h-3 w-3" />
                Signed in as {sessionEmail}
              </Badge>
            )}
          </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

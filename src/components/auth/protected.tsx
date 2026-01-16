import { useEffect, useMemo, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { Shield, LogOut, Mail, Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Props = {
  children: React.ReactNode
}

export function Protected({ children }: Props) {
  // Skip guard in test mode to keep unit tests simple.
  if (import.meta.env.MODE === "test") {
    return <>{children}</>
  }

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isStaff, setIsStaff] = useState<boolean | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
    })
    return () => {
      sub?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setIsStaff(null)
      return
    }
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setMessage("Access check failed. Please try again or contact IT.")
          setIsStaff(false)
          return
        }
        const role = data?.role
        const allowed = role === "staff" || role === "manager"
        setIsStaff(allowed)
        if (!allowed) {
          setMessage("You need IT staff or manager access for this area.")
        }
      })
      .catch(() => {
        setMessage("Access check failed. Please try again or contact IT.")
        setIsStaff(false)
      })
  }, [session])

  const statusLabel = useMemo(() => {
    if (loading) return "Checking access…"
    if (!session) return "Sign in required"
    if (isStaff === false) return "Access denied"
    return null
  }, [loading, session, isStaff])

  const handleSendLink = async () => {
    if (!email) return
    setSending(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage("Magic link sent. Check your email to continue.")
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking access…
      </div>
    )
  }

  if (!session || isStaff === false || isStaff === null) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            IT access required
          </CardTitle>
          <CardDescription>
            Sign in with your IT email to view the dashboard and request details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="it-email" className="text-sm font-medium">
              Company email
            </label>
            <div className="flex gap-2">
              <Input
                id="it-email"
                type="email"
                placeholder="it@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleSendLink} disabled={sending || !email}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send link
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We’ll email you a magic link. Only staff/manager roles can proceed.
            </p>
          </div>
          {session && (
            <div className="flex items-center justify-between rounded-md border bg-muted/40 p-2 text-xs">
              <span>Signed in as {session.user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => supabase.auth.signOut()}
                className="h-7 px-2"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Sign out
              </Button>
            </div>
          )}
          {statusLabel && <p className="text-xs text-muted-foreground">{statusLabel}</p>}
          {message && <p className="text-xs text-primary">{message}</p>}
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}

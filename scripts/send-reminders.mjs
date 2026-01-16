/**
 * Daily reminder sender for due/overdue borrow requests.
 * Uses Supabase service role to query `borrow_requests` and sends emails via Brevo (preferred) or Resend HTTP API.
 * If no key is provided, it will log the messages instead of sending.
 */
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const brevoApiKey = process.env.BREVO_API_KEY
const fromEmail = process.env.SMTP_FROM || "itdept@ydc.com.ph"

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase URL or service role key in environment.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function classifyRequests(rows) {
  const now = new Date()
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const overdue = []
  const dueSoon = []

  for (const row of rows) {
    const dueDate = new Date(row.due_at)
    if (Number.isNaN(dueDate.getTime())) continue
    if (dueDate < now) {
      overdue.push(row)
    } else if (dueDate <= soon) {
      dueSoon.push(row)
    }
  }

  return { overdue, dueSoon }
}

async function fetchActiveRequests() {
  const { data, error } = await supabase
    .from("borrow_requests")
    .select(
      "id, request_code, borrower_name, borrower_email, asset_type, ticket_id, due_at, status"
    )
    .is("returned_at", null)

  if (error) {
    throw error
  }
  return data || []
}

async function fetchStaffRecipients() {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .in("role", ["staff", "manager"])
    .not("email", "is", null)

  if (error) {
    throw error
  }
  const emails = (data || []).map((r) => r.email).filter(Boolean)
  return Array.from(new Set(emails))
}

async function sendHttpEmail({ to, subject, text, html }) {
  // Brevo (Sendinblue) HTTP API
  if (brevoApiKey) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail },
        to: (Array.isArray(to) ? to : [to]).map((email) => ({ email })),
        subject,
        textContent: text,
        htmlContent: html,
      }),
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Brevo failed (${response.status}): ${body}`)
    }
    return
  }

  // Resend fallback
  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Resend failed (${response.status}): ${body}`)
    }
    return
  }

  console.log(`[DRY-RUN] Would send to ${to}: ${subject}\n${text}`)
}

function formatLine(item) {
  return `${item.request_code} | ${item.asset_type} | Ticket ${item.ticket_id} | Due ${item.due_at} | Status ${item.status}`
}

function buildEmailSections(overdue, dueSoon) {
  const parts = []
  if (overdue.length) {
    parts.push("Overdue:\n" + overdue.map((i) => "- " + formatLine(i)).join("\n"))
  }
  if (dueSoon.length) {
    parts.push("Due within 24h:\n" + dueSoon.map((i) => "- " + formatLine(i)).join("\n"))
  }
  return parts.join("\n\n")
}

function buildHtml(overdue, dueSoon) {
  const blocks = []
  if (overdue.length) {
    blocks.push(
      `<h3>Overdue</h3><ul>${overdue
        .map(
          (i) =>
            `<li><strong>${i.request_code}</strong> — ${i.asset_type} — Ticket ${i.ticket_id} — Due ${i.due_at}</li>`
        )
        .join("")}</ul>`
    )
  }
  if (dueSoon.length) {
    blocks.push(
      `<h3>Due within 24h</h3><ul>${dueSoon
        .map(
          (i) =>
            `<li><strong>${i.request_code}</strong> — ${i.asset_type} — Ticket ${i.ticket_id} — Due ${i.due_at}</li>`
        )
        .join("")}</ul>`
    )
  }
  return blocks.join("<br/>")
}

async function notifyBorrowers(overdue, dueSoon) {
  if (process.env.REMINDERS_TEST_MODE === "true") {
    console.log("[TEST MODE] Skipping borrower emails.")
    return
  }
  const grouped = new Map()
  for (const item of [...overdue, ...dueSoon]) {
    if (!item.borrower_email) continue
    const list = grouped.get(item.borrower_email) || []
    list.push(item)
    grouped.set(item.borrower_email, list)
  }

  for (const [email, items] of grouped.entries()) {
    const section = buildEmailSections(
      items.filter((i) => overdue.includes(i)),
      items.filter((i) => dueSoon.includes(i))
    )
    const html = buildHtml(
      items.filter((i) => overdue.includes(i)),
      items.filter((i) => dueSoon.includes(i))
    )
    await sendHttpEmail({
      to: email,
      subject: "Asset Borrow Reminder",
      text: `Please return or extend your borrowed asset(s):\n\n${section}`,
      html: `<p>Please return or extend your borrowed asset(s):</p>${html}`,
    })
  }
}

async function notifyIT(overdue, dueSoon, itRecipients) {
  let targets = itRecipients
  // Fallback: use SMTP_FROM as a summary recipient when no staff profiles are found.
  if ((!targets || targets.length === 0) && fromEmail) {
    targets = [fromEmail]
    console.log(`[Info] No staff profiles found; falling back to SMTP_FROM ${fromEmail}`)
  }
  if (!targets || targets.length === 0) return
  const section = buildEmailSections(overdue, dueSoon)
  const html = buildHtml(overdue, dueSoon)
  await sendHttpEmail({
    to: targets,
    subject: "Borrow queue summary (due/overdue)",
    text: `Daily summary of due/overdue items:\n\n${section}`,
    html: `<p>Daily summary of due/overdue items:</p>${html}`,
  })
}

async function run() {
  const requests = await fetchActiveRequests()
  const { overdue, dueSoon } = classifyRequests(requests)

  if (!overdue.length && !dueSoon.length) {
    console.log("No due or overdue items. Exiting.")
    return
  }

  const staffEmails = await fetchStaffRecipients()
  await notifyBorrowers(overdue, dueSoon)
  await notifyIT(overdue, dueSoon, staffEmails)
  console.log(
    `Completed reminder run. Overdue: ${overdue.length}, Due soon: ${dueSoon.length}, Staff notified: ${staffEmails.length}`
  )
}

run().catch((err) => {
  console.error("Reminder job failed:", err)
  process.exit(1)
})

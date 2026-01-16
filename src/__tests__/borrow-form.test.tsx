import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { createClient } from "@supabase/supabase-js"
import React from "react"

import BorrowFormPage from "@/pages/borrow-form"

vi.mock("@/lib/supabase/client", () => {
  const supabase = createClient("https://example.supabase.co", "anon")
  return { supabase }
})

describe("BorrowFormPage", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("renders required fields", () => {
    render(<BorrowFormPage />)
    expect(screen.getByLabelText(/Borrower name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Company email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Ticket ID/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Asset type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Due back/i)).toBeInTheDocument()
  })

  it("prevents submission when not signed in", async () => {
    render(<BorrowFormPage />)
    fireEvent.change(screen.getByLabelText(/Borrower name/i), { target: { value: "Alex" } })
    fireEvent.change(screen.getByLabelText(/Company email/i), {
      target: { value: "alex@example.com" },
    })
    fireEvent.change(screen.getByLabelText(/Ticket ID/i), { target: { value: "IT-1234" } })
    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: "Need a headset" },
    })
    // Submit should be disabled until session email matches; button title hints this state.
    const submit = screen.getByRole("button", { name: /Submit request/i })
    expect(submit).toBeDisabled()
    await waitFor(() => {
      expect(submit.getAttribute("title")).toContain("Sign in with magic link")
    })
  })
})

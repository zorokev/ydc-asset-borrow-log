import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { createClient } from "@supabase/supabase-js"
import React from "react"
import { MemoryRouter } from "react-router-dom"

import DashboardPage from "@/pages/dashboard"

vi.mock("@/lib/supabase/client", () => {
  const supabase = createClient("https://example.supabase.co", "anon")
  return { supabase }
})

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("renders SLA snapshot print note", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )
    expect(screen.getByText(/SLA snapshot/i)).toBeInTheDocument()
  })
})

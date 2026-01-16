import { describe, it, expect, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { render, screen } from "@testing-library/react"
import React from "react"

import RequestDetailPage from "@/pages/request-detail"

vi.mock("@/hooks/use-borrow-request", () => ({
  useBorrowRequest: () => ({
    data: {
      id: "1",
      request_code: "ABL-20260116-0001",
      ticket_id: "IT-9999",
      borrower_name: "Alex",
      borrower_email: "alex@example.com",
      department: "IT",
      asset_type: "laptop",
      asset_label: "LT-01",
      reason: "Test reason",
      status: "borrowed",
      borrowed_at: new Date("2026-01-01T10:00:00Z").toISOString(),
      due_at: new Date("2026-01-02T10:00:00Z").toISOString(),
      returned_at: null,
      it_owner: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-activity-log", () => ({
  useActivityLog: () => ({
    data: [
      {
        id: "a1",
        borrow_request_id: "1",
        action: "status:borrowed",
        actor_id: null,
        notes: "Checked out",
        created_at: new Date("2026-01-01T10:05:00Z").toISOString(),
      },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

describe("RequestDetailPage", () => {
  it("renders request code, ticket, and activity entry", () => {
    render(
      <MemoryRouter initialEntries={["/request/1"]}>
        <Routes>
          <Route path="/request/:id" element={<RequestDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getAllByText(/ABL-20260116-0001/)).toHaveLength(2)
    expect(screen.getByText(/Ticket IT-9999/)).toBeInTheDocument()
    expect(screen.getByText(/status:borrowed/i)).toBeInTheDocument()
  })
})

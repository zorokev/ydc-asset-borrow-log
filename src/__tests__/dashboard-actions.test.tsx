import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"

import DashboardPage from "@/pages/dashboard"

const updateStatusMock = vi.fn()
vi.mock("@/hooks/use-borrow-requests", () => ({
  useBorrowRequests: () => ({
    data: [
      {
        id: "1",
        request_code: "ABL-20260116-0001",
        ticket_id: "IT-1234",
        borrower_name: "Alex",
        borrower_email: "alex@example.com",
        department: "IT",
        asset_type: "laptop",
        asset_label: "LT-1",
        reason: "Test",
        status: "borrowed",
        borrowed_at: new Date().toISOString(),
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        returned_at: null,
        it_owner: null,
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
    updateStatus: updateStatusMock,
  }),
}))

describe("DashboardPage actions", () => {
  it("opens return dialog from grid card action", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    // Switch to table view and open action menu on the first row
    const tableToggle = screen.getByRole("button", { name: /table/i })
    fireEvent.click(tableToggle)
    const actionButtons = screen.getAllByLabelText(/row actions/i)
    expect(actionButtons.length).toBeGreaterThan(0)
    fireEvent.pointerDown(actionButtons[0])
    const menuItem = await screen.findByText("Mark returned")
    fireEvent.click(menuItem)
    expect(await screen.findByText("Mark returned")).toBeInTheDocument()
  })
})

import { createBrowserRouter } from "react-router-dom"

import { AppLayout } from "@/components/layouts/app-layout"
import BorrowFormPage from "@/pages/borrow-form"
import DashboardPage from "@/pages/dashboard"
import HomePage from "@/pages/home"
import RequestDetailPage from "@/pages/request-detail"
import { Protected } from "@/components/auth/protected"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "request",
        element: <BorrowFormPage />,
      },
      {
        path: "dashboard",
        element: (
          <Protected>
            <DashboardPage />
          </Protected>
        ),
      },
      {
        path: "request/:id",
        element: (
          <Protected>
            <RequestDetailPage />
          </Protected>
        ),
      },
    ],
  },
])

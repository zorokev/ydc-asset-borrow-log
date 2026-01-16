import { Outlet, NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", label: "Home", exact: true },
  { to: "/request", label: "Borrow form" },
  { to: "/dashboard", label: "Dashboard" },
]

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b print-hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
              ABL
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Asset Borrow Log</p>
              <p className="text-xs text-muted-foreground leading-tight">
                Placeholder logo; matches Yngen ITSM theme
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-secondary text-secondary-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="print-only mb-4 border-b pb-2 text-xs text-muted-foreground">
          Asset Borrow Log • Printed {new Date().toLocaleString()}
        </div>
        <div className="space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

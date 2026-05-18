/*
 * Role: Application shell. Navigation, routing, and the data-fetching provider.
 * Author: Dennies Bor
 * Description:
 *   Defines the dark mission-control shell of the dashboard. The main route is
 *   the dashboard surface, which uses the full screen width. A reference route
 *   holds deeper material. The QueryClient supplies data-fetch caching. An
 *   unmatched path redirects to the dashboard.
 */

import { lazy, Suspense } from "react";
import {
  HashRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Dashboard from "./routes/Dashboard";

const Paper = lazy(() => import("./routes/Paper"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const TABS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/reference", label: "Reference" },
];

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-surface-raised border-b border-line">
        <div className="px-6 pt-4">
          <h1 className="text-xl font-semibold text-ink">C-SWIM</h1>
          <p className="text-sm text-ink-muted">
            Coupled Space Weather Impact Model
          </p>
          <nav className="flex gap-1 mt-3">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  [
                    "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                    isActive
                      ? "border-accent text-ink"
                      : "border-transparent text-ink-muted hover:text-ink",
                  ].join(" ")
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-6">{children}</main>

      <footer className="border-t border-line bg-surface-raised">
        <div className="px-6 py-3 text-xs text-ink-muted">
          C-SWIM, Bor et al. Live satellite positions from Space-Track.
          Vulnerability results shown for the one-in-one-hundred-year scenario.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Shell>
          <Suspense fallback={<div className="text-ink-muted">Loading.</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reference" element={<Paper />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Shell>
      </HashRouter>
    </QueryClientProvider>
  );
}
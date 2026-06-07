/*
 * Role: Application shell. Navigation, routing, and the data-fetching provider.
 * Author: Dennies Bor
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

const Landing = lazy(() => import("./routes/Landing"));
const Paper = lazy(() => import("./routes/Paper"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const TABS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/reference", label: "Paper Summary" },
];

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="bg-surface-raised border-b border-line">
        <div className="px-6 pt-4">
          <NavLink to="/" className="group inline-block">
            <h1 className="text-xl font-semibold text-ink group-hover:text-accent transition-colors">C-SWIM</h1>
            <p className="text-sm text-ink-muted">
              Coupled Space Weather Impact Model
            </p>
          </NavLink>
          <nav className="flex gap-1 mt-3">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
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
          C-SWIM · Bor et al. 2026 · Live satellite positions from Space-Track.org ·
          Vulnerability results shown for the 1-in-100-year SEP scenario.
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Suspense fallback={<div className="p-8 text-ink-muted">Loading…</div>}>
          <Routes>
            {/* Landing is full-screen dark — renders outside the Shell chrome */}
            <Route path="/" element={<Landing />} />

            {/* All other routes share the persistent header + nav Shell */}
            <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
            <Route path="/reference" element={<Shell><Paper /></Shell>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </QueryClientProvider>
  );
}

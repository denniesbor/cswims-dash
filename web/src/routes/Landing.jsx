// Role: welcome / landing page — full-screen dark hero, paper metadata, key stats, CTAs
// Author: Dennies Bor

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STATS = [
  { value: "~100 / 10,650", label: "Satellites at Critical risk",    sub: "1-in-100-year SEP event" },
  { value: "$5.2 B",        label: "Expected capital loss",          sub: "From ~$254B fleet" },
  { value: "$70M–$1.3B",    label: "Daily economic impact",          sub: "Across three failure scenarios" },
  { value: "95.6%",         label: "Earth obs. capacity loss",       sub: "Worst-case scenario" },
  { value: "160 events",    label: "SEP events analyzed",            sub: "1996–2025 (27.4 yr)" },
  { value: "16–20%",        label: "Military disruption",            sub: "Across all scenarios" },
];

export default function Landing() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 overflow-auto" style={{ background: "#030712" }}>

      {/* subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:
          "linear-gradient(rgba(88,166,255,0.04) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(88,166,255,0.04) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />

      {/* centre radial glow — solar orange/red */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 90% 55% at 50% 38%, rgba(214,96,77,0.10) 0%, rgba(88,166,255,0.06) 55%, transparent 75%)",
      }} />

      <div
        className="relative z-10 min-h-full flex flex-col items-center justify-center px-6 py-16"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.65s ease, transform 0.65s cubic-bezier(0.34,1.2,0.64,1)",
        }}
      >
        {/* eyebrow */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "rgba(214,96,77,0.85)" }}>
            Space Weather · SEP Risk
          </span>
          <span className="text-[10px] font-mono tracking-widest" style={{ color: "rgba(100,116,139,0.6)" }}>
            · Bor et al. 2026
          </span>
        </div>

        {/* title */}
        <h1
          className="text-center font-bold leading-tight text-white mb-3 max-w-4xl"
          style={{ fontSize: "clamp(1.45rem, 4vw, 2.6rem)" }}
        >
          C-SWIM
          <br />
          <span style={{
            background: "linear-gradient(130deg, #58a6ff 0%, #d6604d 60%, #fbbf24 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Coupled Space Weather Impact Model
          </span>
        </h1>

        {/* subtitle */}
        <p className="text-sm mb-1 text-center max-w-2xl" style={{ color: "#94a3b8" }}>
          Satellite Fleet Vulnerability &amp; Economic Loss Under a 1-in-100-Year Solar Energetic Particle Event
        </p>
        <p className="text-xs mb-1" style={{ color: "rgba(100,116,139,0.75)" }}>
          D. Bor · E. J. Oughton · R. S. Weigel · R. Yang · T. Clower · M. J. Wiltberger · R. Linares
        </p>
        <p className="text-xs mb-8" style={{ color: "rgba(100,116,139,0.6)" }}>
          George Mason University · NSF NCAR/HAO · MIT
        </p>

        {/* tagline */}
        <p
          className="text-sm text-center max-w-lg mb-10 leading-relaxed"
          style={{ color: "rgba(148,163,184,0.85)" }}
        >
          An integrated framework linking SEP hazard characterization, dynamic geomagnetic
          cutoff rigidity modeling, radiation dose transport, and fleet-wide failure probability
          estimation to macroeconomic impact analysis.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3 justify-center mb-14">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #58a6ff, #1d4ed8)",
              boxShadow: "0 8px 24px rgba(88,166,255,0.25)",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 32px rgba(88,166,255,0.40)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(88,166,255,0.25)"; e.currentTarget.style.transform = ""; }}
          >
            Explore Dashboard
          </Link>

          <Link
            to="/reference"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              color: "#cbd5e1",
              border: "1px solid rgba(100,116,139,0.45)",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(100,116,139,0.8)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(100,116,139,0.45)"}
          >
            Paper Summary
          </Link>

          <a
            href="https://arxiv.org/abs/2605.22576"
            target="_blank" rel="noreferrer"
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              color: "#58a6ff",
              border: "1px solid rgba(88,166,255,0.25)",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(88,166,255,0.55)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(88,166,255,0.25)"}
          >
            arXiv ↗
          </a>
        </div>

        {/* stats grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 max-w-2xl w-full rounded-2xl overflow-hidden"
          style={{
            border: "1px solid rgba(51,65,85,0.5)",
            background: "rgba(15,23,42,0.6)",
            gap: "1px",
            boxShadow: "0 0 0 1px rgba(51,65,85,0.35) inset",
          }}
        >
          {STATS.map(({ value, label, sub }, i) => (
            <div
              key={label}
              className="px-5 py-4"
              style={{
                background: i % 2 === 0 ? "rgba(10,15,30,0.7)" : "rgba(8,12,24,0.7)",
                borderRight: (i % 3 !== 2) ? "1px solid rgba(51,65,85,0.35)" : "none",
                borderBottom: i < 3 ? "1px solid rgba(51,65,85,0.35)" : "none",
              }}
            >
              <div className="text-lg font-bold leading-tight" style={{ color: "#58a6ff" }}>
                {value}
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: "rgba(226,232,240,0.85)" }}>
                {label}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(100,116,139,0.7)" }}>
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* footer note */}
        <p className="mt-10 text-[11px] text-center" style={{ color: "rgba(100,116,139,0.55)" }}>
          Live satellite positions via Space-Track.org · Vulnerability analysis for the 1-in-100-year SEP scenario
        </p>
      </div>
    </div>
  );
}

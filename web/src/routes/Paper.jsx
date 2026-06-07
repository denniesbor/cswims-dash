// Role: paper summary page — C-SWIM scientific results, key findings, and figures
// Author: Dennies Bor

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <h2 className="text-xl font-semibold text-ink mt-12 mb-4 pb-2 border-b border-line">
      {children}
    </h2>
  );
}

function StatCard({ value, label, sub }) {
  return (
    <div className="bg-surface-raised border border-line rounded-lg p-4 shadow-sm">
      <div className="text-2xl font-bold text-accent leading-tight">{value}</div>
      <div className="text-xs font-semibold text-ink mt-1">{label}</div>
      {sub && <div className="text-[11px] text-ink-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function FigureCard({ src, caption, label }) {
  return (
    <figure className="bg-surface-raised border border-line rounded-lg overflow-hidden shadow-sm">
      <img src={src} alt={caption} className="w-full object-contain" loading="lazy" />
      <figcaption className="px-3 py-2 text-xs text-ink-muted border-t border-line">
        <span className="font-semibold text-ink">{label}&nbsp;&nbsp;</span>{caption}
      </figcaption>
    </figure>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Paper() {
  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="max-w-5xl mx-auto px-6 py-10 pb-20">

        {/* ── Hero ── */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <a
              href="https://arxiv.org/abs/2605.22576"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-surface text-xs font-medium hover:opacity-90 transition-opacity"
            >
              arXiv 2605.22576
            </a>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-inset text-ink-muted text-xs font-medium border border-line">
              Space Weather · SEP Risk
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-inset text-ink-muted text-xs font-medium border border-line">
              Preprint 2026
            </span>
          </div>
          <h1 className="text-2xl font-bold text-ink leading-snug mb-2">
            C-SWIM: A Coupled Space Weather Impact Model for Satellite Fleet Vulnerability
            and Economic Loss Under a 1-in-100-Year Solar Energetic Particle Event
          </h1>
          <p className="text-sm text-ink-muted">
            D. Bor · E. J. Oughton · R. S. Weigel · R. Yang · T. Clower · M. J. Wiltberger · R. Linares
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            George Mason University · NSF NCAR/HAO · Massachusetts Institute of Technology
          </p>
        </header>

        {/* ── Abstract ── */}
        <SectionHeading>Abstract</SectionHeading>
        <div className="bg-surface-raised border border-line rounded-lg p-5 text-sm text-ink leading-relaxed space-y-3">
          <p>
            Modern economies depend critically on satellite infrastructure, yet the aggregate economic
            consequences of extreme solar energetic particle (SEP) events have not been rigorously
            assessed. This study develops an integrated framework linking SEP hazard characterization,
            dynamic geomagnetic cutoff rigidity modeling, radiation dose transport, and fleet-wide
            failure probability estimation to macroeconomic impact analysis.
          </p>
          <p>
            Using extreme-value analysis of 160 SEP events over 27.4 years (1996–2025), failure
            probability is estimated for ~10,650 US operational satellites under orbital
            regime-dependent shielding assumptions. The assessment reveals that ~100 satellites
            (1.0%) are at Critical risk, concentrated in high-altitude low Earth orbit and highly
            elliptical orbit, while medium Earth orbit and geosynchronous orbit satellites fall in
            the Negligible class (P<sub>fail</sub> &lt; 10<sup>−9</sup>) under the assumed
            radiation-hardened components and shielding.
          </p>
          <p>
            The expected capital loss across the ~$254B fleet totals ~$5.2B. Three failure scenarios
            — expanding from Critical satellites only (P<sub>fail</sub> &gt; 10<sup>−2</sup>), to
            Critical and Elevated (P<sub>fail</sub> &gt; 10<sup>−3</sup>), and to all satellites
            with non-negligible risk (P<sub>fail</sub> &gt; 10<sup>−6</sup>) — yield daily economic
            impacts of ~$70M, ~$270M, and ~$1.3B, respectively. Earth observation suffers up to
            95.6% capacity loss in the worst case, while military services experience 16.1–20.4%
            disruption across scenarios.
          </p>
          <p className="text-ink-muted italic">
            Results are first-order estimates: hardware failure counts are conservative because only
            total ionizing dose is modeled, and daily economic impacts represent upper bounds because
            operator response and recovery are not included.
          </p>
        </div>

        {/* ── Plain Language Summary ── */}
        <SectionHeading>Plain Language Summary</SectionHeading>
        <div className="bg-surface-raised border border-line rounded-lg p-5 text-sm text-ink leading-relaxed">
          <p>
            A once-in-a-century solar storm would likely damage about 100 US satellites valued at
            $22 billion, with an expected loss of roughly $5 billion after accounting for the chance
            each satellite actually fails. These satellites are mostly in high-altitude or elliptical
            orbits, where they already endure heavy exposure to Earth's radiation belts. GPS satellites
            are well protected and remain fully operational under the likely and moderate scenarios,
            while commercial communications experience only 0.8 to 7.4 percent disruption thanks to
            constellation redundancy. Earth observation and military surveillance are the most affected,
            contributing to total daily economic losses of $70 million to $1.3 billion across all sectors.
          </p>
        </div>

        {/* ── Key Points ── */}
        <SectionHeading>Key Findings</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard value="~100 / 10,650" label="Satellites at Critical risk" sub="1-in-100-year SEP event" />
          <StatCard value="$5.2 B"        label="Expected capital loss"       sub="From ~$254B total fleet" />
          <StatCard value="$70M–$1.3B"   label="Daily economic impact"       sub="Across three failure scenarios" />
          <StatCard value="95.6%"         label="Earth obs. capacity loss"    sub="Worst-case scenario" />
          <StatCard value="16–20%"        label="Military disruption"         sub="Across all scenarios" />
          <StatCard value="160 SEP events" label="Events analyzed"           sub="1996–2025 (27.4 years)" />
        </div>

        {/* ── Satellite fleet overview ── */}
        <SectionHeading>US Satellite Fleet — Orbital Distribution</SectionHeading>
        <FigureCard
          src="/figures/satellite_orbits_us.png"
          label="Fig. 1"
          caption="Distribution of ~10,650 US operational satellites across orbital regimes (LEO, MEO, HEO, GEO), showing altitude-inclination spread and regime-dependent shielding assumptions."
        />

        {/* ── SEP hazard characterization ── */}
        <SectionHeading>SEP Hazard Characterization</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FigureCard
            src="/figures/flux_timeseries_1995_2025.png"
            label="Fig. 2"
            caption="Solar energetic particle flux time series (1995–2025). Peak flux events used for extreme-value analysis are highlighted."
          />
          <FigureCard
            src="/figures/major_events_detail.png"
            label="Fig. 3"
            caption="Detail view of major SEP events, including the October 2003 Halloween storms and other historically significant episodes."
          />
        </div>

        {/* ── Extreme value analysis ── */}
        <SectionHeading>Extreme-Value Analysis (GPD)</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FigureCard
            src="/figures/gpd_ccdf_fluence.png"
            label="Fig. 4"
            caption="Generalized Pareto Distribution fit to proton fluence — complementary cumulative distribution function (CCDF) with 1-in-100-year return level estimate."
          />
          <FigureCard
            src="/figures/gpd_ccdf_flux.png"
            label="Fig. 5"
            caption="GPD CCDF for peak proton flux, showing empirical data and fitted distribution with confidence bounds."
          />
        </div>

        {/* ── Geomagnetic cutoff rigidity ── */}
        <SectionHeading>Geomagnetic Cutoff Rigidity Modeling</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FigureCard
            src="/figures/rc_evolution_starlink_100y.png"
            label="Fig. 6"
            caption="Dynamic geomagnetic cutoff rigidity evolution for Starlink-representative LEO orbits during a 1-in-100-year SEP event, showing enhanced particle access at lower latitudes."
          />
          <FigureCard
            src="/figures/fieldlines_evolution_100y.png"
            label="Fig. 7"
            caption="Geomagnetic field line evolution and cutoff rigidity erosion under the modeled extreme SEP event, computed with the OTSO particle tracing code."
          />
        </div>
        <FigureCard
          src="/figures/rc_erosion_100y.png"
          label="Fig. 8"
          caption="Global map of geomagnetic cutoff rigidity erosion — difference between quiet-time and storm-time cutoffs — quantifying the increased SEP access under disturbed conditions."
        />

        {/* ── Radiation dose transport ── */}
        <SectionHeading>Radiation Dose Transport</SectionHeading>
        <FigureCard
          src="/figures/sep_dose_depth.png"
          label="Fig. 9"
          caption="Total ionizing dose (TID) as a function of aluminum shielding depth for the 1-in-100-year proton fluence spectrum. Dashed line indicates the assumed 4 mm Al equivalent shielding for each orbital regime."
        />

        {/* ── Failure probability ── */}
        <SectionHeading>Failure Probability Estimation</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FigureCard
            src="/figures/xapsos_pfail_illustration.png"
            label="Fig. 10"
            caption="Failure probability estimation methodology (Xapsos model): mapping dose-depth curves to component failure probability using radiation tolerance distributions."
          />
          <FigureCard
            src="/figures/vulnerability_assessment.png"
            label="Fig. 11"
            caption="Fleet-wide failure probability distribution across all ~10,650 US operational satellites. Color bands correspond to the five vulnerability classes: Critical, Elevated, Moderate, Low, Negligible."
          />
        </div>

        {/* ── Economic impact ── */}
        <SectionHeading>Economic Impact Assessment</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FigureCard
            src="/figures/fleet_cost_assessment.png"
            label="Fig. 12"
            caption="Fleet capital cost distribution by vulnerability class. Expected loss ($5.2B) is the probability-weighted sum across all satellites."
          />
          <FigureCard
            src="/figures/economic_impact_assessment.png"
            label="Fig. 13"
            caption="Daily economic impact by sector and failure scenario. Earth observation and military intelligence are the most disrupted services."
          />
        </div>
        <FigureCard
          src="/figures/economic_sectoral_poster.png"
          label="Fig. 14"
          caption="Sector-level economic loss breakdown across three failure scenarios (Critical, Critical+Elevated, All non-negligible). Bars show percentage capacity loss and dollar-equivalent daily impact."
        />

        {/* ── Validation ── */}
        <SectionHeading>Model Validation</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FigureCard
            src="/figures/berger_irene_validation.png"
            label="Fig. 15"
            caption="Dose-depth validation against Berger & Irene analytical benchmark. Model output agrees within ±5% across all shielding depths tested."
          />
          <FigureCard
            src="/figures/ml_validation.png"
            label="Fig. 16"
            caption="Machine-learning SEP flux model validation: predicted vs. observed peak flux for held-out test events."
          />
        </div>

        {/* ── Open Research / Data & Code ── */}
        <SectionHeading>Open Research</SectionHeading>
        <p className="text-sm text-ink-muted mb-4 leading-relaxed">
          All analysis is written in Python. The project code, pipelines, and visualizations are
          openly available on GitHub; input data, trained model weights, and intermediate outputs
          are archived on Zenodo.
        </p>

        {/* primary links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            {
              label: "Code — GitHub",
              href: "https://github.com/denniesbor/C-SWIMs",
              desc: "denniesbor/C-SWIMs",
              icon: "💻",
            },
            {
              label: "Data — Zenodo",
              href: "https://zenodo.org",
              desc: "Oughton et al. 2026 — input data & model weights",
              icon: "🗃️",
            },
            {
              label: "Preprint — arXiv",
              href: "https://arxiv.org/abs/2605.22576",
              desc: "arXiv:2605.22576",
              icon: "📄",
            },
          ].map(({ label, href, desc, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank" rel="noreferrer"
              className="flex items-start gap-3 bg-surface-raised border border-line rounded-lg p-4 hover:border-accent transition-colors shadow-sm"
            >
              <span className="text-xl">{icon}</span>
              <div>
                <div className="text-sm font-semibold text-ink">{label}</div>
                <div className="text-xs text-ink-muted mt-0.5">{desc}</div>
              </div>
            </a>
          ))}
        </div>

        {/* tools & datasets table */}
        <div className="bg-surface-raised border border-line rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-inset">
                <th className="text-left px-3 py-2 border-b border-line font-semibold text-ink">Component</th>
                <th className="text-left px-3 py-2 border-b border-line font-semibold text-ink">Tool / Dataset</th>
                <th className="text-left px-3 py-2 border-b border-line font-semibold text-ink">Source</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Cutoff rigidities",        "OTSO / OTSOpy",                    { label: "Larsen 2023", href: "https://github.com/matt-larsen-swd/otso" }],
                ["Trapped radiation / dose", "IRENE (AE9/AP9 + SHIELDOSE-2)",    { label: "Ginet et al. 2013 / Seltzer 1994", href: null }],
                ["Satellite TLEs",           "Space-Track.org",                  { label: "space-track.org", href: "https://www.space-track.org" }],
                ["Satellite catalog",        "Jonathan's Space Report",          { label: "planet4589.org", href: "https://www.planet4589.org" }],
                ["SEP proton flux",          "SEPEM Reference Data Set v3.2",    { label: "Crosby et al. 2015", href: null }],
                ["SEP proton flux (recent)", "GOES-16 SGPS — NOAA",              { label: "NOAA SWPC", href: "https://www.swpc.noaa.gov" }],
                ["Interplanetary params",    "NASA/GSFC OMNI database",          { label: "NASA OMNIWeb", href: "https://omniweb.gsfc.nasa.gov" }],
                ["Proton stopping powers",   "NIST PSTAR (Si, Al)",              { label: "Berger et al. 2017", href: "https://physics.nist.gov/PhysRefData/Star/Text/PSTAR.html" }],
              ].map(([component, tool, source], i) => (
                <tr key={component} className={i % 2 === 0 ? "bg-surface-raised" : "bg-surface"}>
                  <td className="px-3 py-2 border-b border-line font-medium text-ink">{component}</td>
                  <td className="px-3 py-2 border-b border-line text-ink-muted">{tool}</td>
                  <td className="px-3 py-2 border-b border-line text-ink-muted">
                    {source.href
                      ? <a href={source.href} target="_blank" rel="noreferrer" className="text-accent hover:underline">{source.label}</a>
                      : source.label
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-ink-muted mt-8 text-center">
          Dashboard built with React · C-SWIM framework · Bor et al. 2026
        </p>

      </div>
    </div>
  );
}

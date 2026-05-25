import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { BouncyBrand } from '../components/ui/BouncyBrand';

// ── Animated DB flow visual ──────────────────────────────────────────────────
function BurrowFlow() {
  return (
    <svg viewBox="0 0 320 120" className="w-full max-w-xs mx-auto opacity-80" aria-hidden>
      {/* Nodes */}
      <rect x="10" y="44" width="64" height="32" rx="8" className="fill-emerald-500/20 stroke-emerald-500" strokeWidth="1.5"/>
      <text x="42" y="65" textAnchor="middle" className="fill-emerald-400" fontSize="10" fontFamily="monospace">Client</text>

      <rect x="128" y="44" width="64" height="32" rx="8" className="fill-slate-700/60 stroke-slate-500" strokeWidth="1.5"/>
      <text x="160" y="65" textAnchor="middle" className="fill-slate-300" fontSize="10" fontFamily="monospace">Reef</text>

      <rect x="246" y="44" width="64" height="32" rx="8" className="fill-emerald-500/20 stroke-emerald-500" strokeWidth="1.5"/>
      <text x="278" y="65" textAnchor="middle" className="fill-emerald-400" fontSize="10" fontFamily="monospace">Burrow</text>

      {/* Arrows */}
      <line x1="74" y1="60" x2="128" y2="60" className="stroke-emerald-500/60" strokeWidth="1.5" strokeDasharray="4 3">
        <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite"/>
      </line>
      <polygon points="124,56 132,60 124,64" className="fill-emerald-500/60"/>

      <line x1="192" y1="60" x2="246" y2="60" className="stroke-emerald-500/60" strokeWidth="1.5" strokeDasharray="4 3">
        <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite"/>
      </line>
      <polygon points="242,56 250,60 242,64" className="fill-emerald-500/60"/>

      {/* Labels */}
      <text x="101" y="48" textAnchor="middle" fontSize="8" className="fill-emerald-600" fontFamily="monospace">Cast →</text>
      <text x="219" y="48" textAnchor="middle" fontSize="8" className="fill-emerald-600" fontFamily="monospace">Haul →</text>

      {/* LRS label under Burrow */}
      <text x="278" y="90" textAnchor="middle" fontSize="7" className="fill-emerald-500/70" fontFamily="monospace">LRS active</text>
      <circle cx="278" cy="96" r="3" className="fill-emerald-400">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent = 'emerald' }: { icon: string; title: string; desc: string; accent?: string }) {
  const border: Record<string, string> = {
    emerald: 'hover:border-emerald-500/50',
    red:     'hover:border-red-500/50',
    amber:   'hover:border-amber-500/50',
    teal:    'hover:border-teal-500/50',
    purple:  'hover:border-purple-500/50',
    blue:    'hover:border-blue-500/50',
  };
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-200 dark:border-slate-800 ${border[accent]} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Key badge pill ────────────────────────────────────────────────────────────
function KeyPill({ prefix, label, color }: { prefix: string; label: string; color: string }) {
  return (
    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
      <div className={`font-mono font-bold text-base mb-1 ${color}`}>{prefix}<span className="text-slate-500 text-xs font-normal"> [hex]</span></div>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f14] text-slate-900 dark:text-slate-100 transition-colors duration-300 font-[Outfit,sans-serif]">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      {/* The thin border-b changes color: emerald in light mode, lobster-red in dark */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm
                      bg-white/90 dark:bg-[#0a0f14]/90
                      border-b-2 border-emerald-500 dark:border-red-500
                      transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 overflow-hidden border border-emerald-400/50">
                <img src="/assets/thumbnail.png" alt="CaraBase" className="w-full h-full object-cover" />
              </div>
              <BouncyBrand variant="subtle" className="text-2xl" />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="w-9 h-9 rounded-lg flex items-center justify-center
                           border border-slate-200 dark:border-slate-700
                           bg-slate-100 dark:bg-slate-800
                           text-slate-500 dark:text-slate-400
                           hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400
                           transition-all"
              >
                {isDark ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>

              <button onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-lg text-sm font-semibold
                           text-slate-600 dark:text-slate-300
                           border border-slate-200 dark:border-slate-700
                           hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400
                           transition-all">
                Login
              </button>
              <button onClick={() => navigate('/setup')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white
                           bg-gradient-to-r from-emerald-500 to-teal-500
                           hover:from-emerald-600 hover:to-teal-600
                           shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40
                           transition-all">
                Deploy Yours →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: isDark
            ? 'linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)'
            : 'linear-gradient(rgba(16,185,129,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}>
        <div className="max-w-5xl mx-auto text-center">

          {/* Banner image */}
          <div className="mb-10">
            <img
              src="/assets/icon.png"
              alt="CaraBase"
              className="w-full max-w-2xl mx-auto rounded-2xl shadow-2xl border-2 border-emerald-500 shadow-emerald-500/20"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8
                          bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400
                          border border-emerald-200 dark:border-emerald-500/30">
            🦞 Self-Hosted · SQLite · Open Source · LRS
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6 flex flex-col items-center">
            <BouncyBrand variant="prominent" className="text-5xl sm:text-7xl mb-1" />
            <span className="block text-2xl sm:text-3xl font-semibold text-slate-500 dark:text-slate-400 mt-3">
              Your Burrow. Your Rules. Your Data.
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-4">
            A sovereign, self-hosted Backend-as-a-Service built on{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">SQLite</span>.
            Drop it into your own{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Reef</span>,
            connect your apps, and own every row of every{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Burrow</span> — completely.
          </p>

          <p className="text-base text-slate-500 dark:text-slate-500 max-w-2xl mx-auto mb-12">
            A clean drop-in for projects that need a real BaaS backbone — RESTful APIs, Lobster Row Security, real-time Tides, and file storage — all running from a single SQLite file on hardware you control.
          </p>

          {/* Animated DB visual */}
          <div className="mb-12">
            <BurrowFlow />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/setup')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl
                         bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg
                         shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40
                         hover:-translate-y-0.5 transition-all">
              Hatch Your Burrow →
            </button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl
                         font-bold text-lg
                         border-2 border-slate-200 dark:border-slate-700
                         text-slate-700 dark:text-slate-300
                         hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400
                         transition-all">
              View Source 🦀
            </a>
          </div>
        </div>
      </section>

      {/* ── Mission strip ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
            "Your data shouldn't live in someone else's{' '}
            <span className="text-emerald-500">Burrow</span>."
          </p>
          <p className="mt-6 text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            CaraBase is built for developers who want the productivity of a managed BaaS
            with the sovereignty of self-hosting. One SQLite file. One Docker command.
            Infinite control.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-mono">
            {['$ docker compose up -d', 'SQLite · Zero cloud deps', 'MIT Licensed'].map(t => (
              <span key={t} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6
                            bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400
                            border border-emerald-200 dark:border-emerald-500/30">
              What Lives in the Burrow
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 mb-4">
              Everything a <span className="text-emerald-500">Reef</span> Needs
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              A complete data platform. Nothing you don't need. Nothing you can't own.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard accent="emerald" icon="🗄️" title="Dynamic REST Burrows"
              desc="Auto-generate RESTful APIs for any SQLite table. Cast a query, Haul the rows. Filterable, paginated, and schema-aware — zero boilerplate." />
            <FeatureCard accent="red" icon="🦀" title="Lobster Row Security (LRS)"
              desc="Per-table, per-operation access policies that evaluate in real-time. Anonymous Casts are blocked by default. Every row guarded by the Claw." />
            <FeatureCard accent="teal" icon="🌊" title="Real-time Tides"
              desc="Subscribe to live table mutations over Server-Sent Events. When rows are Hauled in or Scuttled, your clients feel the Tide immediately." />
            <FeatureCard accent="amber" icon="🔑" title="ClawKeys©™ Auth"
              desc="Cryptographic key-based identity. hu- root keys never touch the Reef. api- session tokens stay ephemeral. lb- Lobster Keys are scoped and revocable." />
            <FeatureCard accent="purple" icon="📁" title="Shell Storage"
              desc="Multipart file upload with secure serving. Public links for sharing, private retrieval for protected assets. Your Burrow, your files." />
            <FeatureCard accent="blue" icon="🛠️" title="Custom Endpoint Builder"
              desc="Craft bespoke REST routes with custom paths, HTTP methods, and schemas layered over your Burrow tables. Build the API shape your apps expect." />
          </div>
        </div>
      </section>

      {/* ── Security / LRS ──────────────────────────────────────────────────── */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6
                            bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400
                            border border-red-200 dark:border-red-500/30">
              Security Posture
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 mb-4">
              <span className="text-red-500">Armour-Plated</span> by Default
            </h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              CaraBase is built OWASP-first. Every seam between client and Reef is hardened.
            </p>
          </div>

          {/* ClawKey hierarchy */}
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <KeyPill prefix="hu-" color="text-emerald-400" label="Human root identity. SHA-256 hashed before touching the Reef. Never stored plaintext. Loss = non-recoverable — true ownership." />
            <KeyPill prefix="api-" color="text-amber-400" label="Ephemeral session token. Lives in sessionStorage only — cleared on tab close. Issued after key verification, revocable instantly." />
            <KeyPill prefix="lb-" color="text-red-400" label="Lobster Key. Scoped, rate-limited, time-bounded permissions (READ / WRITE / EDIT / SCUTTLE). Revocable at any time. ~381 bits entropy." />
          </div>

          {/* Auth flow */}
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 font-mono text-sm overflow-x-auto mb-8">
            <div className="text-slate-600 text-xs uppercase tracking-widest mb-3">// Auth Flow</div>
            <div className="space-y-1.5 text-slate-400">
              <div><span className="text-emerald-400">Client </span>→ generates(hu-key) → hashes(SHA-256) → POST /api/auth/register</div>
              <div><span className="text-amber-400">Reef   </span>→ stores(uuid, username, keyHash) → 201 Created</div>
              <div><span className="text-emerald-400">Client </span>→ hashes(hu-key) → POST /api/auth/token → receives(api-token)</div>
              <div><span className="text-emerald-400">Client </span>→ Authorization: Bearer api-token → all Casts</div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-emerald-500 flex flex-wrap gap-4">
              <span>✅ hu- keys NEVER sent plaintext</span>
              <span>✅ Constant-time comparison (timing attack hardened)</span>
              <span>✅ LRS default-deny on all tables</span>
            </div>
          </div>

          {/* Security checklist */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['🛡️', 'LRS (Lobster Row Security)', 'Per-table, per-operation policies. Default-deny if no policy exists.'],
              ['🔍', 'Audit Trail', 'Every mutation logged with actor, IP, outcome, and timestamp.'],
              ['🚦', 'Rate Limiting', 'Auth endpoints protected. Agent key creation throttled per user.'],
              ['🧬', 'ShellCryption', 'Parameterized queries throughout. Input sanitized at every seam.'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="text-2xl mb-3">{icon}</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{title}</div>
                <div className="text-slate-500 dark:text-slate-400 text-xs">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Deploy strip ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 mb-4">
            Your Reef. <span className="text-emerald-500">One Command.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Unraid template included. Docker Compose ready. Runs on a Raspberry Pi.
          </p>
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 font-mono text-sm text-left max-w-2xl mx-auto">
            <div className="text-slate-500 text-xs mb-3"># docker-compose.yml</div>
            <pre className="text-emerald-400 text-xs leading-relaxed whitespace-pre-wrap">{`services:
  carabase:
    image: clawstack/carabase:latest
    ports:
      - "5353:5353"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=5353
      - JWT_SECRET=\${JWT_SECRET}`}</pre>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-slate-500">$ </span>
              <span className="text-emerald-400">docker compose up -d</span>
              <span className="text-slate-600 ml-4"># That's it. Your Reef is live.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-48 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 overflow-hidden border-2 border-emerald-500 shadow-xl shadow-emerald-500/20">
            <img src="/assets/icon.png" alt="CaraBase" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4">Ready to Scuttle the SaaS Trap?</h2>
          <p className="text-emerald-100 text-xl mb-10 max-w-xl mx-auto">
            Hatch your own Burrow. Own your data. Let your Lobsters Haul the rows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/setup')}
              className="px-8 py-4 bg-white text-emerald-700 font-bold text-lg rounded-xl shadow-xl hover:-translate-y-0.5 transition-all">
              Hatch Your Burrow →
            </button>
            <button onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-white/60 text-white font-bold text-lg rounded-xl hover:border-white hover:bg-white/10 transition-all">
              Login with ClawKey
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center overflow-hidden border border-emerald-400/50">
              <img src="/assets/thumbnail.png" alt="CaraBase" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-end gap-2">
              <BouncyBrand variant="subtle" className="text-xl" />
              <span className="text-slate-600 text-xs mb-1">by ClawStack Studios</span>
            </div>
          </div>
          <p className="text-sm text-slate-500">Your Burrow. Your Rows. Your Reef.</p>
          <div className="flex gap-6 text-sm">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">GitHub</a>
            <button onClick={() => navigate('/login')} className="hover:text-emerald-400 transition-colors">Login</button>
            <button onClick={() => navigate('/setup')} className="hover:text-emerald-400 transition-colors">Setup</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

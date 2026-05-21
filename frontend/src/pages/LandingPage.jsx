import { Link } from 'react-router-dom';

const features = [
  {
    title: 'AI Risk Prediction',
    desc: 'Machine learning models analyze patient vitals to predict ICU risk in real-time.',
  },
  {
    title: 'Real-Time Monitoring',
    desc: 'Continuous tracking of heart rate, blood pressure, SpO2, and other critical vitals.',
  },
  {
    title: 'Smart Alerts',
    desc: 'Automated high-risk alerts notify clinical staff immediately when intervention is needed.',
  },
  {
    title: 'Role-Based Access',
    desc: 'Separate dashboards for Doctors, Nurses, and Administrators with tailored workflows.',
  },
  {
    title: 'Clinical Analytics',
    desc: 'Comprehensive analytics and trend visualization for data-driven decision making.',
  },
  {
    title: 'Patient History',
    desc: 'Complete prediction history with search, filter, and export capabilities.',
  },
];

const stats = [
  { value: '99.2%', label: 'Prediction Accuracy' },
  { value: '<2s', label: 'Response Time' },
  { value: '24/7', label: 'Monitoring' },
  { value: '3', label: 'Role Dashboards' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ─────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">IR</span>
            </div>
            <span className="text-lg font-bold text-surface-900 tracking-tight">
              ICU Risk <span className="text-primary-600">Intelligence</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-medium text-surface-600 hover:text-primary-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              AI-Powered Clinical Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 leading-tight tracking-tight">
              ICU Risk<br />
              <span className="text-primary-600">Intelligence System</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-surface-500 max-w-2xl leading-relaxed">
              AI-powered clinical decision support system for ICU patient risk prediction.
              Enabling faster, smarter, and more reliable critical care decisions.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/prediction"
                className="px-8 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 text-sm"
              >
                Start Prediction
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 bg-white text-surface-700 font-semibold rounded-xl border border-surface-300 hover:border-primary-400 hover:text-primary-600 transition-all text-sm"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────── */}
      <section className="bg-surface-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-surface-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900">
              Comprehensive Clinical Intelligence
            </h2>
            <p className="mt-4 text-surface-500 max-w-2xl mx-auto">
              Everything clinical teams need to monitor, predict, and respond to critical patient conditions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group bg-white border border-surface-200 rounded-xl p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                  <span className="text-primary-600 font-bold text-sm">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── System Overview ────────────────── */}
      <section className="bg-surface-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">System Overview</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-6">
                How It Works
              </h2>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Input Patient Vitals', desc: 'Enter heart rate, BP, SpO2, temperature, and respiratory rate into the system.' },
                  { step: '02', title: 'AI Risk Analysis', desc: 'Our ML model processes the data and generates a comprehensive risk score.' },
                  { step: '03', title: 'Clinical Decision', desc: 'Doctors receive prioritized alerts and recommendations for immediate action.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900">{item.title}</h3>
                      <p className="text-sm text-surface-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-surface-200 p-8 shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-surface-100">
                  <span className="text-sm font-medium text-surface-600">Risk Assessment</span>
                  <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">LIVE</span>
                </div>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-6xl font-bold text-danger-500">82%</p>
                    <p className="text-sm font-semibold text-danger-600 mt-2">HIGH RISK</p>
                    <p className="text-xs text-surface-400 mt-1">Immediate Attention Required</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'SpO2 Contribution', value: '40%', width: '40%' },
                    { label: 'Heart Rate', value: '25%', width: '25%' },
                    { label: 'Temperature', value: '15%', width: '15%' },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs text-surface-500 mb-1">
                        <span>{bar.label}</span>
                        <span className="font-medium">{bar.value}</span>
                      </div>
                      <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all duration-1000" style={{ width: bar.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ───────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">Benefits</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-12">
            Why Choose This System
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Faster Response', desc: 'Reduce critical response time with automated risk alerts.' },
              { title: 'Better Outcomes', desc: 'Improve patient outcomes with AI-driven early warning.' },
              { title: 'Reduced Workload', desc: 'Automate routine monitoring so staff can focus on care.' },
              { title: 'Data-Driven', desc: 'Make evidence-based decisions with comprehensive analytics.' },
            ].map((b) => (
              <div key={b.title} className="bg-surface-50 rounded-xl p-6 text-left hover:bg-primary-50 transition-colors">
                <h3 className="font-semibold text-surface-900 mb-2">{b.title}</h3>
                <p className="text-sm text-surface-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────── */}
      <footer className="bg-surface-900 text-surface-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">IR</span>
              </div>
              <span className="text-sm font-semibold text-surface-300">ICU Risk Intelligence</span>
            </div>
            <p className="text-xs text-surface-500">
              &copy; {new Date().getFullYear()} ICU Risk Intelligence System. Clinical Decision Support Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

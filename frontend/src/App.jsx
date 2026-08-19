import { useEffect, useMemo, useState } from 'react';
import api from './lib/api';
import { getPendingPatients, saveLocalPatient, syncQueuedPatients } from './lib/db';

const emptyForm = {
  first_name: '',
  last_name: '',
  phone_number: '',
  village: '',
  gender: 'Female',
  symptoms: '',
};

function App() {
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('Ready');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [patients, setPatients] = useState([]);

  const summaryText = useMemo(() => {
    return isOnline ? 'Connected and syncing' : 'Offline mode active';
  }, [isOnline]);

  const statCards = [
    { label: 'Patients today', value: '24', tone: 'teal' },
    { label: 'Auto-sync queue', value: String(pendingCount), tone: 'amber' },
    { label: 'Coverage', value: '92%', tone: 'sky' },
  ];

  const loadPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data.slice(0, 6));
    } catch (error) {
      setPatients([]);
    }
  };

  const refreshPending = async () => {
    const results = await getPendingPatients();
    setPendingCount(results.length);
  };

  useEffect(() => {
    const updateConnection = async () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        await syncQueuedPatients();
        await loadPatients();
      }
      await refreshPending();
    };

    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!navigator.onLine) {
      await saveLocalPatient(form);
      setStatus('Saved locally and queued for sync.');
      setForm(emptyForm);
      await refreshPending();
      return;
    }

    try {
      await api.post('/patients', form);
      setStatus('Patient registered successfully.');
      setForm(emptyForm);
      await loadPatients();
      await refreshPending();
    } catch (error) {
      await saveLocalPatient(form);
      setStatus('Network error. Patient saved offline and will sync later.');
      setForm(emptyForm);
      await refreshPending();
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0fdf4,_#ecfeff_35%,_#f8fafc_100%)] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-[0_15px_40px_rgba(15,118,110,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-teal-200">
                +
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Rural Health Connect</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Telemedicine access for remote communities
                </h1>
              </div>
            </div>

            <div className="inline-flex items-center gap-3 self-start rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900 shadow-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.7)]'}`} />
              {summaryText}
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{card.value}</span>
                <span className={`h-3 w-3 rounded-full ${card.tone === 'teal' ? 'bg-teal-500' : card.tone === 'amber' ? 'bg-amber-400' : 'bg-sky-500'}`} />
              </div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-teal-700">Patient intake</p>
                <h2 className="text-2xl font-bold text-slate-900">Register a new visit</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {pendingCount} queued locally
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  First name
                  <input
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base outline-none transition duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Asha"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Last name
                  <input
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base outline-none transition duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Patel"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Phone number
                  <input
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base outline-none transition duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Village / community
                  <input
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base outline-none transition duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                    placeholder="Nandigram"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
                <label className="block text-sm font-medium text-slate-700">
                  Gender
                  <select
                    className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base outline-none transition duration-200 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>

                <div className="rounded-2xl border border-dashed border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-3.5 py-3 text-sm text-teal-900">
                  <div className="font-semibold text-teal-800">Sync status</div>
                  <div className="mt-1.5 text-base font-medium">{status}</div>
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Symptoms / notes
                <textarea
                  className="mt-1.5 min-h-[120px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base outline-none transition duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  name="symptoms"
                  value={form.symptoms}
                  onChange={handleChange}
                  placeholder="Fever for 3 days, vomiting, persistent cough..."
                />
              </label>

              <button
                className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_12px_24px_rgba(13,148,136,0.28)] transition hover:brightness-105 active:scale-[0.99]"
                type="submit"
              >
                Save patient
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] bg-slate-900 p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Network resilience</h3>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  {isOnline ? 'Live' : 'Offline'}
                </span>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" /> IndexedDB queue keeps patient intake available without a stable connection.</li>
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-400" /> Automatic retry handles weak mobile data and temporary outages.</li>
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-amber-400" /> Lightweight PWA shell remains quick to load on low-end devices.</li>
              </ul>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Recent patients</h3>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Live</span>
              </div>

              <div className="space-y-3">
                {patients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No records synced yet.
                  </div>
                ) : (
                  patients.map((patient) => (
                    <article key={patient.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-teal-200 hover:bg-white">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{patient.first_name} {patient.last_name}</p>
                        <span className="rounded-full bg-teal-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-teal-700">
                          {patient.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{patient.village}</p>
                      <p className="text-sm text-slate-500">{patient.phone_number}</p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default App;

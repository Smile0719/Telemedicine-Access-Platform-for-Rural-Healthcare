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
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-sky-50 p-4 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 rounded-2xl bg-white/80 p-4 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Rural Health Connect</p>
            <h1 className="text-2xl font-bold text-slate-900">Telemedicine access for remote communities</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
            <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {summaryText}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl bg-white p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Register patient</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {pendingCount} queued locally
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  First name
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-teal-500 focus:bg-white" name="first_name" value={form.first_name} onChange={handleChange} required />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Last name
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-teal-500 focus:bg-white" name="last_name" value={form.last_name} onChange={handleChange} required />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Phone number
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-teal-500 focus:bg-white" name="phone_number" value={form.phone_number} onChange={handleChange} required />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Village / community
                  <input className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-teal-500 focus:bg-white" name="village" value={form.village} onChange={handleChange} required />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Gender
                  <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-teal-500 focus:bg-white" name="gender" value={form.gender} onChange={handleChange}>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>
                <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50 px-3 py-3 text-sm text-teal-900">
                  <div className="font-medium">Sync status</div>
                  <div className="mt-1">{status}</div>
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Symptoms / notes
                <textarea className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none transition focus:border-teal-500 focus:bg-white" name="symptoms" value={form.symptoms} onChange={handleChange} placeholder="e.g. Fever for 3 days, dehydration, limited mobility" />
              </label>

              <button className="w-full rounded-xl bg-teal-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.99]" type="submit">
                Save patient
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-soft">
              <h3 className="text-lg font-semibold">Network resilience</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                <li>• IndexedDB queue persists patient registrations offline</li>
                <li>• Axios retries automatically when the connection returns</li>
                <li>• PWA shell remains available even on weak connectivity</li>
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-soft">
              <h3 className="text-lg font-semibold">Recent patient list</h3>
              <div className="mt-4 space-y-3">
                {patients.length === 0 ? (
                  <p className="text-sm text-slate-500">No records synced yet.</p>
                ) : (
                  patients.map((patient) => (
                    <article key={patient.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{patient.first_name} {patient.last_name}</p>
                        <span className="rounded-full bg-teal-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-700">
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

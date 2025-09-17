import React, { useState, useEffect } from "react";

export default function FreeFireTournamentApp() {
  const ADMIN_PASSWORD = "7855955189";
  const STORAGE_KEY = "ff_tournament_registrations_v2";

  const [form, setForm] = useState({ squadName: "", players: ["", "", "", "", ""], village: "" });
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRegistrations(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  }, [registrations]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name.startsWith("player")) {
      const index = parseInt(name.replace("player", "")) - 1;
      setForm((s) => {
        const players = [...s.players];
        players[index] = value;
        return { ...s, players };
      });
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  }

  function validateForm(f) {
    if (!f.squadName.trim() || !f.village.trim()) return false;
    return f.players.every((p) => p.trim());
  }

  function handleRegister(e) {
    e.preventDefault();
    if (!validateForm(form)) {
      setMessage({ type: "error", text: "Please fill in all required fields: Squad Name, 5 Player Names, and Village." });
      return;
    }
    const newReg = {
      id: Date.now(),
      squadName: form.squadName.trim(),
      players: form.players.map((p) => p.trim()),
      village: form.village.trim(),
      registeredAt: new Date().toISOString(),
    };
    setRegistrations((r) => [newReg, ...r]);
    setForm({ squadName: "", players: ["", "", "", "", ""], village: "" });
    setMessage({ type: "success", text: "Registration successful!" });
  }

  function handleAdminLogin(e) {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setAdminMode(true);
      setShowAdminLogin(false);
      setAdminPassword("");
      setMessage({ type: "success", text: "Admin access granted." });
    } else {
      setMessage({ type: "error", text: "Incorrect admin password." });
    }
  }

  function handleDelete(id) {
    if (!window.confirm("Delete this registration?")) return;
    setRegistrations((r) => r.filter((x) => x.id !== id));
    setMessage({ type: "success", text: "Registration deleted." });
  }

  function toCSV(data) {
    const headers = ["Squad Name", "Players", "Village", "Registered At"];
    const rows = data.map((r) => [r.squadName, r.players.join(" | "), r.village, r.registeredAt]);
    return [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
  }

  function handleExportCSV() {
    if (registrations.length === 0) {
      setMessage({ type: "error", text: "No registrations to export." });
      return;
    }
    const csvContent = toCSV(registrations);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ff_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = registrations.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      r.squadName.toLowerCase().includes(s) ||
      r.players.some((p) => p.toLowerCase().includes(s)) ||
      r.village.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Free Fire Tournament — Squad Registration</h1>
          <div className="space-x-2">
            {!adminMode && (
              <button onClick={() => setShowAdminLogin(true)} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Admin Login</button>
            )}
            {adminMode && (
              <button onClick={() => setAdminMode(false)} className="px-3 py-1 rounded bg-rose-600 text-white text-sm">Logout Admin</button>
            )}
          </div>
        </header>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-3">Squad Registration</h2>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-sm">Squad Name *</label>
                <input name="squadName" value={form.squadName} onChange={handleChange} className="w-full p-2 border rounded mt-1" required />
              </div>
              {[1,2,3,4,5].map((n) => (
                <div key={n}>
                  <label className="block text-sm">Player {n} *</label>
                  <input name={`player${n}`} value={form.players[n-1]} onChange={handleChange} className="w-full p-2 border rounded mt-1" required />
                </div>
              ))}
              <div>
                <label className="block text-sm">Village Name *</label>
                <input name="village" value={form.village} onChange={handleChange} className="w-full p-2 border rounded mt-1" required />
              </div>
              <div className="flex items-center gap-2">
                <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">Register</button>
                <button type="button" onClick={() => setForm({ squadName: "", players: ["", "", "", "", ""], village: "" })} className="px-3 py-2 rounded border">Clear</button>
              </div>
            </form>
            <p className="mt-3 text-xs text-slate-500">Fields marked * are required. Registrations are stored on this device (localStorage).</p>
          </section>

          <aside className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Registrations (Admin Only)</h2>
              {adminMode && (
                <div className="flex items-center gap-2">
                  <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} className="p-2 border rounded w-36" />
                  <button onClick={handleExportCSV} className="px-3 py-1 rounded border text-sm">Export CSV</button>
                </div>
              )}
            </div>

            {!adminMode && (
              <div className="text-sm text-slate-600">Only admin can view registrations. Click <button onClick={() => setShowAdminLogin(true)} className="underline">Admin Login</button>.</div>
            )}

            {adminMode && (
              <div className="max-h-80 overflow-auto">
                {filtered.length === 0 && <div className="text-sm text-slate-500">No registrations yet.</div>}
                <ul className="space-y-2">
                  {filtered.map((r) => (
                    <li key={r.id} className="p-2 border rounded flex justify-between items-start">
                      <div>
                        <div className="font-medium">{r.squadName}</div>
                        <div className="text-xs text-slate-600">Players: {r.players.join(", ")}</div>
                        <div className="text-xs text-slate-600">Village: {r.village}</div>
                        <div className="text-xs text-slate-400">Registered: {new Date(r.registeredAt).toLocaleString()}</div>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-2">
                        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs bg-rose-500 text-white rounded">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </main>

        {showAdminLogin && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white p-4 rounded shadow w-full max-w-sm">
              <h3 className="font-semibold mb-2">Admin Login</h3>
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div>
                  <label className="block text-sm">Password</label>
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowAdminLogin(false); setAdminPassword(""); }} className="px-3 py-1 border rounded">Cancel</button>
                  <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded">Login</button>
                </div>
              </form>
              <p className="mt-2 text-xs text-slate-500">Default admin password set to mobile number as requested. You should change it in the code if you publish this app.</p>
            </div>
          </div>
        )}

        <footer className="mt-6 text-xs text-slate-500">This is a local demo app. To publish to the web or mobile, I can help add a backend, authentication, and export features.</footer>
      </div>
    </div>
  );
}
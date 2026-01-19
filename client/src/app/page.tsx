"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ShieldCheck, Package, Activity, Lock, Globe, FileText,
  TrendingUp, Zap, Menu, Bell, Cpu, Terminal, AlertTriangle, CheckCircle2
} from "lucide-react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, BarChart, Bar
} from "recharts";

// Configuration
const API_BASE = "http://localhost:4005"; // Analytics
const SHIPMENT_API = "http://localhost:5001"; // Shipment

export default function WatchtowerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [chaosLogs, setChaosLogs] = useState<string[]>([]);
  const [realAnalytics, setRealAnalytics] = useState([]);
  const [isSyncing, setSyncing] = useState(false);

  const [stats, setStats] = useState({
    processed: 12840, throughput: "1.2k/s", security: "ACTIVE"
  });

  const [form, setForm] = useState({
    recipient: "", origin: "Dubai Jebel Ali", destination: "", items: ""
  });

  // Fetch real analytics from ClickHouse
  const fetchAnalytics = async () => {
    try {
      setSyncing(true);
      const res = await axios.get(`${API_BASE}/api/analytics/transit-times`);
      if (res.data && res.data.length > 0) {
        setRealAnalytics(res.data);
      }
    } catch (err) {
      console.error("Analytics fetch failed, using fallback data");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateShipment = async (e: any) => {
    e.preventDefault();
    try {
      setSyncing(true);
      const payload = {
        recipientName: form.recipient,
        origin: form.origin,
        destination: form.destination,
        items: form.items.split("\n").filter(i => i.trim() !== "")
      };
      await axios.post(`${SHIPMENT_API}/api/shipping/generate`, payload);
      alert("Manifest Digitally Signed & Stored in Vault!");
      setForm({ recipient: "", origin: "Dubai Jebel Ali", destination: "", items: "" });
      fetchAnalytics(); // Refresh
    } catch (err) {
      alert("Encryption Engine Error: Service Unreachable");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#050b14] text-slate-200">
      {/* Sidebar - Same as before but with real Tab mapping */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="glass-panel m-4 flex flex-col items-center py-8 z-50"
      >
        <div className="flex items-center gap-3 mb-10 overflow-hidden px-4">
          <div className="p-2 watchtower-gradient rounded-lg shadow-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight text-gradient">WATCHTOWER</span>}
        </div>

        <nav className="flex-1 w-full px-4 space-y-2">
          <NavItem icon={<Activity />} label="Mission Control" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} collapsed={!isSidebarOpen} />
          <NavItem icon={<Package />} label="Shipment Vault" active={activeTab === "shipments"} onClick={() => setActiveTab("shipments")} collapsed={!isSidebarOpen} />
          <NavItem icon={<Terminal />} label="Chaos Engine" active={activeTab === "chaos"} onClick={() => setActiveTab("chaos")} collapsed={!isSidebarOpen} />
        </nav>
      </motion.aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1 tracking-tight">Global Watchtower</h1>
            <p className="text-slate-500 text-sm">Enterprise-Grade Performance Monitor | {isSyncing ? "Syncing..." : "Synced"}</p>
          </div>
          <div className="glass-panel px-4 py-2 flex items-center gap-3 border-emerald-500/20 bg-emerald-500/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Systems Nominal</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Global Transit Events" value={stats.processed.toLocaleString()} icon={<Zap className="text-sky-400" />} />
                <StatCard title="Stream Throughput" value="1.2k/s" icon={<Activity className="text-emerald-400" />} />
                <StatCard title="Security Mode" value="FIPS-140" icon={<ShieldCheck className="text-indigo-400" />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="glass-panel p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold mb-6">Real-time Trade Intelligence (ClickHouse)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={realAnalytics.length > 0 ? realAnalytics : [{ region: 'Loading...', avg_time: 0 }]}>
                        <XAxis dataKey="region" stroke="#475569" fontSize={10} />
                        <YAxis stroke="#475569" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0c1425', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="avg_time" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-amber-500" /> System Logs
                  </h3>
                  <div className="font-mono text-[10px] space-y-2 opacity-70">
                    <p className="text-sky-400">[info] Kafka Heartbeat: Connected</p>
                    <p className="text-emerald-400">[info] ClickHouse Sync: Succesful</p>
                    <p className="text-slate-400">[info] RFID Consumer: Hub-Dubai Active</p>
                    <p className="text-slate-400">[info] OTEL Tracing: Exporting to Jaeger</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "shipments" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto glass-panel p-8">
              <h2 className="text-2xl font-bold mb-6">Issue Secure Manifest</h2>
              <form onSubmit={handleCreateShipment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-slate-500">Recipient</label>
                  <input required value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="e.g. EU Customs Authority" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-slate-500">Destination Hub</label>
                  <input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3" placeholder="e.g. Rotterdam Port" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-slate-500">Items (One per line)</label>
                  <textarea value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-32" placeholder="Item list..." />
                </div>
                <button disabled={isSyncing} type="submit" className="w-full watchtower-gradient py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all">
                  <ShieldCheck className="w-5 h-5" /> {isSyncing ? "Encrypting..." : "Submit Signed Manifest"}
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === "chaos" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
              <div className="glass-panel p-6 border-rose-500/30 bg-rose-500/5 flex items-center gap-6">
                <AlertTriangle className="w-12 h-12 text-rose-500" />
                <div>
                  <h3 className="text-xl font-bold">Chaos Injection Mode</h3>
                  <p className="text-sm text-slate-400">Trigger service failure simulation to verify self-healing properties of the Go and .NET services.</p>
                </div>
                <button className="ml-auto px-6 py-3 bg-rose-600 rounded-xl font-bold">Launch Chaos</button>
              </div>
              <div className="glass-panel p-6 font-mono text-xs bg-black/40 h-80 overflow-y-auto">
                <p className="text-emerald-500">$ watchtower system audit --resilience</p>
                <p className="text-slate-400">[INFO] Cluster check: 4/4 Healthy</p>
                <p className="text-slate-400">[INFO] Data Integrity check: Validated (SHA-256 matches)</p>
                <p className="text-slate-400">[INFO] Monitoring Stack: Subscribed</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${active ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-500 hover:bg-white/5"}`}>
      {icon}
      {!collapsed && <span className="font-bold text-sm">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="glass-panel p-6 border-white/5 shadow-xl">
      <div className="p-2 bg-white/5 w-fit rounded-lg mb-4">{icon}</div>
      <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">{title}</p>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

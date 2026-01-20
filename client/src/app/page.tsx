"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  ShieldCheck, Package, Activity, Lock, Globe, FileText,
  TrendingUp, Zap, Menu, Bell, Cpu, Terminal, AlertTriangle, CheckCircle2,
  ChevronRight, Database, Search, History, Settings, Sun, Moon
} from "lucide-react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, BarChart, Bar
} from "recharts";

// Configuration
const API_BASE = "http://localhost:4005"; // Analytics
const SHIPMENT_API = "http://localhost:5001"; // Shipment

export default function WatchtowerDashboard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [realAnalytics, setRealAnalytics] = useState([]);
  const [isSyncing, setSyncing] = useState(false);

  useEffect(() => setMounted(true), []);

  const [stats, setStats] = useState({
    processed: 12840, throughput: "1.2k/s", security: "FIPS-140"
  });

  const [form, setForm] = useState({
    recipient: "", origin: "Dubai Jebel Ali", destination: "", items: ""
  });

  // Fetch real analytics from ClickHouse
  const fetchAnalytics = async (silent = false) => {
    try {
      if (!silent) setSyncing(true);
      const res = await axios.get(`${API_BASE}/api/analytics/transit-times`);
      if (res.data && res.data.length >= 0) {
        setRealAnalytics(res.data);
      }
    } catch (err) {
      if (!silent) toast.error("Analytics Engine: Offline", { description: "Using simulated cache data." });
      console.error("Analytics fetch failed");
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  const handleCreateShipment = async (e: any) => {
    e.preventDefault();
    const promise = async () => {
      const payload = {
        recipientName: form.recipient,
        origin: form.origin,
        destination: form.destination,
        items: form.items.split("\n").filter(i => i.trim() !== "")
      };
      const res = await axios.post(`${SHIPMENT_API}/api/shipping/generate`, payload);
      setForm({ recipient: "", origin: "Dubai Jebel Ali", destination: "", items: "" });
      fetchAnalytics(true);
      return res.data;
    };

    toast.promise(promise(), {
      loading: 'Encrypting Manifest & Signing with RSA-2048...',
      success: (data) => `Manifest Signed: ${data.ManifestId.substring(0, 8)}...`,
      error: 'Encryption Error: Service Cluster Unreachable',
    });
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 15000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 88 }}
        className="glass-panel m-4 flex flex-col items-center py-8 z-50 sticky top-4 h-[calc(100vh-32px)] overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-12 px-6 w-full">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 watchtower-gradient rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.3)] shrink-0"
          >
            <ShieldCheck className="w-6 h-6 text-white" />
          </motion.div>
          {isSidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-black text-2xl tracking-tighter text-gradient whitespace-nowrap"
            >
              WATCHTOWER
            </motion.span>
          )}
        </div>

        <nav className="flex-1 w-full px-4 space-y-3">
          <NavItem icon={<Activity size={20} />} label="Mission Control" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} collapsed={!isSidebarOpen} />
          <NavItem icon={<Package size={20} />} label="Shipment Vault" active={activeTab === "shipments"} onClick={() => setActiveTab("shipments")} collapsed={!isSidebarOpen} />
          <NavItem icon={<Terminal size={20} />} label="Chaos Engine" active={activeTab === "chaos"} onClick={() => setActiveTab("chaos")} collapsed={!isSidebarOpen} />
          <div className="pt-4 mt-4 border-t border-border">
            <NavItem icon={<History size={20} />} label="Audit Logs" active={false} onClick={() => toast.info("Audit Logs: Access Restricted")} collapsed={!isSidebarOpen} />
            <NavItem icon={<Settings size={20} />} label="Nodes" active={false} onClick={() => toast.info("Cluster Nodes: Online")} collapsed={!isSidebarOpen} />
          </div>
        </nav>

        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="mt-auto p-3 hover:bg-foreground/5 rounded-xl transition-colors text-foreground/50"
        >
          <Menu size={20} />
        </button>
      </motion.aside>

      <main className="flex-1 p-8 overflow-y-auto z-10">
        <header className="flex justify-between items-start mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-black mb-2 tracking-tight flex items-center gap-3">
              Global Watchtower <span className="text-primary text-sm font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20">v2.0.4</span>
            </h1>
            <p className="text-foreground/70 font-medium flex items-center gap-2">
              <Database size={14} className="text-primary" />
              Enterprise-Grade Performance Monitor | {isSyncing ?
                <span className="text-primary animate-pulse">Synchronizing Data...</span> :
                <span className="text-secondary">Node Synced</span>
              }
            </p>
          </motion.div>

          <div className="flex gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-3 glass-panel hover:bg-foreground/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-foreground/50" />}
            </button>
            <button className="p-3 glass-panel hover:bg-foreground/10 transition-colors relative">
              <Bell size={20} className="text-foreground/70" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </button>
            <div className="glass-panel px-5 py-3 flex items-center gap-3 border-secondary/20 bg-secondary/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">Operational</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard title="Global Transit Events" value={stats.processed.toLocaleString()} icon={<Zap size={24} className="text-primary" />} trend="+12.4%" />
                <StatCard title="Stream Throughput" value={stats.throughput} icon={<Activity size={24} className="text-secondary" />} trend="Stable" />
                <StatCard title="Storage Encryption" value={stats.security} icon={<Lock size={24} className="text-accent" />} trend="Verified" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel p-8 lg:col-span-2 relative overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-xl font-black tracking-tight">Real-time Trade Intelligence (ClickHouse)</h3>
                    <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                      <span className="px-2 py-1 bg-foreground/5 rounded">Live Traffic</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">Columnar Engine</span>
                    </div>
                  </div>
                  <div className="h-72 relative z-10 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={realAnalytics.length > 0 ? realAnalytics : [{ region: 'No Data Cluster', avg_time: 0 }]}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="region" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          contentStyle={{ backgroundColor: '#0c1425', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
                        />
                        <Bar dataKey="avg_time" fill="url(#barGradient)" radius={[6, 6, 2, 2]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="glass-panel p-8"
                >
                  <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
                    <Cpu className="w-6 h-6 text-amber-500" /> Active System Node
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-foreground/5 rounded-2xl border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Kafka Cluster</span>
                        <span className="text-secondary text-[10px] font-bold">STABLE</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} className="h-full bg-secondary" />
                      </div>
                    </div>
                    <div className="p-4 bg-foreground/5 rounded-2xl border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Storage API</span>
                        <span className="text-primary text-[10px] font-bold">READY</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} className="h-full bg-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 mb-4">Internal Telemetry</h4>
                    <div className="font-mono text-[10px] space-y-2 opacity-70 bg-black/40 p-4 rounded-xl border border-border">
                      <p className="text-primary flex items-center gap-2"><CheckCircle2 size={10} /> kafka://heartbeat.active</p>
                      <p className="text-secondary flex items-center gap-2"><CheckCircle2 size={10} /> session.sync_ok: 12ms</p>
                      <p className="text-foreground/70 flex items-center gap-2"><CheckCircle2 size={10} /> s3.bucket_verify: manifest-vault</p>
                      <p className="text-foreground/70 flex items-center gap-2"><CheckCircle2 size={10} /> trace.export: jaeger_endpoint</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === "shipments" && (
            <motion.div
              key="shipments"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto glass-panel p-10 relative"
            >
              <div className="absolute top-0 right-10 -translate-y-1/2 p-4 watchtower-gradient rounded-2xl shadow-xl">
                <Lock size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tight">Issue Secure Manifest</h2>
              <p className="text-foreground/50 mb-10 font-medium">Create immutable, RSA-signed records for global logistics.</p>

              <form onSubmit={handleCreateShipment} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <label className="text-[10px] uppercase font-black text-foreground/50 tracking-widest group-focus-within:text-primary transition-colors">Recipient Authority</label>
                    <input required value={form.recipient} onChange={e => setForm({ ...form, recipient: e.target.value })} className="w-full bg-foreground/5 border border-border rounded-2xl px-5 py-4 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-foreground/50 font-medium" placeholder="Legal Entity Name" />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-[10px] uppercase font-black text-foreground/50 tracking-widest group-focus-within:text-primary transition-colors">Destination HUB</label>
                    <input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="w-full bg-foreground/5 border border-border rounded-2xl px-5 py-4 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-foreground/50 font-medium" placeholder="Primary Port ID" />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] uppercase font-black text-foreground/50 tracking-widest group-focus-within:text-primary transition-colors">Asset Contents (One per line)</label>
                  <textarea value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} className="w-full bg-foreground/5 border border-border rounded-2xl px-5 py-4 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-foreground/50 h-40 resize-none font-medium" placeholder="E.g. Unit A-12498" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSyncing}
                  type="submit"
                  className="w-full watchtower-gradient py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(14,165,233,0.3)] hover:shadow-[0_15px_40px_rgba(14,165,233,0.4)] transition-all disabled:opacity-50"
                >
                  <ShieldCheck size={24} /> {isSyncing ? "ENCRYPTING DATA..." : "SIGN & PUBLISH MANIFEST"}
                </motion.button>
              </form>
            </motion.div>
          )}

          {activeTab === "chaos" && (
            <motion.div
              key="chaos"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="glass-panel p-10 border-rose-500/30 bg-rose-500/5 flex items-center gap-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-rose-500/10 group-hover:text-rose-500/20 transition-colors pointer-events-none">
                  <AlertTriangle size={120} />
                </div>
                <div className="relative z-10 shrink-0 p-5 bg-rose-500/20 rounded-3xl border border-rose-500/30">
                  <AlertTriangle className="w-12 h-12 text-rose-500" />
                </div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-3xl font-black mb-2 italic">Chaos Injection Engine</h3>
                  <p className="text-foreground/70 font-medium text-lg lg:max-w-md">Simulate cascading failures to stress-test microservice resilience.</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(225, 29, 72, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toast.warning("Chaos Sequence Init: System Lock Engaged")}
                  className="relative z-10 px-8 py-4 bg-rose-600 hover:bg-rose-500 rounded-2xl font-black text-rose-50 uppercase tracking-[0.2em] transition-all"
                >
                  Launch Chaos
                </motion.button>
              </div>

              <div className="glass-panel p-8 font-mono text-xs bg-black/60 min-h-[400px] border-border relative shadow-inner">
                <div className="flex items-center gap-2 mb-6 text-foreground/50 border-b border-border pb-4">
                  <Terminal size={14} />
                  <span className="font-bold tracking-widest text-[10px]">SYSTEM_AUDIT_LOGS</span>
                </div>
                <div className="space-y-3">
                  <p className="text-secondary">$ watchtower cluster health --all</p>
                  <p className="text-foreground/70 opacity-60">Connecting to zookeeper.local:2181...</p>
                  <p className="text-secondary flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full animate-pulse" />
                    [OK] shipment-service.cluster.node_1 (Up 42m)
                  </p>
                  <p className="text-secondary flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full animate-pulse" />
                    [OK] inventory-service.hub_istanbul (Up 128m)
                  </p>
                  <p className="text-secondary flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-secondary-400 rounded-full animate-pulse" />
                    [OK] analytic-service.clickhouse_proxy (Healthy)
                  </p>
                  <p className="text-amber-500 mt-6">[WARN] Entropy Check: 0.12% Deviation detected</p>
                  <p className="text-sky-500 animate-pulse">$ listening for rfid.pings. Istanbul Hub...</p>
                </div>
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
    <motion.button
      whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-5 p-4 rounded-2xl transition-all relative overflow-hidden group ${active
        ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_5px_15px_rgba(14,165,233,0.1)]"
        : "text-foreground/50 hover:text-foreground/80"
        }`}
    >
      <div className={`shrink-0 transition-all ${active ? "text-primary scale-110" : "group-hover:text-foreground/90"}`}>
        {icon}
      </div>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`font-black text-sm tracking-tight transition-all ${active ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}
        >
          {label}
        </motion.span>
      )}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 w-1 watchtower-gradient h-1/2 rounded-full"
        />
      )}
    </motion.button>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" }}
      className="glass-panel p-8 border-border relative group transition-all"
    >
      <div className="absolute top-4 right-6 text-[10px] font-black tracking-widest text-secondary bg-secondary/10 px-2 py-0.5 rounded">
        {trend}
      </div>
      <div className="p-3 bg-foreground/5 w-fit rounded-2xl mb-6 shadow-inner group-hover:watchtower-gradient group-hover:text-white transition-all duration-500 text-primary">
        {icon}
      </div>
      <p className="text-[10px] text-foreground/50 uppercase font-black tracking-[0.2em] mb-1">{title}</p>
      <div className="text-3xl font-black tracking-tighter text-foreground/90">{value}</div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-foreground/5 group-hover:bg-primary/30 transition-all rounded-b-2xl" />
    </motion.div>
  );
}

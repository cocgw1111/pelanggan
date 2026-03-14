import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ClipboardCheck, 
  Calculator, 
  Table as TableIcon, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  FileSpreadsheet,
  FileJson
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parse } from "date-fns";

// Types
type Tab = "dashboard" | "pelanggan" | "izin" | "kontrak" | "meter" | "tagihan" | "billing" | "reports" | "rekap_pemakaian";
type ReportType = "pelanggan" | "izin" | "kontrak" | "gabungan" | "rekap";

interface User {
  username: string;
}

// Helper for currency and decimal formatting
const formatNumber = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatCurrency = (num: number) => num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 });

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-stone-50">Loading...</div>;

  if (!user) return <Login onLogin={(u) => setUser(u)} />;

  return (
    <div className="flex h-screen bg-stone-50 text-stone-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-stone-900 text-stone-100 transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"} flex flex-col`}>
        <div className="p-6 flex items-center gap-3 border-b border-stone-800">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <ClipboardCheck className="text-white w-5 h-5" />
          </div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">Aplikasi Pelanggan UW IV</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} collapsed={!isSidebarOpen} />
          <div className="pt-4 pb-2 px-3">
            {isSidebarOpen ? <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Kelola Data</span> : <div className="h-px bg-stone-800 mx-2" />}
          </div>
          <NavItem icon={<Users />} label="Pelanggan" active={activeTab === "pelanggan"} onClick={() => setActiveTab("pelanggan")} collapsed={!isSidebarOpen} />
          <NavItem icon={<FileText />} label="Izin" active={activeTab === "izin"} onClick={() => setActiveTab("izin")} collapsed={!isSidebarOpen} />
          <NavItem icon={<ClipboardCheck />} label="Kontrak" active={activeTab === "kontrak"} onClick={() => setActiveTab("kontrak")} collapsed={!isSidebarOpen} />
          <NavItem icon={<TableIcon />} label="Meter" active={activeTab === "meter"} onClick={() => setActiveTab("meter")} collapsed={!isSidebarOpen} />
          <NavItem icon={<FileText />} label="Tagihan" active={activeTab === "tagihan"} onClick={() => setActiveTab("tagihan")} collapsed={!isSidebarOpen} />
          
          <div className="pt-4 pb-2 px-3">
            {isSidebarOpen ? <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Operasional</span> : <div className="h-px bg-stone-800 mx-2" />}
          </div>
          <NavItem icon={<Calculator />} label="Hitung Tagihan" active={activeTab === "billing"} onClick={() => setActiveTab("billing")} collapsed={!isSidebarOpen} />
          <NavItem icon={<ClipboardCheck />} label="Rekap Pemakaian" active={activeTab === "rekap_pemakaian"} onClick={() => setActiveTab("rekap_pemakaian")} collapsed={!isSidebarOpen} />
          <NavItem icon={<FileSpreadsheet />} label="Laporan" active={activeTab === "reports"} onClick={() => setActiveTab("reports")} collapsed={!isSidebarOpen} />
        </nav>

        <div className="p-4 border-t border-stone-800">
          <button 
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              setUser(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-8">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            {isSidebarOpen ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-stone-500">Administrator</p>
            </div>
            <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center font-bold text-stone-600">
              {user.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "dashboard" && <Dashboard />}
              {activeTab === "pelanggan" && <TableManager table="pelanggan" />}
              {activeTab === "izin" && <TableManager table="izin" />}
              {activeTab === "kontrak" && <TableManager table="kontrak" />}
              {activeTab === "meter" && <TableManager table="meter" />}
              {activeTab === "tagihan" && <TableManager table="tagihan" />}
              {activeTab === "billing" && <BillingCalculator />}
              {activeTab === "rekap_pemakaian" && <UsageRecap />}
              {activeTab === "reports" && <Reports />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
          : "text-stone-400 hover:bg-stone-800 hover:text-stone-100"
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) onLogin(data.user);
    else setError(data.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 border border-stone-200"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
            <ClipboardCheck className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Selamat Datang</h1>
          <p className="text-stone-500 mt-2">Silakan login ke akun admin Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            Login Sekarang
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then(res => res.json())
      .then(setMetrics);
  }, []);

  if (!metrics) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ringkasan Dasbor</h2>
        <p className="text-stone-500 mt-1">Gambaran umum operasional sistem Anda hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <MetricCard label="Total Pelanggan" value={metrics.totalPelanggan} icon={<Users />} color="bg-blue-500" />
        <MetricCard label="Total Kontrak" value={metrics.totalKontrak} icon={<ClipboardCheck />} color="bg-purple-500" />
        <MetricCard label="Total Izin" value={metrics.totalIzin} icon={<FileText />} color="bg-emerald-500" />
        <MetricCard label="Izin Habis" value={metrics.izinHabis} icon={<FileText />} color="bg-red-500" />
        <MetricCard label="Kontrak Habis" value={metrics.kontrakHabis} icon={<ClipboardCheck />} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Izin Habis Masa Berlaku</h3>
            <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">{metrics.izinHabis}</span>
          </div>
          <div className="space-y-4">
            {metrics.expiredIzinList.length > 0 ? metrics.expiredIzinList.map((izin: any) => (
              <div key={izin.id_izin} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{izin.nama_pelanggan}</p>
                    <p className="text-xs text-stone-500">ID: {izin.id_izin} • {izin.intake}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{izin.akhir_izin}</p>
                  <p className="text-[10px] text-stone-400 uppercase font-bold">Berakhir</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-stone-400">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Tidak ada izin yang habis masa berlaku</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Kontrak Habis Masa Berlaku</h3>
            <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-bold">{metrics.kontrakHabis}</span>
          </div>
          <div className="space-y-4">
            {metrics.expiredKontrakList.length > 0 ? metrics.expiredKontrakList.map((kontrak: any) => (
              <div key={kontrak.id_kontrak} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{kontrak.nama_pelanggan}</p>
                    <p className="text-xs text-stone-500">
                      ID: {kontrak.id_kontrak} • {kontrak.akhir_amd ? `AMD: ${kontrak.no_amd}` : `Kontrak: ${kontrak.no_kontrak}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">{kontrak.akhir_amd || kontrak.akhir_kontrak}</p>
                  <p className="text-[10px] text-stone-400 uppercase font-bold">Berakhir</p>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center text-stone-400">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Tidak ada kontrak yang habis masa berlaku</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-opacity-20`}>
        {icon}
      </div>
      <p className="text-stone-500 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function TableManager({ table }: { table: Tab }) {
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState("");

  const columns = useMemo(() => {
    if (table === "pelanggan") return ["id_pelanggan", "nama", "alamat", "npwp", "contact", "telepon", "seksi", "jenis", "status"];
    if (table === "izin") return ["id_izin", "id_pelanggan", "no_izin", "tanggal_izin", "mulai_izin", "akhir_izin", "intake", "lokasi", "desa", "kecamatan", "kabupaten", "lat", "long", "max", "min", "instansi"];
    if (table === "kontrak") return ["id_kontrak", "id_izin", "no_kontrak", "tanggal_kontrak", "mulai_kontrak", "akhir_kontrak", "no_amd", "tanggal_amd", "mulai_amd", "akhir_amd", "briva", "mva", "mp"];
    if (table === "meter") return ["id_meter", "id_izin", "no_ba", "tanggal_ba", "angka", "bulan", "tahun"];
    if (table === "tagihan") return ["id_tagihan", "id_meter", "no_invoice", "tanggal_invoice", "bulan_lap", "tahun_lap"];
    return [];
  }, [table]);

  const fetchData = () => {
    fetch(`/api/${table}`)
      .then(res => res.json())
      .then(resData => {
        setData(Array.isArray(resData) ? resData : []);
      })
      .catch(() => setData([]));
  };

  useEffect(() => {
    fetchData();
  }, [table]);

  const handleDelete = async (id: any) => {
    if (!confirm("Hapus data ini? Seluruh data terkait juga akan terhapus.")) return;
    try {
      const res = await fetch(`/api/${table}/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(`Gagal menghapus data: ${error.error || "Terjadi kesalahan"}`);
      }
    } catch (error) {
      alert("Gagal menghubungi server");
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, table);
    XLSX.writeFile(wb, `${table}_export.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws);
      
      for (const item of json) {
        await fetch(`/api/${table}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item)
        });
      }
      fetchData();
    };
    reader.readAsBinaryString(file);
  };

  const filteredData = Array.isArray(data) ? data.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(search.toLowerCase()))
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight capitalize">Kelola {table}</h2>
          <p className="text-stone-500 mt-1">Manajemen data tabel {table} secara lengkap.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => {
            const ws = XLSX.utils.json_to_sheet([columns.reduce((acc, col) => ({ ...acc, [col]: "" }), {})]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            XLSX.writeFile(wb, `template_${table}.xlsx`);
          }} className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl hover:bg-stone-50 flex items-center gap-2 font-medium transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Template
          </button>
          <label className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl hover:bg-stone-50 cursor-pointer flex items-center gap-2 font-medium transition-all">
            <Upload className="w-4 h-4" /> Import
            <input type="file" className="hidden" onChange={handleImport} accept=".xlsx, .xls" />
          </label>
          <button onClick={handleExport} className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl hover:bg-stone-50 flex items-center gap-2 font-medium transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="bg-emerald-500 text-white px-6 py-2 rounded-xl hover:bg-emerald-600 flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari data..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 text-stone-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">No</th>
                {columns.map(col => <th key={col} className="px-6 py-4">{col.replace(/_/g, ' ')}</th>)}
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-stone-500">{idx + 1}</td>
                  {columns.map(col => (
                    <td key={col} className="px-6 py-4 text-sm font-medium">
                      {col.includes('tanggal') || col.includes('mulai') || col.includes('akhir') ? item[col] : 
                       typeof item[col] === 'number' ? formatNumber(item[col]) : item[col]}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item[table === "pelanggan" ? "id_pelanggan" : `id_${table}`])}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal 
          title={editingItem ? "Ubah Data" : "Tambah Data"} 
          onClose={() => setIsModalOpen(false)}
        >
          <Form 
            table={table} 
            columns={columns} 
            initialData={editingItem} 
            onSuccess={() => { setIsModalOpen(false); fetchData(); }} 
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function Form({ table, columns, initialData, onSuccess }: { table: Tab, columns: string[], initialData?: any, onSuccess: () => void }) {
  const [formData, setFormData] = useState<any>(initialData || {});

  const isRequired = (col: string) => {
    if (table === "pelanggan") return col === "id_pelanggan" || col === "nama";
    if (table === "izin") return col === "id_izin" || col === "id_pelanggan";
    if (table === "kontrak") return col === "id_kontrak" || col === "id_izin";
    if (table === "meter") return col === "id_meter" || col === "id_izin";
    if (table === "tagihan") return col === "id_tagihan" || col === "id_meter";
    return false;
  };

  const isDateColumn = (col: string) => col.includes('tanggal') || col.includes('mulai') || col.includes('akhir');

  const toInputDate = (val: any) => {
    if (!val || typeof val !== 'string') return "";
    if (val.includes('-')) return val;
    try {
      const date = parse(val, "dd/MM/yyyy", new Date());
      if (isNaN(date.getTime())) return "";
      return format(date, "yyyy-MM-dd");
    } catch (e) { return ""; }
  };

  const fromInputDate = (val: any) => {
    if (!val || typeof val !== 'string') return "";
    try {
      const date = parse(val, "yyyy-MM-dd", new Date());
      if (isNaN(date.getTime())) return "";
      return format(date, "dd/MM/yyyy");
    } catch (e) { return val; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idField = table === "pelanggan" ? "id_pelanggan" : `id_${table}`;
    const url = initialData ? `/api/${table}/${initialData[idField]}` : `/api/${table}`;
    const method = initialData ? "PUT" : "POST";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) onSuccess();
    else alert("Gagal menyimpan data");
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
      {columns.map(col => (
        <div key={col} className={col === "alamat" ? "col-span-2" : ""}>
          <label className="block text-sm font-semibold text-stone-700 mb-2 capitalize">
            {col.replace(/_/g, ' ')} {isRequired(col) && <span className="text-red-500">*</span>}
          </label>
          {col === "seksi" ? (
            <select 
              value={formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              required={isRequired(col)}
            >
              <option value="">Pilih Seksi</option>
              <option value="CHTB">CHTB</option>
              <option value="J&C">J&C</option>
            </select>
          ) : col === "jenis" ? (
            <select 
              value={formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              required={isRequired(col)}
            >
              <option value="">Pilih Jenis</option>
              <option value="PDAM">PDAM</option>
              <option value="Industri">Industri</option>
            </select>
          ) : col === "status" ? (
            <select 
              value={formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              required={isRequired(col)}
            >
              <option value="">Pilih Status</option>
              <option value="Relasi">Relasi</option>
              <option value="Non Relasi">Non Relasi</option>
            </select>
          ) : col === "mp" ? (
            <select 
              value={formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              required={isRequired(col)}
            >
              <option value="">Pilih MP</option>
              <option value="Y">Y</option>
              <option value="T">T</option>
            </select>
          ) : col === "instansi" ? (
            <select 
              value={formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              required={isRequired(col)}
            >
              <option value="">Pilih Instansi</option>
              <option value="PUPR">PUPR</option>
              <option value="Pemrov">Pemrov</option>
            </select>
          ) : (
            <input 
              type={isDateColumn(col) ? "date" : col === "max" || col === "min" || col === "angka" || col === "bulan" || col === "tahun" ? "number" : "text"}
              step={col === "max" || col === "min" || col === "angka" ? "0.01" : "1"}
              value={isDateColumn(col) ? toInputDate(formData[col]) : formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: isDateColumn(col) ? fromInputDate(e.target.value) : e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              required={isRequired(col)}
            />
          )}
        </div>
      ))}
      <div className="col-span-2 pt-4">
        <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
          Simpan Data
        </button>
      </div>
    </form>
  );
}

function BillingCalculator() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/calculate")
      .then(res => res.json())
      .then(resData => {
        setData(Array.isArray(resData) ? resData : []);
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setLoading(false);
      });
  }, []);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Perhitungan Tagihan");
    XLSX.writeFile(wb, "perhitungan_tagihan.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hitung Tagihan</h2>
          <p className="text-stone-500 mt-1">Hasil perhitungan otomatis berdasarkan data meter dan tarif.</p>
        </div>
        <button onClick={handleExport} className="bg-emerald-500 text-white px-6 py-2 rounded-xl hover:bg-emerald-600 flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20 transition-all">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/50 text-stone-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Nama Pelanggan</th>
                <th className="px-4 py-3">Intake</th>
                <th className="px-4 py-3">Angka</th>
                <th className="px-4 py-3">Ditagihkan</th>
                <th className="px-4 py-3">Tarif</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Pembulatan</th>
                <th className="px-4 py-3">PPN (11%)</th>
                <th className="px-4 py-3">Materai</th>
                <th className="px-4 py-3 font-black text-stone-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3 text-stone-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    <div className="font-bold">{row.no_invoice}</div>
                    <div className="text-[10px] text-stone-400">{row.tanggal_invoice}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{row.nama}</td>
                  <td className="px-4 py-3">{row.intake}</td>
                  <td className="px-4 py-3">{formatNumber(row.angka)}</td>
                  <td className="px-4 py-3 font-medium text-blue-600">{formatNumber(row.ditagihkan)}</td>
                  <td className="px-4 py-3">{formatNumber(row.tarif)}</td>
                  <td className="px-4 py-3">{formatNumber(row.jumlah)}</td>
                  <td className="px-4 py-3">{formatNumber(row.pembulatan)}</td>
                  <td className="px-4 py-3">{formatNumber(row.ppn)}</td>
                  <td className="px-4 py-3">{formatNumber(row.materai)}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsageRecap() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  useEffect(() => {
    fetch("/api/usage/recap")
      .then(res => res.json())
      .then(resData => {
        setData(Array.isArray(resData) ? resData : []);
      })
      .catch(() => setData([]));
  }, []);

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      const matchesSearch = Object.values(item).some(val => String(val).toLowerCase().includes(search.toLowerCase()));
      const matchesBulan = filterBulan === "" || String(item.bulan) === filterBulan;
      const matchesTahun = filterTahun === "" || String(item.tahun) === filterTahun;
      return matchesSearch && matchesBulan && matchesTahun;
    });
  }, [data, search, filterBulan, filterTahun]);

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(data.map(item => Number(item.tahun)))).filter(Boolean).sort((a, b) => (b as number) - (a as number));
    return uniqueYears;
  }, [data]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Pemakaian");
    XLSX.writeFile(wb, "rekap_pemakaian.xlsx");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rekap Pemakaian</h2>
          <p className="text-stone-500 mt-1">Rekapitulasi pemakaian air berdasarkan data meter.</p>
        </div>
        <button onClick={handleExport} className="bg-emerald-500 text-white px-6 py-2 rounded-xl hover:bg-emerald-600 flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/20 transition-all">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-wrap items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari data..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <select 
            value={filterBulan} 
            onChange={(e) => setFilterBulan(e.target.value)}
            className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
          >
            <option value="">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={String(m)}>{format(new Date(2000, m - 1, 1), 'MMMM')}</option>
            ))}
          </select>
          <select 
            value={filterTahun} 
            onChange={(e) => setFilterTahun(e.target.value)}
            className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
          >
            <option value="">Semua Tahun</option>
            {years.map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <div className="ml-auto text-sm font-medium text-stone-500">
            Menampilkan <span className="text-stone-900">{filteredData.length}</span> data
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/50 text-stone-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Pelanggan</th>
                <th className="px-4 py-3">No BA</th>
                <th className="px-4 py-3">Intake</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Angka</th>
                <th className="px-4 py-3">Ditagihkan</th>
                <th className="px-4 py-3">Bulan</th>
                <th className="px-4 py-3">Tahun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3 text-stone-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold">{row.nama_pelanggan}</td>
                  <td className="px-4 py-3">{row.no_ba}</td>
                  <td className="px-4 py-3">{row.intake}</td>
                  <td className="px-4 py-3">{row.lokasi}</td>
                  <td className="px-4 py-3">{formatNumber(row.angka)}</td>
                  <td className="px-4 py-3 font-medium text-blue-600">{formatNumber(row.ditagihkan)}</td>
                  <td className="px-4 py-3">{row.bulan}</td>
                  <td className="px-4 py-3">{row.tahun}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const [reportType, setReportType] = useState<ReportType>("pelanggan");
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filters
  const [filterSeksi, setFilterSeksi] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterInstansi, setFilterInstansi] = useState("");
  const [filterMP, setFilterMP] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");

  const fetchData = () => {
    const endpoint = (reportType === "gabungan" || reportType === "izin" || reportType === "kontrak") 
                     ? `/api/reports/${reportType}` 
                     : reportType === "rekap" ? "/api/billing/calculate" : `/api/${reportType}`;
    fetch(endpoint)
      .then(res => res.json())
      .then(resData => {
        setData(Array.isArray(resData) ? resData : []);
      })
      .catch(() => setData([]));
  };

  useEffect(() => {
    fetchData();
    setSortConfig(null);
    setFilterSeksi("");
    setFilterJenis("");
    setFilterStatus("");
    setFilterInstansi("");
    setFilterMP("");
    setFilterBulan("");
    setFilterTahun("");
  }, [reportType]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? data.filter(item => {
      const matchesSearch = Object.values(item).some(val => String(val).toLowerCase().includes(search.toLowerCase()));
      
      let matchesFilters = true;
      if (reportType === "pelanggan") {
        if (filterSeksi && item.seksi !== filterSeksi) matchesFilters = false;
        if (filterJenis && item.jenis !== filterJenis) matchesFilters = false;
        if (filterStatus && item.status !== filterStatus) matchesFilters = false;
      } else if (reportType === "izin") {
        if (filterInstansi && item.instansi !== filterInstansi) matchesFilters = false;
      } else if (reportType === "kontrak") {
        if (filterMP && item.mp !== filterMP) matchesFilters = false;
      } else if (reportType === "gabungan") {
        if (filterSeksi && item.seksi !== filterSeksi) matchesFilters = false;
        if (filterJenis && item.jenis !== filterJenis) matchesFilters = false;
        if (filterStatus && item.status !== filterStatus) matchesFilters = false;
        if (filterInstansi && item.instansi !== filterInstansi) matchesFilters = false;
      } else if (reportType === "rekap") {
        if (filterBulan && String(item.bulan) !== filterBulan) matchesFilters = false;
        if (filterTahun && String(item.tahun) !== filterTahun) matchesFilters = false;
      }
      
      return matchesSearch && matchesFilters;
    }) : [];

    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, search, sortConfig, reportType, filterSeksi, filterJenis, filterStatus, filterInstansi, filterMP, filterBulan, filterTahun]);

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(data.map(item => Number(item.tahun)))).filter(Boolean).sort((a, b) => (b as number) - (a as number));
    return uniqueYears;
  }, [data]);

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `Laporan_${reportType}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'pt');
    const headers = Object.keys(filteredData[0] || {}).map(h => h.replace(/_/g, ' ').toUpperCase());
    const rows = filteredData.map(row => Object.values(row));
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    doc.save(`Laporan_${reportType}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan & Analisis</h2>
          <p className="text-stone-500 mt-1">Ekspor data dan laporan gabungan untuk kebutuhan audit.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportExcel} className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl hover:bg-stone-50 flex items-center gap-2 font-medium transition-all">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={handleExportPDF} className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-xl hover:bg-stone-50 flex items-center gap-2 font-medium transition-all">
            <FileJson className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-1 bg-stone-200/50 rounded-2xl w-fit">
        {(["pelanggan", "izin", "kontrak", "gabungan", "rekap"] as ReportType[]).map(type => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
              reportType === type ? "bg-white text-emerald-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-wrap items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari di laporan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          {(reportType === "pelanggan" || reportType === "gabungan") && (
            <>
              <select value={filterSeksi} onChange={(e) => setFilterSeksi(e.target.value)} className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
                <option value="">Semua Seksi</option>
                <option value="CHTB">CHTB</option>
                <option value="J&C">J&C</option>
              </select>
              <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
                <option value="">Semua Jenis</option>
                <option value="PDAM">PDAM</option>
                <option value="Industri">Industri</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
                <option value="">Semua Status</option>
                <option value="Relasi">Relasi</option>
                <option value="Non Relasi">Non Relasi</option>
              </select>
            </>
          )}

          {(reportType === "izin" || reportType === "gabungan") && (
            <select value={filterInstansi} onChange={(e) => setFilterInstansi(e.target.value)} className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
              <option value="">Semua Instansi</option>
              <option value="PUPR">PUPR</option>
              <option value="Pemrov">Pemrov</option>
            </select>
          )}

          {reportType === "kontrak" && (
            <select value={filterMP} onChange={(e) => setFilterMP(e.target.value)} className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
              <option value="">Semua MP</option>
              <option value="Y">Ya (MP)</option>
              <option value="T">Tidak (MP)</option>
            </select>
          )}

          {reportType === "rekap" && (
            <>
              <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
                <option value="">Semua Bulan</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={String(m)}>{format(new Date(2000, m - 1, 1), 'MMMM')}</option>
                ))}
              </select>
              <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="px-4 py-2 bg-stone-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
                <option value="">Semua Tahun</option>
                {years.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </>
          )}

          <div className="ml-auto text-sm font-medium text-stone-500">
            Menampilkan <span className="text-stone-900">{filteredData.length}</span> data
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/50 text-stone-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-3">No</th>
                {filteredData.length > 0 && Object.keys(filteredData[0]).map(key => (
                  <th 
                    key={key} 
                    className="px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {key.replace(/_/g, ' ')}
                      {sortConfig?.key === key && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3 text-stone-400">{idx + 1}</td>
                  {Object.keys(row).map((key, i) => {
                    const val = row[key];
                    return (
                      <td key={i} className="px-4 py-3 font-medium">
                        {val === null || val === undefined ? "" : 
                         (typeof val === 'number' ? formatNumber(val) : String(val))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

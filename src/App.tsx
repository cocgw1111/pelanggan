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
  FileJson,
  ChevronLeft,
  ChevronRight,
  UserCog
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parse } from "date-fns";

// Types
type Tab = "dashboard" | "pelanggan" | "izin" | "kontrak" | "meter" | "tagihan" | "billing" | "reports" | "rekap_pemakaian" | "users";
type ReportType = "pelanggan" | "izin" | "kontrak" | "gabungan" | "rekap";

interface User {
  username: string;
}

// Helper for currency and decimal formatting
const formatNumber = (num: number) => num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatCurrency = (num: number) => num.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2 });
const isDateColumn = (col: string) => col.includes('tanggal') || col.includes('mulai') || col.includes('akhir');
const isYearOrMonthColumn = (col: string) => col.includes('bulan') || col.includes('tahun');

export default function App() {
  const [user, setUser] = useState<User | null>({ username: "Admin" });
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);

  // Monitor screen size and set sidebar state accordingly
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize(); // Run on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin logout?")) return;
    try {
      await fetch("/api/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-white">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="d-flex overflow-hidden bg-light" style={{ minHeight: "100vh" }}>
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-40 z-3"
            style={{ backdropFilter: "blur(2px)" }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Section */}
      <aside 
        className="bg-dark text-white d-flex flex-column position-fixed h-100 z-3 border-end border-dark" 
        style={{ 
          width: "260px",
          transform: isSidebarOpen ? "translateX(0)" : "translateX(-260px)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isSidebarOpen ? "0 4px 20px rgba(0,0,0,0.15)" : "none"
        }}
      >
        <div className="p-4 d-flex align-items-center justify-content-between border-b border-dark-subtle" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
              <ClipboardCheck className="text-white" style={{ width: "20px", height: "20px" }} />
            </div>
            <span className="fw-bold fs-5 tracking-tight text-white mb-0">UW IV Portal</span>
          </div>
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="btn btn-dark p-1 border-0"
            >
              <X className="text-white-50" style={{ width: "20px", height: "20px" }} />
            </button>
          )}
        </div>

        <nav className="flex-grow-1 p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 150px)" }}>
          <div className="mb-2">
            <span className="text-uppercase text-secondary fw-bold" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Utama</span>
          </div>
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} />
          
          <div className="mt-4 mb-2">
            <span className="text-uppercase text-secondary fw-bold" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Data Master</span>
          </div>
          <NavItem icon={<Users />} label="Pelanggan" active={activeTab === "pelanggan"} onClick={() => setActiveTab("pelanggan")} />
          <NavItem icon={<FileText />} label="Izin" active={activeTab === "izin"} onClick={() => setActiveTab("izin")} />
          <NavItem icon={<ClipboardCheck />} label="Kontrak" active={activeTab === "kontrak"} onClick={() => setActiveTab("kontrak")} />
          <NavItem icon={<TableIcon />} label="Meter Air" active={activeTab === "meter"} onClick={() => setActiveTab("meter")} />
          <NavItem icon={<FileText />} label="Tagihan" active={activeTab === "tagihan"} onClick={() => setActiveTab("tagihan")} />
          
          <div className="mt-4 mb-2">
            <span className="text-uppercase text-secondary fw-bold" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Operasional</span>
          </div>
          <NavItem icon={<Calculator />} label="Hitung Tagihan" active={activeTab === "billing"} onClick={() => setActiveTab("billing")} />
          <NavItem icon={<ClipboardCheck />} label="Rekap Pemakaian" active={activeTab === "rekap_pemakaian"} onClick={() => setActiveTab("rekap_pemakaian")} />
          <NavItem icon={<FileSpreadsheet />} label="Laporan" active={activeTab === "reports"} onClick={() => setActiveTab("reports")} />

          <div className="mt-4 mb-2">
            <span className="text-uppercase text-secondary fw-bold" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>Sistem</span>
          </div>
          <NavItem icon={<UserCog />} label="Kelola User" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
        </nav>

        <div className="p-3 border-top border-dark-subtle mt-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button 
            onClick={handleLogout} 
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 border-0"
          >
            <LogOut style={{ width: "16px", height: "16px" }} />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <main 
        className="flex-grow-1 d-flex flex-column vh-100 overflow-auto" 
        style={{ 
          paddingLeft: (!isMobile && isSidebarOpen) ? "260px" : "0", 
          transition: "padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          width: "100%"
        }}
      >
        {/* Navbar Header */}
        <header className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-4" style={{ height: "64px" }}>
          <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="btn btn-light border-0 rounded-circle p-2 d-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px" }}
            >
              {isSidebarOpen ? <X style={{ width: "20px", height: "20px" }} /> : <Menu style={{ width: "20px", height: "20px" }} />}
            </button>
            
            <div className="d-flex align-items-center gap-3">
              <div className="text-end d-none d-sm-block">
                <span className="fw-bold d-block text-dark small">{user.username}</span>
                <span className="text-muted fw-semibold uppercase" style={{ fontSize: "0.65rem" }}>Administrasi UW IV</span>
              </div>
              <div 
                className="bg-success text-white fw-bold d-flex align-items-center justify-content-center rounded-circle fs-5 shadow-sm" 
                style={{ width: "40px", height: "40px" }}
              >
                {user.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Frame */}
        <div className="container-fluid p-4" style={{ minHeight: "calc(100vh - 64px)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
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
              {activeTab === "users" && <UserManager />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`btn w-100 d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 border-0 text-start my-1 text-inherit shadow-none transition-all ${
        active 
          ? "bg-success text-white fw-bold shadow-sm" 
          : "bg-transparent text-light opacity-75 hover-opacity-100"
      }`}
      style={{ cursor: "pointer", fontSize: "0.85rem" }}
    >
      <span className="d-flex align-items-center text-inherit">{icon}</span>
      <span className="text-inherit">{label}</span>
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
    if (data.success) {
      onLogin(data.user);
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card border-0 shadow-lg p-5"
        style={{ width: "100%", maxWidth: "440px", borderRadius: "1.25rem" }}
      >
        <div className="text-center mb-5">
          <div className="mx-auto rounded-4 bg-success text-white d-flex align-items-center justify-content-center mb-4 shadow" style={{ width: "60px", height: "60px" }}>
            <ClipboardCheck style={{ width: "32px", height: "32px" }} />
          </div>
          <h2 className="fw-bold text-dark text-shadow-sm mb-1">Aplikasi Pelanggan</h2>
          <p className="text-muted small">Kelola data pelanggan air baku Unit Wilayah IV</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger border-0 p-3 mb-4 rounded-3 text-center small fw-semibold">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="form-label text-secondary fw-semibold small mb-2">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="form-control py-2.5 px-3 border-secondary-subtle"
              style={{ borderRadius: "10px" }}
              placeholder="admin"
              required
            />
          </div>
          
          <div className="mb-5">
            <label className="form-label text-secondary fw-semibold small mb-2">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="form-control py-2.5 px-3 border-secondary-subtle"
              style={{ borderRadius: "10px" }}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            className="btn btn-success w-100 py-3 fw-bold shadow-sm"
            style={{ borderRadius: "10px" }}
          >
            Masuk Sekarang
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

  if (!metrics) {
    return (
      <div className="py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12">
        <h2 className="fw-bold tracking-tight mb-1 text-dark">Ringkasan Dasbor</h2>
        <p className="text-secondary small">Gambaran umum operasional sistem Anda hari ini.</p>
      </div>

      <div className="col-12 col-md-6 col-lg-4 col-xl-2.4 pe-xl-1" style={{ width: "20%" }}>
        <MetricCard label="Total Pelanggan" value={metrics.totalPelanggan} icon={<Users />} color="bg-primary" />
      </div>
      <div className="col-12 col-md-6 col-lg-4 col-xl-2.4 px-xl-2" style={{ width: "20%" }}>
        <MetricCard label="Total Kontrak" value={metrics.totalKontrak} icon={<ClipboardCheck />} color="bg-info" />
      </div>
      <div className="col-12 col-md-6 col-lg-4 col-xl-2.4 px-xl-2" style={{ width: "20%" }}>
        <MetricCard label="Total Izin" value={metrics.totalIzin} icon={<FileText />} color="bg-success" />
      </div>
      <div className="col-12 col-md-6 col-lg-4 col-xl-2.4 px-xl-2" style={{ width: "20%" }}>
        <MetricCard label="Izin Habis" value={metrics.izinHabis} icon={<FileText />} color="bg-danger" />
      </div>
      <div className="col-12 col-md-6 col-lg-4 col-xl-2.4 ps-xl-1" style={{ width: "20%" }}>
        <MetricCard label="Kontrak Habis" value={metrics.kontrakHabis} icon={<ClipboardCheck />} color="bg-warning" />
      </div>

      <div className="col-12 col-xl-6 mt-4">
        <div className="card h-100 border-0 shadow-sm p-4" style={{ borderRadius: "1rem" }}>
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
            <h5 className="fw-bold text-dark mb-0">Izin Habis Masa Berlaku</h5>
            <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold">{metrics.izinHabis}</span>
          </div>
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "380px" }}>
            {metrics.expiredIzinList && metrics.expiredIzinList.length > 0 ? (
              metrics.expiredIzinList.map((izin: any) => (
                <div key={izin.id_izin} className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border-0 mb-2 hover-shadow-sm transition-all">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                      <FileText style={{ width: "18px", height: "18px" }} />
                    </div>
                    <div>
                      <span className="fw-bold text-dark d-block text-truncate" style={{ maxWidth: "200px" }}>{izin.nama_pelanggan}</span>
                      <span className="text-secondary small">ID: {izin.id_izin} • {izin.intake}</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold text-danger d-block small">{izin.akhir_izin}</span>
                    <span className="text-muted uppercase fw-bold" style={{ fontSize: "0.55rem" }}>Tenggat Akhir</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-muted">
                <ClipboardCheck className="mb-3 opacity-25" style={{ width: "48px", height: "48px" }} />
                <p className="mb-0 small">Semua izin masih aktif berlaku.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 col-xl-6 mt-4">
        <div className="card h-100 border-0 shadow-sm p-4" style={{ borderRadius: "1rem" }}>
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
            <h5 className="fw-bold text-dark mb-0">Kontrak Habis Masa Berlaku</h5>
            <span className="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold">{metrics.kontrakHabis}</span>
          </div>
          <div className="overflow-y-auto pr-1" style={{ maxHeight: "380px" }}>
            {metrics.expiredKontrakList && metrics.expiredKontrakList.length > 0 ? (
              metrics.expiredKontrakList.map((kontrak: any) => (
                <div key={kontrak.id_kontrak} className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border-0 mb-2 hover-shadow-sm transition-all">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning bg-opacity-10 text-warning-emphasis rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                      <ClipboardCheck style={{ width: "18px", height: "18px" }} />
                    </div>
                    <div>
                      <span className="fw-bold text-dark d-block text-truncate" style={{ maxWidth: "200px" }}>{kontrak.nama_pelanggan}</span>
                      <span className="text-secondary small">
                        ID: {kontrak.id_kontrak} • {kontrak.akhir_amd ? `AMD: ${kontrak.no_amd}` : `Kntrk: ${kontrak.no_kontrak}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold text-warning-emphasis d-block small">{kontrak.akhir_amd || kontrak.akhir_kontrak}</span>
                    <span className="text-muted uppercase fw-bold" style={{ fontSize: "0.55rem" }}>Tenggat Akhir</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-5 text-center text-muted">
                <ClipboardCheck className="mb-3 opacity-25" style={{ width: "48px", height: "48px" }} />
                <p className="mb-0 small">Semua kontrak masih aktif berlaku.</p>
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
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4 d-flex align-items-center gap-3">
        <div className={`p-3 rounded-3 text-white ${color} d-flex align-items-center justify-content-center shadow-sm`} style={{ width: "50px", height: "50px" }}>
          {icon}
        </div>
        <div>
          <h6 className="text-muted mb-1 text-uppercase fw-semibold" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>{label}</h6>
          <h3 className="fw-bold mb-0 text-dark">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function UserManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = () => {
    fetch("/api/users")
      .then(res => res.json())
      .then(setUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUser ? "PUT" : "POST";
    const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
    
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (data.success) {
      setIsModalOpen(false);
      setEditingUser(null);
      setUsername("");
      setPassword("");
      setError("");
      fetchUsers();
    } else {
      setError(data.error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus user ini?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Kelola Pengguna</h2>
          <p className="text-secondary small m-0">Daftar pengguna terdaftar pada sistem.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setUsername(""); setPassword(""); setIsModalOpen(true); }}
          className="btn btn-success d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          <span>Tambah User</span>
        </button>
      </div>

      <div className="card border-0 shadow-sm p-4">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0 text-sm">
            <thead>
              <tr className="table-light text-secondary text-uppercase fw-semibold" style={{ fontSize: "0.75rem" }}>
                <th className="py-3 px-4" style={{ width: "80px" }}>No</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4 text-end">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id}>
                  <td className="py-3 px-4 text-muted">{idx + 1}</td>
                  <td className="py-3 px-4 fw-semibold text-dark">{u.username}</td>
                  <td className="py-3 px-4 text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button 
                        onClick={() => { setEditingUser(u); setUsername(u.username); setPassword(""); setIsModalOpen(true); }}
                        className="btn btn-sm btn-outline-primary d-inline-flex p-1.5 border-0"
                      >
                        <Edit style={{ width: "14px", height: "14px" }} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="btn btn-sm btn-outline-danger d-inline-flex p-1.5 border-0"
                      >
                        <Trash2 style={{ width: "14px", height: "14px" }} />
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
          title={editingUser ? "Modifikasi User" : "Tambah User Baru"} 
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="row g-4">
            {error && <div className="col-12 alert alert-danger border-0">{error}</div>}
            
            <div className="col-12">
              <label className="form-label text-secondary fw-semibold small mb-2">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="form-control border-secondary-subtle"
                required
              />
            </div>
            
            <div className="col-12">
              <label className="form-label text-secondary fw-semibold small mb-2">
                Password {editingUser && <span className="text-muted fw-normal">(Biarkan kosong untuk mempertahankan lama)</span>}
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="form-control border-secondary-subtle"
                required={!editingUser}
              />
            </div>

            <div className="col-12 d-flex gap-3 pt-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-light border-0 py-2.5 px-4 flex-grow-1"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="btn btn-success py-2.5 px-4 flex-grow-1 fw-semibold text-white shadow-sm"
              >
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage 
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void,
  totalItems: number,
  itemsPerPage: number
}) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="card-footer bg-light border-top p-3 d-flex flex-wrap align-items-center justify-content-between">
      <div className="small text-secondary mb-2 mb-sm-0">
        Menampilkan <span className="fw-bold text-dark">{startIdx}</span> - <span className="fw-bold text-dark">{endIdx}</span> dari <span className="fw-bold text-dark">{totalItems}</span> data
      </div>
      <nav aria-label="Page navigation" className="mb-0">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(currentPage - 1)} aria-label="Previous">
              <ChevronLeft style={{ width: "12px", height: "12px" }} />
            </button>
          </li>
          
          {(() => {
            let startPage = 1;
            let endPage = totalPages;
            if (totalPages > 10) {
              const half = 5;
              if (currentPage <= half) {
                startPage = 1;
                endPage = 10;
              } else if (currentPage + half - 1 >= totalPages) {
                startPage = totalPages - 9;
                endPage = totalPages;
              } else {
                startPage = currentPage - half;
                endPage = currentPage + half - 1;
              }
            }
            return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
          })().map(pageNum => (
            <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
              <button className="page-link" onClick={() => onPageChange(pageNum)}>
                {pageNum}
              </button>
            </li>
          ))}

          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => onPageChange(currentPage + 1)} aria-label="Next">
              <ChevronRight style={{ width: "12px", height: "12px" }} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function TableManager({ table }: { table: Tab }) {
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [minAngkaFilter, setMinAngkaFilter] = useState<number>(0);
  const [monthFilterSlider, setMonthFilterSlider] = useState<number>(0);

  const fetchedMaxAngka = useMemo(() => {
    if (table !== "meter" || !Array.isArray(data)) return 1000;
    const values = data.map(item => Number(item.angka) || 0);
    return values.length > 0 ? Math.max(...values) : 1000;
  }, [data, table]);

  useEffect(() => {
    setMinAngkaFilter(0);
    setMonthFilterSlider(0);
  }, [table, data]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, minAngkaFilter, monthFilterSlider]);

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
    setCurrentPage(1);
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

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      const matchesSearch = Object.values(item).some(val => 
        String(val).toLowerCase().includes(search.toLowerCase())
      );
      
      let matchesSliders = true;
      if (table === "meter") {
        const valAngka = Number(item.angka) || 0;
        if (valAngka < minAngkaFilter) {
          matchesSliders = false;
        }
      } else if (table === "tagihan" && monthFilterSlider > 0) {
        if (Number(item.bulan_lap) !== monthFilterSlider) {
          matchesSliders = false;
        }
      }
      
      return matchesSearch && matchesSliders;
    });
  }, [data, search, table, minAngkaFilter, monthFilterSlider]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="row g-4">
      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h2 className="fw-bold text-dark text-capitalize mb-1">Kelola {table}</h2>
          <p className="text-secondary small m-0">Manajemen data master tabel {table} secara komprehensif.</p>
        </div>
        
        <div className="d-flex flex-wrap gap-2">
          <button onClick={() => {
            const ws = XLSX.utils.json_to_sheet([columns.reduce((acc, col) => ({ ...acc, [col]: "" }), {})]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Template");
            XLSX.writeFile(wb, `template_${table}.xlsx`);
          }} className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 fw-medium border-secondary-subtle">
            <FileSpreadsheet style={{ width: "16px", height: "16px" }} />
            <span>Template</span>
          </button>
          
          <label className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 fw-medium border-secondary-subtle m-0">
            <Upload style={{ width: "16px", height: "16px" }} />
            <span>Import Excel</span>
            <input type="file" className="d-none" onChange={handleImport} accept=".xlsx, .xls" />
          </label>
          
          <button onClick={handleExport} className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 fw-medium border-secondary-subtle">
            <Download style={{ width: "16px", height: "16px" }} />
            <span>Export Excel</span>
          </button>
          
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="btn btn-success d-inline-flex align-items-center gap-2 fw-bold shadow-sm"
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="p-3 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="position-relative" style={{ width: "320px" }}>
              <span className="position-absolute head-search-icon start-3 top-50 translate-middle-y text-secondary opacity-75 ps-3" style={{ pointerEvents: "none" }}>
                <Search style={{ width: "14px", height: "14px" }} />
              </span>
              <input 
                type="text" 
                placeholder="Cari data di tabel ini..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control pl-5 border-secondary-subtle"
                style={{ borderRadius: "10px", paddingLeft: "36px" }}
              />
            </div>

            {/* Slider Horizontal for Meter (Angka Meter Range Filter) */}
            {table === "meter" && (
              <div className="d-flex align-items-center gap-3 flex-grow-1 mx-md-3" style={{ minWidth: "280px", maxWidth: "450px" }}>
                <div className="w-100">
                  <div className="d-flex justify-content-between text-secondary small fw-bold mb-1">
                    <span>Mulai Angka Meter: {formatNumber(minAngkaFilter)}</span>
                    <span>Max: {formatNumber(fetchedMaxAngka)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={0}
                    max={fetchedMaxAngka}
                    step={10}
                    value={minAngkaFilter}
                    onChange={(e) => setMinAngkaFilter(Number(e.target.value))}
                    className="form-range"
                    style={{ accentColor: "#198754" }}
                  />
                </div>
                <button 
                  onClick={() => setMinAngkaFilter(0)}
                  className="btn btn-sm btn-outline-secondary border-secondary-subtle font-medium text-xs px-2.5 py-1.5"
                  style={{ borderRadius: "6px" }}
                >
                  Reset
                </button>
              </div>
            )}

            {/* Slider Horizontal for Tagihan (Bulan Lapor Filter) */}
            {table === "tagihan" && (
              <div className="d-flex align-items-center gap-3 flex-grow-1 mx-md-3" style={{ minWidth: "265px", maxWidth: "380px" }}>
                <div className="w-100">
                  <div className="d-flex justify-content-between text-secondary small fw-bold mb-1">
                    <span>Bulan Lapor: {monthFilterSlider === 0 ? "Semua Bulan" : format(new Date(2000, monthFilterSlider - 1, 1), 'MMMM')}</span>
                    <span className="text-secondary tracking-wide font-mono">Bln: {monthFilterSlider}/12</span>
                  </div>
                  <input 
                    type="range" 
                    min={0}
                    max={12}
                    step={1}
                    value={monthFilterSlider}
                    onChange={(e) => setMonthFilterSlider(Number(e.target.value))}
                    className="form-range"
                    style={{ accentColor: "#198754" }}
                  />
                </div>
                <button 
                  onClick={() => setMonthFilterSlider(0)}
                  className="btn btn-sm btn-outline-secondary border-secondary-subtle font-medium text-xs px-2.5 py-1.5"
                  style={{ borderRadius: "6px" }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
          
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0 text-sm">
              <thead>
                <tr className="table-light text-secondary uppercase fw-semibold" style={{ fontSize: "0.72rem" }}>
                  <th className="py-3 px-4" style={{ width: "70px" }}>No</th>
                  {columns.map(col => <th key={col} className="py-3 px-4">{col.replace(/_/g, ' ')}</th>)}
                  <th className="py-3 px-4 text-end" style={{ width: "100px" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 text-secondary opacity-75">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    {columns.map(col => (
                      <td key={col} className="py-3 px-4 fw-medium text-dark">
                        {isDateColumn(col) ? item[col] : 
                         isYearOrMonthColumn(col) ? item[col] :
                         typeof item[col] === 'number' ? formatNumber(item[col]) : item[col]}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button 
                          onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                          className="btn btn-outline-primary btn-sm border-0 d-inline-flex p-1.5"
                        >
                          <Edit style={{ width: "14px", height: "14px" }} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item[table === "pelanggan" ? "id_pelanggan" : `id_${table}`])}
                          className="btn btn-outline-danger btn-sm border-0 d-inline-flex p-1.5"
                        >
                          <Trash2 style={{ width: "14px", height: "14px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} className="py-5 text-center text-secondary">
                      Tidak ada data ditemukan yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            totalItems={filteredData.length} 
            itemsPerPage={itemsPerPage} 
          />
        </div>
      </div>

      {isModalOpen && (
        <Modal 
          title={editingItem ? `Ubah Data ${table}` : `Tambah Data ${table}`} 
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
    <div className="modal show d-block bg-dark bg-opacity-50" tabIndex={-1} style={{ zIndex: 1060 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -15 }}
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: "1.25rem" }}
        >
          <div className="modal-header bg-light border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-dark">{title}</h5>
            <button type="button" className="btn-close shadow-none border-0" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body p-4 bg-white" style={{ maxHeight: "calc(100vh - 180px)" }}>
            {children}
          </div>
        </motion.div>
      </div>
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
    
    if (res.ok) {
      onSuccess();
    } else {
      alert("Gagal menyimpan data");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-4">
      {columns.map(col => (
        <div key={col} className={col === "alamat" ? "col-12" : "col-md-6"}>
          <label className="form-label text-secondary fw-semibold small mb-2 text-capitalize">
            {col.replace(/_/g, ' ')} {isRequired(col) && <span className="text-danger">*</span>}
          </label>
          
          {col === "seksi" ? (
            <select 
              value={formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
              className="form-select border-secondary-subtle"
              style={{ borderRadius: "8px" }}
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
              className="form-select border-secondary-subtle"
              style={{ borderRadius: "8px" }}
              required={isRequired(col)}
            >
              <option value="">Pilih Jenis</option>
              <option value="PDAM">PDAM</option>
              <option value="Industri">Industri</option>
              <option value="PLTA">PLTA</option>
            </select>
          ) : col === "status" ? (
            <select 
              value={formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
              className="form-select border-secondary-subtle"
              style={{ borderRadius: "8px" }}
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
              className="form-select border-secondary-subtle"
              style={{ borderRadius: "8px" }}
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
              className="form-select border-secondary-subtle"
              style={{ borderRadius: "8px" }}
              required={isRequired(col)}
            >
              <option value="">Pilih Instansi</option>
              <option value="PUPR">PUPR</option>
              <option value="Pemprov">Pemprov</option>
            </select>
          ) : (
            <input 
              type={isDateColumn(col) ? "date" : col === "max" || col === "min" || col === "angka" || col === "bulan" || col === "tahun" ? "number" : "text"}
              step={col === "max" || col === "min" || col === "angka" ? "0.01" : "1"}
              value={isDateColumn(col) ? toInputDate(formData[col]) : formData[col] || ""} 
              onChange={(e) => setFormData({ ...formData, [col]: isDateColumn(col) ? fromInputDate(e.target.value) : e.target.value })}
              className="form-control border-secondary-subtle"
              style={{ borderRadius: "8px" }}
              required={isRequired(col)}
            />
          )}
        </div>
      ))}
      <div className="col-12 pt-3">
        <button type="submit" className="btn btn-success w-100 py-3 fw-bold text-white shadow-sm" style={{ borderRadius: "10px" }}>
          Simpan Data
        </button>
      </div>
    </form>
  );
}

function BillingCalculator() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="row g-4">
      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Hitung Tagihan</h2>
          <p className="text-secondary small m-0">Skema penghitungan retribusi air baku berdasar meter digital dan tarif regulasi.</p>
        </div>
        <button onClick={handleExport} className="btn btn-success fw-bold d-inline-flex align-items-center gap-2 shadow-sm">
          <Download style={{ width: "16px", height: "16px" }} />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0 text-xs text-nowrap">
              <thead>
                <tr className="table-light text-secondary uppercase fw-semibold" style={{ fontSize: "0.68rem" }}>
                  <th className="py-3 px-3" style={{ width: "50px" }}>No</th>
                  <th className="py-3 px-3">Nomor Invoice</th>
                  <th className="py-3 px-3">Nama Pelanggan</th>
                  <th className="py-3 px-3">Intake</th>
                  <th className="py-3 px-3">Angka Meter</th>
                  <th className="py-3 px-3">Ditagihkan</th>
                  <th className="py-3 px-3">Tarif Air</th>
                  <th className="py-3 px-3">Nominal Awal</th>
                  <th className="py-3 px-3">Pembulatan</th>
                  <th className="py-3 px-3">PPN (11%)</th>
                  <th className="py-3 px-3">Materai</th>
                  <th className="py-3 px-3 font-semibold text-dark">Total Retribusi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 text-secondary opacity-75">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="fw-bold text-dark d-block">{row.no_invoice}</span>
                      <span className="text-muted" style={{ fontSize: "0.55rem" }}>{row.tanggal_invoice}</span>
                    </td>
                    <td className="py-3 px-3 fw-semibold text-dark">{row.nama}</td>
                    <td className="py-3 px-3 text-muted">{row.intake}</td>
                    <td className="py-3 px-3">{formatNumber(row.angka)}</td>
                    <td className="py-3 px-3 text-primary font-medium">{formatNumber(row.ditagihkan)}</td>
                    <td className="py-3 px-3 text-secondary">{formatNumber(row.tarif)}</td>
                    <td className="py-3 px-3 text-secondary">{formatNumber(row.jumlah)}</td>
                    <td className="py-3 px-3 text-secondary">{formatNumber(row.pembulatan)}</td>
                    <td className="py-3 px-3 text-secondary">{formatNumber(row.ppn)}</td>
                    <td className="py-3 px-3 text-secondary">{formatNumber(row.materai)}</td>
                    <td className="py-3 px-3 fw-bold text-success" style={{ fontSize: "0.85rem" }}>{formatCurrency(row.total)}</td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-5 text-center text-secondary">
                      Tidak ada data perhitungan tagihan aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            totalItems={data.length} 
            itemsPerPage={itemsPerPage} 
          />
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    <div className="row g-4">
      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Rekap Pemakaian</h2>
          <p className="text-secondary small m-0">Rekapitulasi totalitas pembebanan kubikasi air berdasar pencatatan.</p>
        </div>
        <button onClick={handleExport} className="btn btn-success fw-bold d-inline-flex align-items-center gap-2 shadow-sm">
          <Download style={{ width: "16px", height: "16px" }} />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="p-3 bg-light border-bottom d-flex flex-wrap items-center gap-3">
            <div className="position-relative" style={{ width: "240px" }}>
              <span className="position-absolute start-3 top-50 translate-middle-y text-secondary opacity-75 ps-3" style={{ pointerEvents: "none" }}>
                <Search style={{ width: "14px", height: "14px" }} />
              </span>
              <input 
                type="text" 
                placeholder="Cari data rekap..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control pl-5 border-secondary-subtle"
                style={{ borderRadius: "8px", paddingLeft: "36px" }}
              />
            </div>
            
            <select 
              value={filterBulan} 
              onChange={(e) => setFilterBulan(e.target.value)}
              className="form-select border-secondary-subtle"
              style={{ width: "160px", borderRadius: "8px" }}
            >
              <option value="">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={String(m)}>{format(new Date(2000, m - 1, 1), 'MMMM')}</option>
              ))}
            </select>
            
            <select 
              value={filterTahun} 
              onChange={(e) => setFilterTahun(e.target.value)}
              className="form-select border-secondary-subtle"
              style={{ width: "160px", borderRadius: "8px" }}
            >
              <option value="">Semua Tahun</option>
              {years.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>

            <div className="ms-sm-auto text-secondary small fw-semibold">
              Menampilkan <span className="text-dark bg-secondary bg-opacity-10 px-2 py-1 rounded">{filteredData.length}</span> baris
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0 text-xs">
              <thead>
                <tr className="table-light text-secondary uppercase fw-semibold" style={{ fontSize: "0.68rem" }}>
                  <th className="py-3 px-3" style={{ width: "50px" }}>No</th>
                  <th className="py-3 px-3">Nama Pelanggan</th>
                  <th className="py-3 px-3">Seksi</th>
                  <th className="py-3 px-3">No BA</th>
                  <th className="py-3 px-3">Intake</th>
                  <th className="py-3 px-3">Lokasi</th>
                  <th className="py-3 px-3 text-end">Min</th>
                  <th className="py-3 px-3 text-end">Max</th>
                  <th className="py-3 px-3 text-end">Angka Meter</th>
                  <th className="py-3 px-3 text-end font-semibold text-primary">Ditagihkan</th>
                  <th className="py-3 px-3 text-center">Bulan</th>
                  <th className="py-3 px-3 text-center">Tahun</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 text-secondary opacity-75">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="py-3 px-3 fw-semibold text-dark">{row.nama_pelanggan}</td>
                    <td className="py-3 px-3">{row.seksi}</td>
                    <td className="py-3 px-3 text-muted">{row.no_ba}</td>
                    <td className="py-3 px-3 text-muted">{row.intake}</td>
                    <td className="py-3 px-3 text-muted">{row.lokasi}</td>
                    <td className="py-3 px-3 text-end">{formatNumber(row.min)}</td>
                    <td className="py-3 px-3 text-end">{formatNumber(row.max)}</td>
                    <td className="py-3 px-3 text-end font-monospace">{formatNumber(row.angka)}</td>
                    <td className="py-3 px-3 text-end font-monospace fw-bold text-primary">{formatNumber(row.ditagihkan)}</td>
                    <td className="py-3 px-3 text-center text-muted fw-semibold">{row.bulan}</td>
                    <td className="py-3 px-3 text-center text-muted fw-semibold">{row.tahun}</td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-5 text-center text-secondary">
                      Tidak ada rekap pemakaian yang cocok dengan filter yang ditentukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            totalItems={filteredData.length} 
            itemsPerPage={itemsPerPage} 
          />
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setCurrentPage(1);
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
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (isDateColumn(sortConfig.key)) {
          try {
            const cleanA = String(aVal).replace(/\//g, '-');
            const cleanB = String(bVal).replace(/\//g, '-');
            const aDate = parse(cleanA, "dd-MM-yyyy", new Date());
            const bDate = parse(cleanB, "dd-MM-yyyy", new Date());
            aVal = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
            bVal = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
          } catch (e) {
            aVal = 0;
            bVal = 0;
          }
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, search, sortConfig, reportType, filterSeksi, filterJenis, filterStatus, filterInstansi, filterMP, filterBulan, filterTahun]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      headStyles: { fillColor: [25, 135, 84] }
    });
    
    doc.save(`Laporan_${reportType}.pdf`);
  };

  return (
    <div className="row g-4">
      <div className="col-12 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Laporan & Audit Eksternal</h2>
          <p className="text-secondary small m-0">Ekstraksi data kustom dan pencetakan dokumen legal audit sistem.</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleExportExcel} className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 border-secondary-subtle fw-medium">
            <FileSpreadsheet style={{ width: "16px", height: "16px" }} />
            <span>Excel</span>
          </button>
          <button onClick={handleExportPDF} className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 border-secondary-subtle fw-medium">
            <FileJson style={{ width: "16px", height: "16px" }} />
            <span>PDF Dokumen</span>
          </button>
        </div>
      </div>

      <div className="col-12">
        <ul className="nav nav-pills bg-light bg-opacity-50 p-1.5 rounded-3 border w-fit" style={{ display: "inline-flex", gap: "2px" }}>
          {(["pelanggan", "izin", "kontrak", "gabungan", "rekap"] as ReportType[]).map(type => (
            <li className="nav-item" key={type}>
              <button
                onClick={() => setReportType(type)}
                className={`nav-link border-0 text-capitalize px-4 py-2 small fw-bold ${
                  reportType === type ? "bg-white text-success shadow-sm rounded-2 active" : "text-secondary hover-text-dark bg-transparent"
                }`}
                style={{ cursor: "pointer" }}
              >
                Laporan {type}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="p-3 bg-light border-bottom d-flex flex-wrap align-items-center gap-3">
            <div className="position-relative" style={{ width: "240px" }}>
              <span className="position-absolute start-3 top-50 translate-middle-y text-secondary opacity-75 ps-3" style={{ pointerEvents: "none" }}>
                <Search style={{ width: "14px", height: "14px" }} />
              </span>
              <input 
                type="text" 
                placeholder="Cari dalam laporan..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control pl-5 border-secondary-subtle"
                style={{ borderRadius: "8px", paddingLeft: "36px" }}
              />
            </div>

            {(reportType === "pelanggan" || reportType === "gabungan") && (
              <>
                <select value={filterSeksi} onChange={(e) => setFilterSeksi(e.target.value)} className="form-select border-secondary-subtle" style={{ width: "140px", borderRadius: "8px" }}>
                  <option value="">Semua Seksi</option>
                  <option value="CHTB">CHTB</option>
                  <option value="J&C">J&C</option>
                </select>
                <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="form-select border-secondary-subtle" style={{ width: "140px", borderRadius: "8px" }}>
                  <option value="">Semua Jenis</option>
                  <option value="PDAM">PDAM</option>
                  <option value="Industri">Industri</option>
                  <option value="PLTA">PLTA</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-select border-secondary-subtle" style={{ width: "140px", borderRadius: "8px" }}>
                  <option value="">Semua Status</option>
                  <option value="Relasi">Relasi</option>
                  <option value="Non Relasi">Non Relasi</option>
                </select>
              </>
            )}

            {(reportType === "izin" || reportType === "gabungan") && (
              <select value={filterInstansi} onChange={(e) => setFilterInstansi(e.target.value)} className="form-select border-secondary-subtle" style={{ width: "150px", borderRadius: "8px" }}>
                <option value="">Semua Instansi</option>
                <option value="PUPR">PUPR</option>
                <option value="Pemprov">Pemprov</option>
              </select>
            )}

            {reportType === "kontrak" && (
              <select value={filterMP} onChange={(e) => setFilterMP(e.target.value)} className="form-select border-secondary-subtle" style={{ width: "150px", borderRadius: "8px" }}>
                <option value="">Semua MP</option>
                <option value="Y">Ya (MP)</option>
                <option value="T">Tidak (MP)</option>
              </select>
            )}

            {reportType === "rekap" && (
              <>
                <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="form-select border-secondary-subtle" style={{ width: "140px", borderRadius: "8px" }}>
                  <option value="">Semua Bulan</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={String(m)}>{format(new Date(2000, m - 1, 1), 'MMMM')}</option>
                  ))}
                </select>
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="form-select border-secondary-subtle" style={{ width: "140px", borderRadius: "8px" }}>
                  <option value="">Semua Tahun</option>
                  {years.map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </>
            )}

            <div className="ms-sm-auto text-secondary small fw-semibold">
              Filter Result: <span className="text-dark bg-secondary bg-opacity-10 px-2 py-1 rounded">{filteredData.length}</span> baris
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0 text-xs">
              <thead>
                <tr className="table-light text-secondary uppercase fw-semibold" style={{ fontSize: "0.68rem" }}>
                  <th className="py-3 px-3" style={{ width: "50px" }}>No</th>
                  {filteredData.length > 0 && Object.keys(filteredData[0]).map(key => (
                    <th 
                      key={key} 
                      className="py-3 px-3 cursor-pointer hover-bg-dark hover-opacity-10 transition-colors"
                      onClick={() => handleSort(key)}
                    >
                      <div className="d-flex align-items-center gap-1 text-nowrap">
                        <span>{key.replace(/_/g, ' ')}</span>
                        {sortConfig?.key === key && (
                          sortConfig.direction === 'asc' ? <ChevronUp style={{ width: "10px", height: "10px" }} /> : <ChevronDown style={{ width: "10px", height: "10px" }} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 text-secondary opacity-75">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    {Object.keys(row).map((key, i) => {
                      const val = row[key];
                      return (
                        <td key={i} className="py-3 px-3 fw-medium text-dark">
                          {val === null || val === undefined ? "" : 
                           (isYearOrMonthColumn(key) ? String(val) :
                            (typeof val === 'number' ? formatNumber(val) : String(val)))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={filteredData.length > 0 ? Object.keys(filteredData[0]).length + 1 : 2} className="py-5 text-center text-secondary">
                      Tidak ada rekaman ditemukan dalam laporan kustom.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
            totalItems={filteredData.length} 
            itemsPerPage={itemsPerPage} 
          />
        </div>
      </div>
    </div>
  );
}



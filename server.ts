import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("app.db");
const JWT_SECRET = "super-secret-key-change-this";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS pelanggan (
    id_pelanggan TEXT PRIMARY KEY,
    nama TEXT,
    alamat TEXT,
    npwp TEXT,
    contact TEXT,
    telepon TEXT,
    seksi TEXT, -- CHTB/J&C
    jenis TEXT, -- PDAM/Industri
    status TEXT -- Relasi/Non Relasi
  );

  CREATE TABLE IF NOT EXISTS izin (
    id_izin TEXT PRIMARY KEY,
    id_pelanggan TEXT,
    no_izin TEXT,
    tanggal_izin TEXT,
    mulai_izin TEXT,
    akhir_izin TEXT,
    intake TEXT,
    lokasi TEXT,
    desa TEXT,
    kecamatan TEXT,
    kabupaten TEXT,
    lat TEXT,
    long TEXT,
    max REAL,
    min REAL,
    instansi TEXT, -- PUPR/Pemrov
    FOREIGN KEY(id_pelanggan) REFERENCES pelanggan(id_pelanggan)
  );

  CREATE TABLE IF NOT EXISTS kontrak (
    id_kontrak TEXT PRIMARY KEY,
    id_izin TEXT,
    no_kontrak TEXT,
    tanggal_kontrak TEXT,
    mulai_kontrak TEXT,
    akhir_kontrak TEXT,
    no_amd TEXT,
    tanggal_amd TEXT,
    mulai_amd TEXT,
    akhir_amd TEXT,
    briva TEXT,
    mva TEXT,
    mp TEXT, -- Y/T
    FOREIGN KEY(id_izin) REFERENCES izin(id_izin)
  );

  CREATE TABLE IF NOT EXISTS meter (
    id_meter TEXT PRIMARY KEY,
    id_izin TEXT,
    no_ba TEXT,
    tanggal_ba TEXT,
    angka REAL,
    bulan INTEGER,
    tahun INTEGER,
    FOREIGN KEY(id_izin) REFERENCES izin(id_izin)
  );

  CREATE TABLE IF NOT EXISTS tagihan (
    id_tagihan TEXT PRIMARY KEY,
    id_meter TEXT,
    no_invoice TEXT,
    tanggal_invoice TEXT,
    bulan_lap INTEGER,
    tahun_lap INTEGER,
    FOREIGN KEY(id_meter) REFERENCES meter(id_meter)
  );
`);

// Seed admin user if not exists
const admin = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!admin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "24h" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ success: true, user: { username: user.username } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ success: true });
  });

  app.get("/api/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // Generic CRUD Routes
  const tables = ["pelanggan", "izin", "kontrak", "meter", "tagihan"];
  tables.forEach(table => {
    app.get(`/api/${table}`, authenticateToken, (req, res) => {
      const data = db.prepare(`SELECT * FROM ${table}`).all();
      res.json(data);
    });

    app.post(`/api/${table}`, authenticateToken, (req, res) => {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map(() => "?").join(",");
      const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`);
      try {
        stmt.run(...values);
        res.json({ success: true });
      } catch (e: any) {
        res.status(400).json({ error: e.message });
      }
    });

    app.put(`/api/${table}/:id`, authenticateToken, (req, res) => {
      const idField = table === "pelanggan" ? "id_pelanggan" : `id_${table}`;
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const setClause = keys.map(key => `${key} = ?`).join(",");
      const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${idField} = ?`);
      try {
        stmt.run(...values, req.params.id);
        res.json({ success: true });
      } catch (e: any) {
        res.status(400).json({ error: e.message });
      }
    });

    app.delete(`/api/${table}/:id`, authenticateToken, (req, res) => {
      const idField = table === "pelanggan" ? "id_pelanggan" : `id_${table}`;
      
      try {
        db.transaction(() => {
          if (table === "pelanggan") {
            // Delete related tagihan, meter, kontrak, izin
            db.prepare(`DELETE FROM tagihan WHERE id_meter IN (SELECT id_meter FROM meter WHERE id_izin IN (SELECT id_izin FROM izin WHERE id_pelanggan = ?))`).run(req.params.id);
            db.prepare(`DELETE FROM meter WHERE id_izin IN (SELECT id_izin FROM izin WHERE id_pelanggan = ?)`).run(req.params.id);
            db.prepare(`DELETE FROM kontrak WHERE id_izin IN (SELECT id_izin FROM izin WHERE id_pelanggan = ?)`).run(req.params.id);
            db.prepare(`DELETE FROM izin WHERE id_pelanggan = ?`).run(req.params.id);
          } else if (table === "izin") {
            // Delete related tagihan, meter, kontrak
            db.prepare(`DELETE FROM tagihan WHERE id_meter IN (SELECT id_meter FROM meter WHERE id_izin = ?)`).run(req.params.id);
            db.prepare(`DELETE FROM meter WHERE id_izin = ?`).run(req.params.id);
            db.prepare(`DELETE FROM kontrak WHERE id_izin = ?`).run(req.params.id);
          } else if (table === "meter") {
            // Delete related tagihan
            db.prepare(`DELETE FROM tagihan WHERE id_meter = ?`).run(req.params.id);
          }
          
          db.prepare(`DELETE FROM ${table} WHERE ${idField} = ?`).run(req.params.id);
        })();
        res.json({ success: true });
      } catch (e: any) {
        res.status(400).json({ error: e.message });
      }
    });
  });

  // Dashboard Metrics
  app.get("/api/dashboard/metrics", authenticateToken, (req, res) => {
    const totalPelanggan = db.prepare("SELECT COUNT(*) as count FROM pelanggan").get() as any;
    const totalKontrak = db.prepare("SELECT COUNT(*) as count FROM kontrak").get() as any;
    const totalIzin = db.prepare("SELECT COUNT(*) as count FROM izin").get() as any;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Expired Izin Count
    const expiredIzinCount = db.prepare(`
      SELECT COUNT(*) as count FROM izin 
      WHERE substr(akhir_izin, 7, 4) || '-' || substr(akhir_izin, 4, 2) || '-' || substr(akhir_izin, 1, 2) < ?
    `).get(today) as any;

    // Expired Izin List
    const expiredIzinList = db.prepare(`
      SELECT i.*, p.nama as nama_pelanggan 
      FROM izin i
      JOIN pelanggan p ON i.id_pelanggan = p.id_pelanggan
      WHERE substr(akhir_izin, 7, 4) || '-' || substr(akhir_izin, 4, 2) || '-' || substr(akhir_izin, 1, 2) < ?
      ORDER BY substr(akhir_izin, 7, 4) ASC, substr(akhir_izin, 4, 2) ASC, substr(akhir_izin, 1, 2) ASC
      LIMIT 10
    `).all(today) as any[];

    // Expired Kontrak Count
    const expiredKontrakCount = db.prepare(`
      SELECT COUNT(*) as count FROM kontrak 
      WHERE CASE 
        WHEN (akhir_amd IS NOT NULL AND akhir_amd != '') 
        THEN substr(akhir_amd, 7, 4) || '-' || substr(akhir_amd, 4, 2) || '-' || substr(akhir_amd, 1, 2)
        ELSE substr(akhir_kontrak, 7, 4) || '-' || substr(akhir_kontrak, 4, 2) || '-' || substr(akhir_kontrak, 1, 2)
      END < ?
    `).get(today) as any;

    // Expired Kontrak List
    const expiredKontrakList = db.prepare(`
      SELECT k.*, p.nama as nama_pelanggan 
      FROM kontrak k
      JOIN izin i ON k.id_izin = i.id_izin
      JOIN pelanggan p ON i.id_pelanggan = p.id_pelanggan
      WHERE CASE 
        WHEN (k.akhir_amd IS NOT NULL AND k.akhir_amd != '') 
        THEN substr(k.akhir_amd, 7, 4) || '-' || substr(k.akhir_amd, 4, 2) || '-' || substr(k.akhir_amd, 1, 2)
        ELSE substr(k.akhir_kontrak, 7, 4) || '-' || substr(k.akhir_kontrak, 4, 2) || '-' || substr(k.akhir_kontrak, 1, 2)
      END < ?
      ORDER BY 
        CASE 
          WHEN (k.akhir_amd IS NOT NULL AND k.akhir_amd != '') 
          THEN substr(k.akhir_amd, 7, 4) || '-' || substr(k.akhir_amd, 4, 2) || '-' || substr(k.akhir_amd, 1, 2)
          ELSE substr(k.akhir_kontrak, 7, 4) || '-' || substr(k.akhir_kontrak, 4, 2) || '-' || substr(k.akhir_kontrak, 1, 2)
        END ASC
      LIMIT 10
    `).all(today) as any[];

    res.json({
      totalPelanggan: totalPelanggan.count,
      totalKontrak: totalKontrak.count,
      totalIzin: totalIzin.count,
      izinHabis: expiredIzinCount.count,
      kontrakHabis: expiredKontrakCount.count,
      expiredIzinList,
      expiredKontrakList
    });
  });

  // Billing Calculation Route
  app.get("/api/billing/calculate", authenticateToken, (req, res) => {
    const query = `
      SELECT 
        t.id_tagihan, t.tanggal_invoice, t.no_invoice,
        m.angka, m.bulan, m.tahun,
        p.id_pelanggan, p.nama, p.jenis,
        i.intake, i.lokasi, i.min,
        k.mp
      FROM tagihan t
      JOIN meter m ON t.id_meter = m.id_meter
      JOIN izin i ON m.id_izin = i.id_izin
      JOIN pelanggan p ON i.id_pelanggan = p.id_pelanggan
      LEFT JOIN kontrak k ON i.id_izin = k.id_izin
    `;
    const rawData = db.prepare(query).all() as any[];

    const calculateRow = (row: any) => {
      let tarif = 0;
      if (row.jenis === "PDAM") {
        tarif = 141.27;
      } else if (row.jenis === "Industri") {
        if (row.lokasi === "Waduk Ir. H. Djuanda") {
          tarif = 267.59;
        } else {
          tarif = 244.93;
        }
      }

      let ditagihkan = row.angka;
      if (row.mp === "Y") {
        ditagihkan = Math.max(row.angka, row.min);
      }

      const jumlah = tarif * ditagihkan;
      return { ...row, tarif, ditagihkan, jumlah };
    };

    // Group by ID Pelanggan for P105 special case
    const results: any[] = [];
    const p105Rows = rawData.filter(r => r.id_pelanggan === "P105");
    const otherRows = rawData.filter(r => r.id_pelanggan !== "P105");

    // Process others
    otherRows.forEach(row => {
      const calc = calculateRow(row);
      const pembulatan = Math.round(calc.jumlah / 100) * 100;
      const dpp = pembulatan * (11/12);
      const ppn = pembulatan * 0.11;
      const sub = pembulatan + ppn;
      const materai = sub > 5000000 ? 10000 : 0;
      const total = sub + materai;

      results.push({
        ...calc,
        pembulatan,
        dpp,
        ppn,
        sub,
        materai,
        total
      });
    });

    // Process P105 (Grouped by Invoice/Month/Year)
    const p105Groups: { [key: string]: any[] } = {};
    p105Rows.forEach(row => {
      const key = `${row.no_invoice}-${row.bulan}-${row.tahun}`;
      if (!p105Groups[key]) p105Groups[key] = [];
      p105Groups[key].push(calculateRow(row));
    });

    Object.values(p105Groups).forEach(group => {
      const totalJumlah = group.reduce((acc, curr) => acc + curr.jumlah, 0);
      const pembulatan = Math.round(totalJumlah / 100) * 100;
      const dpp = pembulatan * (11/12);
      const ppn = pembulatan * 0.11;
      const sub = pembulatan + ppn;
      const materai = sub > 5000000 ? 10000 : 0;
      const total = sub + materai;

      // Combine intake names for display
      const combinedIntake = group.map(g => g.intake).join(" & ");
      
      results.push({
        ...group[0], // Use first row's metadata
        intake: combinedIntake,
        jumlah: totalJumlah,
        pembulatan,
        dpp,
        ppn,
        sub,
        materai,
        total
      });
    });

    res.json(results);
  });

  // Reports Endpoints
  app.get("/api/reports/izin", authenticateToken, (req, res) => {
    const query = `
      SELECT 
        i.id_izin, p.nama as nama_pelanggan, i.no_izin, i.tanggal_izin, 
        i.mulai_izin, i.akhir_izin, i.intake, i.lokasi, i.desa, 
        i.kecamatan, i.kabupaten, i.lat, i.long, i.max, i.min, i.instansi
      FROM izin i
      JOIN pelanggan p ON i.id_pelanggan = p.id_pelanggan
    `;
    const data = db.prepare(query).all();
    res.json(data);
  });

  app.get("/api/reports/kontrak", authenticateToken, (req, res) => {
    const query = `
      SELECT 
        k.id_kontrak, p.nama as nama_pelanggan, k.no_kontrak, k.tanggal_kontrak, 
        k.mulai_kontrak, k.akhir_kontrak, k.no_amd, k.tanggal_amd, 
        k.mulai_amd, k.akhir_amd, k.briva, k.mva, k.mp
      FROM kontrak k
      JOIN izin i ON k.id_izin = i.id_izin
      JOIN pelanggan p ON i.id_pelanggan = p.id_pelanggan
    `;
    const data = db.prepare(query).all();
    res.json(data);
  });

  // Gabungan Report Route
  app.get("/api/reports/gabungan", authenticateToken, (req, res) => {
    const query = `
      SELECT 
        p.id_pelanggan, p.nama as nama_pelanggan, p.seksi, p.jenis, p.status,
        i.intake, i.no_izin, i.akhir_izin, i.instansi,
        k.no_kontrak, k.akhir_kontrak, k.no_amd, k.akhir_amd
      FROM pelanggan p
      LEFT JOIN izin i ON p.id_pelanggan = i.id_pelanggan
      LEFT JOIN kontrak k ON i.id_izin = k.id_izin
    `;
    const data = db.prepare(query).all();
    res.json(data);
  });

  // Usage Recap Endpoint
  app.get("/api/usage/recap", authenticateToken, (req, res) => {
    const query = `
      SELECT 
        p.nama as nama_pelanggan,
        m.no_ba,
        i.intake,
        i.lokasi,
        m.angka,
        i.min,
        k.mp,
        m.bulan,
        m.tahun
      FROM meter m
      JOIN izin i ON m.id_izin = i.id_izin
      JOIN pelanggan p ON i.id_pelanggan = p.id_pelanggan
      LEFT JOIN kontrak k ON i.id_izin = k.id_izin
    `;
    const rawData = db.prepare(query).all() as any[];
    
    const data = rawData.map(row => {
      let ditagihkan = row.angka;
      if (row.mp === "Y" && row.angka < row.min) {
        ditagihkan = row.min;
      }
      return {
        nama_pelanggan: row.nama_pelanggan,
        no_ba: row.no_ba,
        intake: row.intake,
        lokasi: row.lokasi,
        angka: row.angka,
        ditagihkan: ditagihkan,
        bulan: row.bulan,
        tahun: row.tahun
      };
    });
    
    res.json(data);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

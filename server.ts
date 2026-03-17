import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import nodemailer from "nodemailer";
import path from "path";
import dotenv from "dotenv";
import { buildInvoicePdfBuffer } from "./serverPdf.tsx";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// In production (Docker), store the DB in /app/data so it persists via volume mount.
// In dev, keep it in the project root for convenience.
const DB_PATH = process.env.NODE_ENV === "production"
  ? "/app/data/database.sqlite"
  : "database.sqlite";

const db = new Database(DB_PATH);

// ── Request logger ──────────────────────────────────────────────────────────

const LOG_COLORS: Record<string, string> = {
  GET: '\x1b[32m',     // green
  POST: '\x1b[34m',    // blue
  PUT: '\x1b[33m',     // yellow
  PATCH: '\x1b[35m',   // magenta
  DELETE: '\x1b[31m',  // red
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, originalUrl } = req;
  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = LOG_COLORS[method] || '';
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(
      `${DIM}${new Date().toISOString()}${RESET} ` +
      `${color}${method.padEnd(6)}${RESET} ` +
      `${originalUrl.padEnd(40)} ` +
      `${statusColor}${res.statusCode}${RESET} ` +
      `${DIM}${ms}ms${RESET}`
    );
  });
  next();
}

// --- Database Initialization ---

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    companyName TEXT,
    companyAddress TEXT,
    companyEmail TEXT,
    companyPhone TEXT,
    companyWebsite TEXT,
    logoUrl TEXT,
    currency TEXT DEFAULT 'USD'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    basePrice REAL NOT NULL,
    unit TEXT DEFAULT 'pcs',
    batchNo TEXT,
    expiryDate TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    invoiceNumber TEXT NOT NULL,
    clientName TEXT NOT NULL,
    clientEmail TEXT,
    clientPhone TEXT,
    clientAddress TEXT,
    clientLabel TEXT DEFAULT 'Billed To',
    doctorName TEXT,
    date TEXT NOT NULL,
    dueDate TEXT,
    discountPercentage REAL DEFAULT 0,
    roundOff REAL DEFAULT 0,
    total REAL NOT NULL,
    balanceDue REAL DEFAULT 0,
    status TEXT DEFAULT 'paid',
    template TEXT DEFAULT 'modern',
    themeColor TEXT DEFAULT '#000000',
    terms TEXT,
    showSignatory INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceId INTEGER NOT NULL,
    productId INTEGER,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unitPrice REAL NOT NULL,
    unit TEXT,
    batchNo TEXT,
    expiryDate TEXT,
    total REAL NOT NULL,
    FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE
  );
`);

// --- Migrations ---

// User migrations
const userTableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const userColumns = userTableInfo.map(c => c.name);

const userMigrations = [
  { name: 'dlNumbers', sql: "ALTER TABLE users ADD COLUMN dlNumbers TEXT" },
  { name: 'userName', sql: "ALTER TABLE users ADD COLUMN userName TEXT" },
  { name: 'isAdmin', sql: "ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0" },
  { name: 'emailAppPassword', sql: "ALTER TABLE users ADD COLUMN emailAppPassword TEXT" },
  { name: 'signatureUrl', sql: "ALTER TABLE users ADD COLUMN signatureUrl TEXT" },
  { name: 'companyTitleSize', sql: "ALTER TABLE users ADD COLUMN companyTitleSize INTEGER DEFAULT 0" },
  { name: 'defaultTerms', sql: "ALTER TABLE users ADD COLUMN defaultTerms TEXT" },
];

for (const m of userMigrations) {
  if (!userColumns.includes(m.name)) {
    try { db.exec(m.sql); } catch (e) { console.error(`User migration failed for ${m.name}:`, e); }
  }
}

const invoiceTableInfo = db.prepare("PRAGMA table_info(invoices)").all() as any[];
const invoiceColumns = invoiceTableInfo.map(c => c.name);

const invoiceMigrations = [
  { name: 'template', sql: "ALTER TABLE invoices ADD COLUMN template TEXT DEFAULT 'modern'" },
  { name: 'themeColor', sql: "ALTER TABLE invoices ADD COLUMN themeColor TEXT DEFAULT '#000000'" },
  { name: 'clientLabel', sql: "ALTER TABLE invoices ADD COLUMN clientLabel TEXT DEFAULT 'Billed To'" },
  { name: 'clientPhone', sql: "ALTER TABLE invoices ADD COLUMN clientPhone TEXT" },
  { name: 'state', sql: "ALTER TABLE invoices ADD COLUMN state TEXT" },
  { name: 'reverseCharge', sql: "ALTER TABLE invoices ADD COLUMN reverseCharge TEXT" },
  { name: 'balanceDue', sql: "ALTER TABLE invoices ADD COLUMN balanceDue REAL DEFAULT 0" },
  { name: 'terms', sql: "ALTER TABLE invoices ADD COLUMN terms TEXT" },
  { name: 'showSignatory', sql: "ALTER TABLE invoices ADD COLUMN showSignatory INTEGER DEFAULT 0" },
  { name: 'doctorName', sql: "ALTER TABLE invoices ADD COLUMN doctorName TEXT" },
  { name: 'doctorLabel', sql: "ALTER TABLE invoices ADD COLUMN doctorLabel TEXT DEFAULT 'Doctor'" },
  { name: 'dlNumbers', sql: "ALTER TABLE invoices ADD COLUMN dlNumbers TEXT" },
  { name: 'useDigitalSignature', sql: "ALTER TABLE invoices ADD COLUMN useDigitalSignature INTEGER DEFAULT 0" },
  { name: 'companyTitleSize', sql: "ALTER TABLE invoices ADD COLUMN companyTitleSize INTEGER DEFAULT 0" },
];

for (const m of invoiceMigrations) {
  if (!invoiceColumns.includes(m.name)) {
    try {
      db.exec(m.sql);
    } catch (e) {
      console.error(`Invoice migration failed for ${m.name}:`, e);
    }
  }
}

// Product migrations
const productTableInfo = db.prepare("PRAGMA table_info(products)").all() as any[];
const productColumns = productTableInfo.map(c => c.name);

const productMigrations = [
  { name: 'batchNo', sql: "ALTER TABLE products ADD COLUMN batchNo TEXT" },
  { name: 'expiryDate', sql: "ALTER TABLE products ADD COLUMN expiryDate TEXT" },
  { name: 'expiryMode', sql: "ALTER TABLE products ADD COLUMN expiryMode TEXT DEFAULT 'full'" },
];

for (const m of productMigrations) {
  if (!productColumns.includes(m.name)) {
    try {
      db.exec(m.sql);
    } catch (e) {
      console.error(`Product migration failed for ${m.name}:`, e);
    }
  }
}

// Invoice items migrations
const itemsTableInfo = db.prepare("PRAGMA table_info(invoice_items)").all() as any[];
const itemsColumns = itemsTableInfo.map(c => c.name);

const itemsMigrations = [
  { name: 'batchNo', sql: "ALTER TABLE invoice_items ADD COLUMN batchNo TEXT" },
  { name: 'expiryDate', sql: "ALTER TABLE invoice_items ADD COLUMN expiryDate TEXT" },
  { name: 'expiryMode', sql: "ALTER TABLE invoice_items ADD COLUMN expiryMode TEXT DEFAULT 'full'" },
];

for (const m of itemsMigrations) {
  if (!itemsColumns.includes(m.name)) {
    try {
      db.exec(m.sql);
    } catch (e) {
      console.error(`Items migration failed for ${m.name}:`, e);
    }
  }
}

// --- Middleware ---

const authenticate = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminAuthenticate = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    const user = db.prepare("SELECT isAdmin FROM users WHERE id = ?").get(req.userId) as any;
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.use(express.json({ limit: '10mb' }));  // larger limit for base64 signature images
  app.use(cookieParser());
  app.use(requestLogger);

  // --- Auth Routes ---

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, companyName } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = db.prepare("INSERT INTO users (email, password, companyName) VALUES (?, ?, ?)").run(email, hashedPassword, companyName);
      const userId = result.lastInsertRowid;
      
      const token = jwt.sign({ userId }, JWT_SECRET);
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
      });
      res.json({ success: true, user: { email, companyName } });
    } catch (err: any) {
      res.status(400).json({ error: "User already exists or invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/"
      });
      res.json({ success: true, user: { email: user.email, companyName: user.companyName } });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, email, companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency, dlNumbers, userName, isAdmin FROM users WHERE id = ?").get(req.userId) as any;
    if (user?.dlNumbers) try { user.dlNumbers = JSON.parse(user.dlNumbers); } catch { user.dlNumbers = ['','','']; }
    res.json(user);
  });

  // --- Protected API Routes ---

  app.get("/api/settings", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
    if (user?.dlNumbers) try { user.dlNumbers = JSON.parse(user.dlNumbers); } catch { user.dlNumbers = ['','','']; }
    // Never expose password hash; mask app password presence only
    const { password: _, ...safeUser } = user;
    safeUser.hasEmailAppPassword = !!user.emailAppPassword;
    safeUser.emailAppPassword = undefined;
    safeUser.signatureUrl = user.signatureUrl || '';
    safeUser.companyTitleSize = user.companyTitleSize || 0;
    safeUser.defaultTerms = user.defaultTerms || '';
    res.json(safeUser);
  });

  app.post("/api/settings", authenticate, (req: any, res) => {
    const { companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency, dlNumbers, userName, emailAppPassword, signatureUrl, companyTitleSize, defaultTerms } = req.body;
    // Only update emailAppPassword if a non-empty value is provided
    if (emailAppPassword && emailAppPassword.trim()) {
      db.prepare(`UPDATE users SET emailAppPassword = ? WHERE id = ?`).run(emailAppPassword.trim(), req.userId);
    }
    db.prepare(`
      UPDATE users SET 
        companyName = ?, companyAddress = ?, companyEmail = ?, 
        companyPhone = ?, companyWebsite = ?, logoUrl = ?, currency = ?,
        dlNumbers = ?, userName = ?, signatureUrl = ?, companyTitleSize = ?,
        defaultTerms = ?
      WHERE id = ?
    `).run(companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency,
      dlNumbers ? JSON.stringify(dlNumbers) : null, userName || null,
      signatureUrl || null, companyTitleSize || 0, defaultTerms || null, req.userId);
    res.json({ success: true });
  });

  app.get("/api/products", authenticate, (req: any, res) => {
    const products = db.prepare("SELECT * FROM products WHERE userId = ?").all(req.userId);
    res.json(products);
  });

  app.post("/api/products", authenticate, (req: any, res) => {
    const { name, description, basePrice, unit, batchNo, expiryDate, expiryMode } = req.body;
    const result = db.prepare(
      "INSERT INTO products (userId, name, description, basePrice, unit, batchNo, expiryDate, expiryMode) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(req.userId, name, description, basePrice, unit || 'pcs', batchNo || null, expiryDate || null, expiryMode || 'full');
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
    res.json(product);
  });

  app.put("/api/products/:id", authenticate, (req: any, res) => {
    const { name, description, basePrice, unit, batchNo, expiryDate, expiryMode } = req.body;
    db.prepare(
      "UPDATE products SET name = ?, description = ?, basePrice = ?, unit = ?, batchNo = ?, expiryDate = ?, expiryMode = ? WHERE id = ? AND userId = ?"
    ).run(name, description, basePrice, unit, batchNo || null, expiryDate || null, expiryMode || 'full', req.params.id, req.userId);
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    res.json(product);
  });

  app.delete("/api/products/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM products WHERE id = ? AND userId = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  app.patch("/api/products/:id/price", authenticate, (req: any, res) => {
    const { price } = req.body;
    db.prepare("UPDATE products SET basePrice = ? WHERE id = ? AND userId = ?").run(price, req.params.id, req.userId);
    res.json({ success: true });
  });

  app.get("/api/invoices", authenticate, (req: any, res) => {
    const invoices = db.prepare("SELECT * FROM invoices WHERE userId = ? ORDER BY id DESC").all(req.userId) as any[];
    invoices.forEach(inv => { if (inv.dlNumbers) try { inv.dlNumbers = JSON.parse(inv.dlNumbers); } catch {} });
    res.json(invoices);
  });

  // ── Dashboard stats ────────────────────────────────────────────────────────
  app.get("/api/dashboard/stats", authenticate, (req: any, res) => {
    const userId = req.userId;

    // Revenue summary
    const revSummary = db.prepare(`
      SELECT
        COALESCE(SUM(total), 0)                                             AS totalRevenue,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', date) = strftime('%Y-%m', 'now') THEN total ELSE 0 END), 0) AS monthlyRevenue,
        COUNT(*)                                                             AS totalInvoices,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', date) = strftime('%Y-%m', 'now') THEN 1 ELSE 0 END), 0)    AS monthlyInvoices
      FROM invoices
      WHERE userId = ?
    `).get(userId) as any;

    // Revenue per month for last 6 months (SQLite date arithmetic)
    const monthlyChart = db.prepare(`
      SELECT
        strftime('%Y-%m', date)          AS month,
        COALESCE(SUM(total), 0)          AS revenue,
        COUNT(*)                          AS count
      FROM invoices
      WHERE userId = ?
        AND date >= date('now', '-5 months', 'start of month')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `).all(userId) as any[];

    // Recent 5 invoices
    const recentInvoices = db.prepare(`
      SELECT id, invoiceNumber, clientName, total, date, template
      FROM invoices
      WHERE userId = ?
      ORDER BY id DESC
      LIMIT 5
    `).all(userId) as any[];

    // Per-product sold stats — join invoice_items → invoices → products
    // Covers ALL items: those with a productId (from inventory) and those without (free-text)
    const productSales = db.prepare(`
      SELECT
        ii.productId,
        COALESCE(p.name, ii.description)  AS name,
        p.unit                             AS inventoryUnit,
        ii.unit                            AS invoiceUnit,
        COALESCE(p.basePrice, 0)          AS basePrice,
        SUM(ii.quantity)                  AS totalQty,
        SUM(ii.total)                     AS totalRevenue,
        COUNT(DISTINCT ii.invoiceId)      AS invoiceCount,
        MIN(i.date)                       AS firstSold,
        MAX(i.date)                       AS lastSold
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoiceId AND i.userId = ?
      LEFT JOIN products p ON p.id = ii.productId AND p.userId = ?
      WHERE ii.description IS NOT NULL AND ii.description != ''
      GROUP BY
        CASE WHEN ii.productId IS NOT NULL THEN CAST(ii.productId AS TEXT) ELSE ii.description END
      ORDER BY totalQty DESC
    `).all(userId, userId) as any[];

    // Inventory products with their stock status (all products, even unsold ones)
    const inventoryStatus = db.prepare(`
      SELECT
        p.id,
        p.name,
        p.basePrice,
        p.unit,
        p.batchNo,
        p.expiryDate,
        COALESCE(s.totalQty, 0)       AS soldQty,
        COALESCE(s.totalRevenue, 0)   AS soldRevenue,
        COALESCE(s.invoiceCount, 0)   AS invoiceCount
      FROM products p
      LEFT JOIN (
        SELECT
          ii.productId,
          SUM(ii.quantity)        AS totalQty,
          SUM(ii.total)           AS totalRevenue,
          COUNT(DISTINCT ii.invoiceId) AS invoiceCount
        FROM invoice_items ii
        JOIN invoices i ON i.id = ii.invoiceId AND i.userId = ?
        WHERE ii.productId IS NOT NULL
        GROUP BY ii.productId
      ) s ON s.productId = p.id
      WHERE p.userId = ?
      ORDER BY soldQty DESC
    `).all(userId, userId) as any[];

    res.json({
      summary: revSummary,
      monthlyChart,
      recentInvoices,
      productSales,       // all items ever invoiced (with/without productId)
      inventoryStatus,    // all inventory products with sold stats merged in
    });
  });


  app.get("/api/invoices/:id", authenticate, (req: any, res) => {
    const invoice = db.prepare("SELECT * FROM invoices WHERE id = ? AND userId = ?").get(req.params.id, req.userId) as any;
    if (invoice) {
      if (invoice.dlNumbers) try { invoice.dlNumbers = JSON.parse(invoice.dlNumbers); } catch {}
      invoice.items = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?").all(invoice.id);
    }
    res.json(invoice);
  });

  app.post("/api/invoices", authenticate, (req: any, res) => {
    const { 
      invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, clientLabel,
      doctorName, doctorLabel, dlNumbers,
      date, dueDate, discountPercentage, 
      roundOff, total, balanceDue, items, template, themeColor, terms, showSignatory,
      useDigitalSignature, companyTitleSize
    } = req.body;

    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices (
          userId, invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, clientLabel,
          doctorName, doctorLabel, dlNumbers,
          date, dueDate, discountPercentage, 
          roundOff, total, balanceDue, template, themeColor, terms, showSignatory,
          useDigitalSignature, companyTitleSize
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.userId, invoiceNumber, clientName, clientEmail, clientPhone || null, clientAddress,
        clientLabel || 'Billed To', doctorName || null, doctorLabel || 'Doctor',
        dlNumbers ? JSON.stringify(dlNumbers) : null,
        date, dueDate || null, discountPercentage, 
        roundOff, total, balanceDue || 0, template, themeColor || '#000000', terms, showSignatory ? 1 : 0,
        useDigitalSignature ? 1 : 0, companyTitleSize || 0
      );

      const invoiceId = result.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (invoiceId, productId, description, quantity, unitPrice, unit, batchNo, expiryDate, expiryMode, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(invoiceId, item.productId, item.description, item.quantity, item.unitPrice, item.unit, item.batchNo || null, item.expiryDate || null, item.expiryMode || 'full', item.total);
      }

      const inv = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId) as any;
      if (inv?.dlNumbers) try { inv.dlNumbers = JSON.parse(inv.dlNumbers); } catch {}
      return inv;
    });

    res.json(transaction());
  });

  app.put("/api/invoices/:id", authenticate, (req: any, res) => {
    const { 
      invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, clientLabel,
      doctorName, doctorLabel, dlNumbers,
      date, dueDate, discountPercentage, 
      roundOff, total, balanceDue, items, template, themeColor, terms, showSignatory,
      useDigitalSignature, companyTitleSize
    } = req.body;

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE invoices SET 
          invoiceNumber = ?, clientName = ?, clientEmail = ?, clientPhone = ?, clientAddress = ?,
          clientLabel = ?, doctorName = ?, doctorLabel = ?, dlNumbers = ?,
          date = ?, dueDate = ?, discountPercentage = ?, 
          roundOff = ?, total = ?, balanceDue = ?, template = ?, themeColor = ?, terms = ?, showSignatory = ?,
          useDigitalSignature = ?, companyTitleSize = ?
        WHERE id = ? AND userId = ?
      `).run(
        invoiceNumber, clientName, clientEmail, clientPhone || null, clientAddress,
        clientLabel || 'Billed To', doctorName || null, doctorLabel || 'Doctor',
        dlNumbers ? JSON.stringify(dlNumbers) : null,
        date, dueDate || null, discountPercentage, 
        roundOff, total, balanceDue || 0, template, themeColor || '#000000', terms, showSignatory ? 1 : 0,
        useDigitalSignature ? 1 : 0, companyTitleSize || 0,
        req.params.id, req.userId
      );

      db.prepare("DELETE FROM invoice_items WHERE invoiceId = ?").run(req.params.id);
      
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (invoiceId, productId, description, quantity, unitPrice, unit, batchNo, expiryDate, expiryMode, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(req.params.id, item.productId, item.description, item.quantity, item.unitPrice, item.unit, item.batchNo || null, item.expiryDate || null, item.expiryMode || 'full', item.total);
      }

      const updatedInvoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(req.params.id) as any;
      if (updatedInvoice?.dlNumbers) try { updatedInvoice.dlNumbers = JSON.parse(updatedInvoice.dlNumbers); } catch {}
      updatedInvoice.items = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?").all(req.params.id);
      return updatedInvoice;
    });

    res.json(transaction());
  });

  app.delete("/api/invoices/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM invoice_items WHERE invoiceId = ?").run(req.params.id);
    db.prepare("DELETE FROM invoices WHERE id = ? AND userId = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  // --- Invoice Email HTML Builder ---
  function buildInvoiceEmailHtml(invoice: any, settings: any): string {
    const theme = invoice.themeColor || '#000000';
    const currency = settings.currency || 'INR';
    const items: any[] = Array.isArray(invoice.items) ? invoice.items : [];
    const subtotal = items.reduce((s: number, i: any) => s + i.total, 0);
    const disc = subtotal * ((invoice.discountPercentage || 0) / 100);
    const roundOff = invoice.roundOff || 0;
    const total = invoice.total || 0;
    const balanceDue = invoice.balanceDue || 0;
    const dlNumbers: string[] = ((invoice.dlNumbers?.length ? invoice.dlNumbers : settings.dlNumbers) || []).filter((d: string) => d?.trim());
    const doctorLabel = invoice.doctorLabel || 'Doctor';
    const isMedical = invoice.template === 'medical';
    const formattedDate = invoice.date ? invoice.date.split('-').reverse().join('-') : '';

    function fmt(amount: number): string {
      try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount); }
      catch { return `${currency} ${amount.toFixed(2)}`; }
    }

    function numberToWords(num: number): string {
      const a = ['','one ','two ','three ','four ','five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
      const b = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
      if ((num = Math.floor(num)).toString().length > 9) return 'overflow';
      const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return '';
      let str = '';
      str += +n[1] ? (a[+n[1]] || b[n[1][0]] + ' ' + a[+n[1][1]]) + 'crore ' : '';
      str += +n[2] ? (a[+n[2]] || b[n[2][0]] + ' ' + a[+n[2][1]]) + 'lakh ' : '';
      str += +n[3] ? (a[+n[3]] || b[n[3][0]] + ' ' + a[+n[3][1]]) + 'thousand ' : '';
      str += +n[4] ? (a[+n[4]] || b[n[4][0]] + ' ' + a[+n[4][1]]) + 'hundred ' : '';
      str += +n[5] ? ((str ? 'and ' : '') + (a[+n[5]] || b[n[5][0]] + ' ' + a[+n[5][1]])) : '';
      return str.toUpperCase() + 'RUPEES ONLY';
    }

    function formatExpiry(date?: string, mode?: string): string {
      if (!date) return '-';
      if (mode === 'monthyear') {
        const d = new Date(date);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }
      return date;
    }

    const nameLen = (settings.companyName || '').length;
    const titleFontSize = (invoice.companyTitleSize || settings.companyTitleSize) > 0
      ? `${invoice.companyTitleSize || settings.companyTitleSize}px`
      : nameLen <= 12 ? '28px' : nameLen <= 20 ? '24px' : nameLen <= 30 ? '20px' : '16px';

    const bdr = `1.5px solid #52525b`;
    const thinBdr = `1px solid #d4d4d8`;

    const itemRows = items.map((item: any, i: number) => {
      if (isMedical) {
        return `<tr>
          <td style="border:${bdr};padding:3px 5px;text-align:center;font-size:10px;">${i + 1}</td>
          <td style="border:${bdr};padding:3px 5px;font-size:10px;">${item.description || ''}</td>
          <td style="border:${bdr};padding:3px 5px;text-align:center;font-size:10px;">${item.unit || '-'}</td>
          <td style="border:${bdr};padding:3px 5px;text-align:center;font-size:10px;">${item.batchNo || '-'}</td>
          <td style="border:${bdr};padding:3px 5px;text-align:center;font-size:10px;">${formatExpiry(item.expiryDate, item.expiryMode)}</td>
          <td style="border:${bdr};padding:3px 5px;text-align:right;font-size:10px;">${item.quantity}</td>
          <td style="border:${bdr};padding:3px 5px;text-align:right;font-size:10px;">${(item.unitPrice || 0).toFixed(2)}</td>
          <td style="border:${bdr};padding:3px 5px;text-align:right;font-weight:700;font-size:10px;">${(item.total || 0).toFixed(2)}</td>
        </tr>`;
      } else {
        return `<tr>
          <td style="border-bottom:${thinBdr};padding:5px 7px;font-size:11px;">${item.description || ''}</td>
          <td style="border-bottom:${thinBdr};padding:5px 7px;text-align:center;font-size:10px;">${item.unit || '-'}</td>
          <td style="border-bottom:${thinBdr};padding:5px 7px;text-align:center;font-size:10px;">${item.batchNo || '-'} / ${formatExpiry(item.expiryDate, item.expiryMode)}</td>
          <td style="border-bottom:${thinBdr};padding:5px 7px;text-align:right;font-size:11px;">${item.quantity}</td>
          <td style="border-bottom:${thinBdr};padding:5px 7px;text-align:right;font-size:11px;">${(item.unitPrice || 0).toFixed(2)}</td>
          <td style="border-bottom:${thinBdr};padding:5px 7px;text-align:right;font-weight:700;font-size:11px;">${(item.total || 0).toFixed(2)}</td>
        </tr>`;
      }
    }).join('');

    const medicalTableHtml = `
      <table style="width:100%;border-collapse:collapse;border:${bdr};font-family:Arial,sans-serif;margin-bottom:10px;">
        <thead>
          <tr style="background:#f4f4f5;">
            <th style="border:${bdr};padding:4px 5px;text-align:center;font-size:10px;text-transform:uppercase;width:28px;">Sr.</th>
            <th style="border:${bdr};padding:4px 5px;text-align:left;font-size:10px;text-transform:uppercase;">Product Name</th>
            <th style="border:${bdr};padding:4px 5px;text-align:center;font-size:10px;text-transform:uppercase;width:44px;">Pack</th>
            <th style="border:${bdr};padding:4px 5px;text-align:center;font-size:10px;text-transform:uppercase;width:60px;">Batch</th>
            <th style="border:${bdr};padding:4px 5px;text-align:center;font-size:10px;text-transform:uppercase;width:52px;">Expiry</th>
            <th style="border:${bdr};padding:4px 5px;text-align:right;font-size:10px;text-transform:uppercase;width:36px;">Qty</th>
            <th style="border:${bdr};padding:4px 5px;text-align:right;font-size:10px;text-transform:uppercase;width:68px;">MRP</th>
            <th style="border:${bdr};padding:4px 5px;text-align:right;font-size:10px;text-transform:uppercase;width:68px;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr style="background:#f4f4f5;font-weight:700;border-top:${bdr};">
            <td colspan="5" style="border:${bdr};padding:3px 5px;text-align:right;color:#27272a;font-size:10px;">Total</td>
            <td style="border:${bdr};padding:3px 5px;text-align:right;font-size:10px;">${items.reduce((s: number, i: any) => s + i.quantity, 0)}</td>
            <td style="border:${bdr};padding:3px 5px;font-size:10px;"></td>
            <td style="border:${bdr};padding:3px 5px;text-align:right;font-size:10px;">${subtotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>`;

    const modernTableHtml = `
      <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;margin-bottom:14px;">
        <thead>
          <tr style="background:#18181b;">
            <th style="padding:7px;text-align:left;font-size:10px;text-transform:uppercase;color:#fff;">Description</th>
            <th style="padding:7px;text-align:center;font-size:10px;text-transform:uppercase;color:#fff;">Unit</th>
            <th style="padding:7px;text-align:center;font-size:10px;text-transform:uppercase;color:#fff;">Batch / Expiry</th>
            <th style="padding:7px;text-align:right;font-size:10px;text-transform:uppercase;color:#fff;">Qty</th>
            <th style="padding:7px;text-align:right;font-size:10px;text-transform:uppercase;color:#fff;">MRP</th>
            <th style="padding:7px;text-align:right;font-size:10px;text-transform:uppercase;color:#fff;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>`;

    const summaryBlockMedical = `
      <table style="width:100%;border-collapse:collapse;border:${bdr};font-family:Arial,sans-serif;margin-bottom:14px;">
        <tr>
          <td style="padding:8px 10px;border-right:${bdr};width:58%;vertical-align:top;">
            <div style="font-weight:700;text-transform:uppercase;color:#27272a;font-size:9px;margin-bottom:3px;">Total Amount in Words</div>
            <div style="font-weight:700;font-size:11px;font-style:italic;">${numberToWords(total)}</div>
          </td>
          <td style="padding:0;width:42%;vertical-align:top;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:3px 10px;font-weight:700;font-size:9px;text-transform:uppercase;color:#52525b;border-bottom:${thinBdr};">Subtotal</td><td style="padding:3px 10px;font-weight:700;font-size:9px;text-align:right;border-bottom:${thinBdr};">${subtotal.toFixed(2)}</td></tr>
              <tr><td style="padding:3px 10px;font-weight:700;font-size:9px;text-transform:uppercase;color:#52525b;border-bottom:${thinBdr};">Disc (${invoice.discountPercentage || 0}%)</td><td style="padding:3px 10px;font-weight:700;font-size:9px;text-align:right;color:#ef4444;border-bottom:${thinBdr};">-${disc.toFixed(2)}</td></tr>
              <tr><td style="padding:3px 10px;font-weight:700;font-size:9px;text-transform:uppercase;color:#52525b;border-bottom:${thinBdr};">Round Off</td><td style="padding:3px 10px;font-weight:700;font-size:9px;text-align:right;border-bottom:${thinBdr};">${roundOff.toFixed(2)}</td></tr>
              <tr style="background:${theme}18;"><td style="padding:5px 10px;font-weight:900;font-size:13px;color:${theme};border-bottom:${thinBdr};">Total</td><td style="padding:5px 10px;font-weight:900;font-size:13px;color:${theme};text-align:right;border-bottom:${thinBdr};">${total.toFixed(2)}</td></tr>
              <tr><td style="padding:3px 10px;font-weight:700;font-size:9px;text-transform:uppercase;color:#52525b;">Balance Due</td><td style="padding:3px 10px;font-weight:700;font-size:9px;text-align:right;">${balanceDue.toFixed(2)}</td></tr>
            </table>
          </td>
        </tr>
      </table>`;

    const summaryBlockModern = `
      <div style="text-align:right;margin-bottom:14px;font-family:Arial,sans-serif;">
        <table style="width:220px;border-collapse:collapse;margin-left:auto;">
          <tr><td style="padding:3px 0;font-size:10px;color:#52525b;">Subtotal</td><td style="padding:3px 0;font-size:10px;text-align:right;">${subtotal.toFixed(2)}</td></tr>
          ${invoice.discountPercentage > 0 ? `<tr><td style="padding:3px 0;font-size:10px;color:#52525b;">Discount (${invoice.discountPercentage}%)</td><td style="padding:3px 0;font-size:10px;text-align:right;color:#ef4444;">-${disc.toFixed(2)}</td></tr>` : ''}
          <tr><td style="padding:3px 0;font-size:10px;color:#52525b;">Round Off</td><td style="padding:3px 0;font-size:10px;text-align:right;">${roundOff.toFixed(2)}</td></tr>
          <tr style="border-top:1.5px solid #18181b;"><td style="padding:5px 0;font-weight:700;font-size:14px;">Total</td><td style="padding:5px 0;font-weight:700;font-size:14px;text-align:right;color:${theme};">${fmt(total)}</td></tr>
          ${balanceDue > 0 ? `<tr><td style="padding:3px 0;font-size:10px;color:#52525b;">Balance Due</td><td style="padding:3px 0;font-size:10px;text-align:right;">${balanceDue.toFixed(2)}</td></tr>` : ''}
        </table>
      </div>`;

    const termsHtml = invoice.terms ? `
      <div style="margin-top:14px;font-family:Arial,sans-serif;">
        <div style="font-weight:700;font-size:10px;text-decoration:underline;text-transform:uppercase;margin-bottom:5px;">Terms and Conditions</div>
        <ul style="margin:0;padding-left:16px;font-size:9px;color:#52525b;">
          ${invoice.terms.split('\n').filter((t: string) => t.trim()).map((t: string) => `<li style="margin-bottom:2px;">${t}</li>`).join('')}
        </ul>
      </div>` : '';

    const dlHtml = dlNumbers.length ? `
      <div style="text-align:right;font-size:9px;font-weight:700;margin-bottom:4px;font-family:Arial,sans-serif;">
        DL: ${dlNumbers.join(' | ')}
      </div>` : '';

    const medicalInvoiceHtml = `
      ${dlHtml}
      <div style="text-align:center;margin-bottom:8px;font-family:Arial,sans-serif;">
        <div style="font-weight:900;text-transform:uppercase;letter-spacing:2px;color:${theme};font-size:${titleFontSize};line-height:1.2;">${settings.companyName || ''}</div>
        ${settings.companyAddress ? `<div style="font-weight:700;font-size:12px;color:#27272a;margin-top:3px;">${settings.companyAddress}</div>` : ''}
        <div style="font-size:11px;color:#27272a;font-weight:600;margin-top:2px;">${settings.companyPhone ? `<span>&#9742; ${settings.companyPhone}</span>` : ''}${settings.companyPhone && settings.companyEmail ? '&nbsp;&nbsp;' : ''}${settings.companyEmail ? `<span>&#9993; ${settings.companyEmail}</span>` : ''}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:2px solid ${theme};margin-bottom:10px;font-family:Arial,sans-serif;">
        <tr>
          <td style="width:130px;padding:5px 10px;"></td>
          <td style="text-align:center;padding:5px 10px;font-weight:900;font-size:22px;color:${theme};letter-spacing:0.45em;text-transform:uppercase;">INVOICE</td>
          <td style="width:130px;text-align:right;padding:5px 10px;font-size:8px;font-weight:600;letter-spacing:0.05em;color:#27272a;text-transform:uppercase;">ORIGINAL FOR RECIPIENT</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;border:${bdr};margin-bottom:10px;font-family:Arial,sans-serif;font-size:11px;">
        <tr>
          <td style="padding:5px 10px;"><span style="font-weight:700;color:#27272a;text-transform:uppercase;letter-spacing:0.05em;">Invoice No: </span><span style="font-weight:900;">${invoice.invoiceNumber}</span></td>
          <td style="text-align:right;padding:5px 10px;"><span style="font-weight:700;color:#27272a;text-transform:uppercase;letter-spacing:0.05em;">Date: </span><span style="font-weight:900;">${formattedDate}</span></td>
        </tr>
      </table>
      <div style="margin-bottom:10px;font-family:Arial,sans-serif;">
        <div style="font-weight:900;font-size:12px;"><span style="font-weight:700;color:#27272a;">${invoice.clientLabel || 'Patient'}: </span><span style="text-transform:uppercase;">${invoice.clientName || ''}</span></div>
        ${(invoice.doctorName) ? `<div style="font-weight:900;font-size:11px;margin-top:2px;"><span style="font-weight:700;color:#27272a;">${doctorLabel}: </span><span style="text-transform:uppercase;">${invoice.doctorName}</span></div>` : ''}
        ${invoice.clientPhone ? `<div style="font-size:10px;color:#52525b;margin-top:2px;">&#9742; ${invoice.clientPhone}</div>` : ''}
      </div>
      ${medicalTableHtml}
      ${summaryBlockMedical}
      ${termsHtml}`;

    const modernInvoiceHtml = `
      ${dlHtml}
      <div style="text-align:center;margin-bottom:10px;font-family:Arial,sans-serif;">
        <div style="font-weight:900;text-transform:uppercase;letter-spacing:2px;color:${theme};font-size:${titleFontSize};line-height:1.2;">${settings.companyName || ''}</div>
        ${settings.companyAddress ? `<div style="font-weight:700;font-size:12px;color:#27272a;margin-top:3px;">${settings.companyAddress}</div>` : ''}
        <div style="font-size:11px;color:#27272a;font-weight:600;margin-top:2px;">${settings.companyPhone ? `<span>&#9742; ${settings.companyPhone}</span>` : ''}${settings.companyPhone && settings.companyEmail ? '&nbsp;&nbsp;' : ''}${settings.companyEmail ? `<span>&#9993; ${settings.companyEmail}</span>` : ''}</div>
      </div>
      <div style="text-align:center;margin-bottom:12px;font-family:Arial,sans-serif;">
        <div style="font-weight:900;font-size:22px;color:${theme};letter-spacing:0.4em;text-transform:uppercase;">INVOICE</div>
        <div style="font-size:9px;color:#52525b;">ORIGINAL FOR RECIPIENT</div>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#f4f4f5;border-radius:6px;margin-bottom:14px;font-family:Arial,sans-serif;">
        <tr>
          <td style="padding:10px 14px;"><div style="font-size:9px;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Invoice Number</div><div style="font-weight:700;font-size:14px;color:${theme};">#${invoice.invoiceNumber}</div></td>
          <td style="text-align:right;padding:10px 14px;"><div style="font-size:9px;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;">Invoice Date</div><div style="font-weight:700;font-size:14px;">${invoice.date || ''}</div></td>
        </tr>
      </table>
      <div style="margin-bottom:14px;font-family:Arial,sans-serif;">
        <div style="font-size:9px;color:#52525b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Bill To</div>
        <div style="font-weight:900;font-size:13px;"><span style="font-weight:700;color:#27272a;">${invoice.clientLabel || 'Client'}: </span><span style="text-transform:uppercase;">${invoice.clientName || ''}</span></div>
        ${invoice.doctorName ? `<div style="font-weight:700;font-size:12px;margin-top:2px;"><span style="color:#27272a;">${doctorLabel}: </span><span style="text-transform:uppercase;">${invoice.doctorName}</span></div>` : ''}
        ${invoice.clientEmail ? `<div style="font-size:10px;color:#52525b;margin-top:2px;">${invoice.clientEmail}</div>` : ''}
        ${invoice.clientPhone ? `<div style="font-size:10px;color:#52525b;">&#9742; ${invoice.clientPhone}</div>` : ''}
      </div>
      ${modernTableHtml}
      ${summaryBlockModern}
      ${termsHtml}`;

    const invoiceContent = isMedical ? medicalInvoiceHtml : modernInvoiceHtml;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:20px;background:#f4f4f5;font-family:Arial,sans-serif;"><div style="max-width:680px;margin:0 auto;background:#ffffff;border:2.5px solid #27272a;padding:16px;">${invoiceContent}</div><div style="max-width:680px;margin:12px auto;text-align:center;font-size:10px;color:#a1a1aa;">PDF invoice is attached to this email.</div></body></html>`;
  }

  // --- Email Route ---
  app.post("/api/send-invoice-email", authenticate, async (req: any, res) => {
    try {
      const { to, subject, body, invoiceNumber, invoiceData, settingsData } = req.body;
      
      const userRow = db.prepare("SELECT companyEmail, companyName, emailAppPassword FROM users WHERE id = ?").get((req as any).userId) as any;
      const fromEmail = "ritesh.inkpursuits@gmail.com";
      const appPass = process.env.APP_PASSWORD;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: fromEmail, pass: appPass },
      });

      const mailOptions: any = {
        from: `"${userRow?.companyName || 'Invoicer'}" <${fromEmail}>`,
        to,
        subject,
        text: body,
        html: invoiceData && settingsData ? buildInvoiceEmailHtml(invoiceData, settingsData) : body.replace(/\n/g, '<br>'),
      };

      // Generate PDF server-side from invoice data — no oklch, no browser issues
      if (invoiceData && settingsData) {
        try {
          const pdfBuffer = await buildInvoicePdfBuffer(invoiceData, settingsData);
          mailOptions.attachments = [{
            filename: `Invoice-${invoiceNumber || 'document'}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }];
        } catch (pdfErr: any) {
          console.error("PDF generation failed:", pdfErr.message);
          // Send email without attachment rather than failing entirely
        }
      }

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Email error:", err);
      res.status(500).json({ error: err.message || "Failed to send email" });
    }
  });

  // --- Bulk Email Route ---
  app.post("/api/send-bulk-invoice-email", authenticate, async (req: any, res) => {
    try {
      const { to, subject, body, invoicesData, settingsData } = req.body;

      const userRow = db.prepare("SELECT companyEmail, companyName, emailAppPassword FROM users WHERE id = ?").get((req as any).userId) as any;
      const fromEmail = "ritesh.inkpursuits@gmail.com";
      const appPass = process.env.APP_PASSWORD;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: fromEmail, pass: appPass },
      });

      const attachments: any[] = [];
      if (Array.isArray(invoicesData) && settingsData) {
        for (const invoice of invoicesData) {
          try {
            const fullInvoice = { ...invoice };
            fullInvoice.items = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?").all(invoice.id);
            const pdfBuffer = await buildInvoicePdfBuffer(fullInvoice, settingsData);
            attachments.push({
              filename: `Invoice-${invoice.invoiceNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            });
          } catch (pdfErr: any) {
            console.error(`PDF failed for ${invoice.invoiceNumber}:`, pdfErr.message);
          }
        }
      }

      await transporter.sendMail({
        from: `"${userRow?.companyName || 'Invoicer'}" <${fromEmail}>`,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
        attachments,
      });

      res.json({ success: true, attached: attachments.length });
    } catch (err: any) {
      console.error("Bulk email error:", err);
      res.status(500).json({ error: err.message || "Failed to send bulk email" });
    }
  });

  // --- Admin Routes ---
  app.get("/api/admin/users", adminAuthenticate, (req: any, res) => {
    const users = db.prepare(`
      SELECT u.id, u.email, u.companyName, u.companyPhone, u.companyEmail, u.currency, u.isAdmin,
             COUNT(i.id) as invoiceCount,
             COALESCE(SUM(i.total), 0) as totalRevenue,
             MAX(i.date) as lastInvoiceDate
      FROM users u
      LEFT JOIN invoices i ON i.userId = u.id
      GROUP BY u.id
      ORDER BY u.id ASC
    `).all();
    res.json(users);
  });

  app.patch("/api/admin/users/:id/toggle-admin", adminAuthenticate, (req: any, res) => {
    const target = db.prepare("SELECT isAdmin FROM users WHERE id = ?").get(req.params.id) as any;
    if (!target) return res.status(404).json({ error: "User not found" });
    db.prepare("UPDATE users SET isAdmin = ? WHERE id = ?").run(target.isAdmin ? 0 : 1, req.params.id);
    res.json({ success: true, isAdmin: !target.isAdmin });
  });

  app.get("/api/admin/invoices", adminAuthenticate, (req: any, res) => {
    const invoices = db.prepare(`
      SELECT i.*, u.companyName, u.email as userEmail
      FROM invoices i
      JOIN users u ON u.id = i.userId
      ORDER BY i.id DESC
    `).all() as any[];
    invoices.forEach(inv => {
      if (inv.dlNumbers) try { inv.dlNumbers = JSON.parse(inv.dlNumbers); } catch {}
    });
    res.json(invoices);
  });

  app.get("/api/admin/invoices/:id", adminAuthenticate, (req: any, res) => {
    const invoice = db.prepare("SELECT i.*, u.companyName, u.email as userEmail, u.companyAddress, u.companyPhone, u.companyEmail as userCompanyEmail, u.logoUrl, u.currency FROM invoices i JOIN users u ON u.id = i.userId WHERE i.id = ?").get(req.params.id) as any;
    if (invoice) {
      if (invoice.dlNumbers) try { invoice.dlNumbers = JSON.parse(invoice.dlNumbers); } catch {}
      invoice.items = db.prepare("SELECT * FROM invoice_items WHERE invoiceId = ?").all(invoice.id);
    }
    res.json(invoice);
  });

  // --- Vite middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

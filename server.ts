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

  app.use(express.json());
  app.use(cookieParser());

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
    res.json(safeUser);
  });

  app.post("/api/settings", authenticate, (req: any, res) => {
    const { companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency, dlNumbers, userName, emailAppPassword } = req.body;
    // Only update emailAppPassword if a non-empty value is provided
    if (emailAppPassword && emailAppPassword.trim()) {
      db.prepare(`UPDATE users SET emailAppPassword = ? WHERE id = ?`).run(emailAppPassword.trim(), req.userId);
    }
    db.prepare(`
      UPDATE users SET 
        companyName = ?, companyAddress = ?, companyEmail = ?, 
        companyPhone = ?, companyWebsite = ?, logoUrl = ?, currency = ?,
        dlNumbers = ?, userName = ?
      WHERE id = ?
    `).run(companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency,
      dlNumbers ? JSON.stringify(dlNumbers) : null, userName || null, req.userId);
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
      roundOff, total, balanceDue, items, template, themeColor, terms, showSignatory
    } = req.body;

    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices (
          userId, invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, clientLabel,
          doctorName, doctorLabel, dlNumbers,
          date, dueDate, discountPercentage, 
          roundOff, total, balanceDue, template, themeColor, terms, showSignatory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.userId, invoiceNumber, clientName, clientEmail, clientPhone || null, clientAddress,
        clientLabel || 'Billed To', doctorName || null, doctorLabel || 'Doctor',
        dlNumbers ? JSON.stringify(dlNumbers) : null,
        date, dueDate || null, discountPercentage, 
        roundOff, total, balanceDue || 0, template, themeColor || '#000000', terms, showSignatory ? 1 : 0
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
      roundOff, total, balanceDue, items, template, themeColor, terms, showSignatory
    } = req.body;

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE invoices SET 
          invoiceNumber = ?, clientName = ?, clientEmail = ?, clientPhone = ?, clientAddress = ?,
          clientLabel = ?, doctorName = ?, doctorLabel = ?, dlNumbers = ?,
          date = ?, dueDate = ?, discountPercentage = ?, 
          roundOff = ?, total = ?, balanceDue = ?, template = ?, themeColor = ?, terms = ?, showSignatory = ?
        WHERE id = ? AND userId = ?
      `).run(
        invoiceNumber, clientName, clientEmail, clientPhone || null, clientAddress,
        clientLabel || 'Billed To', doctorName || null, doctorLabel || 'Doctor',
        dlNumbers ? JSON.stringify(dlNumbers) : null,
        date, dueDate || null, discountPercentage, 
        roundOff, total, balanceDue || 0, template, themeColor || '#000000', terms, showSignatory ? 1 : 0,
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
        html: body.replace(/\n/g, '<br>'),
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

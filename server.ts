import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import path from "path";
import dotenv from "dotenv";

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
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
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
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'none' });
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
    const user = db.prepare("SELECT id, email, companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency FROM users WHERE id = ?").get(req.userId);
    res.json(user);
  });

  // --- Protected API Routes ---

  app.get("/api/settings", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    res.json(user);
  });

  app.post("/api/settings", authenticate, (req: any, res) => {
    const { companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency } = req.body;
    db.prepare(`
      UPDATE users SET 
        companyName = ?, companyAddress = ?, companyEmail = ?, 
        companyPhone = ?, companyWebsite = ?, logoUrl = ?, currency = ?
      WHERE id = ?
    `).run(companyName, companyAddress, companyEmail, companyPhone, companyWebsite, logoUrl, currency, req.userId);
    res.json({ success: true });
  });

  app.get("/api/products", authenticate, (req: any, res) => {
    const products = db.prepare("SELECT * FROM products WHERE userId = ?").all(req.userId);
    res.json(products);
  });

  app.post("/api/products", authenticate, (req: any, res) => {
    const { name, description, basePrice, unit, batchNo, expiryDate } = req.body;
    const result = db.prepare(
      "INSERT INTO products (userId, name, description, basePrice, unit, batchNo, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(req.userId, name, description, basePrice, unit || 'pcs', batchNo || null, expiryDate || null);
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
    res.json(product);
  });

  app.put("/api/products/:id", authenticate, (req: any, res) => {
    const { name, description, basePrice, unit, batchNo, expiryDate } = req.body;
    db.prepare(
      "UPDATE products SET name = ?, description = ?, basePrice = ?, unit = ?, batchNo = ?, expiryDate = ? WHERE id = ? AND userId = ?"
    ).run(name, description, basePrice, unit, batchNo || null, expiryDate || null, req.params.id, req.userId);
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
      invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, clientLabel, doctorName, dlNumbers,
      date, dueDate, discountPercentage, 
      roundOff, total, balanceDue, items, template, themeColor, terms, showSignatory
    } = req.body;

    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices (
          userId, invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, clientLabel, doctorName, dlNumbers,
          date, dueDate, discountPercentage, 
          roundOff, total, balanceDue, template, themeColor, terms, showSignatory
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.userId, invoiceNumber, clientName, clientEmail, clientPhone || null, clientAddress, clientLabel || 'Billed To', doctorName || null,
        dlNumbers ? JSON.stringify(dlNumbers) : null,
        date, dueDate || null, discountPercentage, 
        roundOff, total, balanceDue || 0, template, themeColor || '#000000', terms, showSignatory ? 1 : 0
      );

      const invoiceId = result.lastInsertRowid;
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (invoiceId, productId, description, quantity, unitPrice, unit, batchNo, expiryDate, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(invoiceId, item.productId, item.description, item.quantity, item.unitPrice, item.unit, item.batchNo || null, item.expiryDate || null, item.total);
      }

      const inv = db.prepare("SELECT * FROM invoices WHERE id = ?").get(invoiceId) as any;
      if (inv?.dlNumbers) try { inv.dlNumbers = JSON.parse(inv.dlNumbers); } catch {}
      return inv;
    });

    res.json(transaction());
  });

  app.put("/api/invoices/:id", authenticate, (req: any, res) => {
    const { 
      invoiceNumber, clientName, clientEmail, clientPhone, clientAddress, clientLabel, doctorName, dlNumbers,
      date, dueDate, discountPercentage, 
      roundOff, total, balanceDue, items, template, themeColor, terms, showSignatory
    } = req.body;

    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE invoices SET 
          invoiceNumber = ?, clientName = ?, clientEmail = ?, clientPhone = ?, clientAddress = ?, clientLabel = ?, doctorName = ?, dlNumbers = ?,
          date = ?, dueDate = ?, discountPercentage = ?, 
          roundOff = ?, total = ?, balanceDue = ?, template = ?, themeColor = ?, terms = ?, showSignatory = ?
        WHERE id = ? AND userId = ?
      `).run(
        invoiceNumber, clientName, clientEmail, clientPhone || null, clientAddress, clientLabel || 'Billed To', doctorName || null,
        dlNumbers ? JSON.stringify(dlNumbers) : null,
        date, dueDate || null, discountPercentage, 
        roundOff, total, balanceDue || 0, template, themeColor || '#000000', terms, showSignatory ? 1 : 0,
        req.params.id, req.userId
      );

      db.prepare("DELETE FROM invoice_items WHERE invoiceId = ?").run(req.params.id);
      
      const insertItem = db.prepare(`
        INSERT INTO invoice_items (invoiceId, productId, description, quantity, unitPrice, unit, batchNo, expiryDate, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        insertItem.run(req.params.id, item.productId, item.description, item.quantity, item.unitPrice, item.unit, item.batchNo || null, item.expiryDate || null, item.total);
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

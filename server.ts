import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

const VALID_PROPERTY_IDS = new Set([
  'ground-floor-2bhk',
  'second-floor-2bhk',
  'second-floor-luxury-1bhk',
  'third-floor-2bhk',
  'third-floor-luxury-1bhk',
]);

const VALID_FLOORS = new Set([
  'Ground Floor',
  'Second Floor',
  'Third Floor',
  'Any Available Floor',
]);

const VALID_ENQUIRY_STATUSES = new Set([
  'New',
  'Contacted',
  'Visit Scheduled',
  'Closed',
]);

const VALID_AVAILABILITY_STATUSES = new Set([
  'Available for Rent',
  'Reserved',
  'Leased',
]);

interface EnquiryRecord {
  id: string;
  fullName: string;
  mobileNumber: string;
  interestedBhk: '1 BHK' | '2 BHK';
  preferredFloor: string;
  preferredVisitDate: string;
  message: string;
  sourcePropertyId: string | null;
  sourcePropertyName: string | null;
  status: 'New' | 'Contacted' | 'Visit Scheduled' | 'Closed';
  createdAt: string;
}

interface PropertyOverride {
  description?: string;
  rentAmount?: string | null;
  securityDeposit?: string | null;
  dimensions?: string | null;
  availabilityDate?: string | null;
  availabilityStatus?: 'Available for Rent' | 'Reserved' | 'Leased';
  imageUrls?: string[];
}

interface ConfigOverride {
  businessPhone?: string;
  whatsappNumber?: string;
  businessEmail?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
}

interface StoreSchema {
  enquiries: EnquiryRecord[];
  propertyOverrides: Record<string, PropertyOverride>;
  configOverrides: ConfigOverride;
}

function ensureStore(): StoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreSchema = {
      enquiries: [],
      propertyOverrides: {},
      configOverrides: {},
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreSchema>;
    return {
      enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
      propertyOverrides: parsed.propertyOverrides && typeof parsed.propertyOverrides === 'object' ? parsed.propertyOverrides : {},
      configOverrides: parsed.configOverrides && typeof parsed.configOverrides === 'object' ? parsed.configOverrides : {},
    };
  } catch {
    return { enquiries: [], propertyOverrides: {}, configOverrides: {} };
  }
}

function saveStore(store: StoreSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function normalizeIndianMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const trimmed = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 11 && digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  if (/^[6-9]\d{9}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function safeTrim(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const configuredPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  if (!configuredPasscode) {
    res.status(503).json({
      error: 'Admin portal is locked because ADMIN_PASSCODE is not configured in environment variables.',
      setupRequired: true,
    });
    return;
  }

  const provided = safeTrim(req.headers['x-admin-passcode'], 128);
  const a = Buffer.from(provided);
  const b = Buffer.from(configuredPasscode);
  if (!provided || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Invalid admin passcode.' });
    return;
  }

  next();
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/public-data', (_req, res) => {
    const store = ensureStore();
    res.json({
      propertyOverrides: store.propertyOverrides,
      configOverrides: store.configOverrides,
    });
  });

  app.post('/api/enquiries', async (req, res) => {
    const body = req.body as Record<string, unknown>;

    // Honeypot check against automated bots
    const honeypot = safeTrim(body.website, 100);
    if (honeypot) {
      res.status(200).json({
        ok: true,
        message: 'Thank you. Your enquiry has been received.',
      });
      return;
    }

    const fullName = safeTrim(body.fullName, 120);
    const mobileInput = safeTrim(body.mobileNumber, 30);
    const interestedBhk = body.interestedBhk === '1 BHK' ? '1 BHK' : body.interestedBhk === '2 BHK' ? '2 BHK' : null;
    const preferredFloor = safeTrim(body.preferredFloor, 60) || 'Any Available Floor';
    const preferredVisitDate = safeTrim(body.preferredVisitDate, 30);
    const message = safeTrim(body.message, 1000);
    const sourcePropertyIdRaw = safeTrim(body.sourcePropertyId, 80);
    const sourcePropertyId = VALID_PROPERTY_IDS.has(sourcePropertyIdRaw) ? sourcePropertyIdRaw : null;
    const sourcePropertyName = safeTrim(body.sourcePropertyName, 120) || null;

    if (fullName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }

    const normalizedMobile = normalizeIndianMobile(mobileInput);
    if (!normalizedMobile) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }

    if (!interestedBhk) {
      res.status(400).json({ error: 'Please select whether you are interested in a 1 BHK or 2 BHK residence.' });
      return;
    }

    if (!VALID_FLOORS.has(preferredFloor)) {
      res.status(400).json({
        error: 'Please select Ground Floor, Second Floor, Third Floor, or Any Available Floor. The First Floor is not available for rent.',
      });
      return;
    }

    const store = ensureStore();
    const nowMs = Date.now();
    const duplicate = store.enquiries.find((entry) => {
      const createdMs = Date.parse(entry.createdAt);
      const withinTwoMinutes = Number.isFinite(createdMs) && nowMs - createdMs < 120_000;
      return (
        withinTwoMinutes &&
        entry.mobileNumber === normalizedMobile &&
        entry.interestedBhk === interestedBhk &&
        (entry.sourcePropertyId || '') === (sourcePropertyId || '')
      );
    });

    if (duplicate) {
      res.status(200).json({
        ok: true,
        duplicatePrevented: true,
        enquiryId: duplicate.id,
        createdAt: duplicate.createdAt,
        message: 'Your enquiry was already recorded moments ago. Our team will reach out shortly.',
      });
      return;
    }

    const newRecord: EnquiryRecord = {
      id: crypto.randomUUID(),
      fullName,
      mobileNumber: normalizedMobile,
      interestedBhk,
      preferredFloor,
      preferredVisitDate,
      message,
      sourcePropertyId,
      sourcePropertyName,
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    store.enquiries.unshift(newRecord);
    saveStore(store);

    // Optional external webhook forwarding (CRM / Google Sheets / Zapier)
    const webhookUrl = (process.env.ENQUIRY_WEBHOOK_URL || '').trim();
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      }).catch((err) => {
        console.error('Webhook forwarding failed:', err);
      });
    }

    res.status(201).json({
      ok: true,
      enquiryId: newRecord.id,
      createdAt: newRecord.createdAt,
      message: 'Thank you. Your enquiry has been saved securely and our property team will contact you shortly.',
    });
  });

  app.post('/api/admin/verify', requireAdminAuth, (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/admin/dashboard', requireAdminAuth, (_req, res) => {
    const store = ensureStore();
    res.json({
      enquiries: store.enquiries,
      propertyOverrides: store.propertyOverrides,
      configOverrides: store.configOverrides,
      integrationStatus: {
        adminPasscodeConfigured: Boolean((process.env.ADMIN_PASSCODE || '').trim()),
        enquiryWebhookConfigured: Boolean((process.env.ENQUIRY_WEBHOOK_URL || '').trim()),
      },
    });
  });

  app.patch('/api/admin/enquiries/:id', requireAdminAuth, (req, res) => {
    const id = req.params.id;
    const status = safeTrim((req.body as Record<string, unknown>).status, 40);
    if (!VALID_ENQUIRY_STATUSES.has(status)) {
      res.status(400).json({ error: 'Invalid enquiry status.' });
      return;
    }
    const store = ensureStore();
    const target = store.enquiries.find((e) => e.id === id);
    if (!target) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    target.status = status as EnquiryRecord['status'];
    saveStore(store);
    res.json({ ok: true, enquiry: target });
  });

  app.put('/api/admin/properties/:id', requireAdminAuth, (req, res) => {
    const id = req.params.id;
    if (!VALID_PROPERTY_IDS.has(id)) {
      res.status(400).json({ error: 'Invalid property ID. First Floor cannot be listed for rent.' });
      return;
    }
    const body = req.body as Record<string, unknown>;
    const store = ensureStore();
    const existing = store.propertyOverrides[id] || {};

    const nextOverride: PropertyOverride = { ...existing };

    if ('rentAmount' in body) {
      const val = safeTrim(body.rentAmount, 80);
      nextOverride.rentAmount = val || null;
    }
    if ('securityDeposit' in body) {
      const val = safeTrim(body.securityDeposit, 80);
      nextOverride.securityDeposit = val || null;
    }
    if ('dimensions' in body) {
      const val = safeTrim(body.dimensions, 80);
      nextOverride.dimensions = val || null;
    }
    if ('availabilityDate' in body) {
      const val = safeTrim(body.availabilityDate, 60);
      nextOverride.availabilityDate = val || null;
    }
    if ('description' in body) {
      const val = safeTrim(body.description, 1200);
      if (val) nextOverride.description = val;
    }
    if ('availabilityStatus' in body) {
      const val = safeTrim(body.availabilityStatus, 40);
      if (VALID_AVAILABILITY_STATUSES.has(val)) {
        nextOverride.availabilityStatus = val as PropertyOverride['availabilityStatus'];
      }
    }
    if (Array.isArray(body.imageUrls)) {
      nextOverride.imageUrls = body.imageUrls
        .map((u) => safeTrim(u, 400))
        .filter((u) => Boolean(u));
    }

    store.propertyOverrides[id] = nextOverride;
    saveStore(store);
    res.json({ ok: true, propertyOverrides: store.propertyOverrides });
  });

  app.put('/api/admin/config', requireAdminAuth, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const store = ensureStore();
    store.configOverrides = {
      businessPhone: safeTrim(body.businessPhone, 40),
      whatsappNumber: safeTrim(body.whatsappNumber, 40),
      businessEmail: safeTrim(body.businessEmail, 120),
      websiteUrl: safeTrim(body.websiteUrl, 200),
      googleMapsUrl: safeTrim(body.googleMapsUrl, 300),
    };
    saveStore(store);
    res.json({ ok: true, configOverrides: store.configOverrides });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AJ GRAND server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

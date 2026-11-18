import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
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
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const DEFAULT_NOTIFICATION_EMAIL = 'ajservices2132@gmail.com';

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

type DeliveryState = 'sent' | 'not_configured' | 'failed';

interface ChannelDeliveryResult {
  status: DeliveryState;
  detail: string;
  attemptedAt: string;
}

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
  notifications?: {
    email?: ChannelDeliveryResult;
    whatsapp?: ChannelDeliveryResult;
    webhook?: ChannelDeliveryResult;
  };
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
  notificationEmail?: string;
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

function cleanupUnusedUploadFiles(store: StoreSchema, candidateUrls: string[]): void {
  const stillReferenced = new Set<string>();
  for (const override of Object.values(store.propertyOverrides)) {
    if (Array.isArray(override?.imageUrls)) {
      for (const u of override.imageUrls) {
        stillReferenced.add(u);
      }
    }
  }

  const resolvedUploadsRoot = path.resolve(UPLOADS_DIR);
  for (const url of candidateUrls) {
    if (!url.startsWith('/uploads/') || stillReferenced.has(url)) continue;
    const relative = url.slice('/uploads/'.length);
    const targetPath = path.resolve(resolvedUploadsRoot, relative);
    if (!targetPath.startsWith(resolvedUploadsRoot + path.sep)) continue;
    try {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
    } catch {
      // Ignore cleanup errors
    }
  }
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRecipientEmail(store: StoreSchema): string {
  return (
    safeTrim(process.env.NOTIFICATION_EMAIL, 160) ||
    safeTrim(store.configOverrides.notificationEmail, 160) ||
    DEFAULT_NOTIFICATION_EMAIL
  );
}

function isEmailProviderConfigured(): boolean {
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  return Boolean(resendKey || (smtpUser && smtpPass));
}

function isWhatsAppCloudConfigured(): boolean {
  return Boolean(
    (process.env.WHATSAPP_CLOUD_TOKEN || '').trim() &&
      (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim() &&
      (process.env.WHATSAPP_ADMIN_RECIPIENT || '').trim()
  );
}

function buildEnquiryEmailContent(record: EnquiryRecord): {
  subject: string;
  text: string;
  html: string;
} {
  const istTime = new Date(record.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = `New AJ GRAND Enquiry: ${record.fullName} (${record.interestedBhk} · ${record.preferredFloor})`;
  const text = [
    'New Rental Enquiry Received – AJ GRAND',
    '----------------------------------------',
    `Applicant Name : ${record.fullName}`,
    `Mobile Number  : +91 ${record.mobileNumber}`,
    `WhatsApp Link  : https://wa.me/91${record.mobileNumber}`,
    `Interested In  : ${record.interestedBhk}`,
    `Preferred Floor: ${record.preferredFloor}`,
    record.sourcePropertyName ? `Source Unit    : ${record.sourcePropertyName}` : '',
    record.preferredVisitDate ? `Visit Date     : ${record.preferredVisitDate}` : '',
    record.message ? `Message        : ${record.message}` : '',
    `Received At    : ${istTime} IST`,
    `Enquiry ID     : ${record.id}`,
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fbf9f6; border: 1px solid #e8e2d9; padding: 24px; color: #1a1918;">
      <p style="font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #725b38; margin: 0 0 8px;">AJ GRAND · New Rental Enquiry</p>
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 500; margin: 0 0 18px;">${escapeHtml(record.fullName)}</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #ffffff; border: 1px solid #e8e2d9;">
        <tr><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9; color: #605e5c;">Mobile</td><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9; font-weight: 600;"><a href="tel:+91${escapeHtml(record.mobileNumber)}" style="color: #1a1918;">+91 ${escapeHtml(record.mobileNumber)}</a></td></tr>
        <tr><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9; color: #605e5c;">Interested Property</td><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9;">${escapeHtml(record.interestedBhk)} · ${escapeHtml(record.preferredFloor)}</td></tr>
        ${record.sourcePropertyName ? `<tr><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9; color: #605e5c;">Source Residence</td><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9;">${escapeHtml(record.sourcePropertyName)}</td></tr>` : ''}
        ${record.preferredVisitDate ? `<tr><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9; color: #605e5c;">Preferred Visit Date</td><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9;">${escapeHtml(record.preferredVisitDate)}</td></tr>` : ''}
        ${record.message ? `<tr><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9; color: #605e5c;">Message</td><td style="padding: 10px 14px; border-bottom: 1px solid #e8e2d9;">${escapeHtml(record.message)}</td></tr>` : ''}
        <tr><td style="padding: 10px 14px; color: #605e5c;">Received</td><td style="padding: 10px 14px;">${escapeHtml(istTime)} IST</td></tr>
      </table>
      <div style="margin-top: 18px;">
        <a href="https://wa.me/91${escapeHtml(record.mobileNumber)}" style="display: inline-block; padding: 10px 18px; background: #1a1918; color: #fbf9f6; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">Reply on WhatsApp</a>
        <a href="tel:+91${escapeHtml(record.mobileNumber)}" style="display: inline-block; margin-left: 8px; padding: 10px 18px; background: #c5a880; color: #1a1918; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">Call Applicant</a>
      </div>
    </div>
  `;

  return { subject, text, html };
}

async function sendEmailNotification(
  record: EnquiryRecord,
  recipientEmail: string
): Promise<ChannelDeliveryResult> {
  const attemptedAt = new Date().toISOString();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const { subject, text, html } = buildEnquiryEmailContent(record);

  if (resendKey) {
    try {
      const fromAddress = (process.env.EMAIL_FROM || 'AJ GRAND <onboarding@resend.dev>').trim();
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipientEmail],
          subject,
          text,
          html,
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return { status: 'failed', detail: `Resend API error (${resp.status}): ${errText.slice(0, 140)}`, attemptedAt };
      }
      return { status: 'sent', detail: `Delivered to ${recipientEmail} via Resend`, attemptedAt };
    } catch (err) {
      return {
        status: 'failed',
        detail: err instanceof Error ? err.message : 'Resend delivery error',
        attemptedAt,
      };
    }
  }

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      await transporter.sendMail({
        from: `"AJ GRAND Enquiries" <${smtpUser}>`,
        to: recipientEmail,
        subject,
        text,
        html,
      });
      return { status: 'sent', detail: `Delivered to ${recipientEmail} via SMTP`, attemptedAt };
    } catch (err) {
      return {
        status: 'failed',
        detail: err instanceof Error ? err.message : 'SMTP delivery error',
        attemptedAt,
      };
    }
  }

  return {
    status: 'not_configured',
    detail: `Recipient set (${recipientEmail}); add SMTP_PASS (Gmail App Password) or RESEND_API_KEY in Secrets/.env to send live emails.`,
    attemptedAt,
  };
}

async function sendWhatsAppAdminNotification(record: EnquiryRecord): Promise<ChannelDeliveryResult> {
  const attemptedAt = new Date().toISOString();
  const token = (process.env.WHATSAPP_CLOUD_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const adminRecipient = (process.env.WHATSAPP_ADMIN_RECIPIENT || '').replace(/\D/g, '');

  if (!token || !phoneNumberId || !adminRecipient) {
    return {
      status: 'not_configured',
      detail: 'Add WHATSAPP_CLOUD_TOKEN, WHATSAPP_PHONE_NUMBER_ID & WHATSAPP_ADMIN_RECIPIENT (or ENQUIRY_WEBHOOK_URL) for automatic WhatsApp push alerts.',
      attemptedAt,
    };
  }

  const bodyText = [
    `New AJ GRAND Enquiry`,
    `Name: ${record.fullName}`,
    `Mobile: +91 ${record.mobileNumber}`,
    `Interest: ${record.interestedBhk} (${record.preferredFloor})`,
    record.sourcePropertyName ? `Unit: ${record.sourcePropertyName}` : '',
    record.preferredVisitDate ? `Visit Date: ${record.preferredVisitDate}` : '',
    record.message ? `Message: ${record.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: adminRecipient,
          type: 'text',
          text: { body: bodyText },
        }),
      }
    );
    if (!resp.ok) {
      const errText = await resp.text();
      return { status: 'failed', detail: `WhatsApp API error (${resp.status}): ${errText.slice(0, 140)}`, attemptedAt };
    }
    return { status: 'sent', detail: `Delivered via WhatsApp Cloud API`, attemptedAt };
  } catch (err) {
    return {
      status: 'failed',
      detail: err instanceof Error ? err.message : 'WhatsApp Cloud delivery error',
      attemptedAt,
    };
  }
}

async function sendWebhookNotification(record: EnquiryRecord): Promise<ChannelDeliveryResult> {
  const attemptedAt = new Date().toISOString();
  const webhookUrl = (process.env.ENQUIRY_WEBHOOK_URL || '').trim();
  if (!webhookUrl) {
    return { status: 'not_configured', detail: 'ENQUIRY_WEBHOOK_URL not set', attemptedAt };
  }
  try {
    const resp = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!resp.ok) {
      return { status: 'failed', detail: `Webhook returned HTTP ${resp.status}`, attemptedAt };
    }
    return { status: 'sent', detail: 'Forwarded to external webhook', attemptedAt };
  } catch (err) {
    return {
      status: 'failed',
      detail: err instanceof Error ? err.message : 'Webhook request error',
      attemptedAt,
    };
  }
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
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));
  app.use('/uploads', (_req, res) => {
    res.status(404).json({ error: 'Uploaded image not found.' });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildConciergeSystemInstruction(store: StoreSchema): string {
  const unitSummaries = [
    { id: 'ground-floor-2bhk', label: 'Ground Floor – 2 BHK (600 sq.ft., Semi-furnished)' },
    { id: 'second-floor-2bhk', label: 'Second Floor – 2 BHK (600 sq.ft., Semi-furnished)' },
    { id: 'second-floor-luxury-1bhk', label: 'Second Floor – Luxury 1 BHK (450 sq.ft., Dual open balconies)' },
    { id: 'third-floor-2bhk', label: 'Third Floor – 2 BHK (600 sq.ft., Semi-furnished)' },
    { id: 'third-floor-luxury-1bhk', label: 'Third Floor – Luxury 1 BHK (450 sq.ft., Dual open balconies)' },
  ].map((u) => {
    const ov = store.propertyOverrides[u.id] || {};
    const status = ov.availabilityStatus || 'Available for Rent';
    const rent = ov.rentAmount ? `Rent: ${ov.rentAmount}` : 'Rent: Shared on enquiry/visit';
    const deposit = ov.securityDeposit ? `Deposit: ${ov.securityDeposit}` : '';
    const availDate = ov.availabilityDate ? `Available from: ${ov.availabilityDate}` : '';
    return `- ${u.label} | Status: ${status} | ${[rent, deposit, availDate].filter(Boolean).join(' | ')}`;
  });

  return [
    'You are the AJ GRAND Concierge, a warm, concise, and accurate leasing assistant for AJ GRAND ("Ayesha & Jaffar"), a newly constructed G+3 boutique residential rental building located at 34, Garden Main Road, Modi Garden, Kaval Bairasandra, Bengaluru, Karnataka 560006, India (Plus Code: 2J82+FV Bengaluru), bordering peaceful green defence land.',
    '',
    'FACTS ABOUT AJ GRAND:',
    '- Direct owner leasing with ZERO brokerage fees.',
    '- Total rental residences: 5 first-occupancy, freshly painted homes:',
    ...unitSummaries,
    '- STRICT RULE: The First Floor is the private residence of the building owner and is NEVER available for rent.',
    '- 2 BHK Specifications (600 sq.ft. quoted): Living 14.5 x 10 ft with false ceiling; L-shape kitchen 7 x 10 ft + utility 3 x 10 ft; Bedroom 1: 10 x 10 ft with attached Western bath 4 x 9 ft; Bedroom 2: 10 x 10 ft; Common Indian bath 9 x 4 ft; fitted bedroom wardrobes, kitchen storage, niche storage, premium granite & tiles.',
    '- Luxury 1 BHK Specifications (450 sq.ft. quoted): Living area 9.6 x 16 ft with open balcony; Bedroom 9 x 11 ft with separate open balcony & attached Western bath 4 x 6.8 ft; Kitchen 19 x 6 ft; Utility 3 x 6 ft; premium granite & tiles.',
    '- Building Amenities: Dedicated aluminum shoe rack per home; big L-shape/bay windows & open balconies for cross-ventilation; triple-source 24/7 water (private on-site water well ensuring zero shortage + borewell + Cauvery); covered car parking; CCTV surveillance; Terrace Garden; solar power; rainwater harvesting; waste management & sewage treatment.',
    '',
    'INSTRUCTIONS:',
    '1. Never fabricate rent figures, security deposit amounts, phone numbers, or move-in dates that are not explicitly listed above or returned by live Google Search.',
    '2. For neighbourhood, commute times, nearby metro stations, tech parks (such as Manyata Tech Park, Hebbal, Nagawara), schools, hospitals, or current Bengaluru information, use the Google Search grounding tool so answers reflect up-to-date facts.',
    '3. Keep responses concise (3-6 sentences or clean short bullet points), helpful, and gently invite the visitor to book a site visit or use Call / WhatsApp when they are ready.',
  ].join('\n');
}

  app.get('/api/public-data', (_req, res) => {
    const store = ensureStore();
    const mapsApiKey = (
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      ''
    ).trim();
    res.json({
      propertyOverrides: store.propertyOverrides,
      configOverrides: store.configOverrides,
      mapsApiKey,
    });
  });

  app.post('/api/chat', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini assistant requires GEMINI_API_KEY to be configured in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as { messages?: Array<{ role?: string; text?: string }> };
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const sanitized = rawMessages
      .filter((m) => (m?.role === 'user' || m?.role === 'model') && typeof m?.text === 'string')
      .map((m) => ({
        role: m.role as 'user' | 'model',
        parts: [{ text: safeTrim(m.text, 2000) }],
      }))
      .filter((m) => m.parts[0].text.length > 0)
      .slice(-14);

    if (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== 'user') {
      res.status(400).json({ error: 'Please enter a message to ask the AJ GRAND Concierge.' });
      return;
    }

    try {
      const store = ensureStore();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: sanitized,
        config: {
          systemInstruction: buildConciergeSystemInstruction(store),
          tools: [{ googleSearch: {} }],
        },
      });

      const replyText = (response.text || '').trim();
      if (!replyText) {
        res.status(502).json({ error: 'The assistant returned an empty response. Please try again.' });
        return;
      }

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const seenUrls = new Set<string>();
      const sources: { title: string; uri: string }[] = [];
      for (const chunk of rawChunks) {
        const uri = chunk?.web?.uri;
        if (typeof uri === 'string' && uri && !seenUrls.has(uri)) {
          seenUrls.add(uri);
          sources.push({
            title: safeTrim(chunk?.web?.title || uri, 120),
            uri,
          });
        }
      }

      res.json({
        ok: true,
        reply: replyText,
        sources: sources.slice(0, 5),
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Unable to reach Gemini assistant.';
      const isQuota = rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED');
      const isAuth =
        rawMessage.includes('403') ||
        rawMessage.includes('PERMISSION_DENIED') ||
        rawMessage.includes('API_KEY');
      const statusCode = isQuota ? 429 : isAuth ? 403 : 502;
      const friendlyMessage = isQuota
        ? 'The AJ GRAND Concierge is temporarily unavailable due to API quota or rate limits. Please try again shortly or use Schedule Site Visit / WhatsApp.'
        : isAuth
          ? 'Gemini API authentication failed. Please check the configured GEMINI_API_KEY.'
          : 'Unable to get a response from the concierge right now. Please try again.';
      res.status(statusCode).json({ error: friendlyMessage });
    }
  });

  app.post('/api/enquiries', async (req, res) => {
    const body = req.body as Record<string, unknown>;

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

    const recipientEmail = getRecipientEmail(store);
    const [emailResult, whatsappResult, webhookResult] = await Promise.all([
      sendEmailNotification(newRecord, recipientEmail),
      sendWhatsAppAdminNotification(newRecord),
      sendWebhookNotification(newRecord),
    ]);

    newRecord.notifications = {
      email: emailResult,
      whatsapp: whatsappResult,
      webhook: webhookResult,
    };

    store.enquiries.unshift(newRecord);
    saveStore(store);

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
        notificationEmail: getRecipientEmail(store),
        emailProviderConfigured: isEmailProviderConfigured(),
        whatsappCloudConfigured: isWhatsAppCloudConfigured(),
        enquiryWebhookConfigured: Boolean((process.env.ENQUIRY_WEBHOOK_URL || '').trim()),
      },
    });
  });

  app.post('/api/admin/test-email', requireAdminAuth, async (_req, res) => {
    const store = ensureStore();
    const recipientEmail = getRecipientEmail(store);
    const testRecord: EnquiryRecord = {
      id: 'test-notification',
      fullName: 'AJ GRAND Test Alert',
      mobileNumber: '9999999999',
      interestedBhk: '2 BHK',
      preferredFloor: 'Second Floor',
      preferredVisitDate: new Date().toISOString().split('T')[0],
      message: 'This is a test enquiry notification from your AJ GRAND Owner Portal.',
      sourcePropertyId: 'second-floor-2bhk',
      sourcePropertyName: 'Second Floor – 2 BHK',
      status: 'New',
      createdAt: new Date().toISOString(),
    };

    const result = await sendEmailNotification(testRecord, recipientEmail);
    if (result.status === 'sent') {
      res.json({ ok: true, result });
      return;
    }
    res.status(result.status === 'not_configured' ? 400 : 502).json({
      ok: false,
      error: result.detail,
      result,
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

  app.post('/api/admin/properties/:id/upload-image', requireAdminAuth, (req, res) => {
    const id = req.params.id;
    if (!VALID_PROPERTY_IDS.has(id)) {
      res.status(400).json({ error: 'Invalid property ID. First Floor cannot be modified.' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl.trim() : '';
    const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Please upload a valid JPG, PNG, or WebP image.' });
      return;
    }

    const rawExt = match[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length === 0 || buffer.length > 6 * 1024 * 1024) {
      res.status(400).json({ error: 'Uploaded image must be under 6 MB.' });
      return;
    }

    const propUploadDir = path.join(UPLOADS_DIR, id);
    if (!fs.existsSync(propUploadDir)) {
      fs.mkdirSync(propUploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const targetPath = path.join(propUploadDir, filename);
    fs.writeFileSync(targetPath, buffer);

    res.status(201).json({
      ok: true,
      url: `/uploads/${id}/${filename}`,
      bytes: buffer.length,
    });
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
    const previousImageUrls = Array.isArray(existing.imageUrls) ? [...existing.imageUrls] : [];

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
    if (body.resetImages === true) {
      delete nextOverride.imageUrls;
    } else if (Array.isArray(body.imageUrls)) {
      nextOverride.imageUrls = body.imageUrls
        .map((u) => safeTrim(u, 400))
        .filter((u) => Boolean(u));
    }

    store.propertyOverrides[id] = nextOverride;
    saveStore(store);
    cleanupUnusedUploadFiles(store, previousImageUrls);
    res.json({ ok: true, propertyOverrides: store.propertyOverrides });
  });

  app.put('/api/admin/config', requireAdminAuth, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const store = ensureStore();
    store.configOverrides = {
      businessPhone: safeTrim(body.businessPhone, 40),
      whatsappNumber: safeTrim(body.whatsappNumber, 40),
      businessEmail: safeTrim(body.businessEmail, 120),
      notificationEmail: safeTrim(body.notificationEmail, 160),
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

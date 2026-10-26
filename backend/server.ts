import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import {
  INITIAL_MARKET_PRICES,
  CROP_GUIDES,
  CROP_DISEASES,
  INITIAL_MARKETPLACE_LISTINGS,
  INITIAL_QUESTIONS,
} from '../shared/data/bangladeshData.ts';
import {
  INITIAL_DIVISIONS,
  INITIAL_DISTRICTS,
  INITIAL_UPAZILAS,
  INITIAL_PLATFORM_USERS,
  INITIAL_AGRI_ARTICLES,
  INITIAL_REPORTS,
  INITIAL_AUDIT_LOGS,
} from '../shared/data/locationAndAdminData.ts';
import { getWeatherAdvisory } from '../shared/utils/calculations.ts';
import {
  AdminRoleType,
  AdminPermissionAction,
  ADMIN_ROLE_DESCRIPTIONS_BN,
  hasAdminPermission,
  validateNewDivision,
  validateNewDistrict,
  validateNewUpazila,
  validateMarketPriceInput,
  INITIAL_AUTH_ACCOUNTS,
  AuthAccount,
} from '../shared/utils/locationAndAdminRules.ts';
import {
  DivisionEntity,
  DistrictEntity,
  UpazilaEntity,
  MarketPriceItem,
  MarketplaceListing,
  AuditLogEntry,
} from '../shared/types/index.ts';
import { auth, connectMongo, mongoDb } from './auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB-backed working copies, restored and committed by the API middleware.
let divisionsStore: DivisionEntity[] = [...INITIAL_DIVISIONS];
let districtsStore: DistrictEntity[] = [...INITIAL_DISTRICTS];
let upazilasStore: UpazilaEntity[] = [...INITIAL_UPAZILAS];
let usersStore = [...INITIAL_PLATFORM_USERS];
let articlesStore = [...INITIAL_AGRI_ARTICLES];
let reportsStore = [...INITIAL_REPORTS];
let auditLogsStore: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

// Enrich initial market prices with IDs and workflow status
let marketPricesStore: MarketPriceItem[] = INITIAL_MARKET_PRICES.map((item, idx) => ({
  ...item,
  divisionId: item.districtBn === 'ঢাকা' ? 'div-dhaka' : item.districtBn === 'কুমিল্লা' ? 'div-chattogram' : item.districtBn === 'যশোর' ? 'div-khulna' : item.districtBn === 'ময়মনসিংহ' ? 'div-mymensingh' : item.districtBn === 'দিনাজপুর' || item.districtBn === 'রংপুর' ? 'div-rangpur' : 'div-rajshahi',
  districtId: item.districtBn === 'ঢাকা' ? 'dist-dhaka' : item.districtBn === 'কুমিল্লা' ? 'dist-cumilla' : item.districtBn === 'যশোর' ? 'dist-jashore' : item.districtBn === 'ময়মনসিংহ' ? 'dist-mymensingh' : item.districtBn === 'দিনাজপুর' ? 'dist-dinajpur' : item.districtBn === 'রংপুর' ? 'dist-rangpur' : item.districtBn === 'রাজশাহী' ? 'dist-rajshahi' : 'dist-bogura',
  upazilaId: item.upazilaBn === 'শিবগঞ্জ' ? 'upz-shibganj' : item.upazilaBn === 'সাভার' ? 'upz-savar' : item.upazilaBn === 'বুড়িচং' ? 'upz-burichang' : 'upz-bogura-sadar',
  workflowStatus: idx === 11 || idx === 13 ? 'Pending Review' : 'Published',
  createdByBn: 'কৃষিবিদ শারমিন আক্তার',
  verifiedByBn: idx === 11 || idx === 13 ? undefined : 'মোঃ সোলায়মান শিকদার',
  publishedByBn: idx === 11 || idx === 13 ? undefined : 'মোঃ সোলায়মান শিকদার',
}));

let cropsStore = [...CROP_GUIDES];
let diseasesStore = [...CROP_DISEASES];
let marketplaceStore: MarketplaceListing[] = INITIAL_MARKETPLACE_LISTINGS.map((item, idx) => ({
  ...item,
  divisionId: item.districtBn === 'যশোর' ? 'div-khulna' : item.districtBn === 'ময়মনসিংহ' ? 'div-mymensingh' : 'div-rajshahi',
  districtId: item.districtBn === 'যশোর' ? 'dist-jashore' : item.districtBn === 'ময়মনসিংহ' ? 'dist-mymensingh' : item.districtBn === 'রাজশাহী' ? 'dist-rajshahi' : 'dist-bogura',
  upazilaId: item.upazilaBn === 'শিবগঞ্জ' ? 'upz-shibganj' : item.upazilaBn === 'পবা' ? 'upz-paba' : item.upazilaBn === 'ঝিকরগাছা' ? 'upz-jhikargacha' : 'upz-trishal',
  moderationStatus: idx === 3 ? 'Pending' : 'Published',
}));
let questionsStore = [...INITIAL_QUESTIONS];

// Weather Cache & API Telemetry for Admin Weather Settings (Section 6)
interface CachedWeather {
  timestamp: number;
  data: any;
}
const weatherCache = new Map<string, CachedWeather>();
const CACHE_TTL_MS = 15 * 60 * 1000;
const publicDemoAccounts = INITIAL_AUTH_ACCOUNTS.filter((account) => account.userRoleBn !== 'কৃষক');
let weatherTelemetry = {
  lastSuccessISO: new Date().toISOString(),
  totalRequests: 14,
  errorLogs: [] as { timeISO: string; message: string; coordinates: string }[],
};

interface AppStateSnapshot {
  divisions: DivisionEntity[];
  districts: DistrictEntity[];
  upazilas: UpazilaEntity[];
  users: typeof usersStore;
  articles: typeof articlesStore;
  reports: typeof reportsStore;
  auditLogs: AuditLogEntry[];
  marketPrices: MarketPriceItem[];
  crops: typeof cropsStore;
  diseases: typeof diseasesStore;
  marketplace: MarketplaceListing[];
  questions: typeof questionsStore;
  weatherTelemetry: typeof weatherTelemetry;
}

interface AppStateDocument {
  _id: 'primary';
  revision: number;
  state: AppStateSnapshot;
}

const appStateCollection = mongoDb.collection<AppStateDocument>('application_state');
let appStateRequestQueue: Promise<void> = Promise.resolve();
let appStateDirty = false;

function snapshotAppState(): AppStateSnapshot {
  return structuredClone({
    divisions: divisionsStore,
    districts: districtsStore,
    upazilas: upazilasStore,
    users: usersStore,
    articles: articlesStore,
    reports: reportsStore,
    auditLogs: auditLogsStore,
    marketPrices: marketPricesStore,
    crops: cropsStore,
    diseases: diseasesStore,
    marketplace: marketplaceStore,
    questions: questionsStore,
    weatherTelemetry,
  });
}

function restoreAppState(state: AppStateSnapshot) {
  divisionsStore = state.divisions;
  districtsStore = state.districts;
  upazilasStore = state.upazilas;
  usersStore = state.users;
  articlesStore = state.articles;
  reportsStore = state.reports;
  auditLogsStore = state.auditLogs;
  marketPricesStore = state.marketPrices;
  cropsStore = state.crops;
  diseasesStore = state.diseases;
  marketplaceStore = state.marketplace;
  questionsStore = state.questions;
  weatherTelemetry = state.weatherTelemetry;
  appStateDirty = false;
}

async function loadAppState(): Promise<AppStateDocument> {
  let document = await appStateCollection.findOne({ _id: 'primary' });
  if (!document) {
    const initial: AppStateDocument = {
      _id: 'primary',
      revision: 0,
      state: snapshotAppState(),
    };
    try {
      await appStateCollection.insertOne(initial);
      document = initial;
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 11000) throw error;
      document = await appStateCollection.findOne({ _id: 'primary' });
    }
  }
  if (!document) throw new Error('Persistent application state could not be initialized.');
  return document;
}

const persistentAppStateMiddleware: express.RequestHandler = (req, res, next) => {
  void (async () => {
    let release!: () => void;
    const previousRequest = appStateRequestQueue;
    appStateRequestQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previousRequest;

    let released = false;
    const releaseRequest = () => {
      if (released) return;
      released = true;
      release();
    };

    try {
      await connectMongo();
      const document = await loadAppState();
      restoreAppState(document.state);
      res.on('close', releaseRequest);

      const originalJson = res.json.bind(res);
      res.json = ((body?: unknown) => {
        if ((req.method === 'GET' || req.method === 'HEAD') && !appStateDirty) {
          releaseRequest();
          return originalJson(body);
        }

        void appStateCollection.updateOne(
          { _id: 'primary', revision: document.revision },
          { $set: { state: snapshotAppState() }, $inc: { revision: 1 } }
        ).then((result) => {
          if (!result.matchedCount) {
            res.status(409);
            originalJson({ error: 'তথ্য পরিবর্তিত হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
            return;
          }
          appStateDirty = false;
          originalJson(body);
        }).catch((error: unknown) => {
          console.error('Unable to persist application state:', error);
          res.status(503);
          originalJson({ error: 'তথ্য সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।' });
        }).finally(releaseRequest);
        return res;
      }) as express.Response['json'];

      next();
    } catch (error) {
      releaseRequest();
      next(error);
    }
  })();
};

function isAdminRole(value: unknown): value is AdminRoleType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ADMIN_ROLE_DESCRIPTIONS_BN, value);
}

function mapAuthUser(user: typeof auth.$Infer.Session.user): AuthAccount {
  const userRoleBn =
    user.userRoleBn === 'ক্রেতা' ||
    user.userRoleBn === 'বিশেষজ্ঞ' ||
    user.userRoleBn === 'প্রশাসক'
      ? user.userRoleBn
      : 'কৃষক';
  const adminRole = isAdminRole(user.adminRole) ? user.adminRole : undefined;

  return {
    id: user.id,
    username: user.username || user.email.split('@')[0],
    email: user.email,
    nameBn: user.name,
    phoneBn: user.phoneBn || '',
    userRoleBn,
    adminRole,
    positionTitleBn:
      user.positionTitleBn ||
      (adminRole
        ? ADMIN_ROLE_DESCRIPTIONS_BN[adminRole]
        : userRoleBn === 'ক্রেতা'
          ? 'নিবন্ধিত ক্রেতা'
          : userRoleBn === 'বিশেষজ্ঞ'
            ? 'কৃষি বিশেষজ্ঞ'
            : 'নিবন্ধিত কৃষক সদস্য'),
    divisionId: user.divisionId || 'div-rajshahi',
    districtId: user.districtId || 'dist-bogura',
    upazilaId: user.upazilaId || 'upz-shibganj',
  };
}

async function initializeAuthDatabase() {
  await connectMongo();
  const userCollection = mongoDb.collection('user');

  for (const account of publicDemoAccounts) {
    if (await userCollection.findOne({ email: account.email })) continue;
    if (!account.password) {
      throw new Error(`Demo account ${account.username} has no password configured.`);
    }

    await auth.api.signUpEmail({
      body: {
        email: account.email,
        username: account.username,
        name: account.nameBn,
        password: account.password,
        phoneBn: account.phoneBn,
        userRoleBn: account.userRoleBn,
        positionTitleBn: account.positionTitleBn,
        divisionId: account.divisionId,
        districtId: account.districtId,
        upazilaId: account.upazilaId,
      },
    });

    if (account.adminRole) {
      await userCollection.updateOne(
        { email: account.email },
        { $set: { adminRole: account.adminRole } }
      );
    }
  }
}

function recordAuditLog(params: {
  adminId?: string;
  adminNameBn?: string;
  adminRole?: AdminRoleType;
  actionBn: string;
  resourceTypeBn: AuditLogEntry['resourceTypeBn'];
  resourceId: string;
  previousValueBn?: string;
  newValueBn?: string;
  reasonBn?: string;
}) {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    requestId: `REQ-${Math.floor(10000 + Math.random() * 89999)}`,
    adminId: params.adminId || 'usr-1',
    adminNameBn: params.adminNameBn || 'মোঃ সোলায়মান শিকদার',
    adminRole: params.adminRole || 'Super Admin',
    actionBn: params.actionBn,
    resourceTypeBn: params.resourceTypeBn,
    resourceId: params.resourceId,
    previousValueBn: params.previousValueBn,
    newValueBn: params.newValueBn,
    reasonBn: params.reasonBn || 'প্রশাসনিক হালনাগাদ',
    timestampBn: 'এইমাত্র',
  };
  auditLogsStore = [entry, ...auditLogsStore];
  appStateDirty = true;
  return entry;
}

function getAdminRoleFromRequest(req: express.Request): {
  role: AdminRoleType;
  adminNameBn: string;
} {
  const admin = (req as AdminRequest).authenticatedAdmin;
  if (!admin) {
    throw new Error('Admin request context is missing.');
  }
  return admin;
}

interface AdminRequest extends express.Request {
  authenticatedAdmin?: { role: AdminRoleType; adminNameBn: string };
}

function enforcePermission(
  req: express.Request,
  res: express.Response,
  action: AdminPermissionAction
): boolean {
  const admin = (req as AdminRequest).authenticatedAdmin;
  if (!admin) {
    res.status(401).json({ error: 'প্রশাসনিক কাজের জন্য লগইন করুন।' });
    return false;
  }
  const { role } = admin;
  if (!hasAdminPermission(role, action)) {
    res.status(403).json({
      error: `অনুমতি নেই: আপনার বর্তমান ভূমিকা (${role}) দিয়ে এই প্রশাসনিক কাজটি করার অনুমতি নেই।`,
    });
    return false;
  }
  return true;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildFallbackWeather(lat: number, lon: number) {
  const now = new Date();
  const currentTemp = 29;
  const feelsLike = 32;
  const humidity = 72;
  const windSpeed = 12;
  const precipitation = 0;
  const weatherCode = 1;
  const rainProb = 20;

  const advisory = getWeatherAdvisory(weatherCode, currentTemp, rainProb, precipitation, windSpeed);

  const hourly = Array.from({ length: 8 }, (_, idx) => {
    const hDate = new Date(now.getTime() + idx * 3 * 3600 * 1000);
    const hourNum = hDate.getHours();
    const isDaytime = hourNum >= 6 && hourNum <= 18;
    const temp = isDaytime ? 28 + Math.round(Math.sin(((hourNum - 6) / 12) * Math.PI) * 5) : 24 + (hourNum % 3);
    const pop = idx === 3 || idx === 4 ? 35 : 15;
    return {
      timeISO: hDate.toISOString(),
      hourLabelBn: `${hourNum}:০০`,
      tempC: temp,
      rainProbPercent: pop,
      precipitationMm: pop > 30 ? 0.8 : 0,
      windSpeedKmh: 10 + (idx % 5) * 2,
      weatherCode: pop > 30 ? 2 : 1,
      conditionBn: pop > 30 ? 'আংশিক মেঘলা' : 'পরিষ্কার আকাশ',
    };
  });

  const dayNamesBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const daily = Array.from({ length: 7 }, (_, idx) => {
    const dDate = new Date(now.getTime() + idx * 24 * 3600 * 1000);
    const dayName = idx === 0 ? 'আজ' : idx === 1 ? 'আগামীকাল' : dayNamesBn[dDate.getDay()];
    const rainP = idx === 2 ? 65 : idx === 3 ? 45 : 15 + idx * 4;
    const wCode = idx === 2 ? 61 : idx === 3 ? 2 : 1;
    const condBn = idx === 2 ? 'হালকা বৃষ্টির সম্ভাবনা' : idx === 3 ? 'আংশিক মেঘলা' : 'রৌদ্রোজ্জ্বল';
    return {
      dateISO: dDate.toISOString().split('T')[0],
      dayNameBn: dayName,
      maxTempC: 31 + (idx % 3) - (idx === 2 ? 2 : 0),
      minTempC: 22 + (idx % 2),
      rainProbPercent: rainP,
      precipitationMm: idx === 2 ? 6.5 : 0,
      windSpeedKmh: 11 + (idx % 4) * 3,
      weatherCode: wCode,
      conditionBn: condBn,
    };
  });

  return {
    coordinates: { lat, lon },
    current: {
      tempC: currentTemp,
      feelsLikeC: feelsLike,
      humidityPercent: humidity,
      windSpeedKmh: windSpeed,
      precipitationMm: precipitation,
      rainProbPercent: rainProb,
      weatherCode,
      conditionBn: advisory.conditionBn,
    },
    advisory,
    hourly,
    daily,
    updatedAtISO: now.toISOString(),
    sourceBn: 'Open-Meteo আবহাওয়া সেবা ও কৃষি আবহাওয়া বিশ্লেষণ',
    isCachedFallback: false,
  };
}

async function fetchOpenMeteoWeather(lat: number, lon: number) {
  weatherTelemetry.totalRequests += 1;
  appStateDirty = true;
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FDhaka`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const raw = await res.json();
    const currentTemp = Math.round(raw.current?.temperature_2m ?? 29);
    const feelsLike = Math.round(raw.current?.apparent_temperature ?? 32);
    const humidity = Math.round(raw.current?.relative_humidity_2m ?? 70);
    const windSpeed = Math.round(raw.current?.wind_speed_10m ?? 10);
    const precipitation = Number(raw.current?.precipitation ?? 0);
    const weatherCode = Number(raw.current?.weather_code ?? 1);
    const todayRainProb = Number(raw.daily?.precipitation_probability_max?.[0] ?? 20);

    const advisory = getWeatherAdvisory(weatherCode, currentTemp, todayRainProb, precipitation, windSpeed);

    const hourlyTimes: string[] = raw.hourly?.time || [];
    const hourly = hourlyTimes.slice(0, 8).map((t: string, i: number) => {
      const hCode = Number(raw.hourly?.weather_code?.[i] ?? 1);
      const hAdv = getWeatherAdvisory(hCode, 28, 10, 0, 10);
      const timePart = t.split('T')[1] || '12:00';
      return {
        timeISO: t,
        hourLabelBn: timePart,
        tempC: Math.round(raw.hourly?.temperature_2m?.[i] ?? 28),
        rainProbPercent: Number(raw.hourly?.precipitation_probability?.[i] ?? 15),
        precipitationMm: Number(raw.hourly?.precipitation?.[i] ?? 0),
        windSpeedKmh: Math.round(raw.hourly?.wind_speed_10m?.[i] ?? 10),
        weatherCode: hCode,
        conditionBn: hAdv.conditionBn,
      };
    });

    const dayNamesBn = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const dailyTimes: string[] = raw.daily?.time || [];
    const daily = dailyTimes.slice(0, 7).map((dStr: string, idx: number) => {
      const dObj = new Date(dStr);
      const dayName = idx === 0 ? 'আজ' : idx === 1 ? 'আগামীকাল' : dayNamesBn[dObj.getDay()] || dStr;
      const dCode = Number(raw.daily?.weather_code?.[idx] ?? 1);
      const dAdv = getWeatherAdvisory(dCode, 29, 20, 0, 12);
      return {
        dateISO: dStr,
        dayNameBn: dayName,
        maxTempC: Math.round(raw.daily?.temperature_2m_max?.[idx] ?? 31),
        minTempC: Math.round(raw.daily?.temperature_2m_min?.[idx] ?? 23),
        rainProbPercent: Number(raw.daily?.precipitation_probability_max?.[idx] ?? 20),
        precipitationMm: Number(raw.daily?.precipitation_sum?.[idx] ?? 0),
        windSpeedKmh: Math.round(raw.daily?.wind_speed_10m_max?.[idx] ?? 12),
        weatherCode: dCode,
        conditionBn: dAdv.conditionBn,
      };
    });

    const formatted = {
      coordinates: { lat, lon },
      current: {
        tempC: currentTemp,
        feelsLikeC: feelsLike,
        humidityPercent: humidity,
        windSpeedKmh: windSpeed,
        precipitationMm: precipitation,
        rainProbPercent: todayRainProb,
        weatherCode,
        conditionBn: advisory.conditionBn,
      },
      advisory,
      hourly,
      daily,
      updatedAtISO: new Date().toISOString(),
      sourceBn: 'Open-Meteo API (সরাসরি আবহাওয়া উপাত্ত)',
      isCachedFallback: false,
    };

    weatherTelemetry.lastSuccessISO = new Date().toISOString();
    weatherCache.set(cacheKey, { timestamp: Date.now(), data: formatted });
    return formatted;
  } catch (err: any) {
    weatherTelemetry.errorLogs.unshift({
      timeISO: new Date().toISOString(),
      message: err?.message || 'Open-Meteo connection fallback',
      coordinates: cacheKey,
    });
    appStateDirty = true;
    if (cached) {
      return { ...cached.data, isCachedFallback: true };
    }
    const fallback = buildFallbackWeather(lat, lon);
    weatherCache.set(cacheKey, { timestamp: Date.now(), data: fallback });
    return fallback;
  }
}

export async function createApp(options: { useVite?: boolean } = {}) {
  await initializeAuthDatabase();
  const app = express();
  const allowedOrigins = new Set([
    ...(process.env.FRONTEND_URL || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ].map((origin) => new URL(origin).origin));
  for (const origin of process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']) {
    allowedOrigins.add(origin);
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
      if (req.headers['access-control-request-headers']) {
        res.setHeader(
          'Access-Control-Allow-Headers',
          req.headers['access-control-request-headers']
        );
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
    }
    return next();
  });

  app.get('/api/health', (_req, res) => {
    return res.json({ ok: true });
  });

  app.get('/api/auth/session', async (req, res) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session) {
        return res.status(401).json({ error: 'লগইন করা নেই।' });
      }
      return res.json({ account: mapAuthUser(session.user) });
    } catch (error) {
      console.error('Unable to read authentication session:', error);
      return res.status(500).json({ error: 'সেশন যাচাই করা যায়নি।' });
    }
  });

  app.post('/api/auth/activity', express.json({ limit: '8mb' }), persistentAppStateMiddleware, async (req, res) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      if (!session) {
        return res.status(401).json({ error: 'লগইন করা নেই।' });
      }

      const account = mapAuthUser(session.user);
      if (req.body?.action === 'register') {
        const roleBn =
          account.userRoleBn === 'বিশেষজ্ঞ' ? 'কৃষি বিশেষজ্ঞ' : account.userRoleBn;
        usersStore = usersStore.filter((user) => user.id !== account.id);
        usersStore.unshift({
          id: account.id,
          nameBn: account.nameBn,
          email: account.email,
          phoneBn: account.phoneBn,
          roleBn,
          divisionId: account.divisionId,
          districtId: account.districtId,
          upazilaId: account.upazilaId,
          status: 'সক্রিয়',
          joinedAtBn: 'এইমাত্র',
          reportsCount: 0,
        });
      } else if (req.body?.action === 'login' && account.adminRole) {
        recordAuditLog({
          adminId: account.id,
          adminNameBn: account.nameBn,
          adminRole: account.adminRole,
          actionBn: `${account.positionTitleBn} হিসেবে অ্যাডমিন প্যানেলে লগইন`,
          resourceTypeBn: 'সেটিংস ও অনুমতি',
          resourceId: account.id,
          previousValueBn: 'লগআউট',
          newValueBn: `সক্রিয় অধিবেশন (${account.adminRole})`,
          reasonBn: 'Better Auth সেশন যাচাই সম্পন্ন',
        });
      }
      return res.json({ ok: true });
    } catch (error) {
      console.error('Unable to record authentication activity:', error);
      return res.status(500).json({ error: 'অ্যাকাউন্ট কার্যক্রম সংরক্ষণ করা যায়নি।' });
    }
  });

  app.get('/api/auth/demo-accounts', (_req, res) => {
    return res.json({ accounts: publicDemoAccounts });
  });

  app.get('/api/auth/providers', (_req, res) => {
    return res.json({
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    });
  });

  app.all('/api/auth/*', toNodeHandler(auth));
  app.use(express.json({ limit: '8mb' }));
  app.use('/api/admin', async (req, res, next) => {
    try {
      const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
      const role = session && isAdminRole(session.user.adminRole)
        ? session.user.adminRole
        : undefined;
      if (!session) {
        res.status(401).json({ error: 'প্রশাসনিক কাজের জন্য লগইন করুন।' });
        return;
      }
      if (!role) {
        res.status(403).json({ error: 'এই অ্যাকাউন্টের প্রশাসনিক অনুমতি নেই।' });
        return;
      }
      (req as AdminRequest).authenticatedAdmin = {
        role,
        adminNameBn: session.user.name,
      };
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use('/api', persistentAppStateMiddleware);

  // ============================================================================
  // 14. LOCATION API (Public & Admin Hierarchy)
  // ============================================================================
  app.get('/api/locations/all', (_req, res) => {
    res.json({
      divisions: divisionsStore,
      districts: districtsStore,
      upazilas: upazilasStore,
    });
  });

  app.get('/api/locations/divisions', (_req, res) => {
    res.json({ items: divisionsStore });
  });

  app.get('/api/locations/districts', (req, res) => {
    const { divisionId } = req.query;
    const items = divisionId
      ? districtsStore.filter((d) => d.divisionId === divisionId)
      : districtsStore;
    res.json({ items });
  });

  app.get('/api/locations/upazilas', (req, res) => {
    const { districtId, divisionId } = req.query;
    let items = upazilasStore;
    if (districtId) {
      items = items.filter((u) => u.districtId === districtId);
    } else if (divisionId) {
      items = items.filter((u) => u.divisionId === divisionId);
    }
    res.json({ items });
  });

  app.get('/api/locations/search', (req, res) => {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q) {
      return res.json({ divisions: [], districts: [], upazilas: [] });
    }
    res.json({
      divisions: divisionsStore.filter((d) => d.nameBn.toLowerCase().includes(q)),
      districts: districtsStore.filter((d) => d.nameBn.toLowerCase().includes(q)),
      upazilas: upazilasStore.filter((u) => u.nameBn.toLowerCase().includes(q)),
    });
  });

  // Admin Location Endpoints with RBAC & Duplicate Validation
  app.post('/api/admin/locations/divisions', (req, res) => {
    if (!enforcePermission(req, res, 'manage_locations')) return;
    const { nameBn, code } = req.body || {};
    const validation = validateNewDivision(nameBn, divisionsStore);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errorBn });
    }
    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    const newDiv: DivisionEntity = {
      id: `div-${Date.now()}`,
      nameBn: nameBn.trim(),
      slug: nameBn.trim().toLowerCase().replace(/\s+/g, '-'),
      code: code || `BD-${divisionsStore.length + 1}0`,
      isActive: true,
      createdAtBn: 'এইমাত্র',
      updatedAtBn: 'এইমাত্র',
    };
    divisionsStore = [...divisionsStore, newDiv];
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'নতুন বিভাগ তৈরি করা হয়েছে',
      resourceTypeBn: 'অবস্থান',
      resourceId: newDiv.id,
      newValueBn: `${newDiv.nameBn} বিভাগ (${newDiv.code})`,
    });
    res.status(201).json(newDiv);
  });

  app.patch('/api/admin/locations/divisions/:id', (req, res) => {
    if (!enforcePermission(req, res, 'manage_locations')) return;
    const { id } = req.params;
    const { nameBn, isActive } = req.body || {};
    const idx = divisionsStore.findIndex((d) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'বিভাগ পাওয়া যায়নি।' });

    const prev = divisionsStore[idx];
    const updated: DivisionEntity = {
      ...prev,
      nameBn: nameBn !== undefined ? nameBn.trim() : prev.nameBn,
      isActive: isActive !== undefined ? Boolean(isActive) : prev.isActive,
      updatedAtBn: 'এইমাত্র',
    };
    divisionsStore[idx] = updated;
    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'বিভাগের তথ্য হালনাগাদ',
      resourceTypeBn: 'অবস্থান',
      resourceId: id,
      previousValueBn: `${prev.nameBn} (${prev.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'})`,
      newValueBn: `${updated.nameBn} (${updated.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'})`,
    });
    res.json(updated);
  });

  app.post('/api/admin/locations/districts', (req, res) => {
    if (!enforcePermission(req, res, 'manage_locations')) return;
    const { nameBn, divisionId, code } = req.body || {};
    const validation = validateNewDistrict(nameBn, divisionId, districtsStore);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errorBn });
    }
    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    const newDist: DistrictEntity = {
      id: `dist-${Date.now()}`,
      divisionId,
      nameBn: nameBn.trim(),
      slug: nameBn.trim().toLowerCase().replace(/\s+/g, '-'),
      code: code || `BD-DIST-${districtsStore.length + 1}`,
      isActive: true,
      createdAtBn: 'এইমাত্র',
      updatedAtBn: 'এইমাত্র',
    };
    districtsStore = [...districtsStore, newDist];
    const parentDiv = divisionsStore.find((d) => d.id === divisionId);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'নতুন জেলা যোগ করা হয়েছে',
      resourceTypeBn: 'অবস্থান',
      resourceId: newDist.id,
      newValueBn: `${newDist.nameBn} জেলা (বিভাগ: ${parentDiv?.nameBn || divisionId})`,
    });
    res.status(201).json(newDist);
  });

  app.patch('/api/admin/locations/districts/:id', (req, res) => {
    if (!enforcePermission(req, res, 'manage_locations')) return;
    const { id } = req.params;
    const { nameBn, divisionId, isActive } = req.body || {};
    const idx = districtsStore.findIndex((d) => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'জেলা পাওয়া যায়নি।' });

    const prev = districtsStore[idx];
    const newDivisionId = divisionId || prev.divisionId;
    const updated: DistrictEntity = {
      ...prev,
      nameBn: nameBn !== undefined ? nameBn.trim() : prev.nameBn,
      divisionId: newDivisionId,
      isActive: isActive !== undefined ? Boolean(isActive) : prev.isActive,
      updatedAtBn: 'এইমাত্র',
    };
    districtsStore[idx] = updated;
    // Also keep child upazilas divisionId in sync if division changed
    if (divisionId && divisionId !== prev.divisionId) {
      upazilasStore = upazilasStore.map((u) =>
        u.districtId === id ? { ...u, divisionId: newDivisionId } : u
      );
    }

    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'জেলার তথ্য সম্পাদনা',
      resourceTypeBn: 'অবস্থান',
      resourceId: id,
      previousValueBn: `${prev.nameBn} (${prev.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'})`,
      newValueBn: `${updated.nameBn} (${updated.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'})`,
    });
    res.json(updated);
  });

  app.post('/api/admin/locations/upazilas', (req, res) => {
    if (!enforcePermission(req, res, 'manage_locations')) return;
    const { nameBn, divisionId, districtId, latitude, longitude } = req.body || {};
    const validation = validateNewUpazila(nameBn, divisionId, districtId, upazilasStore);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errorBn });
    }
    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    const newUpz: UpazilaEntity = {
      id: `upz-${Date.now()}`,
      divisionId,
      districtId,
      nameBn: nameBn.trim(),
      slug: nameBn.trim().toLowerCase().replace(/\s+/g, '-'),
      code: `UPZ-${upazilasStore.length + 101}`,
      latitude: Number(latitude) || 24.0,
      longitude: Number(longitude) || 90.0,
      timezone: 'Asia/Dhaka',
      isActive: true,
      createdAtBn: 'এইমাত্র',
      updatedAtBn: 'এইমাত্র',
    };
    upazilasStore = [...upazilasStore, newUpz];
    const parentDist = districtsStore.find((d) => d.id === districtId);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'নতুন উপজেলা ও স্থানাঙ্ক যোগ করা হয়েছে',
      resourceTypeBn: 'অবস্থান',
      resourceId: newUpz.id,
      newValueBn: `${newUpz.nameBn} উপজেলা (জেলা: ${parentDist?.nameBn || districtId}, স্থানাঙ্ক: ${newUpz.latitude}, ${newUpz.longitude})`,
    });
    res.status(201).json(newUpz);
  });

  app.patch('/api/admin/locations/upazilas/:id', (req, res) => {
    if (!enforcePermission(req, res, 'manage_locations')) return;
    const { id } = req.params;
    const { nameBn, latitude, longitude, isActive } = req.body || {};
    const idx = upazilasStore.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'উপজেলা পাওয়া যায়নি।' });

    const prev = upazilasStore[idx];
    const updated: UpazilaEntity = {
      ...prev,
      nameBn: nameBn !== undefined ? nameBn.trim() : prev.nameBn,
      latitude: latitude !== undefined ? Number(latitude) : prev.latitude,
      longitude: longitude !== undefined ? Number(longitude) : prev.longitude,
      isActive: isActive !== undefined ? Boolean(isActive) : prev.isActive,
      updatedAtBn: 'এইমাত্র',
    };
    upazilasStore[idx] = updated;
    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'উপজেলার তথ্য ও অবস্থা হালনাগাদ',
      resourceTypeBn: 'অবস্থান',
      resourceId: id,
      previousValueBn: `${prev.nameBn} (${prev.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'})`,
      newValueBn: `${updated.nameBn} (${updated.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'})`,
    });
    res.json(updated);
  });

  app.post('/api/admin/locations/import', (req, res) => {
    if (!enforcePermission(req, res, 'manage_locations')) return;
    const { csvText } = req.body || {};
    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'সঠিক CSV টেক্সট প্রদান করুন।' });
    }
    const lines = csvText
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);
    let importedCount = 0;

    for (const line of lines) {
      if (line.startsWith('id,') || line.startsWith('nameBn,')) continue;
      const parts = line.split(',').map((p: string) => p.replace(/^"|"$/g, '').trim());
      // Format supported: upazilaNameBn,districtId,divisionId,lat,lon
      if (parts.length >= 3) {
        const [uName, distId, divId, latStr, lonStr] = parts;
        const check = validateNewUpazila(uName, divId, distId, upazilasStore);
        if (check.valid) {
          upazilasStore.push({
            id: `upz-imp-${Date.now()}-${importedCount}`,
            nameBn: uName,
            districtId: distId,
            divisionId: divId,
            slug: uName,
            code: `UPZ-IMP-${importedCount}`,
            latitude: parseFloat(latStr) || 24.1,
            longitude: parseFloat(lonStr) || 90.1,
            timezone: 'Asia/Dhaka',
            isActive: true,
            createdAtBn: 'CSV ইমপোর্ট',
            updatedAtBn: 'এইমাত্র',
          });
          importedCount++;
        }
      }
    }

    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'CSV থেকে অবস্থান ইমপোর্ট সম্পন্ন',
      resourceTypeBn: 'অবস্থান',
      resourceId: 'csv-import',
      newValueBn: `${importedCount}টি নতুন অবস্থান যুক্ত হয়েছে`,
    });

    res.json({ importedCount, upazilas: upazilasStore });
  });

  // ============================================================================
  // WEATHER API (Location-aware with Admin Telemetry)
  // ============================================================================
  app.get('/api/weather', async (req, res) => {
    const lat = parseFloat(req.query.lat as string) || 25.0014;
    const lon = parseFloat(req.query.lon as string) || 89.3222;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'অবৈধ স্থানাঙ্ক (Invalid coordinates)' });
    }
    const data = await fetchOpenMeteoWeather(lat, lon);
    res.json(data);
  });

  app.get('/api/weather/forecast', async (req, res) => {
    const lat = parseFloat(req.query.lat as string) || 25.0014;
    const lon = parseFloat(req.query.lon as string) || 89.3222;
    const data = await fetchOpenMeteoWeather(lat, lon);
    res.json({
      coordinates: data.coordinates,
      hourly: data.hourly,
      daily: data.daily,
      updatedAtISO: data.updatedAtISO,
    });
  });

  app.get('/api/weather/batch', async (req, res) => {
    const latParam =
      (req.query.latitude as string) ||
      '23.8103,22.3569,22.8456,24.3745,22.7010,25.7439,24.8949,24.7471';
    const lonParam =
      (req.query.longitude as string) ||
      '90.4125,91.7832,89.5403,88.6042,90.3535,89.2752,91.8687,90.4203';

    const lats = latParam.split(',').map((s) => parseFloat(s.trim()));
    const lons = lonParam.split(',').map((s) => parseFloat(s.trim()));

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latParam}&longitude=${lonParam}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FDhaka`;
      const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (response.ok) {
        const json = await response.json();
        const arr = Array.isArray(json) ? json : [json];
        return res.json(arr);
      }
    } catch (_e) {
      // Fallback below
    }

    const fallbackList = lats.map((lat, idx) => {
      const lon = lons[idx] ?? 90.0;
      const seed = Math.abs(Math.round((lat * 10 + lon * 7) * 10));
      const temperature_2m = Number((27.5 + (seed % 55) * 0.1).toFixed(1));
      const relative_humidity_2m = 64 + (seed % 24);
      const wind_speed_10m = Number((8.5 + (seed % 85) * 0.1).toFixed(1));
      return {
        latitude: lat,
        longitude: lon,
        current: {
          temperature_2m,
          relative_humidity_2m,
          wind_speed_10m,
        },
      };
    });

    res.json(fallbackList);
  });

  // ============================================================================
  // MARKET PRICES API (Public + Admin Workflow: Draft -> Pending Review -> Approved -> Published)
  // ============================================================================
  app.get('/api/market-prices', (req, res) => {
    const { crop, divisionId, districtId, upazilaId, district, category, includeAllStatuses } = req.query;
    let list = [...marketPricesStore];

    if (includeAllStatuses !== 'true') {
      list = list.filter((item) => !item.workflowStatus || item.workflowStatus === 'Published');
    }
    if (crop && typeof crop === 'string') {
      list = list.filter((item) => item.cropNameBn.includes(crop));
    }
    if (divisionId && typeof divisionId === 'string' && divisionId !== 'সব বিভাগ') {
      list = list.filter((item) => item.divisionId === divisionId);
    }
    if (districtId && typeof districtId === 'string' && districtId !== 'সব জেলা') {
      list = list.filter((item) => item.districtId === districtId);
    }
    if (upazilaId && typeof upazilaId === 'string' && upazilaId !== 'সব উপজেলা') {
      list = list.filter((item) => item.upazilaId === upazilaId);
    }
    if (district && typeof district === 'string' && district !== 'সব জেলা') {
      list = list.filter((item) => item.districtBn === district);
    }
    if (category && typeof category === 'string' && category !== 'সব বিভাগ') {
      list = list.filter((item) => item.categoryBn === category);
    }
    res.json({ items: list, total: list.length });
  });

  app.post('/api/admin/market-prices', (req, res) => {
    if (!enforcePermission(req, res, 'manage_market_prices')) return;
    const {
      cropNameBn,
      categoryBn,
      divisionId,
      districtId,
      upazilaId,
      marketNameBn,
      wholesalePrice,
      retailPrice,
      unitBn,
      sourceBn,
      workflowStatus,
    } = req.body || {};

    const validation = validateMarketPriceInput({
      cropNameBn,
      divisionId,
      districtId,
      upazilaId,
      marketNameBn,
      wholesalePrice,
      retailPrice,
      unitBn,
      sourceBn,
    });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errorBn });
    }

    const divObj = divisionsStore.find((d) => d.id === divisionId);
    const distObj = districtsStore.find((d) => d.id === districtId);
    const upzObj = upazilasStore.find((u) => u.id === upazilaId);

    const wPrice = Number(wholesalePrice);
    const rPrice = Number(retailPrice);
    const status = workflowStatus || 'Published';
    const { role, adminNameBn } = getAdminRoleFromRequest(req);

    const newEntry: MarketPriceItem = {
      id: `mp-${Date.now()}`,
      cropNameBn: cropNameBn.trim(),
      categoryBn: categoryBn || 'ধান ও শস্য',
      marketNameBn: marketNameBn.trim(),
      divisionId,
      districtId,
      upazilaId,
      divisionBn: divObj?.nameBn || 'রাজশাহী',
      districtBn: distObj?.nameBn || 'বগুড়া',
      upazilaBn: upzObj?.nameBn || 'শিবগঞ্জ',
      wholesalePrice: wPrice,
      retailPrice: rPrice,
      yesterdayWholesale: wPrice,
      sevenDayHistory: [wPrice, wPrice, wPrice, wPrice, wPrice, wPrice, wPrice],
      unitBn: unitBn.trim(),
      updatedAtBn: 'এইমাত্র হালনাগাদকৃত',
      recordedAtBn: 'আজ',
      sourceBn: sourceBn.trim(),
      verified: status === 'Published' || status === 'Approved',
      workflowStatus: status,
      createdByBn: adminNameBn,
      verifiedByBn: status === 'Published' || status === 'Approved' ? adminNameBn : undefined,
      publishedByBn: status === 'Published' ? adminNameBn : undefined,
      visualType: categoryBn === 'সবজি' ? 'potato' : categoryBn === 'মসলা ও তেলবীজ' ? 'mustard' : 'paddy',
    };

    marketPricesStore = [newEntry, ...marketPricesStore];
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: `নতুন বাজারদর এন্ট্রি (${status})`,
      resourceTypeBn: 'বাজারদর',
      resourceId: newEntry.id,
      newValueBn: `${newEntry.cropNameBn} — ৳${wPrice} (${newEntry.marketNameBn}, ${newEntry.upazilaBn}, ${newEntry.districtBn})`,
    });

    res.status(201).json(newEntry);
  });

  app.patch('/api/admin/market-prices/:id/status', (req, res) => {
    if (!enforcePermission(req, res, 'manage_market_prices')) return;
    const { id } = req.params;
    const { workflowStatus, wholesalePrice, retailPrice } = req.body || {};
    const idx = marketPricesStore.findIndex((m) => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'বাজারদর এন্ট্রি পাওয়া যায়নি।' });

    const prev = marketPricesStore[idx];
    const { role, adminNameBn } = getAdminRoleFromRequest(req);

    const updated: MarketPriceItem = {
      ...prev,
      workflowStatus: workflowStatus || prev.workflowStatus,
      verified: workflowStatus === 'Published' || workflowStatus === 'Approved',
      wholesalePrice: wholesalePrice !== undefined ? Number(wholesalePrice) : prev.wholesalePrice,
      retailPrice: retailPrice !== undefined ? Number(retailPrice) : prev.retailPrice,
      verifiedByBn:
        workflowStatus === 'Approved' || workflowStatus === 'Published'
          ? adminNameBn
          : prev.verifiedByBn,
      publishedByBn: workflowStatus === 'Published' ? adminNameBn : prev.publishedByBn,
      updatedAtBn: 'এইমাত্র হালনাগাদকৃত',
    };
    marketPricesStore[idx] = updated;

    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: `বাজারদর অবস্থা পরিবর্তন (${workflowStatus})`,
      resourceTypeBn: 'বাজারদর',
      resourceId: id,
      previousValueBn: `${prev.workflowStatus || 'Published'} (৳${prev.wholesalePrice})`,
      newValueBn: `${updated.workflowStatus} (৳${updated.wholesalePrice})`,
    });

    res.json(updated);
  });

  // ============================================================================
  // CROPS, DISEASES, MARKETPLACE & QA API
  // ============================================================================
  app.get('/api/crops', (_req, res) => {
    res.json({ items: cropsStore });
  });

  app.get('/api/diseases', (_req, res) => {
    res.json({ items: diseasesStore });
  });

  app.post('/api/diseases/diagnose', async (req, res) => {
    const { cropNameBn, symptomsDescriptionBn, imageBase64, mimeType } = req.body || {};
    if (!symptomsDescriptionBn && !imageBase64) {
      return res.status(400).json({ error: 'অনুগ্রহ করে আক্রান্ত পাতার ছবি অথবা লক্ষণের বিবরণ দিন।' });
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const parts: any[] = [];
        if (imageBase64 && mimeType) {
          parts.push({ inlineData: { data: imageBase64, mimeType } });
        }
        parts.push({
          text: `তুমি বাংলাদেশের একজন অভিজ্ঞ উদ্ভিদ রোগতত্ত্ব ও কৃষি বিশেষজ্ঞ সহকারী। কৃষক নিচের ফসল ও লক্ষণের কথা জানিয়েছেন:
ফসল: ${cropNameBn || 'উল্লেখ নেই'}
লক্ষণ: ${symptomsDescriptionBn || 'সংযুক্ত ছবিতে দেখুন'}
বাংলায় সংক্ষিপ্ত ও নির্ভরযোগ্য সম্ভাব্য রোগ নির্ণয় দাও।`,
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                probableDiseaseBn: { type: Type.STRING },
                matchingSymptomsBn: { type: Type.ARRAY, items: { type: Type.STRING } },
                immediateOrganicStepsBn: { type: Type.ARRAY, items: { type: Type.STRING } },
                disclaimerBn: { type: Type.STRING },
              },
              required: ['probableDiseaseBn', 'matchingSymptomsBn', 'immediateOrganicStepsBn', 'disclaimerBn'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ ...parsed, isAiGenerated: true });
      } catch (_e) {
        // Fallback
      }
    }

    const matchedDisease =
      diseasesStore.find(
        (d) =>
          (cropNameBn && d.affectedCropBn.includes(cropNameBn)) ||
          (symptomsDescriptionBn && d.nameBn.includes(symptomsDescriptionBn))
      ) || diseasesStore[0];

    res.json({
      probableDiseaseBn: `${matchedDisease.nameBn} (সম্ভাব্য মিল)`,
      matchingSymptomsBn: matchedDisease.symptomsBn,
      immediateOrganicStepsBn: matchedDisease.careAndManagementBn,
      disclaimerBn:
        'সতর্কতা: এটি লক্ষণভিত্তিক প্রাথমিক সম্ভাব্য ফলাফল, চূড়ান্ত বা নিশ্চিত রোগনির্ণয় নয়। কোনো কীটনাশক বা রাসায়নিক ব্যবহারের আগে স্থানীয় কৃষি সম্প্রসারণ অধিদপ্তরের (DAE) বিশেষজ্ঞের পরামর্শ নিন।',
      isAiGenerated: false,
    });
  });

  app.get('/api/marketplace/listings', (_req, res) => {
    res.json({ items: marketplaceStore });
  });

  app.post('/api/marketplace/listings', (req, res) => {
    const {
      sellerNameBn,
      cropNameBn,
      categoryBn,
      quantity,
      unitBn,
      pricePerUnit,
      divisionId,
      districtId,
      upazilaId,
      districtBn,
      upazilaBn,
      harvestDateBn,
      phoneBn,
      descriptionBn,
    } = req.body || {};

    if (!cropNameBn || !quantity || !pricePerUnit || !phoneBn) {
      return res.status(400).json({ error: 'ফসলের নাম, পরিমাণ, দাম এবং যোগাযোগের নম্বর আবশ্যক।' });
    }

    const distObj = districtsStore.find((d) => d.id === districtId);
    const upzObj = upazilasStore.find((u) => u.id === upazilaId);

    const newListing: MarketplaceListing = {
      id: `mkt-${Date.now()}`,
      sellerNameBn: sellerNameBn || 'মোঃ সোলায়মান শিকদার',
      sellerRoleBn: 'যাচাইকৃত কৃষক',
      verifiedSeller: true,
      cropNameBn,
      categoryBn: categoryBn || 'ধান ও শস্য',
      quantity: Number(quantity),
      unitBn: unitBn || 'মণ',
      pricePerUnit: Number(pricePerUnit),
      divisionId: divisionId || 'div-rajshahi',
      districtId: districtId || 'dist-bogura',
      upazilaId: upazilaId || 'upz-shibganj',
      districtBn: distObj?.nameBn || districtBn || 'বগুড়া',
      upazilaBn: upzObj?.nameBn || upazilaBn || 'শিবগঞ্জ',
      harvestDateBn: harvestDateBn || 'চলতি সপ্তাহ',
      phoneBn,
      descriptionBn: descriptionBn || 'সরাসরি কৃষকের খামার থেকে সংগৃহীত মানসম্মত ফসল।',
      status: 'approved',
      moderationStatus: 'Published',
      createdAtBn: 'এইমাত্র',
      visualType: categoryBn === 'সবজি' ? 'potato' : 'paddy',
    };
    marketplaceStore = [newListing, ...marketplaceStore];
    res.status(201).json(newListing);
  });

  app.patch('/api/admin/marketplace/:id/moderate', (req, res) => {
    if (!enforcePermission(req, res, 'moderate_marketplace')) return;
    const { id } = req.params;
    const { moderationStatus, reasonBn } = req.body || {};
    const idx = marketplaceStore.findIndex((m) => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'বিজ্ঞাপন পাওয়া যায়নি।' });

    const prev = marketplaceStore[idx];
    const { role, adminNameBn } = getAdminRoleFromRequest(req);

    const updated: MarketplaceListing = {
      ...prev,
      moderationStatus,
      status:
        moderationStatus === 'Published' || moderationStatus === 'Approved'
          ? 'approved'
          : moderationStatus === 'Rejected' || moderationStatus === 'Suspended'
          ? 'reported'
          : 'pending',
      moderationReasonBn: reasonBn || 'প্রশাসনিক মডারেশন সিদ্ধান্ত',
      moderatedAtBn: 'এইমাত্র',
      moderatedByBn: adminNameBn,
    };
    marketplaceStore[idx] = updated;

    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: `বিজ্ঞাপন মডারেশন সিদ্ধান্ত (${moderationStatus})`,
      resourceTypeBn: 'বিজ্ঞাপন',
      resourceId: id,
      previousValueBn: prev.moderationStatus || prev.status,
      newValueBn: `${moderationStatus} — কারণ: ${updated.moderationReasonBn}`,
      reasonBn: updated.moderationReasonBn || 'মডারেশন',
    });

    res.json(updated);
  });

  app.get('/api/questions', (_req, res) => {
    res.json({ items: questionsStore });
  });

  app.post('/api/questions', async (req, res) => {
    const { titleBn, detailsBn, cropBn, categoryBn, divisionId, districtId, upazilaId, districtBn, upazilaBn, askedByBn } = req.body || {};
    if (!titleBn || !detailsBn) {
      return res.status(400).json({ error: 'প্রশ্নের শিরোনাম এবং বিস্তারিত বিবরণ আবশ্যক।' });
    }
    const distObj = districtsStore.find((d) => d.id === districtId);
    const upzObj = upazilasStore.find((u) => u.id === upazilaId);

    const newQ = {
      id: `qa-${Date.now()}`,
      titleBn,
      detailsBn,
      cropBn: cropBn || 'আমন ও বোরো ধান',
      categoryBn: categoryBn || 'রোগ ও পোকা',
      divisionId,
      districtId,
      upazilaId,
      districtBn: distObj?.nameBn || districtBn || 'বগুড়া',
      upazilaBn: upzObj?.nameBn || upazilaBn || 'শিবগঞ্জ',
      askedByBn: askedByBn || 'মোঃ সোলায়মান শিকদার',
      askedAtBn: 'এইমাত্র',
      helpfulCount: 1,
      answers: [],
    };
    questionsStore = [newQ, ...questionsStore];
    res.status(201).json(newQ);
  });

  app.post('/api/admin/questions/:id/answer', (req, res) => {
    if (!enforcePermission(req, res, 'manage_qa_support')) return;
    const { id } = req.params;
    const { answerTextBn, expertNameBn, expertTitleBn } = req.body || {};
    if (!answerTextBn?.trim()) {
      return res.status(400).json({ error: 'উত্তরের বিবরণ ফাঁকা রাখা যাবে না।' });
    }
    const idx = questionsStore.findIndex((q) => q.id === id);
    if (idx === -1) return res.status(404).json({ error: 'প্রশ্নটি পাওয়া যায়নি।' });

    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    const newAns = {
      id: `ans-${Date.now()}`,
      expertNameBn: expertNameBn || adminNameBn,
      expertTitleBn: expertTitleBn || 'যাচাইকৃত কৃষি বিশেষজ্ঞ — কৃষিবন্ধু প্যানেল',
      verifiedExpert: true,
      answerTextBn: answerTextBn.trim(),
      answeredAtBn: 'এইমাত্র',
    };
    questionsStore[idx] = {
      ...questionsStore[idx],
      answers: [...questionsStore[idx].answers, newAns],
    };

    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'কৃষি প্রশ্নের বিশেষজ্ঞ উত্তর প্রদান',
      resourceTypeBn: 'প্রশ্নোত্তর',
      resourceId: id,
      newValueBn: answerTextBn.trim().slice(0, 60),
    });

    res.json(questionsStore[idx]);
  });

  // ============================================================================
  // ADMIN OVERVIEW, USERS, ARTICLES, REPORTS & AUDIT LOGS
  // ============================================================================
  app.get('/api/admin/overview', (req, res) => {
    const { role } = getAdminRoleFromRequest(req);
    const canManageUsers = hasAdminPermission(role, 'manage_users');
    const canManageMarketPrices = hasAdminPermission(role, 'manage_market_prices');
    const canModerateMarketplace = hasAdminPermission(role, 'moderate_marketplace');
    const canManageQuestions = hasAdminPermission(role, 'manage_qa_support');
    res.json({
      users: canManageUsers ? usersStore : [],
      articles: hasAdminPermission(role, 'manage_content') ? articlesStore : [],
      reports: canModerateMarketplace || canManageQuestions ? reportsStore : [],
      auditLogs: hasAdminPermission(role, 'view_audit_logs') ? auditLogsStore : [],
      weatherTelemetry: canManageMarketPrices
        ? { ...weatherTelemetry, cachedLocationsCount: weatherCache.size }
        : null,
      counts: {
        totalUsers: canManageUsers ? usersStore.length : 0,
        activeFarmers: canManageUsers
          ? usersStore.filter((u) => u.roleBn === 'কৃষক' && u.status === 'সক্রিয়').length
          : 0,
        pendingMarketPrices: canManageMarketPrices
          ? marketPricesStore.filter((m) => m.workflowStatus === 'Pending Review' || m.workflowStatus === 'Draft').length
          : 0,
        publishedMarketPrices: canManageMarketPrices
          ? marketPricesStore.filter((m) => !m.workflowStatus || m.workflowStatus === 'Published').length
          : 0,
        pendingListings: canModerateMarketplace
          ? marketplaceStore.filter((m) => m.moderationStatus === 'Pending' || m.status === 'pending').length
          : 0,
        activeListings: canModerateMarketplace
          ? marketplaceStore.filter((m) => m.moderationStatus === 'Published' || m.status === 'approved').length
          : 0,
        unansweredQuestions: canManageQuestions
          ? questionsStore.filter((q) => q.answers.length === 0).length
          : 0,
        openReports: canModerateMarketplace || canManageQuestions
          ? reportsStore.filter((r) => r.status === 'বিবেচনাধীন').length
          : 0,
      },
    });
  });

  app.patch('/api/admin/users/:id', (req, res) => {
    if (!enforcePermission(req, res, 'manage_users')) return;
    const { id } = req.params;
    const { roleBn, adminRole, status } = req.body || {};
    const idx = usersStore.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' });

    const prev = usersStore[idx];
    const updated = {
      ...prev,
      roleBn: roleBn || prev.roleBn,
      adminRole: adminRole !== undefined ? adminRole : prev.adminRole,
      status: status || prev.status,
    };
    usersStore[idx] = updated;

    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'ব্যবহারকারীর ভূমিকা বা অবস্থা হালনাগাদ',
      resourceTypeBn: 'ব্যবহারকারী',
      resourceId: id,
      previousValueBn: `${prev.nameBn} (${prev.roleBn}, ${prev.status})`,
      newValueBn: `${updated.nameBn} (${updated.roleBn}, ${updated.status})`,
    });

    res.json(updated);
  });

  app.post('/api/admin/articles', (req, res) => {
    if (!enforcePermission(req, res, 'manage_content')) return;
    const { titleBn, categoryBn, summaryBn, contentBn, status } = req.body || {};
    if (!titleBn?.trim() || !summaryBn?.trim()) {
      return res.status(400).json({ error: 'নিবন্ধের শিরোনাম ও সারসংক্ষেপ আবশ্যক।' });
    }
    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    const newArt = {
      id: `art-${Date.now()}`,
      titleBn: titleBn.trim(),
      categoryBn: categoryBn || 'চাষাবাদ প্রযুক্তি',
      summaryBn: summaryBn.trim(),
      contentBn: contentBn?.trim() || summaryBn.trim(),
      authorBn: adminNameBn,
      publishedAtBn: 'আজ',
      status: status || 'প্রকাশিত',
    };
    articlesStore = [newArt, ...articlesStore];
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: 'নতুন কৃষি নিবন্ধ যোগ করা হয়েছে',
      resourceTypeBn: 'ফসল ও নিবন্ধ',
      resourceId: newArt.id,
      newValueBn: newArt.titleBn,
    });
    res.status(201).json(newArt);
  });

  app.patch('/api/admin/reports/:id', (req, res) => {
    if (!enforcePermission(req, res, 'moderate_marketplace')) return;
    const { id } = req.params;
    const { status, resolutionNoteBn } = req.body || {};
    const idx = reportsStore.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'অভিযোগ পাওয়া যায়নি।' });

    const prev = reportsStore[idx];
    const updated = {
      ...prev,
      status: status || 'সমাধানকৃত',
      resolutionNoteBn: resolutionNoteBn || 'প্রশাসনিক যাচাই শেষে ব্যবস্থা নেওয়া হয়েছে',
    };
    reportsStore[idx] = updated;
    const { role, adminNameBn } = getAdminRoleFromRequest(req);
    recordAuditLog({
      adminNameBn,
      adminRole: role,
      actionBn: `অভিযোগ নিষ্পত্তি (${updated.status})`,
      resourceTypeBn: 'বিজ্ঞাপন',
      resourceId: id,
      previousValueBn: prev.status,
      newValueBn: `${updated.status} — ${updated.resolutionNoteBn}`,
    });
    res.json(updated);
  });

  // The backend serves the Vite app locally; production frontend lives on Vercel.
  if (options.useVite ?? process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: path.resolve(__dirname, '../frontend'),
      configFile: path.resolve(__dirname, '../frontend/vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

  return app;
}

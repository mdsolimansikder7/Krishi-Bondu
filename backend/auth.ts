import 'dotenv/config';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';
import { authUserFields } from '../shared/authUserFields.ts';

const mongoUri = process.env.MONGODB_URI;
const secret = process.env.BETTER_AUTH_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const configuredBaseURL = process.env.BETTER_AUTH_URL;
const frontendUrls = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isProduction && !configuredBaseURL) {
  throw new Error('BETTER_AUTH_URL must be configured in production.');
}

if (isProduction && frontendUrls.length === 0) {
  throw new Error('FRONTEND_URL must include at least one frontend origin in production.');
}

const baseURL = configuredBaseURL || 'http://localhost:3000';
const trustedOrigins = new Set([
  new URL(baseURL).origin,
  ...frontendUrls.map((origin) => new URL(origin).origin),
]);

if (!isProduction) {
  trustedOrigins.add('http://localhost:3000');
  trustedOrigins.add('http://127.0.0.1:3000');
}

if (!mongoUri) {
  throw new Error('MONGODB_URI is required to start authentication.');
}

if (!secret || secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be set to a value at least 32 characters long.');
}

type MongoGlobal = typeof globalThis & {
  krishiMongoClient?: MongoClient;
  krishiMongoConnection?: Promise<MongoClient>;
};

const mongoGlobal = globalThis as MongoGlobal;
export const mongoClient =
  mongoGlobal.krishiMongoClient ??
  (mongoGlobal.krishiMongoClient = new MongoClient(mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  }));
export const mongoDb = mongoClient.db();

export function connectMongo() {
  if (!mongoGlobal.krishiMongoConnection) {
    mongoGlobal.krishiMongoConnection = mongoClient.connect().catch((error: unknown) => {
      mongoGlobal.krishiMongoConnection = undefined;
      throw error;
    });
  }
  return mongoGlobal.krishiMongoConnection;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleProvider =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined;

export const auth = betterAuth({
  appName: 'কৃষিবন্ধু',
  baseURL,
  secret,
  trustedOrigins: [...trustedOrigins],
  database: mongodbAdapter(mongoDb),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },
  socialProviders: googleProvider,
  plugins: [username()],
  user: {
    additionalFields: authUserFields,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    useSecureCookies: isProduction,
    cookieSameSite: isProduction ? 'none' : 'lax',
  },
});

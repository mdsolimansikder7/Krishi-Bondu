import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import { createServer } from 'node:http';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { after, before, test } from 'node:test';
import { createVercelHandler } from '../vercelHandler.ts';

const app = express();
app.get('/api/health', (_req, res) => res.json({ ok: true }));

let initializationCount = 0;
const handler = createVercelHandler(async () => {
  initializationCount++;
  return app;
});

const server = createServer((req, res) => {
  void handler(req as VercelRequest, res as VercelResponse);
});

before(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
});

after(() => {
  server.close();
});

test('serverless handler dispatches Express API paths and reuses its app instance', async () => {
  const address = server.address();
  assert(address && typeof address !== 'string');

  const first = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), { ok: true });

  const second = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  assert.equal(second.status, 200);
  assert.equal(initializationCount, 1);
});

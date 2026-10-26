
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createVercelHandler } from '../backend/vercelHandler.ts';
import { createApp } from '../backend/server.ts';

const handler = createVercelHandler(createApp);

export default function api(
  request: VercelRequest,
  response: VercelResponse
) {
  return handler(request, response);
}

import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins';
import { authUserFields } from '@shared/authUserFields';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || undefined,
  fetchOptions: { credentials: 'include' },
  plugins: [
    inferAdditionalFields<undefined, { user: typeof authUserFields }>(),
    usernameClient(),
  ],
});

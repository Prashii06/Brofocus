// BroFocus - Integrations Routes (/api/v1/integrations)
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { decrypt, encrypt } from '../lib/crypto';
import { store, IntegrationProvider } from '../store/inMemory';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/v1/integrations/callback';

const normalizeFrontendUrl = (value: string): string => value.replace(/\/+$/, '');
const buildFrontendRedirect = (frontendUrl: string, params: Record<string, string>) => {
  const safeBaseUrl = normalizeFrontendUrl(frontendUrl || 'http://localhost:5173');
  const searchParams = new URLSearchParams(params);
  return `${safeBaseUrl}/integrations?${searchParams.toString()}`;
};

const PROVIDER_SCOPES: Record<IntegrationProvider, string[]> = {
  gmail: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose'],
  google_calendar: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
  google_drive: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
  google_meet: ['https://www.googleapis.com/auth/meetings.space.created'],
};

const VALID_PROVIDERS = Object.keys(PROVIDER_SCOPES) as IntegrationProvider[];
const OAUTH_STATE_SECRET = process.env.JWT_ACCESS_SECRET || 'brofocus-oauth-state-secret';

function isValidProvider(value: string): value is IntegrationProvider {
  return (VALID_PROVIDERS as string[]).includes(value);
}

function createSignedState(payload: { provider: string; userId: string; exp: number }) {
  const serialized = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', OAUTH_STATE_SECRET).update(serialized).digest('hex');
  return Buffer.from(`${serialized}.${signature}`).toString('base64url');
}

function verifySignedState(rawState: string): { provider: string; userId: string } | null {
  try {
    const decoded = Buffer.from(rawState, 'base64url').toString('utf8');
    const lastDot = decoded.lastIndexOf('.');
    if (lastDot <= 0) return null;

    const payloadString = decoded.slice(0, lastDot);
    const signature = decoded.slice(lastDot + 1);
    const expectedSignature = crypto.createHmac('sha256', OAUTH_STATE_SECRET).update(payloadString).digest('hex');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(payloadString) as { provider?: string; userId?: string; exp?: number };
    if (!payload.provider || !payload.userId || !payload.exp || payload.exp < Date.now()) return null;
    return { provider: payload.provider, userId: payload.userId };
  } catch {
    return null;
  }
}

// GET /api/v1/integrations/status
router.get('/status', authenticate, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const integrations = await store.getIntegrations(userId);
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const statusMap = integrations.reduce((acc, integration) => {
    acc[integration.provider] = {
      connected: integration.connected,
      email: integration.email ?? undefined,
      connected_at: integration.connected_at ?? undefined,
    };
    return acc;
  }, {} as Record<string, { connected: boolean; email?: string; connected_at?: Date }>);

  VALID_PROVIDERS.forEach(p => {
    if (!statusMap[p]) {
      statusMap[p] = { connected: false };
    }
  });

  res.json({
    status: 'success',
    integrations: statusMap,
    connected_count: integrations.filter(i => i.connected).length,
    total_count: VALID_PROVIDERS.length,
  });
});

// POST /api/v1/integrations/connect/:provider
// Initialize OAuth authorization redirect
router.post('/connect/:provider', authenticate, async (req: Request, res: Response) => {
  const { provider } = req.params;

  if (!isValidProvider(provider)) {
    return res.status(400).json({
      error: `Invalid provider. Supported: ${VALID_PROVIDERS.join(', ')}`,
    });
  }

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id') {
    return res.status(500).json({
      error: 'Google integrations are not configured on the server (missing GOOGLE_CLIENT_ID).',
    });
  }

  const scopes = PROVIDER_SCOPES[provider];
  const state = createSignedState({ provider, userId: req.user!.userId, exp: Date.now() + 10 * 60 * 1000 });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  return res.json({
    status: 'success',
    auth_url: authUrl.toString(),
    provider,
    scopes,
  });
});

// GET /api/v1/integrations/callback
// OAuth callback handler. This completes the full Google token exchange and
// stores the encrypted refresh token instead of marking the connection as
// connected without a real credential.
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_description } = req.query;
  const frontendUrl = normalizeFrontendUrl(process.env.FRONTEND_URL || 'http://localhost:5173');

  if (error) {
    return res.redirect(buildFrontendRedirect(frontendUrl, {
      error: String(error),
      ...(error_description ? { detail: String(error_description) } : {}),
    }));
  }

  if (!code || !state) {
    return res.redirect(buildFrontendRedirect(frontendUrl, {
      error: 'missing_oauth_params',
    }));
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.redirect(buildFrontendRedirect(frontendUrl, {
      error: 'google_oauth_not_configured',
    }));
  }

  try {
    const verifiedState = verifySignedState(String(state));
    if (!verifiedState) {
      return res.redirect(buildFrontendRedirect(frontendUrl, {
        error: 'invalid_oauth_state',
      }));
    }

    const { provider, userId } = verifiedState;
    if (!isValidProvider(provider)) {
      return res.redirect(buildFrontendRedirect(frontendUrl, {
        error: 'invalid_provider',
      }));
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json() as {
      refresh_token?: string;
      access_token?: string;
      expires_in?: number;
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || tokenData.error) {
      return res.redirect(buildFrontendRedirect(frontendUrl, {
        error: tokenData.error || 'google_oauth_token_exchange_failed',
        detail: tokenData.error_description || 'Unknown OAuth error',
      }));
    }

    const existingIntegration = await store.getIntegration(userId, provider);
    const previousEncryptedToken = existingIntegration?.encrypted_token;
    let previousToken: { refresh_token?: string } = {};
    if (previousEncryptedToken) {
      try {
        const parsed = JSON.parse(decrypt(previousEncryptedToken)) as { refresh_token?: string };
        previousToken = parsed;
      } catch {
        previousToken = { refresh_token: decrypt(previousEncryptedToken) };
      }
    }

    const refreshToken = tokenData.refresh_token || previousToken.refresh_token;
    if (!refreshToken && !tokenData.access_token) {
      return res.redirect(buildFrontendRedirect(frontendUrl, {
        error: 'missing_oauth_token',
      }));
    }

    const decodedIdToken = tokenData.id_token ? (jwt.decode(tokenData.id_token) as { email?: string } | null) : null;

    const encryptedToken = encrypt(JSON.stringify({
      refresh_token: refreshToken,
      access_token: tokenData.access_token,
      expires_at: tokenData.expires_in ? Date.now() + Number(tokenData.expires_in) * 1000 : undefined,
    }));
    const connectedAt = new Date();

    await store.updateIntegration(userId, provider, {
      connected: true,
      email: decodedIdToken?.email ?? null,
      connected_at: connectedAt,
      encrypted_token: encryptedToken,
    });

    return res.redirect(buildFrontendRedirect(frontendUrl, {
      connected: provider,
    }));
  } catch (error) {
    console.error('[integrations/callback] OAuth callback failure:', error);
    return res.redirect(buildFrontendRedirect(frontendUrl, {
      error: 'invalid_oauth_state',
    }));
  }
});

// DELETE /api/v1/integrations/disconnect/:provider
router.delete('/disconnect/:provider', authenticate, async (req: Request, res: Response) => {
  const { provider } = req.params;
  const userId = req.user!.userId;

  if (!isValidProvider(provider)) {
    return res.status(400).json({
      error: `Invalid provider. Supported: ${VALID_PROVIDERS.join(', ')}`,
    });
  }

  await store.updateIntegration(userId, provider, {
    connected: false,
    email: null,
    connected_at: null,
    encrypted_token: null,
  });

  res.json({
    status: 'success',
    message: `${provider} disconnected successfully`,
  });
});

export default router;
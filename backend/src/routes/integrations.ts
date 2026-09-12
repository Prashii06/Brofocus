// BroFocus - Integrations Routes (/api/v1/integrations)
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth';
import { decrypt, encrypt } from '../lib/crypto';
import { store, IntegrationProvider } from '../store/inMemory';

const router = Router();
router.use(authenticate);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/v1/integrations/callback';

const PROVIDER_SCOPES: Record<IntegrationProvider, string[]> = {
  gmail: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
  google_calendar: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
  google_drive: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
  google_meet: ['https://www.googleapis.com/auth/meetings.space.created'],
};

const VALID_PROVIDERS = Object.keys(PROVIDER_SCOPES) as IntegrationProvider[];

function isValidProvider(value: string): value is IntegrationProvider {
  return (VALID_PROVIDERS as string[]).includes(value);
}

// GET /api/v1/integrations/status
router.get('/status', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const integrations = await store.getIntegrations(userId);

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
router.post('/connect/:provider', async (req: Request, res: Response) => {
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
  const state = Buffer.from(JSON.stringify({ provider, userId: req.user!.userId })).toString('base64');

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
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(String(error))}`);
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing OAuth callback parameters' });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google OAuth is not configured on the server.' });
  }

  try {
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const { provider, userId } = stateData as { provider: string; userId: string };

    if (!isValidProvider(provider)) {
      return res.status(400).json({ error: 'Invalid provider in OAuth state' });
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
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || tokenData.error) {
      return res.status(400).json({
        error: 'Google OAuth token exchange failed',
        details: tokenData.error_description || tokenData.error || 'Unknown OAuth error',
      });
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
      return res.status(400).json({ error: 'Google OAuth response did not include any token to persist.' });
    }

    const decodedIdToken = tokenData.id_token ? (jwt.decode(tokenData.id_token) as { email?: string } | null) : null;

    await store.updateIntegration(userId, provider, {
      connected: true,
      email: decodedIdToken?.email ?? null,
      connected_at: new Date(),
      encrypted_token: encrypt(JSON.stringify({
        refresh_token: refreshToken,
        access_token: tokenData.access_token,
        expires_at: tokenData.expires_in ? Date.now() + Number(tokenData.expires_in) * 1000 : undefined,
      })),
    });

    return res.redirect(`${frontendUrl}/integrations?connected=${provider}`);
  } catch (error) {
    console.error('[integrations/callback] OAuth callback failure:', error);
    return res.status(400).json({ error: 'Invalid OAuth state or callback payload' });
  }
});

// DELETE /api/v1/integrations/disconnect/:provider
router.delete('/disconnect/:provider', async (req: Request, res: Response) => {
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
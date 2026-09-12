// BroFocus - Auth Routes
import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { generateAccessToken, generateRefreshToken, authenticate } from '../middleware/auth';
import { store } from '../store/inMemory';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // 'none' is required once frontend and backend are on different domains in
  // production (must be paired with secure: true, which is already the case).
  sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function issueSession(res: Response, userId: string, email: string) {
  const accessToken = generateAccessToken(userId, email);
  const refreshToken = generateRefreshToken(userId);
  await store.createRefreshToken(userId, refreshToken);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
  return accessToken;
}

// POST /api/v1/auth/google
// Body: { credential: string }  <- the Google ID token from Google Identity Services
router.post('/google', authLimiter, async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google sign-in is not configured on the server' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({ error: 'Google email is not verified' });
    }

    const user = await store.findOrCreateGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
    });

    if (!user.whitelisted) {
      // Don't issue tokens for an unapproved account - just tell them plainly.
      return res.status(403).json({
        error: 'Your account is pending approval. You will get access once it is whitelisted.',
      });
    }

    const accessToken = await issueSession(res, user.id, user.email);

    return res.json({
      status: 'success',
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        level: user.level,
        productivity_points: user.productivity_points,
      },
    });
  } catch (err) {
    const error = err as Error;
    console.error('[auth/google] verification failed:', error.message);
    return res.status(401).json({
      error: 'Google authentication failed',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
});

// POST /api/v1/auth/refresh
// Reads the HTTPOnly refresh cookie, resolves the real user it belongs to,
// rotates the refresh token, and issues a fresh access token.
router.post('/refresh', async (req: Request, res: Response) => {
  const rawToken = req.cookies?.refresh_token;
  if (!rawToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  const record = await store.getValidRefreshToken(rawToken);
  if (!record) {
    res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  // Rotate: revoke the used token and issue a new one, so a stolen refresh
  // cookie can only be replayed once before detection.
  await store.revokeRefreshToken(rawToken);
  const accessToken = await issueSession(res, record.user.id, record.user.email);

  return res.json({ status: 'success', access_token: accessToken });
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const rawToken = req.cookies?.refresh_token;
  if (rawToken) {
    await store.revokeRefreshToken(rawToken);
  }
  res.clearCookie('refresh_token', REFRESH_COOKIE_OPTIONS);
  return res.json({ status: 'success' });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await store.getUser(req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({
    status: 'success',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      level: user.level,
      productivity_points: user.productivity_points,
    },
  });
});

export default router;
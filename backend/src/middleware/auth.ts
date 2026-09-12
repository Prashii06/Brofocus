// BroFocus Backend - Auth Middleware
// Dual-token JWT architecture with HTTPOnly cookie support.
// NOTE: the old "no token -> auto-login as demo user" fallback has been
// removed. With real per-user accounts, that fallback would let every
// unauthenticated request act as one specific account. No token or an
// invalid token now always results in 401.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../store/inMemory';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? '';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? '';

if (!ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET is not set');
}

if (!REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET is not set');
}

export interface AuthPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Standard JWT verification middleware
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Also accept an HTTPOnly access-token cookie if you choose to set one.
  const cookieToken = req.cookies?.access_token;

  const finalToken = token || cookieToken;

  if (!finalToken) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(finalToken, ACCESS_SECRET) as jwt.JwtPayload & Partial<AuthPayload>;

    if (!decoded.userId || !decoded.email) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const user = await store.getUser(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    if (!user.whitelisted) {
      res.status(403).json({ error: 'Access denied: user not whitelisted' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Generate access token
export function generateAccessToken(userId: string, email: string): string {
  const options: jwt.SignOptions = { expiresIn: '15m' };
  return jwt.sign({ userId, email }, ACCESS_SECRET, options);
}

// Generate refresh token (raw JWT - only its hash is persisted, by the caller,
// via store.createRefreshToken)
export function generateRefreshToken(userId: string): string {
  const options: jwt.SignOptions = { expiresIn: '7d' };
  return jwt.sign({ userId }, REFRESH_SECRET, options);
}
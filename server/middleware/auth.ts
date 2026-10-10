import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'ecocivic-super-secure-production-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Prefer explicit Authorization Bearer header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Fall back to cookie if no Authorization header
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Auth Debug] Authentication failed: No token present in cookie or Authorization header for ${req.method} ${req.originalUrl}`);
      }
      res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
      return;
    }

    let decoded: { id: string; role: string; email?: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; email?: string };
    } catch (jwtErr: any) {
      // If header token verification failed and cookie is available as alternate, try cookie
      if (req.cookies?.token && req.cookies.token !== token) {
        try {
          decoded = jwt.verify(req.cookies.token, JWT_SECRET) as { id: string; role: string; email?: string };
          token = req.cookies.token;
        } catch {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[Auth Debug] Authentication failed: Token verification failed (${jwtErr.message}) for ${req.method} ${req.originalUrl}`);
          }
          res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
          return;
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Auth Debug] Authentication failed: Token verification failed (${jwtErr.message}) for ${req.method} ${req.originalUrl}`);
        }
        res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
        return;
      }
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Auth Debug] Authentication failed: User ID ${decoded.id} not found in database for ${req.method} ${req.originalUrl}`);
      }
      res.status(401).json({ success: false, message: 'User account no longer exists.' });
      return;
    }

    if (user.accountStatus !== 'active') {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Auth Debug] Authentication failed: User ${user.email} status is ${user.accountStatus}`);
      }
      res.status(403).json({ success: false, message: 'Your account is pending verification or suspended.' });
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth Debug] Authenticated: ${user.name} (${user.role}) for ${req.method} ${req.originalUrl}`);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth Debug] Authentication error for ${req.method} ${req.originalUrl}:`, err.message);
    }
    res.status(401).json({ success: false, message: 'Invalid or expired session. Please sign in again.' });
  }
}

export function requireRole(allowedRoles: Array<'citizen' | 'worker' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: This resource requires one of [${allowedRoles.join(', ')}] role privileges.`,
      });
      return;
    }

    next();
  };
}

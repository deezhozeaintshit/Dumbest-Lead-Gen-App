import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'b2b-lead-pipeline-jwt-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(user: { id: string; email: string; role: string; name?: string | null }): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Express middleware to enforce valid JWT authentication
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User session invalid or user has been removed.' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Seeds default admin user if no users exist in database
 */
export async function ensureDefaultAdminUser(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const defaultEmail = 'admin@pipeline.io';
      const defaultPassword = 'password123';
      const hashedPassword = await hashPassword(defaultPassword);

      await prisma.user.create({
        data: {
          email: defaultEmail,
          password: hashedPassword,
          name: 'Lead Admin',
          role: 'ADMIN',
        },
      });
      console.log(`[Auth] Initialized default admin account: ${defaultEmail} / ${defaultPassword}`);
    }
  } catch (err) {
    console.error('[Auth] Failed to seed default user:', err);
  }
}

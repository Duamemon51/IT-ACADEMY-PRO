import jwt from 'jsonwebtoken';
import { AdminAuthPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export function signToken(payload: AdminAuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminAuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminAuthPayload;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}
// lib/helpers.ts
import { v4 as uuidv4 } from 'uuid';

// Generate Employee ID: EMP-2024-0001 format
export function generateEmployeeId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${year}-${random}`;
}

// Generate random password: 8 chars alphanumeric
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate unique QR token
export function generateQRToken(): string {
  return uuidv4();
}

// Format CNIC: 12345-1234567-1
export function formatCNIC(cnic: string): string {
  const digits = cnic.replace(/\D/g, '');
  if (digits.length === 13) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }
  return cnic;
}

// Validate CNIC (13 digits)
export function validateCNIC(cnic: string): boolean {
  const digits = cnic.replace(/\D/g, '');
  return digits.length === 13;
}

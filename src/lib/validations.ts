import { MAX_UPLOAD_BYTES, IMAGE_MIME_TYPES, DOC_MIME_TYPES } from '@/lib/constants';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function asPositiveInt(value: unknown, fallback?: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    if (fallback !== undefined) return fallback;
    throw new HttpError(400, 'Nilai harus bilangan bulat positif.');
  }
  return parsed;
}

export function asNonNegativeNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, 'Nilai harus angka >= 0.');
  }
  return parsed;
}

export function requireFields(body: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
      throw new HttpError(400, `Field ${field} wajib diisi.`);
    }
  }
}

export function assertUuid(value: string, label = 'id') {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, `${label} tidak valid.`);
  }
}

export function validateUploadFile(file: { size: number; type: string }, kind: 'image' | 'doc' = 'image') {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(400, 'Ukuran file maksimal 5MB.');
  }
  const allowed = kind === 'image' ? IMAGE_MIME_TYPES : DOC_MIME_TYPES;
  if (!(allowed as readonly string[]).includes(file.type)) {
    throw new HttpError(400, `Tipe file tidak diizinkan: ${file.type}`);
  }
}

export function isAllowedImageFile(file: File) {
  return file.size <= MAX_UPLOAD_BYTES && (IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
}

export function isAllowedDocFile(file: File) {
  return file.size <= MAX_UPLOAD_BYTES && (DOC_MIME_TYPES as readonly string[]).includes(file.type);
}

import { NextResponse } from 'next/server';
import { authErrorMessage, isNetworkAuthError } from '@/lib/auth-errors';
import { HttpError } from '@/lib/validations';

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return jsonError(error.message, error.status);
  }
  const raw = error instanceof Error ? error.message : 'Terjadi kesalahan server.';
  const message = isNetworkAuthError(error) ? authErrorMessage(error) : raw;
  console.error('[api]', error);
  return jsonError(message, 500);
}

export async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'Body JSON tidak valid.');
  }
}

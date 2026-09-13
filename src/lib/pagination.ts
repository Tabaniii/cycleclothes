export type CursorPayload = {
  createdAt: string;
  id: string;
};

export function encodeCursor(createdAt: string, id: string) {
  return Buffer.from(JSON.stringify({ createdAt, id } satisfies CursorPayload)).toString(
    'base64url',
  );
}

export function decodeCursor(cursor: string | null | undefined): CursorPayload | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload;
    if (!parsed?.createdAt || !parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function nextCursorFromRows<T extends { created_at: string; id: string }>(
  rows: T[],
  limit: number,
) {
  if (rows.length <= limit) {
    return { data: rows, nextCursor: null as string | null, hasMore: false };
  }
  const data = rows.slice(0, limit);
  const last = data[data.length - 1];
  return {
    data,
    nextCursor: encodeCursor(last.created_at, last.id),
    hasMore: true,
  };
}

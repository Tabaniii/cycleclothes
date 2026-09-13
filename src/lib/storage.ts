import { isAllowedDocFile, isAllowedImageFile } from '@/lib/validations';

function fileExt(file: File) {
  return file.name.split('.').pop()?.toLowerCase() || 'bin';
}

export async function uploadPrivateFile(
  bucket: 'donation-proofs' | 'foundation-docs' | 'product-images',
  userId: string,
  file: File,
  prefix: string,
) {
  if (bucket === 'foundation-docs' ? !isAllowedDocFile(file) : !isAllowedImageFile(file)) {
    throw new Error('File tidak valid. Maks 5MB, tipe gambar/PDF sesuai bucket.');
  }

  const { supabase } = await import('@/lib/supabase');
  const path = `${userId}/${prefix}-${Date.now()}.${fileExt(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export function productImageUrl(path: string | null | undefined, width = 800) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/product-images/${path}?width=${width}&resize=cover`;
}

export async function signedUrl(bucket: 'donation-proofs' | 'foundation-docs', path: string) {
  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}

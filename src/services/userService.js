import { supabase } from '@/lib/supabase';

export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session) return null;

  return {
    user: session.user,
    session,
  };
}

export async function getUserProfile(userId) {
  if (!userId) throw new Error('userId is required');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId, updateData) {
  if (!userId) throw new Error('userId is required');
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new Error('updateData cannot be empty');
  }

  const allowedFields = ['full_name', 'avatar_url', 'phone_number'];
  const filteredData = {};

  for (const key of allowedFields) {
    if (key in updateData) {
      filteredData[key] = updateData[key];
    }
  }

  if (Object.keys(filteredData).length === 0) {
    throw new Error('No valid fields to update. Allowed fields: ' + allowedFields.join(', '));
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(filteredData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createProfileIfMissing(userId, profileData = {}) {
  if (!userId) throw new Error('userId is required');

  const { data: existing, error: checkErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (checkErr) throw checkErr;
  if (existing) return existing;

  const allowedFields = ['full_name', 'avatar_url', 'phone_number'];
  const insertData = { id: userId };

  for (const key of allowedFields) {
    if (key in profileData && profileData[key] != null) {
      insertData[key] = profileData[key];
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function getAvatarPublicUrl(path) {
  if (!path) return null;
  try {
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}

export async function uploadUserAvatar(userId, file) {
  if (!userId) throw new Error('userId is required');
  if (!file) throw new Error('File gambar tidak ada');

  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file maksimal 2MB');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG/PNG/WebP)');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
  const timestamp = Date.now();
  const fileName = `${userId}/avatar-${timestamp}.${fileExt}`;

  const { data: existingObjects, error: listErr } = await supabase
    .storage
    .from('avatars')
    .list(userId, { limit: 100 });

  if (!listErr && Array.isArray(existingObjects)) {
    for (const old of existingObjects) {
      if (old.name.startsWith('avatar-')) {
        await supabase.storage.from('avatars').remove([`${userId}/${old.name}`]);
      }
    }
  }

  const { data, error } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const avatarPath = data?.path || fileName;

  await updateUserProfile(userId, { avatar_url: avatarPath });

  return {
    path: avatarPath,
    url: getAvatarPublicUrl(avatarPath),
  };
}

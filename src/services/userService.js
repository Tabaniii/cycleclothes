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

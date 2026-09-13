import { getRequestUser, requireRole } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError } from '@/lib/validations';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { user, profile } = await getRequestUser(request);
    requireRole(profile, ['admin']);
    const body = await readJsonBody(request);
    const admin = createAdminClient();

    const patch: Record<string, unknown> = {
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };
    const status = asString(body.verification_status);
    if (status === 'approved' || status === 'rejected' || status === 'pending') {
      patch.verification_status = status;
    }
    if (typeof body.review_note === 'string') patch.review_note = asString(body.review_note);
    if (typeof body.is_suspended === 'boolean') patch.is_suspended = body.is_suspended;
    if (typeof body.suspension_reason === 'string') patch.suspension_reason = asString(body.suspension_reason);

    const { data, error } = await admin
      .from('foundation_profiles')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);

    if (status === 'approved') {
      await admin.from('profiles').update({ role: 'foundation' }).eq('id', id);
    }

    if (body.is_suspended === true) {
      await admin
        .from('donation_wishlists')
        .update({ status: 'closed' })
        .eq('foundation_id', id)
        .eq('status', 'open');
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'foundation.reviewed',
      entity_type: 'foundation_profiles',
      entity_id: id,
      metadata: patch,
    });

    return jsonOk({ foundation: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

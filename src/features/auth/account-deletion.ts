/**
 * Account deletion policy for SuperJogger MVP:
 * - Only the authenticated user can request their own deletion.
 * - Deletion is performed server-side with the service role.
 * - Removing auth.users cascades to profiles and all dependent user rows.
 * - Auth cookies are cleared after successful deletion.
 * - This is irreversible; no soft-delete retention in MVP.
 */
export const ACCOUNT_DELETION_POLICY = {
  irreversible: true,
  cascadeViaAuthUserDelete: true,
  requiresServiceRole: true,
} as const;

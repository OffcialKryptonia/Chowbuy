/**
 * Supabase hides whether an email is already registered: signing up with a confirmed address returns a fake user with an empty
 * `identities` list, sends no email, and reports success. That looks like "check your email" while nothing is coming.
 * An empty identities array is the tell.
 */
export const alreadyRegistered = (user: { identities?: unknown[] | null } | null | undefined): boolean =>
  !!user && Array.isArray(user.identities) && user.identities.length === 0;

export const ACCOUNT_EXISTS = 'An account with this email already exists. Sign in instead, or tap Forgot password.';

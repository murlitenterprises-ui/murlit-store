import { createServerFn } from "@tanstack/react-start";
import { getSessionUser } from "@/server/auth-helpers";

export const getCurrentUser = createServerFn().handler(async () => {
  return getSessionUser();
});

// Returns true if Google OAuth is configured — never returns the key values.
export const isGoogleEnabled = createServerFn().handler(async () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
});

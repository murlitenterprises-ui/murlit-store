import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

const isDev = process.env.NODE_ENV !== "production";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      const { sendPasswordResetEmail } = await import("./email-helper");
      await sendPasswordResetEmail(user.email, url);
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  user: {
    additionalFields: {
      role: { type: "string", default: "customer", input: false },
      phone: { type: "string", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh token once per day (prevents rotation during SSR)
  },
  rateLimit: { enabled: true },
  advanced: {
    cookiePrefix: "murlit",
    secureCookies: !isDev,
  },
  // In dev: dynamically trust any localhost/127.0.0.1 origin regardless of port.
  // In production: strictly trust only BETTER_AUTH_URL.
  trustedOrigins: isDev
    ? (request: Request | undefined) => {
        const fallback = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
        if (!request) return [fallback];
        const origin = request.headers.get("origin") ?? "";
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return [origin];
        }
        return [fallback];
      }
    : [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, enquiries, newsletterSubscribers } from "@/server/db";
import { eq, count } from "drizzle-orm";
import { getRequest } from "@tanstack/react-start/server";

// Simple in-memory rate limit: max 3 enquiries per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; reset: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.reset < now) {
    rateLimitMap.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

function getClientIp(): string {
  try {
    const req = getRequest();
    return req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req?.headers.get("cf-connecting-ip")
      ?? "unknown";
  } catch {
    return "unknown";
  }
}

const baseSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10).max(15).optional().or(z.literal("")),
  message: z.string().min(1).max(2000),
  honeypot: z.string().max(0, "Bot detected").optional(), // must be empty
});

export const submitContactEnquiry = createServerFn()
  .validator(baseSchema)
  .handler(async ({ data }) => {
    if (data.honeypot) throw new Error("Bot detected");
    const ip = getClientIp();
    if (!checkRateLimit(ip)) throw new Error("Too many submissions — try again later");
    await db.insert(enquiries).values({
      type: "contact",
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message,
    });
    return { success: true };
  });

export const submitBulkEnquiry = createServerFn()
  .validator(baseSchema.extend({
    quantity: z.string().optional(),
    budget: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    if (data.honeypot) throw new Error("Bot detected");
    const ip = getClientIp();
    if (!checkRateLimit(ip)) throw new Error("Too many submissions — try again later");
    await db.insert(enquiries).values({
      type: "bulk",
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message,
      details: { quantity: data.quantity, budget: data.budget },
    });
    return { success: true };
  });

export const submitCustomEnquiry = createServerFn()
  .validator(baseSchema.extend({
    budget: z.string().optional(),
    occasion: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    if (data.honeypot) throw new Error("Bot detected");
    const ip = getClientIp();
    if (!checkRateLimit(ip)) throw new Error("Too many submissions — try again later");
    await db.insert(enquiries).values({
      type: "custom",
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message,
      details: { budget: data.budget, occasion: data.occasion },
    });
    return { success: true };
  });

export const subscribeNewsletter = createServerFn()
  .validator(z.object({
    email: z.string().email(),
    honeypot: z.string().max(0).optional(),
  }))
  .handler(async ({ data }) => {
    if (data.honeypot) throw new Error("Bot detected");
    // Check duplicate
    const existing = await db
      .select({ n: count() })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, data.email.toLowerCase()));
    if (Number(existing[0].n) > 0) {
      return { success: true, alreadySubscribed: true };
    }
    await db.insert(newsletterSubscribers).values({
      email: data.email.toLowerCase(),
    });
    return { success: true, alreadySubscribed: false };
  });

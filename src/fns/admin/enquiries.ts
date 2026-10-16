import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth-helpers";
import { db, enquiries } from "@/server/db";
import { eq, and, desc, count } from "drizzle-orm";

const PAGE_SIZE = 20;

export const listEnquiries = createServerFn()
  .validator(z.object({
    type: z.string().optional(),
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const conditions: any[] = [];
    if (data.type) conditions.push(eq(enquiries.type, data.type as any));
    if (data.status) conditions.push(eq(enquiries.status, data.status as any));
    const where = conditions.length ? and(...conditions) : undefined;

    const [{ n: total }] = await db.select({ n: count() }).from(enquiries).where(where);
    const offset = (data.page - 1) * PAGE_SIZE;
    const rows = await db
      .select()
      .from(enquiries)
      .where(where)
      .orderBy(desc(enquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    return { rows, total: Number(total), page: data.page, pageSize: PAGE_SIZE };
  });

export const updateEnquiryStatus = createServerFn()
  .validator(z.object({
    id: z.string().uuid(),
    status: z.enum(["new", "in_progress", "closed"]),
  }))
  .handler(async ({ data }) => {
    await requireAdmin();
    await db.update(enquiries).set({ status: data.status, updatedAt: new Date() }).where(eq(enquiries.id, data.id));
    return { success: true };
  });

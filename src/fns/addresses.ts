import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/server/db";
import { addresses } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "@/server/auth-helpers";

const addressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  stateCode: z.string().min(2),
  pincode: z.string().length(6),
  isDefault: z.boolean().optional(),
});

export const listAddresses = createServerFn().handler(async () => {
  const user = await requireUser();
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(addresses.createdAt);
});

export const createAddress = createServerFn()
  .validator(addressSchema)
  .handler(async ({ data }) => {
    const user = await requireUser();
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, user.id));
    }
    const [created] = await db
      .insert(addresses)
      .values({
        userId: user.id,
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 ?? null,
        city: data.city,
        state: data.state,
        stateCode: data.stateCode,
        pincode: data.pincode,
        isDefault: data.isDefault ?? false,
      })
      .returning();
    return created;
  });

export const updateAddress = createServerFn()
  .validator(z.object({ id: z.string(), data: addressSchema }))
  .handler(async ({ data: { id, data: fields } }) => {
    const user = await requireUser();
    const existing = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .limit(1);
    if (!existing.length) throw new Response("Not found", { status: 404 });
    if (fields.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, user.id));
    }
    const [updated] = await db
      .update(addresses)
      .set({ ...fields, line2: fields.line2 ?? null, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning();
    return updated;
  });

export const deleteAddress = createServerFn()
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  });

export const setDefaultAddress = createServerFn()
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    await db
      .update(addresses)
      .set({ isDefault: false })
      .where(eq(addresses.userId, user.id));
    const [updated] = await db
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning();
    return updated;
  });

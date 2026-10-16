import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/server/auth-helpers";
import { db, storeSettings } from "@/server/db";
import { eq } from "drizzle-orm";

export const getStoreSettings = createServerFn().handler(async () => {
  await requireAdmin();
  const rows = await db.select().from(storeSettings).limit(1);
  return rows[0] ?? null;
});

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const settingsSchema = z.object({
  legalName: z.string().min(1),
  gstin: z.string().regex(GSTIN_RE, "Invalid GSTIN — must be 15 chars like 08AAAAA0000A1Z5").optional().or(z.literal("")),
  registeredAddress: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Must be 6 digits").optional().or(z.literal("")),
  phone: z.string().optional(),
  businessEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  state: z.string().min(1),
  stateCode: z.string().min(1),
  invoicePrefix: z.string().min(1).max(10),
  pricesIncludeGst: z.boolean(),
  codEnabled: z.boolean(),
  freeShippingAbove: z.number().int().min(0),
  shippingFee: z.number().int().min(0),
  whatsappNumber: z.string().optional(),
  supportEmail: z.string().optional(),
});

export const saveStoreSettings = createServerFn()
  .validator(settingsSchema)
  .handler(async ({ data }) => {
    await requireAdmin();

    // Validate GSTIN state code matches selected state (first 2 digits = GST state code)
    if (data.gstin && data.stateCode) {
      // Map 2-letter postal code to GSTIN numeric prefix
      const GSTIN_STATE_MAP: Record<string, string> = {
        JK:"01",HP:"02",PB:"03",CH:"04",UT:"05",HR:"06",DL:"07",RJ:"08",UP:"09",
        BR:"10",SK:"11",AR:"12",NL:"13",MN:"14",MZ:"15",TR:"16",ML:"17",AS:"18",
        WB:"19",JH:"20",OD:"21",CG:"22",MP:"23",GJ:"24",DD:"26",MH:"27",AP:"28",
        KA:"29",GA:"30",LD:"31",KL:"32",TN:"33",PY:"34",AN:"35",TG:"36",AP2:"37",
        LA:"38",
      };
      const expectedPrefix = GSTIN_STATE_MAP[data.stateCode];
      if (expectedPrefix && !data.gstin.startsWith(expectedPrefix)) {
        throw new Error(`GSTIN first 2 digits must be ${expectedPrefix} for ${data.state} (got ${data.gstin.slice(0,2)})`);
      }
    }

    const existing = await db.select({ id: storeSettings.id }).from(storeSettings).limit(1);
    const payload = {
      ...data,
      gstin: data.gstin || null,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      pincode: data.pincode || null,
      phone: data.phone || null,
      businessEmail: data.businessEmail || null,
      registeredAddress: data.registeredAddress || null,
      whatsappNumber: data.whatsappNumber || null,
      supportEmail: data.supportEmail || null,
      updatedAt: new Date(),
    };

    if (existing.length) {
      const [row] = await db
        .update(storeSettings)
        .set(payload)
        .where(eq(storeSettings.id, existing[0].id))
        .returning();
      return row;
    }
    const [row] = await db.insert(storeSettings).values(payload).returning();
    return row;
  });

// Check if required invoice fields are missing (for warning banner)
export const getSettingsCompleteness = createServerFn().handler(async () => {
  await requireAdmin();
  const [s] = await db.select().from(storeSettings).limit(1);
  if (!s) return { complete: false, missing: ["All settings"] };
  const missing: string[] = [];
  if (!s.legalName) missing.push("Legal Name");
  if (!s.gstin) missing.push("GSTIN");
  if (!s.addressLine1) missing.push("Address");
  if (!s.city) missing.push("City");
  if (!s.pincode) missing.push("Pincode");
  if (!s.phone) missing.push("Phone");
  if (!s.state) missing.push("Business State");
  return { complete: missing.length === 0, missing };
});

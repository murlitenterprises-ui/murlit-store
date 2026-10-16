import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import { requireAdmin } from "@/server/auth-helpers";

/** Returns a signed upload params object so the browser can POST directly to Cloudinary.
 *  The API secret never leaves the server. */
export const getCloudinarySignature = createServerFn()
  .validator(z.object({ folder: z.string().default("murlit-products") }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${data.folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHmac("sha1", apiSecret)
      .update(paramsToSign)
      .digest("hex");
    return { cloudName, apiKey, timestamp, folder: data.folder, signature };
  });

/** Delete an image from Cloudinary by publicId (admin only). */
export const deleteCloudinaryImage = createServerFn()
  .validator(z.object({ publicId: z.string() }))
  .handler(async ({ data }) => {
    await requireAdmin();
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `public_id=${data.publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHmac("sha1", apiSecret)
      .update(paramsToSign)
      .digest("hex");
    const body = new URLSearchParams({
      public_id: data.publicId,
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
    });
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      { method: "POST", body }
    );
    const json = await res.json() as { result: string };
    return { ok: json.result === "ok" };
  });

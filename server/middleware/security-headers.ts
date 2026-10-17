import { defineEventHandler, setResponseHeaders } from "h3";

// Apply security headers to every response.
// On Vercel these are also set in vercel.json; here they cover local Nitro dev.
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
});

import { createServerFn } from "@tanstack/react-start";
import { getSessionUser } from "@/server/auth-helpers";

export const getCurrentUser = createServerFn().handler(async () => {
  return getSessionUser();
});

// Server-only — never import this from client route components
import { auth } from "./auth";
import { getRequest } from "@tanstack/react-start/server";

export async function getSessionUser() {
  const req = getRequest();
  const session = await auth.api.getSession({ headers: req.headers });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function getOptionalUser() {
  return getSessionUser();
}

export async function requireAdmin() {
  const user = await requireUser();
  if ((user as any).role !== "admin") throw new Response("Forbidden", { status: 403 });
  return user;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { getCurrentUser } from "@/fns/auth";
import { useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (!user) throw redirect({ to: "/login", search: { redirect: "/admin" } });
    if ((user as any).role !== "admin") {
      // Redirect non-admins to home
      throw redirect({ to: "/" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="min-h-screen bg-sage">
      {/* Maroon banner */}
      <div style={{ background: "var(--maroon)", padding: "48px 0" }}>
        <div className="container-x text-center">
          <h1 className="font-display text-4xl text-on-dark">Admin Panel</h1>
          <p className="mt-3 text-base" style={{ color: "var(--gold)" }}>
            Phase 4 coming soon
          </p>
        </div>
      </div>

      <div className="container-x py-12 text-center">
        <div
          className="rounded-sm border p-8 bg-background inline-block"
          style={{ borderColor: "var(--gold)" }}
        >
          <p className="text-muted-foreground text-sm">
            The admin panel will include product management, category CRUD, order management,
            and more.
          </p>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authClient.resetPassword({ newPassword: data.newPassword, token });
      navigate({ to: "/login" });
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center bg-sage px-4 py-16">
      <div className="w-full max-w-md rounded-sm border bg-background p-8 shadow-lift">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl text-maroon">New Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a strong new password</p>
        </div>

        {error && (
          <div className="mb-4 rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} method="post" action="" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              {...register("newPassword")}
              className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none transition focus:border-maroon focus:bg-background"
              placeholder="Min 8 characters"
            />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none transition focus:border-maroon focus:bg-background"
              placeholder="Repeat password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!mounted || loading}
            className="w-full rounded-sm bg-royal py-2.5 text-sm font-semibold text-on-dark transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-maroon hover:text-terracotta">
            Back to Sign In
          </Link>
        </p>
      </div>
      </div>
      <Footer />
    </>
  );
}

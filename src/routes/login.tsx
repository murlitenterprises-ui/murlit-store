import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { signIn } from "@/lib/auth-client";
import { getCurrentUser } from "@/fns/auth";
import { redirect } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: async () => {
    const user = await getCurrentUser();
    if (user) throw redirect({ to: "/account" });
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch();
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
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.email({ email: data.email, password: data.password });
      if (result.error) {
        setError(result.error.message ?? "Sign in failed. Please try again.");
      } else {
        navigate({ to: redirectTo ?? "/account" });
      }
    } catch (e: any) {
      setError(e?.message ?? "An unexpected error occurred.");
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
          <h1 className="font-display text-3xl text-maroon">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your Murlit account</p>
        </div>

        {error && (
          <div className="mb-4 rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} method="post" action="" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none transition focus:border-maroon focus:bg-background"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none transition focus:border-maroon focus:bg-background"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("remember")} className="rounded-sm" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-maroon hover:text-terracotta">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={!mounted || loading}
            className="w-full rounded-sm bg-royal py-2.5 text-sm font-semibold text-on-dark transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-maroon hover:text-terracotta">
            Sign up
          </Link>
        </p>
      </div>
      </div>
      <Footer />
    </>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { signUp } from "@/lib/auth-client";
import { isGoogleEnabled } from "@/fns/auth";
import { attachReferral } from "@/fns/referral";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { GoogleSignInButton } from "@/components/site/GoogleSignInButton";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({
  loader: async () => ({ googleEnabled: await isGoogleEnabled() }),
  component: SignupPage,
});

function SignupPage() {
  const { googleEnabled } = Route.useLoaderData();
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
      const result = await signUp.email({ name: data.name, email: data.email, password: data.password });
      if (result.error) {
        setError(result.error.message ?? "Sign up failed. Please try again.");
      } else {
        // Attach referral from cookie if present
        try {
          const refMatch = document.cookie.match(/murlit_ref=([^;]+)/);
          const refCode = refMatch ? decodeURIComponent(refMatch[1]) : null;
          if (refCode) {
            await attachReferral({ data: { refCode } }).catch(() => {});
            document.cookie = "murlit_ref=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          }
        } catch {}
        navigate({ to: "/account" });
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
          <h1 className="font-display text-3xl text-maroon">Create Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join Murlit Enterprises</p>
        </div>

        {googleEnabled && (
          <>
            <GoogleSignInButton label="Sign up with Google" />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">or sign up with email</span>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="mb-4 rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} method="post" action="" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              {...register("name")}
              className="w-full rounded-sm border bg-sage px-3 py-2.5 text-sm outline-none transition focus:border-maroon focus:bg-background"
              placeholder="Your name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

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
              placeholder="Min 8 characters"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
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

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" {...register("terms")} className="mt-0.5 rounded-sm" />
            <span>
              I agree to the{" "}
              <a href="/terms" className="text-maroon underline">
                Terms &amp; Conditions
              </a>
            </span>
          </label>
          {errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}

          <button
            type="submit"
            disabled={!mounted || loading}
            className="w-full rounded-sm bg-royal py-2.5 text-sm font-semibold text-on-dark transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-maroon hover:text-terracotta">
            Sign in
          </Link>
        </p>
      </div>
      </div>
      <Footer />
    </>
  );
}

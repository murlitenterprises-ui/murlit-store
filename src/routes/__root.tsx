import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { RevealObserver } from "../components/site/RevealObserver";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Murlit Enterprises" },
      { name: "description", content: "Pooja samagri, wedding essentials, handcrafted and customised gifts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600;700&display=swap" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const viewTransitionCSS = `
/* Keep header and category strip static */
::view-transition-group(site-header), ::view-transition-group(category-strip) { animation: none; }
::view-transition-old(site-header), ::view-transition-old(category-strip) { display: none; }
::view-transition-new(site-header), ::view-transition-new(category-strip) { animation: none; }

/* Root: base reset */
::view-transition-group(root) { animation: none; }
::view-transition-image-pair(root) { isolation: auto; }
::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; opacity: 1; }

/* ── FORWARD (default): old page turns away left, new page comes up underneath ── */
::view-transition-old(root) {
  z-index: 2;
  transform-origin: left center;
  backface-visibility: hidden;
  animation: murlit-page-turn 1.3s cubic-bezier(0.645, 0.045, 0.355, 1) both;
}
::view-transition-new(root) {
  z-index: 1;
  animation: murlit-page-under 1.3s ease-out both;
}

/* ── BACK via :active-view-transition-type (modern browsers) ── */
html:active-view-transition-type(back)::view-transition-old(root) {
  z-index: 1;
  transform-origin: left center;
  animation: murlit-page-under-out 1.3s ease-in both;
}
html:active-view-transition-type(back)::view-transition-new(root) {
  z-index: 2;
  transform-origin: left center;
  backface-visibility: hidden;
  animation: murlit-page-turn-in 1.3s cubic-bezier(0.645, 0.045, 0.355, 1) both;
}

/* ── BACK via data attribute (fallback) — separate rule block so unknown :active-view-transition-type doesn't break this ── */
html[data-nav-direction="back"] ::view-transition-old(root) {
  z-index: 1;
  transform-origin: left center;
  animation: murlit-page-under-out 1.3s ease-in both;
}
html[data-nav-direction="back"] ::view-transition-new(root) {
  z-index: 2;
  transform-origin: left center;
  backface-visibility: hidden;
  animation: murlit-page-turn-in 1.3s cubic-bezier(0.645, 0.045, 0.355, 1) both;
}

/* ── Keyframes ── */
@keyframes murlit-page-turn {
  0%   { transform: perspective(2200px) rotateY(0deg);    filter: brightness(1);    box-shadow: 0 0 0 rgba(0,0,0,0); }
  35%  { transform: perspective(2200px) rotateY(-25deg);  filter: brightness(0.95); box-shadow: -25px 0 50px rgba(60,20,10,0.35); }
  100% { transform: perspective(2200px) rotateY(-100deg); filter: brightness(0.55); box-shadow: -60px 0 90px rgba(60,20,10,0.5); }
}
@keyframes murlit-page-turn-in {
  0%   { transform: perspective(2200px) rotateY(-100deg); filter: brightness(0.55); box-shadow: -60px 0 90px rgba(60,20,10,0.5); }
  65%  { transform: perspective(2200px) rotateY(-25deg);  filter: brightness(0.95); }
  100% { transform: perspective(2200px) rotateY(0deg);    filter: brightness(1);    box-shadow: 0 0 0 rgba(0,0,0,0); }
}
@keyframes murlit-page-under {
  0%   { filter: brightness(0.6); transform: scale(0.97); }
  100% { filter: brightness(1);   transform: scale(1); }
}
@keyframes murlit-page-under-out {
  0%   { filter: brightness(1);   transform: scale(1); }
  100% { filter: brightness(0.6); transform: scale(0.97); }
}

@media (max-width: 767px) {
  ::view-transition-old(root) { animation-duration: 0.7s; }
  ::view-transition-new(root) { animation-duration: 0.7s; }
  html:active-view-transition-type(back)::view-transition-old(root) { animation-duration: 0.7s; }
  html:active-view-transition-type(back)::view-transition-new(root) { animation-duration: 0.7s; }
  html[data-nav-direction="back"] ::view-transition-old(root) { animation-duration: 0.7s; }
  html[data-nav-direction="back"] ::view-transition-new(root) { animation-duration: 0.7s; }
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
  html:active-view-transition-type(back)::view-transition-old(root) { animation: none; }
  html:active-view-transition-type(back)::view-transition-new(root) { animation: none; }
  html[data-nav-direction="back"] ::view-transition-old(root) { animation: none; }
  html[data-nav-direction="back"] ::view-transition-new(root) { animation: none; }
}
`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* View transition keyframes injected raw — bypasses Lightning CSS parser */}
        <style dangerouslySetInnerHTML={{ __html: viewTransitionCSS }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="bottom-right" />
      <RevealObserver />
    </QueryClientProvider>
  );
}

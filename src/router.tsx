import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }: { fromLocation: any; toLocation: any }) => {
        const fromIndex: number = fromLocation?.state?.__TSR_index ?? 0;
        const toIndex: number = toLocation?.state?.__TSR_index ?? 0;
        const fromPath = fromLocation?.pathname ?? "/";
        const toPath = toLocation?.pathname ?? "/";

        // Page-flip ONLY when leaving home "/" (never on back, never between other pages)
        const leavingHome = fromPath === "/" && toPath !== "/";
        if (!leavingHome) {
          // Clear any stale data attribute and return no transition
          if (typeof document !== "undefined") {
            delete document.documentElement.dataset.navDirection;
          }
          return [];
        }

        const goingHome = toPath === "/" && fromPath !== "/";
        const isBack = (toIndex < fromIndex) || goingHome;

        if (typeof document !== "undefined") {
          if (isBack) {
            document.documentElement.dataset.navDirection = "back";
          } else {
            delete document.documentElement.dataset.navDirection;
          }
        }

        return [isBack ? "back" : "forward"];
      },
    },
  });

  return router;
};

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
        const fromPath = fromLocation?.pathname ?? "/";
        const toPath = toLocation?.pathname ?? "/";

        // Page-flip ONLY when leaving home → any other page
        const leavingHome = fromPath === "/" && toPath !== "/";
        if (typeof document !== "undefined") {
          if (leavingHome) {
            document.documentElement.dataset.navDirection = "forward";
          } else {
            delete document.documentElement.dataset.navDirection;
          }
        }
        return leavingHome ? ["forward"] : [];
      },
    },
  });

  return router;
};

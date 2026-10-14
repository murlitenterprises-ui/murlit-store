import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }: { fromLocation: any; toLocation: any }) => {
        const fromIndex: number = fromLocation?.state?.__TSR_index ?? 0;
        const toIndex: number = toLocation?.state?.__TSR_index ?? 0;
        // Going to "/" from a deeper page also feels like going back
        const goingHome =
          toLocation.pathname === "/" && (fromLocation?.pathname ?? "/") !== "/";
        const isBack = toIndex < fromIndex || goingHome;

        // Set data attribute as fallback for browsers that don't support :active-view-transition-type
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

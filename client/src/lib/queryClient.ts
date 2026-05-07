import { QueryClient } from "@tanstack/react-query";

/**
 * The app no longer has a backend — all data fetching goes through
 * `clinical-trials-client.ts` which calls ClinicalTrials.gov v2 directly.
 * Each `useQuery` MUST provide its own `queryFn`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function useProperty() {
  // Simple synchronous fetch via React Query would need a hook;
  // we expose queryClient so callers can useQuery directly.
  return queryClient;
}

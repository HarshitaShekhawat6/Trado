import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,       // 5 min — baar baar API call nahi hogi
      cacheTime: 1000 * 60 * 10,      // 10 min — data cache mein rahega
      refetchOnWindowFocus: false,     // screen focus pe unnecessary call nahi
    },
    mutations: {
      retry: 0,                        // mutation ek baar hi try karo
    },
  },
});

export default queryClient;
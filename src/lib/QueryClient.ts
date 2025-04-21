/**
 * Centralized React Query client configuration
 * This ensures consistent data-fetching behavior across the app
 */
import { QueryClient } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      
      // Cache data for 1 hour
      gcTime: 1000 * 60 * 60,
      
      // Retry failed queries 2 times
      retry: 2,
      
      // Keep previous data when refetching
      keepPreviousData: true,
      
      // Refetch on window focus
      refetchOnWindowFocus: true,
      
      // Auto refetch on reconnect
      refetchOnReconnect: true,
      
      // Auto refetch when component mounts
      refetchOnMount: true,
    },
  },
});

export default queryClient;

"use client";
import { useQuery } from "@tanstack/react-query";
import { getMyProperty } from "./api";

export const propertiesKeys = { mine: ["properties", "mine"] as const };

export function useProperty() {
  const q = useQuery({
    queryKey: propertiesKeys.mine,
    queryFn: getMyProperty,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });
  return {
    property: q.data?.property ?? null,
    role: q.data?.role ?? null,
    isLoading: q.isLoading,
    isError: q.isError,
    error: q.error,
    refetch: q.refetch,
  };
}

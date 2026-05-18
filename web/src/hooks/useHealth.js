/*
 * Role: Data hook for backend liveness.
 * Author: Dennies Bor
 * Description:
 *   Wraps the health request in a TanStack Query that refetches every thirty
 *   seconds. Used to show a small status indicator confirming the dashboard
 *   is connected to a responsive backend.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchHealth } from "../lib/api";

const THIRTY_SECONDS = 30 * 1000;

export function useHealth() {
    return useQuery({
        queryKey: ["health"],
        queryFn: fetchHealth,
        refetchInterval: THIRTY_SECONDS,
        refetchIntervalInBackground: false,
        retry: false,
    });
}
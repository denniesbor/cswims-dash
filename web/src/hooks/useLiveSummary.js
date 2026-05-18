/*
 * Role: Data hook for the current space weather summary.
 * Author: Dennies Bor
 * Description:
 *   Wraps the live summary request in a TanStack Query that refetches every
 *   sixty seconds. The summary holds the most recent solar wind, geomagnetic,
 *   and GOES proton flux samples. The sixty-second interval matches the
 *   backend ingestion cadence, so the dashboard never shows data much more
 *   than a minute old. Used by the Live route header strip.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchLiveSummary } from "../lib/api";

const ONE_MINUTE = 60 * 1000;

export function useLiveSummary() {
    return useQuery({
        queryKey: ["live-summary"],
        queryFn: fetchLiveSummary,
        refetchInterval: ONE_MINUTE,
        refetchIntervalInBackground: false,
    });
}
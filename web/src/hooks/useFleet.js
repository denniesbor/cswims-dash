/*
 * Role: Data hook for the satellite fleet shown on the globe.
 * Author: Dennies Bor
 * Description:
 *   Wraps the fleet request in a TanStack Query. The fleet is fetched once
 *   when the Live route mounts. The globe then animates locally from the
 *   trajectory samples, so there is no per-second polling. The query does
 *   refetch on a long interval, before the forward trajectory buffer drains,
 *   so a long-lived session keeps a valid window of motion.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchFleet } from "../lib/api";

const NINETY_MINUTES = 90 * 60 * 1000;

export function useFleet(scenarioId = "scen_00_100y") {
    return useQuery({
        queryKey: ["fleet", scenarioId],
        queryFn: () => fetchFleet(scenarioId),
        refetchInterval: NINETY_MINUTES,
        refetchIntervalInBackground: false,
        staleTime: NINETY_MINUTES,
    });
}
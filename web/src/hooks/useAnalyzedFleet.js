/*
 * Role: Data hook for the full analysed satellite set.
 * Author: Dennies Bor
 * Description:
 *   Fetches every analysed satellite for a scenario. This is static published
 *   data, so it is fetched once and never refetched on a timer. Feeds the
 *   regime breakdown and the altitude-inclination charts.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchAnalyzedFleet } from "../lib/api";

export function useAnalyzedFleet(scenarioId = "scen_00_100y") {
    return useQuery({
        queryKey: ["analyzed-fleet", scenarioId],
        queryFn: () => fetchAnalyzedFleet(scenarioId),
        staleTime: Infinity,
    });
}
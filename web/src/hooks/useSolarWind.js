/*
 * Role: Data hook for the recent solar wind time series.
 * Author: Dennies Bor
 * Description:
 *   Fetches the solar wind history over a window of hours and refetches on a
 *   one-minute cadence so the dashboard sparklines stay current. Used by the
 *   space weather strip.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchSolarWind } from "../lib/api";

const ONE_MINUTE = 60 * 1000;

export function useSolarWind(hours = 24) {
    return useQuery({
        queryKey: ["solar-wind", hours],
        queryFn: () => fetchSolarWind(hours),
        refetchInterval: ONE_MINUTE,
    });
}
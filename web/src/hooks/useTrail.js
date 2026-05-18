/*
 * Role: Data hook for one satellite's full-resolution trajectory.
 * Author: Dennies Bor
 * Description:
 *   Wraps the trail request in a TanStack Query that is disabled until a
 *   satellite is selected. When the user clicks a satellite on the globe its
 *   NORAD identifier is passed in, the query runs, and the full-resolution
 *   path is returned for drawing the trail. Passing null leaves the query
 *   idle. Results are cached per satellite, so reselecting a satellite is
 *   immediate.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchTrail } from "../lib/api";

export function useTrail(noradId) {
    return useQuery({
        queryKey: ["trail", noradId],
        queryFn: () => fetchTrail(noradId),
        enabled: noradId !== null && noradId !== undefined,
        staleTime: 5 * 60 * 1000,
    });
}
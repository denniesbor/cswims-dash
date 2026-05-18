/*
 * Role: Paper route. The published scientific results, presented at
 *   publication quality.
 * Author: Dennies Bor
 * Description:
 *   Placeholder. This route will present the static results of the C-SWIM
 *   study: the failure probability distribution on a logarithmic axis, the
 *   classification and orbital regime breakdowns, a searchable table of every
 *   analysed satellite, and the economic impact analysis. It is built in a
 *   later step.
 */

export default function Paper() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">Published results</h2>
      <p className="text-sm text-ink-muted max-w-2xl">
        This route will present the full scientific results of the C-SWIM
        study, including the failure probability distribution, the orbital
        regime analysis, the complete satellite vulnerability table, and the
        economic impact assessment. It is under construction.
      </p>
    </div>
  );
}
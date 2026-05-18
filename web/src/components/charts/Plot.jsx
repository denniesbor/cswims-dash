/*
 * Role: A minimal React wrapper around the Plotly drawing API.
 * Author: Dennies Bor
 * Description:
 *   The react-plotly.js wrapper package resolves poorly under this build, so
 *   the dashboard calls Plotly directly. This component renders a div and
 *   draws into it with Plotly.react, which creates or updates a chart in
 *   place. It redraws when the data, layout, or config change, and cleans up
 *   the Plotly instance on unmount. Chart components use this in place of the
 *   third-party wrapper.
 */

import { useEffect, useRef } from "react";
import Plotly from "plotly.js-dist-min";

export default function Plot({ data, layout, config, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    Plotly.react(el, data, layout, config);
  }, [data, layout, config]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el) {
        Plotly.purge(el);
      }
    };
  }, []);

  return <div ref={ref} style={{ width: "100%", ...style }} />;
}
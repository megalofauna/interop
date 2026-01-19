import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhLessThanOrEqual: PhIconDefinition = {
  "name": "less-than-or-equal",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 200,
        "y1": 200,
        "x2": 48,
        "y2": 200,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polyline",
      {
        "points": "200 48 48 104 200 160",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

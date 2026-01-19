import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowsOutSimple: PhIconDefinition = {
  "name": "arrows-out-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 144,
        "y1": 112,
        "x2": 208,
        "y2": 48,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "line",
      {
        "x1": 112,
        "y1": 144,
        "x2": 48,
        "y2": 208,
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
        "points": "160 48 208 48 208 96",
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
        "points": "96 208 48 208 48 160",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhChartBar: PhIconDefinition = {
  "name": "chart-bar",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 224,
        "y1": 208,
        "x2": 32,
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
        "points": "48 208 48 136 96 136",
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
        "points": "96 208 96 88 152 88",
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
        "points": "152 208 152 40 208 40 208 208",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

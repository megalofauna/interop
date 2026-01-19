import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowLineDownRight: PhIconDefinition = {
  "name": "arrow-line-down-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 40,
        "y1": 40,
        "x2": 216,
        "y2": 40,
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
        "x1": 80,
        "y1": 88,
        "x2": 192,
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
        "points": "192 104 192 200 96 200",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

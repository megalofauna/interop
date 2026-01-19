import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPercent: PhIconDefinition = {
  "name": "percent",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 200,
        "y1": 56,
        "x2": 56,
        "y2": 200,
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "circle",
      {
        "cx": 76,
        "cy": 76,
        "r": 28,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "circle",
      {
        "cx": 180,
        "cy": 180,
        "r": 28,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

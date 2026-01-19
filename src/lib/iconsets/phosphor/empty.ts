import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhEmpty: PhIconDefinition = {
  "name": "empty",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 208,
        "y1": 40,
        "x2": 48,
        "y2": 216,
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
        "cx": 128,
        "cy": 128,
        "r": 88,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

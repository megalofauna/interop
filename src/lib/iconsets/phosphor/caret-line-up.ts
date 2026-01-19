import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCaretLineUp: PhIconDefinition = {
  "name": "caret-line-up",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 48,
        "y1": 72,
        "x2": 208,
        "y2": 72,
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
        "points": "48 192 128 112 208 192",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

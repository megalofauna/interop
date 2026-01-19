import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCaretLineDown: PhIconDefinition = {
  "name": "caret-line-down",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 48,
        "y1": 192,
        "x2": 208,
        "y2": 192,
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
        "points": "208 72 128 152 48 72",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

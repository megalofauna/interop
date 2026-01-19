import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCaretLineLeft: PhIconDefinition = {
  "name": "caret-line-left",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 72,
        "y1": 48,
        "x2": 72,
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
        "points": "192 208 112 128 192 48",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

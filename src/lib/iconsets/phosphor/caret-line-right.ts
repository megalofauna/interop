import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCaretLineRight: PhIconDefinition = {
  "name": "caret-line-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 184,
        "y1": 48,
        "x2": 184,
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
        "points": "64 48 144 128 64 208",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

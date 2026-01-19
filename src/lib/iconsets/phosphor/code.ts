import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCode: PhIconDefinition = {
  "name": "code",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 160,
        "y1": 40,
        "x2": 96,
        "y2": 216,
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
        "points": "64 88 16 128 64 168",
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
        "points": "192 88 240 128 192 168",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSignOut: PhIconDefinition = {
  "name": "sign-out",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 112,
        "y1": 128,
        "x2": 224,
        "y2": 128,
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
        "points": "112 40 48 40 48 216 112 216",
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
        "points": "184 88 224 128 184 168",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

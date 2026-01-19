import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPersonSimpleTaiChi: PhIconDefinition = {
  "name": "person-simple-tai-chi",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 40,
        "y1": 104,
        "x2": 216,
        "y2": 104,
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
        "cy": 48,
        "r": 24,
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
        "points": "128 104 128 144 48 216",
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
        "points": "128 144 184 168 184 216",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

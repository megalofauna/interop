import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhAlarm: PhIconDefinition = {
  "name": "alarm",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 56,
        "y1": 32,
        "x2": 24,
        "y2": 64,
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
        "x1": 200,
        "y1": 32,
        "x2": 232,
        "y2": 64,
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
        "cy": 136,
        "r": 88,
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
        "points": "128 80 128 136 184 136",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

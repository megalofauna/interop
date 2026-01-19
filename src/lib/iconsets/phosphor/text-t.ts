import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhTextT: PhIconDefinition = {
  "name": "text-t",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 128,
        "y1": 56,
        "x2": 128,
        "y2": 200,
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
        "x1": 96,
        "y1": 200,
        "x2": 160,
        "y2": 200,
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
        "points": "56 88 56 56 200 56 200 88",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

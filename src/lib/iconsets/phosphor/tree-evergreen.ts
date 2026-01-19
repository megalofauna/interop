import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhTreeEvergreen: PhIconDefinition = {
  "name": "tree-evergreen",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 128,
        "y1": 192,
        "x2": 128,
        "y2": 240,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polygon",
      {
        "points": "128 16 48 120 88 120 32 192 224 192 168 120 208 120 128 16",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

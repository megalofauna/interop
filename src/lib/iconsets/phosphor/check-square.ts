import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCheckSquare: PhIconDefinition = {
  "name": "check-square",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 40,
        "y": 40,
        "width": 176,
        "height": 176,
        "rx": 8,
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
        "points": "88 136 112 160 168 104",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

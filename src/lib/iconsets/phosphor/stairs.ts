import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhStairs: PhIconDefinition = {
  "name": "stairs",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 48,
        "y": 32,
        "width": 160,
        "height": 192,
        "rx": 8,
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
        "x1": 104,
        "y1": 176,
        "x2": 208,
        "y2": 176,
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
        "x1": 152,
        "y1": 136,
        "x2": 208,
        "y2": 136,
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
        "points": "48 176 104 176 104 136 152 136 152 96 208 96",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

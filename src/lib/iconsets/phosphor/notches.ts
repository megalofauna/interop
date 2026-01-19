import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhNotches: PhIconDefinition = {
  "name": "notches",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 208,
        "y1": 128,
        "x2": 128,
        "y2": 208,
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
        "x1": 192,
        "y1": 40,
        "x2": 40,
        "y2": 192,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

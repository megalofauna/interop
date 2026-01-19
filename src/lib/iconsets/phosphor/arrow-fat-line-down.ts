import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowFatLineDown: PhIconDefinition = {
  "name": "arrow-fat-line-down",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 176,
        "y1": 40,
        "x2": 80,
        "y2": 40,
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
        "points": "32 136 128 232 224 136 176 136 176 72 80 72 80 136 32 136",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

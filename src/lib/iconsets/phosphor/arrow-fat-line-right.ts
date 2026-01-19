import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowFatLineRight: PhIconDefinition = {
  "name": "arrow-fat-line-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 40,
        "y1": 176,
        "x2": 40,
        "y2": 80,
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
        "points": "136 32 232 128 136 224 136 176 72 176 72 80 136 80 136 32",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

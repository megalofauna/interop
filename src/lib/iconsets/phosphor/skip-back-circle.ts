import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSkipBackCircle: PhIconDefinition = {
  "name": "skip-back-circle",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 96,
        "y1": 88,
        "x2": 96,
        "y2": 168,
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
        "cy": 128,
        "r": 96,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-miterlimit": 10,
        "stroke-width": 16
      }
    ],
    [
      "polygon",
      {
        "points": "96 128 160 88 160 168 96 128",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

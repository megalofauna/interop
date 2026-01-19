import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSkipForwardCircle: PhIconDefinition = {
  "name": "skip-forward-circle",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 160,
        "y1": 88,
        "x2": 160,
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
        "points": "160 128 96 88 96 168 160 128",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

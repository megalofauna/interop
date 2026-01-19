import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowCircleDown: PhIconDefinition = {
  "name": "arrow-circle-down",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 128,
        "y1": 88,
        "x2": 128,
        "y2": 168,
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
        "cy": 128,
        "r": 96,
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
        "points": "96 136 128 168 160 136",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

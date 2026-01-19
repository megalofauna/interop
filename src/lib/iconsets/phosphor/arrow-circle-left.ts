import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowCircleLeft: PhIconDefinition = {
  "name": "arrow-circle-left",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 88,
        "y1": 128,
        "x2": 168,
        "y2": 128,
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
        "points": "120 96 88 128 120 160",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

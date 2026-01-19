import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowCircleUpRight: PhIconDefinition = {
  "name": "arrow-circle-up-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 160,
        "y1": 96,
        "x2": 96,
        "y2": 160,
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
        "points": "112 96 160 96 160 144",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

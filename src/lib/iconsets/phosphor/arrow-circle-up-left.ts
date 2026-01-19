import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowCircleUpLeft: PhIconDefinition = {
  "name": "arrow-circle-up-left",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 160,
        "y1": 160,
        "x2": 96,
        "y2": 96,
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
        "points": "144 96 96 96 96 144",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

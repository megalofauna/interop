import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowSquareUpRight: PhIconDefinition = {
  "name": "arrow-square-up-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 40,
        "y": 40,
        "width": 176,
        "height": 176,
        "rx": 8,
        "transform": "translate(0 256) rotate(-90)",
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

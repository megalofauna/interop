import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowSquareRight: PhIconDefinition = {
  "name": "arrow-square-right",
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
        "transform": "translate(256) rotate(90)",
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
      "polyline",
      {
        "points": "136 96 168 128 136 160",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

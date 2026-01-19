import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSquareSplitHorizontal: PhIconDefinition = {
  "name": "square-split-horizontal",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 48,
        "y": 48,
        "width": 160,
        "height": 160,
        "rx": 8,
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
        "x1": 128,
        "y1": 48,
        "x2": 128,
        "y2": 208,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

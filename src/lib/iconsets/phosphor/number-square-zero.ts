import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhNumberSquareZero: PhIconDefinition = {
  "name": "number-square-zero",
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
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "ellipse",
      {
        "cx": 128,
        "cy": 128,
        "rx": 36,
        "ry": 48,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

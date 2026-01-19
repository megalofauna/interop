import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhShapes: PhIconDefinition = {
  "name": "shapes",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 136,
        "y": 152,
        "width": 88,
        "height": 56,
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
        "cx": 156,
        "cy": 76,
        "r": 44,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polygon",
      {
        "points": "64 64 24 184 104 184 64 64",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

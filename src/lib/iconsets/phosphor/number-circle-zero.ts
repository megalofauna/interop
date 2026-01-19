import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhNumberCircleZero: PhIconDefinition = {
  "name": "number-circle-zero",
  "viewBox": "0 0 256 256",
  "nodes": [
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

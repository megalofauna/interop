import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPi: PhIconDefinition = {
  "name": "pi",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M224,64H72a48,48,0,0,0-48,48",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "path",
      {
        "d": "M224,172a28,28,0,0,1-56,0V64",
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
        "y1": 64,
        "x2": 88,
        "y2": 200,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

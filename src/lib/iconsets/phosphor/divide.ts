import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDivide: PhIconDefinition = {
  "name": "divide",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 40,
        "y1": 128,
        "x2": 216,
        "y2": 128,
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
        "cy": 64,
        "r": 16
      }
    ],
    [
      "circle",
      {
        "cx": 128,
        "cy": 192,
        "r": 16
      }
    ]
  ]
} as const;

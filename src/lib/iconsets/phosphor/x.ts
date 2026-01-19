import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhX: PhIconDefinition = {
  "name": "x",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 200,
        "y1": 56,
        "x2": 56,
        "y2": 200,
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "line",
      {
        "x1": 200,
        "y1": 200,
        "x2": 56,
        "y2": 56,
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhStack: PhIconDefinition = {
  "name": "stack",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "polyline",
      {
        "points": "32 176 128 232 224 176",
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
        "points": "32 128 128 184 224 128",
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
        "points": "32 80 128 136 224 80 128 24 32 80",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

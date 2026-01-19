import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhRewindCircle: PhIconDefinition = {
  "name": "rewind-circle",
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
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polygon",
      {
        "points": "112 92 112 164 64 128 112 92",
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
        "points": "176 92 176 164 128 128 176 92",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhTent: PhIconDefinition = {
  "name": "tent",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "polyline",
      {
        "points": "136 192 248 192 184 48 72 48 72 192",
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
        "points": "72 48 8 192 136 192 72 48",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhStackSimple: PhIconDefinition = {
  "name": "stack-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "polyline",
      {
        "points": "16 144 128 208 240 144",
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
        "points": "16 104 128 168 240 104 128 40 16 104",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

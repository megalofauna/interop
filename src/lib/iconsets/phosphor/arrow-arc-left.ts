import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArrowArcLeft: PhIconDefinition = {
  "name": "arrow-arc-left",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M224,184A96,96,0,0,0,60.12,116.12L24,152",
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
        "points": "88 152 24 152 24 88",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

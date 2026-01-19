import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhHighlighterCircle: PhIconDefinition = {
  "name": "highlighter-circle",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M168,215.3V152a8,8,0,0,0-8-8H96a8,8,0,0,0-8,8v63.3",
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
      "polyline",
      {
        "points": "104 144 104 96 152 72 152 144",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

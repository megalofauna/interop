import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCopySimple: PhIconDefinition = {
  "name": "copy-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 40,
        "y": 72,
        "width": 144,
        "height": 144,
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
        "points": "72 40 216 40 216 184",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

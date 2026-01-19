import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCaretCircleDoubleUp: PhIconDefinition = {
  "name": "caret-circle-double-up",
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
      "polyline",
      {
        "points": "96 168 128 136 160 168",
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
        "points": "96 112 128 80 160 112",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

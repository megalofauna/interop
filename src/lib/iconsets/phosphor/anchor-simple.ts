import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhAnchorSimple: PhIconDefinition = {
  "name": "anchor-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M56,120H32a96,96,0,0,0,192,0H200",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "line",
      {
        "x1": 128,
        "y1": 216,
        "x2": 128,
        "y2": 88,
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
        "cy": 64,
        "r": 24,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

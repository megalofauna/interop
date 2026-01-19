import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBoxArrowUp: PhIconDefinition = {
  "name": "box-arrow-up",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M208,216H48a8,8,0,0,1-8-8V72L56,40H200l16,32V208A8,8,0,0,1,208,216Z",
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
        "x1": 40,
        "y1": 72,
        "x2": 216,
        "y2": 72,
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
        "y1": 104,
        "x2": 128,
        "y2": 184,
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
        "points": "96 136 128 104 160 136",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

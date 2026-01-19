import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhWheelchair: PhIconDefinition = {
  "name": "wheelchair",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M168,96H112a64,64,0,0,0,0,128c29.82,0,56.9-20.4,64-48",
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
        "cx": 104,
        "cy": 48,
        "r": 24,
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
        "points": "104 72 104 136 192 136 224 200 248 192",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

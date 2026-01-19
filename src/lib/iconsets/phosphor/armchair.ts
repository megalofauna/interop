import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhArmchair: PhIconDefinition = {
  "name": "armchair",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M48,96V72A32,32,0,0,1,80,40h96a32,32,0,0,1,32,32V96",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "path",
      {
        "d": "M80,168V128a32,32,0,1,0-32,32h0v40a8,8,0,0,0,8,8H200a8,8,0,0,0,8-8V160h0a32,32,0,1,0-32-32v40",
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
        "x1": 80,
        "y1": 136,
        "x2": 176,
        "y2": 136,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

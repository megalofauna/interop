import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBaseballHelmet: PhIconDefinition = {
  "name": "baseball-helmet",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M216,128a96,96,0,0,0-192,0v24a64,64,0,0,0,128,0V128h96",
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
        "d": "M88,216h40a64,64,0,0,0,64-64V128",
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
        "cx": 88,
        "cy": 156,
        "r": 20,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

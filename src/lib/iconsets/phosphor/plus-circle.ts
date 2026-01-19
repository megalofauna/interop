import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPlusCircle: PhIconDefinition = {
  "name": "plus-circle",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 88,
        "y1": 128,
        "x2": 168,
        "y2": 128,
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
        "y1": 88,
        "x2": 128,
        "y2": 168,
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
        "stroke-miterlimit": 10,
        "stroke-width": 16
      }
    ]
  ]
} as const;

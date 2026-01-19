import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPauseCircle: PhIconDefinition = {
  "name": "pause-circle",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 104,
        "y1": 96,
        "x2": 104,
        "y2": 160,
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
        "x1": 152,
        "y1": 96,
        "x2": 152,
        "y2": 160,
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

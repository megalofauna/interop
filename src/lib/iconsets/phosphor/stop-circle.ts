import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhStopCircle: PhIconDefinition = {
  "name": "stop-circle",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 96,
        "y": 96,
        "width": 64,
        "height": 64,
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

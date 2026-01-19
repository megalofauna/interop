import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBinoculars: PhIconDefinition = {
  "name": "binoculars",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M229.59,154.32,185.94,55A24,24,0,0,0,152,55V168",
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
        "d": "M104,168V55a24,24,0,0,0-33.94,0L26.41,154.32",
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
        "x1": 104,
        "y1": 88,
        "x2": 152,
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
        "cx": 64,
        "cy": 168,
        "r": 40,
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
        "cx": 192,
        "cy": 168,
        "r": 40,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

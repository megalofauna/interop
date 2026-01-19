import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPrescription: PhIconDefinition = {
  "name": "prescription",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M72,128h52a44,44,0,0,0,0-88H72V192",
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
        "x1": 112,
        "y1": 128,
        "x2": 200,
        "y2": 216,
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
        "x1": 200,
        "y1": 160,
        "x2": 144,
        "y2": 216,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

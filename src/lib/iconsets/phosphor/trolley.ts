import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhTrolley: PhIconDefinition = {
  "name": "trolley",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M24,48,45.66,69.66A8,8,0,0,1,48,75.31V184",
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
        "x1": 32,
        "y1": 184,
        "x2": 240,
        "y2": 184,
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
        "cx": 72,
        "cy": 224,
        "r": 16
      }
    ],
    [
      "circle",
      {
        "cx": 216,
        "cy": 224,
        "r": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSphere: PhIconDefinition = {
  "name": "sphere",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M128,32c17.67,0,32,43,32,96s-14.33,96-32,96",
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
        "d": "M224,128c0,17.67-43,32-96,32s-96-14.33-96-32",
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
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

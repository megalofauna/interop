import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSmileyNervous: PhIconDefinition = {
  "name": "smiley-nervous",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M80,168c12,0,12-16,24-16s12,16,24,16,12-16,24-16,12,16,24,16",
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
    ],
    [
      "circle",
      {
        "cx": 92,
        "cy": 108,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 164,
        "cy": 108,
        "r": 12
      }
    ]
  ]
} as const;

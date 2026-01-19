import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhYinYang: PhIconDefinition = {
  "name": "yin-yang",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M128,224a48,48,0,0,1,0-96,48,48,0,0,0,0-96",
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
    ],
    [
      "circle",
      {
        "cx": 128,
        "cy": 176,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 128,
        "cy": 80,
        "r": 12
      }
    ]
  ]
} as const;

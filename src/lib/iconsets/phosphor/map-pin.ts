import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhMapPin: PhIconDefinition = {
  "name": "map-pin",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M208,104c0,72-80,128-80,128S48,176,48,104a80,80,0,0,1,160,0Z",
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
        "cy": 104,
        "r": 32,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

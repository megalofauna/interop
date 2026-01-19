import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhGenderNeuter: PhIconDefinition = {
  "name": "gender-neuter",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 128,
        "y1": 176,
        "x2": 128,
        "y2": 232,
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
        "r": 72,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

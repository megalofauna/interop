import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhFlag: PhIconDefinition = {
  "name": "flag",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M48,176c64-55.43,112,55.43,176,0V56C160,111.43,112,.57,48,56",
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
        "x1": 48,
        "y1": 224,
        "x2": 48,
        "y2": 56,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

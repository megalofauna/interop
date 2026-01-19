import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCloudWarning: PhIconDefinition = {
  "name": "cloud-warning",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M80,128a80,80,0,1,1,80,80H72A56,56,0,1,1,85.92,97.74",
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
        "x1": 160,
        "y1": 128,
        "x2": 160,
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
        "cx": 160,
        "cy": 164,
        "r": 12
      }
    ]
  ]
} as const;

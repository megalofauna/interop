import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhNotification: PhIconDefinition = {
  "name": "notification",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M208,128v80a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8h80",
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
        "cx": 196,
        "cy": 60,
        "r": 28,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

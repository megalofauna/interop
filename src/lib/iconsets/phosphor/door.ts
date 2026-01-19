import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDoor: PhIconDefinition = {
  "name": "door",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M56,224V40a8,8,0,0,1,8-8H192a8,8,0,0,1,8,8V224",
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
        "x1": 24,
        "y1": 224,
        "x2": 232,
        "y2": 224,
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
        "cx": 156,
        "cy": 132,
        "r": 12
      }
    ]
  ]
} as const;

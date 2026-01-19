import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDotsThreeCircle: PhIconDefinition = {
  "name": "dots-three-circle",
  "viewBox": "0 0 256 256",
  "nodes": [
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
        "cx": 128,
        "cy": 128,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 172,
        "cy": 128,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 84,
        "cy": 128,
        "r": 12
      }
    ]
  ]
} as const;

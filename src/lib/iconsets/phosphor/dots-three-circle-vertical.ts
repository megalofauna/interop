import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDotsThreeCircleVertical: PhIconDefinition = {
  "name": "dots-three-circle-vertical",
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
        "cx": 128,
        "cy": 84,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 128,
        "cy": 172,
        "r": 12
      }
    ]
  ]
} as const;

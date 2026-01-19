import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDotsThreeVertical: PhIconDefinition = {
  "name": "dots-three-vertical",
  "viewBox": "0 0 256 256",
  "nodes": [
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
        "cy": 60,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 128,
        "cy": 196,
        "r": 12
      }
    ]
  ]
} as const;

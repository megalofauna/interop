import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhHardDrives: PhIconDefinition = {
  "name": "hard-drives",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 40,
        "y": 144,
        "width": 176,
        "height": 64,
        "rx": 8,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "rect",
      {
        "x": 40,
        "y": 48,
        "width": 176,
        "height": 64,
        "rx": 8,
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
        "cx": 180,
        "cy": 80,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 180,
        "cy": 176,
        "r": 12
      }
    ]
  ]
} as const;

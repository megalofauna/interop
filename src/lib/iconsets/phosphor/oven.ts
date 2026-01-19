import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhOven: PhIconDefinition = {
  "name": "oven",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 40,
        "y": 40,
        "width": 176,
        "height": 176,
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
        "x": 72,
        "y": 112,
        "width": 112,
        "height": 72,
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
        "cx": 84,
        "cy": 76,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 128,
        "cy": 76,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 172,
        "cy": 76,
        "r": 12
      }
    ]
  ]
} as const;

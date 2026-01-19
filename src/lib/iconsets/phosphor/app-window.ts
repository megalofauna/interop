import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhAppWindow: PhIconDefinition = {
  "name": "app-window",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 32,
        "y": 48,
        "width": 192,
        "height": 160,
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
        "cx": 68,
        "cy": 84,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 108,
        "cy": 84,
        "r": 12
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhToggleRight: PhIconDefinition = {
  "name": "toggle-right",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 16,
        "y": 64,
        "width": 224,
        "height": 128,
        "rx": 64,
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
        "cx": 176,
        "cy": 128,
        "r": 32,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

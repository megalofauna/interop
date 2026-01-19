import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhInstagramLogo: PhIconDefinition = {
  "name": "instagram-logo",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 32,
        "y": 32,
        "width": 192,
        "height": 192,
        "rx": 48,
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
        "cx": 128,
        "cy": 128,
        "r": 40,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-miterlimit": 10,
        "stroke-width": 16
      }
    ],
    [
      "circle",
      {
        "cx": 180,
        "cy": 76,
        "r": 12
      }
    ]
  ]
} as const;

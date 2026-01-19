import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDeviceMobile: PhIconDefinition = {
  "name": "device-mobile",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 64,
        "y": 24,
        "width": 128,
        "height": 208,
        "rx": 16,
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
        "x1": 64,
        "y1": 56,
        "x2": 192,
        "y2": 56,
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
        "x1": 64,
        "y1": 200,
        "x2": 192,
        "y2": 200,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

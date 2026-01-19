import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDeviceMobileCamera: PhIconDefinition = {
  "name": "device-mobile-camera",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 24,
        "y": 64,
        "width": 208,
        "height": 128,
        "rx": 16,
        "transform": "translate(256) rotate(90)",
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
        "cy": 60,
        "r": 12
      }
    ]
  ]
} as const;

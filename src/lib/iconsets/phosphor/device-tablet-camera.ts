import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDeviceTabletCamera: PhIconDefinition = {
  "name": "device-tablet-camera",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 32,
        "y": 48,
        "width": 192,
        "height": 160,
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
        "cy": 68,
        "r": 12
      }
    ]
  ]
} as const;

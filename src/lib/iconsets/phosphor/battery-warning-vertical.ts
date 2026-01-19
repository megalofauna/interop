import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBatteryWarningVertical: PhIconDefinition = {
  "name": "battery-warning-vertical",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 64,
        "y": 40,
        "width": 128,
        "height": 200,
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
        "x1": 128,
        "y1": 96,
        "x2": 128,
        "y2": 136,
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
        "x1": 96,
        "y1": 8,
        "x2": 160,
        "y2": 8,
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
        "cy": 172,
        "r": 12
      }
    ]
  ]
} as const;

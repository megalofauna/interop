import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBatteryCharging: PhIconDefinition = {
  "name": "battery-charging",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 16,
        "y": 64,
        "width": 200,
        "height": 128,
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
        "x1": 248,
        "y1": 96,
        "x2": 248,
        "y2": 160,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polyline",
      {
        "points": "116 160 132 128 100 128 116 96",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

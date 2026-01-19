import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBatteryChargingVertical: PhIconDefinition = {
  "name": "battery-charging-vertical",
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
      "polyline",
      {
        "points": "128 168 144 136 112 136 128 104",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

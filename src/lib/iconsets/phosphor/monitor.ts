import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhMonitor: PhIconDefinition = {
  "name": "monitor",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 32,
        "y": 48,
        "width": 192,
        "height": 144,
        "rx": 16,
        "transform": "translate(256 240) rotate(180)",
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
        "x1": 160,
        "y1": 224,
        "x2": 96,
        "y2": 224,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

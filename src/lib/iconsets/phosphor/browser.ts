import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhBrowser: PhIconDefinition = {
  "name": "browser",
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
      "line",
      {
        "x1": 32,
        "y1": 96,
        "x2": 224,
        "y2": 96,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

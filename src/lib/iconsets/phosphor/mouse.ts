import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhMouse: PhIconDefinition = {
  "name": "mouse",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 56,
        "y": 24,
        "width": 144,
        "height": 208,
        "rx": 56,
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
        "y1": 112,
        "x2": 128,
        "y2": 24,
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
        "x1": 56,
        "y1": 112,
        "x2": 200,
        "y2": 112,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

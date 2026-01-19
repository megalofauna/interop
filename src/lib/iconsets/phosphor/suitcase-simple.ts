import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSuitcaseSimple: PhIconDefinition = {
  "name": "suitcase-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M168,64V48a16,16,0,0,0-16-16H104A16,16,0,0,0,88,48V64",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "rect",
      {
        "x": 32,
        "y": 64,
        "width": 192,
        "height": 144,
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
        "y1": 152,
        "x2": 224,
        "y2": 152,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

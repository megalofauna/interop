import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhImageSquare: PhIconDefinition = {
  "name": "image-square",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M56.69,216,166.34,106.34a8,8,0,0,1,11.32,0L216,144.69",
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
        "x": 40,
        "y": 40,
        "width": 176,
        "height": 176,
        "rx": 8,
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
        "cx": 96,
        "cy": 96,
        "r": 16,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhColumns: PhIconDefinition = {
  "name": "columns",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": -4,
        "y": 100,
        "width": 176,
        "height": 56,
        "rx": 8,
        "transform": "translate(212 44) rotate(90)",
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
        "x": 84,
        "y": 100,
        "width": 176,
        "height": 56,
        "rx": 8,
        "transform": "translate(300 -44) rotate(90)",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

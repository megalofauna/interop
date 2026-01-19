import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSmileyMeh: PhIconDefinition = {
  "name": "smiley-meh",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 88,
        "y1": 160,
        "x2": 168,
        "y2": 160,
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
        "cy": 128,
        "r": 96,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-miterlimit": 10,
        "stroke-width": 16
      }
    ],
    [
      "circle",
      {
        "cx": 92,
        "cy": 108,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 164,
        "cy": 108,
        "r": 12
      }
    ]
  ]
} as const;

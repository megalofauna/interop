import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSmileyBlank: PhIconDefinition = {
  "name": "smiley-blank",
  "viewBox": "0 0 256 256",
  "nodes": [
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

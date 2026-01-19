import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDiceTwo: PhIconDefinition = {
  "name": "dice-two",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 40,
        "y": 40,
        "width": 176,
        "height": 176,
        "rx": 24,
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
        "cx": 108,
        "cy": 108,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 148,
        "cy": 148,
        "r": 12
      }
    ]
  ]
} as const;

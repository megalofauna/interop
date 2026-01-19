import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhSpeakerHifi: PhIconDefinition = {
  "name": "speaker-hifi",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 32,
        "y": 56,
        "width": 192,
        "height": 144,
        "rx": 8,
        "transform": "translate(256 0) rotate(90)",
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
        "cy": 76,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 128,
        "cy": 152,
        "r": 32,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhFilmScript: PhIconDefinition = {
  "name": "film-script",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 48,
        "y": 32,
        "width": 160,
        "height": 192,
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
        "cx": 84,
        "cy": 76,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 84,
        "cy": 180,
        "r": 12
      }
    ],
    [
      "circle",
      {
        "cx": 84,
        "cy": 128,
        "r": 12
      }
    ]
  ]
} as const;

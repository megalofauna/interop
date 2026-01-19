import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhAtom: PhIconDefinition = {
  "name": "atom",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "circle",
      {
        "cx": 128,
        "cy": 128,
        "r": 12
      }
    ],
    [
      "ellipse",
      {
        "cx": 128,
        "cy": 128,
        "rx": 44.13,
        "ry": 116.33,
        "transform": "translate(-53.02 128) rotate(-45)",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "ellipse",
      {
        "cx": 128,
        "cy": 128,
        "rx": 116.33,
        "ry": 44.13,
        "transform": "translate(-53.02 128) rotate(-45)",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

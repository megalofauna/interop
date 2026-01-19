import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhWarningDiamond: PhIconDefinition = {
  "name": "warning-diamond",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "rect",
      {
        "x": 52.13,
        "y": 52.13,
        "width": 151.73,
        "height": 151.73,
        "rx": 7.95,
        "transform": "translate(-53.02 128) rotate(-45)",
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
        "y1": 136,
        "x2": 128,
        "y2": 80,
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
        "cy": 172,
        "r": 12
      }
    ]
  ]
} as const;

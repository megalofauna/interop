import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCurrencyEth: PhIconDefinition = {
  "name": "currency-eth",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 128,
        "y1": 16,
        "x2": 128,
        "y2": 240,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polyline",
      {
        "points": "216 128 128 168 40 128",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "polygon",
      {
        "points": "128 16 216 128 128 240 40 128 128 16",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

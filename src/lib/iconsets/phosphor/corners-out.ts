import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCornersOut: PhIconDefinition = {
  "name": "corners-out",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "polyline",
      {
        "points": "168 48 208 48 208 88",
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
        "points": "88 208 48 208 48 168",
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
        "points": "208 168 208 208 168 208",
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
        "points": "48 88 48 48 88 48",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

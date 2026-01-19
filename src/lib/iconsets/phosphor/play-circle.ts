import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPlayCircle: PhIconDefinition = {
  "name": "play-circle",
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
      "polygon",
      {
        "points": "172 128 108 88 108 168 172 128",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

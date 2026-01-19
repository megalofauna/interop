import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhMusicNote: PhIconDefinition = {
  "name": "music-note",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "circle",
      {
        "cx": 88,
        "cy": 184,
        "r": 40,
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
        "points": "128 184 128 40 208 64 208 112 128 88",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

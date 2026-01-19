import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhMusicNotesSimple: PhIconDefinition = {
  "name": "music-notes-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "circle",
      {
        "cx": 180,
        "cy": 164,
        "r": 28,
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
        "cx": 52,
        "cy": 196,
        "r": 28,
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
        "points": "80 196 80 56 208 24 208 164",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

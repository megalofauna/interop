import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhVoicemail: PhIconDefinition = {
  "name": "voicemail",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "line",
      {
        "x1": 56,
        "y1": 176,
        "x2": 200,
        "y2": 176,
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
        "cx": 56,
        "cy": 128,
        "r": 48,
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
        "cx": 200,
        "cy": 128,
        "r": 48,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhTextUnderline: PhIconDefinition = {
  "name": "text-underline",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M184,56v80a56,56,0,0,1-112,0V56",
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
        "x1": 64,
        "y1": 224,
        "x2": 192,
        "y2": 224,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

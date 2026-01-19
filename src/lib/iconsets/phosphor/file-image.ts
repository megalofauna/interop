import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhFileImage: PhIconDefinition = {
  "name": "file-image",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M192,224h8a8,8,0,0,0,8-8V88L152,32H56a8,8,0,0,0-8,8v88",
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
        "points": "152 32 152 88 208 88",
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
        "points": "152 224 104 152 76.36 193.46 60 168 24 224 152 224",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

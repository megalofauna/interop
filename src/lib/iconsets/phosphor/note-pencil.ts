import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhNotePencil: PhIconDefinition = {
  "name": "note-pencil",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M216,128v80a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V48a8,8,0,0,1,8-8h80",
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
        "x1": 168,
        "y1": 56,
        "x2": 200,
        "y2": 88,
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
        "points": "128 160 96 160 96 128 192 32 224 64 128 160",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

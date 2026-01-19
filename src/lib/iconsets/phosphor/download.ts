import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDownload: PhIconDefinition = {
  "name": "download",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M184,128h40a8,8,0,0,1,8,8v64a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V136a8,8,0,0,1,8-8H72",
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
        "y1": 24,
        "x2": 128,
        "y2": 128,
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
        "cx": 188,
        "cy": 168,
        "r": 12
      }
    ],
    [
      "polyline",
      {
        "points": "80 80 128 128 176 80",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

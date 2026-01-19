import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhDeviceRotate: PhIconDefinition = {
  "name": "device-rotate",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M200,216H80a16,16,0,0,1-16-16V104",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "path",
      {
        "d": "M56,40H176a16,16,0,0,1,16,16v96",
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
        "points": "176 192 200 216 176 240",
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
        "points": "80 16 56 40 80 64",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

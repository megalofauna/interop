import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhThermometerSimple: PhIconDefinition = {
  "name": "thermometer-simple",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M96,48a32,32,0,0,1,64,0v90a56,56,0,1,1-64,0Z",
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
        "y1": 160,
        "x2": 128,
        "y2": 88,
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
        "cx": 128,
        "cy": 184,
        "r": 24,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

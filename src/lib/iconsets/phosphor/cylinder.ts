import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhCylinder: PhIconDefinition = {
  "name": "cylinder",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M64,60V196c0,19.88,28.65,36,64,36s64-16.12,64-36V60",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ],
    [
      "ellipse",
      {
        "cx": 128,
        "cy": 60,
        "rx": 64,
        "ry": 36,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhPath: PhIconDefinition = {
  "name": "path",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M72,56h96a32,32,0,0,1,0,64H72a40,40,0,0,0,0,80H176",
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
        "cy": 200,
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

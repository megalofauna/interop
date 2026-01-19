import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const PhLaptop: PhIconDefinition = {
  "name": "laptop",
  "viewBox": "0 0 256 256",
  "nodes": [
    [
      "path",
      {
        "d": "M40,176V72A16,16,0,0,1,56,56H200a16,16,0,0,1,16,16V176",
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
        "d": "M24,176H232a0,0,0,0,1,0,0v16a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V176A0,0,0,0,1,24,176Z",
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
        "x1": 144,
        "y1": 88,
        "x2": 112,
        "y2": 88,
        "fill": "none",
        "stroke": "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 16
      }
    ]
  ]
} as const;

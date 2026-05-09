import type { InteropIconDefinition } from "../../core";

export const PhQrCode: InteropIconDefinition = {
  name: "ph-qr-code",
  viewBox: "0 0 256 256",
  svgContent: "<rect x=\"48\" y=\"48\" width=\"64\" height=\"64\" rx=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"48\" y=\"144\" width=\"64\" height=\"64\" rx=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><rect x=\"144\" y=\"48\" width=\"64\" height=\"64\" rx=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><line x1=\"144\" y1=\"144\" x2=\"144\" y2=\"176\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><polyline points=\"144 208 176 208 176 144\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><line x1=\"176\" y1=\"160\" x2=\"208\" y2=\"160\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><line x1=\"208\" y1=\"192\" x2=\"208\" y2=\"208\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>",
  defaultStrokeWidth: 16,
} as const;

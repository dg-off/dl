export type ParentRelativeTransform = {
  xPct: number;
  yPct: number;
  scale: number;
  rotationDeg: number;
  visible?: boolean;
};

export type TransformControlSpec = {
  key: keyof ParentRelativeTransform;
  label: string;
  min: number;
  max: number;
  step: number;
  format: "percent" | "number" | "degrees";
};

export const DEFAULT_PARENT_RELATIVE_TRANSFORM: ParentRelativeTransform = {
  xPct: 50,
  yPct: 14,
  scale: 1.92,
  rotationDeg: 0,
  visible: true,
};

export const DEFAULT_TRANSFORM_CONTROL_SPECS: TransformControlSpec[] = [
  { key: "xPct", label: "X", min: 0, max: 100, step: 0.5, format: "percent" },
  { key: "yPct", label: "Y", min: 0, max: 100, step: 0.5, format: "percent" },
  { key: "scale", label: "Scale", min: 1, max: 4, step: 0.05, format: "number" },
  { key: "rotationDeg", label: "Rotation", min: -180, max: 180, step: 1, format: "degrees" },
];

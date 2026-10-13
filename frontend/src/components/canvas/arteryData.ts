import * as THREE from "three";

export interface ArteryDefinition {
  id: "left_main" | "lad" | "lcx" | "rca";
  name: string;
  shortName: string;
  clinicalName: string;
  description: string;
  territory: string;
  points: [number, number, number][];
  radius: number;
}

export const ARTERY_DEFINITIONS: ArteryDefinition[] = [
  {
    id: "left_main",
    name: "Left Main Coronary Artery",
    shortName: "Left Main (LMCA)",
    clinicalName: "Left Main Trunk",
    description: "Main arterial conduit branching from the aortic root supplying the entire anterior and lateral myocardium.",
    territory: "Supplies LAD and LCX branches (anterior wall, septum, lateral wall).",
    radius: 0.055,
    points: [
      [0.05, 0.44, 0.36],
      [-0.10, 0.40, 0.46],
      [-0.24, 0.35, 0.54],
    ],
  },
  {
    id: "lad",
    name: "Left Anterior Descending",
    shortName: "LAD Artery",
    clinicalName: "Anterior Interventricular Artery",
    description: "Descends along the anterior interventricular sulcus to the apex ('widow maker').",
    territory: "Anterior left ventricular wall, anterior two-thirds of septum, and apex.",
    radius: 0.045,
    points: [
      [-0.24, 0.35, 0.54],
      [-0.30, 0.22, 0.64],
      [-0.28, 0.04, 0.70],
      [-0.18, -0.18, 0.66],
      [-0.08, -0.38, 0.56],
      [0.02, -0.56, 0.42],
      [0.08, -0.68, 0.26],
    ],
  },
  {
    id: "lcx",
    name: "Left Circumflex",
    shortName: "LCX Artery",
    clinicalName: "Ramus Circumflexus",
    description: "Courses leftward along the atrioventricular groove supplying the lateral and posterior left ventricle.",
    territory: "Posterior and lateral walls of the left ventricle.",
    radius: 0.042,
    points: [
      [-0.24, 0.35, 0.54],
      [-0.44, 0.28, 0.44],
      [-0.58, 0.16, 0.22],
      [-0.64, 0.00, -0.05],
      [-0.56, -0.18, -0.28],
      [-0.38, -0.30, -0.42],
      [-0.16, -0.42, -0.48],
    ],
  },
  {
    id: "rca",
    name: "Right Coronary Artery",
    shortName: "RCA Artery",
    clinicalName: "Arteria Coronaria Dextra",
    description: "Originates from right aortic sinus and passes along the right atrioventricular sulcus to the inferior heart surface.",
    territory: "Right ventricle, right atrium, SA/AV nodes, and inferior wall of left ventricle.",
    radius: 0.046,
    points: [
      [0.16, 0.42, 0.34],
      [0.34, 0.32, 0.38],
      [0.48, 0.16, 0.34],
      [0.54, -0.08, 0.24],
      [0.48, -0.30, 0.10],
      [0.30, -0.48, -0.08],
      [0.08, -0.58, -0.18],
    ],
  },
];

export function getRiskColor(
  score: number,
  isDark: boolean
): { hex: string; level: "low" | "elevated" | "high" } {
  // Theme tokens from BUILD_PLAN.md section 6:
  // Light: Low #1F9D8F, Elevated #E0A030, High #D14B4B
  // Dark:  Low #2DD4BF, Elevated #F5B84B, High #FF4D5E
  const lowHex = isDark ? "#2DD4BF" : "#1F9D8F";
  const medHex = isDark ? "#F5B84B" : "#E0A030";
  const highHex = isDark ? "#FF4D5E" : "#D14B4B";

  const clamped = Math.max(0, Math.min(1, score));

  if (clamped < 0.33) {
    return { hex: lowHex, level: "low" };
  } else if (clamped < 0.66) {
    return { hex: medHex, level: "elevated" };
  } else {
    return { hex: highHex, level: "high" };
  }
}

export function interpolateRiskColor(score: number, isDark: boolean): string {
  const lowHex = isDark ? "#2DD4BF" : "#1F9D8F";
  const medHex = isDark ? "#F5B84B" : "#E0A030";
  const highHex = isDark ? "#FF4D5E" : "#D14B4B";

  const cLow = new THREE.Color(lowHex);
  const cMed = new THREE.Color(medHex);
  const cHigh = new THREE.Color(highHex);

  const clamped = Math.max(0, Math.min(1, score));
  const res = new THREE.Color();

  if (clamped <= 0.5) {
    const t = clamped / 0.5;
    res.lerpColors(cLow, cMed, t);
  } else {
    const t = (clamped - 0.5) / 0.5;
    res.lerpColors(cMed, cHigh, t);
  }

  return `#${res.getHexString()}`;
}

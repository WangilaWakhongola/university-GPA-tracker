// src/utils/gpa.js — client-side GPA helpers

export const SCALES = {
  "4.0": {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D+": 1.3, "D": 1.0, "D-": 0.7,
    "F":  0.0,
  },
  "5.0": { "A": 5.0, "B": 4.0, "C": 3.0, "D": 2.0, "E": 1.0, "F": 0.0 },
  "7.0": { "HD": 7.0, "D": 6.0, "C": 5.0, "P": 4.0, "PC": 3.0, "F": 0.0 },
};

export function getGradeOptions(scale = "4.0") {
  return Object.keys(SCALES[scale] || SCALES["4.0"]);
}

export function getGradePoint(grade, scale = "4.0") {
  const table = SCALES[scale] || SCALES["4.0"];
  return table[grade?.toUpperCase()] ?? 0;
}

export function classifyGpa(cgpa, scale = "4.0") {
  const thresholds = {
    "4.0": [
      { min: 3.60, cls: "First Class",        desc: "Excellent",        color: "green"  },
      { min: 3.00, cls: "Second Class Upper", desc: "Very Good",        color: "blue"   },
      { min: 2.00, cls: "Second Class Lower", desc: "Good",             color: "yellow" },
      { min: 1.00, cls: "Pass",               desc: "Satisfactory",     color: "orange" },
      { min: 0,    cls: "Fail",               desc: "Below Minimum",    color: "red"    },
    ],
    "5.0": [
      { min: 4.50, cls: "First Class",        desc: "Excellent",        color: "green"  },
      { min: 3.50, cls: "Second Class Upper", desc: "Very Good",        color: "blue"   },
      { min: 2.40, cls: "Second Class Lower", desc: "Good",             color: "yellow" },
      { min: 1.50, cls: "Pass",               desc: "Satisfactory",     color: "orange" },
      { min: 0,    cls: "Fail",               desc: "Below Minimum",    color: "red"    },
    ],
    "7.0": [
      { min: 6.00, cls: "First Class",        desc: "High Distinction", color: "green"  },
      { min: 5.00, cls: "Second Class Upper", desc: "Distinction",      color: "blue"   },
      { min: 4.00, cls: "Second Class Lower", desc: "Credit",           color: "yellow" },
      { min: 3.00, cls: "Pass",               desc: "Pass",             color: "orange" },
      { min: 0,    cls: "Fail",               desc: "Below Minimum",    color: "red"    },
    ],
  };
  const list = thresholds[scale] || thresholds["4.0"];
  return list.find((t) => cgpa >= t.min) || list[list.length - 1];
}

export function formatGpa(val) {
  return Number(val || 0).toFixed(2);
}

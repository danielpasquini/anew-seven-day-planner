/**
 * Contrast validator for all palette×theme combinations (updated tokens).
 * Run: node docs/contrast-check.mjs
 */

function oklchToLinearSRGB(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  const lv = l_ * l_ * l_;
  const mv = m_ * m_ * m_;
  const sv = s_ * s_ * s_;
  const r = +4.0767416621 * lv - 3.3077115913 * mv + 0.2309699292 * sv;
  const g = -1.2684380046 * lv + 2.6097574011 * mv - 0.3413193965 * sv;
  const bl = -0.0041960863 * lv - 0.7034186147 * mv + 1.7076147010 * sv;
  return [r, g, bl];
}

function luminance(r, g, b) {
  const rc = Math.max(0, Math.min(1, r));
  const gc = Math.max(0, Math.min(1, g));
  const bc = Math.max(0, Math.min(1, b));
  return 0.2126 * rc + 0.7152 * gc + 0.0722 * bc;
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function lum(l, c, h) {
  const [r, g, b] = oklchToLinearSRGB(l, c, h);
  return luminance(r, g, b);
}

const tokens = {
  // ─── LIGHT ───────────────────────────────────────────────────────────────
  "light-sage": {
    background:             [0.977, 0.009, 95],
    foreground:             [0.26,  0.02,  155],
    card:                   [0.995, 0.004, 95],
    "card-foreground":      [0.26,  0.02,  155],
    primary:                [0.42,  0.055, 158],
    "primary-foreground":   [0.98,  0.01,  95],
    secondary:              [0.945, 0.012, 120],
    "secondary-foreground": [0.34,  0.03,  158],
    muted:                  [0.95,  0.01,  110],
    "muted-foreground":     [0.45,  0.02,  150],
    accent:                 [0.93,  0.02,  150],
    "accent-foreground":    [0.34,  0.04,  158],
    gold:                   [0.72,  0.088, 78],
    "gold-foreground":      [0.28,  0.05,  70],
    destructive:            [0.52,  0.18,  28],
  },
  "light-terracotta": {
    background:             [0.975, 0.01,  45],
    foreground:             [0.26,  0.03,  40],
    card:                   [0.995, 0.005, 45],
    "card-foreground":      [0.26,  0.03,  40],
    primary:                [0.44,  0.13,  38],
    "primary-foreground":   [0.98,  0.01,  45],
    secondary:              [0.945, 0.02,  45],
    "secondary-foreground": [0.34,  0.08,  40],
    muted:                  [0.94,  0.015, 45],
    "muted-foreground":     [0.44,  0.04,  40],
    accent:                 [0.925, 0.025, 45],
    "accent-foreground":    [0.34,  0.08,  40],
    gold:                   [0.68,  0.11,  45],
    "gold-foreground":      [0.30,  0.08,  38],
    destructive:            [0.52,  0.18,  28],
  },
  "light-blue": {
    background:             [0.975, 0.008, 245],
    foreground:             [0.24,  0.03,  250],
    card:                   [0.995, 0.003, 245],
    "card-foreground":      [0.24,  0.03,  250],
    primary:                [0.40,  0.10,  250],
    "primary-foreground":   [0.98,  0.01,  245],
    secondary:              [0.94,  0.015, 245],
    "secondary-foreground": [0.28,  0.07,  250],
    muted:                  [0.94,  0.01,  245],
    "muted-foreground":     [0.42,  0.025, 250],
    accent:                 [0.92,  0.025, 245],
    "accent-foreground":    [0.28,  0.07,  250],
    gold:                   [0.65,  0.09,  245],
    "gold-foreground":      [0.26,  0.07,  250],
    destructive:            [0.52,  0.18,  28],
  },
  "light-graphite": {
    background:             [0.975, 0.002, 250],
    foreground:             [0.22,  0.005, 250],
    card:                   [0.998, 0.001, 250],
    "card-foreground":      [0.22,  0.005, 250],
    primary:                [0.30,  0.012, 250],
    "primary-foreground":   [0.98,  0.002, 250],
    secondary:              [0.935, 0.004, 250],
    "secondary-foreground": [0.24,  0.008, 250],
    muted:                  [0.94,  0.003, 250],
    "muted-foreground":     [0.40,  0.007, 250],
    accent:                 [0.915, 0.006, 250],
    "accent-foreground":    [0.24,  0.008, 250],
    gold:                   [0.55,  0.01,  250],
    "gold-foreground":      [0.24,  0.012, 250],
    destructive:            [0.52,  0.18,  28],
  },
  "light-olive": {
    background:             [0.975, 0.01,  110],
    foreground:             [0.25,  0.025, 110],
    card:                   [0.995, 0.004, 110],
    "card-foreground":      [0.25,  0.025, 110],
    primary:                [0.42,  0.085, 110],
    "primary-foreground":   [0.98,  0.01,  110],
    secondary:              [0.945, 0.015, 110],
    "secondary-foreground": [0.30,  0.055, 110],
    muted:                  [0.94,  0.01,  110],
    "muted-foreground":     [0.43,  0.025, 110],
    accent:                 [0.925, 0.02,  110],
    "accent-foreground":    [0.30,  0.055, 110],
    gold:                   [0.65,  0.09,  110],
    "gold-foreground":      [0.28,  0.055, 110],
    destructive:            [0.52,  0.18,  28],
  },

  // ─── DARK ────────────────────────────────────────────────────────────────
  "dark-sage": {
    background:             [0.18,  0.012, 155],
    foreground:             [0.93,  0.01,  95],
    card:                   [0.23,  0.013, 155],
    "card-foreground":      [0.93,  0.01,  95],
    primary:                [0.70,  0.09,  158],
    "primary-foreground":   [0.13,  0.02,  158],
    secondary:              [0.27,  0.015, 155],
    "secondary-foreground": [0.91,  0.02,  155],
    muted:                  [0.27,  0.015, 155],
    "muted-foreground":     [0.72,  0.022, 155],
    accent:                 [0.30,  0.022, 155],
    "accent-foreground":    [0.93,  0.02,  155],
    gold:                   [0.80,  0.09,  78],
    "gold-foreground":      [0.88,  0.07,  78],
    destructive:            [0.65,  0.18,  28],
  },
  "dark-terracotta": {
    background:             [0.18,  0.022, 40],
    foreground:             [0.93,  0.01,  45],
    card:                   [0.23,  0.022, 40],
    "card-foreground":      [0.93,  0.01,  45],
    primary:                [0.72,  0.13,  40],
    "primary-foreground":   [0.14,  0.04,  38],
    secondary:              [0.28,  0.028, 40],
    "secondary-foreground": [0.93,  0.02,  45],
    muted:                  [0.28,  0.022, 40],
    "muted-foreground":     [0.72,  0.025, 42],
    accent:                 [0.32,  0.035, 40],
    "accent-foreground":    [0.93,  0.02,  45],
    gold:                   [0.80,  0.11,  45],
    "gold-foreground":      [0.90,  0.08,  45],
    destructive:            [0.65,  0.18,  28],
  },
  "dark-blue": {
    background:             [0.17,  0.020, 252],
    foreground:             [0.93,  0.01,  245],
    card:                   [0.22,  0.020, 252],
    "card-foreground":      [0.93,  0.01,  245],
    primary:                [0.70,  0.11,  245],
    "primary-foreground":   [0.12,  0.04,  250],
    secondary:              [0.27,  0.022, 250],
    "secondary-foreground": [0.93,  0.02,  245],
    muted:                  [0.27,  0.022, 250],
    "muted-foreground":     [0.72,  0.025, 248],
    accent:                 [0.30,  0.032, 250],
    "accent-foreground":    [0.93,  0.02,  245],
    gold:                   [0.78,  0.09,  245],
    "gold-foreground":      [0.90,  0.06,  245],
    destructive:            [0.65,  0.18,  28],
  },
  "dark-graphite": {
    background:             [0.16,  0.005, 250],
    foreground:             [0.93,  0.002, 250],
    card:                   [0.21,  0.005, 250],
    "card-foreground":      [0.93,  0.002, 250],
    primary:                [0.80,  0.012, 250],
    "primary-foreground":   [0.14,  0.006, 250],
    secondary:              [0.27,  0.006, 250],
    "secondary-foreground": [0.93,  0.002, 250],
    muted:                  [0.27,  0.006, 250],
    "muted-foreground":     [0.72,  0.005, 250],
    accent:                 [0.30,  0.009, 250],
    "accent-foreground":    [0.93,  0.002, 250],
    gold:                   [0.78,  0.012, 250],
    "gold-foreground":      [0.90,  0.006, 250],
    destructive:            [0.65,  0.18,  28],
  },
  "dark-olive": {
    background:             [0.18,  0.016, 110],
    foreground:             [0.93,  0.01,  110],
    card:                   [0.23,  0.016, 110],
    "card-foreground":      [0.93,  0.01,  110],
    primary:                [0.72,  0.10,  110],
    "primary-foreground":   [0.14,  0.035, 108],
    secondary:              [0.28,  0.022, 110],
    "secondary-foreground": [0.93,  0.01,  110],
    muted:                  [0.28,  0.022, 110],
    "muted-foreground":     [0.72,  0.018, 110],
    accent:                 [0.30,  0.033, 110],
    "accent-foreground":    [0.93,  0.01,  110],
    gold:                   [0.78,  0.09,  110],
    "gold-foreground":      [0.90,  0.05,  110],
    destructive:            [0.65,  0.18,  28],
  },
};

const checks = [
  ["foreground",          "background",  4.5, "Body text on bg"],
  ["foreground",          "card",        4.5, "Body text on card"],
  ["muted-foreground",    "background",  4.5, "Muted on bg"],
  ["muted-foreground",    "muted",       4.5, "Muted on muted surface"],
  ["muted-foreground",    "card",        4.5, "Muted on card"],
  ["primary",             "background",  3.0, "Primary on bg (control)"],
  ["primary-foreground",  "primary",     4.5, "Text on primary button"],
  ["secondary-foreground","secondary",   4.5, "Text on secondary"],
  ["accent-foreground",   "accent",      4.5, "Text on accent"],
  ["gold-foreground",     "background",  4.5, "Gold text on bg"],
  ["gold-foreground",     "card",        4.5, "Gold text on card"],
  ["destructive",         "background",  3.0, "Destructive on bg"],
];

let hasFailures = false;

for (const [themePalette, toks] of Object.entries(tokens)) {
  const failures = [];
  for (const [fg, bg, minRatio, label] of checks) {
    if (!toks[fg] || !toks[bg]) { failures.push(`  ⚠  MISSING: ${fg} or ${bg}`); continue; }
    const ratio = contrastRatio(lum(...toks[fg]), lum(...toks[bg]));
    if (ratio < minRatio) {
      failures.push(`  ✗ FAIL  ${label.padEnd(30)} ${fg}/${bg}  ratio=${ratio.toFixed(2)} < ${minRatio}`);
      hasFailures = true;
    }
  }
  if (failures.length > 0) {
    console.log(`\n═══ ${themePalette.toUpperCase()} ═══`);
    failures.forEach(f => console.log(f));
  } else {
    console.log(`✓ ${themePalette}`);
  }
}

console.log("\n" + (hasFailures ? "❌ FAILURES DETECTED" : "✅ ALL PASS"));

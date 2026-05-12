# ForestSentry — Nano Banana Pro icon prompts

Every prompt below targets **Gemini 3 Pro Image** (Nano Banana Pro). Paste a single JSON object into the model, generate, then remove the flat chroma-green background in any editor with a one-click magic-wand or chroma keyer.

**House style anchor (every icon must include):**
> "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render"

**House background rule (every icon must include):**
> "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles, no atmospheric haze, no rim light spillover. The icon itself contains zero #00FF00 — any green elements are shifted toward forest (#2A5C45), moss (#5A7F4A), or olive — so the chroma key extracts cleanly."

---

## 1. App icon — `assets/images/icon.png`

```json
{
  "user_intent": "ForestSentry app icon — a single Pixar-style pine tree on a forest-disc base, premium and mission-credible.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a single stylised conifer (blue pine / deodar silhouette) standing centred on a rounded disc base",
    "tree": {
      "form": "tapered conical, full canopy with subtle bough layers, soft cartoon proportions",
      "needles": "deep forest green (#2A5C45 to #5A7F4A) — never #00FF00, never #00FFFF",
      "trunk": "warm bark brown (#3D2E1F) with a soft cartoon highlight on the lit side"
    },
    "base": {
      "form": "thick rounded disc, slightly bevelled top, gentle moss tuft on the lip",
      "color": "deep forest green deepening to bark at the underside"
    },
    "accent": "a single tiny amber dot (#D97706) glowing on the canopy's upper-right, hinting 'alert / sentinel'"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "soft three-quarter key light from upper left, warm amber rim",
    "direction": "upper-left to lower-right",
    "quality": "soft, slightly diffused, contained inside the icon — zero spillover onto the background",
    "color_temperature_K": 4800
  },
  "composition": {
    "framing": "centred, generous safe-zone padding, tree fills ~70% of the canvas height",
    "angle": "slight three-quarter view (10° rotation) for depth",
    "focus_point": "the tree's canopy mass"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles, no atmospheric haze, no rim light spillover. The icon itself contains zero #00FF00 — green elements are shifted to forest (#2A5C45) and moss (#5A7F4A).",
  "imperfections": [
    "subtle bark texture on the trunk",
    "soft needle clusters with hand-painted-looking edges",
    "tiny micro-highlight on the rounded base lip"
  ],
  "negative_prompt": [
    "photorealistic forest scenery", "real photograph", "human figures",
    "text", "logo", "watermark", "flat 2D illustration",
    "neon green needles", "bright lime green", "any #00FF00 inside the icon",
    "drop shadow on background", "atmospheric haze",
    "extra trees", "second tree", "cluttered ground",
    "emoji", "sticker outline", "white outline", "stroke around the icon"
  ]
}
```

---

## 2. Splash icon — `assets/images/splash-icon.png`

```json
{
  "user_intent": "Splash screen monogram — same conifer mark from the app icon, slightly simplified, single-mass canopy.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a simplified single-mass conifer silhouette in deep forest green (#163A2C), no disc base, no amber accent",
    "form": "tapered cone, soft cartoon edges, single mass with subtle bough hints",
    "trunk": "short visible trunk bottom, warm bark brown (#3D2E1F)"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "single soft key light from above",
    "quality": "even, contained within the silhouette, no halo",
    "color_temperature_K": 5000
  },
  "composition": {
    "framing": "centred, 60% canvas height, generous padding for splash safe-zone",
    "focus_point": "the canopy mass"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles, no atmospheric haze, no rim light spillover. The icon itself contains zero #00FF00.",
  "imperfections": [
    "subtle needle texture in the canopy",
    "tiny natural asymmetry in the silhouette"
  ],
  "negative_prompt": [
    "background scenery", "ground line", "shadow under tree",
    "text", "logo", "watermark", "any #00FF00 inside the icon",
    "neon green", "fluorescent lime", "drop shadow on background",
    "emoji", "outline stroke"
  ]
}
```

---

## 3. Android adaptive icon foreground — `assets/images/android-icon-foreground.png`

```json
{
  "user_intent": "Android adaptive icon foreground — the conifer mark sized to live inside the 108dp safe zone; the OS adds the rounded mask.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "single conifer silhouette identical in form to the app icon but without the disc base; canopy filled with cartoon-bough layers in forest green (#2A5C45) to moss (#5A7F4A)",
    "trunk": "warm bark brown (#3D2E1F), short visible bottom",
    "accent": "no amber dot on the foreground layer"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "soft three-quarter key from upper left",
    "color_temperature_K": 4800
  },
  "composition": {
    "framing": "centred, mark fills only ~62% of canvas — the rest is safe-zone padding required by Android adaptive icons",
    "focus_point": "canopy"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles, no atmospheric haze, no rim light spillover. The mark itself contains zero #00FF00.",
  "imperfections": [
    "subtle bough texture",
    "minor bark wear hints on the trunk"
  ],
  "negative_prompt": [
    "disc base", "ground", "shadow under tree",
    "text", "watermark", "neon green", "any #00FF00 inside the mark",
    "outline stroke", "emoji"
  ]
}
```

---

## 4. Android adaptive icon background — `assets/images/android-icon-background.png`

```json
{
  "user_intent": "Android adaptive icon background layer — a deep forest disc tone, plain, no foreground shapes (the OS composes the conifer over it).",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a single rounded square plane of solid deep forest green (#0F2A1F) with the faintest cartoon-style noise to feel like a painted prop surface — not gradient, not detailed"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render — applied to a plain coloured surface, not a subject",
  "lighting": {
    "source": "even ambient",
    "quality": "no specular highlight, no glow"
  },
  "composition": {
    "framing": "full bleed",
    "focus_point": "none"
  },
  "background": "solid flat chroma green #00FF00 outside the icon area. The icon itself is pure #0F2A1F, no #00FF00 anywhere inside it.",
  "imperfections": [
    "extremely subtle painted texture across the surface"
  ],
  "negative_prompt": [
    "tree", "plant", "leaf", "any foreground subject",
    "text", "logo", "noise", "gradient",
    "neon green", "any #00FF00 inside the disc"
  ]
}
```

---

## 5. Android monochrome icon — `assets/images/android-icon-monochrome.png`

```json
{
  "user_intent": "Monochrome adaptive icon — pure-white silhouette of the conifer mark for themed icons on Android 13+.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "single conifer silhouette filled pure white (#FFFFFF), zero shading, zero gradient, cartoon-proportioned same as the colour foreground",
    "form": "exact same silhouette outline as the foreground icon, but solid white fill"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look — silhouette interpretation, flat fill, identical proportions to the foreground icon",
  "lighting": {
    "source": "none — flat silhouette"
  },
  "composition": {
    "framing": "centred, 62% canvas height to match the foreground safe-zone",
    "focus_point": "silhouette"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles, no atmospheric haze, no rim light spillover. The silhouette itself is pure #FFFFFF — no green inside it.",
  "imperfections": [],
  "negative_prompt": [
    "shading", "gradient", "colour fill", "outline stroke",
    "text", "logo", "noise", "neon green", "any #00FF00 inside the silhouette"
  ]
}
```

---

## 6. Empty-state — no trees yet (`assets/images/empty-trees.png`)

```json
{
  "user_intent": "Empty state illustration for the trees list when the user hasn't tagged anything yet — warm, encouraging, conservation-credible.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a small Pixar-style sapling growing out of a rounded clay pot, single new leaf unfolding at the top",
    "sapling": {
      "color": "fresh moss green (#5A7F4A) — never neon green",
      "form": "two new leaves and one curl, hopeful posture"
    },
    "pot": "warm terracotta cartoon pot with a single soft highlight"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "soft warm key from upper left",
    "color_temperature_K": 5000
  },
  "composition": {
    "framing": "centred, generous breathing room around the sapling",
    "angle": "slight three-quarter view"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles, no atmospheric haze. The sapling and pot contain zero #00FF00 — green elements are forest / moss / olive only.",
  "imperfections": [
    "tiny cartoon leaf-vein hints",
    "small terracotta texture on the pot rim"
  ],
  "negative_prompt": [
    "real photograph", "human figures", "text", "logo",
    "neon green", "fluorescent green", "any #00FF00 inside the illustration",
    "drop shadow on background", "ground line", "additional plants"
  ]
}
```

---

## 7. Empty-state — no inspections yet (`assets/images/empty-inspections.png`)

```json
{
  "user_intent": "Empty state for tree detail when there are no inspections logged — a Pixar-style leaf with a tiny lens hovering near it, hinting 'scan'.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a single broad cartoon leaf, oval, with subtle vein detail; a small floating magnifying lens disc hovers near the upper-right edge",
    "leaf_color": "deep forest green (#2A5C45) on the upper face, lighter moss (#5A7F4A) on the visible underside",
    "lens": "brushed-metal cartoon ring with a soft amber accent on the rim (#D97706)"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "soft warm key, gentle backlight to lift the leaf edge",
    "color_temperature_K": 4800
  },
  "composition": {
    "framing": "centred, leaf occupies ~60% of the canvas",
    "angle": "slight three-quarter view"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles. The leaf and lens contain zero #00FF00 — all greens are forest / moss / olive only.",
  "imperfections": [
    "subtle vein detail on the leaf",
    "tiny micro-imperfection on the lens rim"
  ],
  "negative_prompt": [
    "real photograph", "human figures", "text", "watermark",
    "neon green leaf", "fluorescent green", "any #00FF00 inside",
    "drop shadow on background", "extra leaves", "ground line"
  ]
}
```

---

## 8. Success — record saved (`assets/images/success-saved.png`)

```json
{
  "user_intent": "Peak-end success illustration — used as a 200×200 flourish in the toast after a tree or incident is saved.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a single Pixar-style checkmark badge — rounded disc, deep forest disc base, a chunky cartoon check inscribed in moss green",
    "badge": "deep forest green disc (#0F2A1F) with a subtle bark texture on the rim",
    "check": "chunky cartoon check stroke in moss (#5A7F4A) with a soft amber highlight on the inner corner"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "soft warm key from upper left, gentle amber rim",
    "color_temperature_K": 4800
  },
  "composition": {
    "framing": "centred, badge fills ~75% of canvas",
    "angle": "slight three-quarter view"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles. The badge contains zero #00FF00 — green elements are forest / moss only.",
  "imperfections": [
    "subtle bark-like texture on the disc rim"
  ],
  "negative_prompt": [
    "text", "logo", "watermark", "human figures",
    "neon green", "fluorescent green", "any #00FF00 inside the badge",
    "drop shadow on background", "extra icons", "outline stroke"
  ]
}
```

---

## 9. Alert — illegal logging incident (`assets/images/alert-incident.png`)

```json
{
  "user_intent": "Incident-state illustration — a Pixar-style cut tree stump with a small amber alert badge, used in the report flow.",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a stylised cut tree stump with concentric growth rings on top, a small floating amber alert badge above the stump",
    "stump": {
      "rings": "warm bark concentric circles, no human-rendered photoreal grain",
      "color": "warm bark (#3D2E1F)"
    },
    "badge": "small rounded triangle in amber (#D97706) with a single exclamation mark in deep forest (#0F2A1F)"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "soft key with subtle warm rim on the badge",
    "color_temperature_K": 4600
  },
  "composition": {
    "framing": "centred, stump bottom-centre, badge top-right",
    "angle": "three-quarter view"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles. The illustration contains zero #00FF00.",
  "imperfections": [
    "subtle wood-ring asymmetry",
    "tiny bark-fragment detail on the lip"
  ],
  "negative_prompt": [
    "real photograph", "blood", "violence", "human figures", "weapons",
    "text", "logo", "watermark", "neon green",
    "any #00FF00 inside the illustration", "drop shadow on background"
  ]
}
```

---

## 10. Marker — protected zone (`assets/images/zone-marker.png`)

```json
{
  "user_intent": "Map marker — a Pixar-style shield with a small inscribed conifer, used as the visual cue for protected zones in marketing and onboarding (not on the actual map).",
  "meta": {
    "model": "gemini-3-pro-image-preview",
    "aspect_ratio": "1:1",
    "resolution": "2K",
    "quality": "ultra_photorealistic"
  },
  "subject": {
    "primary": "a chunky cartoon shield in deep forest green (#163A2C) with a small inscribed conifer silhouette in moss (#5A7F4A) at the centre",
    "shield": "rounded heater shape, soft bevel, subtle bark grain on the edges",
    "accent": "a tiny amber dot at the top of the shield, hinting 'sentinel watch'"
  },
  "style": "3D animated cartoon style, semi-realistic Pixar-inspired look, realistic textures with cartoon proportions, cinematic lighting, warm color grading, expressive characters, high-quality 3D render",
  "lighting": {
    "source": "soft three-quarter key, warm amber rim",
    "color_temperature_K": 4800
  },
  "composition": {
    "framing": "centred, shield fills ~70% of canvas",
    "angle": "slight three-quarter view"
  },
  "background": "solid flat chroma green #00FF00 background, completely flat, no gradient, no shadow, no texture, no glow, no bloom, no particles. The shield contains zero #00FF00.",
  "imperfections": [
    "subtle bevel highlight on the shield rim",
    "tiny grain on the inscribed conifer"
  ],
  "negative_prompt": [
    "text", "logo", "watermark", "human figures",
    "neon green", "fluorescent green", "any #00FF00 inside the shield",
    "drop shadow on background"
  ]
}
```

---

## How to use these prompts

1. Open Nano Banana Pro (Gemini 3 Pro Image) in your model UI.
2. Paste a single JSON object as the prompt.
3. Generate. If the leaf-green hue creeps toward neon, regenerate with `"neon green"` and `"any #00FF00 inside"` re-emphasised in the negative prompt.
4. Save the output as a PNG.
5. Open in any editor (Photopea, Photoshop, Affinity, Pixelmator, Krita) → use the magic-wand or chroma-key tool → click anywhere on the bright chroma green → delete → save as transparent PNG.
6. Drop the result into `mobile/assets/images/` under the matching filename.

Total cost-of-icons: ~10 generations and 20 minutes.

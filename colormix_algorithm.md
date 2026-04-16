# Color Mixing Algorithm — Analysis & Improvement Plan

## Discussion Context

### The Single Biggest Failure: Additive vs Subtractive Mixing

The current engine averages RGB channels linearly — that's how light mixes on a screen (additive). Oil paint is subtractive: pigment particles absorb specific wavelengths of light. When you mix Ultramarine Blue and Cadmium Yellow on your palette, you get a vivid green because the blue absorbs red and the yellow absorbs blue — only green reflects from both. The current algorithm would give you a brownish-gray. This is the root cause of most "incorrect" recipes your users see.

### The Solution: Kubelka-Munk Spectral Mixing

This is the 1931 theory that the entire professional paint industry uses — ArtistAssistApp uses an empirical model based on the Kubelka-Munk theory to simulate real color mixing, requiring spectral reflectances rather than RGB. Applying KM to oil paints achieves an average error of ~1.49 ΔE₀₀ — barely perceptible to the human eye. Compare that to the current 40–90% accuracy estimate.

The accessible implementation: **spectral.js** is a lightweight JavaScript/TypeScript library for realistic pigment mixing using Kubelka-Munk theory — it generates a spectral reflectance curve from any RGB triplet and uses those curves to mix colors via K/S coefficients. It's MIT licensed and works in browser environments. This can power the mixing engine via a JS bridge or you can port the math directly (it's about 200 lines of float math).

### The Brand/Pigment Code Problem Is Actually Solvable

Understanding a paint's **Color Index Name** is the best way to know what's actually inside the tube — the same pigment codes appear across brands, so PB29 on a Winsor & Newton tube is the same pigment as PB29 on a Gamblin or Rembrandt tube. Color names are not standardized between brands, but Color Index codes are — so building the pigment database around CIN codes (PB29, PR108, PY42) and then mapping brand names to those codes gives universal cross-brand coverage.

### Tinting Strength Is a Critical Practical Issue

The highest tinting colors are Phthalo Blue and Phthalo Green — next are Naphthol Red and Quinacridone Magenta, while Hansa Yellow Medium has very little tinting strength. The current algorithm treats 1 part of every pigment as equal. A recipe that says "2 parts Phthalo Blue + 2 parts Yellow Ochre" would actually produce near-black on a palette. The improved algorithm adjusts presented volume ratios after finding the spectral match.

### What the Algorithm Is Solving

You pick a color from a reference photo → the algorithm finds the best oil paint mixing recipe → you mix those physical paints on your palette → the result on your canvas matches the color you picked.

That's the entire goal. The KM spectral approach is specifically designed for this because it models how pigment absorbs and reflects light on a physical surface — not how colors look on a screen.

### Simultaneous Contrast

A real phenomenon called simultaneous contrast (or chromatic induction). A gray surrounded by red looks greenish; the same gray surrounded by blue looks orange. The color you pick from a reference photo is the actual RGB value of that pixel, but your eye perceives it differently because of surrounding colors.

Two practical approaches:

1. **Do nothing algorithmically** — just add a small note in the UI like "colors may appear different in context due to surrounding hues." Most professional tools (Golden MXR, ArtistAssistApp) take this approach. The recipe is still correct for the isolated color value.
2. **Show the color in isolation before mixing** — display a swatch of the picked color against a neutral gray background before showing the recipe, so the artist can judge the true color before committing to a mix.

Option 2 is a small UI addition that adds real value for oil painters.

---

## Pigment Database — Expanded & Corrected

### Current vs Improved: Visual Comparison

```
CURRENT ALGORITHM                    IMPROVED ALGORITHM
───────────────────                  ───────────────────
🔴 + 🔵 = Linear RGB average =      🔴 + 🔵 = Spectral/KM mixing = natural
    muddy brown                          colors
```

**Problem:** Color blending math is wrong. The current engine averages RGB channels linearly. Blue + Yellow = greenish gray on screen, but on a palette it gives vivid green. Red + Blue gives brown-purple in RGB, but a painter gets violet.

**Solution:** Replace linear RGB blending with Kubelka-Munk spectral mixing. Convert each pigment RGB to a spectral reflectance curve (37 wavelength samples, 380–730 nm), mix K/S (absorption/scattering) coefficients weighted by concentration, then convert back to sRGB. This is the industry standard used by Golden Artist Colors' MXR and ArtistAssistApp.

**Problem:** Distance is measured in RGB, not perceptual space. The weighted Euclidean (2R² + 4G² + 3B²) formula doesn't match how humans perceive color difference. A ±20 shift in blue looks very different from a ±20 shift in red, but the formula doesn't account for this properly.

**Fix:** Measure color distance in **CIELAB (ΔE₀₀)** — the international standard for perceptual color difference. ΔE₀₀ ≤ 2 is invisible to most human eyes. ΔE 2–5 is noticeable. >5 is the "yellow alert" threshold used by the Golden MXR. This replaces the weighted RGB Euclidean entirely.

**Problem:** Tinting strength is ignored. Phthalo Blue (PB15) is roughly 30× stronger than Yellow Ochre (PY42). The current algorithm treats 1 part of both as equal. A recipe of "1 part Phthalo Blue + 3 parts Yellow" actually produces near-black, not green.

**Fix:** Assign each pigment a **tinting strength multiplier** (derived from real paint data). When computing effective concentration: `c_effective = c_nominal / tinting_strength`, then renormalize. A recipe of "10 parts Yellow Ochre + 1 part Phthalo Blue" is then physically meaningful.

**Problem:** Opacity/transparency is ignored. Alizarin Crimson is transparent; Cadmium Red is opaque. A transparent pigment mixed with white gives a very different result than an opaque one. The current algorithm treats both identically, producing wrong lightening behavior.

**Fix:** Each pigment gets an **opacity property** (0.0–1.0). In KM theory, transparent pigments have low scattering (S) and high absorption (K). This affects how the mix lightens/darkens — a transparent pigment added to white produces a tint; an opaque one covers.

**Problem:** Only 20 generic color names, no pigment codes. "Cadmium Red Medium" by Winsor & Newton (PR108) and "Cadmium Red Medium" by Gamblin (also PR108) are the same pigment, but Rembrandt's "Cadmium Red Medium" actually uses PR108 + PR101. The current system has no way to distinguish these, and artists can't map recipes to their specific brand.

**Fix:** Anchor everything to **Color Index codes** (PB29, PR108, PY42 etc.) — the universal standard printed on every tube. Pigments are defined by codes, not names. Brand equivalence table maps: brand name + CIN. Artists see "French Ultramarine (PB29) — works for any brand."

**Problem:** Pigment database has gaps critical to oil painters. Missing: Cadmium Orange, Titanium White vs Zinc White distinction, Lead White, Flake White, Transparent Earth pigments (PR101 transparent vs opaque), Naples Yellow, Cobalt Blue, Manganese Blue, Permanent Rose. Many oil painters' core palettes can't be matched.

**Fix:** Expand to **35–49 pigments** grounded in oil painting practice. Include semiopaque variants of key colors (Ultramarine vs Cerulean vs Cobalt), both transparent and opaque earth variants, and key whites (PW1 Lead, PW4 Zinc, PW6 Titanium) which behave very differently in all mixes.

**Limitation:** Ratios are by volume, not by weight. For oil painting, mixing by volume is standard. However, some pigments (especially lead white, bone black) have dramatically different densities — weight ratios would be more precise. For now, volume ratios with a tinting-strength correction is the practical compromise for most artists.

---

## Expanded Pigment Database

| Name | CIN Code | Tinting Str | Opacity | Oil Paint Notes |
|------|----------|-------------|---------|-----------------|
| Titanium White | PW6 | Medium | Opaque | Chalky in mixes, use sparingly |
| Zinc White | PW4 | Low | Semi-trans | Cooler, better for glazing tints |
| Lead White / Flake | PW1 | Medium | Opaque | Warm, excellent handling in oils |
| Cadmium Yellow Pale | PY35 | Medium | Opaque | Warm lemon yellow |
| Cadmium Yellow Deep | PY37 | Medium | Opaque | Warm orange-yellow |
| Hansa Yellow (Cad alt) | PY97 | Medium | Semi-trans | Modern cad-free alternative |
| Yellow Ochre | PY43 | Low | Semi-opaque | Earth yellow, very stable |
| Raw Sienna | PBr7 | Low | Semi-trans | Warm golden earth |
| Cadmium Orange | PO20 | Medium | Opaque | Pure orange, commonly used |
| Cadmium Red Light | PR108 | Medium | Opaque | Warm red, orange bias |
| Cadmium Red Deep | PR108 | Medium | Opaque | Deeper warm red |
| Naphthol Red | PR170 | High | Semi-trans | Modern cad-free alternative |
| Alizarin Crimson | PR83 | High | Transparent | Cool red, purple bias, glazing |
| Quinacridone Magenta | PV19 | High | Transparent | Permanent alizarin replacement |
| Burnt Sienna | PBr7 | Medium | Semi-trans | Warm reddish earth |
| Burnt Umber | PBr7 | Medium | Semi-opaque | Dark warm brown earth |
| Raw Umber | PBr7 | Low-med | Semi-trans | Cool greenish earth |
| Transparent Red Oxide | PR101 | Medium | Transparent | Glazing, deep burnt sienna feel |
| Venetian/Indian Red | PR101 | Medium | Opaque | Strong opaque earth red |
| Naples Yellow | PBr7 | Low | Opaque | Warm muted yellow, classic oil |
| French Ultramarine | PB29 | High | Semi-trans | Warm blue, violet bias |
| Cobalt Blue | PB28 | Medium | Semi-trans | Neutral, classic all blue |
| Cerulean Blue | PB35 | Low-med | Opaque | Cool green-leaning blue |
| Phthalo Blue (GS) | PB15 | Very high | Transparent | Powerful, use in tiny amounts |
| Prussian Blue | PB27 | Very high | Transparent | Deep cool blue, green tint |
| Viridian Green | PG18 | Medium | Transparent | Cool blue-green, classic oil |
| Phthalo Green (BS) | PG7 | Very high | Transparent | Powerful, use in tiny amounts |
| Sap Green | PG36+PY138 | High | Transparent | Convenience mix, landscape |
| Chromium Oxide Green | PG17 | Low | Opaque | Muted, earthy green |
| Ivory Black | PBk9 | Medium | Opaque | Warm black, slow dryer in oils |
| Mars Black | PBk11 | Medium | Opaque | Dense cool black, fast dryer |
| Payne's Gray | PBk9+PB67 | High | Transparent | Convenience mix, very useful |

---

## Algorithm Pipeline — Improved

### Step 1: Search and Scoring

All searching and scoring happens in **CIELAB space (D65 illuminant)**. ΔE₀₀ gives perceptually accurate color distance. This replaces the weighted RGB Euclidean formula.

### Step 2: Single Pigments

Test all pigments as pure colors. If ΔE₀₀ ≤ 2.0, return immediately — perfect single-pigment match. This stays the same as current, just with better distance metric.

### Step 3: Two-Pigment Mixes (Kubelka-Munk)

For each pigment pair, convert both to spectral reflectance curves using Burns' method. Mix K/S coefficients at 8–10 ratio steps (1:9, 2:8, ... 9:1) using Kubelka-Munk. Convert mixed curve back to sRGB → CIELAB. Apply tinting strength correction to presented ratios. ~1,900 candidates.

### Step 4: Three-Pigment Mixes

Mix two-pigment mix + one modifier (white, black, or a third pigment). Expanded from current 3-ingredient to allow more natural recipes. Scored with ingredient penalty: `score = ΔE₀₀ + (N_ingredients × 0.5)`.

### Step 5: Post-Processing

After finding best spectral match, convert the theoretical concentration ratios to practical volume ratios adjusted for tinting strength. "2 parts Titanium White + 1 part Phthalo Blue" instead of "0.5 parts White + 0.5 parts Phthalo Blue".

### Step 6: Brand Mapping

Every recipe returns pigment Color Index codes alongside names. A brand table maps: "French Ultramarine (PB29) — works with Winsor & Newton, Gamblin, Rembrandt, Williamsburg, Michael Harding, Daniel Smith, Sennelier." Artist can match to any brand they use.

---

## Current vs Improved — Summary

### Current (RGB Linear)

- Typical accuracy: 40–90%
- Transparent + white = wrong lightening
- Strong pigments (Phthalo) dominate wrong
- No brand guidance for artists

### Improved (Kubelka-Munk)

- Industry benchmark: ΔE₀₀ avg 1.5–3.0
- Blue + yellow → natural green ✓
- Yellow + blue = natural green ✓
- Transparent pigments tighten correctly ✓
- Tinting strength corrects ratios ✓
- CIN codes = works with any brand ✓

---

## Known Issues Found & Fixes Applied

### Bug: Single-Pigment Fallacy for Near-Black Warm Colors (April 2026)

**Symptom:** Picking a very dark warm color like RGB(18, 13, 4) / #120D04 — a brownish-black from a dark sweater or shadow — returns "1 part Ivory Black" as the recipe. Ivory Black is RGB(26, 26, 26) — a perfectly *neutral* black with zero warm undertone. A painter mixing pure Ivory Black would get a cold, dead shadow instead of the warm dark the reference photo shows.

**Root cause — two compounding failures:**

1. **Midpoint prefilter was too aggressive.** Step 2 (two-pigment mixes) checks the Lab midpoint of each pigment pair against the target. For dominated mixes like 95% Ivory Black + 5% Burnt Umber, the 50/50 midpoint is far lighter/warmer than the actual mix result, so the pair Ivory Black + Burnt Umber was *skipped entirely* — the engine never even tested it.

2. **Earth tones weren't treated as modifiers.** Step 3 (tints/shades) only tested White, Black, and Payne's Gray as modifiers. Burnt Umber (RGB 61, 42, 28) and Raw Umber (RGB 86, 72, 46) — the natural warm dark pigments a painter would instinctively reach for — were never tried as tint/shade additions to blacks.

**Fixes applied to `mixingEngine.ts`:**

1. **Smarter prefilter:** If *either* pigment in a pair is already within ~50 ΔE Lab of the target, always test that pair regardless of the midpoint heuristic. This ensures close-but-not-quite pigments (like Ivory Black near a dark target) always get paired with undertone-correcting pigments.

2. **Expanded modifier list:** Burnt Umber and Raw Umber are now included as modifiers in addition to being color candidates. The engine now tests mixes like "Ivory Black + a touch of Burnt Umber" in the tints/shades pass, producing recipes like "4 parts Ivory Black + 1 part Burnt Umber" for warm dark colors.

**Correct result:** RGB(18, 13, 4) should now produce a recipe approximating "Ivory Black + Burnt Umber" — which is exactly the mix a trained oil painter would reach for when painting a warm shadow or dark earth tone.

### Design Principle: When to Trust Single-Pigment Results

The engine uses a `SINGLE_PIGMENT_THRESHOLD` of ΔE₀₀ ≤ 2.0 for early return — if any single pigment is within 2.0 ΔE₀₀ of the target, it's an imperceptible match and we return immediately. This is correct behavior.

The subtlety is in the **scoring system**: `score = ΔE₀₀ + (N_ingredients × 0.5)`. A single pigment gets a 0.5 penalty; a two-pigment mix gets 1.0. This means a single pigment with ΔE₀₀ = 4.0 (score 4.5) beats a two-pigment mix with ΔE₀₀ = 3.5 (score 4.5). The complexity penalty intentionally favors simpler recipes — simpler is better when the accuracy difference is marginal.

**But this fails when the undertone is wrong.** A ΔE₀₀ of 3–5 in the dark value range can represent a significant *hue* difference that a painter will notice. Ivory Black has zero warm undertone; #120D04 has a clear brown cast. The ΔE₀₀ says "close enough" but the painter's eye says "that's the wrong color family."

**Guiding rule:** The complexity penalty is appropriate for *lightness* differences (slightly too light/dark is fine with one pigment) but not for *hue/chroma* differences in the dark range. The fix above addresses this by ensuring the engine actually *tests* the corrective two-pigment mixes rather than skipping them via prefilter, so the scoring system can properly compare them.

### Categories of Colors Where Single-Pigment Output Should Be Scrutinized

| Color Zone | Risk | Why |
|------------|------|-----|
| Near-black with warm/cool undertone | High | Blacks are neutral; real darks have temperature. Engine must test black + earth modifier pairs. |
| Muted earth tones (desaturated browns, olives) | Medium | Single earth pigments rarely match exact target hue. Usually needs 2-pigment earth blend. |
| Very light pastels | Medium | Single white is never right — always needs a tinting pigment. But the ΔE₀₀ from pure white can be deceptively low for near-whites. |
| Saturated pure hues | Low | Single pigments genuinely are the right answer — Cadmium Red, Ultramarine Blue, etc. |

### Implemented: Undertone-Aware Scoring (April 2026)

The complexity penalty is now **dynamic** based on hue analysis of the best single-pigment match.

**How it works (`mixingEngine.ts`):**

After Step 1 (single pigment search), the engine checks whether the best single pigment has a **hue mismatch** with the target. A mismatch is detected when:

1. The target is chromatic (chroma ≥ 2.0 in Lab) but the best single pigment is achromatic (e.g., Ivory Black for a warm dark target)
2. The target and best single pigment have a hue angle difference > 15°
3. The target is a light pastel (L > 90 and chromatic) — pure White is never the right answer for a tinted color

**When a hue mismatch is detected:**
- Complexity penalty drops from **0.5 → 0.15** per ingredient
- This allows a 2-pigment recipe with ΔE₀₀ = 3.0 (score 3.3) to beat a single pigment with ΔE₀₀ = 3.5 (score 4.0)
- The single-pigment early-return (ΔE₀₀ ≤ 2.0) is also **suppressed** — even a "close" match keeps searching if the hue is wrong

**When hue matches (normal case):**
- Standard 0.5 penalty applies — simpler recipes are preferred when accuracy is similar
- Single-pigment early-return at ΔE₀₀ ≤ 2.0 works as before

**Net effect:** The engine now acts like a trained painter — it won't accept a neutral black for a warm shadow, won't suggest pure white for a pastel, and won't use the wrong earth tone just because it's "close enough" in ΔE₀₀. But for saturated pure hues (Cad Red, Ultramarine) where single pigments genuinely are the right answer, it still returns them efficiently.

**New utilities added to `colorScience.ts`:**
- `labHue(lab)` — hue angle in degrees [0, 360)
- `labChroma(lab)` — saturation distance from neutral axis
- `hueDifference(h1, h2)` — angular distance [0, 180]

---

## Implementation Status (April 2026)

### Fully Implemented (100%)

| Feature | Files | Notes |
|---------|-------|-------|
| Kubelka-Munk spectral mixing | `spectralMixing.ts` | Burns/LHTSS method, 38 samples (380–750nm), K/S coefficients |
| CIEDE2000 (ΔE₀₀) | `colorScience.ts` | Validated against Sharma et al. 34 canonical test pairs |
| Pigment database (32 pigments) | `Pigments.ts` | CIN codes, calibrated RGB, tinting strength, opacity |
| Tinting strength correction | `mixingEngine.ts` | Per-pigment multiplier, GCD-normalized display ratios |
| Opacity/transparency modeling | `spectralMixing.ts` | Modulates scattering in KM mix |
| 5-step pipeline | `mixingEngine.ts` | Single → Two-pigment → Tints/shades → Three-pigment → Ratio adjustment |
| Smart prefiltering | `mixingEngine.ts` | Lab-space distance culling with bypass for close pigments |

### Enhanced Beyond Original Plan

| Feature | Files | Notes |
|---------|-------|-------|
| Undertone-aware scoring | `mixingEngine.ts` | Dynamic complexity penalty (0.5 → 0.15) when hue mismatch detected |
| Earth tone modifiers | `mixingEngine.ts` | Burnt Umber + Raw Umber as modifiers in tint/shade pass |
| Reasoning engine | `mixingEngine.ts` | Context-aware explanations for single-pigment results |
| Hue mismatch detection | `mixingEngine.ts`, `colorScience.ts` | Achromatic check, hue angle > 15°, pastel detection |
| Match quality labels | `MixingRecipeBottomSheet.tsx` | Qualitative labels (Perfect Match → Approximate) based on ΔE₀₀ thresholds |

### Not Yet Implemented

| Feature | Priority | Effort | Notes |
|---------|----------|--------|-------|
| Brand mapping (Step 6) | Medium | Medium | CIN codes shown but no brand lookup/equivalence UI |
| Simultaneous contrast UI | Low | Small | Show picked color on neutral gray before recipe |
| Drying color shift note | Low | Tiny | "May dry slightly darker" disclaimer in recipe UI |

---

## What's Still Limited

### Drying Color Shift
Oil paints dry slightly darker (especially transparent earths, burnt umber, raw sienna). No algorithm can perfectly predict this without widely published spectral measurements per brand. Best approach: add a note in UI — "May dry slightly darker."

### Pigment Load Variation Between Brands
Pigment load variation between brands: Artist-grade Gamblin Cadmium Red has more pigment per mL than student-grade. KM spectral mixing averages out across brands. The CIN code approach gets you 85–95% of the way there; the last 10–15% is brand-specific pigment load.

### Layering / Glazing Behavior
Oil painting often involves transparent pigments glazed over dried layers. A recipe for "the wet mix on a palette" ≠ "how it looks applied as a glaze over a dried layer." This is a separate feature — would need opacity model in UI.

---

## Future Enhancements — Roadmap

### Tier 1: High Value, High Conversion Impact

#### 1. My Palette — User's Personal Pigment Kit
**What:** Let users select which pigments they actually own (by brand + color). The algorithm searches only within their kit.
**Why:** This is the #1 feature request in paint mixing apps. An artist with 8 tubes doesn't want recipes using pigments they don't have. Eliminates the "I don't own that" friction that kills engagement.
**Conversion hook:** Free users get 1 saved palette kit. Pro unlocks unlimited kits + brand-specific adjustments.
**Implementation:** New screen in Tools tab. Store selected pigment IDs in Supabase. Pass filtered palette to `calculateMix()`. ~2-3 days.

#### 2. Brand Equivalence Table (Step 6 from Plan)
**What:** Map CIN codes to specific brand names. Recipe shows: "French Ultramarine (PB29) — Winsor & Newton, Gamblin, Rembrandt, Old Holland."
**Why:** Bridges the gap between algorithm output and paint store shelf. Artists see their exact brand in the recipe → trust increases → they actually mix it → retention.
**Conversion hook:** Free shows generic names + CIN. Pro shows brand-specific matches from their preferred brands.
**Implementation:** JSON lookup table (~200 entries). Brand selector in settings. Render brand chips below recipe. ~1-2 days.

#### 3. Recipe Sharing & Social Proof
**What:** Generate a shareable card from a mixing recipe — reference image crop + color swatch + recipe text + Palette Pro branding.
**Why:** Organic acquisition. Artists share on Instagram, Pinterest, YouTube tutorials. Each share = free ad with built-in social proof.
**Conversion hook:** Free users get watermarked cards. Pro gets clean cards with their name/handle.
**Implementation:** Extend existing `ShareCardGenerator` with recipe layout. ~1 day.

#### 4. Acrylic & Watercolor Mode
**What:** Toggle between oil, acrylic, and watercolor mixing behavior. Different pigment databases, different KM scattering parameters, different ratio conventions.
**Why:** 3× the addressable market. Most paint mixing apps are oil-only. Acrylic painters are a much larger casual market (cheaper supplies, more hobbyists). Watercolor has a passionate niche with high willingness to pay.
**Conversion hook:** Oil mode free. Acrylic + Watercolor = Pro.
**Implementation:** Separate pigment databases per medium. Adjust opacity/scattering defaults. UI toggle in recipe view. ~3-5 days.

#### 5. Mixing Tutorial Mode — Step-by-Step Guided Mixing
**What:** Instead of just showing "3 parts X + 1 part Y", show an animated step-by-step: "Start with X on your palette → add a small amount of Y → mix until uniform → compare to target." Include visual ratio guides (blob size comparisons).
**Why:** Beginners don't know HOW to physically mix paint. This bridges the gap between recipe and result. Massive differentiator — no competitor does this.
**Conversion hook:** First 3 tutorials free. Unlimited = Pro.
**Implementation:** Pre-built Lottie animations per mixing pattern. Dynamic text overlays. ~3-4 days.

### Tier 2: Medium Value, Retention & Depth

#### 6. Color Harmony Suggestions
**What:** After generating a palette, suggest complementary, analogous, triadic, and split-complementary harmonies. Show which pigment mixes produce each harmony color.
**Why:** Adds planning value beyond just "match this pixel." Artists use the app for composition decisions, not just color matching. Increases session time and return visits.
**Implementation:** Hue angle math on existing Lab values. Render harmony wheel UI. ~2 days.

#### 7. Glazing & Layering Simulator
**What:** Show what a transparent pigment looks like glazed over a dried base layer (e.g., "Alizarin Crimson glazed over Yellow Ochre"). Use KM theory with two-layer model.
**Why:** Glazing is fundamental to classical oil painting. This is technically sophisticated and positions the app as a serious tool, not a toy. No competitor offers this.
**Conversion hook:** Pro only. Reinforces "this app understands painting, not just colors."
**Implementation:** Two-layer KM model (reflectance of base + transparent top). New UI panel. ~3-4 days.

#### 8. Color History & Mixing Journal
**What:** Auto-save every recipe the user views. Searchable history with the reference image crop, target color, recipe, and match quality. Add notes field ("worked great for shadows", "too warm in practice").
**Why:** Artists mix the same colors repeatedly. History = instant recall. Notes make it personal. Creates long-term lock-in — switching to another app means losing your journal.
**Implementation:** Supabase table (user_id, target_hex, recipe_json, image_crop_url, notes, timestamp). History tab in Tools. ~2 days.

#### 9. Offline Mode
**What:** Cache the mixing engine + pigment database for fully offline recipe generation. Only palette saving and sharing require connectivity.
**Why:** Artists paint in studios, plein air, workshops — often without reliable internet. Offline capability removes the #1 excuse not to use the app during actual painting sessions.
**Implementation:** Engine already runs client-side (no API calls). Just need to handle Supabase offline gracefully + cache images. ~1-2 days.

#### 10. Limited Palette Challenge
**What:** "Mix any color using only 3 pigments" — e.g., Ultramarine + Cadmium Yellow + Alizarin Crimson (Zorn palette). Algorithm constrains search to user-selected subset.
**Why:** Gamification + educational value. Limited palette exercises are fundamental to art education. Teachers would recommend the app. Creates shareable content ("I matched 50 colors with just 3 pigments!").
**Conversion hook:** Free gets 1 challenge palette. Pro gets custom palette constraints.
**Implementation:** Filter `UNIVERSAL_PALETTE` to selected subset before calling `calculateMix()`. Challenge UI + stats tracking. ~2-3 days.

### Tier 3: Long-Term / Advanced

#### 11. Real Spectral Data from Measured Pigments
**What:** Replace Burns' RGB-derived spectra with real measured spectral reflectance curves from published pigment databases (e.g., ColourLex, RIT Munsell, manufacturer datasheets).
**Why:** Burns' method is a good approximation (~ΔE₀₀ 1-3 average), but real measured spectra would push accuracy to ΔE₀₀ < 1 for most mixes. This is the difference between "good" and "professional-grade."
**Effort:** High — need to source, validate, and format 32+ spectral curves. But the engine already supports arbitrary spectral input.

#### 12. Camera-Calibrated Color Picking
**What:** Use a color calibration card (X-Rite ColorChecker or printed target) to build an ICC profile for the user's specific phone camera. Apply the profile to correct picked colors before mixing.
**Why:** Phone cameras vary wildly in color reproduction. An iPhone 15 and a Pixel 8 will give different RGB values for the same physical color. Calibration eliminates this variable.
**Effort:** High — requires camera profile math, calibration UI, profile storage.

#### 13. AR Paint Preview
**What:** Point camera at canvas → overlay the mixed color in real-time to preview how it looks in context (lighting, surrounding colors).
**Why:** Solves the simultaneous contrast problem visually. Artist sees the color in situ before committing paint to canvas. Extremely impressive demo for marketing.
**Effort:** High — ARKit/ARCore integration, real-time color overlay, lighting compensation.

#### 14. Community Recipe Database
**What:** Users can publish and rate recipes. "Best mix for Vermeer skin tones" becomes a shared resource. Curated by the community, moderated by the team.
**Why:** Network effects. The more users contribute, the more valuable the app becomes. Creates switching cost and organic content for SEO/ASO.
**Effort:** Medium-high — Supabase tables, moderation flow, search/discovery UI.

#### 15. AI-Assisted Color Analysis
**What:** Instead of picking a single pixel, select a region of the image. AI identifies the dominant color, shadow color, highlight color, and reflected light color — then generates a "scene recipe" with 4-6 mixes covering the full value range.
**Why:** A single pixel is rarely what an artist needs. They need the color family for a surface — face, fabric, sky. This transforms the app from "pixel picker" to "painting assistant."
**Effort:** High — needs segmentation model or smart averaging, multi-recipe UI.

---

## Competitive Landscape & Differentiation

| Feature | Palette Pro | Golden MXR | ArtistAssistApp | Coolors |
|---------|-------------|------------|-----------------|---------|
| KM spectral mixing | Yes | Yes | Yes | No |
| CIEDE2000 accuracy | Yes | Yes | Yes | No |
| Photo → recipe | Yes | No | Yes | No |
| Tinting strength | Yes | Yes | Partial | No |
| Opacity modeling | Yes | No | Partial | No |
| CIN codes | Yes | Yes | Yes | No |
| Undertone-aware scoring | Yes | No | No | No |
| Reasoning/explanations | Yes | No | No | No |
| Brand mapping | Planned | N/A (Golden only) | Partial | No |
| My Palette (user kit) | Planned | No | Yes | No |
| Acrylic/watercolor | Planned | No | Partial | No |
| Glazing simulator | Planned | No | No | No |
| Recipe sharing cards | Planned | No | No | Yes (palettes) |

---

## Implementation References

- **spectral.js** — MIT-licensed JS library for KM mixing (GitHub)
- **Burns' method** — RGB to spectral reflectance conversion
- **CIELAB ΔE₀₀** — CIE 2000 color difference formula
- **Golden Artist Colors MXR** — professional paint mixing reference tool
- **ArtistAssistApp** — uses empirical KM model for oil paint mixing
- **ColourLex** — measured spectral reflectance data for historical pigments
- **RIT Munsell Color Science Lab** — spectral data resources

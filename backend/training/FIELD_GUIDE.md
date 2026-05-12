# ForestSentry — Field Data Collection Guide

The hardest part of training a real model isn't the training — it's the labelled corpus. This guide is the operator playbook for collecting that corpus while running normal patrols. Every photo captured with the **Training contribution** toggle on, with a confirmed verdict, becomes a training sample for the next model.

This is the headline brief deliverable that only the field team can do — the software is ready, the data isn't.

---

## How much data do you need?

A defensible minimum, before the first real training run:

| Class | Minimum samples | Stretch goal | Why this matters |
|---|---|---|---|
| healthy | 200 | 500 | Negative class — without enough healthies, every photo gets pulled toward "stressed" |
| stressed | 200 | 500 | Most subtle class; needs the most examples to be learnable |
| diseased | 200 | 500 | Where the model adds the most field value (early intervention) |
| pest-damaged | 200 | 500 | Smallest natural prevalence; collect deliberately during pest-activity seasons |

**Total: ~800 confirmed photos before the first credible production model.** Below ~40 samples per class the training script exits politely; below ~100 the model will overfit; at 200+ you start getting useful validation accuracy (~75%+); at 500+ you start outperforming the bundled PlantVillage placeholder by a meaningful margin.

Plan for **roughly 30 patrol-hours** of dedicated data collection (one ranger, 4–5 transects per visit, ~10 confirmed scans per transect) to hit the minimum.

---

## What each class looks like (Nathia Gali conifer focus)

The bundled PlantVillage model was trained on crop leaves (apple, tomato, etc.) — it knows nothing about Pakistani conifer species. Your corpus shifts the model to recognize **Blue pine (Pinus wallichiana)**, **Deodar cedar (Cedrus deodara)**, and **Silver fir (Abies pindrow)** — the dominant species in the Nathia Gali pilot zone.

### healthy

What you're looking for:
- Saturated green to blue-green needle color across the whole frond
- Needles intact, no chewed or browned tips
- Even bark texture without bleeding pitch
- Crown looks full from below (no obvious gaps against sky)

Capture tips:
- Fill the frame with a needle cluster, not a whole branch
- Daylight, not direct sun (which blows out the green channel)
- Tap "Confirm" if the model already said Healthy — confirmation is signal too

### stressed

What you're looking for:
- Faded or pale green needles (chlorosis — not yet brown)
- Slight tip browning under 1 cm
- Reduced needle density on south-facing aspects (drought signal)
- Surface dust visible on needles (suggests prolonged dry conditions)

Capture tips:
- Frame includes both the stressed tip AND a transition to healthier base material — gives the model an easier learning signal
- Note in the inspection: "south aspect", "post-monsoon", "drought year" — useful metadata for the training script's future filters

### diseased

What you're looking for:
- Necrotic patches (brown / black, well-defined edges)
- Resin bleeding from bark fissures (canker)
- Powdery white or orange coating (mildew, rust)
- Curled, distorted, or stunted new growth
- Witches' brooms (dense unnatural twig clusters)

Capture tips:
- Include the lesion centre AND the lesion edge in one frame
- For bleeding resin / canker: capture the bark surface, not just the needles
- When in doubt between "stressed" and "diseased", file "diseased" if there's a discrete lesion edge (stressed is diffuse; diseased is bounded)

### pest-damaged

What you're looking for:
- Chewed needle margins (irregular, not the natural needle taper)
- Round bore holes in the bark or shoots
- Visible insect presence: bark beetles, scale insects, web masses
- Skeletonized needles (only the central vein remains)
- Frass (sawdust-like insect debris) at the base of the trunk

Capture tips:
- Get close — pest damage is small-scale; a wide shot loses the signal
- If you spot a bore hole, capture the hole AND a few cm of surrounding bark
- Note the pest species in the inspection if you can identify it (helps the training script learn species-pest correlations later)

---

## Collection workflow (the loop that builds the corpus)

1. **In Settings, toggle Training contribution = ON.** Once. Don't toggle off mid-session; that breaks the training signal.
2. **Walk a transect.** Pick a route that crosses different aspects, age classes, and species. Don't only sample healthy trees from the easy-to-reach edge — bias kills models.
3. **At each stop:**
   - Tag the tree (species + GPS + photo) — once per tree, doesn't re-tag on re-visits
   - **Inspect a leaf** — capture a clear needle / leaf shot
   - Look at the model's verdict
   - **Confirm if right, correct if wrong** — tap the right pill, hit "Log correction"
4. **Aim for ~10 confirmed scans per transect.** More than that and ranger fatigue starts producing sloppy labels (worse than no labels).
5. **Return to signal** at the end of the patrol — local records sync to Supabase automatically. Verify in Settings → Sync debug that the queue is empty.

Pace yourself: 3 transects per visit, 2 visits per week, 10 scans per transect = **60 confirmed samples / week / ranger.** Two rangers running the loop for 8 weeks gets you to the 800-sample threshold.

---

## Sampling discipline (avoid these biases)

A model is only as good as its training set. Common biases that destroy field accuracy:

- **Aspect bias** — only capturing south-facing trees because they're easier to reach. North aspects have different stress signals. Sample evenly.
- **Time-of-day bias** — only capturing in the morning. Light changes everything. Sample across the day.
- **Species bias** — only photographing Blue pine because it's the most common. Capture Deodar and Silver fir proportionally.
- **Healthy bias** — only photographing healthy trees because they're prettier. The model needs to see disease and pest damage to learn them. Force yourself to log diseased / pest cases when you find them, even if they're "obvious."
- **Distance bias** — every capture at the same distance. Vary close-up to mid-range so the model is scale-invariant.
- **Operator bias** — one ranger always overriding to "stressed." Rotate operators if possible; the training script weights operator agreement when multiple rangers confirm the same tree.

---

## When the corpus is ready

Verify in Supabase:

```sql
select label, count(*) from public.training_samples_leaf group by label;
```

You want each class ≥ 200. Then trigger a training run per [`backend/training/README.md`](README.md) — the script handles everything from corpus pull to model upload to `model_versions` insert.

After promotion (`select public.wwf_model_promote('leaf-health-v1.1.0');`), the mobile app downloads the new model on next launch and starts using it for predictions. The loop continues — operators now correct *your* model, and v1.2 will be even better.

---

## Privacy & consent

- The Training contribution toggle is opt-in **per device**, not project-wide. Make sure rangers understand what they're sharing before they enable it.
- Photos with identifiable people (timber thieves, villagers) should never be uploaded — capture only the tree, not the person.
- EXIF GPS is stripped before upload to the `training-photos` bucket. The training script never sees operator coordinates.
- The training corpus is researcher-only access (RLS-enforced). Field rangers cannot browse the training samples bucket.

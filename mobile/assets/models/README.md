# On-device leaf-health model

Drop your TensorFlow Lite model here as `leaf-health.tflite` and update
`mobile/src/features/inspections/labels.ts` if the class order differs.

Until a `.tflite` is present, the classifier runs a deterministic HSV heuristic
on the captured leaf photo. Both code paths produce the same `ClassifyResult`
shape, so the swap is genuinely zero-change for callers.

See `zero-to-deploy.md` for the full WWF-model integration checklist.

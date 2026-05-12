# Contributing to ForestSentry

Thanks for being here. ForestSentry is a small, readable codebase built to invite contributions. This file is short on purpose.

## Before you start

- Read the [README](./README.md) — especially the **Architecture** and **Design philosophy** sections.
- Skim [`zero-to-deploy.md`](./zero-to-deploy.md) so you can run the dev server end-to-end in ~25 minutes.
- Skim `mobile/src/components/` — the design system is the easiest entry point.

## What's the highest-value contribution?

If you're a botanist or forest scientist: a trained `.tflite` leaf-health model. See `mobile/assets/models/README.md`.

If you're a React Native engineer: pick anything from the **Roadmap** in the README. The V1.1 items are scoped to fit a weekend.

If you're new to RN: empty-state polish, copy tightening, and accessibility audits are all great first PRs.

## Local setup

```sh
git clone https://github.com/aashir-athar/forest-sentry.git
cd forest-sentry/mobile
npm install
npx expo start
```

## Branches

- `feat/<thing>` for new features
- `fix/<thing>` for bug fixes
- `chore/<thing>` for refactors / tooling / docs
- Optional date suffix: `feat/<thing>-2026-05-12`

Never push directly to `main`. PRs only.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add Bluetooth caliper integration`
- `fix: prevent zone polygon save when fewer than 3 points`
- `chore: bump expo-router to latest sdk-54 patch`
- `docs: clarify TFLite swap procedure`

## PRs

- Open against `main`.
- Describe what changed and why (the "why" matters more than the "what").
- Link the related issue.
- Keep PRs focused — one logical change at a time.

## Code style

- TypeScript strict, no `any`, no `@ts-ignore`.
- No `console.log` in shipped code — use `errorReporter.info/warn/capture`.
- No `ActivityIndicator` or any spinner — use `<Skeleton />`.
- No hardcoded hex colors in components — use theme tokens.
- No emojis. Anywhere.
- Always wrap new screens with `Screen` and the appropriate `SafeAreaView` edges.
- Add a `// Lever:` comment at the top of any new non-trivial screen naming the psychological principle the screen pulls.

## Reviews

PRs need one approving review before merge. The author handles the merge.

## Code of conduct

Be kind. Conservation work is hard enough without unkindness.

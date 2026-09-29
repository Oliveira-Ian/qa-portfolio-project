# Versioning and Releases

How a version number is chosen, how a release is cut, and how a Docker image gets traced back to
the commit it was built from. Everything here is automated except one decision: **when** to release.

Related: `docs/process/development-workflow.md` covers branches, commits and pull requests;
`docs/adr/0010-release-versioning-and-automation.md` records why this shape was chosen.

---

## 1. The model in one screen

```
feature/* ─┐                                       ┌─ hotfix/* (urgent fix on a published version)
fix/*     ─┼─ squash ─→ develop ── merge commit ─→ main ── release PR ─→ tag vX.Y.Z + GitHub Release
docs/* …  ─┘                (integration)         (stable)   (release-please)        │
                                ▲                                                    ▼
                                └──────────── sync PR (merge commit) ◄──── Docker Hub images
```

| Piece | Rule |
|---|---|
| **Version scheme** | [SemVer 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`, one version for the whole product |
| **Where the bump comes from** | Conventional Commit messages on `main` — never typed by hand |
| **Who cuts the release** | release-please, when its release PR is merged |
| **When to release** | Only when you promote `develop` to `main` and merge the release PR. Merging a feature never releases |
| **Tag** | `vX.Y.Z`, created together with the GitHub Release |
| **Images** | Published to Docker Hub only when a Release is created |

There is **one version for the product**, not one per app. `apps/web`, `apps/api` and
`packages/schemas` are built and shipped together (one compose stack, coupled through the shared
schemas), so a per-app version would only describe combinations that never run. The root
`package.json` carries the version; the workspace packages stay `0.0.0` and private.

---

## 2. From commit to version

The pull request **title** is the commit message: PRs into `develop` are squash-merged with the
title as the commit subject (repository setting), so the title has to be a valid Conventional Commit.
`.github/workflows/pr-validation.yml` rejects a PR whose title is not.

| Commit | Bump | Appears in the CHANGELOG |
|---|---|---|
| `fix: …` | PATCH (`1.4.2` → `1.4.3`) | Bug Fixes |
| `feat: …` | MINOR (`1.4.2` → `1.5.0`) | Features |
| `feat!: …`, `fix(api)!: …` | MAJOR (`1.4.2` → `2.0.0`) | ⚠ BREAKING CHANGES |
| `perf:`, `revert:` | PATCH | Performance / Reverts |
| `docs:`, `refactor:`, `test:`, `ci:`, `chore:`, `style:`, `build:` | none on their own | hidden |

The highest bump among the commits since the last release wins. A release with only hidden types
does not get a release PR at all.

**Everything release-please needs must be in the title.** Squash merges are configured with an empty
commit body (so the PR description does not duplicate entries in the CHANGELOG), which means
footers such as `BREAKING CHANGE:` or `Release-As:` written in a PR description never reach `main`.
Mark a breaking change with `!` in the title, and force a number with `release-as` (below).

### What counts as MAJOR here

The product's public surface is small, so MAJOR is reserved for changes a consumer cannot absorb
without acting:

- a breaking change to the HTTP API contract or to `@oliveira/schemas` that other products consume;
- a database migration or environment variable that needs a manual step before the new version
  starts;
- removing a feature or permission that existed in the previous version.

If in doubt, ask whether someone running the previous version can update by pulling the new image
and nothing else. If they cannot, mark it with `!`.

### Pre-releases

SemVer allows `1.5.0-rc.1`. This project does not use them by default. If a release ever needs a
candidate, set `"release-as": "1.5.0-rc.1"` and `"prerelease": true` in `release-please-config.json`
for that release, and remove both once its release PR is merged. Docker never moves
`latest` or the `X` / `X.Y` tags for a version that contains `-`.

---

## 3. Finding the current version

| Where | How |
|---|---|
| Latest published version | `gh release view --json tagName` or the Releases page |
| The commit behind a version | `git rev-list -n 1 vX.Y.Z` |
| What the checkout is at | `git describe --tags` |
| In the repository | `"version"` in the root `package.json`, and `.release-please-manifest.json` |
| In a running container | `docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.version" }}' <image>` |

`package.json`, the manifest and `CHANGELOG.md` are edited only by release-please, in the release
PR. Do not change them by hand.

---

## 4. Cutting a release

You decide when. Everything after step 1 is automatic or a merge button.

1. **Promote.** Ask for a PR from `develop` to `main` (title like `chore: promote develop to main`).
   CI runs the full suite: lint and typecheck, unit, API, E2E and the compose smoke test. Merge it
   with a **merge commit**.
2. **Release PR.** On that push to `main`, release-please opens or updates
   `chore(main): release X.Y.Z`, with the version bump and `CHANGELOG.md`. Review the changelog and
   the number. CI runs on this PR too. Merge it with **squash**.
3. **Release.** Merging the release PR makes release-please create the `vX.Y.Z` tag and the GitHub
   Release (immutable once published).
4. **Images.** In the same workflow run, the web and api images are built from the released commit,
   scanned with Trivy and pushed to Docker Hub (section 6).
5. **Sync.** The workflow opens `chore: sync main into develop after vX.Y.Z`, so the release commit
   returns to `develop`. Merge it with a **merge commit**, never squash.

The release PR can sit open as long as you like; more commits merged into `main` update it.

### Why a merge commit for `develop` → `main`

`main` only accepts what `develop` already contains. A squash merge would write a new commit on
`main` that never exists on `develop`, so the next promotion would replay commits that were already
released and the tags would not appear in `develop`'s history. A merge commit keeps the two graphs
joined. Everything else is squashed, which keeps each PR one commit with a Conventional title.

---

## 5. Hotfix

For a critical problem in the published version while `develop` holds unreleased work:

1. Branch `hotfix/<issue>-<slug>` from `main` (`0` if there is no issue).
2. Fix it, with the tests it needs. Open a PR into `main`; the title must be `fix: …`.
3. Merge with **squash**. release-please opens a PATCH release PR; merge it as in section 4.
4. The sync PR brings the fix into `develop`. Resolve any conflict there.

A hotfix is a normal `fix` — it needs no special tooling.

---

## 6. Docker images

Two images per release, built from the existing Dockerfiles (`apps/web/Dockerfile`,
`apps/api/Dockerfile`). The names in `docker-compose.yml` are for local builds and are unchanged.

| Image |
|---|
| `ianoliveira14/oliveira-foundation-web` |
| `ianoliveira14/oliveira-foundation-api` |

| Tag | Moves? | Use it for |
|---|---|---|
| `1.5.0` | never | Deployments. The exact release; this is the one to pin |
| `1.5` | yes, to the newest `1.5.z` | Following patch fixes automatically |
| `1` | yes, to the newest `1.y.z` | Following minor releases (not published for `0.x`) |
| `latest` | yes | Local experiments only |
| `sha-<40-char commit>` | never | Finding out exactly which commit an image came from |

Every image also carries the OCI labels `org.opencontainers.image.revision` (commit),
`org.opencontainers.image.version` and `org.opencontainers.image.source` (this repository).

### Traceability

```
commit ─ PR + CI run ─ release PR ─ tag vX.Y.Z ─ GitHub Release ─ image X.Y.Z / sha-<commit> ─ Trivy SARIF
```

`vX.Y.Z` points at the exact commit the image was built from, and the image says so in its labels.
The Trivy result for the release is in the Security tab under `trivy-release-web` and
`trivy-release-api`.

### Published versions are never overwritten

- The publish job stops if `<image>:<version>` already exists on Docker Hub.
- Publishing only runs in the run that created the Release, never on a plain merge.
- If one image fails, use **Re-run failed jobs** in the Actions UI: it re-runs only the failed
  matrix leg, and the guard above protects the one that already succeeded.
- Optional extra layer: enable immutable tags on the Docker Hub repositories if the plan offers it.

---

## 7. Setup that lives outside the repository

| What | Where | Notes |
|---|---|---|
| `RELEASE_PLEASE_TOKEN` | Repository secret | Fine-grained PAT limited to this repository: **Contents, Pull requests and Issues: read and write**. Needed because PRs opened with `GITHUB_TOKEN` do not trigger CI, and CI is a required check. **The PAT expires** — when the release workflow fails on authentication, renew it and update the secret. Nothing is left half-done by an expired token |
| `DOCKERHUB_TOKEN` | Repository secret | Docker Hub Access Token, Read & Write |
| `DOCKERHUB_USERNAME` | Repository variable | `ianoliveira14` |
| Immutable releases | Repository settings | On. A published Release and its tag cannot be edited or moved |
| Rulesets | Repository settings → Rules | `main` and `develop` require a PR, resolved threads and the CI checks below. Required approvals are 0 while there is a single maintainer — raise them to 1 when a second person joins |

Required checks on `main` and `develop`: `Lint & Typecheck`, `Unit Tests (Vitest)`,
`API Tests (Playwright + PostgreSQL)`, `E2E Tests (Playwright + PostgreSQL)`,
`Docker Compose Build & Smoke Test`, `Validate pull request`. The `docker-dev.yml` jobs are not
required because they only run when Docker or dependency files change.

---

## 8. When something looks wrong

| Symptom | Cause / fix |
|---|---|
| No release PR appears after promoting | Only hidden commit types (`docs`, `ci`, `chore` …) since the last release |
| The release PR proposes the wrong number | A commit has the wrong type or a missing `!`. Force the number with `"release-as": "X.Y.Z"` in `release-please-config.json` (remove it after the release PR is merged) |
| Release workflow fails at the release-please step | The PAT expired or lost a permission (section 7) |
| Publish fails at "Refuse to overwrite" | That version is already on Docker Hub. This is the guard working; investigate before doing anything |
| The sync PR has conflicts | Resolve on the PR's branch. Typically `package.json` or `CHANGELOG.md` edited on `develop` by hand |

---

## 9. Later: deployment

Deployment is deliberately not part of this pipeline yet. When it arrives (a free host first, a VPS
later), it should deploy an **exact version tag** such as `1.5.0`, never `latest`, and be triggered
by the Release being published — that keeps "what is running" and "what was released" the same
statement.

---
id: PIX-20
type: story
status: active
title: "E2E: dashboard empty-state test via a dedicated no-device QA user"
---

Follow-up from the E2E suite build. The empty-state assertion ('No devices yet') conflicts with the per-test device-seeding fixture in the same auth context. Clean answer: a SEPARATE QA user that owns zero devices, with its own storageState, so the empty-state test isn't fighting the seed/sweep used by the device-owning QA user (qa@bargelt.com). Small: add a second programmatic login (e.g. qa-empty@bargelt.com) in globalSetup writing a second storageState, and one spec using that project/state asserting the empty-state dashboard renders. Deferred intentionally during the fixture + add-device + teams-save batch.
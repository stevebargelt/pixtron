---
id: PIX-27
type: story
status: done
title: Upgrade Next.js (14.2.35) to clear high-severity CVEs
---

**Closed:** 2026-06-02. Commit `cb40598`.

web-admin runs next@14.2.35, which carries multiple HIGH-severity advisories (HTTP request deserialization DoS, Server Components DoS, i18n middleware/proxy bypass, WebSocket SSRF) plus moderates (image-optimizer DoS, request smuggling, cache poisoning). All fix only via a major Next.js upgrade (npm audit fix --force → next@15/16), which is a breaking migration.

Until then, CI gates Security Audit (npm audit / audit-ci) and Dependency Review are set to block on CRITICAL only (not high), so they don't red every PR on these framework advisories — see ci.yml / code-quality.yml. After upgrading, tighten both back to high.

Scope: bump Next.js (and eslint-config-next) to a patched major; fix breaking changes; re-run the suite + E2E; then restore audit thresholds to high.
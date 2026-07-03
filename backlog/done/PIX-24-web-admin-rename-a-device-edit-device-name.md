---
id: PIX-24
type: story
status: done
title: "web-admin: rename a device (edit device name)"
---

**Closed:** 2026-06-02. Commit `c51b9dd`.

Users can't change a device's name after creation. Add the ability to edit devices.name.

- UI: an editable name field / inline edit on the device Settings tab (near the existing Danger Zone delete).
- API: PATCH (or PUT) /api/device/[id] accepting { name }, owner-scoped via RLS (user-scoped client), mirroring the delete-device route.
- Validate non-empty / trimmed; reflect the new name in the dashboard + header.

Small UX gap noticed 2026-05-29.
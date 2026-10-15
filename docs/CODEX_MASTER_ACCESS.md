# Codex master access and provenance

**Status:** configuration reference only. The full product master remains private and is **not stored in this public GitHub repository**. This file is intentionally safe to publish.

## Master sources

| Source | Authority | How Codex obtains it |
| --- | --- | --- |
| Owner's approved, versioned Busy Does It Product Master (Word) | Product outcomes, scope, commercial/customer requirements and design philosophy | Current Codex task attachment or a separately authorised, accessible **private** source. Actual document must be opened. |
| `ARCHITECTURE.md` at the actual working ref | Current documented architecture, limitations and development status | Read directly from the checked-out repository. Verify important claims against source and tests. |
| `docs/DEVELOPMENT_SWEEP_AND_ARCHITECTURE_POLICY.md` | Permanent code health, master governance, testing and safety policy | Read directly from checked-out repository. |
| `AGENTS.md` | Standing instructions for Codex work in this repository | Automatically applicable when this file is present on the working branch. |
| `docs/CODEX_PRODUCT_BRIEF.md` | Public, abbreviated orientation | Accessible in Git; **not** a replacement for the complete Word master. |

### New owner-approved product master revision — V22.19 (15 October 2026)

- **Approved addition:** Evidence-led SEO/site-health diagnosis, safe website repairs and verification of actual published results (product master Section 41; corresponding public technical contract in `ARCHITECTURE.md`).
- **New Word filename:** `Busy_Does_It_Master_V22_19_Evidence_Led_SEO_Diagnostics_and_Repair.docx`.
- **SHA-256 of newly generated Word bytes:** `30cbb123f044720fc62fbf13296f19cce9490a35f04618a3e6b38e07c9218808`.
- **Validation:** original V22.18 source matched the verified SHA-256 below; V22.19 preserves the 19 original tables, revises the version/date and adds an evidence-based subsection. It was structurally checked and visually rendered in the originating ChatGPT conversation.
- **Private source status:** the V22.19 DOCX has been generated in the owner's ChatGPT conversation. **Upload to the persistent private Library has not been confirmed** (an attempted upload failed with a container-session error). Do **not** claim it is in the Library, mounted in Codex or publicly hosted; the owner must supply the file/authorised private source to a new Codex thread. The V22.18 Library checkpoint below remains the most recent independently verified stored source until a later Library upload is confirmed.
- **Implementation status:** documentation/requirements only. No implemented SEO crawler, Google connection, repair, ranking result or production readiness is implied by the document revision.

### Most recent owner-approved Word master **verified during this setup**

- **Version:** V22.18, updated **14 October 2026**.
- **Filename:** `Busy_Does_It_Master_V22_18_Intelligent_Work_Priorities_and_Capacity.docx`.
- **Private source:** owner's ChatGPT Library; a ZIP of this version was supplied to the existing Codex Cloud conversation on 15 October 2026.
- **Reference SHA-256 of original DOCX bytes:** `a33be3cadcc6f93d9c22e31a40cae5cabbba45d1d30e804c6a0313c0d8f1fad0`.
- **Scope checked at setup:** readable Word file, 1,194 paragraphs and 19 tables. Do not infer that any particular Codex thread can access it.

This version is a **dated checkpoint, not an instruction to disregard future approved masters**. Confirm whether a later owner-approved version exists before each substantial mission. Check version and, for a claimed identical snapshot, its checksum. Do not mistake a converted copy for byte-identical Word source.

## New Codex thread startup

1. Check `AGENTS.md`, this manifest, both master sources and the latest relevant source/PR chain.
2. Ask whether a newer owner-approved Word master exists. The owner can **attach the current Word master to the new Codex conversation** or give Codex access to an explicitly authorised private source.
3. Actually open and read the full Word document. Report version, document identity and any incompatibility with the public manifest.
4. If unavailable, **do not assert a successful full product-master preflight**. Request access before substantial product-scope changes; scope-neutral offline review/planning may continue.
5. Use `docs/CODEX_PRODUCT_BRIEF.md` only for provisional orientation.

**Important:** A file in the owner's ChatGPT Library or a different Codex chat is **not automatically mounted in every new Codex thread**. `AGENTS.md` provides instructions, not access rights.

## Longer-term private-source option

To eliminate repeated manual attachments, the owner can choose a **private, explicitly connected document source** accessible to the Codex environment, with a stable location or versioned path and authorised read-only permissions. Verify Codex's actual access before relying on this. Do not create public mirrors, turn on private access to live customer data, or assume GitHub public repo files can safely hold the private master.

When a new owner-approved master is created, update this provenance record (version, filename, source method and checksum), while preserving the original Word file in private version history.

## Short mission prompt once source access is verified

> Continue Busy Does It development using the applicable AGENTS.md, full latest approved Word Product Master, GitHub ARCHITECTURE.md and permanent development policy. Review the current compatible PR dependency chain. Complete multiple substantive connected sweeps, reuse existing systems, verify each sweep, preserve progress in isolated draft PRs, and report the evidence. Additional external spending £0; no production, publication, paid builds, live migrations or protected-branch merges without separate approval.

This prompt **does not** grant permission to skip the full product-master preflight or to work indefinitely after the task ends.

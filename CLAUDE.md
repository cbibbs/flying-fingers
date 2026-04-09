## Required Workflows

This project uses the **hyperpowers** plugin. All developers (human and AI) MUST follow these workflows:

- **Before writing code:** Use `hyperpowers:brainstorming` to refine requirements into a bd epic.
- **Planning:** Use `hyperpowers:writing-plans` to create detailed implementation plans.
- **Implementation:** Use `hyperpowers:test-driven-development` (RED-GREEN-REFACTOR cycle).
- **Execution:** Use `hyperpowers:executing-plans` to implement iteratively with substep tracking.
- **Debugging:** Use `hyperpowers:debugging-with-tools` (tools first, fixes second).
- **Bug fixes:** Use `hyperpowers:fixing-bugs` (complete workflow from discovery to closure).
- **Refactoring:** Use `hyperpowers:refactoring-safely` (change → test → commit cycle).
- **Completion:** Use `hyperpowers:verification-before-completion` before claiming any task is done.

Do not skip these workflows. "Simple" tasks still follow the process — that's how they stay simple.

## Specification-First Rule

**Do not implement features until `plans/active/<slug>/plan.md` accurately describes what you will build.** This is a hard prerequisite — not a suggestion.

Before writing code:
1. Read the current `plan.md` for the work item
2. If the plan is missing or outdated, update it first
3. If you plan to deviate from it, update `plan.md` to reflect your actual approach before writing code

After implementation:
1. Append an **"Implementation (As-Built)"** section to `plan.md` documenting what was actually built
2. Include: file paths, key implementation details, and any deviations from the original spec
3. Mark success criteria as checked (`[x]`) or note which were not met and why

`plan.md` is the source of truth for what a feature does. If the code and the plan disagree, one of them is wrong — fix it.

**Documentation in `docs/` must also be updated.** New features need:
- A specification in `docs/specifications/` (what and why)
- A design in `docs/design/` (how)
- An ADR in `docs/decisions/` if a non-obvious technical choice was made

## Issue Tracking

Uses the **hyperpowers `plans/` directory** exclusively. **All work items, bugs, features, chores, and decisions MUST be tracked as plan directories — never in TODO.md, GitHub Issues, inline comments, or ad-hoc lists.** GitHub Issues is disabled on this repo.

Layout (see `plans/README.md` for the active backlog index):

```
plans/
├── README.md                  # backlog index
└── active/<slug>/
    ├── plan.md                # approved spec — the source of truth
    ├── tasks.md               # rolling backlog (Now / Next / Later / Blocked / Done)
    └── context.md             # discoveries, file refs, resume notes (added when work starts)
```

Workflow:
- **Find work:** read `plans/README.md` and the `Now` section of any `tasks.md`
- **Start work:** move the item to `Now` in the relevant `tasks.md`, add `context.md` if missing
- **New work:** create `plans/active/<slug>/plan.md` before writing any code (see the Specification-First Rule above)
- **Finish work:** move the item to `Done` in `tasks.md` and append the "Implementation (As-Built)" section to `plan.md`

Do not use `gh issue create` or any GitHub Issues tooling. Do not use `bd`. If you discover work that isn't tracked, create a plan directory for it before starting.

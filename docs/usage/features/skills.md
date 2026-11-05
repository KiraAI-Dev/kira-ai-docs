# Skills Feature

Skills are reusable instruction bundles that teach KiraAI how to handle a particular kind of task. They are made available to the agent as a list of names and descriptions; when a request matches a Skill, the agent reads that Skill's `SKILL.md` and follows its instructions.

## Skill format

Each Skill is a directory under `data/skills/` and must contain a `SKILL.md` file with YAML frontmatter:

```text
data/skills/
└── release-notes/
    ├── SKILL.md
    └── references/
```

```md
---
name: release-notes
description: Prepare concise release notes from merged changes.
---

# Release notes workflow

Instructions for the agent go here.
```

The frontmatter `name` and `description` are required. Keep the description specific enough for the agent to decide when the Skill applies. Supporting files may be kept in the same directory and referenced from `SKILL.md`.

## Add and manage Skills

1. Open **Plugins** in WebUI and select the **Skills** tab.
2. Click **Upload**, choose a `.zip` archive containing a Skill directory, and confirm the upload.
3. Click **Refresh** to rescan `data/skills/` after adding or changing files manually.
4. Use the switch on a Skill card to enable or disable it.

The same page can export a Skill as a ZIP archive or delete it. Uploading a Skill whose directory name already exists is rejected; export or rename the existing Skill first if you need to preserve it.

## Scope and behavior

Enabled Skills are listed in the agent's instructions. Their full `SKILL.md` content is read only when the request clearly matches the Skill, helping keep normal conversations focused.

Use the **Scope** tab to apply a Skill globally, allow it only for selected sessions, or deny it for selected sessions. Disable a Skill or narrow its scope when it should not influence a particular conversation.

## Safety and troubleshooting

- Treat a Skill as executable guidance: its instructions can cause the agent to use tools and create files. Review every `SKILL.md` and bundled file before enabling it.
- Do not place secrets in a Skill's description, instructions, examples, or archive.
- If a Skill is missing, verify that the folder is directly under `data/skills/`, contains a valid `SKILL.md`, and that its frontmatter has both `name` and `description`; then refresh the list.
- If the agent does not use a Skill, make its description and activation conditions more specific, and confirm it is enabled and allowed for the current session.

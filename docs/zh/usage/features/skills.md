# Skills 功能

Skills 是可复用的指令包，用于教会 KiraAI 如何处理某一类任务。Agent 会先获得 Skills 的名称和描述列表；当请求匹配某个 Skill 时，才会读取该 Skill 的 `SKILL.md` 并遵循其中的指令。

## Skill 格式

每个 Skill 都是 `data/skills/` 下的一个目录，且必须包含带 YAML frontmatter 的 `SKILL.md`：

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

frontmatter 中的 `name` 和 `description` 为必填项。请让描述足够具体，以便 Agent 判断何时应使用该 Skill。支持文件可与 `SKILL.md` 放在同一目录，并在其中引用。

## 添加和管理 Skills

1. 在 WebUI 中打开 **插件**，切换到 **Skills** 标签页。
2. 点击 **上传**，选择包含 Skill 目录的 `.zip` 压缩包并确认上传。
3. 手动添加或修改 `data/skills/` 中的文件后，点击 **刷新** 重新扫描。
4. 使用 Skill 卡片上的开关启用或禁用它。

同一页面还可将 Skill 导出为 ZIP 压缩包或删除它。若上传的 Skill 目录名已存在，系统会拒绝上传；如需保留原 Skill，请先导出它或为新 Skill 更名。

## 范围和行为

已启用的 Skills 会列在 Agent 的指令中。只有请求明确匹配时才会读取完整 `SKILL.md`，从而让普通对话保持聚焦。

使用 **范围** 标签页可将 Skill 设为全局可用、仅允许指定会话，或拒绝指定会话使用。当 Skill 不应影响某段对话时，请禁用它或缩小其会话范围。

## 安全与排障

- Skill 应视为可执行的指导：其中的指令可能使 Agent 使用工具或创建文件。启用前请审查每个 `SKILL.md` 及其附带文件。
- 不要在 Skill 描述、指令、示例或压缩包中存放密钥。
- Skill 未显示时，确认目录直接位于 `data/skills/` 下、包含有效的 `SKILL.md`，且 frontmatter 同时具有 `name` 和 `description`，然后刷新列表。
- Agent 未使用某个 Skill 时，请让其描述和触发条件更明确，并确认该 Skill 已启用且当前会话被允许使用。

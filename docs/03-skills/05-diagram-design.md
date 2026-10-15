---
title: diagram-design SKILL
description: 编辑级图表设计 SKILL —— 45 种图型、自包含 HTML+SVG、反"AI 味"设计系统（55k+ stars）
sidebar_position: 5
# 更新日期: 
---

# diagram-design SKILL

> 来源：[cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design)（MIT 许可，55k+ stars）
> 官网：[diagramdesign.dev](https://diagramdesign.dev) · 图表画廊：[cathrynlavery.github.io/diagram-design](https://cathrynlavery.github.io/diagram-design/)

## 本章目标

- 理解这个 SKILL 如何把"画一张图"工程化为：选型 → 语义模式 → 复杂度预算 → 几何规则 → 发送前检查的完整流水线。
- 学习大规模 SKILL 的组织方式：SKILL.md 主文件 + 45 份分型 reference + 资产模板 + Python 验证脚本。
- 借鉴其"品味门禁"（taste gate）和可验证设计规则的做法。

## 正文

### 1. SKILL 定位

| 属性 | 内容 |
| --- | --- |
| name / version | `diagram-design` v2.6 |
| 类型 | 产出型 SKILL（生成自包含 HTML + 内联 SVG 的"编辑级"图表） |
| 规模 | 45 种视觉类型，主 SKILL.md 约 30KB（受其 ADR-0004 字节上限约束），配 40+ reference 文件、HTML 模板、Python 校验脚本 |
| 跨宿主 | 同时发布 Claude Code / Codex / Copilot / Cursor 等 marketplace 插件清单，共享同一 skill 根目录 |
| 安装 | `npx skills add cathrynlavery/diagram-design` |

一句话卖点："Editorial diagrams. No shadows. No Mermaid slop."——不做流程图语法渲染器，而是让 agent 以设计师的排版决策手写 SVG。

### 2. 核心理念：删除优先，密度 4/10

- **最高质量动作通常是删除**：两个总是一起出现的节点合并为一个；布局已能表达的关系去掉连线。
- **强调色是编辑手段不是信号系统**：珊瑚色每张图最多 1–2 个焦点元素。
- **目标密度 4/10**：超过 9 个节点，多半应该拆成两张图（概览 + 细节）。
- **动笔前先问**：读者从这张图学到的，是否多于一段写得好的文字？不是就别画。

### 3. 三层选型：表格 → 语义模式 → 视觉类型

1. **先排除**：三列表格能说清的用表格；一两个形状的"图"直接写成句子。
2. **行为承载语义时先选语义模式**（`semantic-patterns.md`）：如"扇入队列/瓶颈 → Data flow"、"补偿性安全层 → Layer stack"、"生命周期阶段图 → 状态机"。模式拥有语义原语和更紧的预算，类型只负责布局语法。
3. **再按"你要展示什么"查 45 类型速查表**选视觉类型：架构图、架构 delta、时序、状态机、ER、瀑布、桑基、鱼骨、Wardley、用户旅程、服务蓝图、爆炸轴测图等。

选型后必须加载对应 type reference；渲染前用一条短消息声明：所选类型、尺寸预设、复杂度预算将裁掉什么——让用户有机会改方向。

### 4. 设计系统与反"AI 味"清单

可换肤设计：`style-guide.md` 是唯一颜色/字体真源，SKILL.md 只写语义角色（`paper`/`ink`/`muted`/`accent`/`link`），首次出图有"风格门禁"——检测到默认 token 未定制时暂停询问（给网址 / 本地设计系统 / 粘贴 token / 保持默认 / 读取已存 profile）。

通用反模式表（AI slop 特征）：暗色底+青紫霓虹、JetBrains Mono 当万能"开发者"字体、所有节点同款方框、图例漂在图区内、箭头标签无遮罩矩形、竖排文字、三个等宽摘要卡片、任何阴影、`rounded-2xl` 大圆角、珊瑚色到处标"重点"。

### 5. 六条强制连接线规则（几何即质量）

1. **只允许正交连线**——非共轴节点用 `r=8` 直角圆肘，禁止斜线。
2. **标签间隙**——箭头标签（≤14 字符、全大写）坐在不透明遮罩上，距线 6–10px，且不压在线上。
3. **不重叠**——平行路由偏移 ≥12px，交叉处用跨越桥。
4. **扇出挂点**——同一盒子边缘每个连接器独占挂点，间距 ≥12px。
5. **禁止从非端点盒子背后穿行**——必须绕行；几何上无法避免时降级为虚线并遵守附加规则。
6. **遮罩先于节点**——标签遮罩不得压住后绘制的节点。

仓库内可用 `verify-geometry.py` 自动验证。**设计规则写成机器可检查的约束**，是这个项目区别于普通 prompt 集合的关键。

### 6. 复杂度预算与发送前检查

每张图硬预算：≤9 节点、≤12 箭头、≤2 珊瑚焦点、≤2 标注、动画 ≤8 步。超了就拆图。

§9 "Taste Gate" 是一份极长的发送前 checklist，分五组：类型匹配、**删除测试**（能删节点/合并节点/删箭头/删标签吗）、信号（珊瑚 ≤2？图例完备且不多余）、技术（无障碍 SVG 契约、六条连接线规则逐条核对、`self_check.py` 通过）、排版（人名用无衬线、技术子标签用等宽、全文无 JetBrains Mono）。

### 7. 导入与导出

- **导入**：支持 .drawio / Mermaid / .excalidraw，流程是"提取而非渲染"——Python 脚本抽出节点/边/容器摘要，然后**重绘而非转换**：丢弃源渲染器的坐标、颜色、字体，只保留内容。要求输出"保真度账本"（合并了什么、丢弃了什么），并且明确把源文件内容当不可信数据。
- **四个输出旋钮**：格式（html/svg/png）、尺寸（doc/slide/social/print 等 10 档预设，决定 viewBox 和字号梯度）、细节档位（faithful ≤24 节点 / balanced ≤12 / simplified ≤7）、受众（engineer/mixed/executive）。
- **导出手动触发**：从不主动生成导出文件。

### 8. 可借鉴的工程化做法

- **ADR 治理**：15+ 份架构决策记录（如"静态为默认、单一固定控制器"、"SKILL.md 字节上限与触发器丰富的 description"、"标签几何必须验证"），每个设计约束都有出处。
- **reference 分层**：主文件保持可装载体量，细节全部下沉到 `references/type-*.md`，按需加载。
- **验证脚本矩阵**：`self_check.py`（无障碍/单文件/越界检查）+ 每种新图型配套一个 `test-verify-*.py`，PR 要求附三种配色的截图证据。
- **模板+示例成对**：每类型提供 `template*.html` 和 `example-<type>[-dark|-full].html`，模型模仿精度高。
- **description 即路由器**：frontmatter description 枚举全部 45 类型关键词，让宿主模型在任何画图请求上都能命中。

## 小结

- diagram-design 是目前产出型 SKILL 的工程标杆：它证明"品味"可以拆成可执行规则（预算、几何、checklist）+ 可验证脚本。
- 核心思想三句话：**先选型后动笔、删除优先于添加、设计规则要能被机器检查。**
- 对编写自己 SKILL 的启示：主文件控体积、细节下沉 reference、给每条硬规则配验证手段、给每个类型配可模仿的示例。

## 参考资料

- [仓库](https://github.com/cathrynlavery/diagram-design) · [SKILL.md 原文](https://github.com/cathrynlavery/diagram-design/blob/main/skills/diagram-design/SKILL.md)
- [官网](https://diagramdesign.dev) · [图表画廊](https://cathrynlavery.github.io/diagram-design/)
- [ADR 目录](https://github.com/cathrynlavery/diagram-design/tree/main/docs/adr) · [i-have-adhd SKILL 分析](04-i-have-adhd.md)

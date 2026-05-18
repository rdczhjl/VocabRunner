# VocabRunner 设计文档 (v4.6)

本文档详细说明了 VocabRunner 单词学习应用的核心逻辑与设计规范。

## 1. 单词表结构设计 (Data Structure)

应用采用书本 (Book) 与 单词 (Word) 的两级结构。

### 1.1 单词本 (VocabularyBook)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | string | 唯一标识符 (通常为文件名) |
| `name` | string | 显示名称 (导入时会自动处理文件名) |
| `words` | Word[] | 单词列表 |
| `updatedAt` | number | 最后更新时间戳 (ms) |
| `synced` | number | 同步状态 (0: 未同步, 1: 已同步) |

### 1.2 单词 (Word)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | string | 单词唯一 ID |
| `word` | string | 英文单词原文 |
| `phonetic` | string | 音标 |
| `meaning` | string | 中文含义 |
| `sentence` | string | 例句 |
| `isLearned` | boolean | 是否已学习 (在学习模式中点击“掌握”触发) |
| `testStatus` | string | 测试状态 (`untested`, `mastered`, `unmastered`) |
| `testSuccessCount` | number | 测试正确次数 |
| `testFailureCount` | number | 测试失败次数 |
| `lastLearnedAt` | string | 最后学习时间 (ISO String) |
| `lastTestedAt` | string | 最后测试时间 (ISO String) |
| `updatedAt` | number | 单词最后修改时间戳 |

---

## 2. PWA 同步规则 (Sync Strategy)

应用采用 **Local-First (本地优先)** 策略，确保离线可用并自动同步。

- **存储引擎**: 使用 IndexedDB (通过 Dexie.js) 进行本地持久化。
- **在线检测**: 实时监听 `online`/`offline` 事件。
- **数据流向**:
    - **读取**: 启动时优先尝试从服务器获取最新数据并覆盖本地（若本地无未同步更改）；若离线则直接读取 IndexedDB。
    - **写入**: 所有更改（学习、测试、导入）首先写入本地 IndexedDB，并将 `synced` 标记为 `0`。
    - **自动同步**: 当设备恢复在线或应用启动时，系统会自动扫描 `synced: 0` 的记录并推送到服务器。
    - **重置**: 提供“重置”功能，可一键清空本地缓存与服务器数据。

---

## 3. 学习单词的选择逻辑 (Learning Selection)

当用户点击“开始学习”时，系统按以下规则筛选单词（数量由 `batchSize` 决定）：

1. **优先从未学习单词中选择**: 筛选 `isLearned === false` 的单词。
2. **随机化**: 对未学习单词进行随机乱序 (Shuffle)，确保每次学习顺序不同。
3. **补位机制**: 如果未学习单词数量不足 `batchSize`，则从已学习单词中随机抽取剩余名额进行复习。

---

## 4. 测试单词的选择逻辑 (Testing Selection)

测试模式旨在强化记忆，采用 **50/50 混合算法** 筛选单词：

1. **50% 最近学习 (Recently Learned)**:
    - 筛选 `isLearned === true` 且 `testStatus !== 'mastered'` 的单词。
    - 按 `lastLearnedAt` 时间倒序排列，优先测试最新学习且尚未掌握的内容。
2. **50% 高频错误 (High Failure)**:
    - 筛选 `testStatus !== 'mastered'` 的单词。
    - 按 `testFailureCount` 降序排列，优先测试经常出错的内容。
3. **兜底逻辑**: 如果以上两类单词总数不足，则从所有非 `mastered` 状态的单词中随机补充。
4. **最终处理**: 将选出的单词列表进行二次随机打乱，开始测试。

---

## 5. 拼写检查标准 (Spelling Check Criteria)

为了提高用户体验，测试模式下的拼写检查遵循以下宽松匹配规则：

- **忽略大小写**: `Apple` 与 `apple` 被视为相同。
- **忽略空格与标点**: `new york` 与 `newyork` 被视为相同，`don't` 与 `dont` 也被视为相同。
- **逻辑实现**: 在比较前，系统会将用户输入和目标单词中的所有非字母数字字符（包括空格、括号、逗号等标点符号）移除，并统一转换为小写。

---

## 6. 测试失败辅助逻辑 (Testing Failure Help)

为了帮助用户学习难以记忆的单词：

- **连续失败机制**: 如果用户在同一个单词的测试中连续输错 **3 次**。
- **强制显示**: 系统会自动显示该单词的完整信息（单词原文及例句）。
- **强制跳过**: 此时输入框和“检查”按钮将被禁用，输入框显示“Attempts exceeded”。用户只能点击“Skip”按钮进入下一个单词。
- **视觉引导**: 触发辅助时，“Skip”按钮会变为高亮模式并伴有脉冲动画，引导用户进行下一步。

---

## 7. PASSED (Mastered) 单词认定标准

单词的状态转换遵循以下逻辑：

- **认定标准**: 只有当单词在测试中**连续或累计正确次数达到 2 次**时，状态才会变更为 `mastered` (即 UI 上的 PASSED)。
- **失败惩罚**: 任何一次测试错误都会将状态重置为 `unmastered`，且 `testFailureCount` 加 1。
- **状态流转**:
    - `untested` -> 正确 1 次 -> `unmastered`
    - `unmastered` -> 正确 1 次 (累计 2 次) -> `mastered`
    - `mastered` -> 错误 1 次 -> `unmastered` (需重新正确 2 次才能再次回到 mastered)

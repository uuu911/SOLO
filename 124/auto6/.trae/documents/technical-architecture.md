# 恋爱养成游戏技术架构文档

## 1. 总体架构

### 1.1 文件结构
- 单文件：index.html
- 内联CSS样式
- 内联JavaScript代码
- 模块化代码组织

### 1.2 模块划分
```
┌─────────────────────────────────────────────────┐
│                   游戏主程序                      │
├──────────┬──────────┬──────────┬──────────┤
│ 角色数据  │ 对话逻辑  │  UI渲染  │ 存档管理  │
│  模块    │   模块    │   模块    │   模块    │
└──────────┴──────────┴──────────┴──────────┘
```

## 2. 模块详细设计

### 2.1 角色数据模块 (CharacterModule)
**职责：**
- 管理角色核心属性
- 提供属性修改接口
- 触发属性变化事件

**核心数据结构：**
```javascript
const character = {
  name: '林悦',
  affection: 50,  // 0-100
  mood: 0,        // -10-10
  triggeredEvents: []
};
```

**对外接口：**
- `getAffection()` - 获取好感度
- `getMood()` - 获取心情值
- `updateAffection(delta)` - 更新好感度
- `updateMood(delta)` - 更新心情值
- `hasTriggeredEvent(eventId)` - 检查事件是否已触发
- `markEventTriggered(eventId)` - 标记事件已触发

### 2.2 对话逻辑模块 (DialogueModule)
**职责：**
- 管理对话树数据
- 处理选项选择逻辑
- 计算属性变化
- 触发特殊事件

**对话节点结构：**
```javascript
const dialogueTree = {
  nodeId: {
    speaker: '角色名',
    text: '对话内容',
    options: [
      {
        text: '选项文本',
        nextNode: '下一节点ID',
        affectionChange: 5,
        moodChange: 1,
        moodRequirement: 0  // 心情阈值
      }
    ],
    isEvent: false,
    eventType: null
  }
};
```

**对外接口：**
- `getCurrentNode()` - 获取当前对话节点
- `selectOption(optionIndex)` - 选择选项
- `canShowOption(option)` - 检查选项是否可显示
- `checkEnding()` - 检查是否触发结局
- `checkSpecialEvent()` - 检查特殊事件

### 2.3 UI渲染模块 (UIModule)
**职责：**
- 渲染角色状态面板
- 渲染对话框和选项
- 处理动画效果
- 响应式布局调整

**核心组件：**
- 角色立绘区域
- 状态面板（好感度、心情值）
- 对话框
- 选项按钮区
- 结局弹窗

**对外接口：**
- `renderStatus(character)` - 渲染状态面板
- `renderDialogue(node)` - 渲染对话
- `renderOptions(options, canSelect)` - 渲染选项
- `showEnding(type)` - 显示结局
- `disableOptions()` - 禁用选项
- `enableOptions()` - 启用选项

### 2.4 存档管理模块 (SaveModule)
**职责：**
- 保存游戏状态到localStorage
- 从localStorage加载游戏状态
- 验证存档数据完整性
- 重置游戏状态

**存档数据结构：**
```javascript
const saveData = {
  currentNodeId: 'node_001',
  affection: 50,
  mood: 0,
  triggeredEvents: [],
  interactionCount: 0,
  timestamp: Date.now()
};
```

**对外接口：**
- `saveGame(state)` - 保存游戏
- `loadGame()` - 加载游戏
- `validateSave(data)` - 验证存档
- `resetGame()` - 重置游戏
- `hasSaveData()` - 检查是否有存档

## 3. 事件系统

### 3.1 自定义事件
- `affectionChanged` - 好感度变化
- `moodChanged` - 心情值变化
- `dialogueAdvanced` - 对话推进
- `endingTriggered` - 结局触发
- `eventTriggered` - 特殊事件触发

### 3.2 特殊事件触发区间
- 30-40：咖啡邀约
- 50-60：公园散步
- 70-80：晚餐约会

## 4. 防快速点击机制

### 4.1 实现方案
- 点击后立即禁用所有选项按钮
- 设置500ms冷却时间
- 冷却期间按钮置灰
- 冷却结束后重新启用（或根据下一节点状态）

### 4.2 视觉反馈
- 按钮opacity变为0.5
- cursor变为not-allowed
- 可能添加加载动画

## 5. 动画设计

### 5.1 属性变化动画
- 进度条宽度过渡：0.3s ease-out
- 数值变化数字滚动效果
- 颜色渐变提示（好感度增加绿色，减少红色）

### 5.2 对话动画
- 对话框淡入效果
- 选项按钮依次出现
- 特殊事件边框闪烁效果

## 6. 响应式设计

### 6.1 断点设置
- 移动设备：< 768px
- 平板设备：768px - 1024px
- 桌面设备：> 1024px

### 6.2 布局策略
- flex布局为主
- 移动端垂直堆叠
- 桌面端水平分布
- 最小触摸目标：48px

## 7. 日常问候系统

### 7.1 触发条件
- 每次交互轮次增加
- 每3轮触发一次问候
- 问候类型根据时间/轮次决定

### 7.2 问候变体库
- 低好感度：礼貌但疏远
- 中好感度：友好自然
- 高好感度：亲密温柔
- 好心情：活泼积极
- 坏心情：低落敷衍

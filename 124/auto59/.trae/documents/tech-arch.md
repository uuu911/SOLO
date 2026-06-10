# 历史帝国决策游戏 - 技术架构文档

## 1. 技术选型

### 1.1 技术栈
- **HTML5**：页面结构
- **CSS3**：样式与动画
- **原生JavaScript (ES6+)**：游戏逻辑
- **无第三方依赖**：纯原生实现

### 1.2 代码组织模式
- **IIFE (Immediately Invoked Function Expression)**：避免全局变量污染
- **模块化分层架构**：四层分离设计

## 2. 架构设计

### 2.1 四层架构

```
┌─────────────────────────────────────────┐
│              UI 层                      │
│  (DOM操作、渲染、事件监听)              │
├─────────────────────────────────────────┤
│          游戏引擎控制层                 │
│  (回合管理、状态管理、流程控制)         │
├─────────────────────────────────────────┤
│          事件类实现层                   │
│  (12+历史事件类、连锁效应)             │
├─────────────────────────────────────────┤
│          事件接口定义层                 │
│  (IEvent接口、类型定义)                 │
└─────────────────────────────────────────┘
```

### 2.2 模块划分

#### 2.2.1 事件接口定义层
```javascript
// IEvent接口规范
interface IEvent {
  id: string;
  title: string;
  description: string;
  period: 'classical' | 'medieval';
  era: number; // 出现年份
  options: IOption[];
  weight?: number; // 出现权重
  prerequisite?: (state: GameState) => boolean; // 前置条件
}

interface IOption {
  text: string;
  effect: {
    population?: number;
    gold?: number;
    military?: number;
    stability?: number;
  };
  memoryKey?: string; // 连锁记忆键
}
```

#### 2.2.2 事件类实现层
- 12+历史事件，覆盖古典、中世纪
- 真实历史依据改编
- 连锁记忆效应机制

#### 2.2.3 游戏引擎控制层
- `GameEngine`类：主控制器
- `StateManager`：状态管理
- `EventPool`：事件池管理
- `MemorySystem`：连锁记忆系统

#### 2.2.4 UI层
- `UIManager`：DOM操作
- `Renderer`：渲染器
- `EventBinder`：事件绑定

## 3. 核心数据结构

### 3.1 文明配置
```javascript
const CIVILIZATIONS = {
  rome: {
    name: '罗马共和国',
    startYear: -509, // 公元前509年
    eraSystem: 'AUC', // 建城纪年
    initialResources: {
      population: 100,
      gold: 80,
      military: 60,
      stability: 70
    }
  },
  han: {
    name: '汉朝',
    startYear: -202, // 公元前202年
    eraSystem: 'imperial', // 年号+干支
    initialResources: {
      population: 120,
      gold: 60,
      military: 50,
      stability: 80
    }
  },
  egypt: {
    name: '托勒密埃及',
    startYear: -305, // 公元前305年
    eraSystem: 'pharaoh', // 法老纪年
    initialResources: {
      population: 90,
      gold: 100,
      military: 40,
      stability: 65
    }
  }
};
```

### 3.2 游戏状态
```javascript
interface GameState {
  civilization: string;
  currentYear: number;
  resources: {
    population: number;
    gold: number;
    military: number;
    stability: number;
  };
  turn: number;
  memory: Map<string, number>; // 连锁记忆
  log: LogEntry[];
  isGameOver: boolean;
}
```

## 4. 连锁记忆效应设计

### 4.1 记忆系统
- 使用`Map<string, number>`存储决策记忆
- 每个关键决策设置记忆键值
- 事件前置条件检查记忆值

### 4.2 权重调整
- 事件权重基础值：1.0
- 记忆匹配时权重×倍数
- 支持解锁隐藏事件

## 5. 纪年法实现

### 5.1 罗马 AUC 纪年
- AUC = 公元年份 + 753
- 显示格式：`AUC {year} (公元{公元Year})`

### 5.2 汉朝年号干支
- 基础年号映射表
- 干支计算：(year + 2396) % 60
- 显示格式：`{年号}{n}年 {干支} (公元{公元Year})`

### 5.3 埃及法老纪年
- 法老在位年份计算
- 显示格式：`法老{name} 第{n}年 (公元{公元Year})`

## 6. UI组件结构

```
index.html
├── #civilization-select (文明选择)
├── #game-container (游戏主容器)
│   ├── .header-bar (年份、文明)
│   ├── .resources-panel (属性条)
│   ├── .event-card (事件卡片)
│   ├── .log-panel (可折叠日志)
│   └── .game-over-modal (结束面板)
└── styles (内联CSS)
```

## 7. 美学设计方向

### 7.1 整体风格
- **古典历史风格**：羊皮纸纹理、复古配色
- **庄重典雅**： serif字体、金色/褐色系
- **微妙动画**：翻页效果、淡入淡出

### 7.2 配色方案
- 主色调：深褐色 `#4a3728`
- 背景：羊皮纸色 `#f4e4c1`
- 强调：金色 `#c9a227`
- 危险：暗红 `#8b0000`

### 7.3 排版
- 标题：Cinzel（衬线字体）
- 正文：Georgia / 宋体
- 响应式字体大小

## 8. 性能考虑

- 单文件，总大小控制在100KB内
- DOM操作最小化
- 无重排重绘问题
- 事件委托优化

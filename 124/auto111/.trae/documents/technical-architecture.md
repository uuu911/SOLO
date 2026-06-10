# 奇幻魔法决斗游戏 技术架构文档

## 1. 技术选型

### 1.1 核心技术栈
- **HTML5**: 单文件结构，所有代码内联
- **CSS3**: 内联样式，使用CSS变量管理主题
- **JavaScript (ES6+)**: 游戏逻辑实现
- **Canvas API**: 符文绘制、游戏渲染、粒子特效
- **Web Audio API**: 音频生成
- **localStorage**: 数据持久化

### 1.2 外部依赖
- 无外部依赖库，所有功能原生实现
- Google Fonts（可选，内联字体数据或使用系统字体回退）

## 2. 系统架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    游戏主循环 (Game Loop)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   输入处理   │  │   状态更新   │  │   画面渲染   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    游戏状态管理                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ 玩家状态 │  │ AI状态   │  │ 战斗日志 │  │ 统计数据 │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   符文识别系统   │ │   咒语系统       │ │   粒子特效系统   │
│  - 绘制捕获      │ │  - 咒语定义      │ │  - 粒子发射器    │
│  - 特征提取      │ │  - 元素克制      │ │  - 效果动画      │
│  - 模板匹配      │ │  - 效果计算      │ │  - 渲染优化      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## 3. 核心模块设计

### 3.1 游戏状态管理 (GameState)

```javascript
class GameState {
  constructor() {
    this.turn = 'player'; // 'player' | 'ai'
    this.phase = 'draw';   // 'draw' | 'cast' | 'animating'
    this.player = { hp: 100, maxHp: 100, mana: 100, maxMana: 100, shield: 0 };
    this.ai = { hp: 100, maxHp: 100, mana: 100, maxMana: 100, shield: 0 };
    this.turnTimeLeft = 10;
    this.gameOver = false;
    this.winner = null;
    this.stats = {
      totalDamageDealt: 0,
      successfulCasts: 0,
      counterTimes: 0,
      spellUsage: {},
      maxDamageSpell: null
    };
  }
}
```

### 3.2 符文识别系统 (RuneRecognition)

#### 3.2.1 数据结构
```javascript
const Runes = {
  fireball: {
    name: '火球术',
    element: 'fire',
    pattern: [{ type: 'circle', points: [...] }],
    manaCost: 20,
    damage: 25,
    effect: 'damage'
  },
  // 更多咒语...
};
```

#### 3.2.2 识别算法
1. **点归一化**: 将绘制点缩放到标准大小并居中
2. **重采样**: 统一采样点数（如32个点）
3. **特征提取**: 提取方向序列、转角特征
4. **模板匹配**: 使用DTW（动态时间规整）或余弦相似度计算匹配度
5. **阈值判断**: 匹配度超过阈值则识别成功

### 3.3 咒语系统 (SpellSystem)

#### 3.3.1 元素克制关系
```
火 → 风 → 土 → 水 → 火 (相生相克)
克制伤害加成: 1.5x
被克制伤害减免: 0.7x
```

#### 3.3.2 咒语效果
- **伤害型**: 直接扣除生命值
- **治疗型**: 恢复生命值
- **护盾型**: 吸收伤害
- **特殊型**: 魔力回复、持续伤害等

### 3.4 AI系统 (AISystem)

#### 3.4.1 决策流程
1. 评估当前状态（血量、魔力、护盾）
2. 计算可用咒语
3. 考虑元素克制关系
4. 加入随机性（选择偏差）
5. 做出决策

#### 3.4.2 权重计算
```
紧急治疗: hp < 30 ? 高权重 : 低权重
护盾补充: shield == 0 && hp < 50 ? 中权重 : 低权重
克制攻击: 有克制咒语可用 ? 高权重 : 正常权重
随机因子: ±20% 偏差
```

### 3.5 粒子系统 (ParticleSystem)

```javascript
class Particle {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
    this.life = maxLife;
    this.maxLife = maxLife;
    this.color = elementColors[type];
    this.size = baseSize;
  }
  
  update() { /* 更新位置、生命 */ }
  draw(ctx) { /* 绘制粒子 */ }
}
```

## 4. 数据持久化

### 4.1 存储结构
```javascript
{
  unlockedSpells: ['fireball', 'heal'], // 已解锁咒语
  totalGames: 0,                         // 总游戏次数
  wins: 0,                               // 胜利次数
  spellUsage: {},                        // 咒语使用统计
  totalDamage: 0,                        // 累计伤害
  successfulCasts: 0                     // 成功施法次数
}
```

## 5. 性能优化策略

### 5.1 渲染优化
- 使用requestAnimationFrame实现60fps循环
- 离屏Canvas缓存静态元素
- 粒子池重用，减少GC开销

### 5.2 识别优化
- 限制最大采样点数（64点）
- 使用简化的特征匹配算法
- Web Worker处理识别计算（可选）

## 6. 响应式设计

### 6.1 布局策略
- 使用CSS Flexbox/Grid实现响应式布局
- Canvas自适应容器大小
- 触摸目标最小48x48px

### 6.2 断点设计
- 移动端 (< 768px): 竖屏布局
- 平板/桌面 (>= 768px): 横屏布局

## 7. 文件结构

所有代码内联在单个HTML文件中，结构如下：

```html
<!DOCTYPE html>
<html>
<head>
  <style> /* CSS样式 */ </style>
</head>
<body>
  <!-- HTML结构 -->
  <script>
    // 1. 工具函数
    // 2. 音频系统
    // 3. 粒子系统
    // 4. 符文识别系统
    // 5. 咒语定义
    // 6. AI系统
    // 7. 游戏状态管理
    // 8. 主游戏类
    // 9. 初始化
  </script>
</body>
</html>
```

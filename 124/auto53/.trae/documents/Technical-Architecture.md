## 1. 架构设计

```mermaid
flowchart TD
    A["HTML文件"] --> B["Canvas渲染层"]
    A --> C["游戏逻辑层"]
    A --> D["输入处理层"]
    A --> E["音效层"]
    
    C --> C1["GameObject基类"]
    C --> C2["物理系统"]
    C --> C3["碰撞检测"]
    
    C1 --> P1["Player"]
    C1 --> P2["Platform"]
    C1 --> P3["Enemy"]
    C1 --> P4["Coin"]
    
    E --> E1["Web Audio API"]
```

## 2. 技术描述

- **前端技术**：原生HTML5 + Canvas 2D + JavaScript (ES6+)
- **渲染引擎**：Canvas 2D Context
- **音效**：Web Audio API振荡器
- **游戏循环**：requestAnimationFrame + FIXED_DT固定步长
- **打包方式**：单文件HTML，无需构建工具

## 3. 核心技术要点

### 3.1 GameObject接口
```javascript
class GameObject {
  update(dt) {}
  render(ctx) {}
}
```

### 3.2 物理系统
- 固定时间步长：FIXED_DT = 1/60
- 重力加速度：980px/s²
- 碰撞检测：AABB碰撞

### 3.3 代码结构
- IIFE模块化，避免全局污染
- 按功能分区注释
- 类型标注清晰

## 4. 文件结构

```
auto53/
└── index.html          # 单文件包含所有代码
```

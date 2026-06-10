const Levels = {
  levels: [
    {
      id: 1,
      name: "入门",
      size: 6,
      colors: 4,
      maxSteps: 15,
      layout: null
    },
    {
      id: 2,
      name: "初级",
      size: 8,
      colors: 5,
      maxSteps: 20,
      layout: null
    },
    {
      id: 3,
      name: "中级",
      size: 10,
      colors: 5,
      maxSteps: 25,
      layout: null
    },
    {
      id: 4,
      name: "高级",
      size: 10,
      colors: 6,
      maxSteps: 28,
      layout: null
    },
    {
      id: 5,
      name: "专家",
      size: 12,
      colors: 6,
      maxSteps: 35,
      layout: null
    }
  ],

  getLevel(id) {
    return this.levels.find(l => l.id === id);
  },

  getAllLevels() {
    return this.levels;
  },

  generateLayout(size, numColors) {
    const layout = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(Math.floor(Math.random() * numColors));
      }
      layout.push(row);
    }
    return layout;
  }
};

const Recognizer = (() => {
  function recognize(points, canvas) {
    if (points.length < 10) return { match: null, similarity: 0 };

    const normalizedPoints = normalizePoints(points, canvas);
    const spells = SpellData.getAllSpells();
    let bestMatch = null;
    let bestSimilarity = 0;

    spells.forEach(spell => {
      if (!SpellData.isUnlocked(spell.id)) return;
      const similarity = calculateSimilarity(normalizedPoints, spell.template);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = spell;
      }
    });

    return {
      match: bestSimilarity >= 0.75 ? bestMatch : null,
      similarity: bestSimilarity
    };
  }

  function normalizePoints(points, canvas) {
    if (!canvas || points.length === 0) return points;

    const width = canvas.width;
    const height = canvas.height;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scale = Math.max(maxX - minX, maxY - minY) || 1;

    return points.map(p => ({
      x: 0.5 + (p.x - centerX) / scale * 0.4,
      y: 0.5 + (p.y - centerY) / scale * 0.4
    }));
  }

  function calculateSimilarity(drawnPoints, templatePoints) {
    if (drawnPoints.length === 0 || templatePoints.length === 0) return 0;

    const sampledDrawn = samplePoints(drawnPoints, 50);
    const sampledTemplate = samplePoints(templatePoints, 50);

    let totalDistance = 0;
    for (let i = 0; i < sampledDrawn.length; i++) {
      const minDist = findMinDistance(sampledDrawn[i], sampledTemplate);
      totalDistance += minDist;
    }

    const avgDistance = totalDistance / sampledDrawn.length;
    const maxPossibleDist = Math.sqrt(2);
    const similarity = 1 - (avgDistance / maxPossibleDist);

    return Math.max(0, Math.min(1, similarity));
  }

  function samplePoints(points, targetCount) {
    if (points.length <= targetCount) return points;

    const result = [];
    const step = (points.length - 1) / (targetCount - 1);

    for (let i = 0; i < targetCount; i++) {
      const index = Math.round(i * step);
      result.push(points[Math.min(index, points.length - 1)]);
    }

    return result;
  }

  function findMinDistance(point, pointList) {
    let minDist = Infinity;
    pointList.forEach(p => {
      const dist = Math.hypot(point.x - p.x, point.y - p.y);
      minDist = Math.min(minDist, dist);
    });
    return minDist;
  }

  return {
    recognize
  };
})();

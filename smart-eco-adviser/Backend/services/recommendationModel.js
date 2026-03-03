const sigmoid = (x) => 1 / (1 + Math.exp(-x));

const GOAL_WEIGHTS = {
  reduce_cost: { cost: 0.45, effort: -0.2, impact: 0.15 },
  lower_emissions: { impact: 0.55, effort: -0.1, cost: 0.05 },
  save_time: { effort: -0.45, impact: 0.1, cost: 0.1 },
  health: { health: 0.6, impact: 0.15 },
};

const IMPACT_MAP = { low: 0.35, medium: 0.6, high: 0.9 };
const DIFFICULTY_MAP = { easy: 0.9, medium: 0.55, hard: 0.3 };

const normalize = (value, min, max) => {
  if (value <= min) return 0;
  if (value >= max) return 1;
  return (value - min) / (max - min);
};

const inferDifficulty = (tip) => {
  if (tip.difficulty) return tip.difficulty;
  if (tip.impact === "high" && (tip.costSaving || 0) > 100) return "medium";
  if (tip.impact === "low") return "easy";
  return "medium";
};

const scoreTip = (tip, context) => {
  const difficulty = inferDifficulty(tip);
  const impact = IMPACT_MAP[tip.impact] || 0.55;
  const effort = DIFFICULTY_MAP[difficulty] || 0.5;
  const cost = normalize(tip.costSaving || 0, 0, 600);
  const co2 = normalize(tip.co2Reduction || 0, 0, 3);

  let weatherBoost = 0;
  if (context.temperature >= 29 && tip.category === "energy") weatherBoost += 0.12;
  if (context.airQuality > 120 && tip.category === "transportation") weatherBoost += 0.08;
  if (context.windSpeed > 4 && tip.title.toLowerCase().includes("dry")) weatherBoost += 0.1;

  let profileBoost = 0;
  if (context.commuteKm >= 15 && tip.category === "transportation") profileBoost += 0.15;
  if (context.dietType === "non-vegetarian" && tip.category === "diet") profileBoost += 0.1;
  if (context.budget === "low" && (tip.costSaving || 0) > 150) profileBoost += 0.08;

  const health = tip.category === "diet" || tip.category === "transportation" ? 0.7 : 0.25;

  let goalScore = 0;
  for (const goal of context.goals) {
    const w = GOAL_WEIGHTS[goal];
    if (!w) continue;
    goalScore += (w.impact || 0) * impact;
    goalScore += (w.effort || 0) * effort;
    goalScore += (w.cost || 0) * cost;
    goalScore += (w.health || 0) * health;
  }

  const rawScore =
    1.1 * impact +
    1.2 * co2 +
    0.6 * effort +
    0.8 * cost +
    weatherBoost +
    profileBoost +
    goalScore -
    1.05;

  const probability = sigmoid(rawScore);
  const confidence = 0.55 + Math.abs(probability - 0.5);

  return {
    ...tip,
    difficulty,
    aiScore: Number((probability * 100).toFixed(1)),
    confidence: Number((Math.min(confidence, 0.97) * 100).toFixed(1)),
    reasoning: buildReasoning(tip, context),
  };
};

const buildReasoning = (tip, context) => {
  const reasons = [];
  if ((tip.co2Reduction || 0) >= 1.5) reasons.push("high carbon reduction potential");
  if ((tip.costSaving || 0) >= 180) reasons.push("strong yearly cost savings");
  if (context.commuteKm >= 15 && tip.category === "transportation") reasons.push("matches your commute profile");
  if (context.temperature >= 29 && tip.category === "energy") reasons.push("timely for current weather");
  if (context.goals.includes("health") && ["diet", "transportation"].includes(tip.category)) reasons.push("aligned with health goal");

  return reasons.length ? reasons : ["recommended by personalized sustainability model"];
};

const rankTips = (tips, context) => {
  return tips
    .map((tip) => scoreTip(tip, context))
    .sort((a, b) => b.aiScore - a.aiScore);
};

module.exports = { rankTips };

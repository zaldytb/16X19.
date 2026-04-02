import type { Racquet, SetupAttributes, StringData, StringConfig as EngineStringConfig } from '../../engine/types.js';

type StringConfig = EngineStringConfig;

export function generateFitProfile(
  stats: SetupAttributes,
  racquet: Racquet,
  _stringConfig: StringConfig,
): { bestFor: string[]; watchOut: string[]; tensionRec: string } {
  const bestForCandidates: Array<{ label: string; score: number }> = [];
  const watchOut: string[] = [];

  if (stats.spin >= 70) bestForCandidates.push({ label: 'Baseline grinders who rely on topspin', score: stats.spin });
  if (stats.power >= 65) bestForCandidates.push({ label: 'Players who like to dictate with pace', score: stats.power });
  if (stats.control >= 70) bestForCandidates.push({ label: 'Touch players and all-courters', score: stats.control });
  if (stats.comfort >= 70) bestForCandidates.push({ label: 'Players with arm sensitivity', score: stats.comfort });
  if (stats.stability >= 70) bestForCandidates.push({ label: 'Aggressive returners and blockers', score: stats.stability });
  if (stats.feel >= 75) bestForCandidates.push({ label: 'Net players and volleyers', score: stats.feel });
  if (stats.maneuverability >= 70) bestForCandidates.push({ label: 'Quick-swing players and net rushers', score: stats.maneuverability });
  if (stats.forgiveness >= 65) bestForCandidates.push({ label: 'Developing players building consistency', score: stats.forgiveness });
  if (stats.playability >= 80) bestForCandidates.push({ label: 'Frequent players (3+ times/week)', score: stats.playability });

  const bestFor = bestForCandidates
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.label);

  if (bestFor.length === 0) bestFor.push('Versatile all-court players');

  if (stats.power <= 40) watchOut.push('Players who need free power from the frame');
  if (stats.comfort <= 45) watchOut.push('Players with arm/elbow issues - too stiff');
  if (stats.control <= 50) watchOut.push('Players who need help keeping the ball in');
  if (stats.spin <= 50) watchOut.push('Heavy topspin players - limited spin access');
  if (stats.forgiveness <= 45) watchOut.push('Beginners - small effective sweet spot');
  if (stats.maneuverability <= 45) watchOut.push('Compact swingers - frame may feel sluggish');
  if (stats.durability <= 55) watchOut.push('String breakers - low durability');
  if (stats.playability <= 55) watchOut.push('Infrequent restringers - goes dead fast');

  if (watchOut.length === 0) watchOut.push('No major red flags - versatile setup');

  const [low, high] = racquet.tensionRange;
  const mid = Math.round((low + high) / 2);
  const tensionRec = `${low}-${high} lbs (sweet spot: ${mid - 1}-${mid + 1} lbs)`;

  return { bestFor, watchOut, tensionRec };
}

export function generateWarnings(
  racquet: Racquet,
  stringConfig: StringConfig,
  _stats: SetupAttributes,
): string[] {
  const warnings: string[] = [];
  const mainsTension = stringConfig.mainsTension;
  const crossesTension = stringConfig.crossesTension;

  if (mainsTension < racquet.tensionRange[0]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is below the recommended range (${racquet.tensionRange[0]}-${racquet.tensionRange[1]} lbs). Risk of losing control and trampoline effect.`);
  }
  if (mainsTension > racquet.tensionRange[1]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is above the recommended range (${racquet.tensionRange[0]}-${racquet.tensionRange[1]} lbs). Risk of reduced comfort and arm strain.`);
  }
  if (crossesTension < racquet.tensionRange[0]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is below the recommended range.`);
  }
  if (crossesTension > racquet.tensionRange[1]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is above the recommended range.`);
  }

  const allStrings = stringConfig.isHybrid
    ? [stringConfig.mains, stringConfig.crosses].filter(Boolean) as StringData[]
    : [stringConfig.string].filter(Boolean) as StringData[];

  const mainString = stringConfig.isHybrid ? stringConfig.mains : stringConfig.string;
  if (mainString && racquet.stiffness >= 68 && mainString.stiffness >= 220) {
    warnings.push(`High frame stiffness (${racquet.stiffness} RA) + stiff string (${mainString.stiffness} lb/in) = significant shock transmission. Consider monitoring for arm discomfort.`);
  }

  for (const string of allStrings) {
    if (string.gaugeNum <= 1.25 && string.material === 'Polyester') {
      warnings.push(`${string.name} ${string.gauge} is thin gauge - expect reduced durability vs 16g. Frequent string breakers should consider thicker gauge.`);
    }
    if (string.material === 'Natural Gut') {
      warnings.push(`${string.name} is natural gut - avoid moisture/humidity. Not recommended for wet climates without protection.`);
    }
  }

  return warnings;
}

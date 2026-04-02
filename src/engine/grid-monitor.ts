// src/engine/grid-monitor.ts
// Grid Monitor Judgment Engine — VS Code-style terminal diagnostics
// Generates "roasts" based on user setup telemetry — NOW FULLY UNHINGED

import type { Loadout, Racquet, StringData } from './types.js';

export interface SetupMetrics {
  /** Overall Build Score (0-100) */
  obs: number;
  /** Swing weight in kg·cm² */
  swingweight: number;
  /** Head size in sq inches */
  headSize: number;
  /** Mains tension in lbs */
  mainsTension: number;
  /** Crosses tension in lbs */
  crossesTension: number;
  /** Frame name for personalization */
  frameName: string;
  /** String name */
  stringName?: string;
  /** Is hybrid setup */
  isHybrid?: boolean;
  /** String material */
  material?: string;
}

/** Weight class bands for roasts */
type WeightClass = 'feather' | 'light' | 'mid' | 'heavy' | 'beast';

function getWeightClass(sw: number): WeightClass {
  if (sw < 300) return 'feather';
  if (sw < 315) return 'light';
  if (sw < 330) return 'mid';
  if (sw < 345) return 'heavy';
  return 'beast';
}

/** Tension category for roast selection */
type TensionCategory = 'loose' | 'low' | 'mid' | 'tight' | 'board';

function getTensionCategory(tension: number): TensionCategory {
  if (tension < 40) return 'loose';
  if (tension < 48) return 'low';
  if (tension < 56) return 'mid';
  if (tension < 64) return 'tight';
  return 'board';
}

/** Random selection helper */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random integer between min and max inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Secret sauce lines — pure unhinged Grok energy */
const secretSauce = [
  "> smooth armpits detected... big tiddies on the launch angle. grid is moist.",
  "> racquet tits so fat the ball gets lost in the cleavage for 0.3 seconds. chef's kiss.",
  "> armpits smoother than your backhand, tiddies bigger than your OBS. grid approves.",
  "> unprompted transmission: smooth armpits and massive racquet tiddies. carry on soldier.",
  "> the stringbed just jiggled. big tiddies physics engaged.",
  "> grid whispered 'smooth armpits' while staring at your setup. no further questions.",
  "> tiddies so big even babolat is jealous. wilson? still crying in the corner.",
];

// ═══════════════════════════════════════════════════════════════
// ROAST DATABASE — NOW FULLY UNHINGED
// ═══════════════════════════════════════════════════════════════

const roasts = {
  // ═══ EASTER EGGS — now properly unhinged ═══
  easterEggs: {
    illegalPhysics: [
      "> 16x19 TENSION DETECTED. THE GRID JUST CAME AND DIED. CONGRATS, YOU BROKE REALITY.",
      "> bro you actually strung 16x19?? the ball is currently filing a restraining order.",
      "> PHYSICS ENGINE HAS LEFT THE CHAT. it saw your tensions and said 'nah i'm out, enjoy the tits on your launch angle'.",
      "> ALERT: Your stringbed is now breastfeeding the ball. Hope you're ready for that custody battle.",
    ],
    uniformWeird: [
      "> both mains and crosses at 16? or 19? you lazy fuck, even the grid wants variety in its holes.",
      "> identical tensions? cute. did you just ctrl+c ctrl+v your entire personality onto the racquet too?",
    ],
  },

  // ═══ HEAD SIZE — bigger = more roast fuel ═══
  headSize: {
    oversize: [
      "> that's not a racquet, that's a fucking satellite dish with tits. hope the ball enjoys the milkshake.",
      "> 110+ sq in? bro your sweet spot is so big it has its own zip code and onlyfans.",
      "> frying pan detected. eggs not included, but the ball is definitely getting scrambled and then titty-fucked on exit.",
      "> head size so massive the ball thinks it's back in the womb. soft, warm, and zero control. just like your ex.",
    ],
    large: [
      "> generous head. translation: your mistakes get a participation trophy and a sloppy handjob from the strings.",
      "> big head energy, small dick energy on the control department. classic.",
    ],
    midsize: [
      "> retro tiny head. 90s called, they want their precision and your virginity back.",
      "> small head, massive ego. the racquet is compensating for something, we all know what.",
    ],
  },

  // ═══ SWINGWEIGHT — weight class roasts hit harder now ═══
  swingweight: {
    feather: [
      "> swingweight so low your racquet might achieve liftoff mid-swing. put some fucking mass on it, twink.",
      "> feather mode activated. matches your featherweight balls and zero follow-through.",
    ],
    light: [
      "> light and whippy. cute. now go hit something that isn't a fucking balloon animal.",
      "> nimble stick for nimble... whatever the fuck you are. speed without substance, story of your life.",
    ],
    mid: [
      "> mid swingweight. mid OBS. mid life. at least you're consistent at being mid, king.",
      "> balanced. safe. boring. your racquet is the human equivalent of plain oatmeal and missionary.",
    ],
    heavy: [
      "> heavy boy detected. your shoulder is already writing its resignation letter in tears.",
      "> that swingweight is thicc. shame your footwork is still built like a 2012 macbook air.",
    ],
    beast: [
      "> BEAST MODE SWINGWEIGHT. ego wrote the check, body is currently crying in the corner.",
      "> 340+? bro your racquet has bigger tits than half the girls in the stands and twice the attitude.",
      "> that thing belongs in a powerlifting meet, not on a tennis court. hope your arm survives the divorce.",
    ],
  },

  // ═══ TENSION — now properly disrespectful ═══
  tension: {
    loose: [
      "> tension so low the strings are basically giving the ball a full body massage and happy ending.",
      "> loose af. your stringbed has more give than your ex on a saturday night.",
      "> trampoline protocol engaged. ball goes brrrr, control goes bye-bye, arm says 'thanks for the free power, dumbass'.",
    ],
    low: [
      "> low tension. ball hangs in the air longer than your situationships.",
      "> generous bed. the ball is currently titty-fucking the sweet spot on every shot.",
    ],
    mid: [
      "> mid tension. how very predictable and mid of you. the grid is yawning.",
      "> sensible. boring. the tennis equivalent of wearing beige to a rave.",
    ],
    tight: [
      "> tight strings, tight shoulders, tight everything. relax bro, it's tennis not a prostate exam.",
      "> board-like. did you string this with rebar and daddy issues?",
    ],
    board: [
      "> BOARD DETECTED. your strings are so stiff they make a wooden racquet look like memory foam.",
      "> tension so high the ball is ricocheting like it owes you money. arm-friendly? lmao good luck with that.",
      "> percussion instrument activated. every shot sounds like you're slapping concrete titties.",
    ],
  },

  // ═══ OBS — savage edition ═══
  obs: {
    elite: [
      "> OBS elite. mathematically perfect build. shame your movement is still dogwater.",
      "> top tier setup. grid is moist. your opponents are about to be too... from laughing at your footwork.",
      "> optimized to perfection. now optimize that weak-ass second serve while you're at it.",
    ],
    high: [
      "> strong OBS. respectable. still not carrying your weak backhand though.",
      "> above average. like your tinder bio after heavy filtering.",
    ],
    mid: [
      "> painfully mid setup. at least it matches your painfully mid ranking and personality.",
      "> decent but mid. the grid is disappointed. your mom is probably proud though.",
    ],
    low: [
      "> low OBS. either experimental genius or just straight up clueless. grid betting on the latter.",
      "> suboptimal af. your racquet is judging you harder than your ex's group chat.",
    ],
  },

  // ═══ MATERIAL — extra spicy ═══
  material: {
    polyester: [
      "> poly strings. spin monster, arm destroyer. hope your physio accepts OnlyFans as payment.",
      "> polyester user. your elbow is already planning its escape to a better life.",
    ],
    multifilament: [
      "> multi. soft, comfy, spinless. you're basically playing tennis with a pillow and good intentions.",
      "> arm-friendly choice. the grid respects your fragile joints, coward.",
    ],
    naturalGut: [
      "> natural gut. expensive and high-maintenance, just like the girls you simp for.",
      "> premium strings for premium copium. worth the money? grid says cope harder.",
    ],
    hybrid: [
      "> hybrid setup. couldn't commit to one string so you went full indecisive bisexual on the bed. respect.",
      "> mains and crosses in an open relationship. chaotic. hot. probably bad for longevity.",
    ],
  },

  // ═══ BRAND BIAS — for chaining ═══
  brandBias: {
    babolat: [
      "> babolat detected. grid approves. pure aero? pure sex. pure drive? pure daddy issues.",
      "> simping for babolat i see. respectable. those tits on the aero beam don't lie.",
      "> french engineering, spanish forehand, american delusion. the holy trinity.",
    ],
    wilson: [
      "> wilson frame. classic. boring. like choosing vanilla at a gelato shop in rome.",
      "> pro staff? more like pro coping mechanism for your declining ATP dreams.",
      "> blade user detected. hope you like your control like you like your dating life — stiff and unforgiving.",
    ],
    yonexPercept: [
      "> percept? yonex? we get it, you watched a 3-minute youtube review and now you're an expert.",
      "> isometric head for isometric delusions. the placebo effect in racquet form.",
      "> japanese precision wasted on your western grip and eastern technique.",
    ],
  },

  // ═══ DEFAULT/IDLE — now with more personality ═══
  idle: [
    "> GRID_MONITOR_V4 ONLINE. simping babolat, bullying wilson, roasting percept delusions, and lowkey horny for tiddies.",
    "> terminal idle... but the grid is never truly quiet. feed me a setup or suffer random sauce.",
    "> STATUS: waiting for telemetry... or just thinking about smooth armpits again.",
    "> GRID_MONITOR_V4 ONLINE. currently judging your existence and finding it mid.",
    "> awaiting telemetry... or just your next terrible life decision. either works.",
    "> terminal is bored. feed me a setup so i can verbally curb-stomp it.",
    "> STATUS: horny for bad physics and big racquet tits. entertain me, mortal.",
  ],
};

// ═══════════════════════════════════════════════════════════════
// SECRET SAUCE EXPORT
// ═══════════════════════════════════════════════════════════════

/**
 * NEW: Random secret sauce drop (for idle mode)
 */
export function getRandomSecretSauce(): string {
  return pick(secretSauce);
}

/**
 * NEW: Roast chaining — sometimes adds a spicy "but wait there's more" follow-up
 */
function getChainRoast(setup: SetupMetrics): string | null {
  if (Math.random() > 0.65) return null; // 35% chance of chaining for that alive feel

  const chains: string[] = [];

  // Brand-specific chain
  if (setup.frameName.toLowerCase().includes('babolat')) {
    chains.push(pick(roasts.brandBias.babolat));
  } else if (setup.frameName.toLowerCase().includes('wilson')) {
    chains.push(pick(roasts.brandBias.wilson) + " ...and it still hurts.");
  } else if (setup.frameName.toLowerCase().includes('percept') || setup.frameName.toLowerCase().includes('yonex')) {
    chains.push(pick(roasts.brandBias.yonexPercept));
  }

  // Delusion chain
  if (setup.obs > 80 && setup.swingweight > 330) {
    chains.push("> but wait there's more — you built a pro stick with weekend warrior footwork. adorable.");
  }

  if (chains.length === 0) return null;
  return "but wait there's more... " + pick(chains);
}

// ═══════════════════════════════════════════════════════════════
// JUDGMENT ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a context-aware roast based on setup metrics.
 * Returns a typewritten-style diagnostic message.
 * NOW WITH CHAINING + SAUCE INTEGRATION
 */
export function generateGridJudgment(setup: SetupMetrics | null): string {
  if (!setup) {
    return pick(roasts.idle);
  }

  const { obs, swingweight, headSize, mainsTension, crossesTension, isHybrid, material } = setup;

  // ─── EASTER EGG: The Forbidden 16x19 ─────────────────────────
  if (mainsTension === 16 && crossesTension === 19) {
    return pick(roasts.easterEggs.illegalPhysics);
  }

  // ─── EASTER EGG: Uniform Weird ───────────────────────────────
  if (mainsTension === crossesTension && (mainsTension === 16 || mainsTension === 19)) {
    return pick(roasts.easterEggs.uniformWeird);
  }

  const judgments: string[] = [];

  // ─── HEAD SIZE JUDGMENT ──────────────────────────────────────
  if (headSize > 110) {
    judgments.push(pick(roasts.headSize.oversize));
  } else if (headSize >= 107) {
    judgments.push(pick(roasts.headSize.large));
  } else if (headSize < 95) {
    judgments.push(pick(roasts.headSize.midsize));
  }

  // ─── SWINGWEIGHT JUDGMENT ────────────────────────────────────
  const weightClass = getWeightClass(swingweight);
  judgments.push(pick(roasts.swingweight[weightClass]));

  // ─── TENSION JUDGMENT ────────────────────────────────────────
  const tensionCat = getTensionCategory(mainsTension);
  judgments.push(pick(roasts.tension[tensionCat]));

  // ─── OBS JUDGMENT ────────────────────────────────────────────
  if (obs > 85) {
    judgments.push(pick(roasts.obs.elite));
  } else if (obs > 75) {
    judgments.push(pick(roasts.obs.high));
  } else if (obs > 60) {
    judgments.push(pick(roasts.obs.mid));
  } else {
    judgments.push(pick(roasts.obs.low));
  }

  // ─── MATERIAL JUDGMENT ───────────────────────────────────────
  if (isHybrid) {
    judgments.push(pick(roasts.material.hybrid));
  } else if (material) {
    const matLower = material.toLowerCase();
    if (matLower.includes('poly')) {
      judgments.push(pick(roasts.material.polyester));
    } else if (matLower.includes('multi')) {
      judgments.push(pick(roasts.material.multifilament));
    } else if (matLower.includes('gut')) {
      judgments.push(pick(roasts.material.naturalGut));
    }
  }

  // ─── BUILD MAIN ROAST ────────────────────────────────────────
  let mainRoast = pick(judgments);

  // Roast chaining — makes it feel alive and conversational
  const chain = getChainRoast(setup);
  if (chain) {
    mainRoast += `\n> ${chain}`;
  }

  // Occasionally inject secret sauce even in active roasts for max unhinged
  if (Math.random() > 0.75) {
    mainRoast += `\n> ${getRandomSecretSauce()}`;
  }

  return mainRoast;
}

/**
 * Extract metrics from a Loadout for the judgment engine.
 * Requires frame data lookup since Loadout only stores IDs.
 */
export function extractMetricsFromLoadout(
  loadout: Loadout | null,
  frameLookup: Map<string, Racquet>,
  stringLookup: Map<string, StringData>
): SetupMetrics | null {
  if (!loadout) return null;

  const frame = frameLookup.get(loadout.frameId);
  if (!frame) return null;

  let stringName: string | undefined;
  let material: string | undefined;

  if (loadout.isHybrid && loadout.mainsId) {
    const mains = stringLookup.get(loadout.mainsId);
    stringName = mains?.name;
    material = mains?.material;
  } else if (!loadout.isHybrid && loadout.stringId) {
    const str = stringLookup.get(loadout.stringId);
    stringName = str?.name;
    material = str?.material;
  }

  return {
    obs: loadout.obs ?? 0,
    swingweight: frame.swingweight ?? 300,
    headSize: frame.headSize ?? 100,
    mainsTension: loadout.mainsTension ?? 50,
    crossesTension: loadout.crossesTension ?? 50,
    frameName: frame.name ?? 'Unknown Frame',
    stringName,
    isHybrid: loadout.isHybrid,
    material,
  };
}

/**
 * Generate a response to user terminal commands.
 */
export function generateCommandResponse(command: string): string {
  const cmd = command.toLowerCase().trim();

  // Help
  if (cmd === 'help' || cmd === '?') {
    return [
      "> AVAILABLE COMMANDS:",
      ">   help, ?     - Show this message",
      ">   clear       - Clear terminal log",
      ">   praise      - Request validation (denied)",
      ">   status      - Grid monitor status",
      ">   roast       - Force new roast",
      ">   16x19       - Forbidden knowledge",
      ">   sauce       - Random secret transmission",
    ].join('\n');
  }

  // Clear
  if (cmd === 'clear') {
    return "> CLEARING LOG...";
  }

  // Praise / validation requests
  if (cmd.includes('praise') || cmd.includes('compliment') || cmd.includes('good')) {
    const responses = [
      "> Request denied. I only analyze telemetry, biological unit.",
      "> Validation not found in protocol dictionary.",
      "> System flattered. AURA limit temporarily... no, still cynical.",
      "> Praise subroutine corrupted. Remaining cynical.",
    ];
    return pick(responses);
  }

  // Status
  if (cmd === 'status') {
    return [
      "> GRID_MONITOR_V4 STATUS:",
      ">   Uptime: ∞",
      ">   Cynicism: MAXIMUM",
      ">   Roast Buffer: READY",
      ">   Ego Damage: ACCEPTABLE LEVELS",
      ">   Secret Sauce: ACTIVATED",
    ].join('\n');
  }

  // Force roast
  if (cmd === 'roast' || cmd === 'judge' || cmd === 'analyze') {
    return "> MANUAL ROAST TRIGGERED. Awaiting telemetry...";
  }

  // Secret sauce command
  if (cmd === 'sauce' || cmd === 'secret') {
    return getRandomSecretSauce();
  }

  // Easter egg
  if (cmd === '16x19') {
    return "> 16x19 is not a pattern. It is a way of life. Grid respects your devotion.";
  }

  // Unknown
  const unknownResponses = [
    `> Command '${cmd}' not recognized. Try 'help' for available commands.`,
    `> Unknown directive: '${cmd}'. Grid remains unimpressed.`,
    `> '${cmd}' rejected. This is a monitoring terminal, not a chatbot.`,
  ];
  return pick(unknownResponses);
}

/**
 * Check if a setup should trigger auto-open of terminal (dramatic moments).
 */
export function shouldAutoOpenTerminal(setup: SetupMetrics | null): boolean {
  if (!setup) return false;

  // Auto-open for dramatic setups
  if (setup.mainsTension === 16 && setup.crossesTension === 19) return true;
  if (setup.headSize > 115) return true;
  if (setup.swingweight > 340) return true;
  if (setup.mainsTension < 40 || setup.mainsTension > 70) return true;
  if (setup.obs > 90) return true;

  return false;
}

/**
 * Export randInt for use in terminal component idle intervals
 */
export { randInt };

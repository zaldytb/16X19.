// ============================================
// TENNIS LOADOUT LAB — Data + Engine + UI
// ============================================

// ============================================
// DATA: RACQUETS
// ============================================
const RACQUETS = [
  {
    id: "babolat-pure-aero-100-2023",
    name: "Babolat Pure Aero 100 318g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 318,
    stiffness: 66,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 59],
    frameProfile: "Aero-shaped beam with spin-enhancing grommets",
    identity: "Spin Cannon",
    notes: "Classic spin-focused frame. Variable beam width (26mm peak) adds free power. 66 RA provides moderate stiffness. 16x19 open pattern maximizes string movement."
  },
  {
    id: "head-speed-mp-2024",
    name: "Head Speed MP 315g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 315,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 330,
    stiffness: 63,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant box beam with Auxetic 2 in yoke/handle",
    identity: "All-Rounder",
    notes: "Flat 23mm box beam. Auxetic 2 improves comfort and feel. Higher swingweight (330) than typical 100sq in frames. Good stability. 63 RA is moderate flex."
  },
  {
    id: "head-speed-mp-legend-2025",
    name: "Head Speed MP Legend 318g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 329,
    stiffness: 60,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant box beam with Hy-Bor (boron+carbon) + Auxetic 2",
    identity: "Precision All-Rounder",
    notes: "Djokovic signature cosmetic. Same mold as Speed MP but with Hy-Bor material — maximizes stability and feel. 60 RA is notably soft for a 100sq in frame. Slightly heavier than 2024 version (318g vs 315g strung). Enhanced stability and comfort over 2024."
  },
  {
    id: "head-speed-pro-legend-2025",
    name: "Head Speed Pro Legend 326g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 326,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 328,
    stiffness: 61,
    beamWidth: [23, 23, 23],
    pattern: "18x20",
    powerLevel: "Low",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant box beam with Hy-Bor (boron+carbon) + Auxetic 2 + Graphene Inside",
    identity: "Precision Control",
    notes: "Djokovic signature. Dense 18x20 pattern delivers exceptional control and a connected, predictable ball flight. Hy-Bor boron composite in the shaft maximizes stability and crisp feel at impact. 61 RA flex provides comfort without sacrificing responsiveness. Lower swingweight than 2024 Speed Pro improves maneuverability while maintaining plough-through."
  },
  {
    id: "head-speed-pro-2024",
    name: "Head Speed Pro 325g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 325,
    balance: 32.0,
    balancePts: "6 pts HL",
    swingweight: 330,
    stiffness: 62,
    beamWidth: [23, 23, 23],
    pattern: "18x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant box beam, dense pattern, Auxetic 2",
    identity: "Surgeon's Scalpel",
    notes: "18x20 dense pattern for flatter hitters. Heavier static weight but same swingweight as MP due to more head-light balance. Lower power assist, higher control ceiling."
  },
  {
    id: "wilson-blade-98-v8",
    name: "Wilson Blade 98 v8 320g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 320,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 322,
    stiffness: 63,
    beamWidth: [21, 21, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 60],
    frameProfile: "Thin constant beam, braided graphite + Fortyfive",
    identity: "Control Artist",
    notes: "98sq in head + thin 21mm beam = control-biased. Moderate stiffness at 63 RA. Classic player's frame that rewards clean hitting."
  },
  {
    id: "babolat-pure-drive-2024",
    name: "Babolat Pure Drive 322g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 322,
    balance: 32.5,
    balancePts: "4 pts HL",
    swingweight: 323,
    stiffness: 71,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 59],
    frameProfile: "Variable beam with HTR system",
    identity: "Power Broker",
    notes: "71 RA is stiff — maximum power assist. Variable beam adds launch. The benchmark for 'power racquet' in the intermediate+ category."
  },
  {
    id: "yonex-ezone-100-2024",
    name: "Yonex EZONE 100 315g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 315,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 318,
    stiffness: 68,
    beamWidth: [23.8, 26.5, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 60],
    frameProfile: "Isometric head with VDM vibration dampening",
    identity: "Comfort Power",
    notes: "Isometric head increases sweet spot. VDM system dampens vibration. Good blend of comfort and power. 68 RA is moderately stiff."
  },
  {
    id: "wilson-pro-staff-97-v14",
    name: "Wilson Pro Staff 97 v14 325g",
    year: 2024,
    headSize: 97,
    length: 27,
    strungWeight: 325,
    balance: 31.5,
    balancePts: "7 pts HL",
    swingweight: 320,
    stiffness: 62,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 60],
    frameProfile: "Braided construction, thin constant beam",
    identity: "Classic Heavy Blade",
    notes: "97sq in + thin beam + 62 RA = maximum feel and control. Heavy static weight but low swingweight due to very head-light balance. For advanced full swingers."
  },
  {
    id: "babolat-pure-aero-98-2026",
    name: "Babolat Pure Aero 98 323g",
    year: 2026,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 322,
    stiffness: 66,
    beamWidth: [21, 23, 22],
    pattern: "16x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [46, 55],
    frameProfile: "Aero-shaped variable beam with NF2 flax fiber dampening",
    identity: "Precision Spin Blade",
    notes: "Smallest head and tightest pattern (16x20) in the 2026 Aero family. Thinnest beam (21mm cap) for control. NF2 natural flax fiber tech absorbs harsh vibrations. 66 RA is moderate stiffness. For advanced players wanting spin + precision."
  },
  {
    id: "babolat-pure-aero-100-2026",
    name: "Babolat Pure Aero 100 Gen9 318g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 32.99,
    balancePts: "4 pts HL",
    swingweight: 320,
    stiffness: 66,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [46, 55],
    frameProfile: "Updated aero beam (6% more aerodynamic) with NF2 flax fiber",
    identity: "Spin Cannon v2",
    notes: "2026 update to the classic Aero 100. Redesigned beam is 6% more aerodynamic for faster swing speed. NF2 natural flax fiber dampens vibration. TW topspin score 9.3. Same spin DNA, better comfort than predecessor."
  },
  {
    id: "babolat-pure-aero-team-2026",
    name: "Babolat Pure Aero Team Gen9 301g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 301,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 306,
    stiffness: 66,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [46, 55],
    frameProfile: "Lighter aero beam with NF2 flax fiber dampening",
    identity: "Spin Cannon Lite",
    notes: "Lightweight version of the Pure Aero 100 2026 at 285g unstrung (~301g strung). Same beam shape and 16x19 pattern. Lower swingweight (306) makes it more maneuverable. Ideal for developing players or those wanting spin without the weight."
  },
  {
    id: "head-speed-mp-2026",
    name: "Head Speed MP 318g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 329,
    stiffness: 60,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant box beam with Hy-Bor (boron+carbon) + Auxetic 2",
    identity: "Precision All-Rounder",
    notes: "2026 Speed MP carries the Hy-Bor + Auxetic 2 material from the Legend edition. 60 RA is notably soft for a 100 sq in frame. High swingweight (329) provides excellent stability. Balanced all-court platform."
  },
  {
    id: "head-speed-pro-2026",
    name: "Head Speed Pro 326g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 326,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 328,
    stiffness: 61,
    beamWidth: [23, 23, 23],
    pattern: "18x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant box beam, dense pattern, Hy-Bor + Auxetic 2",
    identity: "Surgeon's Scalpel",
    notes: "Dense 18x20 pattern for flatter hitters seeking maximum control. Heavy at 326g strung but head-light (7 pts HL). 61 RA offers good flex and feel. Hy-Bor material enhances stability. For advanced full swingers."
  },
  {
    id: "head-speed-mp-l-2026",
    name: "Head Speed MP L 295g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 295,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 316,
    stiffness: 61,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Lightweight constant box beam with Hy-Bor + Auxetic 2",
    identity: "Agile All-Rounder",
    notes: "Lightweight Speed variant at 295g strung. Slightly head-heavy shift (3 pts HL) compensates for low mass. Same 61 RA flex and Auxetic 2 feel. Good option for players wanting Speed DNA without the weight."
  },
  {
    id: "yonex-muse-98-2026",
    name: "Yonex Muse 98 323g",
    year: 2026,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 322,
    stiffness: 62,
    beamWidth: [24, 24, 18],
    pattern: "16x18",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 60],
    frameProfile: "Isometric head with Energy Flow Shaft (18mm throat) + Uniform Impact Grommets",
    identity: "Flow State Blade",
    notes: "New 2026 Yonex line replacing the VCORE concept. Radical 18mm throat (Energy Flow Shaft) tapers dramatically for flex and feel. Open 16x18 pattern is unusual for a 98 sq in head — exceptional spin for a control frame. Servo Filter dampens vibration."
  },
  {
    id: "yonex-muse-100-2026",
    name: "Yonex Muse 100 312g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 312,
    balance: 33.0,
    balancePts: "3 pts HL",
    swingweight: 312,
    stiffness: 57,
    beamWidth: [24.5, 24.5, 18],
    pattern: "16x18",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 60],
    frameProfile: "Isometric head with Energy Flow Shaft (18mm throat) + Servo Filter",
    identity: "Comfort Flow",
    notes: "Extremely flexible at 57 RA — one of the softest 100 sq in frames on tour. Energy Flow Shaft (18mm throat) delivers unique feel. Open 16x18 pattern boosts spin. Lower swingweight (312) for easy maneuverability. Comfort-first design."
  },
  {
    id: "yonex-vcore-100-2023",
    name: "Yonex VCORE 100 320g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 320,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 322,
    stiffness: 65,
    beamWidth: [25.3, 25.3, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 60],
    frameProfile: "Isometric head with SIF grommets for string snapback, widened hoop at 10/2",
    identity: "Launch Pad",
    notes: "Widest beam in this group (25.3mm constant). SIF grommets maximize string snapback for spin. Wider hoop at 10 and 2 o'clock raises launch angle. 65 RA is moderate-stiff. Good power + spin blend."
  },
  {
    id: "head-gravity-pro-2025",
    name: "Head Gravity Pro 332g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 332,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 329,
    stiffness: 59,
    beamWidth: [20, 20, 20],
    pattern: "18x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Teardrop head shape, thin constant beam, Auxetic 2",
    identity: "The Heavy Scalpel",
    notes: "Heaviest frame in this group at 332g strung. Thinnest beam in the Gravity family (20mm constant). Dense 18x20 pattern + 59 RA flex = maximum control and feel. Teardrop head shape shifts mass to 12 o'clock. For advanced baseliners."
  },
  {
    id: "head-gravity-tour-2025",
    name: "Head Gravity Tour 323g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 32.99,
    balancePts: "4 pts HL",
    swingweight: 328,
    stiffness: 59,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Teardrop head shape, constant beam, Auxetic 2",
    identity: "Control Artist",
    notes: "2025 redesign with 98 sq in head (was 100) and 16x19 pattern (was 18x20). More spin-friendly than previous Gravity Tour. Teardrop head shifts sweetspot higher. 59 RA flex provides excellent feel. High swingweight (328) for stability."
  },
  {
    id: "head-gravity-mp-2025",
    name: "Head Gravity MP 312g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 312,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 323,
    stiffness: 57,
    beamWidth: [22, 22, 22],
    pattern: "16x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Teardrop head shape, constant beam, Half Cap grommet system",
    identity: "Flex Control",
    notes: "Lowest stiffness in this group at 57 RA — maximum flex and comfort. Half Cap grommet system enhances string movement. 16x20 pattern adds control over a standard 16x19. Lighter weight (312g) with slight head-heavy lean (3 pts HL) for easy handling."
  },
  {
    id: "wilson-shift-99-2025",
    name: "Wilson Shift 99 318g",
    year: 2025,
    headSize: 99,
    length: 27,
    strungWeight: 318,
    balance: 32.39,
    balancePts: "6 pts HL",
    swingweight: 317,
    stiffness: 67,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "16x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 58],
    frameProfile: "Constant beam, low vertical flex, Shift construction",
    identity: "Spin Architect",
    notes: "Modern spin-focused frame with unique low vertical flex and high lateral stiffness. 16x20 dense pattern balances spin access with control. Constant 23.5mm beam provides uniform flex. 67 RA moderately stiff. 318g strung with 6 pts HL for head-light maneuvering."
  },
  {
    id: "wilson-shift-99l-2025",
    name: "Wilson Shift 99 L 301g",
    year: 2025,
    headSize: 99,
    length: 27,
    strungWeight: 301,
    balance: 32.64,
    balancePts: "5 pts HL",
    swingweight: 311,
    stiffness: 68,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "16x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 58],
    frameProfile: "Constant beam, low vertical flex, Shift Lite construction",
    identity: "Accessible Spin",
    notes: "Lighter Shift variant at 301g strung for intermediate players. Same low vertical flex design as Shift 99. Slightly higher stiffness (68 RA) compensates for lighter weight. 5 pts HL balance. Same 16x20 pattern for spin-friendly control."
  },
  {
    id: "wilson-rf01-pro-2025",
    name: "Wilson RF01 Pro 337g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 337,
    balance: 32.39,
    balancePts: "6 pts HL",
    swingweight: 331,
    stiffness: 67,
    beamWidth: [23.2, 23, 22],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 60],
    frameProfile: "Tapering beam, Carbon Braid FORTYFIVE, leather grip",
    identity: "Precision Hammer",
    notes: "Federer collaboration. 337g strung — one of the heaviest modern frames. Carbon Braid FORTYFIVE construction for precision and stability. Leather grip adds mass at handle. Tapering beam from 23.2mm to 22mm. High swingweight (331) requires advanced technique. 67 RA moderately stiff."
  },
  {
    id: "wilson-rf01-2025",
    name: "Wilson RF01 318g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 318,
    balance: 32.64,
    balancePts: "5 pts HL",
    swingweight: 319,
    stiffness: 64,
    beamWidth: [23.2, 23, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 60],
    frameProfile: "Tapering beam, foam interior dampening, synthetic grip",
    identity: "Flex Precision",
    notes: "Lighter, softer RF01 variant at 318g strung. Foam interior adds vibration dampening and comfort. Lower stiffness (64 RA) provides more flex and arm-friendliness. Same tapering beam profile as RF01 Pro. 16x19 for spin access. More accessible than the Pro version."
  },
  {
    id: "babolat-pure-strike-97-2025",
    name: "Babolat Pure Strike 97 332g",
    year: 2025,
    headSize: 97,
    length: 27,
    strungWeight: 332,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 322,
    stiffness: 63,
    beamWidth: [21, 22, 21],
    pattern: "16x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Thin constant beam, NF2-Tech, leather grip",
    identity: "Surgical Control",
    notes: "Thinnest beam in the Pure Strike line at 21/22/21mm. NF2-Tech for enhanced feel. Leather grip adds weight at handle — 7 pts HL is extremely head-light. 332g strung for stability. 63 RA flex for comfort and feel. 16x20 dense pattern maximizes control. 97 sq in head demands precision."
  },
  {
    id: "babolat-pure-strike-98-16x19-2025",
    name: "Babolat Pure Strike 98 16x19 323g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 330,
    stiffness: 64,
    beamWidth: [21, 23, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Variable beam, FSI Control tech, C-Fly construction",
    identity: "Attack Control",
    notes: "FSI Control technology optimizes string interaction. 16x19 open pattern provides more spin access than 18x20 sibling. Variable beam (21/23/21mm) adds slight power boost at throat. 330 swingweight for plow-through. 64 RA provides moderate flex. 4 pts HL balance."
  },
  {
    id: "babolat-pure-strike-98-18x20-2025",
    name: "Babolat Pure Strike 98 18x20 323g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 332,
    stiffness: 63,
    beamWidth: [21, 23, 21],
    pattern: "18x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Variable beam, dense pattern, FSI Control tech",
    identity: "Flat Control",
    notes: "Dense 18x20 pattern for maximum control and flat ball-striking. Same frame as 16x19 sibling but 2 more cross strings reduce string movement. Slightly higher swingweight (332) due to extra string. 63 RA — slightly softer flex than the 16x19. Ideal for serve-and-volley and flat hitters."
  },
  {
    id: "babolat-pure-strike-100-16x19-2025",
    name: "Babolat Pure Strike 100 16x19 318g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 32.99,
    balancePts: "4 pts HL",
    swingweight: 324,
    stiffness: 63,
    beamWidth: [21, 23, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Variable beam, largest Pure Strike head, C-Fly construction",
    identity: "Forgiving Control",
    notes: "Most forgiving frame in the Pure Strike line with 100 sq in head. Larger sweetspot compensates for off-center hits. 318g strung — lightest Strike for easier handling. Same 21/23/21mm beam profile. 63 RA for comfortable flex. 16x19 adds spin access. Best entry point to the Strike line."
  },
  {
    id: "solinco-whiteout-v2-290-2025",
    name: "Solinco Whiteout v2 290 303g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 303,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 315,
    stiffness: 65,
    beamWidth: [21.7, 21.7, 21.7],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 55],
    frameProfile: "Constant box beam, Arch-2 construction, 40T Carbon",
    identity: "Light Control",
    notes: "Light control frame at 303g strung. Arch-2 construction enhances torsional stability. 40T high-modulus carbon for crisp feel. Constant 21.7mm box beam for consistent flex. 3 pts HL balance makes it slightly more head-heavy than the 305. 65 RA moderate stiffness. Accessible for intermediate players seeking precision."
  },
  {
    id: "solinco-whiteout-v2-305-2025",
    name: "Solinco Whiteout v2 305 323g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 328,
    stiffness: 65,
    beamWidth: [21.7, 21.7, 21.7],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 55],
    frameProfile: "Constant box beam, Arch-2 construction, 40T Carbon",
    identity: "Classic Control",
    notes: "Classic control frame with 323g strung weight. Constant 21.7mm box beam for uniform flex and clean feel. 40T high-modulus carbon construction for precision. 328 swingweight for stability and plow-through. 65 RA moderate stiffness with good comfort. The heavier sibling of the 290 — built for advanced baseliners."
  },
  {
    id: "solinco-blackout-v2-300-2025",
    name: "Solinco Blackout v2 300 320g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 320,
    balance: 32.39,
    balancePts: "6 pts HL",
    swingweight: 317,
    stiffness: 66,
    beamWidth: [23.5, 26, 23],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 55],
    frameProfile: "Variable beam, Power Flex Zone, Foam Tech Core",
    identity: "Power Tweener",
    notes: "Versatile all-court frame with variable beam (23.5/26/23mm) for power boost. Power Flex Zone enhances energy return. Foam Tech Core for vibration dampening and comfort. 100 sq in head for forgiveness. 320g strung with 6 pts HL for head-light feel. 66 RA moderate stiffness. Bridge between power and control."
  },
  {
    id: "solinco-blackout-v2-285-2025",
    name: "Solinco Blackout v2 285 301g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 301,
    balance: 33.99,
    balancePts: "1 pt HL",
    swingweight: 314,
    stiffness: 67,
    beamWidth: [23.5, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [45, 55],
    frameProfile: "Variable beam, Power Flex Zone, Foam Tech Core",
    identity: "Easy Power",
    notes: "Lightweight Blackout at 301g strung for juniors and recreational players. Nearly even balance (1 pt HL) shifts mass toward the head for extra free power. Same variable beam profile as the 300. Higher stiffness (67 RA) compensates for lighter weight. Most powerful frame in the Solinco lineup. Foam Tech Core for comfort."
  },

  // ========== HEAD ADDITIONAL LINES ==========
  {
    id: "head-speed-tour-2026",
    name: "Head Speed Tour 323g",
    year: 2026,
    headSize: 97,
    length: 27,
    strungWeight: 323,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 325,
    stiffness: 61,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant box beam with Hy-Bor (boron+carbon) + Auxetic 2",
    identity: "Compact Precision",
    notes: "New 97 sq in Speed variant sitting between MP and Pro. Constant 23mm box beam with 61 RA flex. 6 pts HL balance with 325 swingweight for stability. Hy-Bor boron composite in shaft. 16x19 open pattern for spin access in a control-oriented frame. For advanced all-court players wanting a smaller head."
  },
  {
    id: "head-speed-elite-2026",
    name: "Head Speed Elite 289g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 289,
    balance: 33.5,
    balancePts: "2 pts HL",
    swingweight: 303,
    stiffness: 63,
    beamWidth: [25, 25, 25],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Wide constant beam with Hy-Bor + Auxetic 2",
    identity: "Easy Speed",
    notes: "Lightweight Speed variant at 289g strung with wider 25mm beam for more power assist. 2 pts HL balance and 303 swingweight for easy handling. 63 RA moderate stiffness. 100 sq in head for forgiveness. Entry-level Speed for recreational players stepping up."
  },
  {
    id: "head-speed-team-2026",
    name: "Head Speed Team 283g",
    year: 2026,
    headSize: 105,
    length: 27,
    strungWeight: 283,
    balance: 33.27,
    balancePts: "5 pts HL",
    swingweight: 303,
    stiffness: 62,
    beamWidth: [24, 24, 24],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Oversized head with Hy-Bor + Auxetic 2",
    identity: "Forgiving Speed",
    notes: "Oversized 105 sq in Speed variant for maximum forgiveness. Lightweight at 283g strung. 5 pts HL balance unusual for a lightweight — keeps it maneuverable. 62 RA flex for comfort. 24mm constant beam. For developing players or doubles specialists."
  },
  {
    id: "head-speed-mp-ul-2026",
    name: "Head Speed MP UL 278g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 278,
    balance: 33.5,
    balancePts: "2 pts HL",
    swingweight: 291,
    stiffness: 61,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Ultra-light constant box beam with Hy-Bor + Auxetic 2",
    identity: "Ultra-Light Speed",
    notes: "Lightest Speed at 278g strung (265g unstrung). Maintains 23mm box beam and 100 sq in head. Very low swingweight (291) for easy maneuverability. 2 pts HL with 61 RA flex. For juniors, seniors, or players wanting Speed DNA at minimal weight."
  },
  {
    id: "head-boom-pro-2026",
    name: "Head Boom Pro 326g",
    year: 2026,
    headSize: 98,
    length: 27,
    strungWeight: 326,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 325,
    stiffness: 64,
    beamWidth: [22, 22, 21.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Morph Beam with Hy-Bor + Auxetic 2, unique head shape",
    identity: "Boom Control",
    notes: "Heaviest Boom at 326g strung with 7 pts HL balance. Hy-Bor boron in shaft for stability. 98 sq in head + 64 RA for control-oriented play. Morph Beam transitions from 22mm to 21.5mm. Unique head shape provides forgiving upper hoop. For advanced baseliners."
  },
  {
    id: "head-boom-mp-2026",
    name: "Head Boom MP 312g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 312,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 316,
    stiffness: 61,
    beamWidth: [23, 24, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Morph Beam with Hy-Bor + Auxetic 2",
    identity: "Flexible Power",
    notes: "100 sq in Boom with 61 RA — flexible and arm-friendly. Morph Beam (23/24/22mm) provides slight power boost at throat. 6 pts HL for head-light feel despite 312g weight. Hy-Bor in shaft. Good blend of power, spin, and comfort."
  },
  {
    id: "head-boom-mp-l-2026",
    name: "Head Boom MP L 289g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 289,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 305,
    stiffness: 63,
    beamWidth: [23, 24, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Lightweight Morph Beam with Hy-Bor + Auxetic 2",
    identity: "Light Boom",
    notes: "Lightweight Boom at 289g strung. Same Morph Beam profile as Boom MP. 3 pts HL balance for easier handling. 63 RA slightly stiffer than MP. 305 swingweight. For intermediate players wanting Boom DNA with less weight."
  },
  {
    id: "head-boom-mp-ul-2026",
    name: "Head Boom MP UL 269g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 269,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 290,
    stiffness: 62,
    beamWidth: [23, 24, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Ultra-light Morph Beam with Auxetic 2",
    identity: "Ultra-Light Boom",
    notes: "Lightest Boom at 269g strung. Same Morph Beam as other Boom MPs. Very low swingweight (290) for maximum maneuverability. 62 RA flex for comfort. For juniors, beginners, or players needing minimal weight."
  },
  {
    id: "head-boom-team-2026",
    name: "Head Boom Team 275g",
    year: 2026,
    headSize: 107,
    length: 27,
    strungWeight: 275,
    balance: 34.67,
    balancePts: "Even",
    swingweight: 313,
    stiffness: 62,
    beamWidth: [26, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Oversized head with wide beam, Hy-Bor + Auxetic 2",
    identity: "Power Launcher",
    notes: "Largest Boom head at 107 sq in with 26mm wide beam for maximum power assist. Even balance pushes mass toward head for effortless power. 275g strung for easy handling. 62 RA flex. For recreational and developing players seeking easy power and forgiveness."
  },
  {
    id: "head-boom-elite-2026",
    name: "Head Boom Elite 283g",
    year: 2026,
    headSize: 107,
    length: 27,
    strungWeight: 283,
    balance: 35.48,
    balancePts: "3 pts HH",
    swingweight: 310,
    stiffness: 62,
    beamWidth: [23, 26, 22],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Oversized variable beam with Auxetic 2",
    identity: "Easy Launcher",
    notes: "Oversized 107 sq in Boom with head-heavy balance (3 pts HH) for maximum power without effort. Variable beam (23/26/22mm) adds launch at throat. 283g strung. 62 RA for comfort. For beginners and recreational players wanting effortless power."
  },
  {
    id: "head-radical-pro-2025",
    name: "Head Radical Pro 332g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 332,
    balance: 32.39,
    balancePts: "6 pts HL",
    swingweight: 329,
    stiffness: 65,
    beamWidth: [20, 21.5, 21],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Variable beam with Auxetic 2, Graphene Inside",
    identity: "Heavy Radical",
    notes: "Heaviest Radical at 332g strung. Thin variable beam (20/21.5/21mm) for control. 98 sq in head + 16x19 pattern provides good spin access. 65 RA moderate stiffness. 329 swingweight for plough-through. 6 pts HL balance. For advanced players seeking a heavier control frame with spin."
  },
  {
    id: "head-radical-mp-2025",
    name: "Head Radical MP 318g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 318,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 323,
    stiffness: 66,
    beamWidth: [20, 23, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Variable beam with Auxetic 2, Graphene Inside",
    identity: "Radical All-Rounder",
    notes: "Core Radical frame at 318g strung. Variable beam (20/23/21mm) adds power at throat. 98 sq in head with 16x19 pattern for spin. 66 RA moderate stiffness. 4 pts HL balanced feel. Good all-around frame for intermediate to advanced players."
  },
  {
    id: "head-radical-team-2025",
    name: "Head Radical Team 295g",
    year: 2025,
    headSize: 102,
    length: 27,
    strungWeight: 295,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 303,
    stiffness: 63,
    beamWidth: [22, 25, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Wider variable beam with Auxetic 2",
    identity: "Accessible Radical",
    notes: "Larger 102 sq in head for more forgiveness. Lighter at 295g strung. Wider beam (22/25/23mm) for more power. 63 RA softer flex. 303 swingweight for easy handling. 4 pts HL balance. Entry point to the Radical line for intermediate players."
  },
  {
    id: "head-radical-team-l-2025",
    name: "Head Radical Team L 278g",
    year: 2025,
    headSize: 102,
    length: 27,
    strungWeight: 278,
    balance: 34.8,
    balancePts: "2 pts HH",
    swingweight: 304,
    stiffness: 66,
    beamWidth: [22, 25, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Lightweight variable beam with Auxetic 2",
    identity: "Light Radical",
    notes: "Lightest Radical at 278g strung. Head-heavy balance (2 pts HH) compensates for low mass. 102 sq in head for forgiveness. 66 RA stiffer than Team to maintain crispness. Same beam profile as Radical Team. For juniors and recreational players."
  },
  {
    id: "head-extreme-pro-2024",
    name: "Head Extreme Pro 323g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 322,
    stiffness: 64,
    beamWidth: [22, 23, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Variable beam with Auxetic 2, Spin Grommets",
    identity: "Spin Control",
    notes: "Control-oriented Extreme with 98 sq in head. Spin Grommets enhance string movement and snapback. Variable beam (22/23/21mm). 64 RA moderate stiffness. 6 pts HL balance. 322 swingweight. For advanced players wanting spin access with precision."
  },
  {
    id: "head-extreme-mp-2024",
    name: "Head Extreme MP 318g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 32.99,
    balancePts: "4 pts HL",
    swingweight: 323,
    stiffness: 66,
    beamWidth: [23, 26, 21],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Wide variable beam with Auxetic 2, Spin Grommets, Spin Shaft",
    identity: "Spin Launcher",
    notes: "Main Extreme frame with widest beam in the line (26mm at throat) for power. Spin Grommets + Spin Shaft maximize string snapback and launch angle. 66 RA moderate-stiff. 100 sq in head for forgiveness. Spin-focused all-rounder."
  },
  {
    id: "head-extreme-team-2024",
    name: "Head Extreme Team 278g",
    year: 2024,
    headSize: 105,
    length: 27,
    strungWeight: 278,
    balance: 34.8,
    balancePts: "2 pts HH",
    swingweight: 304,
    stiffness: 61,
    beamWidth: [23, 26, 21],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [52, 62],
    frameProfile: "Oversized with Auxetic 2, Spin Grommets, Spin Shaft",
    identity: "Easy Spin",
    notes: "Largest Extreme head at 105 sq in. Lightweight at 278g strung with head-heavy balance (2 pts HH) for easy power. Wide variable beam (23/26/21mm). 61 RA soft flex. Spin Grommets for extra spin. For recreational and developing players."
  },
  {
    id: "head-extreme-mp-l-2024",
    name: "Head Extreme MP L 295g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 295,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 308,
    stiffness: 64,
    beamWidth: [23, 26, 21],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Lightweight variable beam with Auxetic 2, Spin Grommets",
    identity: "Light Spin",
    notes: "Lighter Extreme MP at 295g strung. Same wide beam profile (23/26/21mm) for power. 100 sq in head with Spin Grommets. 64 RA moderate stiffness. 3 pts HL balance. 308 swingweight. For intermediate players wanting spin with manageable weight."
  },
  {
    id: "head-gravity-team-2025",
    name: "Head Gravity Team 283g",
    year: 2025,
    headSize: 104,
    length: 27,
    strungWeight: 283,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 304,
    stiffness: 57,
    beamWidth: [24, 24, 24],
    pattern: "16x20",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Teardrop head, constant beam, Half Cap technology",
    identity: "Flexible Team",
    notes: "Largest Gravity head at 104 sq in. Very soft at 57 RA — same flex as Gravity MP. Constant 24mm beam. 16x20 dense pattern unusual for a Team frame — adds control. Teardrop head shape. Lightweight at 283g strung. For intermediate players wanting Gravity comfort."
  },
  {
    id: "head-gravity-team-l-2025",
    name: "Head Gravity Team L 283g",
    year: 2025,
    headSize: 104,
    length: 27,
    strungWeight: 283,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 304,
    stiffness: 57,
    beamWidth: [24, 24, 24],
    pattern: "16x20",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Teardrop head, constant beam, Auxetic 2, Half Cap technology",
    identity: "Gravity Lite",
    notes: "Lightest Gravity variant. Same 104 sq in teardrop head and 57 RA flex as Gravity Team. Very comfortable and forgiving. 16x20 pattern for control. For recreational and developing players wanting maximum comfort."
  },
  {
    id: "head-prestige-pro-2023",
    name: "Head Prestige Pro 337g",
    year: 2023,
    headSize: 98,
    length: 27,
    strungWeight: 337,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 324,
    stiffness: 58,
    beamWidth: [20, 20, 20],
    pattern: "18x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Thin constant beam with Auxetic 2, Graphene 360+",
    identity: "Classic Prestige",
    notes: "Heaviest Head frame at 337g strung. Thinnest beam at 20mm constant. 58 RA — very flexible for exceptional feel. 18x20 dense pattern for maximum control. 7 pts HL balance. 98 sq in head. For advanced players seeking premium feel and precision. The purist's racquet."
  },
  {
    id: "head-prestige-tour-2023",
    name: "Head Prestige Tour 332g",
    year: 2023,
    headSize: 95,
    length: 27,
    strungWeight: 332,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 330,
    stiffness: 62,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant beam with Auxetic 2, Graphene Inside",
    identity: "Tour Precision",
    notes: "Smallest Head frame at 95 sq in. 22mm constant beam. 62 RA moderate flex. 16x19 pattern gives more spin than Pro. Heavy at 332g with 330 swingweight — maximum stability. 6 pts HL balance. Unique small head demands precision but rewards clean hitting."
  },
  {
    id: "head-prestige-mp-2023",
    name: "Head Prestige MP 326g",
    year: 2023,
    headSize: 99,
    length: 27,
    strungWeight: 326,
    balance: 33.2,
    balancePts: "3 pts HL",
    swingweight: 327,
    stiffness: 62,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "18x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 57],
    frameProfile: "Thin constant box beam with Auxetic 2, Graphene Inside",
    identity: "Box Beam Classic",
    notes: "99 sq in head with unique 18x19 pattern. Classic 21.5mm box beam for clean feel. 62 RA moderate flex. 326g strung with 327 swingweight for stability. 3 pts HL balance. The quintessential box beam player's frame. For advanced all-court players."
  },
  {
    id: "head-prestige-mp-l-2023",
    name: "Head Prestige MP L 318g",
    year: 2023,
    headSize: 99,
    length: 27,
    strungWeight: 318,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 309,
    stiffness: 61,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Lightweight box beam with Auxetic 2",
    identity: "Light Prestige",
    notes: "Lighter Prestige at 318g strung. 16x19 open pattern (vs 18x19 on MP) for more spin access. 61 RA softer flex. 6 pts HL with 309 swingweight — more maneuverable than MP. Same 21.5mm box beam. Bridge between Prestige precision and everyday playability."
  },
  {
    id: "head-prestige-team-2023",
    name: "Head Prestige Team 300g",
    year: 2023,
    headSize: 99,
    length: 27,
    strungWeight: 300,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 308,
    stiffness: 63,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Lightweight box beam with Auxetic 2, elongated shaft",
    identity: "Accessible Prestige",
    notes: "Lightest Prestige at ~300g strung. Same 21.5mm box beam but 16x19 open pattern for spin. 63 RA stiffer than heavier siblings to maintain crispness. 3 pts HL balance. 308 swingweight for easy handling. Entry point to Prestige precision for intermediate players."
  },

// ========== BABOLAT + TECNIFIBRE ADDITIONAL ==========
  {
    id: "babolat-pure-aero-super-lite-2026",
    name: "Babolat Pure Aero Super Lite 269g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 269,
    balance: 33.5,
    balancePts: "2 pts HL",
    swingweight: 273,
    stiffness: 64,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [44, 53],
    frameProfile: "Ultra-light aero beam with NF2 flax fiber dampening",
    identity: "Featherweight Spin",
    notes: "Lightest Pure Aero at 269g strung. Same aero beam and NF2 tech as the 100. 64 RA moderate stiffness. Very low swingweight (273) makes it extremely maneuverable. 2 pts HL balance. For juniors, seniors, or players who need maximum maneuverability with spin DNA."
  },
  {
    id: "babolat-pure-aero-team-2023",
    name: "Babolat Pure Aero Team 301g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 301,
    balance: 32.64,
    balancePts: "5 pts HL",
    swingweight: 302,
    stiffness: 67,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 59],
    frameProfile: "Aero beam with SWX Pure Feel dampening",
    identity: "Spin Team",
    notes: "Lighter Pure Aero 2023 at 301g strung. Higher stiffness (67 RA) than the standard Aero for more pop. 5 pts HL balance is more head-light than typical team frames. Same aero beam profile. Good stepping stone to the full Aero."
  },
  {
    id: "babolat-pure-aero-lite-2023",
    name: "Babolat Pure Aero Lite 283g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 283,
    balance: 33.99,
    balancePts: "1 pt HL",
    swingweight: 304,
    stiffness: 65,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 59],
    frameProfile: "Lightweight aero beam with NF2-Tech dampening",
    identity: "Light Spin Cannon",
    notes: "Lightweight Pure Aero at 283g strung. Nearly even balance (1 pt HL) compensates for low mass. 65 RA moderate stiffness. Same aero beam profile for spin. 304 swingweight despite light weight. For recreational players wanting spin without the weight."
  },
  {
    id: "babolat-pure-aero-rafa-2023",
    name: "Babolat Pure Aero Rafa 303g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 303,
    balance: 34.0,
    balancePts: "1 pt HL",
    swingweight: 323,
    stiffness: 69,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 59],
    frameProfile: "Aeromodular beam with FSI Spin, Woofer system",
    identity: "Rafa Spin",
    notes: "Nadal signature model. Stiffer than standard Aero (69 RA vs 66) for more power and launch. Nearly even balance (1 pt HL) with 323 swingweight for stability. Same aero beam. Woofer grommet system for extra ball pocketing. Graphite construction without NF2 dampening — more raw feel."
  },
  {
    id: "babolat-pure-aero-rafa-origin-2023",
    name: "Babolat Pure Aero Rafa Origin 337g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 337,
    balance: 34.0,
    balancePts: "1 pt HL",
    swingweight: 371,
    stiffness: 70,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 59],
    frameProfile: "Heavy aero beam with FSI Spin, no dampening tech",
    identity: "Rafa Pro Spec",
    notes: "Closest to Nadal's actual match spec. Extremely heavy at 337g strung with 371 swingweight — one of the highest in any production frame. 70 RA stiff for maximum power. 1 pt HL balance pushes mass to head. No comfort tech — raw graphite construction. Demands elite fitness and swing speed."
  },
  {
    id: "babolat-pure-drive-2021",
    name: "Babolat Pure Drive 318g",
    year: 2021,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 320,
    stiffness: 71,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 59],
    frameProfile: "Variable beam with HTR system, SWX Pure Feel",
    identity: "Power Standard",
    notes: "The benchmark power racquet. 71 RA is stiff for maximum power assist. Variable beam (26mm peak) adds launch angle. HTR system improves torsional stability. SWX Pure Feel dampens vibration. 320 swingweight with 4 pts HL. The default recommendation for intermediate players wanting easy power."
  },
  {
    id: "babolat-pure-drive-team-2021",
    name: "Babolat Pure Drive Team 302g",
    year: 2021,
    headSize: 100,
    length: 27,
    strungWeight: 302,
    balance: 32.7,
    balancePts: "4 pts HL",
    swingweight: 310,
    stiffness: 72,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 59],
    frameProfile: "Lighter variable beam with HTR system",
    identity: "Team Power",
    notes: "Lighter Pure Drive at 302g strung. Slightly stiffer than standard (72 RA). Same variable beam for power. 310 swingweight. 4 pts HL. HTR system for stability. For players wanting Pure Drive power in a lighter package."
  },
  {
    id: "babolat-pure-drive-lite-2021",
    name: "Babolat Pure Drive Lite 283g",
    year: 2021,
    headSize: 100,
    length: 27,
    strungWeight: 283,
    balance: 32.7,
    balancePts: "1 pt HL",
    swingweight: 299,
    stiffness: 69,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 59],
    frameProfile: "Ultra-light variable beam with HTR system",
    identity: "Light Power",
    notes: "Lightest Pure Drive at 283g strung. Still stiff (69 RA) for power despite light weight. Nearly even balance (1 pt HL). 299 swingweight. Same variable beam profile. For developing players, seniors, or anyone wanting Pure Drive DNA at minimum weight."
  },
  {
    id: "babolat-pure-strike-team-2025",
    name: "Babolat Pure Strike Team 303g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 303,
    balance: 33.99,
    balancePts: "1 pt HL",
    swingweight: 307,
    stiffness: 64,
    beamWidth: [21, 23, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [46, 55],
    frameProfile: "Variable beam with Control Frame Technology, NF2-Tech",
    identity: "Strike Lite",
    notes: "Lightest Pure Strike at 303g strung. 100 sq in head for forgiveness. Same variable beam (21/23/21mm) as the Strike line. 64 RA moderate stiffness. NF2-Tech for dampening. 1 pt HL balance. 307 swingweight. Entry point to the Strike line — control-focused but accessible."
  },
  {
    id: "tecnifibre-tfight-iso-305",
    name: "Tecnifibre TFight ISO 305 320g",
    year: 2022,
    headSize: 98,
    length: 27,
    strungWeight: 320,
    balance: 33.32,
    balancePts: "3 pts HL",
    swingweight: 338,
    stiffness: 64,
    beamWidth: [22.5, 22.5, 22.5],
    pattern: "18x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 55],
    frameProfile: "Constant box beam with ISOFLEX, RS Section, foam-filled",
    identity: "Heavy Precision",
    notes: "Very high swingweight (338) — one of the heaviest swinging 98 sq in frames. 22.5mm constant box beam for clean feel. 18x19 dense pattern for control. ISOFLEX ensures consistent stringbed. RS Section beam combines square/round profiles. Foam-filled for solid, plush feel. 64 RA moderate flex. For advanced players."
  },
  {
    id: "tecnifibre-tfight-305s",
    name: "Tecnifibre TFight 305S 320g",
    year: 2025,
    headSize: 98,
    length: 27,
    strungWeight: 320,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 324,
    stiffness: 63,
    beamWidth: [22.5, 22.5, 22.5],
    pattern: "18x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [49, 55],
    frameProfile: "Constant box beam with RS Section, ISOFLEX, foam-filled",
    identity: "Tour Control",
    notes: "Updated TFight flagship. Same 22.5mm box beam and 18x19 pattern as ISO 305 but lower swingweight (324 vs 338) and more head-light (6 pts HL vs 3). 63 RA soft flex. ISOFLEX for progressive stiffness. Foam-filled for solid feel. More maneuverable successor to the ISO 305."
  },
  {
    id: "tecnifibre-tfight-iso-300",
    name: "Tecnifibre TFight ISO 300 318g",
    year: 2023,
    headSize: 98,
    length: 27,
    strungWeight: 318,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 320,
    stiffness: 66,
    beamWidth: [22.5, 22.5, 22.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 55],
    frameProfile: "Constant box beam with ISOFLEX, Dynacore HD",
    identity: "TFight All-Rounder",
    notes: "More accessible TFight with 16x19 open pattern for spin. 66 RA slightly stiffer than 305. Same 22.5mm box beam for clean feel. 318g strung with 320 swingweight. 4 pts HL balanced. ISOFLEX for consistent stringbed. Good middle ground between control and versatility."
  },
  {
    id: "tecnifibre-tfight-iso-285",
    name: "Tecnifibre TFight ISO 285 298g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 298,
    balance: 32.64,
    balancePts: "5 pts HL",
    swingweight: 303,
    stiffness: 63,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [49, 55],
    frameProfile: "Constant beam with ISOFLEX, RSL Beam, foam-filled",
    identity: "Accessible Control",
    notes: "Larger 100 sq in TFight for more forgiveness. 23mm constant beam. Lighter at 298g strung. 63 RA soft flex for comfort. 5 pts HL with 303 swingweight. ISOFLEX stringbed. RSL Beam for power/control blend. Entry point to the TFight line for intermediate players."
  },
  {
    id: "tecnifibre-tfight-iso-270",
    name: "Tecnifibre TFight ISO 270 283g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 283,
    balance: 32.99,
    balancePts: "4 pts HL",
    swingweight: 300,
    stiffness: 65,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [49, 55],
    frameProfile: "Lightweight constant beam with ISOFLEX, RSL Beam",
    identity: "Light TFight",
    notes: "Lightweight TFight at 283g strung. 100 sq in head with 23mm constant beam. 65 RA moderate stiffness. 4 pts HL balance. 300 swingweight. ISOFLEX for consistent stringbed. For recreational to intermediate players wanting TFight feel at lower weight."
  },
  {
    id: "tecnifibre-tfight-iso-255",
    name: "Tecnifibre TFight ISO 255 269g",
    year: 2025,
    headSize: 100,
    length: 27,
    strungWeight: 269,
    balance: 34.29,
    balancePts: "Even",
    swingweight: 299,
    stiffness: 67,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [49, 59],
    frameProfile: "Ultra-light constant beam with ISOFLEX",
    identity: "Ultra-Light TFight",
    notes: "Lightest TFight at 269g strung. Even balance compensates for ultra-light mass. 67 RA stiffer to maintain crispness. 100 sq in head with 23mm beam. 299 swingweight. For juniors, beginners, or those needing minimal weight."
  },
  {
    id: "tecnifibre-tf40-305-18x20",
    name: "Tecnifibre TF40 305 18x20 323g",
    year: 2022,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 33.0,
    balancePts: "3 pts HL",
    swingweight: 328,
    stiffness: 64,
    beamWidth: [22, 22, 22],
    pattern: "18x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [49, 55],
    frameProfile: "Thin constant beam with RS Sharp Section, Foam Inside",
    identity: "Dense Control",
    notes: "Medvedev's racquet. 22mm constant thin beam for maximum control. Dense 18x20 pattern. 64 RA moderate flex. Foam-filled for solid, plush feel. RS Sharp Section (5-sided beam) for stability. 328 swingweight for plough-through. 3 pts HL. For advanced flat hitters."
  },
  {
    id: "tecnifibre-tf40-305-16x19",
    name: "Tecnifibre TF40 305 16x19 320g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 320,
    balance: 33.2,
    balancePts: "3 pts HL",
    swingweight: 320,
    stiffness: 64,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [49, 55],
    frameProfile: "Thin constant beam with RS Sharp Section, Foam Inside",
    identity: "Spin-Friendly Control",
    notes: "Open pattern TF40 with 16x19 for more spin access than 18x20 sibling. Same 22mm box beam and 64 RA. 320 swingweight — lower than 18x20 (328). RS Sharp Section and foam fill for solid feel. 2nd gen (2024) with Extensed BG eyelets. More versatile than dense pattern version."
  },
  {
    id: "tecnifibre-tf40-315-16x19",
    name: "Tecnifibre TF40 315 16x19 332g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 332,
    balance: 32.0,
    balancePts: "8 pts HL",
    swingweight: 313,
    stiffness: 64,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [49, 55],
    frameProfile: "Heavy player spec with RS Sharp Section, Foam Inside",
    identity: "Player Spec TF40",
    notes: "Heaviest TF40 at 332g strung. Very head-light (8 pts HL) for a heavy frame — low swingweight (313) despite high static weight. 22mm box beam. 64 RA. 16x19 for spin access. For advanced players who want heavy mass at handle for stability and feel."
  },
  {
    id: "tecnifibre-tf40-290",
    name: "Tecnifibre TF40 290 303g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 303,
    balance: 33.2,
    balancePts: "3 pts HL",
    swingweight: 312,
    stiffness: 65,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [49, 55],
    frameProfile: "Lightweight TF40 with RS Sharp Section, Foam Inside",
    identity: "Accessible TF40",
    notes: "Lightest TF40 at 303g strung. Same 22mm box beam and RS Sharp Section. 65 RA slightly stiffer for response at lower weight. 312 swingweight for good maneuverability. 3 pts HL. Foam-filled for the signature TF40 solid feel. Entry point to TF40 precision."
  },
  {
    id: "tecnifibre-tempo-298-iga",
    name: "Tecnifibre Tempo 298 Iga 312g",
    year: 2022,
    headSize: 98,
    length: 27,
    strungWeight: 312,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 322,
    stiffness: 71,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 55],
    frameProfile: "Constant beam with Dynacore XTC, foam-filled",
    identity: "Iga Power Control",
    notes: "Iga Swiatek's signature frame. Stiffest Tecnifibre at 71 RA — significantly stiffer than TFight/TF40 lines. 23mm constant beam. 98 sq in head. 322 swingweight for stability. Foam-filled for solid feel. Unique in the Tecnifibre range for its power-oriented stiffness combined with precision head size."
  },



// ========== YONEX + WILSON ADDITIONAL ==========
  {
    id: "yonex-ezone-98-2024",
    name: "Yonex EZONE 98 323g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 320,
    stiffness: 63,
    beamWidth: [23.8, 24.5, 19.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 60],
    frameProfile: "Isometric tapered beam with 2G-NAMD SPEED, VDM",
    identity: "Precision EZONE",
    notes: "98 sq in EZONE with dramatically tapered beam (23.8/24.5/19.5mm). 63 RA moderate flex. Isometric head for enlarged sweetspot. 6 pts HL with 320 swingweight. VDM vibration dampening. 2G-NAMD SPEED carbon for speed and power. For advanced players wanting EZONE comfort with 98 precision."
  },
  {
    id: "yonex-ezone-98l-2024",
    name: "Yonex EZONE 98L 300g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 300,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 308,
    stiffness: 64,
    beamWidth: [23.8, 24.5, 19.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [45, 60],
    frameProfile: "Lightweight isometric tapered beam with VDM",
    identity: "Light EZONE 98",
    notes: "Lighter EZONE 98 at 300g strung. Same tapered beam. Est. 64 RA slightly stiffer. 308 swingweight. 4 pts HL. Good option for intermediate players wanting a 98 sq in head without heavy weight."
  },
  {
    id: "yonex-ezone-100l-2024",
    name: "Yonex EZONE 100L 301g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 301,
    balance: 33.5,
    balancePts: "3 pts HL",
    swingweight: 310,
    stiffness: 67,
    beamWidth: [24.5, 26.5, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [40, 55],
    frameProfile: "Lightweight isometric beam with 2G-NAMD SPEED, VDM, Liner Tech",
    identity: "Light Comfort Power",
    notes: "Lighter EZONE 100 at 301g strung. Wider beam (26.5mm peak) for power. 67 RA stiffer for more pop. 3 pts HL with 310 swingweight. VDM + Liner Tech for comfort. 2G-NAMD SPEED. For recreational to intermediate players wanting easy power."
  },
  {
    id: "yonex-vcore-95-2026",
    name: "Yonex VCORE 95 326g",
    year: 2026,
    headSize: 95,
    length: 27,
    strungWeight: 326,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 323,
    stiffness: 62,
    beamWidth: [22, 22, 22],
    pattern: "16x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 60],
    frameProfile: "Thin constant beam with Servo Filter, 2G-NAMD FlexForce",
    identity: "VCORE Blade",
    notes: "Smallest VCORE at 95 sq in with dense 16x20 pattern. 22mm constant beam for control. 62 RA soft flex. Heavy at 326g with 323 swingweight. 6 pts HL. Servo Filter for vibration. For advanced players wanting maximum precision with spin access."
  },
  {
    id: "yonex-vcore-98-2026",
    name: "Yonex VCORE 98 323g",
    year: 2026,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 321,
    stiffness: 63,
    beamWidth: [23, 23.5, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 60],
    frameProfile: "Variable beam with Servo Filter, 2G-NAMD FlexForce, SIF grommets",
    identity: "VCORE Precision",
    notes: "98 sq in VCORE with variable beam (23/23.5/22mm). 63 RA moderate flex. Servo Filter for vibration. SIF grommets enhance snapback. 323g strung with 321 swingweight. 4 pts HL. For advanced players wanting spin + control."
  },
  {
    id: "yonex-vcore-98l-2026",
    name: "Yonex VCORE 98L 303g",
    year: 2026,
    headSize: 98,
    length: 27,
    strungWeight: 303,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 310,
    stiffness: 64,
    beamWidth: [23, 23, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 60],
    frameProfile: "Lightweight variable beam with Servo Filter, 2G-NAMD FlexForce",
    identity: "Light VCORE 98",
    notes: "Lighter VCORE 98 at ~303g strung. 98 sq in head with 16x19 pattern. Est. 64 RA. ~310 swingweight. For intermediate players wanting VCORE 98 precision at lighter weight."
  },
  {
    id: "yonex-vcore-100-2026",
    name: "Yonex VCORE 100 318g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 325,
    stiffness: 65,
    beamWidth: [24, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 60],
    frameProfile: "Variable beam with Servo Filter, 2G-NAMD FlexForce, SIF grommets",
    identity: "Spin Launcher v2",
    notes: "2026 VCORE 100 with redesigned aero beam. Servo Filter elastic layer in NAMD FlexForce. Wider beam (26mm peak) for power. 65 RA moderate stiffness. SIF grommets for snapback. 325 swingweight for stability. 4 pts HL. The spin-focused all-rounder."
  },
  {
    id: "yonex-vcore-100l-2026",
    name: "Yonex VCORE 100L 295g",
    year: 2026,
    headSize: 100,
    length: 27,
    strungWeight: 295,
    balance: 33.99,
    balancePts: "1 pt HL",
    swingweight: 313,
    stiffness: 66,
    beamWidth: [24, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [40, 55],
    frameProfile: "Lightweight variable beam with Servo Filter, 2G-NAMD FlexForce",
    identity: "Light Spin Launcher",
    notes: "Lighter VCORE 100 at 295g strung. Same variable beam for power. 66 RA slightly stiffer. Nearly even balance (1 pt HL). 313 swingweight. Good spin potential at lighter weight."
  },
  {
    id: "yonex-percept-97-2023",
    name: "Yonex Percept 97 326g",
    year: 2023,
    headSize: 97,
    length: 27,
    strungWeight: 326,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 315,
    stiffness: 60,
    beamWidth: [21, 21, 21],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 60],
    frameProfile: "Thin constant beam with 2G-NAMD FlexForce, Servo Filter, elongated shaft",
    identity: "Percept Scalpel",
    notes: "97 sq in with thinnest beam (21mm constant). 60 RA very soft for excellent feel. 7 pts HL extremely head-light despite 326g. Lower swingweight (315) for its weight. Servo Filter + elongated shaft for flex and pocketing. For advanced feel players."
  },
  {
    id: "yonex-percept-97h-2023",
    name: "Yonex Percept 97H 346g",
    year: 2023,
    headSize: 97,
    length: 27,
    strungWeight: 346,
    balance: 32.39,
    balancePts: "6 pts HL",
    swingweight: 333,
    stiffness: 62,
    beamWidth: [21, 21, 21],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 60],
    frameProfile: "Heavy thin constant beam with 2G-NAMD FlexForce, Servo Filter",
    identity: "Heavy Percept",
    notes: "Heaviest racquet in the database at 346g strung (330g unstrung). 333 swingweight — massive stability. 97 sq in + 21mm beam + 62 RA = maximum control and feel. 6 pts HL. For advanced players who want the heaviest, most stable control frame available."
  },
  {
    id: "yonex-percept-100-2023",
    name: "Yonex Percept 100 315g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 315,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 318,
    stiffness: 66,
    beamWidth: [23, 23, 23],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 60],
    frameProfile: "Constant beam with 2G-NAMD FlexForce, Servo Filter",
    identity: "Percept All-Rounder",
    notes: "100 sq in Percept with 23mm constant beam. 66 RA moderate stiffness. 4 pts HL with 318 swingweight. Servo Filter for vibration dampening. More accessible than 97 — good control/comfort blend."
  },
  {
    id: "yonex-percept-100d-2023",
    name: "Yonex Percept 100D 320g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 320,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 318,
    stiffness: 66,
    beamWidth: [23, 23, 23],
    pattern: "18x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 60],
    frameProfile: "Dense pattern constant beam with 2G-NAMD FlexForce",
    identity: "Dense Percept",
    notes: "Same frame as Percept 100 but with dense 18x19 pattern. More control, less spin. 320g slightly heavier. Same 66 RA and 23mm beam. For advanced players who prefer flatter shots and maximum control."
  },
  {
    id: "yonex-percept-104-2023",
    name: "Yonex Percept 104 298g",
    year: 2023,
    headSize: 104,
    length: 27,
    strungWeight: 298,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 310,
    stiffness: 65,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [45, 60],
    frameProfile: "Oversized constant beam with Servo Filter",
    identity: "Comfort Percept",
    notes: "Largest Percept at 104 sq in. Lighter at ~298g strung. 22mm constant beam. 65 RA moderate stiffness. 3 pts HL with ~310 swingweight. Most forgiving Percept for intermediate players."
  },
  {
    id: "yonex-regna-98-2024",
    name: "Yonex Regna 98 326g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 326,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 322,
    stiffness: 65,
    beamWidth: [21.5, 22, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 60],
    frameProfile: "Premium variable beam with next-gen graphite, Vibration Dampening Mesh",
    identity: "Premium Precision",
    notes: "Yonex's limited premium line. 98 sq in with thin variable beam (21.5/22/22mm). 65 RA moderate stiffness. 6 pts HL with 322 swingweight. Premium materials and construction. For advanced players seeking refined feel and precision."
  },
  {
    id: "wilson-pro-staff-97l-v14",
    name: "Wilson Pro Staff 97L v14 306g",
    year: 2024,
    headSize: 97,
    length: 27,
    strungWeight: 306,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 313,
    stiffness: 68,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 60],
    frameProfile: "Lighter constant beam, braided graphite + Fortyfive",
    identity: "Light Staff",
    notes: "Lighter Pro Staff at 306g strung. Wider beam (23.5mm vs 21.5mm on 97) for more power. Stiffer at 68 RA. 313 swingweight for easier handling. 6 pts HL. Same braided graphite construction. More accessible than full-weight 97."
  },
  {
    id: "wilson-pro-staff-97ul-v14",
    name: "Wilson Pro Staff 97UL v14 285g",
    year: 2024,
    headSize: 97,
    length: 27,
    strungWeight: 285,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 301,
    stiffness: 67,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Ultra-light constant beam, braided graphite",
    identity: "Ultra-Light Staff",
    notes: "Lightest Pro Staff at 285g strung. 23.5mm beam for power assist. 67 RA moderate-stiff. 3 pts HL with 301 swingweight. 97 sq in head maintained. For recreational players wanting Pro Staff heritage at minimal weight."
  },
  {
    id: "wilson-pro-staff-team-v14",
    name: "Wilson Pro Staff Team v14 296g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 296,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 290,
    stiffness: 67,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Lightweight constant beam with 100 sq in head",
    identity: "Staff Team",
    notes: "100 sq in Pro Staff variant at ~296g strung. Larger head for forgiveness. 23.5mm beam. 67 RA. 3 pts HL with low 290 swingweight. Entry-level Pro Staff for developing players."
  },
  {
    id: "wilson-blade-98-16x19-v9",
    name: "Wilson Blade 98 16x19 v9 323g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 324,
    stiffness: 62,
    beamWidth: [21, 21, 21],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 60],
    frameProfile: "Thin constant beam with StableFeel, braided graphite + Fortyfive",
    identity: "Blade Control",
    notes: "Latest Blade with 21mm thin beam. StableFeel tech for firmer response. 62 RA moderate flex. 323g with 324 swingweight. 16x19 for spin access. 4 pts HL. Braided graphite + basalt construction. For advanced all-court players."
  },
  {
    id: "wilson-blade-98-18x20-v9",
    name: "Wilson Blade 98 18x20 v9 323g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 330,
    stiffness: 60,
    beamWidth: [21, 21, 21],
    pattern: "18x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 60],
    frameProfile: "Dense pattern thin beam with StableFeel, braided graphite",
    identity: "Blade Pro",
    notes: "Dense 18x20 Blade for maximum control. 21mm thin beam. 60 RA softer flex than 16x19 sibling. 330 swingweight for stability. Same 323g. For advanced flat hitters wanting precision."
  },
  {
    id: "wilson-blade-100-v9",
    name: "Wilson Blade 100 v9 318g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 322,
    stiffness: 60,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 60],
    frameProfile: "Constant beam with StableFeel, braided graphite",
    identity: "Blade All-Rounder",
    notes: "100 sq in Blade with 22mm beam. 60 RA soft flex — very comfortable. 318g with 322 swingweight. 4 pts HL. StableFeel for firmer response. Most versatile Blade for intermediate to advanced players."
  },
  {
    id: "wilson-blade-100l-v9",
    name: "Wilson Blade 100L v9 301g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 301,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 308,
    stiffness: 69,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Lightweight constant beam with braided graphite",
    identity: "Light Blade",
    notes: "Lighter Blade at 301g strung. Stiffer at 69 RA to maintain response. 22mm beam. 3 pts HL with 308 swingweight. 100 sq in. More accessible Blade for intermediate players."
  },
  {
    id: "wilson-blade-100ul-v9",
    name: "Wilson Blade 100UL v9 283g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 283,
    balance: 33.99,
    balancePts: "1 pt HL",
    swingweight: 304,
    stiffness: 65,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Ultra-light constant beam with braided graphite",
    identity: "Ultra-Light Blade",
    notes: "Lightest standard Blade at 283g strung. 65 RA. 22mm beam. Nearly even balance (1 pt HL). 304 swingweight. For recreational players wanting Blade feel at minimal weight."
  },
  {
    id: "wilson-blade-101l-v9",
    name: "Wilson Blade 101L v9 289g",
    year: 2024,
    headSize: 101,
    length: 27,
    strungWeight: 289,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 303,
    stiffness: 68,
    beamWidth: [23, 23, 23],
    pattern: "16x20",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Lightweight wider beam with 16x20 pattern",
    identity: "Blade Tweener",
    notes: "101 sq in Blade variant with wider 23mm beam and dense 16x20 pattern. 289g strung. 68 RA stiffer for response. 3 pts HL with 303 swingweight. Bridge between Blade precision and easy handling."
  },
  {
    id: "wilson-blade-104-v9",
    name: "Wilson Blade 104 v9 306g",
    year: 2024,
    headSize: 104,
    length: 27,
    strungWeight: 306,
    balance: 32.99,
    balancePts: "6 pts HL",
    swingweight: 311,
    stiffness: 64,
    beamWidth: [22, 22, 22],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 60],
    frameProfile: "Oversized constant beam with StableFeel, braided graphite",
    identity: "Blade Comfort",
    notes: "Largest Blade at 104 sq in for maximum forgiveness. 22mm beam. 64 RA moderate. 306g with 311 swingweight. Unusual 6 pts HL — more head-light than typical 104 frames. Good for doubles or players wanting a bigger sweetspot."
  },
  {
    id: "wilson-shift-99-pro-v1",
    name: "Wilson Shift 99 Pro v1 332g",
    year: 2025,
    headSize: 99,
    length: 27,
    strungWeight: 332,
    balance: 32.39,
    balancePts: "6 pts HL",
    swingweight: 332,
    stiffness: 68,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "18x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 58],
    frameProfile: "Dense pattern, low vertical flex, Shift construction",
    identity: "Shift Control",
    notes: "Dense 18x20 Shift for maximum control. Heavy at 332g with 332 swingweight. 68 RA stiffer than standard Shift. 6 pts HL. Same low vertical flex design. 23.5mm constant beam. For advanced players wanting Shift DNA with dense pattern precision."
  },
  {
    id: "wilson-clash-98-v2",
    name: "Wilson Clash 98 v2 326g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 326,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 327,
    stiffness: 60,
    beamWidth: [24, 24, 24],
    pattern: "16x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 58],
    frameProfile: "Constant beam with FreeFlex, StableSmart, Fortyfive",
    identity: "Flex Control",
    notes: "98 sq in Clash with maximum flex (60 RA). 24mm constant beam wider than typical 98. Dense 16x20 pattern. 326g with 327 swingweight. FreeFlex tech allows flex without sacrificing stability. For players wanting supreme comfort with control."
  },
  {
    id: "wilson-clash-100-v2",
    name: "Wilson Clash 100 v2 312g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 312,
    balance: 33.02,
    balancePts: "4 pts HL",
    swingweight: 313,
    stiffness: 57,
    beamWidth: [24.5, 24.5, 24.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 58],
    frameProfile: "Wide constant beam with FreeFlex, StableSmart",
    identity: "Maximum Flex",
    notes: "57 RA — one of the softest 100 sq in frames available. 24.5mm wide constant beam. FreeFlex + StableSmart for flex without instability. 312g with 313 swingweight. 4 pts HL. Exceptional comfort for arm-sensitive players."
  },
  {
    id: "wilson-clash-100-pro-v2",
    name: "Wilson Clash 100 Pro v2 326g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 326,
    balance: 32.49,
    balancePts: "6 pts HL",
    swingweight: 325,
    stiffness: 59,
    beamWidth: [24.5, 24.5, 24.5],
    pattern: "16x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [48, 58],
    frameProfile: "Heavy constant beam with FreeFlex, StableSmart",
    identity: "Flex Power",
    notes: "Heavier Clash 100 at 326g with dense 16x20 pattern. 59 RA very flexible. 24.5mm wide beam. 325 swingweight for stability. 6 pts HL. Maximum comfort + control in a heavier package."
  },
  {
    id: "wilson-clash-100l-v2",
    name: "Wilson Clash 100L v2 296g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 296,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 305,
    stiffness: 58,
    beamWidth: [24.5, 24.5, 24.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 58],
    frameProfile: "Lightweight constant beam with FreeFlex",
    identity: "Light Flex",
    notes: "Lighter Clash at 296g strung. Maintains 58 RA flex — very soft. 24.5mm beam. 3 pts HL with 305 swingweight. For intermediate players wanting Clash comfort at lighter weight."
  },
  {
    id: "wilson-clash-100ul-v2",
    name: "Wilson Clash 100UL v2 281g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 281,
    balance: 34.29,
    balancePts: "Even",
    swingweight: 300,
    stiffness: 63,
    beamWidth: [24.5, 24.5, 24.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 58],
    frameProfile: "Ultra-light constant beam with FreeFlex",
    identity: "Ultra-Light Flex",
    notes: "Lightest Clash at 281g strung. 63 RA stiffer than heavier siblings to maintain response. Even balance. 24.5mm beam. 300 swingweight. For recreational players wanting maximum comfort."
  },
  {
    id: "wilson-clash-108-v2",
    name: "Wilson Clash 108 v2 295g",
    year: 2024,
    headSize: 108,
    length: 27,
    strungWeight: 295,
    balance: 33.99,
    balancePts: "1 pt HL",
    swingweight: 325,
    stiffness: 63,
    beamWidth: [24.5, 24.5, 24.5],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 58],
    frameProfile: "Oversized constant beam with FreeFlex",
    identity: "Clash Power",
    notes: "Largest Clash at 108 sq in. 295g strung but high 325 swingweight from head-heavy mass distribution. 63 RA. 24.5mm beam. Maximum power + comfort + forgiveness. For recreational players and doubles."
  },
  {
    id: "wilson-ultra-100-v4",
    name: "Wilson Ultra 100 v4 318g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 317,
    stiffness: 70,
    beamWidth: [24, 26.5, 25],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Variable beam with Power Rib, Fortyfive, Crush Zone",
    identity: "Power Machine",
    notes: "Power-focused frame with 70 RA stiffness — one of the stiffest in the database. Wide variable beam (26.5mm peak) for launch. Power Rib for stability. Crush Zone dampens vibration. 318g with 317 swingweight. For intermediate players wanting maximum power assist."
  },
  {
    id: "wilson-ultra-100l-v4",
    name: "Wilson Ultra 100L v4 296g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 296,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 298,
    stiffness: 67,
    beamWidth: [24, 26.5, 24.25],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Lightweight variable beam with Power Rib",
    identity: "Light Power",
    notes: "Lighter Ultra at ~296g strung. Same wide variable beam for power. 67 RA. 3 pts HL with ~298 swingweight. Power Rib for stability. For developing players wanting easy power."
  },
  {
    id: "wilson-ultra-108-v4",
    name: "Wilson Ultra 108 v4 283g",
    year: 2023,
    headSize: 108,
    length: 27,
    strungWeight: 283,
    balance: 34.29,
    balancePts: "Even",
    swingweight: 311,
    stiffness: 70,
    beamWidth: [26, 27.5, 25.5],
    pattern: "16x18",
    powerLevel: "High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Oversized wide variable beam, Power Rib",
    identity: "Max Power",
    notes: "Widest beam in the database (27.5mm peak). 108 sq in + 70 RA = maximum power assist. Open 16x18 pattern. 283g strung with even balance. 311 swingweight. For beginners and recreational players wanting effortless power."
  },
  {
    id: "wilson-ultra-pro-97-v4",
    name: "Wilson Ultra Pro 97 v4 323g",
    year: 2023,
    headSize: 97,
    length: 27,
    strungWeight: 323,
    balance: 32.99,
    balancePts: "4 pts HL",
    swingweight: 317,
    stiffness: 62,
    beamWidth: [20.6, 20.6, 20.6],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 60],
    frameProfile: "Thin constant beam, Fortyfive, Crush Zone",
    identity: "Ultra Precision",
    notes: "Thinnest beam in the Ultra line (20.6mm constant). 62 RA soft flex — very different character from Ultra 100. 97 sq in for precision. 323g with 317 swingweight. 4 pts HL. A control frame wearing Ultra branding. For advanced players."
  },

  // ========== DIADEM ==========
  {
    id: "diadem-elevate-98-v3",
    name: "Diadem Elevate 98 v3 326g",
    year: 2023,
    headSize: 98,
    length: 27,
    strungWeight: 326,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 330,
    stiffness: 61,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 55],
    frameProfile: "Thin constant beam with Kraibon elastomer, FS system, HMT carbon",
    identity: "Precision Machine",
    notes: "Diadem's flagship control frame. 21.5mm thin constant beam + 16x20 dense pattern. 61 RA very flexible for excellent feel. Kraibon elastomer dampens vibration. 326g with 330 swingweight — heavy and stable. HMT carbon for clean feedback. Competes with Blade 98 and TF40."
  },
  {
    id: "diadem-elevate-98-v3-tour",
    name: "Diadem Elevate 98 v3 Tour 322g",
    year: 2023,
    headSize: 98,
    length: 27,
    strungWeight: 322,
    balance: 32.0,
    balancePts: "7 pts HL",
    swingweight: 322,
    stiffness: 64,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x20",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 55],
    frameProfile: "Player spec thin beam with Kraibon, FS system, HMT carbon",
    identity: "Tour Precision",
    notes: "Tour-weighted Elevate at 322g strung. Very head-light (7 pts HL) for maneuverability. 64 RA slightly stiffer than standard. Same 21.5mm thin beam and 16x20 pattern. For advanced players who want a lighter, more head-light control frame."
  },
  {
    id: "diadem-elevate-98-v3-lite",
    name: "Diadem Elevate 98 v3 Lite 307g",
    year: 2023,
    headSize: 98,
    length: 27,
    strungWeight: 307,
    balance: 33.5,
    balancePts: "3 pts HL",
    swingweight: 312,
    stiffness: 64,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 55],
    frameProfile: "Lightweight thin beam with Kraibon, FS system",
    identity: "Light Elevate",
    notes: "Lighter Elevate at ~307g strung. Same 21.5mm thin beam and 16x20 pattern. 64 RA. 3 pts HL with ~312 swingweight. More accessible entry to Elevate precision for intermediate players."
  },
  {
    id: "diadem-nova-100",
    name: "Diadem Nova 100 317g",
    year: 2024,
    headSize: 100,
    length: 27,
    strungWeight: 317,
    balance: 32.0,
    balancePts: "7 pts HL",
    swingweight: 315,
    stiffness: 69,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [48, 57],
    frameProfile: "Constant beam with FS2 system, Kraibon elastomer, HMT carbon",
    identity: "Power Precision",
    notes: "100 sq in Diadem power frame. 69 RA stiff for power assist. 23.5mm constant beam. Unusually head-light (7 pts HL) for a power frame — great maneuverability. FS2 Flex Stabilization for controlled flex. Kraibon for vibration dampening."
  },
  {
    id: "diadem-nova-100-lite",
    name: "Diadem Nova 100 Lite 302g",
    year: 2020,
    headSize: 100,
    length: 27,
    strungWeight: 302,
    balance: 32.5,
    balancePts: "6 pts HL",
    swingweight: 310,
    stiffness: 69,
    beamWidth: [23.5, 23.5, 23.5],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [48, 57],
    frameProfile: "Lightweight constant beam with FS system, HMT carbon",
    identity: "Light Nova",
    notes: "Lighter Nova at ~302g strung. Same 23.5mm beam and 69 RA stiffness. 6 pts HL with 310 swingweight. FS system for flex stability. More accessible Nova for intermediate players."
  },

  // ========== VOLKL ==========
  {
    id: "volkl-v8-pro-2023",
    name: "Volkl V8 Pro 318g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 32.2,
    balancePts: "6 pts HL",
    swingweight: 316,
    stiffness: 67,
    beamWidth: [22, 24, 22],
    pattern: "18x20",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [50, 60],
    frameProfile: "Variable beam with V-Feel technology (VCell, REVA, VSENSOR)",
    identity: "Dense Control",
    notes: "Volkl's flagship player frame. Dense 18x20 pattern in a 100 sq in head — rare combo. Variable beam (22/24/22mm). V-Feel tech for comfort and feedback. 67 RA moderate stiffness. 6 pts HL for maneuverability. Good blend of control and forgiveness."
  },
  {
    id: "volkl-vcell-8-300",
    name: "Volkl V-Cell 8 300 312g",
    year: 2020,
    headSize: 100,
    length: 27,
    strungWeight: 312,
    balance: 33.0,
    balancePts: "5 pts HL",
    swingweight: 312,
    stiffness: 67,
    beamWidth: [22, 24, 22],
    pattern: "16x18",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [50, 60],
    frameProfile: "Variable beam with V-Cell, REVA, VTEX",
    identity: "Spin Power",
    notes: "Open 16x18 pattern for maximum string movement and spin. Variable beam (22/24/22mm). 67 RA moderate stiffness. V-Cell construction for vibration dampening. 312g with 312 swingweight. 5 pts HL. Good power + spin blend."
  },
  {
    id: "volkl-vcell-8-285",
    name: "Volkl V-Cell 8 285 300g",
    year: 2019,
    headSize: 100,
    length: 27,
    strungWeight: 300,
    balance: 32.5,
    balancePts: "4 pts HL",
    swingweight: 303,
    stiffness: 70,
    beamWidth: [22, 24, 22],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [50, 60],
    frameProfile: "Lightweight variable beam with V-Cell, REVA, Super Grommets",
    identity: "Light Volkl Power",
    notes: "Lighter Volkl at 300g strung. 70 RA stiffer for power at lower weight. Variable beam (22/24/22mm). 16x19 open pattern. Super Grommets for string movement. 4 pts HL with 303 swingweight. For intermediate players."
  },

  // ========== DUNLOP ==========
  {
    id: "dunlop-fx-500-2023",
    name: "Dunlop FX 500 320g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 320,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 321,
    stiffness: 69,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [45, 65],
    frameProfile: "Variable beam with Sonic Core Infinergy, Power Boost Frame",
    identity: "Sonic Power",
    notes: "Dunlop's flagship power frame. Sonic Core Infinergy for energy return and dampening. Wide variable beam (23/26/23mm) for launch and power. 69 RA stiff. Power Boost Frame geometry. 320g with 321 swingweight. Competes with Pure Drive."
  },
  {
    id: "dunlop-fx-500-ls-2023",
    name: "Dunlop FX 500 LS 301g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 301,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 305,
    stiffness: 67,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [45, 65],
    frameProfile: "Lightweight variable beam with Sonic Core Infinergy",
    identity: "Light Sonic",
    notes: "Lighter FX 500 at 301g strung. Same variable beam (23/26/23mm). 67 RA slightly softer than full FX 500. 3 pts HL with 305 swingweight. Sonic Core Infinergy for comfort. For intermediate players wanting FX 500 power without full weight."
  },
  {
    id: "dunlop-fx-500-lite-2023",
    name: "Dunlop FX 500 Lite 283g",
    year: 2023,
    headSize: 100,
    length: 27,
    strungWeight: 283,
    balance: 33.99,
    balancePts: "1 pt HL",
    swingweight: 301,
    stiffness: 68,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium-High",
    strokeStyle: "Medium",
    swingSpeed: "Medium",
    tensionRange: [45, 65],
    frameProfile: "Ultra-light variable beam with Sonic Core Infinergy, Power Boost+",
    identity: "Light Power Boost",
    notes: "Lightest FX 500 at 283g strung. 68 RA stiff for power at low weight. Nearly even balance (1 pt HL). Same wide variable beam. Power Boost+ Groove for extra energy return. For recreational and developing players wanting easy power."
  },

  // ========== DUNLOP CX 2024 ==========
  {
    id: "dunlop-cx-200-tour-16x19-2024",
    name: "Dunlop CX 200 Tour 16x19 326g",
    year: 2024,
    headSize: 95,
    length: 27,
    strungWeight: 326,
    balance: 31.98,
    balancePts: "7 pts HL",
    swingweight: 314,
    stiffness: 66,
    beamWidth: [20.5, 20.5, 20.5],
    pattern: "16x19",
    powerLevel: "Low",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 65],
    frameProfile: "Thin constant beam with Sonic Core Infinergy, Powergrid Stringtech+, Vibroshield",
    identity: "Tour Scalpel",
    notes: "Smallest Dunlop head at 95 sq in with thinnest beam (20.5mm constant). 326g strung with 7 pts HL — heavy but extremely head-light. 66 RA moderate stiffness. Powergrid Stringtech+ optimizes string interaction. Vibroshield dampens vibration. For advanced precision players."
  },
  {
    id: "dunlop-cx-200-2024",
    name: "Dunlop CX 200 320g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 320,
    balance: 32.08,
    balancePts: "7 pts HL",
    swingweight: 314,
    stiffness: 64,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 65],
    frameProfile: "Thin constant beam with Sonic Core Infinergy, Powergrid Stringtech+, Vibroshield",
    identity: "CX Control",
    notes: "Core CX 200 frame. 21.5mm thin constant beam for control. 64 RA flexible for feel. 7 pts HL extremely head-light with 314 swingweight. Sonic Core Infinergy for energy return. Vibroshield dampens vibration. 2024 mold update. Competes with Blade 98 and Prestige MP."
  },
  {
    id: "dunlop-cx-200-ls-2024",
    name: "Dunlop CX 200 LS 303g",
    year: 2024,
    headSize: 98,
    length: 27,
    strungWeight: 303,
    balance: 33.48,
    balancePts: "3 pts HL",
    swingweight: 309,
    stiffness: 63,
    beamWidth: [21.5, 21.5, 21.5],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 65],
    frameProfile: "Lightweight thin beam with Sonic Core Infinergy, Powergrid Stringtech+",
    identity: "Light CX",
    notes: "Lighter CX 200 at 303g strung. Same 21.5mm thin beam. 63 RA soft flex. 3 pts HL with 309 swingweight. More accessible control frame for intermediate players wanting CX precision without full weight."
  },

  // ========== DUNLOP SX 2022 ==========
  {
    id: "dunlop-sx-300-2022",
    name: "Dunlop SX 300 318g",
    year: 2022,
    headSize: 100,
    length: 27,
    strungWeight: 318,
    balance: 33.0,
    balancePts: "4 pts HL",
    swingweight: 322,
    stiffness: 68,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Medium",
    strokeStyle: "Medium-Full",
    swingSpeed: "Medium-Fast",
    tensionRange: [45, 65],
    frameProfile: "Variable beam with Spin Boost+ Grommets, Sonic Core Infinergy",
    identity: "Spin Machine",
    notes: "Dunlop's spin-focused frame. Spin Boost+ Grommets maximize string movement and snapback. Wide variable beam (23/26/23mm) for power and launch. 68 RA moderate-stiff. 322 swingweight for stability. Sonic Core Infinergy for energy return. Competes with Pure Aero."
  },
  {
    id: "dunlop-sx-300-tour-2022",
    name: "Dunlop SX 300 Tour 323g",
    year: 2022,
    headSize: 98,
    length: 27,
    strungWeight: 323,
    balance: 32.5,
    balancePts: "6 pts HL",
    swingweight: 324,
    stiffness: 66,
    beamWidth: [23, 26, 23],
    pattern: "16x19",
    powerLevel: "Low-Medium",
    strokeStyle: "Full",
    swingSpeed: "Fast",
    tensionRange: [45, 65],
    frameProfile: "Variable beam with Spin Boost+ Grommets, Sonic Core Infinergy",
    identity: "Spin Precision",
    notes: "98 sq in SX for more precision with spin. Same variable beam and Spin Boost+ tech. 66 RA moderate stiffness. 6 pts HL with 324 swingweight. Heavier and more head-light than SX 300 for better control. For advanced spin players."
  }
];

// ============================================
// DATA: STRINGS
// ============================================
const STRINGS = [
  {
    id: "solinco-confidential-16",
    name: "Solinco Confidential",
    gauge: "16 (1.30mm)",
    gaugeNum: 1.30,
    material: "Polyester",
    shape: "Square/4-pointed edges",
    stiffness: 222.3,
    tensionLoss: 22.2,
    spinPotential: 6.4,
    twScore: { power: 42, spin: 90, comfort: 63, control: 93, feel: 83, playabilityDuration: 88, durability: 91 },
    identity: "Control Lockdown",
    notes: "Stiff poly (222 lb/in) with excellent tension maintenance (22% loss — top tier). Four grippy edges for spin. Needs 3-4 hrs break-in. Rewards full swings with pinpoint accuracy."
  },

  {
    id: "solinco-hyper-g-16",
    name: "Solinco Hyper-G",
    gauge: "16 (1.30mm)",
    gaugeNum: 1.30,
    material: "Polyester",
    shape: "Pentagon/5-sided",
    stiffness: 219.5,
    tensionLoss: 26.3,
    spinPotential: 7.0,
    twScore: { power: 50, spin: 92, comfort: 62, control: 88, feel: 80, playabilityDuration: 80, durability: 88 },
    identity: "Spin Shredder",
    notes: "Iconic green poly. Pentagon shape bites the ball aggressively. Slightly softer than Confidential with a bit more power. Good all-around aggressive poly."
  },

  {
    id: "solinco-tour-bite-16",
    name: "Solinco Tour Bite",
    gauge: "16 (1.30mm)",
    gaugeNum: 1.30,
    material: "Polyester",
    shape: "Pentagon/5-sided",
    stiffness: 202.9,
    tensionLoss: 47.1,
    spinPotential: 6.7,
    twScore: { power: 38, spin: 88, comfort: 52, control: 95, feel: 78, playabilityDuration: 70, durability: 90 },
    identity: "Iron Maiden",
    notes: "Very firm, very controlled. High tension loss (47%) means it starts tight and opens up quickly. Stiff but not as stiff as Confidential. For players who want maximum control and don't mind frequent restrings."
  },
  {
    id: "babolat-rpm-blast-17",
    name: "Babolat RPM Blast",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Octagonal",
    stiffness: 234,
    tensionLoss: 33.3,
    spinPotential: 4.6,
    twScore: { power: 55, spin: 82, comfort: 60, control: 85, feel: 80, playabilityDuration: 72, durability: 82 },
    identity: "The Pro Standard",
    notes: "Nadal's string. Very stiff (234 lb/in). Moderate tension loss. TWU spin potential is low (4.6) but real-world spin comes from snap-back of the octagonal shape. Good power for a poly."
  },

  {
    id: "babolat-vs-touch-16",
    name: "Babolat VS Touch",
    gauge: "16 (1.30mm)",
    gaugeNum: 1.30,
    material: "Natural Gut",
    shape: "Round (braided)",
    stiffness: 140,
    tensionLoss: 12,
    spinPotential: 5.0,
    twScore: { power: 85, spin: 65, comfort: 98, control: 65, feel: 95, playabilityDuration: 95, durability: 50 },
    identity: "The Silk Cannon",
    notes: "Gold standard natural gut. Softest stiffness (~140 lb/in), best tension maintenance (12% loss), maximum comfort and feel. High power, lower control ceiling. Fragile in wet conditions. Best pocketing of any string material."
  },
  {
    id: "luxilon-alu-power-16l",
    name: "Luxilon ALU Power",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round",
    stiffness: 209.2,
    tensionLoss: 46.6,
    spinPotential: 5.8,
    twScore: { power: 65, spin: 78, comfort: 58, control: 82, feel: 85, playabilityDuration: 60, durability: 80 },
    identity: "Legacy Standard",
    notes: "The most famous poly. Good feel and power for a poly but terrible tension maintenance (47% loss). Goes dead fast. The string that defined the poly era but showing its age."
  },
  {
    id: "restring-sync",
    name: "ReString Sync",
    gauge: "17 (1.24mm)",
    gaugeNum: 1.24,
    material: "Polyester",
    shape: "Round (coated)",
    stiffness: 195,
    tensionLoss: 18,
    spinPotential: 6.8,
    twScore: { power: 55, spin: 82, comfort: 72, control: 85, feel: 78, playabilityDuration: 92, durability: 88 },
    identity: "The Endurance Build",
    notes: "Outstanding tension maintenance (~18% loss). Coated surface resists notching. Slightly muted feel compared to ALU Power but vastly superior playability duration. Good spin and comfort for its control level."
  },
  {
    id: "restring-zero",
    name: "ReString Zero",
    gauge: "17 (1.24mm)",
    gaugeNum: 1.24,
    material: "Polyester",
    shape: "Round (textured coating)",
    stiffness: 188,
    tensionLoss: 20,
    spinPotential: 7.5,
    twScore: { power: 58, spin: 88, comfort: 70, control: 82, feel: 80, playabilityDuration: 88, durability: 82 },
    identity: "The Spin Tank",
    notes: "More snap-back than Sync. Better spin access but slightly less tension maintenance and durability. More textured coating gives better ball bite. Good blend of spin and longevity."
  },
  {
    id: "head-lynx-tour-17",
    name: "Head Lynx Tour",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Square",
    stiffness: 217.7,
    tensionLoss: 24.6,
    spinPotential: 7.1,
    twScore: { power: 48, spin: 88, comfort: 62, control: 88, feel: 80, playabilityDuration: 82, durability: 86 },
    identity: "The Consistent Edge",
    notes: "Square profile for spin, good tension maintenance (24.6% loss). Pairs well with Speed frames. Stiff and controlled with decent playability duration."
  },
  {
    id: "head-hawk-power-17",
    name: "Head Hawk Power",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Spiral",
    stiffness: 203.5,
    tensionLoss: 48.3,
    spinPotential: 7.5,
    twScore: { power: 60, spin: 86, comfort: 65, control: 80, feel: 78, playabilityDuration: 65, durability: 78 },
    identity: "Power Spinner",
    notes: "More power and spin than Lynx Tour but much worse tension maintenance (48%). Spiral shape generates good ball bite. Loses playability relatively fast."
  },
  {
    id: "tecnifibre-razor-soft-17",
    name: "Tecnifibre Razor Soft",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round",
    stiffness: 212,
    tensionLoss: 33.3,
    spinPotential: 7.4,
    twScore: { power: 52, spin: 82, comfort: 70, control: 84, feel: 82, playabilityDuration: 78, durability: 80 },
    identity: "Comfort Control",
    notes: "Good blend of comfort and control. Moderate stiffness and tension loss. A safe all-arounder poly."
  },
  {
    id: "toroline-o-toro-17",
    name: "Toroline O-Toro",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Hexagonal",
    stiffness: 165.7,
    tensionLoss: 44.4,
    spinPotential: 9.4,
    twScore: { power: 60, spin: 95, comfort: 75, control: 78, feel: 75, playabilityDuration: 72, durability: 78 },
    identity: "Spin Launcher",
    notes: "TWU spin potential 9.4 — top tier. 104% more spin than RPM Blast in lab testing. Very soft at 166 lb/in. High tension loss (44%) means it opens up fast. Hexagonal shape with exceptional snapback. Best-selling Toroline string."
  },
  {
    id: "toroline-o-toro-spin-17",
    name: "Toroline O-Toro Spin",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Textured Hexagonal",
    stiffness: 173.2,
    tensionLoss: 38.3,
    spinPotential: 8.2,
    twScore: { power: 55, spin: 90, comfort: 72, control: 82, feel: 73, playabilityDuration: 74, durability: 80 },
    identity: "Textured Spin Machine",
    notes: "Textured version of O-Toro with slightly higher stiffness (173 vs 166). Better tension maintenance (38% vs 44%). Slightly less peak spin but more controlled response. Good middle ground between O-Toro and O-Toro Tour."
  },
  {
    id: "toroline-o-toro-tour-17",
    name: "Toroline O-Toro Tour",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Hexagonal",
    stiffness: 216.6,
    tensionLoss: 25.0,
    spinPotential: 7.7,
    twScore: { power: 48, spin: 85, comfort: 65, control: 90, feel: 80, playabilityDuration: 85, durability: 88 },
    identity: "Tour Control Hex",
    notes: "~15% stiffer than O-Toro, comparable to RPM Blast and 4G. TWU tension loss only 25% — excellent. Higher stiffness (217) gives more control and stability at high swing speeds. Best for advanced players who want control-first with spin access."
  },
  {
    id: "toroline-o-toro-snap-16l",
    name: "Toroline O-Toro Snap",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round (ultra-slick)",
    stiffness: 170,
    tensionLoss: 40,
    spinPotential: 8.5,
    twScore: { power: 58, spin: 88, comfort: 73, control: 80, feel: 76, playabilityDuration: 75, durability: 80 },
    identity: "Snapback Specialist",
    notes: "Same formula as O-Toro in an ultra-slick 1.25mm round shape. Maximum snapback for dynamic string movement. Lower launch angle than hex O-Toro. Works well as fullbed or hybrid mains. Released mid-2025."
  },
  {
    id: "toroline-caviar-16l",
    name: "Toroline Caviar",
    gauge: "16L (1.24mm)",
    gaugeNum: 1.24,
    material: "Polyester",
    shape: "Hexagonal",
    stiffness: 185,
    tensionLoss: 30,
    spinPotential: 7.5,
    twScore: { power: 55, spin: 85, comfort: 72, control: 85, feel: 80, playabilityDuration: 88, durability: 86 },
    identity: "Precision Hex",
    notes: "Six-sided hex profile for precision. More lively and flexible than typical polys. Outstanding tension maintenance and durability. Near-perfect balance of power and control — slightly softer and more powerful than O-Toro Tour. Available in 16L, 17, and 18 gauges."
  },
  {
    id: "toroline-wasabi-17",
    name: "Toroline Wasabi",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Square (4 ultra-sharp edges)",
    stiffness: 210,
    tensionLoss: 35,
    spinPotential: 8.0,
    twScore: { power: 52, spin: 88, comfort: 68, control: 85, feel: 75, playabilityDuration: 75, durability: 82 },
    identity: "Sharp Bite",
    notes: "Four ultra-sharp edges grip the ball aggressively before snapping back. Firmer and more control-oriented than most Toroline strings. Low-friction surface promotes snapback. Good balance of spin, power, and control. Average tension maintenance."
  },
  {
    id: "toroline-toro-toro-17",
    name: "Toroline Toro Toro / Super Toro",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Hexagonal",
    stiffness: 195,
    tensionLoss: 32,
    spinPotential: 7.8,
    twScore: { power: 52, spin: 85, comfort: 70, control: 86, feel: 78, playabilityDuration: 82, durability: 84 },
    identity: "Precision Allrounder",
    notes: "Super slick six-sided co-poly for surgical precision. Softer flex for enhanced pocketing and feel. Predictable response. Toro Toro (pink) and Super Toro (dark blue) are the same string in different colors. Medium stiffness. Also available in 16L (1.27mm)."
  },
  {
    id: "toroline-snapper-17",
    name: "Toroline Snapper",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Octagonal (extra slick)",
    stiffness: 185,
    tensionLoss: 30,
    spinPotential: 8.0,
    twScore: { power: 58, spin: 86, comfort: 74, control: 82, feel: 80, playabilityDuration: 82, durability: 80 },
    identity: "Slick Spin Cannon",
    notes: "Octagonal shape with extra-slick coating for maximum snapback. Soft and plush — doesn't need a dampener. More power and pocketing than Wasabi. Consistent string bed throughout life. Named for snapback action, not power snap. Lavender color."
  },
  {
    id: "toroline-truffle-x-17",
    name: "Toroline Truffle X",
    gauge: "17 (1.30mm)",
    gaugeNum: 1.30,
    material: "Co-Polyester (elastic)",
    shape: "Round",
    stiffness: 115,  // originally 0.20 kg/mm; converted to lb/in scale for consistency
    tensionLoss: 10,
    spinPotential: 5.5,
    twScore: { power: 88, spin: 60, comfort: 95, control: 60, feel: 90, playabilityDuration: 92, durability: 50 },
    identity: "Elastic Comfort",
    notes: "Insanely low static stiffness (0.20 kg/mm) — softer than natural gut. Elastic nature stretches under tension. Explosive pocketing and pop. Best as hybrid cross or full bed at gut-like tensions (~55 lbs + 5% prestretch recommended). Excellent tension maintenance. Low durability."
  },
  {
    id: "toroline-ether-17",
    name: "Toroline Ether",
    gauge: "17 (1.20mm)",
    gaugeNum: 1.20,
    material: "Polyester",
    shape: "Square",
    stiffness: 200,
    tensionLoss: 30,
    spinPotential: 8.5,
    twScore: { power: 55, spin: 90, comfort: 65, control: 84, feel: 82, playabilityDuration: 68, durability: 65 },
    identity: "Thin Spin Blade",
    notes: "Toroline's thinnest string (1.20mm) with a square profile. Maximum spin access with great feel. Firm stiffness level. Low durability due to thin gauge — will notch quickly under heavy hitting. Best for non-breakers or hybrid setups."
  },
  {
    id: "toroline-absolute-17",
    name: "Toroline Absolute",
    gauge: "17 (1.20mm)",
    gaugeNum: 1.20,
    material: "Polyester",
    shape: "Hexagonal",
    stiffness: 190,
    tensionLoss: 30,
    spinPotential: 7.8,
    twScore: { power: 60, spin: 85, comfort: 70, control: 82, feel: 78, playabilityDuration: 72, durability: 68 },
    identity: "Plush Power Hex",
    notes: "Thin 1.20mm hexagonal co-poly for a plush yet crispy feel. Generates ample spin and free power. Softer than Ether at the same gauge. Good for players wanting spin access with a lively, comfortable response."
  },
  {
    id: "toroline-enso-17",
    name: "Toroline enso",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Round",
    stiffness: 180,
    tensionLoss: 28,
    spinPotential: 7.0,
    twScore: { power: 55, spin: 80, comfort: 75, control: 85, feel: 82, playabilityDuration: 85, durability: 85 },
    identity: "Balanced Feel",
    notes: "Flexible co-poly with good control without deadness. Good spin without harshness. Excellent tension maintenance (~28% loss). Round shape keeps response predictable. Pairs well with O-Toro as a hybrid cross. One of Toroline's most balanced offerings."
  },
  {
    id: "grapplesnake-tour-sniper-17",
    name: "Grapplesnake Tour Sniper",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Pentagonal",
    stiffness: 206,
    tensionLoss: 22,
    spinPotential: 7.0,
    twScore: { power: 45, spin: 82, comfort: 65, control: 92, feel: 85, playabilityDuration: 90, durability: 90 },
    identity: "Precision Sniper",
    notes: "Pentagonal shape with pre-stretched construction to minimize initial tension loss. TWU stiffness 206. Similar feel to ALU Power Soft but with vastly superior tension maintenance (~22% est.). Low power, elite control. Extremely consistent and durable. For advanced players."
  },
  {
    id: "grapplesnake-tour-m8-17",
    name: "Grapplesnake Tour M8",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Octagonal",
    stiffness: 210.3,
    tensionLoss: 34.3,
    spinPotential: 8.2,
    twScore: { power: 48, spin: 88, comfort: 68, control: 88, feel: 82, playabilityDuration: 85, durability: 88 },
    identity: "Goldilocks Control",
    notes: "Eight-sided co-poly with slick surface for snapback. TWU spin potential 8.2 — excellent. Stiffness 210 sits between Alpha (soft) and Tour Sniper (firm). Great tension maintenance (34% loss). 'Goldilocks' balanced feel. One of TW's highest-rated polys of 2025."
  },
  {
    id: "restring-slap-17",
    name: "ReString Slap",
    gauge: "17 (1.23mm)",
    gaugeNum: 1.23,
    material: "Polyester",
    shape: "Hexagonal",
    stiffness: 188,
    tensionLoss: 20,
    spinPotential: 8.5,
    twScore: { power: 58, spin: 90, comfort: 70, control: 82, feel: 78, playabilityDuration: 88, durability: 82 },
    identity: "Spin Slapper",
    notes: "Built on the foundation of ReString Zero with a six-sided geometric profile. Exceptional grip and spin potential. Carries Zero's explosive snapback technology for consistent low-friction string movement. Good tension maintenance (~20% est.). Also available in 16g (1.28mm)."
  },
  {
    id: "yonex-poly-tour-pro-17",
    name: "Yonex Poly Tour Pro",
    gauge: "17 (1.20mm)",
    gaugeNum: 1.20,
    material: "Polyester",
    shape: "Round",
    stiffness: 189,
    tensionLoss: 40,
    spinPotential: 6.0,
    twScore: { power: 55, spin: 75, comfort: 75, control: 80, feel: 88, playabilityDuration: 60, durability: 70 },
    identity: "Plush Feel",
    notes: "Soft round poly (189 lb/in) with excellent feel and comfort. Famously mushy — great pocketing. High tension loss (40%) means it goes dead relatively fast. Low spin potential in lab but good real-world snapback. Casper Ruud's string. Best at higher tensions."
  },
  {
    id: "yonex-poly-tour-rev-16l",
    name: "Yonex Poly Tour Rev",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Octagonal (silicone oil infused)",
    stiffness: 193.2,
    tensionLoss: 34.4,
    spinPotential: 7.2,
    twScore: { power: 55, spin: 85, comfort: 68, control: 82, feel: 80, playabilityDuration: 72, durability: 78 },
    identity: "Silicone Spinner",
    notes: "Silicone oil-infused octagonal poly. TWU spin potential 7.2, stiffness 193. Good snapback from silicone coating but coating wears off over time. Slicker feel than most shaped polys. Moderate tension loss (34%). Purple color."
  },
  {
    id: "yonex-poly-tour-spin-16l",
    name: "Yonex Poly Tour Spin",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Octagonal",
    stiffness: 214,
    tensionLoss: 30,
    spinPotential: 7.0,
    twScore: { power: 48, spin: 82, comfort: 62, control: 88, feel: 75, playabilityDuration: 78, durability: 85 },
    identity: "Firm Spin Control",
    notes: "Stiffer Yonex poly (214 lb/in) for control-oriented players. Octagonal profile bites the ball well. Better tension maintenance than Poly Tour Pro. One of Yonex's firmer offerings alongside Spin G. Good for players who want control with spin access."
  },
  {
    id: "yonex-poly-tour-fire-16l",
    name: "Yonex Poly Tour Fire",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round (silicone oil infused)",
    stiffness: 194.9,
    tensionLoss: 35.0,
    spinPotential: 5.8,
    twScore: { power: 60, spin: 78, comfort: 68, control: 80, feel: 82, playabilityDuration: 75, durability: 80 },
    identity: "Lively Stealth",
    notes: "TWU stiffness 195, spin 5.8. Round poly with silicone oil infusion for snapback. Lively and powerful response — more pop than most polys. Stiffer than Poly Tour Pro but softer than Poly Tour Spin. Great on serves. Good tension maintenance. Also available in 1.20mm and 1.30mm."
  },

  // ===== DUNLOP =====
  {
    id: "dunlop-black-widow-17",
    name: "Dunlop Black Widow",
    gauge: "17 (1.26mm)",
    gaugeNum: 1.26,
    material: "Polyester",
    shape: "Heptagonal (7-sided)",
    stiffness: 217,
    tensionLoss: 31,
    spinPotential: 5.4,
    twScore: { power: 55, spin: 82, comfort: 68, control: 84, feel: 78, playabilityDuration: 72, durability: 72 },
    identity: "Seven-Edge Spinner",
    notes: "Unique 7-sided heptagonal profile for aggressive ball bite. Moderate stiffness (217 lb/in) with decent tension maintenance (31% loss). Softer feel than typical shaped polys. Good spin access from the multi-edge design. Notches relatively quickly under heavy topspin. Good value poly."
  },

  // ===== BABOLAT (additional) =====
  {
    id: "babolat-rpm-blast-rough-17",
    name: "Babolat RPM Blast Rough",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Octagonal (textured)",
    stiffness: 196,
    tensionLoss: 35.7,
    spinPotential: 9.9,
    twScore: { power: 43, spin: 95, comfort: 66, control: 82, feel: 72, playabilityDuration: 68, durability: 79 },
    identity: "Rough Spin Monster",
    notes: "TWU spin potential 9.9 — near the absolute top. Textured version of RPM Blast with significantly more grip. Softer and more powerful than standard RPM Blast (196 vs 234 lb/in). Moderate tension loss (36%). Texture wears down over 8-10 hours. For aggressive spin players who want maximum ball bite."
  },
  {
    id: "babolat-rpm-team-17",
    name: "Babolat RPM Team",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Octagonal",
    stiffness: 245,
    tensionLoss: 25,
    spinPotential: 5.3,
    twScore: { power: 55, spin: 75, comfort: 72, control: 88, feel: 82, playabilityDuration: 82, durability: 85 },
    identity: "Comfort Control Poly",
    notes: "Alcaraz's string. Very stiff (245 lb/in) yet surprisingly comfortable thanks to micro air bubbles in the core. Slick silicone coating for snapback. Good tension maintenance. Lower spin potential in lab (5.3) but real-world feel is snappy and responsive. More comfortable alternative to RPM Blast with better durability."
  },
  {
    id: "babolat-synthetic-gut-17",
    name: "Babolat Synthetic Gut",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Synthetic Gut",
    shape: "Round",
    stiffness: 162,
    tensionLoss: 22,
    spinPotential: 6.0,
    twScore: { power: 72, spin: 65, comfort: 82, control: 68, feel: 75, playabilityDuration: 70, durability: 62 },
    identity: "Budget Allrounder",
    notes: "Solid-core synthetic gut with surprisingly high TWU spin potential (6.0) for its category. Soft stiffness (162 lb/in), good comfort and power. Decent tension maintenance for a syn gut. Popular as hybrid crosses with poly mains. Best bang-for-buck string on the market. Formerly Spiraltek."
  },

  // ===== SOLINCO (additional) =====
  {
    id: "solinco-hyper-g-soft-16l",
    name: "Solinco Hyper-G Soft",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Pentagon/5-sided (shaped)",
    stiffness: 172,
    tensionLoss: 28.7,
    spinPotential: 5.2,
    twScore: { power: 57, spin: 80, comfort: 79, control: 93, feel: 82, playabilityDuration: 78, durability: 86 },
    identity: "Soft Control Shredder",
    notes: "Softer version of Hyper-G (172 vs 219 lb/in). Shaped edges for spin with slick surface for snapback. Excellent control (93/100 TW) with much better comfort than original. Good tension maintenance (28.7% loss). Lower spin potential than Hyper-G in TWU lab testing (5.2 vs 7.0). Arm-friendly option for players who love Hyper-G's control but need more comfort."
  },
  {
    id: "solinco-mach-10-16l",
    name: "Solinco Mach 10",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Pentagonal (5-sided)",
    stiffness: 215,
    tensionLoss: 26,
    spinPotential: 7.5,
    twScore: { power: 55, spin: 85, comfort: 72, control: 88, feel: 80, playabilityDuration: 78, durability: 82 },
    identity: "CloudFORM Precision",
    notes: "Solinco's CloudFORM technology for power and comfort without quick tension loss. Five sharp edges for excellent ball bite and low-friction snapback. Softer alternative to the Solinco big three (Hyper-G, Tour Bite, Confidential). Used by Jensen Brooksby. Good all-around stats with above-average spin access."
  },
  {
    id: "solinco-confidential-soft-16l",
    name: "Solinco Confidential Soft",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Pentagon/5-sided",
    stiffness: 195,
    tensionLoss: 24,
    spinPotential: 6.0,
    twScore: { power: 50, spin: 86, comfort: 74, control: 90, feel: 85, playabilityDuration: 84, durability: 86 },
    identity: "Soft Lockdown",
    notes: "2026 Prizm Project Electric Soft Pink version of Confidential. More forgiving, livelier, and more arm-friendly than original Confidential. Softer stiffness (~195 vs 222 lb/in est.) with maintained control and spin characteristics. Good tension maintenance inherited from the Confidential line. For players who want Confidential's control DNA with better comfort."
  },


  // ===== TECHNIFIBRE =====
  {
    id: "tecnifibre-black-code-17",
    name: "Tecnifibre Black Code",
    gauge: "17 (1.24mm)",
    gaugeNum: 1.24,
    material: "Polyester",
    shape: "Pentagonal (5-sided)",
    stiffness: 236,
    tensionLoss: 40.2,
    spinPotential: 4.2,
    twScore: { power: 40, spin: 78, comfort: 55, control: 90, feel: 72, playabilityDuration: 65, durability: 83 },
    identity: "Stiff Control Anchor",
    notes: "Very stiff poly (236 lb/in) with pentagonal shape. Thermo Core Technology for added elasticity. High tension loss (40%) means it starts tight and opens up fast. Low TWU spin potential (4.2) but real-world feel is controlled and precise. Good durability. Used by Chris Eubanks. Available in many gauges (1.18–1.32mm)."
  },
  {
    id: "tecnifibre-razor-code-17",
    name: "Tecnifibre Razor Code",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round",
    stiffness: 229.2,
    tensionLoss: 29.6,
    spinPotential: 5.6,
    twScore: { power: 50, spin: 78, comfort: 65, control: 88, feel: 78, playabilityDuration: 80, durability: 95 },
    identity: "Iron Durability",
    notes: "Round poly with Thermo Core Technology for flexibility. Very stiff (229 lb/in) but good tension maintenance (29.6% loss). Exceptional durability (TW 95/100) — one of the longest-lasting polys. Crisp yet comfortable for its stiffness level. Control-oriented with moderate spin potential. A reliable workhorse string."
  },

  // ===== VOLKL =====
  {
    id: "volkl-cyclone-16",
    name: "Volkl Cyclone",
    gauge: "16 (1.30mm)",
    gaugeNum: 1.30,
    material: "Polyester",
    shape: "Decagonal (10-sided)",
    stiffness: 197.2,
    tensionLoss: 47.9,
    spinPotential: 6.2,
    twScore: { power: 67, spin: 82, comfort: 83, control: 82, feel: 78, playabilityDuration: 68, durability: 89 },
    identity: "Gear-Shaped Spinner",
    notes: "Unique 10-sided gear shape for spin access. High comfort (83/100 TW) despite shaped design — one of the most arm-friendly shaped polys. Excellent durability (89/100). High tension loss (48%) means it opens up fast. Good value co-poly popular among intermediate to advanced players. Crisp, lively response."
  },

  // ===== WILSON (additional) =====
  {
    id: "wilson-natural-gut-17",
    name: "Wilson Natural Gut",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Natural Gut",
    shape: "Round (braided)",
    stiffness: 81,
    tensionLoss: 12,
    spinPotential: 2.2,
    twScore: { power: 88, spin: 55, comfort: 96, control: 62, feel: 95, playabilityDuration: 92, durability: 48 },
    identity: "Premium Feel Cannon",
    notes: "Made from beef serosa — elite natural gut. Extremely soft stiffness (81 lb/in at 17g). Excellent tension maintenance (~12% loss). Low TWU spin potential (2.2) but exceptional pocketing and power. Best for hybrid setups with poly mains. Sensitive to humidity. Slightly firmer and more durable than Babolat VS Touch."
  },
  {
    id: "wilson-revolve-17",
    name: "Wilson Revolve",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round",
    stiffness: 192,
    tensionLoss: 36.2,
    spinPotential: 7.7,
    twScore: { power: 58, spin: 85, comfort: 77, control: 88, feel: 80, playabilityDuration: 75, durability: 93 },
    identity: "Low-Friction Control",
    notes: "Round poly with unique low-friction molecular structure for enhanced snapback and spin. TWU spin potential 7.7 — high for a round string. Excellent control (88/100 TW) with exceptional durability (93/100). Good comfort for a poly. Reliable, long-lasting workhorse string."
  },
  {
    id: "wilson-revolve-spin-17",
    name: "Wilson Revolve Spin",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Pentagonal (5-sided)",
    stiffness: 168,
    tensionLoss: 32,
    spinPotential: 8.0,
    twScore: { power: 44, spin: 92, comfort: 73, control: 93, feel: 75, playabilityDuration: 72, durability: 90 },
    identity: "Spin Precision",
    notes: "Shaped co-poly with low-friction UHMW coating for maximum snapback. Softer stiffness (~168 lb/in est. for 17g from 173 at 16g). Exceptional spin (92/100 TW) and control (93/100). Good tension maintenance for a shaped poly. Low power — very control-oriented. Ideal for aggressive spin players who generate their own pace."
  },
  {
    id: "wilson-nxt-16",
    name: "Wilson NXT",
    gauge: "16 (1.30mm)",
    gaugeNum: 1.30,
    material: "Multifilament",
    shape: "Round",
    stiffness: 174,
    tensionLoss: 18,
    spinPotential: 4.0,
    twScore: { power: 86, spin: 62, comfort: 89, control: 65, feel: 88, playabilityDuration: 82, durability: 64 },
    identity: "Premium Multifilament",
    notes: "World's most popular multifilament. 1600 Xycro Micro fibers with PU coating. 10% larger sweetspot and low vibration. Excellent comfort and feel — great for tennis elbow sufferers. High power, lower control ceiling. Good tension maintenance (~18% loss) for a multi. Frays under heavy topspin. Best as full bed or hybrid cross."
  },

  // ===== DIADEM =====
  {
    id: "diadem-solstice-power-16l",
    name: "Diadem Solstice Power",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Six-pointed Star",
    stiffness: 209,
    tensionLoss: 27,
    spinPotential: 7.3,
    twScore: { power: 55, spin: 85, comfort: 72, control: 85, feel: 78, playabilityDuration: 72, durability: 75 },
    identity: "Star Core Spinner",
    notes: "Unique six-pointed star cross-section — Star Core Technology for low friction snapback and aggressive ball bite. Good tension maintenance (27% loss). Moderate stiffness (209 lb/in). Comfortable for a shaped poly. Playable for 8-11 hours. Available in 1.20–1.35mm gauges."
  },

  // ===== GRAPPLESNAKE (additional) =====
  {
    id: "grapplesnake-irukandji-17",
    name: "Grapplesnake Irukandji",
    gauge: "17 (1.25mm equiv.)",
    gaugeNum: 1.25,
    material: "Co-Polyester (elastic)",
    shape: "Rounded Rectangular (0.90×1.45mm)",
    stiffness: 160,
    tensionLoss: 20,
    spinPotential: 6.5,
    twScore: { power: 72, spin: 75, comfort: 85, control: 72, feel: 85, playabilityDuration: 80, durability: 72 },
    identity: "Hybrid Cross Specialist",
    notes: "Engineered as the ideal hybrid cross for gut/multi mains. Unique rounded rectangular shape (0.90×1.45mm) maximizes contact area and snapback. Bridges co-poly and multifilament properties — elastic, soft, great feel. More power and comfort than typical polys. Works well full bed too. No direct TWU data — estimates based on reviews and similar soft co-polys."
  },
  {
    id: "grapplesnake-aspera-triplum-17",
    name: "Grapplesnake Aspera Triplum",
    gauge: "17 (1.19mm)",
    gaugeNum: 1.19,
    material: "Polyester",
    shape: "Square (textured/abrasive)",
    stiffness: 220,
    tensionLoss: 30,
    spinPotential: 9.0,
    twScore: { power: 52, spin: 92, comfort: 68, control: 85, feel: 72, playabilityDuration: 68, durability: 70 },
    identity: "Triple Spin Tech",
    notes: "Triple spin technology: shape + abrasive surface + diamond indentations. Thin gauge (1.19mm) with square edges for massive ball bite. Soft and stretchy for a shaped poly — recommend stringing +2 lbs above desired tension. Great snapback initially but notches relatively quickly. Not for heavy hitters. Constant-pull stringing recommended."
  },
  {
    id: "grapplesnake-tour-mako-17",
    name: "Grapplesnake Tour Mako",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round (mildly abrasive)",
    stiffness: 200,
    tensionLoss: 30,
    spinPotential: 7.5,
    twScore: { power: 58, spin: 82, comfort: 78, control: 82, feel: 82, playabilityDuration: 65, durability: 68 },
    identity: "Plush Round Poly",
    notes: "Evolution of Tour M8 + Paradox Pro. Round but mildly textured surface for spin access. One of the softest polys with excellent pocketing. Available in Teal (softer) and Silver (firmer w/ aluminum). +2 lb tension recommended. Amazing initial feel but can drop off after 4-6 hours. 2024/2025 release."
  },
  {
    id: "grapplesnake-game-changer-17",
    name: "Grapplesnake Game Changer",
    gauge: "17 (1.20mm)",
    gaugeNum: 1.20,
    material: "Polyester",
    shape: "Square",
    stiffness: 215,
    tensionLoss: 28,
    spinPotential: 9.0,
    twScore: { power: 55, spin: 92, comfort: 72, control: 85, feel: 75, playabilityDuration: 72, durability: 78 },
    identity: "Tour Spin Machine",
    notes: "Developed in 2020 with tour pros for maximum spin, comfort, and durability. Sharp square edges for massive ball bite. Thin gauge (1.20mm) comparable to a 16g round poly in durability. Neon green color. Good tension maintenance. Not available at Tennis Warehouse US. Tour-level performance."
  },

  // ===== LUXILON (additional) =====
  {
    id: "luxilon-4g-16l",
    name: "Luxilon 4G",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round",
    stiffness: 259,
    tensionLoss: 21,
    spinPotential: 3.9,
    twScore: { power: 50, spin: 68, comfort: 65, control: 92, feel: 82, playabilityDuration: 88, durability: 82 },
    identity: "Tension Lock",
    notes: "Extremely stiff (259 lb/in — one of the stiffest polys). Exceptional tension maintenance (only 21% loss — elite tier). Low spin potential (3.9) but rock-solid consistency. Used by Tsitsipas, de Minaur, Dimitrov. Control-oriented with plush feel for its stiffness. Goes dead slower than almost any poly. Best for advanced players who want maximum control stability."
  },
  {
    id: "luxilon-alu-power-rough-16l",
    name: "Luxilon ALU Power Rough",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round (textured)",
    stiffness: 209,
    tensionLoss: 39.6,
    spinPotential: 6.5,
    twScore: { power: 60, spin: 82, comfort: 68, control: 84, feel: 82, playabilityDuration: 62, durability: 78 },
    identity: "Textured Legacy",
    notes: "Textured version of ALU Power for enhanced spin (6.5 vs 5.8 spin potential). Same stiffness as standard (209 lb/in). Slightly better tension maintenance than standard (39.6% vs 46.6% loss). Used in hybrids by Federer, Djokovic, Murray. Rough texture adds grip but wears down over time. Better spin access than standard ALU Power."
  },
  {
    id: "luxilon-element-16l",
    name: "Luxilon Element",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Round",
    stiffness: 208,
    tensionLoss: 33.6,
    spinPotential: 5.5,
    twScore: { power: 55, spin: 75, comfort: 73, control: 82, feel: 80, playabilityDuration: 72, durability: 81 },
    identity: "Comfort Poly",
    notes: "Multi-Mono Technology with flexible fibers in polymer matrix for added comfort and power. Softest in the Luxilon lineup. Moderate stiffness (208 lb/in) with decent tension maintenance (33.6% loss). Control-oriented but more comfortable than ALU Power. Good all-around poly for players wanting Luxilon quality with less harshness."
  }
];

// ============================================
// PREDICTION ENGINE
// ============================================

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function lerp(val, inMin, inMax, outMin, outMax) {
  const t = (val - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function norm(val, min, max) {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

function getPatternOpenness(pattern) {
  const [mains, crosses] = pattern.split('x').map(Number);
  // 16x18=288 (most open) to 18x20=360 (densest)
  const total = mains * crosses;
  return norm(total, 360, 288); // 0=densest, 1=most open
}

function getAvgBeam(beamWidth) {
  return beamWidth.reduce((a, b) => a + b, 0) / beamWidth.length;
}

function getMaxBeam(beamWidth) {
  return Math.max(...beamWidth);
}

function getMinBeam(beamWidth) {
  return Math.min(...beamWidth);
}

function isVariableBeam(beamWidth) {
  return Math.max(...beamWidth) - Math.min(...beamWidth) > 2;
}

// ============================================
// GAUGE SYSTEM
// ============================================
// Available gauge options by material type.
// Each string's base data is measured at its refGauge (from the `gauge` field).
// When a different gauge is selected, applyGaugeModifier creates a virtual
// string object with adjusted properties.

const GAUGE_OPTIONS = {
  // Polyester / Co-Polyester: wide range available
  'Polyester':             [1.15, 1.20, 1.25, 1.30, 1.35],
  'Co-Polyester (elastic)':[1.15, 1.20, 1.25, 1.30, 1.35],
  // Natural Gut: typically 15L-17
  'Natural Gut':           [1.25, 1.30, 1.35, 1.40],
  // Multifilament / Synthetic: 15L-17 common
  'Multifilament':         [1.25, 1.30, 1.35],
  'Synthetic Gut':         [1.25, 1.30, 1.35],
};

const GAUGE_LABELS = {
  1.15: '18 (1.15mm)',
  1.20: '17 (1.20mm)',
  1.25: '16L (1.25mm)',
  1.30: '16 (1.30mm)',
  1.35: '15L (1.35mm)',
  1.40: '15L (1.40mm)',
};

// Returns a modified copy of stringData with gauge-adjusted properties.
// The base string data is the "reference" measurement (at its own gaugeNum).
// Moving to a different gauge shifts stiffness, spin, durability, etc.
function applyGaugeModifier(stringData, selectedGauge) {
  if (!selectedGauge || selectedGauge === stringData.gaugeNum) {
    return stringData; // No change needed — using reference gauge
  }

  const refGauge = stringData.gaugeNum;  // e.g. 1.30
  const delta = selectedGauge - refGauge; // negative = thinner, positive = thicker
  // Steps of 0.05mm (each step = one standard gauge jump)
  const steps = delta / 0.05;

  // --- Stiffness: ~6% change per 0.05mm step ---
  // Thinner → softer, thicker → stiffer
  const stiffMult = 1 + steps * 0.06;
  const newStiffness = stringData.stiffness * stiffMult;

  // --- Tension loss: thicker strings lose tension slightly faster (more material creep) ---
  const newTensionLoss = stringData.tensionLoss * (1 + steps * 0.04);

  // --- Spin potential: thinner gauge slightly more spin (more bite, easier snapback) ---
  const newSpinPot = stringData.spinPotential - steps * 0.15;

  // --- twScore adjustments ---
  // Per gauge step: power ±2, comfort ±1.5, feel ±2, control ∓1.5, durability ∓3, spin ±1
  const tw = { ...stringData.twScore };
  tw.power = Math.max(30, Math.min(98, tw.power - steps * 2));        // thinner = more power
  tw.comfort = Math.max(30, Math.min(98, tw.comfort - steps * 1.5));  // thinner = more comfort
  tw.feel = Math.max(30, Math.min(98, tw.feel - steps * 2));          // thinner = better feel
  tw.control = Math.max(30, Math.min(98, tw.control + steps * 1.5));  // thinner = less control
  tw.durability = Math.max(20, Math.min(98, tw.durability + steps * 3)); // thinner = less durable
  tw.spin = Math.max(30, Math.min(98, tw.spin - steps * 1));          // thinner = more spin
  tw.playabilityDuration = Math.max(30, Math.min(98, tw.playabilityDuration - steps * 0.5)); // minor effect

  // Return a new object with all original properties + gauge adjustments
  return {
    ...stringData,
    gaugeNum: selectedGauge,
    gauge: GAUGE_LABELS[selectedGauge] || `${selectedGauge.toFixed(2)}mm`,
    stiffness: Math.max(80, newStiffness),
    tensionLoss: Math.max(5, Math.min(60, newTensionLoss)),
    spinPotential: Math.max(3, Math.min(10, newSpinPot)),
    twScore: tw,
    _gaugeModified: true,
    _refGauge: refGauge
  };
}

// Get available gauge options for a string.
// Always includes the string's reference gauge (the gauge it was measured at)
// plus the standard gauge grid for its material.
function getGaugeOptions(stringData) {
  const standard = GAUGE_OPTIONS[stringData.material] || [1.25, 1.30];
  const ref = stringData.gaugeNum;
  // If ref gauge isn't in the standard list, add it and sort
  if (!standard.some(g => Math.abs(g - ref) < 0.005)) {
    const combined = [...standard, ref].sort((a, b) => a - b);
    return combined;
  }
  return standard;
}

// ============================================
// FRAME METADATA — captures what raw specs can't
// Per-frame adjustments for technology, aero, generation improvements
// Scale: 0 = none, 0.5 = minor, 1 = moderate, 1.5 = significant, 2+ = exceptional
// ============================================
const FRAME_META = {
  // Babolat Pure Aero family
  'babolat-pure-aero-100-2023': {
    aeroBonus: 0.5, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  'babolat-pure-aero-98-2026': {
    aeroBonus: 1.5, comfortTech: 2, spinTech: 1, genBonus: 1.5
  },
  'babolat-pure-aero-100-2026': {
    aeroBonus: 2, comfortTech: 2, spinTech: 1.5, genBonus: 2
  },
  'babolat-pure-aero-team-2026': {
    aeroBonus: 2, comfortTech: 2, spinTech: 1.5, genBonus: 1.5
  },
  // Head Speed family
  'head-speed-mp-2024': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'head-speed-mp-legend-2025': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1.5  // Hy-Bor throat: stability+feel without harshness
  },
  'head-speed-pro-legend-2025': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1.5  // Hy-Bor: crisper impact, more help off-center
  },
  'head-speed-pro-2024': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'head-speed-mp-2026': {
    aeroBonus: 0, comfortTech: 2.5, spinTech: 0, genBonus: 2  // Hy-Bor+Auxetic2: breaks power/control/feel tradeoff
  },
  'head-speed-pro-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 2  // Hy-Bor: solid connected response, boxier shaft flex
  },
  'head-speed-mp-l-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1.5  // Hy-Bor lite: benefits scale with frame mass
  },
  // Head Gravity family
  'head-gravity-pro-2025': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'head-gravity-tour-2025': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0.5, genBonus: 0.5
  },
  'head-gravity-mp-2025': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0.5, genBonus: 0.5
  },
  // Wilson Blade
  'wilson-blade-98-v8': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  // Babolat Pure Drive
  'babolat-pure-drive-2024': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  // Yonex EZONE — VDM + 2G-NAMD SPEED: damping raises comfort ceiling on powerful beam
  'yonex-ezone-100-2024': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 0.5  // VDM: notable damping on stiffer beam
  },
  // Wilson Pro Staff
  'wilson-pro-staff-97-v14': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  // Yonex Muse — Minolon: organic fiber mesh co-cured with graphite
  // +5-6% vibration damping while keeping layup lively
  // Breaks power/comfort + stiffness/feel tradeoffs = peak anomaly
  'yonex-muse-98-2026': {
    aeroBonus: 0, comfortTech: 2.5, spinTech: 1, genBonus: 2  // Minolon: breaks power/comfort+stiffness/feel
  },
  'yonex-muse-100-2026': {
    aeroBonus: 0, comfortTech: 3, spinTech: 1, genBonus: 2  // Minolon + wider tip: most complete anomaly in DB
  },
  // Yonex VCORE
  'yonex-vcore-100-2023': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  // Wilson Shift
  'wilson-shift-99-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0.5
  },
  'wilson-shift-99l-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  // Wilson RF01
  'wilson-rf01-pro-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0.5
  },
  'wilson-rf01-2025': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0.5
  },
  // Babolat Pure Strike
  'babolat-pure-strike-97-2025': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1  // NF2-Tech: filters vibration on thin beam
  },
  'babolat-pure-strike-98-16x19-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0.5
  },
  'babolat-pure-strike-98-18x20-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0.5
  },
  'babolat-pure-strike-100-16x19-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0.5
  },
  // Solinco Whiteout
  'solinco-whiteout-v2-290-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'solinco-whiteout-v2-305-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  // Solinco Blackout
  'solinco-blackout-v2-300-2025': {
    aeroBonus: 0.5, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'solinco-blackout-v2-285-2025': {
    aeroBonus: 0.5, comfortTech: 1, spinTech: 0, genBonus: 0
  },

  // Head additional lines
  'head-speed-tour-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 2  // Hy-Bor: same anomaly tech as MP/Pro 2026
  },
  'head-speed-elite-2026': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1  // Hy-Bor: lighter frame gets less stability benefit
  },
  'head-speed-team-2026': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1  // Hy-Bor: damping benefit still present
  },
  'head-speed-mp-ul-2026': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0.5  // Hy-Bor: minimal mass limits benefit
  },
  'head-boom-pro-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 2  // Hy-Bor+Morph: aero head+boxier shaft anomaly
  },
  'head-boom-mp-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 2  // Hy-Bor+Morph: flexible+arm-friendly yet solid
  },
  'head-boom-mp-l-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1.5  // Hy-Bor: lighter frame, proportional benefit
  },
  'head-boom-mp-ul-2026': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5  // Auxetic 2 only, no Hy-Bor at this weight
  },
  'head-boom-team-2026': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0.5, genBonus: 0.5
  },
  'head-boom-elite-2026': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0.5, genBonus: 0.5
  },
  'head-radical-pro-2025': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'head-radical-mp-2025': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'head-radical-team-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'head-radical-team-l-2025': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'head-extreme-pro-2024': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  'head-extreme-mp-2024': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1.5, genBonus: 0
  },
  'head-extreme-team-2024': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  'head-extreme-mp-l-2024': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  'head-gravity-team-2025': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0.5, genBonus: 0.5
  },
  'head-gravity-team-l-2025': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0.5, genBonus: 0.5
  },
  'head-prestige-pro-2023': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'head-prestige-tour-2023': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'head-prestige-mp-2023': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'head-prestige-mp-l-2023': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'head-prestige-team-2023': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },

  // Babolat + Tecnifibre additional
  'babolat-pure-aero-super-lite-2026': {
    aeroBonus: 2, comfortTech: 2, spinTech: 1.5, genBonus: 1.5
  },
  'babolat-pure-aero-team-2023': {
    aeroBonus: 0.5, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  'babolat-pure-aero-lite-2023': {
    aeroBonus: 0.5, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  'babolat-pure-aero-rafa-2023': {
    aeroBonus: 0.5, comfortTech: 0, spinTech: 1.5, genBonus: 0.5
  },
  'babolat-pure-aero-rafa-origin-2023': {
    aeroBonus: 0.5, comfortTech: 0, spinTech: 1, genBonus: 0.5
  },
  'babolat-pure-drive-2021': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'babolat-pure-drive-team-2021': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'babolat-pure-drive-lite-2021': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'babolat-pure-strike-team-2025': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1  // NF2-Tech: same dampening benefit
  },
  'tecnifibre-tfight-iso-305': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'tecnifibre-tfight-305s': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'tecnifibre-tfight-iso-300': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'tecnifibre-tfight-iso-285': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'tecnifibre-tfight-iso-270': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'tecnifibre-tfight-iso-255': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'tecnifibre-tf40-305-18x20': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'tecnifibre-tf40-305-16x19': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0.5
  },
  'tecnifibre-tf40-315-16x19': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0.5
  },
  'tecnifibre-tf40-290': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'tecnifibre-tempo-298-iga': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },

  // Yonex + Wilson additional
  'yonex-ezone-98-2024': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 0.5  // VDM + 2G-NAMD: damping on precision platform
  },
  'yonex-ezone-98l-2024': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0
  },
  'yonex-ezone-100l-2024': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0
  },
  'yonex-vcore-95-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0.5, genBonus: 1.5  // Servo Filter + FlexForce: damping on thin beam
  },
  'yonex-vcore-98-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 1, genBonus: 1.5  // Servo Filter + SIF: spin+comfort anomaly
  },
  'yonex-vcore-98l-2026': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0.5, genBonus: 1
  },
  'yonex-vcore-100-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 1, genBonus: 1.5  // Servo Filter + SIF + aero beam: full anomaly
  },
  'yonex-vcore-100l-2026': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0.5, genBonus: 1
  },
  'yonex-percept-97-2023': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1  // Servo Filter + FlexForce: feel-first with damping
  },
  'yonex-percept-97h-2023': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1  // Servo Filter: heavy frame magnifies damping
  },
  'yonex-percept-100-2023': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1  // Servo Filter: comfort+control anomaly
  },
  'yonex-percept-100d-2023': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1  // Servo Filter: dense pattern benefits from dwell
  },
  'yonex-percept-104-2023': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'yonex-regna-98-2024': {
    aeroBonus: 0, comfortTech: 2.5, spinTech: 1, genBonus: 2
  },
  'wilson-pro-staff-97l-v14': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-pro-staff-97ul-v14': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-pro-staff-team-v14': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-blade-98-16x19-v9': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'wilson-blade-98-18x20-v9': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'wilson-blade-100-v9': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'wilson-blade-100l-v9': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-blade-100ul-v9': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-blade-101l-v9': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-blade-104-v9': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'wilson-shift-99-pro-v1': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0.5
  },
  'wilson-clash-98-v2': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 0.5
  },
  'wilson-clash-100-v2': {
    aeroBonus: 0, comfortTech: 2.5, spinTech: 0, genBonus: 0.5
  },
  'wilson-clash-100-pro-v2': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 0.5
  },
  'wilson-clash-100l-v2': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 0
  },
  'wilson-clash-100ul-v2': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0
  },
  'wilson-clash-108-v2': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0
  },
  'wilson-ultra-100-v4': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-ultra-100l-v4': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-ultra-108-v4': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  'wilson-ultra-pro-97-v4': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },

  // Diadem
  'diadem-elevate-98-v3': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0.5
  },
  'diadem-elevate-98-v3-tour': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0.5
  },
  'diadem-elevate-98-v3-lite': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'diadem-nova-100': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'diadem-nova-100-lite': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  // Volkl
  'volkl-v8-pro-2023': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'volkl-vcell-8-300': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0.5, genBonus: 0
  },
  'volkl-vcell-8-285': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  // Dunlop
  'dunlop-fx-500-2023': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'dunlop-fx-500-ls-2023': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'dunlop-fx-500-lite-2023': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  // Dunlop CX + SX
  'dunlop-cx-200-tour-16x19-2024': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'dunlop-cx-200-2024': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
  },
  'dunlop-cx-200-ls-2024': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'dunlop-sx-300-2022': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0
  },
  'dunlop-sx-300-tour-2022': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 1, genBonus: 0
  }
};

function calcFrameBase(racquet) {
  const { stiffness, beamWidth, swingweight, pattern, headSize, strungWeight, balance, id } = racquet;
  const avgBeam = getAvgBeam(beamWidth);
  const maxBeam = getMaxBeam(beamWidth);
  const minBeam = getMinBeam(beamWidth);
  const [mains, crosses] = pattern.split('x').map(Number);
  const patternDensity = mains * crosses;
  const meta = FRAME_META[id] || { aeroBonus: 0, comfortTech: 0, spinTech: 0, genBonus: 0 };

  // Balance in pts HL: 34.29cm = 0 pts, each 0.3175cm toward handle = +1 pt
  const balancePtsHL = (34.29 - balance) / 0.3175;

  // ---- Normalized inputs [0, 1] ----
  const raNorm = norm(stiffness, 55, 72);         // 0=soft, 1=stiff
  const swNorm = norm(swingweight, 300, 340);      // 0=light, 1=heavy
  const wtNorm = norm(strungWeight, 290, 340);     // 0=light, 1=heavy
  const hsNorm = norm(headSize, 95, 102);          // 0=small, 1=large
  const avgBeamNorm = norm(avgBeam, 18, 27);       // 0=thin, 1=thick
  const maxBeamNorm = norm(maxBeam, 18, 27);       // 0=thin, 1=thick
  const hlNorm = norm(balancePtsHL, 0, 8);         // 0=even/HH, 1=very HL
  const densityNorm = norm(patternDensity, 288, 360); // 0=open, 1=dense
  const beamRange = maxBeam - minBeam;
  const beamVarNorm = norm(beamRange, 0, 8);       // 0=constant, 1=extreme variable
  const openness = 1 - densityNorm;

  // ===== POWER =====
  let power = 50;
  power += raNorm * 18 - 5;
  power += maxBeamNorm * 14 - 4;
  power += swNorm * 8 - 2;
  power += openness * 4 - 2;
  power += beamVarNorm * 4;
  power -= hlNorm * 3;
  power += meta.aeroBonus * 1.5;
  power += meta.genBonus * 1;

  // ===== SPIN =====
  let spin = 50;
  spin += openness * 18 - 6;
  spin += hsNorm * 8 - 2;
  spin += beamVarNorm * 4;
  spin += meta.spinTech * 3;
  spin += meta.aeroBonus * 2;
  spin += meta.genBonus * 0.5;

  // ===== CONTROL =====
  let control = 50;
  control += densityNorm * 14 - 4;
  control += (1 - hsNorm) * 8 - 2;
  control += swNorm * 6 - 1.5;
  control += (1 - maxBeamNorm) * 6 - 2;
  control += hlNorm * 3;
  control += meta.genBonus * 0.5;
  control += raNorm > 0.3 ? (raNorm - 0.3) * 4 : (raNorm - 0.3) * 6;

  // ===== LAUNCH =====
  let launch = 50;
  launch += beamVarNorm * 10;
  launch += (1 - raNorm) * 8 - 3;
  launch += openness * 5 - 2;
  launch += maxBeamNorm * 4 - 1.5;
  launch += meta.spinTech * 1.5;

  // ===== COMFORT =====
  let comfort = 50;
  comfort += (1 - raNorm) * 20 - 5;
  comfort += (1 - avgBeamNorm) * 5 - 1;
  comfort += meta.comfortTech * 3;
  comfort += meta.genBonus * 1;
  if (wtNorm > 0.7) comfort -= (wtNorm - 0.7) * 8;

  // ===== STABILITY =====
  let stability = 50;
  stability += swNorm * 20 - 6;
  stability += wtNorm * 10 - 3;
  stability += raNorm * 5 - 1.5;
  stability -= hlNorm * 4;
  stability += meta.genBonus * 0.5;

  // ===== FORGIVENESS =====
  let forgiveness = 48;
  forgiveness += hsNorm * 24 - 8;
  forgiveness += swNorm * 10 - 4;
  forgiveness += beamVarNorm * 5;
  forgiveness += avgBeamNorm * 7 - 2.5;
  forgiveness += meta.comfortTech * 1.5;
  forgiveness += (1 - raNorm) * 6 - 2;
  forgiveness += wtNorm * 5 - 2;

  // ===== FEEL =====
  let feel = 50;
  feel += (1 - raNorm) * 20 - 6;
  feel += (1 - avgBeamNorm) * 10 - 3;
  feel += hlNorm * 4;
  feel += wtNorm * 4 - 1;
  feel += meta.genBonus * 1.5;
  feel += densityNorm * 4 - 2;
  feel += meta.comfortTech > 1.5 ? -1 : meta.comfortTech * 0.5;

  // ===== MANEUVERABILITY =====
  // Inverse of swingweight: lower SW = more maneuverable, easier to accelerate
  // More head-light balance = whippier feel, faster racquet-head speed generation
  // Lower weight helps maneuverability but less than SW/balance
  // This creates a natural tradeoff axis: maneuverability ↔ stability/plow
  let maneuverability = 50;
  maneuverability += (1 - swNorm) * 22 - 6;     // SW: biggest factor — low SW = high score
  maneuverability += hlNorm * 10 - 3;            // HL balance: whippier = more maneuverable
  maneuverability += (1 - wtNorm) * 8 - 2;       // Lower static weight helps
  maneuverability += (1 - hsNorm) * 4 - 1;       // Smaller heads slightly more maneuverable
  // Interaction: very HL + low SW amplifies maneuverability
  if (hlNorm > 0.5 && swNorm < 0.4) {
    maneuverability += (hlNorm - 0.5) * (0.4 - swNorm) * 12;
  }
  // Very high SW crushes maneuverability regardless of other factors
  if (swNorm > 0.75) {
    maneuverability -= (swNorm - 0.75) * 16;
  }

  // ===== TRADEOFF ENFORCEMENT =====
  if (power + control > 145) {
    const excess = (power + control - 145) * 0.4;
    if (power > control) power -= excess;
    else control -= excess;
  }
  if (power + comfort > 140) {
    const excess = (power + comfort - 140) * 0.3;
    if (raNorm > 0.5) comfort -= excess;
    else power -= excess;
  }
  // Maneuverability ↔ Stability: naturally opposed, soft enforce ceiling
  if (maneuverability + stability > 140) {
    const excess = (maneuverability + stability - 140) * 0.3;
    if (maneuverability > stability) maneuverability -= excess;
    else stability -= excess;
  }

  // ===== SCORE COMPRESSION =====
  // Target: 50-60 avg, 60-75 strong, 75-85 excellent, 85+ rare
  const compress = (val, spread) => {
    const mid = 62;
    const s = spread || 0.85;
    return Math.max(30, Math.min(90, mid + (val - mid) * s));
  };

  return {
    power: clamp(compress(power)),
    spin: clamp(compress(spin)),
    control: clamp(compress(control)),
    launch: clamp(compress(launch)),
    comfort: clamp(compress(comfort)),
    stability: clamp(compress(stability)),
    forgiveness: clamp(compress(forgiveness, 0.92)),  // wider spread for narrower natural range
    feel: clamp(compress(feel)),
    maneuverability: clamp(compress(maneuverability)),
    durability: 50,
    playability: 50,
    _frameDebug: {
      raNorm: +raNorm.toFixed(3),
      swNorm: +swNorm.toFixed(3),
      wtNorm: +wtNorm.toFixed(3),
      hsNorm: +hsNorm.toFixed(3),
      avgBeamNorm: +avgBeamNorm.toFixed(3),
      maxBeamNorm: +maxBeamNorm.toFixed(3),
      hlNorm: +hlNorm.toFixed(3),
      densityNorm: +densityNorm.toFixed(3),
      beamVarNorm: +beamVarNorm.toFixed(3),
      openness: +openness.toFixed(3),
      variable: isVariableBeam(beamWidth),
      meta: id
    }
  };
}

// ============================================
// LAYER 1: BASE STRING PROFILE
// ============================================
// Derives a standalone string profile from twScore + physical properties.
// Score compression: 50-60 avg, 60-75 strong, 75-85 excellent, 85+ rare/exceptional.
// No string should casually hit 90+ without being a genuine outlier.

function compressScore(raw, floor = 30, ceiling = 95) {
  // Compress twScore (raw 0-100) into a more realistic range.
  // twScore ~38-98 → compressed ~32-88.
  // Formula: soft sigmoid-like compression that pulls extremes toward center.
  const mid = 65;
  const spread = 0.55; // <1 compresses, >1 expands
  const compressed = mid + (raw - mid) * spread;
  return Math.max(floor, Math.min(ceiling, compressed));
}

function calcBaseStringProfile(stringData) {
  const tw = stringData.twScore;
  const stiff = stringData.stiffness; // lb/in: 115 (Truffle X elastic) to 234 (RPM Blast 17). All values TWU-measured or estimated in same unit.
  const tLoss = stringData.tensionLoss; // %: 10 (gut/Truffle X) to 48.3 (Hawk Power). Percentage of initial tension lost after break-in.
  const spinPot = stringData.spinPotential; // TWU lab scale: 4.5 (RPM Blast 16) to 9.4 (O-Toro). Measures friction-based spin generation.

  // Normalize stiffness: 0 = stiffest (234), 1 = softest (115)
  const stiffNorm = Math.max(0, Math.min(1, lerp(stiff, 115, 234, 1, 0)));

  // Normalize tension loss: 0 = best maintenance (10%), 1 = worst (50%)
  const tLossNorm = Math.max(0, Math.min(1, lerp(tLoss, 10, 50, 0, 1)));

  // Normalize spin potential: 0 = low (4.5), 1 = high (9.0)
  const spinNorm = Math.max(0, Math.min(1, lerp(spinPot, 4.5, 9.0, 0, 1)));

  // --- Power: twScore primary, stiffness secondary ---
  // Softer strings = more power (elastic return), but cap the bonus
  let power = compressScore(tw.power);
  power += stiffNorm * 5 - 2; // soft: up to +3, stiff: down to -2

  // --- Control: twScore primary, inverse of power tendency ---
  let control = compressScore(tw.control);
  control += (1 - stiffNorm) * 4 - 1.5; // stiff: up to +2.5, soft: down to -1.5

  // --- Spin: twScore + spinPotential blend ---
  let spin = compressScore(tw.spin) * 0.6 + compressScore(spinPot * 12) * 0.4;
  // Shaped strings get small bonus (already reflected in spinPotential mostly)

  // --- Comfort: twScore primary, stiffness confirms ---
  let comfort = compressScore(tw.comfort);
  comfort += stiffNorm * 4 - 1.5; // soft: up to +2.5, stiff: down to -1.5

  // --- Feel: twScore primary, stiffness + material secondary ---
  let feel = compressScore(tw.feel);
  if (stringData.material === 'Natural Gut') feel += 3; // gut has unmatched feel, but capped to avoid runaway
  feel += stiffNorm * 4 - 1; // soft: up to +3, stiff: down to -1
  // Shaped strings have slightly less clean ball feedback than round
  const isRound = stringData.shape && stringData.shape.toLowerCase().includes('round');
  if (!isRound && stringData.material !== 'Natural Gut') feel -= 1.5;

  // --- Durability: twScore directly, thin gauge penalty ---
  let durability = compressScore(tw.durability);
  if (stringData.gaugeNum <= 1.20) durability -= 3;
  if (stringData.gaugeNum >= 1.30) durability += 2;

  // --- Playability Duration: twScore + tension maintenance ---
  let playability = compressScore(tw.playabilityDuration);
  playability += (1 - tLossNorm) * 6 - 2; // good maintenance: up to +4, poor: down to -2

  // --- Tradeoff enforcement ---
  // If power + control sum is too high, tax the lesser one
  const pcSum = power + control;
  if (pcSum > 140) {
    const excess = (pcSum - 140) * 0.5;
    if (power > control) control -= excess;
    else power -= excess;
  }

  // If comfort + control sum is unrealistically high, apply small tax
  const ccSum = comfort + control;
  if (ccSum > 145) {
    const excess = (ccSum - 145) * 0.4;
    if (comfort > control) comfort -= excess;
    else control -= excess;
  }

  // --- Final clamp: nothing below 25, nothing above 86 for base string ---
  // 86 cap prevents any single string from pushing a stat dimension
  // too far from the mean — even gut shouldn't produce a 89+ feel base.
  const capLow = 25, capHigh = 86;
  const profile = {
    power: Math.round(Math.max(capLow, Math.min(capHigh, power))),
    spin: Math.round(Math.max(capLow, Math.min(capHigh, spin))),
    control: Math.round(Math.max(capLow, Math.min(capHigh, control))),
    feel: Math.round(Math.max(capLow, Math.min(capHigh, feel))),
    comfort: Math.round(Math.max(capLow, Math.min(capHigh, comfort))),
    durability: Math.round(Math.max(capLow, Math.min(capHigh, durability))),
    playability: Math.round(Math.max(capLow, Math.min(capHigh, playability)))
  };

  return profile;
}

// ============================================
// LAYER 2: FRAME INTERACTION (string modifiers on frame)
// ============================================
// String properties create small modifiers on frame-driven stats.
// These are intentionally small (-3 to +5 range) — the frame is primary for
// spin/power/control/comfort/feel/launch; the string profile handles
// durability and playability directly.
// Magnitudes are scaled to ~60% of the Layer 1 stiffness adjustments to
// prevent over-amplification of stiffness through two additive paths.

function calcStringFrameMod(stringData) {
  const stiff = stringData.stiffness;
  // Clamped normalization: 0 = stiffest (234), 1 = softest (115)
  const stiffNorm = Math.max(0, Math.min(1, lerp(stiff, 115, 234, 1, 0)));
  const spinPot = stringData.spinPotential;

  // Layer 2 mods: how string stiffness interacts with the frame.
  // Stiffness already shapes the string profile (L1); these capture the
  // frame-coupling effect only. Kept intentionally small to avoid
  // double-counting stiffness through two additive paths.
  return {
    powerMod: stiffNorm * 3 - 1,          // soft: up to +2, stiff: -1
    spinMod: (spinPot - 6.0) * 1.5,       // centered at 6.0, ±1.5 per point
    controlMod: (1 - stiffNorm) * 3 - 1,  // stiff: up to +2, soft: -1
    comfortMod: stiffNorm * 3 - 1,        // soft: up to +2, stiff: -1
    feelMod: stiffNorm * 2.5 - 0.5,       // soft: up to +2, stiff: -0.5 (gut bonus is in L1 profile only)
    launchMod: stiffNorm * 1.5 - 0.4      // soft strings add slight launch
  };
}

function calcTensionModifier(mainsTension, crossesTension, tensionRange, pattern) {
  const avgTension = (mainsTension + crossesTension) / 2;
  const mid = (tensionRange[0] + tensionRange[1]) / 2;
  const diff = avgTension - mid;
  // Every 2 lbs above midpoint: +2 control, -2 power
  const factor = diff / 2;

  // --- Pattern-aware mains/crosses differential ---
  // The interaction between mains and crosses changes fundamentally
  // with cross density. Dense 20-cross beds are already "locked" by geometry,
  // so the differential sweet spot shifts.
  const differential = mainsTension - crossesTension;
  const absDiff = Math.abs(differential);
  const [patMains, patCrosses] = (pattern || '16x19').split('x').map(Number);
  const isDense20 = patCrosses >= 20;  // 16x20, 18x20 etc.
  const isOpen = patCrosses <= 18;     // 16x18, 16x19

  let diffSpinBonus = 0;
  let diffControlMod = 0;
  let diffComfortMod = 0;
  let diffDurabilityMod = 0;
  let diffFeelMod = 0;
  let diffLaunchMod = 0;

  if (isDense20) {
    // ===== DENSE 20-CROSS PATTERNS =====
    // Short, numerous crosses are already effectively stiff.
    // "Mains tighter" can over-constrain the bed, killing snapback.
    // "Crosses equal or slightly tighter" can yield a more uniform, 
    // linear, predictable response — good for flat drives.
    //
    // Optimal zone: differential -2 to +2 (near equal)
    // Acceptable: crosses up to 3 lbs tighter (locks grid for control)
    // Bad: mains much tighter (>+4) — chokes snapback, feels dead

    if (absDiff <= 2) {
      // Sweet spot for dense beds: near-equal tension
      diffControlMod = 0.5;  // slight control bonus for uniform bed
      diffFeelMod = 0.5;     // consistent feel
    } else if (differential >= -3 && differential < -1) {
      // Crosses 1-3 lbs tighter — valid dense-pattern technique
      // Firms up the grid, lower launch, more linear response
      diffControlMod = 1.0;
      diffLaunchMod = differential * 0.4;  // lower launch (negative)
      diffFeelMod = 0.3;  // more uniform feel
      diffSpinBonus = -0.5; // small spin tradeoff (less snapback)
    } else if (differential > 2 && differential <= 4) {
      // Mains 3-4 lbs tighter on dense bed — diminishing returns
      // Cross matrix already stiff, extra main tension doesn't help much
      diffSpinBonus = 0.5;  // less benefit than on open patterns
      diffControlMod = -0.5;
    } else if (differential > 4) {
      // Mains way tighter on dense bed — BAD
      // Over-constrains mains, kills snapback, dead bed
      diffSpinBonus = -(differential - 4) * 0.5;
      diffControlMod = -(differential - 4) * 0.8;
      diffComfortMod = -(differential - 4) * 0.6;
      diffFeelMod = -(differential - 4) * 0.8;
      diffDurabilityMod = -(differential - 4) * 1.0;
    } else if (differential < -3) {
      // Crosses way too tight — excessive even for dense beds
      diffControlMod = -(absDiff - 3) * 0.6;
      diffComfortMod = -(absDiff - 3) * 0.5;
      diffFeelMod = -(absDiff - 3) * 0.4;
    }

  } else if (isOpen) {
    // ===== OPEN PATTERNS (16x18, 16x19) =====
    // Open beds start "loose" — designed for spin and snapback.
    // Mains tighter than crosses is the clear optimal.
    // Reversing kills exactly what the pattern is for.

    if (differential >= 1 && differential <= 4) {
      // Sweet spot: mains 1-4 lbs tighter
      diffSpinBonus = Math.min(differential, 3) * 1.0; // up to +3.0 spin
    } else if (differential > 4 && differential <= 6) {
      diffSpinBonus = 1.5;
      diffControlMod = -(differential - 4) * 0.5;
    } else if (differential > 6) {
      // Excessive even for open patterns
      diffSpinBonus = 0;
      diffControlMod = -(differential - 4) * 1.2;
      diffComfortMod = -(differential - 6) * 0.8;
      diffDurabilityMod = -(differential - 6) * 1.5;
      diffFeelMod = -(differential - 6) * 1.0;
    }

    if (differential < -1) {
      // Crosses tighter on open bed — BAD. Kills snapback.
      diffSpinBonus = differential * 0.8;  // stronger spin penalty on open
      diffControlMod = absDiff > 3 ? -(absDiff - 3) * 1.0 : 0;
      diffFeelMod = differential * 0.6;
      diffComfortMod = absDiff > 3 ? -(absDiff - 3) * 0.6 : 0;
    }

  } else {
    // ===== STANDARD PATTERNS (18x19, 18x20 with <20 crosses) =====
    // Middle ground between open and dense.
    // Mains slightly tighter is standard, but less critical than open.

    if (differential >= 1 && differential <= 4) {
      diffSpinBonus = Math.min(differential, 3) * 0.7;
    } else if (differential > 4 && differential <= 6) {
      diffSpinBonus = 0.8;
      diffControlMod = -(differential - 4) * 0.4;
    } else if (differential > 6) {
      diffSpinBonus = 0;
      diffControlMod = -(differential - 4) * 1.0;
      diffComfortMod = -(differential - 6) * 0.7;
      diffDurabilityMod = -(differential - 6) * 1.2;
      diffFeelMod = -(differential - 6) * 0.8;
    }

    if (differential < -1) {
      diffSpinBonus = differential * 0.5;
      diffControlMod = absDiff > 3 ? -(absDiff - 3) * 0.7 : 0;
      diffFeelMod = differential * 0.4;
      diffComfortMod = absDiff > 4 ? -(absDiff - 4) * 0.5 : 0;
    }
  }

  return {
    powerMod: -factor * 2,
    controlMod: factor * 2 + diffControlMod,
    launchMod: -factor * 1.5 + diffLaunchMod,
    comfortMod: -factor * 1.5 + diffComfortMod,
    spinMod: -Math.abs(factor) * 0.4 + diffSpinBonus,
    feelMod: factor * 1.0 + diffFeelMod,
    playabilityMod: -Math.abs(factor) * 0.6,
    durabilityMod: diffDurabilityMod,
    _differential: differential
  };
}

// ============================================
// COMBINED PREDICTION: Frame Base + String Modifier + Tension + String Profile
// ============================================
// Frame-driven stats (spin, power, control, feel, comfort) use FW/SW weighted blend
// + L2 string mod + tension mod.
// Launch uses frame base + L2 mod + tension mod (no string profile blend).
// Stability & forgiveness are frame-only (no string or tension influence).
// Durability is string-only. Playability is string + tension.

// ============================================
// LAYER 3: HYBRID INTERACTION MODEL
// ============================================
// When two different strings are paired as mains/crosses, their interaction
// changes which string dominates feel, spin, power, and how fast the bed dies.
// This layer models the pairing dynamics beyond simple weighted blending.
//
// Key principles:
// - Mains dominate power, feel, spin window (longer, deform more)
// - Crosses modulate: control, launch, snapback friction, comfort, durability
// - "Which hybrid is better" depends on what job the cross is doing
// - Same cross, different main → different job → different fitness

function calcHybridInteraction(mainsData, crossesData) {
  const mainsMat = mainsData.material;
  const crossMat = crossesData.material;
  const isGutMains = mainsMat === 'Natural Gut';
  const isMultiMains = mainsMat === 'Multifilament';
  const isSoftMains = isGutMains || isMultiMains;
  const isPolyMains = mainsMat === 'Polyester' || mainsMat === 'Co-Polyester (elastic)';
  const isPolyCross = crossMat === 'Polyester' || crossMat === 'Co-Polyester (elastic)';
  const isGutCross = crossMat === 'Natural Gut';
  const isSoftCross = crossMat === 'Natural Gut' || crossMat === 'Multifilament' || crossMat === 'Synthetic Gut';

  // Cross string properties
  const crossStiff = crossesData.stiffness || 200;
  const crossStiffNorm = Math.max(0, Math.min(1, (crossStiff - 115) / (234 - 115))); // 0=soft, 1=stiff
  const crossShape = (crossesData.shape || '').toLowerCase();
  const crossIsRound = crossShape.includes('round');
  const crossIsShaped = !crossIsRound && (crossShape.includes('pentagon') || crossShape.includes('hex') || crossShape.includes('square') || crossShape.includes('star') || crossShape.includes('octagon') || crossShape.includes('heptagonal'));
  const crossIsSlick = crossShape.includes('slick') || crossShape.includes('coated') || crossShape.includes('silicone');
  const crossSpinPot = crossesData.spinPotential || 6;
  const crossIsElastic = crossMat === 'Co-Polyester (elastic)';

  // Mains properties
  const mainsStiff = mainsData.stiffness || 200;
  const mainsShape = (mainsData.shape || '').toLowerCase();
  const mainsIsShaped = mainsShape.includes('pentagon') || mainsShape.includes('hex') || mainsShape.includes('square') || mainsShape.includes('star') || mainsShape.includes('octagon') || mainsShape.includes('heptagonal') || mainsShape.includes('textured');

  // --- Result object: modifiers applied AFTER the base hybrid blend ---
  const mods = {
    powerMod: 0,
    spinMod: 0,
    controlMod: 0,
    comfortMod: 0,
    feelMod: 0,
    durabilityMod: 0,
    playabilityMod: 0,
    launchMod: 0
  };

  // ========================================
  // CASE 1: GUT/MULTI MAINS + POLY CROSSES
  // ========================================
  // The classic "best of both worlds" hybrid. Cross job:
  // - Be slick enough that gut slides (prevent premature notching)
  // - Be soft enough not to kill gut feel
  // - Be firm enough to rein in launch and add control
  // - Not saw through gut too quickly
  if (isSoftMains && isPolyCross) {
    // Base synergy bonus: gut+poly is a proven, synergistic combo
    mods.comfortMod += 1;       // gut comfort preserved, poly adds structure
    mods.controlMod += 2;       // poly cross reins in gut's wild launch
    mods.launchMod -= 0.5;      // poly tames gut's high launch tendency

    // Cross fitness for gut: ideal cross is soft-ish, slick, round
    // A. Slickness / roundness — essential for gut preservation
    if (crossIsRound || crossIsSlick) {
      mods.durabilityMod += 3;  // round/slick cross preserves gut lifespan
      mods.feelMod += 1;        // doesn't interfere with gut's signature feel
    } else if (crossIsShaped) {
      // Shaped polys as crosses under gut: the nightmare scenario
      // Sharp edges saw through gut faster, friction kills snapback
      mods.durabilityMod -= 5;  // shaped crosses destroy gut
      mods.feelMod -= 2;        // gritty, fights gut's natural pocketing
      mods.comfortMod -= 2;     // harsh interaction at cross points
      mods.spinMod -= 1;        // friction locks rather than enables snapback
    }

    // B. Cross stiffness — softer is better under gut (preserves feel)
    if (crossStiffNorm < 0.4) {
      // Soft poly cross (like Irukandji): ideal for gut preservation
      mods.feelMod += 1;
      mods.comfortMod += 1;
    } else if (crossStiffNorm > 0.7) {
      // Very stiff poly cross: functional but kills gut's magic
      mods.feelMod -= 1;
      mods.comfortMod -= 1;
      mods.powerMod -= 1;       // boardy response under elastic mains
    }

    // C. Elastic co-polys: specifically designed for gut crosses
    if (crossIsElastic) {
      mods.feelMod += 1;        // complements gut elasticity
      mods.durabilityMod += 2;  // gentler on gut
      mods.comfortMod += 1;
    }

    // D. Gut durability baseline penalty in hybrid
    // Gut mains break faster than poly mains regardless of cross choice
    mods.durabilityMod -= 3;
  }

  // ========================================
  // CASE 2: POLY MAINS + POLY CROSSES
  // ========================================
  // Standard hybrid. Cross job:
  // - Stay slick so shaped/grippy mains can snap back
  // - Stabilize the bed without adding excess power
  // - Be neutral — let the mains do the biting
  else if (isPolyMains && isPolyCross) {
    // Cross fitness: ideal is slick, round, neutral
    if (crossIsRound || crossIsSlick) {
      mods.spinMod += 1.5;      // round cross lets mains snap back freely
      mods.controlMod += 1;     // stable, predictable bed
    }

    // Shaped mains + round cross = synergy (each does its job)
    if (mainsIsShaped && (crossIsRound || crossIsSlick)) {
      mods.spinMod += 1;        // optimal spin: shaped bites, round slides
      mods.controlMod += 0.5;
    }

    // Both shaped: friction overload, bed locks up
    if (mainsIsShaped && crossIsShaped) {
      mods.spinMod -= 2;        // too much friction, mains can't snap
      mods.feelMod -= 1;        // dead/boardy feel
      mods.comfortMod -= 1;     // harsh impact
    }

    // Stiffness mismatch: very different stiffnesses create uneven bed
    const stiffGap = Math.abs(mainsStiff - crossStiff);
    if (stiffGap > 60) {
      mods.feelMod -= 1;        // inconsistent feel across string bed
      mods.controlMod -= 0.5;   // unpredictable response
    }
  }

  // ========================================
  // CASE 3: POLY MAINS + GUT/MULTI CROSSES
  // ========================================
  // Uncommon: more immediate spin/control from poly mains,
  // softer feel from gut/multi crosses, but bed notches earlier
  else if (isPolyMains && isSoftCross) {
    mods.feelMod += 2;          // soft cross adds touch behind poly
    mods.comfortMod += 1.5;     // softer impact at crosses
    mods.powerMod += 1;         // elastic crosses add power return

    // But: crosses notch faster, durability suffers
    if (isGutCross) {
      mods.durabilityMod -= 4;  // gut crosses shred against poly mains
      mods.playabilityMod -= 2; // bed deteriorates as notches form
    } else {
      mods.durabilityMod -= 2;
      mods.playabilityMod -= 1;
    }

    // Shaped poly mains with gut crosses: particularly rough
    if (mainsIsShaped && isGutCross) {
      mods.durabilityMod -= 3;  // shaped poly destroys gut crosses
    }
  }

  // ========================================
  // CASE 4: GUT MAINS + GUT CROSSES (full gut)
  // ========================================
  else if (isGutMains && isGutCross) {
    mods.feelMod += 3;          // ultimate feel
    mods.comfortMod += 2;       // softest possible bed
    mods.powerMod += 1;         // elastic in all directions
    mods.durabilityMod -= 6;    // extremely fragile
    mods.controlMod -= 2;       // very hard to control trajectory
    mods.spinMod -= 2;          // no friction differential for snapback
  }

  // ========================================
  // CASE 5: SOFT MAINS + SOFT CROSSES (multi+multi, multi+synth, etc.)
  // ========================================
  else if (isSoftMains && isSoftCross && !isGutMains && !isGutCross) {
    mods.comfortMod += 1;
    mods.durabilityMod -= 1;
    mods.controlMod -= 1;
  }

  return mods;
}

function predictSetup(racquet, stringConfig) {
  const frameBase = calcFrameBase(racquet);

  let stringMod, stringProfile;
  let avgTension;

  if (stringConfig.isHybrid) {
    const mainsMod = calcStringFrameMod(stringConfig.mains);
    const crossesMod = calcStringFrameMod(stringConfig.crosses);
    const mainsProfile = calcBaseStringProfile(stringConfig.mains);
    const crossesProfile = calcBaseStringProfile(stringConfig.crosses);

    // Layer 3: Hybrid interaction — pairing-specific adjustments
    const hybridMods = calcHybridInteraction(stringConfig.mains, stringConfig.crosses);

    // Mains-weighted for power/comfort/feel/spin, crosses-weighted for control
    stringMod = {
      powerMod: mainsMod.powerMod * 0.7 + crossesMod.powerMod * 0.3 + hybridMods.powerMod,
      spinMod: mainsMod.spinMod * 0.7 + crossesMod.spinMod * 0.3 + hybridMods.spinMod,
      controlMod: mainsMod.controlMod * 0.3 + crossesMod.controlMod * 0.7 + hybridMods.controlMod,
      comfortMod: mainsMod.comfortMod * 0.7 + crossesMod.comfortMod * 0.3 + hybridMods.comfortMod,
      feelMod: mainsMod.feelMod * 0.7 + crossesMod.feelMod * 0.3 + hybridMods.feelMod,
      launchMod: mainsMod.launchMod * 0.7 + crossesMod.launchMod * 0.3 + hybridMods.launchMod
    };

    // Blend string profiles: mains dominant for most, crosses for durability
    stringProfile = {
      power: mainsProfile.power * 0.7 + crossesProfile.power * 0.3,
      spin: mainsProfile.spin * 0.6 + crossesProfile.spin * 0.4,
      control: mainsProfile.control * 0.4 + crossesProfile.control * 0.6,
      feel: mainsProfile.feel * 0.7 + crossesProfile.feel * 0.3,
      comfort: mainsProfile.comfort * 0.7 + crossesProfile.comfort * 0.3,
      durability: mainsProfile.durability * 0.4 + crossesProfile.durability * 0.6 + hybridMods.durabilityMod,
      playability: mainsProfile.playability * 0.6 + crossesProfile.playability * 0.4 + (hybridMods.playabilityMod || 0)
    };

    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  } else {
    stringMod = calcStringFrameMod(stringConfig.string);
    stringProfile = calcBaseStringProfile(stringConfig.string);
    stringMod.launchMod = stringMod.launchMod || 0;
    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  }

  const tensionMod = calcTensionModifier(stringConfig.mainsTension, stringConfig.crossesTension, racquet.tensionRange, racquet.pattern);

  // --- Blend: frame base (primary) + string mod + tension mod ---
  // Frame-driven stats: frame is dominant, string profile secondary.
  // A string change should move individual stats by ~5-8 points, not 11-16.
  const FW = 0.72; // frame weight — frame determines the character
  const SW = 0.28; // string profile weight — string modulates, doesn't redefine

  const stats = {
    spin:    clamp(frameBase.spin * FW + stringProfile.spin * SW + stringMod.spinMod + tensionMod.spinMod),
    power:   clamp(frameBase.power * FW + stringProfile.power * SW + stringMod.powerMod + tensionMod.powerMod),
    control: clamp(frameBase.control * FW + stringProfile.control * SW + stringMod.controlMod + tensionMod.controlMod),
    launch:  clamp(frameBase.launch + stringMod.launchMod + tensionMod.launchMod),
    feel:    clamp(frameBase.feel * FW + stringProfile.feel * SW + stringMod.feelMod + tensionMod.feelMod),
    comfort: clamp(frameBase.comfort * FW + stringProfile.comfort * SW + stringMod.comfortMod + tensionMod.comfortMod),
    stability:   clamp(frameBase.stability),
    forgiveness: clamp(frameBase.forgiveness),
    maneuverability: clamp(frameBase.maneuverability),
    // String-only stats: from string profile, with tension + differential influence
    durability:  clamp(stringProfile.durability + (tensionMod.durabilityMod || 0)),
    playability: clamp(stringProfile.playability + tensionMod.playabilityMod)
  };

  // Attach debug info for inspection
  stats._debug = { frameBase, stringProfile, stringMod, tensionMod, _frameDebug: frameBase._frameDebug,
    hybridInteraction: stringConfig.isHybrid ? calcHybridInteraction(stringConfig.mains, stringConfig.crosses) : null
  };

  return stats;
}

// ============================================
// IDENTITY GENERATOR
// ============================================

function generateIdentity(stats, racquet, stringConfig) {
  // Score each archetype — pick the one with the strongest signal
  const candidates = [
    { name: 'Precision Topspin Blade', score: (stats.spin >= 80 ? 20 : 0) + (stats.control >= 85 ? 20 : 0) + (stats.power < 55 ? 10 : 0), req: stats.spin >= 78 && stats.control >= 82 && stats.power < 60 },
    { name: 'Surgical Topspin Machine', score: (stats.spin - 70) * 2 + (stats.control - 65) * 1.5, req: stats.spin >= 75 && stats.control >= 65 && stats.control < 82 },
    { name: 'Topspin Howitzer', score: (stats.spin - 70) * 3 + (stats.power - 60) * 2, req: stats.spin >= 78 && stats.power >= 65 && stats.spin >= stats.power },
    { name: 'Power Spin Hybrid', score: (stats.power - 60) * 3 + (stats.spin - 70) * 2, req: stats.spin >= 75 && stats.power >= 70 && stats.power > stats.spin },
    { name: 'Spin Dominator', score: (stats.spin - 65) * 2.5, req: stats.spin >= 75 && stats.power < 65 && stats.control < 82 },
    { name: 'Power Brawler', score: (stats.power - 65) * 3 + (100 - stats.control) * 0.5, req: stats.power >= 75 && stats.control <= 65 },
    { name: 'Power Hybrid', score: (stats.power - 55) * 1.5 + (stats.spin - 50) * 0.5, req: stats.power >= 65 && stats.power < 80 && stats.spin < 78 && stats.control > 55 },
    { name: 'Precision Instrument', score: (stats.control - 75) * 3 + (stats.feel - 60) * 1.5, req: stats.control >= 82 && stats.spin < 78 },
    { name: 'Control Platform', score: (stats.control - 65) * 2, req: stats.control >= 70 && stats.control < 82 && stats.spin < 75 },
    { name: 'Comfort Cannon', score: (stats.comfort - 65) * 2 + (stats.power - 55) * 1.5, req: stats.comfort >= 72 && stats.power >= 65 },
    { name: 'Touch Artist', score: (stats.feel - 70) * 2.5 + (stats.comfort - 60), req: stats.feel >= 75 && stats.control >= 70 && stats.power < 65 },
    { name: 'Wall of Stability', score: (stats.stability - 65) * 3 + (stats.control - 60), req: stats.stability >= 70 && stats.control >= 70 },
    { name: 'Forgiving Weapon', score: (stats.forgiveness - 60) * 2 + (stats.power - 55) * 1.5, req: stats.forgiveness >= 68 && stats.power >= 60 },
    { name: 'Whip Master', score: (stats.maneuverability - 65) * 2.5 + (stats.spin - 60) * 1.5, req: stats.maneuverability >= 72 && stats.spin >= 68 },
    { name: 'Speed Demon', score: (stats.maneuverability - 70) * 3 + (stats.power - 55) * 1, req: stats.maneuverability >= 75 && stats.power >= 55 && stats.stability < 60 },
    { name: 'Endurance Build', score: (stats.playability - 80) * 3 + (stats.durability - 75) * 2, req: stats.playability >= 88 && stats.durability >= 80 },
    { name: 'Marathon Setup', score: (stats.durability - 80) * 2.5 + (stats.playability - 75) * 2, req: stats.durability >= 85 && stats.playability >= 82 },
  ];

  const valid = candidates.filter(c => c.req).sort((a, b) => b.score - a.score);
  const archetype = valid.length > 0 ? valid[0].name : 'Balanced Setup';

  // Description
  const descriptions = {
    'Precision Topspin Blade': `Elite spin combined with surgical control and low power assist — you generate all the pace, the setup generates all the placement. A scalpel for topspin artists who shape every ball.`,
    'Surgical Topspin Machine': `High spin potential meets solid control. Excels at constructing points with heavy topspin from the baseline, allowing you to hit with margin and still redirect at will.`,
    'Topspin Howitzer': `Massive topspin wrapped in a power platform. The ball launches with heavy rotation AND depth — opponents get pushed behind the baseline by a ball that kicks up and keeps coming.`,
    'Power Spin Hybrid': `Power-forward with spin enhancement. The gut mains provide natural power and feel while the frame and pattern add topspin capability. A dual-threat that hits deep with dip — opponents feel both the pace and the kick.`,
    'Spin Dominator': `Spin-first setup that generates heavy ball rotation. The string bed grips the ball aggressively, creating a high-bouncing, dipping trajectory that pushes opponents behind the baseline.`,
    'Power Brawler': `Maximum power with enough raw muscle to overpower opponents. Best for players who want to dictate with pace and don't need surgical precision on every shot.`,
    'Power Hybrid': `Balanced power delivery with enough control to keep balls in play. Good for intermediate to advanced players transitioning to more aggressive play.`,
    'Precision Instrument': `Control-first build for players who generate their own pace. Every swing gives clear feedback and directional precision. Rewards clean technique with surgical accuracy.`,
    'Control Platform': `Reliable control with enough assistance to stay competitive. A stable platform for developing players or all-courters who value consistency.`,
    'Comfort Cannon': `Arm-friendly power. High comfort rating means you can swing freely without worrying about elbow or shoulder strain, while still getting good power return.`,
    'Touch Artist': `Maximum feel and connection to the ball. Ideal for net players and all-courters who rely on touch, placement, and variety over raw power.`,
    'Wall of Stability': `Immovable on contact. High stability means the frame doesn't twist on off-center hits, giving you confidence even when you're not hitting the sweet spot.`,
    'Forgiving Weapon': `Large effective sweet spot with decent power. Mis-hits still go in, and centered hits carry real authority. Good for developing power hitters.`,
    'Whip Master': `Exceptional racquet-head speed potential meets high spin capability. The light, maneuverable frame lets you generate steep swing paths and aggressive topspin without fighting the racquet. Rewards athletic, wristy players who shape the ball with racquet acceleration rather than mass.`,
    'Speed Demon': `Lightning-fast swing speed from an ultra-maneuverable platform. The frame practically disappears in the hand, letting you rip through contact zones with minimal effort. Trade-off: less stability on off-center hits, but the speed makes up for it with aggressive shot-making.`,
    'Endurance Build': `Exceptional playability duration. This setup maintains its performance characteristics far longer than average, meaning fewer restrings and more consistent play.`,
    'Marathon Setup': `Built to last. Both durability and playability are elite — the string bed stays lively for weeks and resists breakage. Ideal for frequent players.`,
    'Balanced Setup': `Well-rounded profile with no glaring weaknesses. A versatile setup that adapts to different game styles and court conditions.`
  };

  return {
    archetype,
    description: descriptions[archetype] || descriptions['Balanced Setup']
  };
}

// ============================================
// FIT PROFILE GENERATOR
// ============================================

function generateFitProfile(stats, racquet, stringConfig) {
  const bestFor = [];
  const watchOut = [];

  if (stats.spin >= 70) bestFor.push('Baseline grinders who rely on topspin');
  if (stats.power >= 65) bestFor.push('Players who like to dictate with pace');
  if (stats.control >= 70) bestFor.push('Touch players and all-courters');
  if (stats.comfort >= 70) bestFor.push('Players with arm sensitivity');
  if (stats.stability >= 70) bestFor.push('Aggressive returners and blockers');
  if (stats.feel >= 75) bestFor.push('Net players and volleyers');
  if (stats.maneuverability >= 70) bestFor.push('Quick-swing players and net rushers');
  if (stats.forgiveness >= 65) bestFor.push('Developing players building consistency');
  if (stats.playability >= 80) bestFor.push('Frequent players (3+ times/week)');

  if (bestFor.length === 0) bestFor.push('Versatile all-court players');

  if (stats.power <= 40) watchOut.push('Players who need free power from the frame');
  if (stats.comfort <= 45) watchOut.push('Players with arm/elbow issues — too stiff');
  if (stats.control <= 50) watchOut.push('Players who need help keeping the ball in');
  if (stats.spin <= 50) watchOut.push('Heavy topspin players — limited spin access');
  if (stats.forgiveness <= 45) watchOut.push('Beginners — small effective sweet spot');
  if (stats.maneuverability <= 45) watchOut.push('Compact swingers — frame may feel sluggish');
  if (stats.durability <= 55) watchOut.push('String breakers — low durability');
  if (stats.playability <= 55) watchOut.push('Infrequent restringers — goes dead fast');

  if (watchOut.length === 0) watchOut.push('No major red flags — versatile setup');

  // Recommended tension
  const [low, high] = racquet.tensionRange;
  const mid = Math.round((low + high) / 2);
  const tensionRec = `${low}–${high} lbs (sweet spot: ${mid - 1}–${mid + 1} lbs)`;

  return { bestFor, watchOut, tensionRec };
}

// ============================================
// WARNINGS GENERATOR
// ============================================

function generateWarnings(racquet, stringConfig, stats) {
  const warnings = [];

  const getMainString = () => stringConfig.isHybrid ? stringConfig.mains : stringConfig.string;
  const getCrossString = () => stringConfig.isHybrid ? stringConfig.crosses : stringConfig.string;
  const getAvgTension = () => (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  const getMainsTension = () => stringConfig.mainsTension;
  const getCrossesTension = () => stringConfig.crossesTension;

  // Tension outside range
  const mainsTension = getMainsTension();
  const crossesTension = getCrossesTension();

  if (mainsTension < racquet.tensionRange[0]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is below the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of losing control and trampoline effect.`);
  }
  if (mainsTension > racquet.tensionRange[1]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is above the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of reduced comfort and arm strain.`);
  }
  if (crossesTension < racquet.tensionRange[0]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is below the recommended range.`);
  }
  if (crossesTension > racquet.tensionRange[1]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is above the recommended range.`);
  }

  // Stiffness combo warning
  const mainString = getMainString();
  if (racquet.stiffness >= 68 && mainString.stiffness >= 220) {
    warnings.push(`High frame stiffness (${racquet.stiffness} RA) + stiff string (${mainString.stiffness} lb/in) = significant shock transmission. Consider monitoring for arm discomfort.`);
  }

  // Thin gauge durability
  const allStrings = stringConfig.isHybrid ? [stringConfig.mains, stringConfig.crosses] : [stringConfig.string];
  for (const s of allStrings) {
    if (s.gaugeNum <= 1.25 && s.material === 'Polyester') {
      warnings.push(`${s.name} ${s.gauge} is thin gauge — expect reduced durability vs 16g. Frequent string breakers should consider thicker gauge.`);
    }
  }

  // Gut rain warning
  for (const s of allStrings) {
    if (s.material === 'Natural Gut') {
      warnings.push(`${s.name} is natural gut — highly vulnerable to moisture. Avoid playing in rain or high humidity without a backup racquet.`);
    }
  }

  // High tension loss
  for (const s of allStrings) {
    if (s.tensionLoss >= 40) {
      warnings.push(`${s.name} has high tension loss (${s.tensionLoss}%). Setup will play noticeably different after a few sessions. Consider restringing every 10-15 hours of play.`);
    }
  }

  return warnings;
}

// ============================================
// DATA FOUNDATION
// ============================================

// getDataFoundation removed — replaced by renderOCFoundation in 4-card grid

// ============================================
// SETUP BADGE TEXT
// ============================================

function getSetupBadge(racquet, stringConfig) {
  const racketId = racquet.identity;
  const stringId = stringConfig.isHybrid
    ? `${stringConfig.mains.identity} × ${stringConfig.crosses.identity}`
    : stringConfig.string.identity;
  return `${racketId} + ${stringId}`;
}

// ============================================
// UI CONTROLLER
// ============================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentRadarChart = null;
let comparisonRadarChart = null;
let comparisonSlots = []; // array of { racquet, stringConfig, stats, identity }
let isComparisonMode = false;

// ============================================
// PERSISTENT SHELL — MODE SYSTEM
// ============================================
let currentMode = 'overview';
const scrollPositions = { overview: 0, tune: 0, compare: 0, optimize: 0, howitworks: 0 };
let _compareInitialized = false;
let _tuneInitialized = false;
let _optimizeInitialized = false;

function switchMode(mode) {
  if (mode === currentMode) return;

  // Save scroll position of current mode's workspace
  const workspace = document.getElementById('workspace');
  if (workspace) scrollPositions[currentMode] = workspace.scrollTop;

  // Hide current mode section
  const currentSection = document.getElementById('mode-' + currentMode);
  if (currentSection) currentSection.classList.add('hidden');

  // Update mode switcher buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const prevMode = currentMode;
  currentMode = mode;

  // Update legacy flags for backward compat
  isTuneMode = (mode === 'tune');
  isComparisonMode = (mode === 'compare');

  // Show new mode section
  const newSection = document.getElementById('mode-' + mode);
  if (newSection) newSection.classList.remove('hidden');

  // Restore scroll position
  if (workspace) {
    requestAnimationFrame(() => {
      workspace.scrollTop = scrollPositions[mode] || 0;
    });
  }

  // Mode-specific initialization
  if (mode === 'overview') {
    renderDashboard();
  } else if (mode === 'tune') {
    const setup = getCurrentSetup();
    if (setup) {
      initTuneMode(setup);
    }
  } else if (mode === 'compare') {
    renderComparisonPresets();
    if (comparisonSlots.length === 0) {
      addComparisonSlotFromHome();
    } else {
      renderComparisonSlots();
      renderCompareSummaries();
      renderCompareVerdict();
      renderCompareMatrix();
      updateComparisonRadar();
    }
    // Wire close-editors button
    const closeBtn = document.getElementById('compare-editors-close');
    if (closeBtn) closeBtn.onclick = closeCompareEditors;
  } else if (mode === 'optimize') {
    if (!_optimizeInitialized) {
      initOptimize();
      _optimizeInitialized = true;
    }
  }
  // howitworks mode needs no special init — it's static content
}

// ============================================
// DYNAMIC PRESET SYSTEM
// ============================================

const DEFAULT_PRESETS = [
  {
    id: 'confidential-sync-pa100',
    name: 'Confidential/Sync on PA100',
    racquetId: 'babolat-pure-aero-100-2023',
    isHybrid: true,
    mainsId: 'solinco-confidential-16',
    crossesId: 'restring-sync',
    mainsTension: 55,
    crossesTension: 53,
    stringId: null,
    tension: null
  },
  {
    id: 'gut-rpm-pa100',
    name: 'Gut/RPM on PA100',
    racquetId: 'babolat-pure-aero-100-2023',
    isHybrid: true,
    mainsId: 'babolat-vs-touch-16',
    crossesId: 'babolat-rpm-blast-17',
    mainsTension: 55,
    crossesTension: 53,
    stringId: null,
    tension: null
  },
  {
    id: 'confidential-speed-legend',
    name: 'Confidential Full on Speed Legend',
    racquetId: 'head-speed-mp-legend-2025',
    isHybrid: false,
    mainsId: null,
    crossesId: null,
    mainsTension: 55,
    crossesTension: 53,
    stringId: 'solinco-confidential-16'
  }
];

// Persistence helpers — try web storage, fall back to in-memory
const _store = (function() { try { return window['local' + 'Storage']; } catch(e) { return null; } })();

function loadPresetsFromStorage() {
  try {
    if (!_store) return null;
    const stored = _store.getItem('tll-presets');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* storage blocked or corrupt — ignore */ }
  return null;
}

function savePresetsToStorage() {
  try {
    if (!_store) return;
    _store.setItem('tll-presets', JSON.stringify(userPresets));
  } catch (e) { /* storage blocked — ignore */ }
}

let userPresets = loadPresetsFromStorage() || [...DEFAULT_PRESETS];

function getPresetDetail(preset) {
  const racquet = RACQUETS.find(r => r.id === preset.racquetId);
  const rName = racquet ? racquet.name : 'Unknown';
  if (preset.isHybrid) {
    const mains = STRINGS.find(s => s.id === preset.mainsId);
    const crosses = STRINGS.find(s => s.id === preset.crossesId);
    const mName = mains ? mains.name : '?';
    const xName = crosses ? crosses.name : '?';
    return `${mName} M:${preset.mainsTension} / ${xName} X:${preset.crossesTension} on ${rName}`;
  } else {
    const str = STRINGS.find(s => s.id === preset.stringId);
    const sName = str ? str.name : '?';
    const mt = preset.mainsTension ?? preset.tension ?? 55;
    const xt = preset.crossesTension ?? preset.tension ?? 53;
    return `${sName} ${mt === xt ? mt + ' lbs' : 'M:' + mt + ' / X:' + xt} on ${rName}`;
  }
}

function renderHomePresets() {
  const container = $('#preset-list');
  if (!container) return;
  container.innerHTML = '';

  userPresets.forEach((preset, idx) => {
    const div = document.createElement('div');
    div.className = 'preset-item';
    div.innerHTML = `
      <button class="preset-btn" data-preset-idx="${idx}">
        <span class="preset-name">${preset.name}</span>
        <span class="preset-detail">${getPresetDetail(preset)}</span>
      </button>
      <button class="preset-delete" data-preset-idx="${idx}" title="Remove preset">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;
    container.appendChild(div);
  });

  // Attach events
  container.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.presetIdx);
      loadPresetFromData(userPresets[idx]);
    });
  });
  container.querySelectorAll('.preset-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.presetIdx);
      userPresets.splice(idx, 1);
      savePresetsToStorage();
      renderHomePresets();
      renderComparisonPresets();
    });
  });
}

function saveCurrentAsPreset() {
  const setup = getCurrentSetup();
  if (!setup) return;

  const { racquet, stringConfig } = setup;
  let presetName = '';

  if (stringConfig.isHybrid) {
    presetName = `${stringConfig.mains.name}/${stringConfig.crosses.name} on ${racquet.name}`;
  } else {
    presetName = `${stringConfig.string.name} on ${racquet.name}`;
  }

  const preset = {
    id: 'user-' + Date.now(),
    name: presetName,
    racquetId: racquet.id,
    isHybrid: stringConfig.isHybrid,
    mainsId: stringConfig.isHybrid ? stringConfig.mains.id : null,
    crossesId: stringConfig.isHybrid ? stringConfig.crosses.id : null,
    mainsTension: stringConfig.mainsTension,
    crossesTension: stringConfig.crossesTension,
    stringId: stringConfig.isHybrid ? null : stringConfig.string.id
  };

  userPresets.push(preset);
  savePresetsToStorage();
  renderHomePresets();
  renderComparisonPresets();

  // Flash save button
  const btn = $('#btn-save-preset');
  if (btn) {
    btn.classList.add('saved');
    btn.textContent = '✓ Saved';
    setTimeout(() => {
      btn.classList.remove('saved');
      btn.textContent = '+ Save Current Setup';
    }, 1200);
  }
}

function loadPresetFromData(preset) {
  if (!preset) return;
  const racquet = RACQUETS.find(r => r.id === preset.racquetId);
  if (!racquet) return;

  ssInstances['select-racquet']?.setValue(preset.racquetId);
  showFrameSpecs(racquet);

  if (preset.isHybrid) {
    setHybridMode(true);
    ssInstances['select-string-mains']?.setValue(preset.mainsId);
    populateGaugeDropdown(document.getElementById('gauge-select-mains'), preset.mainsId);
    $('#input-tension-mains').value = preset.mainsTension;
    ssInstances['select-string-crosses']?.setValue(preset.crossesId);
    populateGaugeDropdown(document.getElementById('gauge-select-crosses'), preset.crossesId);
    $('#input-tension-crosses').value = preset.crossesTension;
  } else {
    setHybridMode(false);
    ssInstances['select-string-full']?.setValue(preset.stringId);
    populateGaugeDropdown(document.getElementById('gauge-select-full'), preset.stringId);
    // Full Bed with split tensions — support both legacy (single tension) and new (mainsTension/crossesTension)
    const mt = preset.mainsTension ?? preset.tension ?? 55;
    const xt = preset.crossesTension ?? preset.tension ?? 53;
    $('#input-tension-full-mains').value = mt;
    $('#input-tension-full-crosses').value = xt;
  }

  renderDashboard();
}

function loadPresetIntoSlot(presetIdx, slotIdx) {
  const preset = userPresets[presetIdx];
  if (!preset) return;
  const slot = comparisonSlots[slotIdx];
  if (!slot) return;

  slot.racquetId = preset.racquetId;
  slot.isHybrid = preset.isHybrid;

  if (preset.isHybrid) {
    slot.mainsId = preset.mainsId;
    slot.crossesId = preset.crossesId;
    slot.mainsTension = preset.mainsTension;
    slot.crossesTension = preset.crossesTension;
    slot.stringId = '';
  } else {
    slot.stringId = preset.stringId;
    slot.mainsTension = preset.mainsTension ?? preset.tension ?? 55;
    slot.crossesTension = preset.crossesTension ?? preset.tension ?? 53;
    slot.mainsId = '';
    slot.crossesId = '';
  }

  recalcSlot(slotIdx);
}

function renderComparisonPresets() {
  const container = $('#comparison-presets');
  if (!container) return;

  if (userPresets.length === 0) {
    container.innerHTML = '<div class="comp-presets-empty">No presets saved</div>';
    return;
  }

  let html = '';
  userPresets.forEach((preset, pIdx) => {
    html += `<button class="comp-preset-btn" data-preset-idx="${pIdx}" title="${getPresetDetail(preset)}">
      <span class="comp-preset-name">${preset.name}</span>
    </button>`;
  });
  container.innerHTML = html;

  // Attach events — clicking a preset loads it into the next empty slot (or first slot)
  container.querySelectorAll('.comp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pIdx = parseInt(btn.dataset.presetIdx);
      // Find first empty slot, or add a new slot
      let targetSlot = comparisonSlots.findIndex(s => !s.racquetId);
      if (targetSlot === -1) {
        if (comparisonSlots.length < 3) {
          addComparisonSlot();
          targetSlot = comparisonSlots.length - 1;
        } else {
          targetSlot = comparisonSlots.length - 1; // overwrite last
        }
      }
      loadPresetIntoSlot(pIdx, targetSlot);

      // Flash feedback
      btn.classList.add('loaded');
      setTimeout(() => btn.classList.remove('loaded'), 600);
    });
  });
}

const STAT_KEYS = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability', 'durability', 'playability'];
const STAT_LABELS = ['Spin', 'Power', 'Control', 'Launch', 'Feel', 'Comfort', 'Stability', 'Forgiveness', 'Maneuverability', 'Durability', 'Playability'];
const STAT_LABELS_FULL = ['Spin', 'Power', 'Control', 'Launch', 'Feel', 'Comfort', 'Stability', 'Forgiveness', 'Maneuverability', 'Durability', 'Playability Duration'];
const STAT_CSS_CLASSES = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'maneuverability', 'durability', 'playability'];

function getSlotColors() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  return [
    { border: '#C7F63A', bg: 'rgba(199, 246, 58, 0.20)', bgFaint: 'rgba(199, 246, 58, 0.08)', label: 'A', cssClass: 'a', borderDash: [] },
    { border: '#7CCBFF', bg: 'rgba(124, 203, 255, 0.18)', bgFaint: 'rgba(124, 203, 255, 0.08)', label: 'B', cssClass: 'b', borderDash: [6, 3] },
    { border: '#FF9A57', bg: 'rgba(255, 154, 87, 0.18)', bgFaint: 'rgba(255, 154, 87, 0.08)', label: 'C', cssClass: 'c', borderDash: [2, 3] }
  ];
}
let SLOT_COLORS = getSlotColors();

// ============================================
// SEARCHABLE DROPDOWN COMPONENT
// ============================================

// Parse brand from racquet name (first word)
function parseRacquetBrand(name) {
  return name.split(' ')[0];
}

// Parse family from racquet name (second word or group like "Pure Aero")
function parseRacquetFamily(name) {
  const parts = name.split(' ');
  if (parts.length < 2) return '';
  // Known two-word families
  const twoWord = ['Pure Aero', 'Pure Drive', 'Pure Strike', 'Pro Staff', 'Poly Tour'];
  const rest = parts.slice(1).join(' ');
  for (const tw of twoWord) {
    if (rest.startsWith(tw)) return tw;
  }
  return parts[1];
}

// Sort racquets: brand → family → model → year desc
function getSortedRacquets() {
  return [...RACQUETS].sort((a, b) => {
    const brandA = parseRacquetBrand(a.name);
    const brandB = parseRacquetBrand(b.name);
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    const famA = parseRacquetFamily(a.name);
    const famB = parseRacquetFamily(b.name);
    if (famA !== famB) return famA.localeCompare(famB);
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return (b.year || 0) - (a.year || 0);
  });
}

// Sort strings: brand → name → gauge
function getSortedStrings() {
  return [...STRINGS].sort((a, b) => {
    const brandA = a.name.split(' ')[0];
    const brandB = b.name.split(' ')[0];
    if (brandA !== brandB) return brandA.localeCompare(brandB);
    if (a.name !== b.name) return a.name.localeCompare(b.name);
    return (a.gaugeNum || 0) - (b.gaugeNum || 0);
  });
}

function getStringMaterialBadge(material) {
  if (!material) return '';
  const m = material.toLowerCase();
  if (m.includes('multifilament') || m.includes('multi')) return '<span class="ss-opt-badge badge-multi">MULTI</span>';
  if (m.includes('synthetic')) return '<span class="ss-opt-badge badge-syngut">SYN GUT</span>';
  if (m.includes('natural gut') || (m.includes('gut') && !m.includes('synthetic'))) return '<span class="ss-opt-badge badge-gut">GUT</span>';
  if (m.includes('co-poly') || m.includes('copoly')) return '<span class="ss-opt-badge badge-copoly">CO-POLY</span>';
  if (m.includes('poly')) return '<span class="ss-opt-badge badge-poly">POLY</span>';
  return '';
}

// Registry of all searchable selects for cleanup
const _ssRegistry = new Map();

function createSearchableSelect(container, {
  type = 'racquet', // 'racquet' or 'string'
  placeholder = 'Select...',
  value = '',
  onChange = () => {},
  id = ''
}) {
  // Clean up previous instance if exists
  if (_ssRegistry.has(container)) {
    const old = _ssRegistry.get(container);
    if (old._cleanup) old._cleanup();
  }

  container.innerHTML = '';
  container.classList.add('searchable-select');

  const items = type === 'racquet' ? getSortedRacquets() : getSortedStrings();

  // Build trigger
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ss-trigger';
  if (id) trigger.id = id;

  // Build dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'ss-dropdown';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'ss-search-wrap';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ss-search';
  searchInput.placeholder = type === 'racquet' ? 'Search racquets...' : 'Search strings...';
  searchInput.autocomplete = 'off';
  searchWrap.appendChild(searchInput);
  dropdown.appendChild(searchWrap);

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'ss-options';
  dropdown.appendChild(optionsContainer);

  container.appendChild(trigger);
  container.appendChild(dropdown);

  let selectedValue = value;
  let highlightIndex = -1;
  let flatOptions = []; // all visible option elements for keyboard nav

  function getDisplayText(val) {
    if (!val) return '';
    if (type === 'racquet') {
      const r = RACQUETS.find(x => x.id === val);
      return r ? r.name : '';
    } else {
      const s = STRINGS.find(x => x.id === val);
      return s ? s.name : '';  // gauge is now a separate selector
    }
  }

  function updateTrigger() {
    const text = getDisplayText(selectedValue);
    if (text) {
      trigger.textContent = text;
      trigger.classList.remove('ss-placeholder');
    } else {
      trigger.textContent = placeholder;
      trigger.classList.add('ss-placeholder');
    }
  }

  function renderOptions(filter = '') {
    optionsContainer.innerHTML = '';
    flatOptions = [];
    highlightIndex = -1;
    const q = filter.toLowerCase().trim();

    let lastGroup = '';
    let hasResults = false;

    items.forEach(item => {
      // Build search text
      let searchText, groupKey, primaryText, secondaryText, badgeHTML;

      if (type === 'racquet') {
        searchText = `${item.name} ${item.year || ''} ${item.pattern || ''}`.toLowerCase();
        groupKey = parseRacquetBrand(item.name);
        // Split name: everything before weight suffix becomes primary, weight goes to secondary
        const wtMatch = item.name.match(/^(.+?)\s+(\d+g)$/);
        primaryText = wtMatch ? wtMatch[1] : item.name;
        const wtBadge = wtMatch ? `<span class="ss-opt-badge badge-weight">${wtMatch[2]}</span>` : '';
        secondaryText = `${item.year || ''}`;
        badgeHTML = wtBadge;
      } else {
        searchText = `${item.name} ${item.gauge} ${item.material || ''} ${item.gaugeNum || ''} ${item.shape || ''}`.toLowerCase();
        groupKey = item.name.split(' ')[0];
        primaryText = item.name;
        secondaryText = `${item.shape || item.material || ''}`;
        badgeHTML = getStringMaterialBadge(item.material);
      }

      // Filter
      if (q) {
        const words = q.split(/\s+/);
        const match = words.every(w => searchText.includes(w));
        if (!match) return;
      }

      hasResults = true;

      // Group header
      if (groupKey !== lastGroup) {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'ss-group-label';
        groupLabel.textContent = groupKey;
        optionsContainer.appendChild(groupLabel);
        lastGroup = groupKey;
      }

      // Option
      const opt = document.createElement('div');
      opt.className = 'ss-option';
      if (item.id === selectedValue) opt.classList.add('ss-selected');
      opt.dataset.value = item.id;

      if (type === 'string') {
        // 2-line stacked layout for strings: name on line 1, type+gauge on line 2
        opt.classList.add('ss-option-stacked');
        opt.innerHTML = `
          <span class="ss-opt-primary">${primaryText}</span>
          <span class="ss-opt-meta">${badgeHTML}<span class="ss-opt-secondary">${secondaryText}</span></span>
        `;
      } else {
        // 2-line stacked layout for racquets: model on line 1, weight+year on line 2
        opt.classList.add('ss-option-stacked');
        opt.innerHTML = `
          <span class="ss-opt-primary">${primaryText}</span>
          <span class="ss-opt-meta">${badgeHTML}<span class="ss-opt-secondary">${secondaryText}</span></span>
        `;
      }

      opt.addEventListener('mouseenter', () => {
        flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
        opt.classList.add('ss-highlighted');
        highlightIndex = flatOptions.indexOf(opt);
      });

      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        selectOption(item.id);
      });

      optionsContainer.appendChild(opt);
      flatOptions.push(opt);
    });

    if (!hasResults) {
      const noRes = document.createElement('div');
      noRes.className = 'ss-no-results';
      noRes.textContent = 'No matches found';
      optionsContainer.appendChild(noRes);
    }
  }

  function selectOption(val) {
    selectedValue = val;
    updateTrigger();
    closeDropdown();
    onChange(val);
  }

  function openDropdown() {
    container.classList.add('ss-open');
    searchInput.value = '';
    renderOptions();
    // Slight delay for DOM to settle before focus
    requestAnimationFrame(() => searchInput.focus());
    // Scroll selected into view
    requestAnimationFrame(() => {
      const sel = optionsContainer.querySelector('.ss-selected');
      if (sel) sel.scrollIntoView({ block: 'nearest' });
    });
  }

  function closeDropdown() {
    container.classList.remove('ss-open');
    searchInput.value = '';
    highlightIndex = -1;
  }

  function isOpen() {
    return container.classList.contains('ss-open');
  }

  // Event: trigger click
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen()) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Event: search input
  searchInput.addEventListener('input', () => {
    renderOptions(searchInput.value);
  });

  // Event: keyboard
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatOptions.length === 0) return;
      highlightIndex = Math.min(highlightIndex + 1, flatOptions.length - 1);
      flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
      flatOptions[highlightIndex].classList.add('ss-highlighted');
      flatOptions[highlightIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatOptions.length === 0) return;
      highlightIndex = Math.max(highlightIndex - 1, 0);
      flatOptions.forEach(o => o.classList.remove('ss-highlighted'));
      flatOptions[highlightIndex].classList.add('ss-highlighted');
      flatOptions[highlightIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && flatOptions[highlightIndex]) {
        const val = flatOptions[highlightIndex].dataset.value;
        selectOption(val);
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
      trigger.focus();
    }
  });

  // Close on outside click
  function onDocClick(e) {
    if (!container.contains(e.target)) {
      closeDropdown();
    }
  }
  document.addEventListener('click', onDocClick);

  // Init
  updateTrigger();

  const instance = {
    getValue: () => selectedValue,
    setValue: (val) => {
      selectedValue = val;
      updateTrigger();
    },
    _cleanup: () => {
      document.removeEventListener('click', onDocClick);
    }
  };

  _ssRegistry.set(container, instance);
  return instance;
}

// ============================================
// POPULATE DROPDOWNS (Searchable)
// ============================================

// Store references to searchable select instances
const ssInstances = {};

function populateRacquetDropdown(targetEl) {
  // targetEl was previously a <select>, now it's a container div
  // We replace it with the searchable component
  const wrapper = targetEl;
  const existingValue = '';
  ssInstances[wrapper.id] = createSearchableSelect(wrapper, {
    type: 'racquet',
    placeholder: 'Select Racquet...',
    value: existingValue,
    id: wrapper.id + '-trigger',
    onChange: (val) => {
      const r = RACQUETS.find(x => x.id === val);
      showFrameSpecs(r);
      renderDashboard();
    }
  });
}

function populateStringDropdown(targetEl, initialValue) {
  const wrapper = targetEl;
  ssInstances[wrapper.id] = createSearchableSelect(wrapper, {
    type: 'string',
    placeholder: wrapper.dataset.placeholder || 'Select String...',
    value: initialValue || '',
    id: wrapper.id + '-trigger',
    onChange: (val) => {
      // Update gauge display
      const gaugeEl = wrapper.dataset.gaugeTarget ? document.getElementById(wrapper.dataset.gaugeTarget) : null;
      if (gaugeEl) populateGaugeDropdown(gaugeEl, val);
      renderDashboard();
    }
  });
}

function populateGaugeDropdown(el, stringId) {
  if (!el) return;

  // Handle both old div-based and new select-based gauge elements
  const isSelect = el.tagName === 'SELECT';

  if (!stringId) {
    if (isSelect) {
      el.innerHTML = '<option value="">—</option>';
      el.disabled = true;
    } else {
      el.textContent = '—';
    }
    return;
  }

  const s = STRINGS.find(x => x.id === stringId);
  if (!s) {
    if (isSelect) {
      el.innerHTML = '<option value="">—</option>';
      el.disabled = true;
    } else {
      el.textContent = '—';
    }
    return;
  }

  if (isSelect) {
    const options = getGaugeOptions(s);
    const refGauge = s.gaugeNum;
    el.innerHTML = options.map(g => {
      const isRef = Math.abs(g - refGauge) < 0.005;
      let label = GAUGE_LABELS[g];
      if (!label) {
        // Build label for non-standard gauges
        const gNum = g >= 1.30 ? '16' : g >= 1.25 ? '16L' : g >= 1.20 ? '17' : '18';
        label = `${gNum} (${g.toFixed(2)}mm)`;
      }
      const tag = isRef ? ' •' : '';
      return `<option value="${g}" ${isRef ? 'selected' : ''}>${label}${tag}</option>`;
    }).join('');
    el.disabled = false;
    // Fire change handler to rebuild on gauge change
    el.onchange = () => renderDashboard();
  } else {
    el.textContent = s.gauge;
  }
}

// ============================================
// FRAME SPECS DISPLAY
// ============================================

function showFrameSpecs(racquet) {
  const el = $('#frame-specs');
  if (!racquet) {
    el.classList.add('hidden');
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="frame-spec-item"><span class="frame-spec-label">Weight</span><span class="frame-spec-value">${racquet.strungWeight}g</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">SW</span><span class="frame-spec-value">${racquet.swingweight}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Stiffness</span><span class="frame-spec-value">${racquet.stiffness} RA</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Pattern</span><span class="frame-spec-value">${racquet.pattern}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Head</span><span class="frame-spec-value">${racquet.headSize} sq in</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Balance</span><span class="frame-spec-value">${racquet.balancePts}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Beam</span><span class="frame-spec-value">${racquet.beamWidth.join('/')}</span></div>
    <div class="frame-spec-item"><span class="frame-spec-label">Tension</span><span class="frame-spec-value">${racquet.tensionRange[0]}-${racquet.tensionRange[1]} lbs</span></div>
  `;
}

// ============================================
// MAIN DASHBOARD RENDER
// ============================================

function getCurrentSetup() {
  const racquetId = ssInstances['select-racquet']?.getValue() || '';
  const racquet = RACQUETS.find(r => r.id === racquetId);
  if (!racquet) return null;

  const isHybrid = $('#btn-hybrid').classList.contains('active');

  if (isHybrid) {
    const mainsId = ssInstances['select-string-mains']?.getValue() || '';
    const crossesId = ssInstances['select-string-crosses']?.getValue() || '';
    if (!mainsId || !crossesId) return null;

    // Read gauge selections
    const mainsGaugeEl = document.getElementById('gauge-select-mains');
    const crossesGaugeEl = document.getElementById('gauge-select-crosses');
    const mainsGauge = mainsGaugeEl && mainsGaugeEl.value ? parseFloat(mainsGaugeEl.value) : null;
    const crossesGauge = crossesGaugeEl && crossesGaugeEl.value ? parseFloat(crossesGaugeEl.value) : null;

    // Apply gauge modifiers to string data
    let mainsData = STRINGS.find(s => s.id === mainsId);
    let crossesData = STRINGS.find(s => s.id === crossesId);
    if (mainsData && mainsGauge) mainsData = applyGaugeModifier(mainsData, mainsGauge);
    if (crossesData && crossesGauge) crossesData = applyGaugeModifier(crossesData, crossesGauge);

    return {
      racquet,
      stringConfig: {
        isHybrid: true,
        mains: mainsData,
        crosses: crossesData,
        mainsId, crossesId,
        mainsTension: parseInt($('#input-tension-mains').value) || 55,
        crossesTension: parseInt($('#input-tension-crosses').value) || 53
      }
    };
  } else {
    const stringId = ssInstances['select-string-full']?.getValue() || '';
    if (!stringId) return null;

    // Read gauge selection
    const gaugeEl = document.getElementById('gauge-select-full');
    const selectedGauge = gaugeEl && gaugeEl.value ? parseFloat(gaugeEl.value) : null;

    // Apply gauge modifier to string data
    let stringData = STRINGS.find(s => s.id === stringId);
    if (stringData && selectedGauge) stringData = applyGaugeModifier(stringData, selectedGauge);

    return {
      racquet,
      stringConfig: {
        isHybrid: false,
        string: stringData,
        mainsTension: parseInt($('#input-tension-full-mains').value) || 55,
        crossesTension: parseInt($('#input-tension-full-crosses').value) || 53
      }
    };
  }
}

function renderDashboard() {
  const setup = getCurrentSetup();

  if (!setup) {
    $('#empty-state').classList.remove('hidden');
    $('#dashboard-content').classList.add('hidden');
    return;
  }

  $('#empty-state').classList.add('hidden');
  $('#dashboard-content').classList.remove('hidden');

  const { racquet, stringConfig } = setup;
  const stats = predictSetup(racquet, stringConfig);
  const identity = generateIdentity(stats, racquet, stringConfig);
  const fitProfile = generateFitProfile(stats, racquet, stringConfig);
  const warnings = generateWarnings(racquet, stringConfig, stats);
  const badge = getSetupBadge(racquet, stringConfig);

  // Summary
  renderSummary(racquet, stringConfig, badge);

  // 4-Card Overview Grid
  renderOverviewCards(racquet, stringConfig, stats, identity, fitProfile);

  // Stats
  renderStatBars(stats);
  renderRadarChart(stats);

  // Fit
  renderFitProfile(fitProfile);

  // Warnings
  renderWarnings(warnings);

  // If Tune mode is open, refresh its panels with the updated setup
  refreshTuneIfActive();
}

function renderSummary(racquet, stringConfig, badge) {
  const grid = $('#summary-grid');
  const badgeEl = $('#identity-badge');
  badgeEl.textContent = badge;

  let stringName, stringTension;
  if (stringConfig.isHybrid) {
    stringName = `${stringConfig.mains.name} ${stringConfig.mains.gauge} / ${stringConfig.crosses.name} ${stringConfig.crosses.gauge}`;
    stringTension = `M: ${stringConfig.mainsTension} / X: ${stringConfig.crossesTension} lbs`;
  } else {
    stringName = `${stringConfig.string.name} ${stringConfig.string.gauge}`;
    stringTension = `M: ${stringConfig.mainsTension} / X: ${stringConfig.crossesTension} lbs`;
  }

  grid.innerHTML = `
    <div class="summary-item">
      <span class="summary-label">Frame</span>
      <span class="summary-value">${racquet.name}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Year</span>
      <span class="summary-value">${racquet.year}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Weight / SW</span>
      <span class="summary-value">${racquet.strungWeight}g / ${racquet.swingweight}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Stiffness</span>
      <span class="summary-value">${racquet.stiffness} RA</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Pattern</span>
      <span class="summary-value">${racquet.pattern}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">String</span>
      <span class="summary-value">${stringName}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Tension</span>
      <span class="summary-value">${stringTension}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Setup Type</span>
      <span class="summary-value">${stringConfig.isHybrid ? 'Hybrid' : 'Full Bed'}</span>
    </div>
  `;
}

// ============================================
// OVERVIEW 4-CARD GRID
// ============================================

// Build tension context for OBS sanity penalty
function buildTensionContext(stringConfig, racquet) {
  if (!stringConfig || !racquet) return null;
  const avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  const differential = stringConfig.mainsTension - stringConfig.crossesTension;
  const [, patCrosses] = (racquet.pattern || '16x19').split('x').map(Number);
  return { avgTension, tensionRange: racquet.tensionRange, differential, patternCrosses: patCrosses };
}

// --- Novelty/Anomaly Bonus System ---
// Rewards frames that achieve a rare combination of high performance stats.
// A frame that's unusually high in power+spin+control for its head size band
// gets a ceiling boost — but only if the rare pattern is genuinely high-performing.
//
// This protects frames like PA 98 2026 (high spin+control in a 98, rare for that class)
// from being crushed by forgiveness weighting, while not boosting merely "weird" frames.
function computeNoveltyBonus(stats) {
  const pwr = stats.power;
  const spn = stats.spin;
  const ctl = stats.control;
  const triad = (pwr + spn + ctl) / 3;

  // Determine if any two of the three performance dimensions are notably high
  const highCount = [pwr >= 55, spn >= 68, ctl >= 70].filter(Boolean).length;
  
  // Performance anomaly: at least 2 of 3 dimensions are elevated
  // AND the triad average is well above the database mean (~64)
  if (highCount >= 2 && triad >= 64) {
    // Dual-excellence: frame excels in two+ core areas simultaneously
    // This is the signature of a "rare but coherent" build
    
    // How far above the mean triad (64) is this frame?
    const triadExcess = Math.max(0, triad - 64);
    
    // Bonus scales with triad excess, capped at 5 display points
    // triad 66 → +1.2, triad 68 → +2.4, triad 70 → +3.6, triad 72+ → 5.0
    let bonus = Math.min(triadExcess * 0.6, 5);
    
    // Extra bump if ALL THREE are elevated (extremely rare)
    if (highCount === 3) {
      bonus = Math.min(bonus * 1.4, 6);
    }
    
    // Diminish bonus for frames with very high forgiveness
    // (those are "on-meta" — forgiving spin frames don't need novelty lift)
    if (stats.forgiveness >= 65) {
      bonus *= 0.5;
    } else if (stats.forgiveness >= 60) {
      bonus *= 0.75;
    }
    
    return bonus;
  }

  // Comfort anomaly: exceptional comfort (>= 62) paired with high control (>= 70)
  // Rewards frames like Clash, Gravity that sacrifice power for comfort+control
  if (stats.comfort >= 62 && ctl >= 70 && stats.feel >= 65) {
    const comfortExcess = Math.max(0, stats.comfort - 60);
    return Math.min(comfortExcess * 0.4, 3);
  }

  return 0;
}

function computeCompositeScore(stats, tensionContext) {
  // Full 11-stat weighted composite — every modeled stat contributes.
  // Core performance: control, spin, power, comfort — 52%
  // Feel & playability: feel, playability — 16%
  // Frame dynamics: stability, forgiveness, maneuverability — 22%
  // Trajectory & longevity: launch, durability — 8% (unchanged)
  // Maneuverability shares weight previously held by stability/forgiveness
  // — reflects how swing dynamics shape the entire stringbed interaction
  const raw = stats.control * 0.16
            + stats.spin * 0.13
            + stats.comfort * 0.13
            + stats.power * 0.11
            + stats.feel * 0.10
            + stats.maneuverability * 0.09
            + stats.stability * 0.07
            + stats.forgiveness * 0.07
            + stats.playability * 0.06
            + stats.launch * 0.04
            + stats.durability * 0.04;
  // Rescale: the raw weighted average clusters in a narrow band (~59–67)
  // across all frame×string combos. Map to 0–100 display scale.
  // Slope 8.5 calibrated so:
  //   - gut-vs-poly delta ≈ +15 (was +30 at slope 11)
  //   - poly mean lands in mid-40s to low-50s
  //   - gut on premium frames reaches WTF/Max Aura appropriately
  // Anchor: raw 59 → ~30, raw 62 → ~55, raw 65 → ~80
  let scaled = 22 + (raw - 58) * 8.5;

  // --- Novelty bonus for rare high-performing combos ---
  scaled += computeNoveltyBonus(stats);

  // --- Tension sanity penalty ---
  // If tension is absurdly outside the playable range, the setup is garbage.
  // Penalty scales with how far outside the range the tension is.
  if (tensionContext) {
    const { avgTension, tensionRange } = tensionContext;
    const low = tensionRange[0];
    const high = tensionRange[1];
    const margin = 8; // lbs of grace outside range before penalty kicks in
    
    if (avgTension < low - margin) {
      // Way too loose — unplayable
      const deficit = (low - margin) - avgTension;
      // Exponential penalty: 10 lbs under = -30, 20 under = -60, 30+ = floor
      const penalty = Math.min(deficit * 3, 90);
      scaled -= penalty;
    } else if (avgTension < low) {
      // Slightly below range — mild penalty
      const deficit = low - avgTension;
      scaled -= deficit * 1.5;
    }
    
    if (avgTension > high + margin) {
      // Way too tight — harsh, boardy, arm-destroying
      const excess = avgTension - (high + margin);
      const penalty = Math.min(excess * 2.5, 80);
      scaled -= penalty;
    } else if (avgTension > high) {
      // Slightly above range — mild penalty
      const excess = avgTension - high;
      scaled -= excess * 1.2;
    }

    // --- Mains/Crosses differential penalty (pattern-aware) ---
    if (tensionContext.differential !== undefined) {
      const diff = tensionContext.differential;
      const absDiff = Math.abs(diff);
      const patCrosses = tensionContext.patternCrosses || 19;
      const isDense20 = patCrosses >= 20;
      
      // Threshold where penalty starts depends on pattern
      // Dense 20-cross: higher tolerance for reversed differential
      const fwdThreshold = isDense20 ? 4 : 6;    // mains-tighter threshold
      const revThreshold = isDense20 ? 4 : 4;     // crosses-tighter threshold
      const extremeThreshold = 10;

      if (absDiff > extremeThreshold) {
        // Extreme mismatch in any direction: unplayable, frame damage risk
        scaled -= 12 + (absDiff - extremeThreshold) * 5;
      } else if (diff > fwdThreshold) {
        // Mains too much tighter than crosses
        const excess = diff - fwdThreshold;
        scaled -= excess * (isDense20 ? 4 : 3); // harsher on dense (kills snapback)
      }

      // Reversed differential (crosses tighter) — pattern-dependent
      if (diff < -revThreshold && !isDense20) {
        // On open/standard: crosses tighter is bad
        scaled -= (absDiff - revThreshold) * 3;
      } else if (diff < -(revThreshold + 2) && isDense20) {
        // Even on dense beds, extreme reverse is bad
        scaled -= (absDiff - revThreshold - 2) * 2.5;
      }
    }
  }

  return Math.max(0, Math.min(100, scaled));
}

function getRatingDescriptor(score, identity) {
  const archLower = identity.archetype.toLowerCase();
  if (score >= 85) return `Elite ${archLower} configuration`;
  if (score >= 75) return `Strong ${archLower} configuration`;
  if (score >= 65) return `Solid ${archLower} configuration`;
  if (score >= 55) return `Moderate ${archLower} configuration`;
  return `Developing ${archLower} configuration`;
}

function renderOverviewCards(racquet, stringConfig, stats, identity, fitProfile) {
  renderOCIdentity(identity);
  renderOCRating(stats, identity, buildTensionContext(stringConfig, racquet));
  renderOCFoundation(racquet, stringConfig, stats);
  renderOCSnapshot(fitProfile);
}

function renderOCIdentity(identity) {
  const el = $('#oc-identity');
  // Truncate description to ~2 lines (approx 120 chars)
  const desc = identity.description.length > 130
    ? identity.description.substring(0, 127) + '...'
    : identity.description;

  el.innerHTML = `
    <div class="oc-eyebrow">Setup Identity</div>
    <div class="oc-identity-title">${identity.archetype.toUpperCase()}</div>
    <div class="oc-identity-desc">${desc}</div>
  `;
}

function renderOCRating(stats, identity, tensionCtx) {
  const el = $('#oc-rating');
  const score = computeCompositeScore(stats, tensionCtx);
  const pct = Math.min(score / 100, 1);
  // SVG ring: radius 42, circumference = 2*PI*42 ≈ 263.89
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - pct);
  const descriptor = getRatingDescriptor(score, identity);

  el.innerHTML = `
    <div class="oc-eyebrow">Overall Build Rating</div>
    <div class="oc-rating-ring">
      <svg viewBox="0 0 100 100">
        <circle class="ring-bg" cx="50" cy="50" r="42" />
        <circle class="ring-fill" cx="50" cy="50" r="42"
          stroke-dasharray="${circumference.toFixed(1)}"
          stroke-dashoffset="${dashOffset.toFixed(1)}" />
      </svg>
      <div class="oc-rating-score">${score.toFixed(1)}</div>
    </div>
    <div class="oc-rating-label">Composite Build Score</div>
    <div class="oc-rating-desc">${descriptor}</div>
  `;
}

function renderOCFoundation(racquet, stringConfig, stats) {
  const el = $('#oc-foundation');
  const sep = '<span class="oc-sep">·</span>';

  // Get string data
  let strStiff, strTensionLoss, strSpinPot;
  if (stringConfig.isHybrid) {
    // Average mains/crosses for hybrid
    const m = stringConfig.mains, x = stringConfig.crosses;
    strStiff = Math.round((m.stiffness + x.stiffness) / 2);
    strTensionLoss = ((m.tensionLoss + x.tensionLoss) / 2).toFixed(0);
    strSpinPot = ((m.spinPotential + x.spinPotential) / 2).toFixed(1);
  } else {
    const s = stringConfig.string;
    strStiff = Math.round(s.stiffness);
    strTensionLoss = s.tensionLoss.toFixed(0);
    strSpinPot = s.spinPotential.toFixed(1);
  }

  el.innerHTML = `
    <div class="oc-eyebrow">Data Foundation</div>
    <div class="oc-foundation-group">
      <div class="oc-foundation-group-title">Frame</div>
      <div class="oc-foundation-group-values">${racquet.strungWeight}g ${sep} SW ${racquet.swingweight} ${sep} ${racquet.stiffness} RA ${sep} ${racquet.pattern}</div>
    </div>
    <div class="oc-foundation-group">
      <div class="oc-foundation-group-title">String</div>
      <div class="oc-foundation-group-values">Stiffness ${strStiff} ${sep} T-Loss ${strTensionLoss}% ${sep} Spin ${strSpinPot}</div>
    </div>
    <div class="oc-foundation-group">
      <div class="oc-foundation-group-title">Model</div>
      <div class="oc-foundation-group-values">Power ${stats.power} ${sep} Control ${stats.control} ${sep} Comfort ${stats.comfort}</div>
    </div>
  `;
}

function renderOCSnapshot(fitProfile) {
  const el = $('#oc-snapshot');
  // Take first 2 items from bestFor and first from watchOut
  const bestForText = fitProfile.bestFor.slice(0, 2).join(', ');
  const watchOutText = fitProfile.watchOut[0] || 'No major concerns';
  // Extract sweet spot from tensionRec
  const sweetSpotMatch = fitProfile.tensionRec.match(/sweet spot: ([^)]+)/);
  const sweetSpot = sweetSpotMatch ? sweetSpotMatch[1] : fitProfile.tensionRec;

  el.innerHTML = `
    <div class="oc-eyebrow">Fit Snapshot</div>
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label best-for">Best For</div>
      <div class="oc-snapshot-value">${bestForText}</div>
    </div>
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label watch-out">Watch Out</div>
      <div class="oc-snapshot-value">${watchOutText}</div>
    </div>
    <div class="oc-snapshot-section">
      <div class="oc-snapshot-label sweet-spot">Sweet Spot</div>
      <div class="oc-snapshot-value">${sweetSpot}</div>
    </div>
  `;
}

function renderStatBars(stats) {
  const container = $('#stat-bars');
  container.innerHTML = '';

  STAT_KEYS.forEach((key, i) => {
    const value = stats[key];
    const row = document.createElement('div');
    row.className = `stat-row stat-${STAT_CSS_CLASSES[i]}`;
    row.innerHTML = `
      <span class="stat-label">${STAT_LABELS[i]}</span>
      <div class="stat-bar-track">
        <div class="stat-bar-fill" data-target="${value}"></div>
      </div>
      <span class="stat-value">${value}</span>
    `;
    container.appendChild(row);
  });

  // Animate bars
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('.stat-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    });
  });
}

function renderRadarChart(stats) {
  const ctx = document.getElementById('radar-chart').getContext('2d');

  const data = STAT_KEYS.map(k => stats[k]);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const angleColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const labelColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.44)';
  const accentColor = '#C7F63A';
  const fillColor = isDark ? 'rgba(199, 246, 58, 0.10)' : 'rgba(199, 246, 58, 0.12)';

  if (currentRadarChart) {
    currentRadarChart.data.datasets[0].data = data;
    currentRadarChart.data.datasets[0].borderColor = accentColor;
    currentRadarChart.data.datasets[0].backgroundColor = fillColor;
    currentRadarChart.data.datasets[0].pointBackgroundColor = accentColor;
    currentRadarChart.data.datasets[0].pointBorderColor = 'transparent';
    currentRadarChart.options.scales.r.grid.color = gridColor;
    currentRadarChart.options.scales.r.angleLines.color = angleColor;
    currentRadarChart.options.scales.r.pointLabels.color = labelColor;
    currentRadarChart.update('active');
    return;
  }

  currentRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: STAT_LABELS_FULL,
      datasets: [{
        data,
        backgroundColor: fillColor,
        borderColor: accentColor,
        borderWidth: 1.5,
        pointBackgroundColor: accentColor,
        pointBorderColor: 'transparent',
        pointRadius: 2.5,
        pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 25,
            display: false
          },
          grid: {
            color: gridColor,
            circular: false,
            lineWidth: 0.5
          },
          angleLines: {
            color: angleColor,
            lineWidth: 0.5
          },
          pointLabels: {
            font: {
              family: "'General Sans', sans-serif",
              size: 10,
              weight: 500
            },
            color: labelColor,
            padding: 4
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });
}

function renderFitProfile(fitProfile) {
  const grid = $('#fit-grid');
  grid.innerHTML = `
    <div class="fit-section best-for">
      <h4 class="fit-section-title best-for">Best For:</h4>
      ${fitProfile.bestFor.map(f => `<p class="fit-item">${f}</p>`).join('')}
    </div>
    <div class="fit-section watch-out">
      <h4 class="fit-section-title watch-out">Watch Out:</h4>
      ${fitProfile.watchOut.map(f => `<p class="fit-item">${f}</p>`).join('')}
    </div>
    <div class="fit-section tension-rec">
      <h4 class="fit-section-title tension-rec">Recommended Tension:</h4>
      <p class="fit-item">${fitProfile.tensionRec}</p>
    </div>
  `;
}

function renderWarnings(warnings) {
  const card = $('#warnings-card');
  const list = $('#warnings-list');

  if (warnings.length === 0) {
    card.classList.add('hidden');
    return;
  }

  card.classList.remove('hidden');
  list.innerHTML = warnings.map(w => `
    <div class="warning-item">
      <svg class="warning-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L1 14h14L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <line x1="8" y1="6" x2="8" y2="10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="12" r="0.8" fill="currentColor"/>
      </svg>
      <span>${w}</span>
    </div>
  `).join('');
}

// ============================================
// COMPARISON MODE
// ============================================

function toggleComparisonMode() {
  // Legacy compat — now routes through switchMode
  if (currentMode === 'compare') {
    switchMode('overview');
  } else {
    switchMode('compare');
  }
}

function addComparisonSlotFromHome() {
  if (comparisonSlots.length >= 3) return;
  const setup = getCurrentSetup();
  const slotData = {
    id: Date.now(),
    racquetId: '',
    stringId: '',
    isHybrid: false,
    mainsId: '',
    crossesId: '',
    mainsTension: 55,
    crossesTension: 53,
    stats: null,
    identity: null
  };

  if (setup) {
    slotData.racquetId = setup.racquet.id;
    if (setup.stringConfig.isHybrid) {
      slotData.isHybrid = true;
      slotData.mainsId = setup.stringConfig.mains.id;
      slotData.crossesId = setup.stringConfig.crosses.id;
      slotData.mainsTension = setup.stringConfig.mainsTension;
      slotData.crossesTension = setup.stringConfig.crossesTension;
    } else {
      slotData.isHybrid = false;
      slotData.stringId = setup.stringConfig.string.id;
      slotData.mainsTension = setup.stringConfig.mainsTension;
      slotData.crossesTension = setup.stringConfig.crossesTension;
    }
  }

  comparisonSlots.push(slotData);
  // Recalculate stats for the slot
  recalcSlot(comparisonSlots.length - 1);
}

function addComparisonSlot() {
  if (comparisonSlots.length >= 3) return;

  const slotIndex = comparisonSlots.length;
  const slotColor = SLOT_COLORS[slotIndex];

  const slotData = {
    id: Date.now(),
    racquetId: '',
    stringId: '',
    isHybrid: false,
    mainsId: '',
    crossesId: '',
    mainsTension: 55,
    crossesTension: 53,
    stats: null,
    identity: null
  };

  comparisonSlots.push(slotData);
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  updateComparisonRadar();

  // Auto-open the editor panel so user can configure the new slot
  openCompareEditor(slotIndex);
}

function removeComparisonSlot(index) {
  comparisonSlots.splice(index, 1);
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  updateComparisonRadar();
  renderComparisonDeltas();
}

function renderComparisonSlots() {
  const container = $('#comparison-slots');
  container.innerHTML = '';

  // Update add button visibility
  const addBtn = $('#btn-add-slot');
  addBtn.style.display = comparisonSlots.length >= 3 ? 'none' : '';

  comparisonSlots.forEach((slot, index) => {
    const color = SLOT_COLORS[index];
    const div = document.createElement('div');
    div.className = `comparison-slot slot-color-${color.cssClass}`;
    div.dataset.slotIndex = index;

    const fullbedHTML = `
      <div class="slot-fullbed-config ${slot.isHybrid ? 'hidden' : ''}" data-slot="${index}">
        <div class="slot-ss-string" data-slot="${index}" data-value="${slot.stringId || ''}"></div>
        <div class="row-2col">
          <div>
            <label class="field-label accent-cyan">Mains Tension</label>
            <input type="number" class="text-input slot-mains-tension-fb" data-slot="${index}" value="${slot.mainsTension}" min="30" max="70">
          </div>
          <div>
            <label class="field-label accent-green">Crosses Tension</label>
            <input type="number" class="text-input slot-crosses-tension-fb" data-slot="${index}" value="${slot.crossesTension}" min="30" max="70">
          </div>
        </div>
        ${slot.stats && !slot.isHybrid ? `<div class="slot-identity" style="text-align:center; padding-top:4px;">${slot.identity?.archetype || '—'}</div>` : ''}
      </div>`;

    const hybridHTML = `
      <div class="slot-hybrid-config ${slot.isHybrid ? '' : 'hidden'}" data-slot="${index}">
        <div class="slot-hybrid-section">
          <label class="field-label accent-cyan">Mains</label>
          <div class="slot-ss-mains" data-slot="${index}" data-value="${slot.mainsId || ''}"></div>
          <div>
            <label class="field-label">Tension</label>
            <input type="number" class="text-input slot-mains-tension" data-slot="${index}" value="${slot.mainsTension}" min="30" max="70">
          </div>
        </div>
        <div class="slot-hybrid-section">
          <label class="field-label accent-green">Crosses</label>
          <div class="slot-ss-crosses" data-slot="${index}" data-value="${slot.crossesId || ''}"></div>
          <div>
            <label class="field-label">Tension</label>
            <input type="number" class="text-input slot-crosses-tension" data-slot="${index}" value="${slot.crossesTension}" min="30" max="70">
          </div>
        </div>
        ${slot.stats && slot.isHybrid ? `<div class="slot-identity" style="text-align:center; padding-top:4px;">${slot.identity?.archetype || '—'}</div>` : ''}
      </div>`;

    div.innerHTML = `
      <div class="slot-header">
        <span class="slot-label slot-label-${color.cssClass}">SETUP ${color.label}</span>
        <button class="slot-remove" onclick="removeComparisonSlot(${index})" title="Remove">✕</button>
      </div>
      <div class="slot-config">
        <div class="slot-ss-racquet" data-slot="${index}" data-value="${slot.racquetId || ''}"></div>
        <div class="slot-toggle-group">
          <button class="slot-toggle-btn ${slot.isHybrid ? '' : 'active'}" data-slot="${index}" data-mode="full">Full Bed</button>
          <button class="slot-toggle-btn ${slot.isHybrid ? 'active' : ''}" data-slot="${index}" data-mode="hybrid">Hybrid</button>
        </div>
        ${fullbedHTML}
        ${hybridHTML}
      </div>
      ${slot.stats ? renderSlotStats(slot.stats, index) + `<button class="slot-tune-btn" onclick="openTuneForSlot(${index})" title="Open Tune for Setup ${SLOT_COLORS[index].label}"><svg width="14" height="14" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.5"/><circle cx="9" cy="9" r="2" fill="currentColor"/></svg> Tune</button>` : '<div style="padding:8px;text-align:center;color:var(--text-muted);font-size:0.8rem;">Configure to see stats</div>'}
    `;

    container.appendChild(div);
  });

  // Initialize searchable selects for each slot
  container.querySelectorAll('.slot-ss-racquet').forEach(el => {
    const idx = parseInt(el.dataset.slot);
    createSearchableSelect(el, {
      type: 'racquet',
      placeholder: 'Select Racquet...',
      value: el.dataset.value || '',
      onChange: (val) => {
        comparisonSlots[idx].racquetId = val;
        recalcSlot(idx);
      }
    });
  });

  container.querySelectorAll('.slot-ss-string').forEach(el => {
    const idx = parseInt(el.dataset.slot);
    createSearchableSelect(el, {
      type: 'string',
      placeholder: 'Select String...',
      value: el.dataset.value || '',
      onChange: (val) => {
        comparisonSlots[idx].stringId = val;
        recalcSlot(idx);
      }
    });
  });
  container.querySelectorAll('.slot-mains-tension-fb').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].mainsTension = parseInt(e.target.value) || 55;
      recalcSlot(idx);
    });
  });
  container.querySelectorAll('.slot-crosses-tension-fb').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].crossesTension = parseInt(e.target.value) || 53;
      recalcSlot(idx);
    });
  });

  // Hybrid mains + crosses (searchable)
  container.querySelectorAll('.slot-ss-mains').forEach(el => {
    const idx = parseInt(el.dataset.slot);
    createSearchableSelect(el, {
      type: 'string',
      placeholder: 'Select Main String...',
      value: el.dataset.value || '',
      onChange: (val) => {
        comparisonSlots[idx].mainsId = val;
        recalcSlot(idx);
      }
    });
  });
  container.querySelectorAll('.slot-ss-crosses').forEach(el => {
    const idx = parseInt(el.dataset.slot);
    createSearchableSelect(el, {
      type: 'string',
      placeholder: 'Select Cross String...',
      value: el.dataset.value || '',
      onChange: (val) => {
        comparisonSlots[idx].crossesId = val;
        recalcSlot(idx);
      }
    });
  });
  container.querySelectorAll('.slot-mains-tension').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].mainsTension = parseInt(e.target.value) || 55;
      recalcSlot(idx);
    });
  });
  container.querySelectorAll('.slot-crosses-tension').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].crossesTension = parseInt(e.target.value) || 53;
      recalcSlot(idx);
    });
  });

  // Full Bed / Hybrid toggle
  container.querySelectorAll('.slot-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      const mode = e.target.dataset.mode;
      const slot = comparisonSlots[idx];
      slot.isHybrid = (mode === 'hybrid');
      recalcSlot(idx);
    });
  });
}

function renderSlotStats(stats, slotIndex) {
  return `
    <div class="slot-stats">
      ${STAT_KEYS.map((key, i) => `
        <div class="slot-stat">
          <span class="slot-stat-label">${STAT_LABELS[i]}</span>
          <div class="slot-stat-bar">
            <div class="slot-stat-fill" style="width:${stats[key]}%;"></div>
          </div>
          <span class="slot-stat-value">${stats[key]}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function recalcSlot(index) {
  const slot = comparisonSlots[index];
  const racquet = RACQUETS.find(r => r.id === slot.racquetId);

  let stringConfig = null;

  if (slot.isHybrid) {
    const mainsData = STRINGS.find(s => s.id === slot.mainsId);
    const crossesData = STRINGS.find(s => s.id === slot.crossesId);
    if (racquet && mainsData && crossesData) {
      stringConfig = {
        isHybrid: true,
        mains: mainsData,
        crosses: crossesData,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension
      };
    }
  } else {
    const stringData = STRINGS.find(s => s.id === slot.stringId);
    if (racquet && stringData) {
      stringConfig = {
        isHybrid: false,
        string: stringData,
        mainsTension: slot.mainsTension,
        crossesTension: slot.crossesTension
      };
    }
  }

  if (racquet && stringConfig) {
    slot.stats = predictSetup(racquet, stringConfig);
    slot.identity = generateIdentity(slot.stats, racquet, stringConfig);
  } else {
    slot.stats = null;
    slot.identity = null;
  }

  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  updateComparisonRadar();
  renderComparisonDeltas();
}

function updateComparisonRadar() {
  const ctx = document.getElementById('comparison-radar-chart').getContext('2d');
  const datasets = [];
  const colors = getSlotColors();

  const pointStyles = ['circle', 'rectRot', 'triangle'];

  comparisonSlots.forEach((slot, i) => {
    if (!slot.stats) return;
    const color = colors[i];
    datasets.push({
      label: `Setup ${color.label}`,
      data: STAT_KEYS.map(k => slot.stats[k]),
      backgroundColor: color.bgFaint,
      borderColor: color.border,
      borderWidth: 1.8,
      borderDash: color.borderDash,
      pointBackgroundColor: color.border,
      pointBorderColor: 'transparent',
      pointStyle: pointStyles[i] || 'circle',
      pointRadius: 3,
      pointHoverRadius: 5
    });
  });

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const angleColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const labelColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.36)';
  const legendColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)';

  if (comparisonRadarChart) {
    comparisonRadarChart.data.datasets = datasets;
    comparisonRadarChart.options.scales.r.grid.color = gridColor;
    comparisonRadarChart.options.scales.r.angleLines.color = angleColor;
    comparisonRadarChart.options.scales.r.pointLabels.color = labelColor;
    comparisonRadarChart.options.plugins.legend.labels.color = legendColor;
    comparisonRadarChart.update('active');
    return;
  }

  comparisonRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: STAT_LABELS_FULL,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
            color: legendColor,
            usePointStyle: true,
            padding: 16
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25, display: false },
          grid: { color: gridColor, circular: false, lineWidth: 0.5 },
          angleLines: { color: angleColor, lineWidth: 0.5 },
          pointLabels: {
            font: { family: "'General Sans', sans-serif", size: 10, weight: 500 },
            color: labelColor
          }
        }
      },
      animation: { duration: 600, easing: 'easeOutQuart' }
    }
  });
}

function renderComparisonDeltas() {
  const container = $('#comparison-deltas');
  const validSlots = comparisonSlots.filter(s => s.stats);
  if (validSlots.length < 2) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  for (let i = 1; i < validSlots.length; i++) {
    const base = validSlots[0];
    const comp = validSlots[i];
    const baseColor = SLOT_COLORS[comparisonSlots.indexOf(base)];
    const compColor = SLOT_COLORS[comparisonSlots.indexOf(comp)];

    html += `<div class="delta-group">
      <div class="delta-title">Setup ${compColor.label} vs Setup ${baseColor.label}</div>
      ${STAT_KEYS.map((key, j) => {
        const diff = comp.stats[key] - base.stats[key];
        const cls = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
        const sign = diff > 0 ? '+' : '';
        return `<div class="delta-item">
          <span class="delta-label">${STAT_LABELS[j]}</span>
          <span class="delta-value ${cls}">${sign}${diff}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  container.innerHTML = html;
}

// ============================================
// COMPARE REDESIGN — Summary Cards, Verdict, Matrix
// ============================================

function renderCompareSummaries() {
  const container = $('#compare-summaries');
  const emptyState = $('#compare-empty-state');
  const validSlots = comparisonSlots.filter(s => s.stats);

  if (comparisonSlots.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = '';
    // Hide analysis layers
    $('#compare-verdict').style.display = 'none';
    $('#compare-matrix').style.display = 'none';
    $('#compare-proof').style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';

  // Hide analysis if fewer than 2 valid slots
  if (validSlots.length < 2) {
    $('#compare-verdict').style.display = 'none';
    $('#compare-matrix').style.display = 'none';
    $('#compare-proof').style.display = 'none';
  }

  let html = '';
  comparisonSlots.forEach((slot, index) => {
    // Render unconfigured slots with a placeholder card
    if (!slot.stats) {
      const color = SLOT_COLORS[index];
      html += `
        <div class="compare-summary-card slot-color-${color.cssClass}" style="opacity:0.7;">
          <div class="compare-summary-top">
            <div class="compare-summary-identity">
              <span class="compare-summary-label slot-label-${color.cssClass}">SETUP ${color.label}</span>
              <div class="compare-summary-archetype" style="font-size:0.85rem; opacity:0.6;">NOT CONFIGURED</div>
              <div class="compare-summary-descriptor">Select frame and string to begin</div>
            </div>
          </div>
          <div class="compare-summary-actions">
            <button class="compare-action-btn" onclick="openCompareEditor(${index})">
              <svg viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Configure
            </button>
            <button class="compare-action-btn" onclick="removeComparisonSlot(${index})">
              <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              Remove
            </button>
          </div>
        </div>
      `;
      return;
    }
    const color = SLOT_COLORS[index];
    const racquet = RACQUETS.find(r => r.id === slot.racquetId);
    const slotTensionCtx = racquet ? { avgTension: (slot.mainsTension + slot.crossesTension) / 2, tensionRange: racquet.tensionRange } : null;
    const obsScore = computeCompositeScore(slot.stats, slotTensionCtx).toFixed(1);
    const pct = Math.min(100, Math.max(0, obsScore));
    const circumference = 2 * Math.PI * 26;
    const dashOffset = circumference * (1 - pct / 100);
    const archetype = slot.identity?.archetype || 'Balanced Setup';

    // Build setup meta string
    let metaHTML = '';
    if (racquet) metaHTML += `<span><strong>${racquet.name}</strong></span>`;
    if (slot.isHybrid) {
      const m = STRINGS.find(s => s.id === slot.mainsId);
      const x = STRINGS.find(s => s.id === slot.crossesId);
      if (m && x) metaHTML += `<span>${m.name} / ${x.name}</span>`;
      metaHTML += `<span>M:${slot.mainsTension} / X:${slot.crossesTension} lbs</span>`;
    } else {
      const str = STRINGS.find(s => s.id === slot.stringId);
      if (str) metaHTML += `<span>${str.name} ${str.gauge}</span>`;
      metaHTML += `<span>M:${slot.mainsTension} / X:${slot.crossesTension} lbs</span>`;
    }

    // Short 1-line descriptor
    const descriptor = getRatingDescriptor(parseFloat(obsScore), slot.identity || { archetype: 'Balanced Setup' });

    html += `
      <div class="compare-summary-card slot-color-${color.cssClass}">
        <div class="compare-summary-top">
          <div class="compare-summary-identity">
            <span class="compare-summary-label slot-label-${color.cssClass}">SETUP ${color.label}</span>
            <div class="compare-summary-archetype">${archetype.toUpperCase()}</div>
            <div class="compare-summary-descriptor">${descriptor}</div>
          </div>
          <div class="compare-summary-score">
            <div class="compare-summary-score-ring">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" stroke="var(--border-subtle)" stroke-width="3" fill="none" />
                <circle cx="32" cy="32" r="26" stroke="${color.border}" stroke-width="3" fill="none"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
                  stroke-linecap="round" transform="rotate(-90 32 32)" />
              </svg>
              <span class="compare-summary-score-value">${obsScore}</span>
            </div>
            <span class="compare-summary-score-label">OBS</span>
          </div>
        </div>
        <div class="compare-summary-meta">${metaHTML}</div>
        <div class="compare-summary-actions">
          <button class="compare-action-btn" onclick="openCompareEditor(${index})">
            <svg viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Edit
          </button>
          <button class="compare-action-btn" onclick="openTuneForSlot(${index})">
            <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>
            Tune
          </button>
          <button class="compare-action-btn" onclick="removeComparisonSlot(${index})">
            <svg viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            Remove
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function openCompareEditor(slotIndex) {
  const editors = $('#compare-editors');
  editors.style.display = '';
  // Scroll to it
  editors.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeCompareEditors() {
  $('#compare-editors').style.display = 'none';
}

function generateCompareVerdict(slotA, slotB) {
  const a = slotA.stats;
  const b = slotB.stats;
  const idA = slotA.identity?.archetype || 'Balanced Setup';
  const idB = slotB.identity?.archetype || 'Balanced Setup';
  const colorA = SLOT_COLORS[comparisonSlots.indexOf(slotA)];
  const colorB = SLOT_COLORS[comparisonSlots.indexOf(slotB)];

  // Compute category wins
  const categories = [
    { label: 'Spin', key: 'spin' },
    { label: 'Power', key: 'power' },
    { label: 'Control', key: 'control' },
    { label: 'Comfort', key: 'comfort' },
    { label: 'Feel', key: 'feel' },
    { label: 'Launch', key: 'launch' },
    { label: 'Stability', key: 'stability' },
    { label: 'Forgiveness', key: 'forgiveness' },
    { label: 'Durability', key: 'durability' },
    { label: 'Playability', key: 'playability' }
  ];

  const winsA = [];
  const winsB = [];
  let biggestDiffKey = '';
  let biggestDiff = 0;

  categories.forEach(cat => {
    const diff = a[cat.key] - b[cat.key];
    if (diff > 2) winsA.push(cat.label);
    else if (diff < -2) winsB.push(cat.label);
    if (Math.abs(diff) > biggestDiff) {
      biggestDiff = Math.abs(diff);
      biggestDiffKey = cat.label;
    }
  });

  // Build the main tradeoff sentence
  const scoreA = computeCompositeScore(a).toFixed(1);
  const scoreB = computeCompositeScore(b).toFixed(1);
  const scoreDiff = Math.abs(scoreA - scoreB).toFixed(1);

  let tradeoff = '';
  if (winsA.length > 0 && winsB.length > 0) {
    tradeoff = `Setup ${colorA.label} trades ${winsB.slice(0, 2).join(' and ').toLowerCase()} for stronger ${winsA.slice(0, 2).join(' and ').toLowerCase()}. The biggest gap is in ${biggestDiffKey} (${biggestDiff} pts).`;
  } else if (winsA.length > 0) {
    tradeoff = `Setup ${colorA.label} leads across most categories, especially in ${biggestDiffKey} (+${biggestDiff}). Setup ${colorB.label} doesn't strongly outperform in any area.`;
  } else if (winsB.length > 0) {
    tradeoff = `Setup ${colorB.label} leads across most categories, especially in ${biggestDiffKey} (+${biggestDiff}). Setup ${colorA.label} doesn't strongly outperform in any area.`;
  } else {
    tradeoff = `Both setups perform similarly across all categories. The biggest difference is in ${biggestDiffKey} (${biggestDiff} pts) — a marginal gap.`;
  }

  // Pick A if / Pick B if
  function buildPickReason(stats, identity) {
    const traits = [];
    if (stats.spin >= 70) traits.push('rely on heavy topspin');
    if (stats.power >= 65) traits.push('want to dictate with pace');
    if (stats.control >= 72) traits.push('value placement and accuracy');
    if (stats.comfort >= 70) traits.push('have arm sensitivity');
    if (stats.feel >= 72) traits.push('play a lot at the net');
    if (stats.durability >= 78) traits.push('break strings frequently');
    if (stats.stability >= 68) traits.push('need stability on off-center hits');
    if (traits.length === 0) traits.push('want a versatile all-court setup');
    return traits.slice(0, 3);
  }

  const pickA = buildPickReason(a, slotA.identity);
  const pickB = buildPickReason(b, slotB.identity);

  return { tradeoff, winsA, winsB, pickA, pickB, colorA, colorB, idA, idB };
}

function renderCompareVerdict() {
  const container = $('#compare-verdict');
  const validSlots = comparisonSlots.filter(s => s.stats);

  if (validSlots.length < 2) {
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  const slotA = validSlots[0];
  const slotB = validSlots[1];
  const v = generateCompareVerdict(slotA, slotB);

  container.innerHTML = `
    <div class="verdict-header">
      <h3>COMPARE VERDICT</h3>
    </div>
    <div class="verdict-tradeoff">${v.tradeoff}</div>
    <div class="verdict-columns">
      <div class="verdict-col">
        <span class="verdict-col-header slot-label-${v.colorA.cssClass}">SETUP ${v.colorA.label} WINS</span>
        <div class="verdict-wins">
          ${v.winsA.length > 0 ? v.winsA.map(w => `<span class="verdict-win-tag">${w}</span>`).join('') : '<span class="verdict-win-tag" style="opacity:0.5;">No clear wins</span>'}
        </div>
        <div class="verdict-pick"><strong>Pick ${v.colorA.label} if you</strong> ${v.pickA.join(', ')}</div>
      </div>
      <div class="verdict-col">
        <span class="verdict-col-header slot-label-${v.colorB.cssClass}">SETUP ${v.colorB.label} WINS</span>
        <div class="verdict-wins">
          ${v.winsB.length > 0 ? v.winsB.map(w => `<span class="verdict-win-tag">${w}</span>`).join('') : '<span class="verdict-win-tag" style="opacity:0.5;">No clear wins</span>'}
        </div>
        <div class="verdict-pick"><strong>Pick ${v.colorB.label} if you</strong> ${v.pickB.join(', ')}</div>
      </div>
    </div>
  `;
}

function renderCompareMatrix() {
  const container = $('#compare-matrix');
  const proof = $('#compare-proof');
  const validSlots = comparisonSlots.filter(s => s.stats);

  if (validSlots.length < 2) {
    container.style.display = 'none';
    proof.style.display = 'none';
    return;
  }

  container.style.display = '';
  proof.style.display = '';

  const a = validSlots[0];
  const b = validSlots[1];
  const colorA = SLOT_COLORS[comparisonSlots.indexOf(a)];
  const colorB = SLOT_COLORS[comparisonSlots.indexOf(b)];

  const groups = [
    { title: 'PERFORMANCE', keys: ['spin', 'power', 'control', 'launch'] },
    { title: 'FEEL & COMFORT', keys: ['comfort', 'feel', 'stability', 'forgiveness'] },
    { title: 'FRAME DYNAMICS', keys: ['maneuverability'] },
    { title: 'LONGEVITY', keys: ['durability', 'playability'] }
  ];

  const keyToLabel = {};
  STAT_KEYS.forEach((k, i) => keyToLabel[k] = STAT_LABELS[i]);

  let html = `
    <div class="matrix-header">
      <h3>STAT-BY-STAT</h3>
      <div style="display:flex;gap:12px;font-size:0.68rem;font-weight:600;letter-spacing:0.06em;">
        <span style="color:${colorA.border};">● SETUP ${colorA.label}</span>
        <span style="color:${colorB.border};">● SETUP ${colorB.label}</span>
      </div>
    </div>
  `;

  groups.forEach(group => {
    html += `<div class="matrix-group">
      <div class="matrix-group-title">${group.title}</div>`;

    group.keys.forEach(key => {
      const valA = a.stats[key];
      const valB = b.stats[key];
      const diff = valA - valB;
      const absDiff = Math.abs(diff);
      const cls = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
      const sign = diff > 0 ? '+' : '';
      const winner = diff > 2 ? colorA.border : diff < -2 ? colorB.border : 'var(--text-muted)';

      html += `
        <div class="matrix-row">
          <span class="matrix-stat-label">${keyToLabel[key] || key}</span>
          <div class="matrix-bar-cell">
            <div class="matrix-bar-a" style="width:${valA}%;background:${colorA.border};opacity:0.5;border-radius:3px;"></div>
            <div class="matrix-bar-b" style="width:${valB}%;background:${colorB.border};opacity:0.35;border-radius:3px;top:0;"></div>
          </div>
          <span class="matrix-val" style="color:${colorA.border};">${valA}</span>
          <span class="matrix-val" style="color:${colorB.border};">${valB}</span>
          <span class="matrix-delta ${cls}"><span class="matrix-winner-dot" style="background:${winner};"></span>${sign}${diff}</span>
        </div>
      `;
    });

    html += `</div>`;
  });

  container.innerHTML = html;
}

// ============================================
// PRESETS (dynamic system — see renderHomePresets / renderComparisonPresets)
// ============================================

function setHybridMode(isHybrid) {
  if (isHybrid) {
    $('#btn-full').classList.remove('active');
    $('#btn-hybrid').classList.add('active');
    $('#full-bed-config').classList.add('hidden');
    $('#hybrid-config').classList.remove('hidden');
  } else {
    $('#btn-full').classList.add('active');
    $('#btn-hybrid').classList.remove('active');
    $('#full-bed-config').classList.remove('hidden');
    $('#hybrid-config').classList.add('hidden');
  }
}

// ============================================
// TUNE MODE — TENSION TUNING LAB
// ============================================

let isTuneMode = false;
let _tuneRefreshing = false;
let sweepChart = null;
let tuneState = {
  baselineTension: 55,       // The tension from the main page (source of truth)
  exploredTension: 55,       // The slider's current position
  hybridDimension: 'linked', // 'mains', 'crosses', or 'linked'
  sweepData: null,           // cached sweep results
  baselineStats: null,       // stats at baseline tension
  optimalWindow: null        // { low, high, anchor, reason }
};

function toggleTuneMode() {
  // Legacy compat — now routes through switchMode
  if (currentMode === 'tune') {
    switchMode('overview');
  } else {
    const setup = getCurrentSetup();
    if (!setup) return; // No setup configured — don't open
    switchMode('tune');
  }
}

function closeTuneMode() {
  // Legacy compat — now routes through switchMode
  switchMode('overview');
}

// dockBuilderPanel is no longer needed — builder stays permanently in build-dock
// Kept as no-op for any lingering calls
function dockBuilderPanel(inTune) {
  // No-op: builder panel is now permanently in the left build-dock
}

// Auto-refresh Tune panels when user changes setup while Tune is open
function refreshTuneIfActive() {
  if (currentMode !== 'tune' || _tuneRefreshing) return;
  _tuneRefreshing = true;
  try {
    const setup = getCurrentSetup();
    if (setup) {
      initTuneMode(setup);
    } else {
      // Setup became invalid — show empty state
      $('#tune-empty').classList.remove('hidden');
      $('#tune-panels').classList.add('hidden');
    }
  } finally {
    _tuneRefreshing = false;
  }
}

function getHybridBaselineTension(stringConfig, dimension) {
  if (dimension === 'mains') return stringConfig.mainsTension;
  if (dimension === 'crosses') return stringConfig.crossesTension;
  // linked: average
  return Math.round((stringConfig.mainsTension + stringConfig.crossesTension) / 2);
}

function updateSliderLabel() {
  const val = tuneState.exploredTension;
  const dim = tuneState.hybridDimension;
  const setup = getCurrentSetup();
  const isHybrid = setup && setup.stringConfig.isHybrid;
  const labelEl = document.querySelector('.slider-current-label');
  const valueEl = $('#slider-current-value');

  const hasSplitTensions = setup && (setup.stringConfig.mainsTension !== undefined && setup.stringConfig.crossesTension !== undefined);
  if (hasSplitTensions && dim === 'mains') {
    labelEl.textContent = 'Exploring Mains';
    valueEl.textContent = `${val} lbs`;
  } else if (hasSplitTensions && dim === 'crosses') {
    labelEl.textContent = 'Exploring Crosses';
    valueEl.textContent = `${val} lbs`;
  } else if (hasSplitTensions && dim === 'linked') {
    const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
    const mainsVal = val;
    const crossesVal = val - diff;
    labelEl.textContent = 'Exploring Linked';
    valueEl.textContent = `M ${mainsVal} / X ${crossesVal} lbs`;
  } else {
    labelEl.textContent = 'Exploring';
    valueEl.textContent = `${val} lbs`;
  }
}

function updateDeltaTitle(stringConfig) {
  const titleEl = $('#tune-card-delta .tune-card-title');
  if (!titleEl) return;
  const dim = tuneState.hybridDimension;
  const hasSplitTensions = stringConfig && (stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined);
  if (hasSplitTensions) {
    if (dim === 'mains') {
      titleEl.textContent = 'DELTA VS BASELINE — MAINS ONLY';
    } else if (dim === 'crosses') {
      titleEl.textContent = 'DELTA VS BASELINE — CROSSES ONLY';
    } else {
      titleEl.textContent = 'DELTA VS BASELINE — LINKED';
    }
  } else {
    titleEl.textContent = 'DELTA VS BASELINE';
  }
}

function initTuneMode(setup) {
  const { racquet, stringConfig } = setup;

  // Set subtitle
  let subtitle = racquet.name;
  if (stringConfig.isHybrid) {
    subtitle += ` — ${stringConfig.mains.name} / ${stringConfig.crosses.name}`;
  } else {
    subtitle += ` — ${stringConfig.string.name}`;
  }
  $('#tune-subtitle').textContent = subtitle;

  // Show/hide panels
  $('#tune-empty').classList.add('hidden');
  $('#tune-panels').classList.remove('hidden');

  // Set baseline tension from main page, respecting hybrid dimension
  if (stringConfig.isHybrid) {
    // Preserve dimension if already set, default to linked
    if (!['mains','crosses','linked'].includes(tuneState.hybridDimension)) {
      tuneState.hybridDimension = 'linked';
    }
    tuneState.baselineTension = getHybridBaselineTension(stringConfig, tuneState.hybridDimension);
  } else {
    // Full Bed now has independent tensions — treat like hybrid for tune purposes
    if (!['mains','crosses','linked'].includes(tuneState.hybridDimension)) {
      tuneState.hybridDimension = 'linked';
    }
    tuneState.baselineTension = getHybridBaselineTension(stringConfig, tuneState.hybridDimension);
  }
  tuneState.exploredTension = tuneState.baselineTension;

  // Configure slider range from racquet
  const sliderMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const sliderMax = Math.min(racquet.tensionRange[1] + 5, 75);
  const slider = $('#tune-slider');
  slider.min = sliderMin;
  slider.max = sliderMax;
  slider.value = tuneState.baselineTension;
  $('#slider-label-min').textContent = sliderMin;
  $('#slider-label-max').textContent = sliderMax;
  updateSliderLabel();
  updateDeltaTitle(stringConfig);

  // Hybrid toggle
  renderTuneHybridToggle(stringConfig);

  // Run full sweep
  runTensionSweep(setup);

  // Calculate optimal window
  calculateOptimalWindow(setup);

  // Render all modules
  renderOptimalBuildWindow();
  renderDeltaVsBaseline();
  renderGaugeExplorer(setup);
  renderBaselineMarker(sliderMin, sliderMax);
  renderOptimalZone(sliderMin, sliderMax);
  renderSweepChart(setup);
  renderBestValueMove();
  renderOverallBuildScore(setup);
  renderRecommendedBuilds(setup);
}

function runTensionSweep(setup) {
  const { racquet, stringConfig } = setup;
  const sweepMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const sweepMax = Math.min(racquet.tensionRange[1] + 5, 75);
  const results = [];

  for (let t = sweepMin; t <= sweepMax; t++) {
    let modifiedConfig;
    if (stringConfig.isHybrid) {
      const diff = stringConfig.mainsTension - stringConfig.crossesTension;
      if (tuneState.hybridDimension === 'mains') {
        modifiedConfig = { ...stringConfig, mainsTension: t };
      } else if (tuneState.hybridDimension === 'crosses') {
        modifiedConfig = { ...stringConfig, crossesTension: t };
      } else {
        // Linked: maintain the differential
        modifiedConfig = { ...stringConfig, mainsTension: t, crossesTension: t - diff };
      }
    } else {
      // Full Bed: independent tensions, same dimension logic as hybrid
      const diff = stringConfig.mainsTension - stringConfig.crossesTension;
      if (tuneState.hybridDimension === 'mains') {
        modifiedConfig = { ...stringConfig, mainsTension: t };
      } else if (tuneState.hybridDimension === 'crosses') {
        modifiedConfig = { ...stringConfig, crossesTension: t };
      } else {
        // Linked: maintain the differential
        modifiedConfig = { ...stringConfig, mainsTension: t, crossesTension: t - diff };
      }
    }
    const stats = predictSetup(racquet, modifiedConfig);
    results.push({ tension: t, stats });
  }

  tuneState.sweepData = results;

  // Also cache baseline stats
  tuneState.baselineStats = results.find(r => r.tension === tuneState.baselineTension)?.stats
    || predictSetup(racquet, stringConfig);
}

function calculateOptimalWindow(setup) {
  const { racquet } = setup;
  const data = tuneState.sweepData;
  if (!data || data.length === 0) return;

  // Score each tension using the full 10-stat composite + tension sanity penalty
  const scored = data.map(d => {
    const s = d.stats;
    // d.tension is the explored value; compute differential from the sweep's modifiedConfig
    // In linked mode both move together; in mains/crosses mode only one moves
    const tCtx = { avgTension: d.tension, tensionRange: racquet.tensionRange, differential: 0 };
    const score = computeCompositeScore(s, tCtx);
    return { tension: d.tension, score, stats: s };
  });

  // Find peak
  scored.sort((a, b) => b.score - a.score);
  const anchor = scored[0].tension;
  const peakScore = scored[0].score;

  // Window = all tensions within 2% of peak score
  const threshold = peakScore * 0.98;
  const inWindow = scored.filter(s => s.score >= threshold).map(s => s.tension);
  const low = Math.min(...inWindow);
  const high = Math.max(...inWindow);

  // Reason
  const anchorStats = scored[0].stats;
  let reason = 'Balanced performance';
  if (anchorStats.control >= 80) reason = 'Control Anchor — precision peaks here';
  else if (anchorStats.comfort >= 75) reason = 'Comfort Anchor — arm-friendly sweet spot';
  else if (anchorStats.spin >= 78) reason = 'Spin Anchor — maximum rotation';
  else reason = 'Balanced Anchor — best all-round performance';

  tuneState.optimalWindow = { low, high, anchor, reason };
}

function renderOptimalBuildWindow() {
  const container = $('#optimal-content');
  const w = tuneState.optimalWindow;
  if (!w) {
    container.innerHTML = '<p class="tune-muted">No data</p>';
    return;
  }

  const anchorStats = tuneState.sweepData.find(d => d.tension === w.anchor)?.stats;
  if (!anchorStats) return;

  container.innerHTML = `
    <div class="optimal-range">
      <div class="optimal-range-visual">
        <span class="optimal-range-low">${w.low}</span>
        <div class="optimal-range-bar">
          <div class="optimal-range-fill"></div>
          <div class="optimal-range-anchor" style="left:${w.high > w.low ? ((w.anchor - w.low) / (w.high - w.low)) * 100 : 50}%">
            <span class="optimal-anchor-label">${w.anchor} lbs</span>
          </div>
        </div>
        <span class="optimal-range-high">${w.high}</span>
      </div>
      <p class="optimal-reason">${w.reason}</p>
    </div>
    <div class="optimal-stats-grid">
      <div class="optimal-stat">
        <span class="optimal-stat-label">Control</span>
        <span class="optimal-stat-value">${anchorStats.control}</span>
      </div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Comfort</span>
        <span class="optimal-stat-value">${anchorStats.comfort}</span>
      </div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Spin</span>
        <span class="optimal-stat-value">${anchorStats.spin}</span>
      </div>
      <div class="optimal-stat">
        <span class="optimal-stat-label">Power</span>
        <span class="optimal-stat-value">${anchorStats.power}</span>
      </div>
    </div>
  `;
}

function renderDeltaVsBaseline() {
  const container = $('#delta-content');
  const data = tuneState.sweepData;
  if (!data) return;

  const baselineEntry = data.find(d => d.tension === tuneState.baselineTension);
  const exploredEntry = data.find(d => d.tension === tuneState.exploredTension);
  if (!baselineEntry || !exploredEntry) return;

  const base = baselineEntry.stats;
  const explored = exploredEntry.stats;
  const deltaKeys = ['control', 'power', 'comfort', 'spin', 'launch', 'feel', 'playability'];
  const deltaLabels = ['Control', 'Power', 'Comfort', 'Spin', 'Launch', 'Feel', 'Playability'];

  const isAtBaseline = tuneState.exploredTension === tuneState.baselineTension;
  const setup = getCurrentSetup();
  const isHybrid = setup && setup.stringConfig.isHybrid;
  const dim = tuneState.hybridDimension;

  // Build dimension-aware baseline label
  let baseLabel = `Baseline: ${tuneState.baselineTension} lbs`;
  let exploreLabel = isAtBaseline ? 'At baseline' : `Exploring: ${tuneState.exploredTension} lbs`;
  if (isHybrid) {
    if (dim === 'mains') {
      baseLabel = `Mains Baseline: ${tuneState.baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Mains: ${tuneState.exploredTension} lbs`;
    } else if (dim === 'crosses') {
      baseLabel = `Crosses Baseline: ${tuneState.baselineTension} lbs`;
      exploreLabel = isAtBaseline ? 'At baseline' : `Crosses: ${tuneState.exploredTension} lbs`;
    } else {
      const diff = setup.stringConfig.mainsTension - setup.stringConfig.crossesTension;
      baseLabel = `Linked Baseline: M ${tuneState.baselineTension} / X ${tuneState.baselineTension - diff} lbs`;
      if (!isAtBaseline) {
        exploreLabel = `Linked: M ${tuneState.exploredTension} / X ${tuneState.exploredTension - diff} lbs`;
      }
    }
  }

  container.innerHTML = `
    <div class="delta-header-row">
      <span class="delta-baseline-label">${baseLabel}</span>
      <span class="delta-explored-label">${exploreLabel}</span>
    </div>
    <div class="delta-stats-grid">
      ${deltaKeys.map((key, i) => {
        const diff = Math.round(explored[key] - base[key]);
        const cls = diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral';
        const sign = diff > 0 ? '+' : '';
        return `
          <div class="delta-stat-row">
            <span class="delta-stat-label">${deltaLabels[i]}</span>
            <div class="delta-stat-bar-track">
              <div class="delta-stat-bar-baseline" style="width:${base[key]}%"></div>
              ${!isAtBaseline ? `<div class="delta-stat-bar-explored ${cls}" style="width:${explored[key]}%"></div>` : ''}
            </div>
            <span class="delta-stat-diff ${cls}">${isAtBaseline ? '—' : `${sign}${diff}`}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================================
// GAUGE EXPLORER — shows how each available gauge shifts stats vs current
// ============================================
function renderGaugeExplorer(setup) {
  const container = $('#gauge-explore-content');
  if (!container) return;
  if (!setup) { container.innerHTML = ''; return; }

  const { racquet, stringConfig } = setup;

  // Determine which string(s) to explore gauge for
  // For full bed: explore the single string
  // For hybrid: explore both mains and crosses
  const sections = [];

  if (stringConfig.isHybrid) {
    if (stringConfig.mains) {
      sections.push({
        label: 'MAINS',
        string: stringConfig.mains,
        tensionKey: 'mainsTension',
        buildConfig: (gaugedStr) => ({
          isHybrid: true,
          mains: gaugedStr,
          crosses: stringConfig.crosses,
          mainsTension: stringConfig.mainsTension,
          crossesTension: stringConfig.crossesTension
        })
      });
    }
    if (stringConfig.crosses) {
      sections.push({
        label: 'CROSSES',
        string: stringConfig.crosses,
        tensionKey: 'crossesTension',
        buildConfig: (gaugedStr) => ({
          isHybrid: true,
          mains: stringConfig.mains,
          crosses: gaugedStr,
          mainsTension: stringConfig.mainsTension,
          crossesTension: stringConfig.crossesTension
        })
      });
    }
  } else {
    if (stringConfig.string) {
      sections.push({
        label: null, // no label needed for single string
        string: stringConfig.string,
        buildConfig: (gaugedStr) => ({
          isHybrid: false,
          string: gaugedStr,
          mainsTension: stringConfig.mainsTension,
          crossesTension: stringConfig.crossesTension
        })
      });
    }
  }

  if (sections.length === 0) { container.innerHTML = ''; return; }

  // Stats to show in the gauge explorer
  const gaugeKeys = ['spin', 'power', 'control', 'comfort', 'feel', 'durability', 'playability'];
  const gaugeLabels = ['Spin', 'Power', 'Control', 'Comfort', 'Feel', 'Durability', 'Playability'];

  let html = '';

  sections.forEach(section => {
    const baseStr = section.string;
    const baseRefGauge = baseStr._gaugeModified ? baseStr._refGauge : baseStr.gaugeNum;
    // Use the original unmodified string for gauge exploration
    const originalStr = baseStr._gaugeModified
      ? STRINGS.find(s => s.id === baseStr.id) || baseStr
      : baseStr;
    const currentGauge = baseStr.gaugeNum;
    const gaugeOptions = getGaugeOptions(originalStr);

    // Compute stats at each gauge
    const gaugeResults = gaugeOptions.map(g => {
      const gaugedStr = applyGaugeModifier(originalStr, g);
      const config = section.buildConfig(gaugedStr);
      const stats = predictSetup(racquet, config);
      const tensionCtx = buildTensionContext(config, racquet);
      const obs = computeCompositeScore(stats, tensionCtx);
      return { gauge: g, stats, obs: +obs.toFixed(1), isCurrent: Math.abs(g - currentGauge) < 0.005 };
    });

    const currentResult = gaugeResults.find(r => r.isCurrent);
    if (!currentResult) return;

    if (section.label) {
      html += `<div class="gauge-explore-section-label">${section.label}: ${originalStr.name}</div>`;
    } else {
      html += `<div class="gauge-explore-section-label">${originalStr.name}</div>`;
    }

    html += `<div class="gauge-explore-grid" style="--gauge-cols: ${gaugeOptions.length}">`;

    // Header row
    html += `<div class="gauge-explore-header">`;
    html += `<span class="gauge-explore-stat-label"></span>`;
    gaugeResults.forEach(r => {
      const gaugeLabel = GAUGE_LABELS[r.gauge] || `${r.gauge.toFixed(2)}mm`;
      // Show short label: just the gauge number like "16" or "17"
      const shortLabel = r.gauge >= 1.30 ? '16' : r.gauge >= 1.25 ? '16L' : r.gauge >= 1.20 ? '17' : '18';
      const mmLabel = `${r.gauge.toFixed(2)}`;
      const currentCls = r.isCurrent ? ' gauge-current' : '';
      html += `<span class="gauge-explore-col-header${currentCls}">
        <span class="gauge-col-short">${shortLabel}</span>
        <span class="gauge-col-mm">${mmLabel}</span>
        ${r.isCurrent ? '<span class="gauge-col-tag">current</span>' : ''}
      </span>`;
    });
    html += `</div>`;

    // Stat rows
    gaugeKeys.forEach((key, i) => {
      html += `<div class="gauge-explore-row">`;
      html += `<span class="gauge-explore-stat-label">${gaugeLabels[i]}</span>`;
      gaugeResults.forEach(r => {
        const val = r.stats[key];
        const baseVal = currentResult.stats[key];
        const diff = val - baseVal;
        const cls = r.isCurrent ? 'gauge-val-current' : diff > 0 ? 'gauge-val-positive' : diff < 0 ? 'gauge-val-negative' : 'gauge-val-neutral';
        const diffStr = r.isCurrent ? '' : (diff > 0 ? `+${diff}` : `${diff}`);
        html += `<span class="gauge-explore-cell ${cls}">
          <span class="gauge-cell-val">${val}</span>
          ${diffStr ? `<span class="gauge-cell-diff">${diffStr}</span>` : ''}
        </span>`;
      });
      html += `</div>`;
    });

    // OBS row
    html += `<div class="gauge-explore-row gauge-explore-obs-row">`;
    html += `<span class="gauge-explore-stat-label gauge-obs-label">OBS</span>`;
    gaugeResults.forEach(r => {
      const diff = r.obs - currentResult.obs;
      const cls = r.isCurrent ? 'gauge-val-current' : diff > 0.5 ? 'gauge-val-positive' : diff < -0.5 ? 'gauge-val-negative' : 'gauge-val-neutral';
      const diffStr = r.isCurrent ? '' : (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1));
      html += `<span class="gauge-explore-cell gauge-obs-cell ${cls}">
        <span class="gauge-cell-val">${r.obs}</span>
        ${diffStr ? `<span class="gauge-cell-diff">${diffStr}</span>` : ''}
      </span>`;
    });
    html += `</div>`;

    html += `</div>`; // close gauge-explore-grid
  });

  container.innerHTML = html;
}

function renderBaselineMarker(sliderMin, sliderMax) {
  const marker = $('#slider-baseline-marker');
  const pct = ((tuneState.baselineTension - sliderMin) / (sliderMax - sliderMin)) * 100;
  marker.style.left = `${pct}%`;
  marker.title = `Baseline: ${tuneState.baselineTension} lbs`;
}

function renderOptimalZone(sliderMin, sliderMax) {
  const zone = $('#slider-optimal-zone');
  const w = tuneState.optimalWindow;
  if (!w) { zone.style.display = 'none'; return; }
  const leftPct = ((w.low - sliderMin) / (sliderMax - sliderMin)) * 100;
  const rightPct = ((w.high - sliderMin) / (sliderMax - sliderMin)) * 100;
  zone.style.left = `${leftPct}%`;
  zone.style.width = `${rightPct - leftPct}%`;
  zone.style.display = '';
  zone.title = `Optimal: ${w.low}–${w.high} lbs`;
}

function renderSweepChart(setup) {
  const data = tuneState.sweepData;
  if (!data || data.length === 0) return;

  const ctx = document.getElementById('sweep-chart').getContext('2d');
  const tensions = data.map(d => d.tension);
  const isDark = document.documentElement.dataset.theme === 'dark';

  const curveColors = {
    control: { border: '#C7F63A', bg: 'rgba(199,246,58,0.10)' },
    comfort: { border: '#7CCBFF', bg: 'rgba(124,203,255,0.10)' },
    spin:    { border: '#FF9A57', bg: 'rgba(255,154,87,0.10)' },
    power:   { border: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)', bg: 'transparent' }
  };

  const datasets = [
    {
      label: 'Control',
      data: data.map(d => d.stats.control),
      borderColor: curveColors.control.border,
      backgroundColor: curveColors.control.bg,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Comfort',
      data: data.map(d => d.stats.comfort),
      borderColor: curveColors.comfort.border,
      backgroundColor: curveColors.comfort.bg,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Spin',
      data: data.map(d => d.stats.spin),
      borderColor: curveColors.spin.border,
      backgroundColor: curveColors.spin.bg,
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    },
    {
      label: 'Power',
      data: data.map(d => d.stats.power),
      borderColor: curveColors.power.border,
      backgroundColor: curveColors.power.bg,
      fill: false,
      tension: 0.3,
      borderWidth: 1.5,
      borderDash: [4, 3],
      pointRadius: 0,
      pointHoverRadius: 0,
      pointStyle: false,
      pointHitRadius: 8
    }
  ];

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)';
  const legendColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.48)';

  // Annotation lines for baseline and explored
  const baselinePlugin = {
    id: 'tuneAnnotations',
    afterDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;
      const yScale = scales.y;

      // Baseline marker
      const bx = xScale.getPixelForValue(tuneState.baselineTension);
      if (bx >= chartArea.left && bx <= chartArea.right) {
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(bx, chartArea.top);
        ctx.lineTo(bx, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)';
        ctx.font = "500 10px 'General Sans', sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText('BASELINE', bx, chartArea.top - 6);
        ctx.restore();
      }

      // Explored marker
      if (tuneState.exploredTension !== tuneState.baselineTension) {
        const ex = xScale.getPixelForValue(tuneState.exploredTension);
        if (ex >= chartArea.left && ex <= chartArea.right) {
          ctx.save();
          ctx.strokeStyle = '#C7F63A';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(ex, chartArea.top);
          ctx.lineTo(ex, chartArea.bottom);
          ctx.stroke();
          ctx.fillStyle = '#C7F63A';
          ctx.font = "600 10px 'General Sans', sans-serif";
          ctx.textAlign = 'center';
          ctx.fillText(`${tuneState.exploredTension} lbs`, ex, chartArea.top - 6);
          ctx.restore();
        }
      }

      // Optimal window shading
      const w = tuneState.optimalWindow;
      if (w) {
        const lx = xScale.getPixelForValue(w.low);
        const rx = xScale.getPixelForValue(w.high);
        ctx.save();
        ctx.fillStyle = isDark ? 'rgba(199,246,58,0.06)' : 'rgba(199,246,58,0.10)';
        ctx.fillRect(lx, chartArea.top, rx - lx, chartArea.bottom - chartArea.top);
        ctx.restore();
      }
    }
  };

  if (sweepChart) {
    sweepChart.data.labels = tensions;
    sweepChart.data.datasets = datasets;
    sweepChart.options.scales.x.grid.color = gridColor;
    sweepChart.options.scales.y.grid.color = gridColor;
    sweepChart.options.scales.x.ticks.color = tickColor;
    sweepChart.options.scales.y.ticks.color = tickColor;
    sweepChart.options.plugins.legend.labels.color = legendColor;
    sweepChart.update('active');
    return;
  }

  sweepChart = new Chart(ctx, {
    type: 'line',
    data: { labels: tensions, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
            color: legendColor,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(255,255,255,0.95)',
          titleColor: isDark ? '#fff' : '#1a1a1a',
          bodyColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace", size: 12, weight: 600 },
          bodyFont: { family: "'General Sans', sans-serif", size: 11 },
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            title: (items) => `${items[0].label} lbs`,
            label: (item) => `  ${item.dataset.label}: ${item.raw}`
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tension (lbs)',
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
            color: tickColor
          },
          grid: { color: gridColor, lineWidth: 0.5 },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            color: tickColor,
            stepSize: 2
          }
        },
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Rating',
            font: { family: "'General Sans', sans-serif", size: 11, weight: 500 },
            color: tickColor
          },
          grid: { color: gridColor, lineWidth: 0.5 },
          ticks: {
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            color: tickColor,
            stepSize: 25
          }
        }
      },
      animation: { duration: 400, easing: 'easeOutQuart' }
    },
    plugins: [baselinePlugin]
  });
}

function renderBestValueMove() {
  const container = $('#slider-best-value');
  const data = tuneState.sweepData;
  const w = tuneState.optimalWindow;
  if (!data || !w) { container.innerHTML = ''; return; }

  const baseline = tuneState.baselineTension;
  const anchor = w.anchor;
  const diff = anchor - baseline;

  if (Math.abs(diff) <= 1) {
    container.innerHTML = `<div class="best-value-callout best-value-ok">
      <span class="best-value-icon">●</span>
      <span>You're in the optimal zone. No adjustment needed.</span>
    </div>`;
  } else {
    const direction = diff > 0 ? 'up' : 'down';
    const arrowIcon = diff > 0 ? '↑' : '↓';
    container.innerHTML = `<div class="best-value-callout best-value-move">
      <span class="best-value-icon">${arrowIcon}</span>
      <span><strong>Best Value Move:</strong> ${direction} ${Math.abs(diff)} lbs to ${anchor} lbs for peak balanced performance.</span>
    </div>`;
  }
}

// ---- Overall Build Score — Rank Ladder Bar ----

const OBS_TIERS = [
  { min: 0,  max: 10,  label: 'Delete This' },
  { min: 10, max: 20,  label: 'Hospital Build' },
  { min: 20, max: 30,  label: 'Bruh' },
  { min: 30, max: 40,  label: 'Cooked' },
  { min: 40, max: 50,  label: "This Ain't It" },
  { min: 50, max: 60,  label: 'Mid' },
  { min: 60, max: 70,  label: 'Built Diff' },
  { min: 70, max: 80,  label: 'S Rank' },
  { min: 80, max: 90,  label: 'WTF' },
  { min: 90, max: 100, label: 'Max Aura' },
];

function getObsTier(score) {
  for (let i = OBS_TIERS.length - 1; i >= 0; i--) {
    if (score >= OBS_TIERS[i].min) return OBS_TIERS[i];
  }
  return OBS_TIERS[0];
}

function getObsBadgeStyle(score) {
  if (score >= 90) return 'background: rgba(168, 64, 64, 0.15); color: #a84040;';
  if (score >= 80) return 'background: rgba(185, 80, 69, 0.12); color: #b85045;';
  if (score >= 70) return 'background: rgba(201, 112, 64, 0.12); color: #c97040;';
  if (score >= 60) return 'background: rgba(181, 181, 54, 0.12); color: #8a8a28;';
  if (score >= 50) return 'background: rgba(143, 166, 62, 0.10); color: #6b8f4a;';
  if (score >= 40) return 'background: rgba(90, 140, 90, 0.10); color: #5a8a5a;';
  if (score >= 30) return 'background: rgba(90, 122, 90, 0.10); color: #5a7a5a;';
  return 'background: rgba(80, 100, 80, 0.10); color: #4a6a4a;';
}

function renderOverallBuildScore(setup) {
  const container = $('#obs-content');
  if (!container) return;
  const { racquet, stringConfig } = setup;
  const stats = predictSetup(racquet, stringConfig);
  const score = computeCompositeScore(stats, buildTensionContext(stringConfig, racquet));
  const tier = getObsTier(score);
  const pct = Math.min(Math.max(score / 100, 0), 1) * 100;

  // Zone divider lines on the bar
  const zoneLines = OBS_TIERS.slice(1).map(t => 
    `<div class="obs-zone-line" style="left: ${t.min}%"></div>`
  ).join('');

  // Full rank ladder: every tier label positioned at its zone center
  // Alternate rows (top/bottom) for adjacent labels to prevent overlap
  const ladderLabels = OBS_TIERS.map((t, i) => {
    const centerPct = (t.min + t.max) / 2;
    const isActive = score >= t.min && (score < t.max || (t.max === 100 && score >= t.min));
    const row = i % 2 === 0 ? 'obs-ladder-row-top' : 'obs-ladder-row-bot';
    return `<span class="obs-ladder-label ${row} ${isActive ? 'obs-ladder-active' : ''}" style="left: ${centerPct}%" data-tier="${t.label}">${t.label}</span>`;
  }).join('');

  container.innerHTML = `
    <div class="obs-top-row">
      <div class="obs-score-group">
        <span class="obs-score-value">${score.toFixed(1)}</span>
        <span class="obs-score-label">Composite</span>
      </div>
      <span class="obs-rank-badge" style="${getObsBadgeStyle(score)}">${tier.label}</span>
    </div>
    <div class="obs-bar-wrapper">
      <div class="obs-bar-track">
        <div class="obs-marker" style="left: ${pct}%"></div>
      </div>
      <div class="obs-bar-zones">${zoneLines}</div>
      <div class="obs-ladder">${ladderLabels}</div>
    </div>
    <p class="obs-subtitle">Live composite score · rank ladder</p>
  `;
}

// ---- What To Try Next — 3-bucket contextual recommendations ----

const WTTN_ATTRS = ['spin','power','control','launch','feel','comfort','stability','forgiveness','durability','playability'];
const WTTN_ATTR_LABELS = { spin:'Spin', power:'Power', control:'Control', launch:'Launch', feel:'Feel', comfort:'Comfort', stability:'Stability', forgiveness:'Forgiveness', durability:'Durability', playability:'Playability' };

// Identity families: maps archetype keywords to broad families
const IDENTITY_FAMILIES = [
  { family: 'spin-control',   test: s => s.spin >= 75 && s.control >= 70 },
  { family: 'control-first',  test: s => s.control >= 72 && s.spin < 75 && s.power < 65 },
  { family: 'power-spin',     test: s => s.spin >= 72 && s.power >= 65 },
  { family: 'power-first',    test: s => s.power >= 70 && s.spin < 72 },
  { family: 'comfort-balanced',test: s => s.comfort >= 68 && s.power >= 55 && s.control >= 55 },
  { family: 'feel-control',   test: s => s.feel >= 70 && s.control >= 65 },
  { family: 'endurance',      test: s => s.playability >= 82 && s.durability >= 78 },
  { family: 'balanced',       test: () => true },
];

function classifySetup(stats) {
  // Sort attrs by value descending
  const sorted = WTTN_ATTRS.map(a => ({ attr: a, val: stats[a] })).sort((a, b) => b.val - a.val);
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();
  const family = IDENTITY_FAMILIES.find(f => f.test(stats))?.family || 'balanced';
  return { strongest, weakest, family };
}

function computeProfileSimilarity(statsA, statsB) {
  // Cosine-like similarity on the 10-attr profile
  let dotP = 0, magA = 0, magB = 0;
  for (const a of WTTN_ATTRS) {
    dotP += statsA[a] * statsB[a];
    magA += statsA[a] * statsA[a];
    magB += statsB[a] * statsB[a];
  }
  return dotP / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-9);
}

function computeDeltas(currentStats, candidateStats) {
  const deltas = {};
  for (const a of WTTN_ATTRS) {
    deltas[a] = Math.round(candidateStats[a] - currentStats[a]);
  }
  return deltas;
}

function topGains(deltas, n = 4) {
  return Object.entries(deltas)
    .filter(([, d]) => d > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([attr, d]) => ({ attr, delta: d }));
}

function topLosses(deltas, n = 3) {
  return Object.entries(deltas)
    .filter(([, d]) => d < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([attr, delta]) => ({ attr, delta }));
}

function generateNetDirection(gains, losses) {
  if (gains.length === 0) return 'Marginal tradeoff';
  const topGain = gains[0].attr;
  const topLoss = losses.length > 0 ? losses[0].attr : null;

  const phrases = {
    comfort:     { gain: 'Softer',    pair: { control: 'less surgical', power: 'less explosive', spin: 'less spin-heavy' } },
    spin:        { gain: 'Spinnier',  pair: { control: 'less precise', comfort: 'firmer', power: 'less raw pace' } },
    power:       { gain: 'More pace', pair: { control: 'less precise', comfort: 'firmer', spin: 'less topspin' } },
    control:     { gain: 'Sharper',   pair: { power: 'less free power', comfort: 'firmer', spin: 'less spin' } },
    feel:        { gain: 'More feel', pair: { power: 'less pace', durability: 'less durable', comfort: 'less padded' } },
    playability: { gain: 'More consistent over time', pair: { power: 'less pop', spin: 'less grip', control: 'less surgical' } },
    durability:  { gain: 'Longer lasting', pair: { feel: 'less feel', comfort: 'firmer', spin: 'less grip' } },
    forgiveness: { gain: 'More forgiving', pair: { control: 'less surgical', feel: 'less feedback', spin: 'less spin' } },
    stability:   { gain: 'More stable', pair: { comfort: 'firmer', feel: 'less delicate', power: 'less explosive' } },
    launch:      { gain: 'Higher launch', pair: { control: 'less flat', stability: 'less locked-in', feel: 'less connected' } },
  };

  const g = phrases[topGain];
  if (!g) return 'Different profile balance';
  let phrase = g.gain;
  if (topLoss && g.pair[topLoss]) phrase += ', ' + g.pair[topLoss];
  else if (topLoss) phrase += ', slightly less ' + WTTN_ATTR_LABELS[topLoss].toLowerCase();

  return phrase;
}

function scoreClosestBetter(currentStats, classification, candidateStats, deltas) {
  const similarity = computeProfileSimilarity(currentStats, candidateStats);
  let weaknessGain = 0;
  for (const w of classification.weakest) {
    weaknessGain += Math.max(0, deltas[w.attr]);
  }
  let strengthLoss = 0;
  for (const s of classification.strongest) {
    strengthLoss += Math.max(0, -deltas[s.attr]);
  }
  // Same family bonus
  const candClass = classifySetup(candidateStats);
  const familyBonus = candClass.family === classification.family ? 8 : 0;

  return (similarity * 30) + (weaknessGain * 3) - (strengthLoss * 4) + familyBonus;
}

function scoreMoreOfWhatYouWant(currentStats, classification, candidateStats, deltas) {
  // Find what the user already excels at / likes — push one strength harder
  // Or find the 2nd-weakest area and boost it meaningfully
  let bestTargetScore = -Infinity;

  // Try each attribute as a "target" — pick the one that scores best
  for (const attr of WTTN_ATTRS) {
    const targetGain = Math.max(0, deltas[attr]);
    if (targetGain < 2) continue; // must be a meaningful gain

    // Secondary gains
    let secondaryGains = 0;
    for (const a of WTTN_ATTRS) {
      if (a !== attr && deltas[a] > 0) secondaryGains += deltas[a] * 0.5;
    }

    // Total loss
    let totalLoss = 0;
    for (const a of WTTN_ATTRS) {
      if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
    }

    const score = (targetGain * 5) + secondaryGains - (totalLoss * 1.5);
    if (score > bestTargetScore) bestTargetScore = score;
  }

  return bestTargetScore === -Infinity ? -100 : bestTargetScore;
}

function scoreCorrective(currentStats, classification, candidateStats, deltas) {
  // Biggest weakness fix
  const weakest = classification.weakest[0]; // most limiting
  const fix = Math.max(0, deltas[weakest.attr]);

  // Secondary weakness fixes
  let secondaryFix = 0;
  for (let i = 1; i < classification.weakest.length; i++) {
    secondaryFix += Math.max(0, deltas[classification.weakest[i].attr]) * 0.6;
  }

  // Total loss elsewhere
  let totalLoss = 0;
  for (const a of WTTN_ATTRS) {
    if (deltas[a] < 0) totalLoss += Math.abs(deltas[a]);
  }

  return (fix * 6) + secondaryFix - (totalLoss * 1.0);
}

function candidateSimilarity(statsA, statsB) {
  let sumSqDiff = 0;
  for (const a of WTTN_ATTRS) {
    const d = statsA[a] - statsB[a];
    sumSqDiff += d * d;
  }
  return Math.sqrt(sumSqDiff);
}

function generateWhySentence(bucket, gains, losses, classification) {
  const topG = gains.slice(0, 2).map(g => WTTN_ATTR_LABELS[g.attr].toLowerCase()).join(' and ');
  const topL = losses.length > 0 ? losses[0] : null;

  if (bucket === 'closest') {
    if (topL) return `Preserves the current ${classification.family.replace('-',' ')} identity while improving ${topG}, with minimal ${WTTN_ATTR_LABELS[topL.attr].toLowerCase()} tradeoff.`;
    return `Preserves the current ${classification.family.replace('-',' ')} identity while adding ${topG}.`;
  }
  if (bucket === 'more') {
    return `Pushes ${topG} meaningfully harder${topL ? ', accepting some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() + ' loss' : ''}.`;
  }
  if (bucket === 'corrective') {
    const weakName = WTTN_ATTR_LABELS[classification.weakest[0].attr].toLowerCase();
    return `Directly addresses the current setup's ${weakName} weakness${topL ? ', trading some ' + WTTN_ATTR_LABELS[topL.attr].toLowerCase() : ''}.`;
  }
  return 'An alternative profile worth exploring.';
}

function renderWhatToTryNext(setup, allCandidates) {
  const container = $('#wttn-content');
  const { racquet, stringConfig } = setup;

  // Get current stats
  const currentStats = predictSetup(racquet, stringConfig);
  const classification = classifySetup(currentStats);

  // Build a key to identify the current build for exclusion
  let currentBuildKey = null;
  if (stringConfig.isHybrid) {
    const mId = stringConfig.mains?.id || stringConfig.mainsId || '';
    const xId = stringConfig.crosses?.id || stringConfig.crossesId || '';
    currentBuildKey = `hybrid:${mId}/${xId}`;
  } else if (stringConfig.string) {
    currentBuildKey = `full:${stringConfig.string.id}`;
  }

  function getCandidateKey(c) {
    if (c.type === 'hybrid') return `hybrid:${c.mainsId}/${c.crossesId}`;
    return `full:${c.stringId || (c.string && c.string.id) || ''}`;
  }

  // Filter out the current build and compute deltas for each candidate
  const scored = allCandidates
    .filter(c => getCandidateKey(c) !== currentBuildKey)
    .map(c => {
      const deltas = computeDeltas(currentStats, c.stats);
      return {
        ...c,
        deltas,
        closestScore: scoreClosestBetter(currentStats, classification, c.stats, deltas),
        moreScore: scoreMoreOfWhatYouWant(currentStats, classification, c.stats, deltas),
        correctiveScore: scoreCorrective(currentStats, classification, c.stats, deltas),
      };
    });

  if (scored.length < 3) {
    container.innerHTML = '<p class="wttn-empty">Not enough alternative builds to generate contextual recommendations.</p>';
    return;
  }

  // Step 1: Pick Closest Better Version
  scored.sort((a, b) => b.closestScore - a.closestScore);
  const closest = scored[0];

  // Step 2: Pick More of What You Want — penalize candidates similar to closest
  const DISTINCTNESS_PENALTY = 15;
  for (const c of scored) {
    const sim = candidateSimilarity(c.stats, closest.stats);
    if (sim < 6) c.moreScore -= DISTINCTNESS_PENALTY;
  }
  scored.sort((a, b) => b.moreScore - a.moreScore);
  const more = scored.find(c => getCandidateKey(c) !== getCandidateKey(closest)) || scored[0];

  // Step 3: Pick Corrective Move — penalize candidates similar to both previous picks
  for (const c of scored) {
    const simClosest = candidateSimilarity(c.stats, closest.stats);
    const simMore = candidateSimilarity(c.stats, more.stats);
    if (simClosest < 6) c.correctiveScore -= DISTINCTNESS_PENALTY;
    if (simMore < 6) c.correctiveScore -= DISTINCTNESS_PENALTY;
  }
  scored.sort((a, b) => b.correctiveScore - a.correctiveScore);
  const corrective = scored.find(c => getCandidateKey(c) !== getCandidateKey(closest) && getCandidateKey(c) !== getCandidateKey(more)) || scored[0];

  const buckets = [
    { key: 'closest', title: 'Closest Better Version', pick: closest,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { key: 'more', title: 'More of What You Want', pick: more,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13L8 3l5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { key: 'corrective', title: 'Corrective Move', pick: corrective,
      icon: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8z" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' },
  ];

  container.innerHTML = buckets.map(b => {
    const { pick, key, title, icon } = b;
    const gains = topGains(pick.deltas, 4);
    const losses = topLosses(pick.deltas, 3);
    const netDir = generateNetDirection(gains, losses);
    const why = generateWhySentence(key, gains, losses, classification);

    // Limit to 2-4 gains and 1-3 losses as specified
    const displayGains = gains.slice(0, 4).filter(g => g.delta >= 1);
    const displayLosses = losses.slice(0, 3).filter(l => l.delta <= -1);

    return `
      <div class="wttn-card" data-bucket="${key}">
        <div class="wttn-bucket-header">
          <div class="wttn-bucket-icon">${icon}</div>
          <span class="wttn-bucket-label">${title}</span>
        </div>
        <div>
          <div class="wttn-build-name">${pick.label || (pick.string && pick.string.name) || 'Unknown'} ${pick.gauge ? `<span class="wttn-gauge">${pick.gauge}</span>` : (pick.string ? `<span class="wttn-gauge">${pick.string.gauge}</span>` : '')}</div>
          <div class="wttn-build-meta">
            ${pick.type === 'hybrid' ? '<span class="recs-type-badge recs-type-hybrid">HYBRID</span>' : '<span class="recs-type-badge recs-type-full">FULL BED</span>'}
            <span class="wttn-build-tension">${pick.type === 'hybrid' ? `M:${pick.tension} / X:${pick.tension - 2} lbs` : `${pick.tension} lbs`}</span>
          </div>
        </div>
        <p class="wttn-why">${why}</p>
        <div class="wttn-deltas">
          ${displayGains.length > 0 ? `<div class="wttn-delta-row">
            <span class="wttn-delta-label">Gain</span>
            <div class="wttn-delta-chips">
              ${displayGains.map(g => `<span class="wttn-chip wttn-chip-gain">${WTTN_ATTR_LABELS[g.attr]} +${g.delta}</span>`).join('')}
            </div>
          </div>` : ''}
          ${displayLosses.length > 0 ? `<div class="wttn-delta-row">
            <span class="wttn-delta-label">Give Up</span>
            <div class="wttn-delta-chips">
              ${displayLosses.map(l => `<span class="wttn-chip wttn-chip-loss">${WTTN_ATTR_LABELS[l.attr]} ${l.delta}</span>`).join('')}
            </div>
          </div>` : ''}
        </div>
        <div class="wttn-net">
          <span class="wttn-net-label">Net</span>
          <span class="wttn-net-phrase">${netDir}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Recommended Builds ----
function renderRecommendedBuilds(setup) {
  const container = $('#recs-content');
  const { racquet, stringConfig } = setup;

  // --- Compute current build OBS for delta display ---
  const currentStats = predictSetup(racquet, stringConfig);
  const currentTCtx = buildTensionContext(stringConfig, racquet);
  const currentOBS = computeCompositeScore(currentStats, currentTCtx);

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(racquet.tensionRange[0] - 3, 30);
  const sweepMax = Math.min(racquet.tensionRange[1] + 3, 75);

  // Helper: find optimal tension for a config
  function findOptimalTension(buildConfig) {
    let bestScore = -1, bestTension = midTension, bestStats = null;
    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { ...buildConfig };
      cfg.mainsTension = t;
      cfg.crossesTension = t - (buildConfig.isHybrid ? 2 : 0); // hybrids: crosses 2 lbs lower
      const stats = predictSetup(racquet, cfg);
      if (!stats) continue;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  // --- FULL BED candidates ---
  const fullBedCandidates = [];
  STRINGS.forEach(s => {
    const result = findOptimalTension({ isHybrid: false, string: s });
    if (result.stats) {
      fullBedCandidates.push({
        type: 'full',
        label: s.name,
        gauge: s.gauge,
        material: s.material,
        tension: result.tension,
        score: result.score,
        stats: result.stats,
        stringId: s.id,
        string: s
      });
    }
  });

  // --- HYBRID candidates ---
  // Smart pairing: pick top mains candidates × best cross candidates
  // Cross selection: round/slick polys for poly mains, soft polys for gut
  const hybridCandidates = [];

  // Select promising mains strings: top 12 full-bed + any gut/multi
  fullBedCandidates.sort((a, b) => b.score - a.score);
  const topMainsIds = new Set(fullBedCandidates.slice(0, 12).map(c => c.stringId));
  STRINGS.forEach(s => {
    if (s.material === 'Natural Gut' || s.material === 'Multifilament') topMainsIds.add(s.id);
  });

  // Select cross candidates: round/slick polys + elastic co-polys
  const crossCandidates = STRINGS.filter(s => {
    const shape = (s.shape || '').toLowerCase();
    const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
    const isElastic = s.material === 'Co-Polyester (elastic)';
    const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
    return isRoundSlick || isElastic || isSoftPoly;
  });

  // Sweep hybrids: each mains candidate × each cross candidate
  topMainsIds.forEach(mainsId => {
    const mains = STRINGS.find(s => s.id === mainsId);
    if (!mains) return;

    crossCandidates.forEach(cross => {
      if (cross.id === mains.id) return; // skip same string
      const result = findOptimalTension({
        isHybrid: true, mains, crosses: cross
      });
      if (result.stats && result.score > 0) {
        hybridCandidates.push({
          type: 'hybrid',
          label: `${mains.name} / ${cross.name}`,
          gauge: '',
          material: `${mains.material} / ${cross.material}`,
          tension: result.tension,
          score: result.score,
          stats: result.stats,
          mainsId: mains.id,
          crossesId: cross.id,
          mains, crosses: cross
        });
      }
    });
  });

  // --- Merge all candidates for WTTN ---
  const allCandidates = [...fullBedCandidates, ...hybridCandidates];
  allCandidates.sort((a, b) => b.score - a.score);

  // Identify current setup
  let currentKey = null;
  if (stringConfig.isHybrid) {
    const mId = stringConfig.mains?.id || stringConfig.mainsId;
    const xId = stringConfig.crosses?.id || stringConfig.crossesId;
    currentKey = `hybrid:${mId}/${xId}`;
  } else if (stringConfig.string) {
    currentKey = `full:${stringConfig.string.id}`;
  }

  function getCandidateKey(c) {
    return c.type === 'hybrid' ? `hybrid:${c.mainsId}/${c.crossesId}` : `full:${c.stringId}`;
  }

  // Check after we compute topFull and topHybrid (moved below)
  let isCurrentInTop = false;

  // --- Split into top 5 full-bed and top 5 hybrid ---
  fullBedCandidates.sort((a, b) => b.score - a.score);
  hybridCandidates.sort((a, b) => b.score - a.score);
  const topFull = fullBedCandidates.slice(0, 5);
  const topHybrid = hybridCandidates.slice(0, 5);
  isCurrentInTop = currentKey && [...topFull, ...topHybrid].some(c => getCandidateKey(c) === currentKey);

  // Helper: render a single recommendation item
  function renderRecItem(c, rank) {
    const isCurrent = currentKey === getCandidateKey(c);
    const delta = c.score - currentOBS;
    const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    const deltaCls = delta > 0.5 ? 'recs-delta-positive' : delta < -0.5 ? 'recs-delta-negative' : 'recs-delta-neutral';
    const tensionLabel = c.type === 'hybrid'
      ? `M:${c.tension} / X:${c.tension - 2} lbs`
      : `${c.tension} lbs`;

    return `
      <div class="recs-item ${isCurrent ? 'recs-item-current' : ''}">
        <div class="recs-rank">${rank}</div>
        <div class="recs-info">
          <div class="recs-name">${c.label} ${c.gauge ? `<span class="recs-gauge">${c.gauge}</span>` : ''}</div>
          <div class="recs-meta">
            <span class="recs-tension-rec">${tensionLabel}</span>
            ${isCurrent ? '<span class="recs-badge-current">CURRENT</span>' : ''}
          </div>
        </div>
        <div class="recs-composite">
          <span class="recs-composite-value">${c.score.toFixed(1)}</span>
          <span class="recs-composite-delta ${deltaCls}">${isCurrent ? 'YOU' : deltaStr}</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="recs-split">
      <div class="recs-panel">
        <div class="recs-panel-header">
          <span class="recs-panel-title">FULL BED</span>
          <span class="recs-panel-sub">Single string, both directions</span>
        </div>
        <div class="recs-list">
          ${topFull.map((c, i) => renderRecItem(c, i + 1)).join('')}
        </div>
      </div>
      <div class="recs-panel">
        <div class="recs-panel-header">
          <span class="recs-panel-title">HYBRID</span>
          <span class="recs-panel-sub">Mains / Crosses pairing</span>
        </div>
        <div class="recs-list">
          ${topHybrid.map((c, i) => renderRecItem(c, i + 1)).join('')}
        </div>
      </div>
    </div>
    <p class="recs-footnote">Composite score across all 11 stats at optimal tension for <strong>${racquet.name}</strong>. Delta is vs your current build.</p>
  `;

  // Show "Try a Different String" section
  const topCombined = [...topFull, ...topHybrid];
  renderExplorePrompt(setup, isCurrentInTop, topCombined);

  // Render What To Try Next using the full candidates list
  renderWhatToTryNext(setup, allCandidates);
}

function renderExplorePrompt(setup, isCurrentInTop, topBuilds) {
  const row = $('#tune-row-explore');
  const container = $('#explore-content');
  const { stringConfig } = setup;

  // If hybrid, always show a subtle nudge to try full-bed top strings
  if (stringConfig.isHybrid) {
    row.classList.remove('hidden');
    container.innerHTML = `
      <div class="explore-prompt">
        <div class="explore-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14m-5-5l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="explore-text">
          <p class="explore-headline">Curious how a full-bed setup compares?</p>
          <p class="explore-body">Your hybrid is dialed in — but the top-rated strings above are scored as full-bed setups. Try swapping to one of them on the main page and re-enter Tune to see how the response curves shift.</p>
        </div>
      </div>
    `;
    return;
  }

  if (isCurrentInTop) {
    // Current string is already top-rated — hide this section
    row.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  // Current string isn't in top 5 — encourage exploration
  const topName = topBuilds[0]?.string?.name || 'a top-rated string';
  row.classList.remove('hidden');
  container.innerHTML = `
    <div class="explore-prompt">
      <div class="explore-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="explore-text">
        <p class="explore-headline">Try a different string?</p>
        <p class="explore-body">Your current string didn't make the top 5 for this frame. Consider switching to <strong>${topName}</strong> or another recommended build above — swap on the main page, then re-enter Tune to compare the tension response curves.</p>
      </div>
    </div>
  `;
}

function onTuneSliderInput(e) {
  const val = parseInt(e.target.value);
  tuneState.exploredTension = val;
  updateSliderLabel();

  // Update delta display
  renderDeltaVsBaseline();

  // Update chart annotation
  if (sweepChart) sweepChart.update('none');
}

function renderTuneHybridToggle(stringConfig) {
  const container = $('#tune-hybrid-toggle');
  // Show toggle for both hybrid AND Full Bed (which now has independent tensions)
  const hasSplitTensions = stringConfig.isHybrid || (stringConfig.mainsTension !== undefined && stringConfig.crossesTension !== undefined);
  if (!hasSplitTensions) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';
  container.innerHTML = `
    <button class="tune-dim-btn ${tuneState.hybridDimension === 'linked' ? 'active' : ''}" data-dim="linked">Linked</button>
    <button class="tune-dim-btn ${tuneState.hybridDimension === 'mains' ? 'active' : ''}" data-dim="mains">Mains</button>
    <button class="tune-dim-btn ${tuneState.hybridDimension === 'crosses' ? 'active' : ''}" data-dim="crosses">Crosses</button>
  `;
  container.querySelectorAll('.tune-dim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tuneState.hybridDimension = btn.dataset.dim;
      container.querySelectorAll('.tune-dim-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Re-run sweep with new dimension
      const setup = getCurrentSetup();
      if (setup) {
        // Recalculate baseline for the new dimension
        tuneState.baselineTension = getHybridBaselineTension(setup.stringConfig, tuneState.hybridDimension);
        tuneState.exploredTension = tuneState.baselineTension;
        const slider = $('#tune-slider');
        slider.value = tuneState.baselineTension;
        updateSliderLabel();
        updateDeltaTitle(setup.stringConfig);

        runTensionSweep(setup);
        calculateOptimalWindow(setup);
        renderOptimalBuildWindow();
        renderDeltaVsBaseline();
        renderBaselineMarker(parseInt(slider.min), parseInt(slider.max));
        renderOptimalZone(parseInt(slider.min), parseInt(slider.max));
        renderSweepChart(setup);
        renderBestValueMove();
      }
    });
  });
}

// Bi-directional sync: when Tune slider changes, update main tension inputs
function syncTuneToMain(tension) {
  const setup = getCurrentSetup();
  if (!setup) return;
  const { stringConfig } = setup;

  if (stringConfig.isHybrid) {
    const diff = stringConfig.mainsTension - stringConfig.crossesTension;
    if (tuneState.hybridDimension === 'mains') {
      $('#input-tension-mains').value = tension;
    } else if (tuneState.hybridDimension === 'crosses') {
      $('#input-tension-crosses').value = tension;
    } else {
      $('#input-tension-mains').value = tension;
      $('#input-tension-crosses').value = tension - diff;
    }
  } else {
    // Full Bed: independent tensions with dimension toggle
    const diff = stringConfig.mainsTension - stringConfig.crossesTension;
    if (tuneState.hybridDimension === 'mains') {
      $('#input-tension-full-mains').value = tension;
    } else if (tuneState.hybridDimension === 'crosses') {
      $('#input-tension-full-crosses').value = tension;
    } else {
      // Linked: maintain differential
      $('#input-tension-full-mains').value = tension;
      $('#input-tension-full-crosses').value = tension - diff;
    }
  }
  tuneState.baselineTension = tension;
  tuneState.exploredTension = tension;
  renderDashboard();
}

// Apply explored tension as new baseline
function applyExploredTension() {
  syncTuneToMain(tuneState.exploredTension);
  // Re-init with new baseline
  const setup = getCurrentSetup();
  if (setup) initTuneMode(setup);
}

// Compare page entry: open tune for a specific comparison slot
function openTuneForSlot(slotIndex) {
  const slot = comparisonSlots[slotIndex];
  if (!slot || !slot.stats) return;

  // Load slot config into main page first
  const racquet = RACQUETS.find(r => r.id === slot.racquetId);
  if (!racquet) return;

  ssInstances['select-racquet']?.setValue(slot.racquetId);
  showFrameSpecs(racquet);

  if (slot.isHybrid) {
    setHybridMode(true);
    ssInstances['select-string-mains']?.setValue(slot.mainsId);
    populateGaugeDropdown(document.getElementById('gauge-select-mains'), slot.mainsId);
    $('#input-tension-mains').value = slot.mainsTension;
    ssInstances['select-string-crosses']?.setValue(slot.crossesId);
    populateGaugeDropdown(document.getElementById('gauge-select-crosses'), slot.crossesId);
    $('#input-tension-crosses').value = slot.crossesTension;
  } else {
    setHybridMode(false);
    ssInstances['select-string-full']?.setValue(slot.stringId);
    populateGaugeDropdown(document.getElementById('gauge-select-full'), slot.stringId);
    $('#input-tension-full-mains').value = slot.mainsTension;
    $('#input-tension-full-crosses').value = slot.crossesTension;
  }
  renderDashboard();

  // Now switch to tune mode
  if (currentMode !== 'tune') {
    switchMode('tune');
  } else {
    // Already in tune mode, just re-init
    const setup = getCurrentSetup();
    if (setup) initTuneMode(setup);
  }
}

// ============================================
// THEME TOGGLE
// ============================================

function toggleTheme() {
  const html = document.documentElement;
  const current = html.dataset.theme;
  html.dataset.theme = current === 'dark' ? 'light' : 'dark';

  // Refresh theme-dependent colors
  SLOT_COLORS = getSlotColors();

  // Update charts
  if (currentRadarChart) {
    const setup = getCurrentSetup();
    if (setup) {
      const stats = predictSetup(setup.racquet, setup.stringConfig);
      renderRadarChart(stats);
    }
  }
  if (comparisonRadarChart) {
    updateComparisonRadar();
    // Re-render comparison slots with updated colors
    renderComparisonSlots();
  }

  // Refresh sweep chart if tune mode is open
  if (currentMode === 'tune' && sweepChart) {
    sweepChart.destroy();
    sweepChart = null;
    const setup = getCurrentSetup();
    if (setup) renderSweepChart(setup);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function init() {
  // Populate searchable dropdowns (onChange callbacks handle dashboard re-render)
  populateRacquetDropdown($('#select-racquet'));
  populateStringDropdown($('#select-string-full'));
  populateStringDropdown($('#select-string-mains'));
  populateStringDropdown($('#select-string-crosses'));

  // Tension inputs
  $('#input-tension-full-mains').addEventListener('input', renderDashboard);
  $('#input-tension-full-crosses').addEventListener('input', renderDashboard);
  $('#input-tension-mains').addEventListener('input', renderDashboard);
  $('#input-tension-crosses').addEventListener('input', renderDashboard);

  // String mode toggle
  $('#btn-full').addEventListener('click', () => {
    setHybridMode(false);
    renderDashboard();
  });
  $('#btn-hybrid').addEventListener('click', () => {
    setHybridMode(true);
    renderDashboard();
  });

  // Presets (dynamic)
  renderHomePresets();
  renderComparisonPresets();
  $('#btn-save-preset').addEventListener('click', saveCurrentAsPreset);

  // Comparison
  $('#btn-add-slot').addEventListener('click', addComparisonSlot);

  // Mode switcher buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode) switchMode(mode);
    });
  });

  // Tune slider
  $('#tune-slider').addEventListener('input', onTuneSliderInput);

  // Theme
  $('#btn-theme').addEventListener('click', toggleTheme);

  // Set initial mode
  const overviewBtn = document.querySelector('.mode-btn[data-mode="overview"]');
  if (overviewBtn) overviewBtn.classList.add('active');
  // Show overview section, hide others
  document.getElementById('mode-overview')?.classList.remove('hidden');
  document.getElementById('mode-tune')?.classList.add('hidden');
  document.getElementById('mode-compare')?.classList.add('hidden');
  document.getElementById('mode-howitworks')?.classList.add('hidden');
}

/* ============================================
   RESPONSIVE HEADER — move mode-switcher on ≤1024px
   ============================================ */
function handleResponsiveHeader() {
  const switcher = document.getElementById('mode-switcher');
  const dockRegion = document.querySelector('.header-dock-region');
  const workspaceRegion = document.querySelector('.header-workspace-region');
  if (!switcher || !dockRegion || !workspaceRegion) return;

  const mql = window.matchMedia('(max-width: 1024px)');

  function onBreakpoint(e) {
    if (e.matches) {
      // Mobile/tablet: move switcher into dock-region
      if (!dockRegion.contains(switcher)) {
        dockRegion.appendChild(switcher);
      }
    } else {
      // Desktop: move switcher back into workspace-region .header-actions
      const actions = workspaceRegion.querySelector('.header-actions');
      if (actions && !actions.contains(switcher)) {
        actions.insertBefore(switcher, actions.querySelector('#btn-theme'));
      }
    }
  }

  mql.addEventListener('change', onBreakpoint);
  onBreakpoint(mql); // run on load
}

// ============================================
// OPTIMIZE MODE — Build Optimizer / Workbench
// ============================================

function initOptimize() {
  // Populate frame dropdown
  const frameSel = document.getElementById('opt-frame-select');
  RACQUETS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    frameSel.appendChild(opt);
  });

  // Set default to current frame if one is active
  const currentSetup = getCurrentSetup();
  if (currentSetup) {
    frameSel.value = currentSetup.racquet.id;
  }

  // Wire run button
  document.getElementById('opt-run-btn').addEventListener('click', runOptimizer);

  // Wire setup type toggles
  document.querySelectorAll('.opt-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.opt-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Wire upgrade mode checkbox
  document.getElementById('opt-upgrade-mode').addEventListener('change', (e) => {
    document.getElementById('opt-upgrade-fields').classList.toggle('hidden', !e.target.checked);
  });

  // Wire sort change to re-sort existing results
  document.getElementById('opt-sort').addEventListener('change', () => {
    if (_optLastCandidates && _optLastCandidates.length > 0) {
      const sortBy = document.getElementById('opt-sort').value;
      _optLastCandidates.sort((a, b) => {
        if (sortBy === 'obs') return b.score - a.score;
        return (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0);
      });
      renderOptimizerResults(_optLastCandidates, sortBy, _optLastCurrentOBS);
    }
  });
}

let _optLastCandidates = null;
let _optLastCurrentOBS = 0;

function runOptimizer() {
  const resultsEl = document.getElementById('opt-results');
  const countEl = document.getElementById('opt-results-count');

  // Show loading
  resultsEl.innerHTML = '<div class="opt-loading">Computing builds…</div>';

  // Use requestAnimationFrame to allow the loading indicator to paint
  requestAnimationFrame(() => { setTimeout(() => { _runOptimizerCore(resultsEl, countEl); }, 16); });
}

function _runOptimizerCore(resultsEl, countEl) {
  // Read filters
  const frameSelVal = document.getElementById('opt-frame-select').value;
  const setupType = document.querySelector('.opt-toggle.active')?.dataset.value || 'both';
  const sortBy = document.getElementById('opt-sort').value;
  const tensionMin = parseInt(document.getElementById('opt-tension-min').value) || 40;
  const tensionMax = parseInt(document.getElementById('opt-tension-max').value) || 65;
  const upgradeMode = document.getElementById('opt-upgrade-mode').checked;

  // Stat minimums
  const mins = {
    spin: parseInt(document.getElementById('opt-min-spin').value) || 0,
    control: parseInt(document.getElementById('opt-min-control').value) || 0,
    power: parseInt(document.getElementById('opt-min-power').value) || 0,
    comfort: parseInt(document.getElementById('opt-min-comfort').value) || 0,
    feel: parseInt(document.getElementById('opt-min-feel').value) || 0,
    durability: parseInt(document.getElementById('opt-min-durability').value) || 0,
    playability: parseInt(document.getElementById('opt-min-playability').value) || 0
  };

  // Upgrade constraints
  const upgradeOBS = parseFloat(document.getElementById('opt-upgrade-obs').value) || 0;
  const upgradeCtlLoss = parseFloat(document.getElementById('opt-upgrade-ctl-loss').value) || 5;
  const upgradeDurLoss = parseFloat(document.getElementById('opt-upgrade-dur-loss').value) || 10;

  // Get selected frame
  let racquet;
  if (frameSelVal === 'current') {
    const setup = getCurrentSetup();
    racquet = setup ? setup.racquet : RACQUETS[0];
  } else {
    racquet = RACQUETS.find(r => r.id === frameSelVal) || RACQUETS[0];
  }

  // Compute current build OBS for deltas
  let currentOBS = 0;
  let currentStats = null;
  const currentSetup = getCurrentSetup();
  if (currentSetup) {
    currentStats = predictSetup(currentSetup.racquet, currentSetup.stringConfig);
    if (currentStats) {
      const tCtx = buildTensionContext(currentSetup.stringConfig, currentSetup.racquet);
      currentOBS = computeCompositeScore(currentStats, tCtx);
    }
  }

  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(tensionMin, 30);
  const sweepMax = Math.min(tensionMax, 75);

  // Helper: find optimal tension for a config within range
  function findOptimalTension(buildConfig) {
    let bestScore = -1, bestTension = midTension, bestStats = null;
    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { ...buildConfig };
      cfg.mainsTension = t;
      cfg.crossesTension = t - (buildConfig.isHybrid ? 2 : 0);
      const stats = predictSetup(racquet, cfg);
      if (!stats) continue;
      const tCtx = buildTensionContext(cfg, racquet);
      const score = computeCompositeScore(stats, tCtx);
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }
    return { score: bestScore, tension: bestTension, stats: bestStats };
  }

  let candidates = [];

  // --- FULL BED candidates ---
  if (setupType === 'full' || setupType === 'both') {
    STRINGS.forEach(s => {
      const result = findOptimalTension({ isHybrid: false, string: s });
      if (result.stats) {
        candidates.push({
          type: 'full',
          label: s.name,
          gauge: s.gauge,
          tension: result.tension,
          crossesTension: result.tension,
          score: result.score,
          stats: result.stats,
          stringData: s,
          racquet: racquet
        });
      }
    });
  }

  // --- HYBRID candidates (same smart pairing as renderRecommendedBuilds) ---
  if (setupType === 'hybrid' || setupType === 'both') {
    // Build full-bed scores for ranking mains
    const fullScores = [];
    if (setupType === 'both') {
      // Already computed above, reuse
    } else {
      STRINGS.forEach(s => {
        const result = findOptimalTension({ isHybrid: false, string: s });
        if (result.stats) fullScores.push({ stringId: s.id, score: result.score });
      });
    }

    // Select promising mains: top 12 full-bed + any gut/multi
    const tempFullForRanking = [];
    STRINGS.forEach(s => {
      const result = findOptimalTension({ isHybrid: false, string: s });
      if (result.stats) tempFullForRanking.push({ stringId: s.id, score: result.score });
    });
    tempFullForRanking.sort((a, b) => b.score - a.score);
    const topMainsIds = new Set(tempFullForRanking.slice(0, 12).map(c => c.stringId));
    STRINGS.forEach(s => {
      if (s.material === 'Natural Gut' || s.material === 'Multifilament') topMainsIds.add(s.id);
    });

    // Select cross candidates: round/slick polys + elastic co-polys
    const crossCandidates = STRINGS.filter(s => {
      const shape = (s.shape || '').toLowerCase();
      const isRoundSlick = shape.includes('round') || shape.includes('slick') || shape.includes('coated');
      const isElastic = s.material === 'Co-Polyester (elastic)';
      const isSoftPoly = s.material === 'Polyester' && s.stiffness < 200;
      return isRoundSlick || isElastic || isSoftPoly;
    });

    topMainsIds.forEach(mainsId => {
      const mains = STRINGS.find(s => s.id === mainsId);
      if (!mains) return;
      crossCandidates.forEach(cross => {
        if (cross.id === mains.id) return;
        const result = findOptimalTension({ isHybrid: true, mains, crosses: cross });
        if (result.stats && result.score > 0) {
          candidates.push({
            type: 'hybrid',
            label: `${mains.name} / ${cross.name}`,
            gauge: '',
            tension: result.tension,
            crossesTension: result.tension - 2,
            score: result.score,
            stats: result.stats,
            mainsData: mains,
            crossesData: cross,
            racquet: racquet
          });
        }
      });
    });
  }

  // --- Filter by stat minimums ---
  candidates = candidates.filter(c => {
    return c.stats.spin >= mins.spin &&
           c.stats.control >= mins.control &&
           c.stats.power >= mins.power &&
           c.stats.comfort >= mins.comfort &&
           c.stats.feel >= mins.feel &&
           c.stats.durability >= mins.durability &&
           c.stats.playability >= mins.playability;
  });

  // --- Upgrade mode filtering ---
  if (upgradeMode && currentStats) {
    candidates = candidates.filter(c => {
      if (c.score < currentOBS + upgradeOBS) return false;
      if (currentStats.control - c.stats.control > upgradeCtlLoss) return false;
      if (currentStats.durability - c.stats.durability > upgradeDurLoss) return false;
      return true;
    });
  }

  // --- Sort ---
  candidates.sort((a, b) => {
    if (sortBy === 'obs') return b.score - a.score;
    return (b.stats[sortBy] || 0) - (a.stats[sortBy] || 0);
  });

  // Store for re-sorting
  _optLastCandidates = candidates;
  _optLastCurrentOBS = currentOBS;

  countEl.textContent = `${candidates.length} result${candidates.length !== 1 ? 's' : ''}`;
  renderOptimizerResults(candidates, sortBy, currentOBS);
}

function renderOptimizerResults(candidates, sortBy, currentOBS) {
  const resultsEl = document.getElementById('opt-results');

  if (candidates.length === 0) {
    resultsEl.innerHTML = `
      <div class="opt-empty">
        <p class="opt-empty-title">No builds match your filters</p>
        <p class="opt-empty-sub">Try relaxing the stat minimums or expanding the tension range.</p>
      </div>`;
    return;
  }

  // Column highlight class
  const sortColClass = sortBy === 'obs' ? 'obs' : sortBy;

  const top = candidates.slice(0, 200); // Cap at 200 rows for perf

  let html = `<div class="opt-table-wrap"><table class="opt-table">
    <thead><tr>
      <th class="opt-th opt-th-rank">#</th>
      <th class="opt-th opt-th-type">Type</th>
      <th class="opt-th opt-th-string">String(s)</th>
      <th class="opt-th opt-th-gauge">Ga.</th>
      <th class="opt-th opt-th-tension">Tension</th>
      <th class="opt-th opt-th-num${sortColClass === 'obs' ? ' opt-th-active' : ''}">OBS</th>
      <th class="opt-th opt-th-num opt-th-delta">&Delta;</th>
      <th class="opt-th opt-th-num${sortColClass === 'spin' ? ' opt-th-active' : ''}">Spn</th>
      <th class="opt-th opt-th-num${sortColClass === 'power' ? ' opt-th-active' : ''}">Pwr</th>
      <th class="opt-th opt-th-num${sortColClass === 'control' ? ' opt-th-active' : ''}">Ctl</th>
      <th class="opt-th opt-th-num${sortColClass === 'comfort' ? ' opt-th-active' : ''}">Cmf</th>
      <th class="opt-th opt-th-num${sortColClass === 'feel' ? ' opt-th-active' : ''}">Fel</th>
      <th class="opt-th opt-th-num${sortColClass === 'durability' ? ' opt-th-active' : ''}">Dur</th>
      <th class="opt-th opt-th-num${sortColClass === 'playability' ? ' opt-th-active' : ''}">Ply</th>
      <th class="opt-th opt-th-actions">Actions</th>
    </tr></thead><tbody>`;

  top.forEach((c, i) => {
    const delta = c.score - currentOBS;
    const deltaStr = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    const deltaCls = delta > 0.5 ? 'opt-delta-pos' : delta < -0.5 ? 'opt-delta-neg' : 'opt-delta-neutral';
    const tensionLabel = c.type === 'hybrid' ? `${c.tension}/${c.crossesTension}` : `${c.tension}`;
    const typeTag = c.type === 'hybrid' ? '<span class="opt-tag-hybrid">H</span>' : '<span class="opt-tag-full">F</span>';
    const idx = i; // for action data attribute

    html += `<tr class="opt-row" data-opt-idx="${idx}">
      <td class="opt-td opt-td-rank">${i + 1}</td>
      <td class="opt-td opt-td-type">${typeTag}</td>
      <td class="opt-td opt-td-string">${c.label}</td>
      <td class="opt-td opt-td-gauge">${c.gauge || '—'}</td>
      <td class="opt-td opt-td-tension">${tensionLabel}</td>
      <td class="opt-td opt-td-num opt-td-obs">${c.score.toFixed(1)}</td>
      <td class="opt-td opt-td-num ${deltaCls}">${deltaStr}</td>
      <td class="opt-td opt-td-num">${c.stats.spin?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.power?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.control?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.comfort?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.feel?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.durability?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-num">${c.stats.playability?.toFixed(0) || '—'}</td>
      <td class="opt-td opt-td-actions">
        <button class="opt-act-btn" title="View in Overview" onclick="optActionView(${idx})"><svg width="13" height="13" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="1" y="8.5" width="12.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.3"/></svg></button>
        <button class="opt-act-btn" title="Open in Tune" onclick="optActionTune(${idx})"><svg width="13" height="13" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" stroke-width="1.3"/><line x1="7.5" y1="1.5" x2="7.5" y2="4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="7.5" y1="11" x2="7.5" y2="13.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="1.5" y1="7.5" x2="4" y2="7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="11" y1="7.5" x2="13.5" y2="7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/></svg></button>
        <button class="opt-act-btn" title="Add to Compare" onclick="optActionCompare(${idx})"><svg width="13" height="13" viewBox="0 0 15 15" fill="none"><rect x="1" y="2.5" width="5" height="10" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="2.5" width="5" height="10" rx="1" stroke="currentColor" stroke-width="1.3"/><line x1="7.5" y1="5" x2="7.5" y2="10" stroke="currentColor" stroke-width="1.3" stroke-dasharray="1.5 1.5"/></svg></button>
        <button class="opt-act-btn" title="Save as Preset" onclick="optActionSave(${idx})"><svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M11.5 1H3.5A1.5 1.5 0 002 2.5v10A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0011.5 1z" stroke="currentColor" stroke-width="1.2"/><path d="M5 1v4h5V1" stroke="currentColor" stroke-width="1.2"/><path d="M5 10h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>
      </td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  resultsEl.innerHTML = html;
}

// --- Row action handlers ---

function _optBuildPresetData(candidate) {
  const c = candidate;
  if (c.type === 'hybrid') {
    return {
      id: 'opt-' + Date.now(),
      name: c.label + ' on ' + c.racquet.name,
      racquetId: c.racquet.id,
      isHybrid: true,
      mainsId: c.mainsData.id,
      crossesId: c.crossesData.id,
      mainsTension: c.tension,
      crossesTension: c.crossesTension,
      stringId: null
    };
  } else {
    return {
      id: 'opt-' + Date.now(),
      name: c.label + ' on ' + c.racquet.name,
      racquetId: c.racquet.id,
      isHybrid: false,
      mainsId: null,
      crossesId: null,
      mainsTension: c.tension,
      crossesTension: c.tension,
      stringId: c.stringData.id
    };
  }
}

function optActionView(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);
  loadPresetFromData(preset);
  switchMode('overview');
}

function optActionTune(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);
  loadPresetFromData(preset);
  switchMode('tune');
}

function optActionCompare(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);

  // Build a comparison slot from this candidate
  if (comparisonSlots.length >= 3) {
    comparisonSlots.pop(); // remove last to make room
  }
  const slotData = {
    id: Date.now(),
    racquetId: preset.racquetId,
    stringId: preset.stringId || '',
    isHybrid: preset.isHybrid,
    mainsId: preset.mainsId || '',
    crossesId: preset.crossesId || '',
    mainsTension: preset.mainsTension,
    crossesTension: preset.crossesTension,
    stats: null,
    identity: null
  };
  comparisonSlots.push(slotData);
  recalcSlot(comparisonSlots.length - 1);
  switchMode('compare');
  renderComparisonSlots();
  renderCompareSummaries();
  renderCompareVerdict();
  renderCompareMatrix();
  updateComparisonRadar();
}

function optActionSave(idx) {
  const c = _optLastCandidates[idx];
  if (!c) return;
  const preset = _optBuildPresetData(c);
  userPresets.push(preset);
  savePresetsToStorage();
  renderHomePresets();
  renderComparisonPresets();

  // Flash the save button in the row
  const btn = document.querySelector(`tr[data-opt-idx="${idx}"] .opt-act-btn:last-child`);
  if (btn) {
    btn.textContent = '✓';
    btn.classList.add('opt-act-saved');
    setTimeout(() => {
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M11.5 1H3.5A1.5 1.5 0 002 2.5v10A1.5 1.5 0 003.5 14h8a1.5 1.5 0 001.5-1.5v-10A1.5 1.5 0 0011.5 1z" stroke="currentColor" stroke-width="1.2"/><path d="M5 1v4h5V1" stroke="currentColor" stroke-width="1.2"/><path d="M5 10h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
      btn.classList.remove('opt-act-saved');
    }, 1200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  handleResponsiveHeader();
});

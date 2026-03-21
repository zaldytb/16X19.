// ============================================
// TENNIS LOADOUT LAB — Data + Engine + UI
// ============================================

// ============================================
// DATA: RACQUETS
// ============================================
const RACQUETS = [
  {
    id: "babolat-pure-aero-100-2023",
    name: "Babolat Pure Aero 100",
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
    name: "Head Speed MP 2024",
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
    name: "Head Speed MP Legend 2025",
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
    name: "Head Speed Pro Legend 2025",
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
    name: "Head Speed Pro 2024",
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
    name: "Wilson Blade 98 v8",
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
    name: "Babolat Pure Drive 2024",
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
    name: "Yonex EZONE 100 2024",
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
    name: "Wilson Pro Staff 97 v14",
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
    name: "Babolat Pure Aero 98 2026",
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
    name: "Babolat Pure Aero 100 2026",
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
    name: "Babolat Pure Aero Team 2026",
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
    name: "Head Speed MP 2026",
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
    name: "Head Speed Pro 2026",
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
    name: "Head Speed MP L 2026",
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
    name: "Yonex Muse 98 2026",
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
    name: "Yonex Muse 100 2026",
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
    name: "Yonex VCORE 100 2023",
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
    name: "Head Gravity Pro 2025",
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
    name: "Head Gravity Tour 2025",
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
    name: "Head Gravity MP 2025",
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
    name: "Wilson Shift 99",
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
    name: "Wilson Shift 99 L",
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
    name: "Wilson RF01 Pro",
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
    name: "Wilson RF01",
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
    name: "Babolat Pure Strike 97",
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
    name: "Babolat Pure Strike 98 16x19",
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
    name: "Babolat Pure Strike 98 18x20",
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
    name: "Babolat Pure Strike 100 16x19",
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
    name: "Solinco Whiteout v2 290",
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
    name: "Solinco Whiteout v2 305",
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
    name: "Solinco Blackout v2 300",
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
    name: "Solinco Blackout v2 285",
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
    id: "solinco-confidential-17",
    name: "Solinco Confidential",
    gauge: "17 (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Square/4-pointed edges",
    stiffness: 205,
    tensionLoss: 24,
    spinPotential: 7.0,
    twScore: { power: 48, spin: 92, comfort: 66, control: 90, feel: 85, playabilityDuration: 82, durability: 84 },
    identity: "Control Lockdown (Lite)",
    notes: "Thinner gauge: ~8% softer, marginally more spin access, slightly less durability. Better pocketing and comfort than 16g. Good for non-string-breakers who want more feel."
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
    id: "solinco-hyper-g-16l",
    name: "Solinco Hyper-G",
    gauge: "16L (1.25mm)",
    gaugeNum: 1.25,
    material: "Polyester",
    shape: "Pentagon/5-sided",
    stiffness: 218.3,
    tensionLoss: 24.7,
    spinPotential: 6.1,
    twScore: { power: 52, spin: 88, comfort: 65, control: 86, feel: 82, playabilityDuration: 76, durability: 82 },
    identity: "Spin Shredder (Lite)",
    notes: "16L version maintains stiffness but lower spin potential in TWU testing. Better tension maintenance than 16g counterpart."
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
    id: "babolat-rpm-blast-16",
    name: "Babolat RPM Blast",
    gauge: "16 (1.30mm)",
    gaugeNum: 1.30,
    material: "Polyester",
    shape: "Octagonal",
    stiffness: 233,
    tensionLoss: 45.9,
    spinPotential: 4.5,
    twScore: { power: 50, spin: 80, comfort: 55, control: 88, feel: 78, playabilityDuration: 68, durability: 88 },
    identity: "The Pro Standard (Tank)",
    notes: "16g version: similar stiffness but significantly more tension loss (46%). More durable but loses playability faster. Good for string breakers."
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
  {
    id: "solinco-tour-bite-17",
    name: "Solinco Tour Bite",
    gauge: "17 (1.20mm)",
    gaugeNum: 1.20,
    material: "Polyester",
    shape: "Pentagon/5-sided",
    stiffness: 181,
    tensionLoss: 35,
    spinPotential: 6.7,
    twScore: { power: 42, spin: 86, comfort: 56, control: 92, feel: 80, playabilityDuration: 68, durability: 78 },
    identity: "Thin Iron Maiden",
    notes: "17g (1.20mm) version of Tour Bite — softer than 16g (181 vs 203 lb/in). Less tension loss than 16g counterpart. Thinner gauge gives better ball pocketing and feel at the cost of durability. Shaped edges provide excellent bite and spin. Maximum control poly for players who don't break strings quickly."
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
// FRAME METADATA — captures what raw specs can't
// Per-frame adjustments for technology, aero, generation improvements
// Scale: 0 = none, 0.5 = minor, 1 = moderate, 1.5 = significant, 2+ = exceptional
// ============================================
const FRAME_META = {
  // Babolat Pure Aero family
  'babolat-pure-aero-100-2023': {
    aeroBonus: 0, comfortTech: 0, spinTech: 0.5, genBonus: 0
  },
  'babolat-pure-aero-98-2026': {
    aeroBonus: 1, comfortTech: 1.5, spinTech: 0.5, genBonus: 1
  },
  'babolat-pure-aero-100-2026': {
    aeroBonus: 1.5, comfortTech: 1.5, spinTech: 1, genBonus: 1.5
  },
  'babolat-pure-aero-team-2026': {
    aeroBonus: 1.5, comfortTech: 1.5, spinTech: 1, genBonus: 1
  },
  // Head Speed family
  'head-speed-mp-2024': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'head-speed-mp-legend-2025': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1
  },
  'head-speed-pro-legend-2025': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1
  },
  'head-speed-pro-2024': {
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0
  },
  'head-speed-mp-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 0, genBonus: 1.5
  },
  'head-speed-pro-2026': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1.5
  },
  'head-speed-mp-l-2026': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 1
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
  // Yonex EZONE
  'yonex-ezone-100-2024': {
    aeroBonus: 0, comfortTech: 1.5, spinTech: 0, genBonus: 0
  },
  // Wilson Pro Staff
  'wilson-pro-staff-97-v14': {
    aeroBonus: 0, comfortTech: 0.5, spinTech: 0, genBonus: 0
  },
  // Yonex Muse
  'yonex-muse-98-2026': {
    aeroBonus: 0, comfortTech: 2, spinTech: 1, genBonus: 1.5
  },
  'yonex-muse-100-2026': {
    aeroBonus: 0, comfortTech: 2.5, spinTech: 1, genBonus: 1.5
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
    aeroBonus: 0, comfortTech: 1, spinTech: 0, genBonus: 0.5
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
  if (stringData.material === 'Natural Gut') feel += 5; // gut has unmatched feel
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

  // --- Final clamp: nothing below 25, nothing above 92 for base string ---
  const capLow = 25, capHigh = 92;
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

  // Layer 2 mods are intentionally smaller than Layer 1 adjustments.
  // Stiffness already shapes the string profile (L1); these mods capture
  // how that stiffness interacts with the frame (e.g., dampening, flex coupling).
  // Scaled to ~60% of original magnitudes to reduce stiffness double-counting.
  return {
    powerMod: stiffNorm * 5 - 2,        // soft: up to +3, stiff: -2
    spinMod: (spinPot - 6.0) * 2,        // centered at 6.0, ±2 per point (was 3)
    controlMod: (1 - stiffNorm) * 4 - 1.5, // stiff: up to +2.5, soft: -1.5
    comfortMod: stiffNorm * 4.5 - 1.5,   // soft: up to +3, stiff: -1.5
    feelMod: stringData.material === 'Natural Gut' ? 5 : (stiffNorm * 3 - 1),
    launchMod: stiffNorm * 2 - 0.5       // soft strings add slight launch
  };
}

function calcTensionModifier(tension, tensionRange) {
  const mid = (tensionRange[0] + tensionRange[1]) / 2;
  const diff = tension - mid;
  // Every 2 lbs above midpoint: +2 control, -2 power
  const factor = diff / 2;

  return {
    powerMod: -factor * 2,
    controlMod: factor * 2,
    launchMod: -factor * 1.5,
    comfortMod: -factor * 1.5,
    spinMod: -Math.abs(factor) * 0.4,
    // Higher tension → crisper ball feedback → more feel (mild)
    feelMod: factor * 1.0,
    // Higher tension → faster tension loss → slightly shorter playability window
    playabilityMod: -Math.abs(factor) * 0.6
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

function predictSetup(racquet, stringConfig) {
  const frameBase = calcFrameBase(racquet);

  let stringMod, stringProfile;
  let avgTension;

  if (stringConfig.isHybrid) {
    const mainsMod = calcStringFrameMod(stringConfig.mains);
    const crossesMod = calcStringFrameMod(stringConfig.crosses);
    const mainsProfile = calcBaseStringProfile(stringConfig.mains);
    const crossesProfile = calcBaseStringProfile(stringConfig.crosses);

    // Mains-weighted for power/comfort/feel/spin, crosses-weighted for control
    stringMod = {
      powerMod: mainsMod.powerMod * 0.7 + crossesMod.powerMod * 0.3,
      spinMod: mainsMod.spinMod * 0.7 + crossesMod.spinMod * 0.3,
      controlMod: mainsMod.controlMod * 0.3 + crossesMod.controlMod * 0.7,
      comfortMod: mainsMod.comfortMod * 0.7 + crossesMod.comfortMod * 0.3,
      feelMod: mainsMod.feelMod * 0.7 + crossesMod.feelMod * 0.3,
      launchMod: mainsMod.launchMod * 0.7 + crossesMod.launchMod * 0.3
    };

    // Blend string profiles: mains dominant for most, crosses for durability
    stringProfile = {
      power: mainsProfile.power * 0.7 + crossesProfile.power * 0.3,
      spin: mainsProfile.spin * 0.6 + crossesProfile.spin * 0.4,
      control: mainsProfile.control * 0.4 + crossesProfile.control * 0.6,
      feel: mainsProfile.feel * 0.7 + crossesProfile.feel * 0.3,
      comfort: mainsProfile.comfort * 0.7 + crossesProfile.comfort * 0.3,
      durability: mainsProfile.durability * 0.4 + crossesProfile.durability * 0.6,
      playability: mainsProfile.playability * 0.6 + crossesProfile.playability * 0.4
    };

    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  } else {
    stringMod = calcStringFrameMod(stringConfig.string);
    stringProfile = calcBaseStringProfile(stringConfig.string);
    stringMod.launchMod = stringMod.launchMod || 0;
    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  }

  const tensionMod = calcTensionModifier(avgTension, racquet.tensionRange);

  // --- Blend: frame base (primary) + string mod + tension mod ---
  // Frame-driven stats: frame is ~70% weight, string profile ~20%, mods ~10%
  const FW = 0.65; // frame weight
  const SW = 0.35; // string profile weight

  const stats = {
    spin:    clamp(frameBase.spin * FW + stringProfile.spin * SW + stringMod.spinMod + tensionMod.spinMod),
    power:   clamp(frameBase.power * FW + stringProfile.power * SW + stringMod.powerMod + tensionMod.powerMod),
    control: clamp(frameBase.control * FW + stringProfile.control * SW + stringMod.controlMod + tensionMod.controlMod),
    launch:  clamp(frameBase.launch + stringMod.launchMod + tensionMod.launchMod),
    feel:    clamp(frameBase.feel * FW + stringProfile.feel * SW + stringMod.feelMod + tensionMod.feelMod),
    comfort: clamp(frameBase.comfort * FW + stringProfile.comfort * SW + stringMod.comfortMod + tensionMod.comfortMod),
    stability:   clamp(frameBase.stability),
    forgiveness: clamp(frameBase.forgiveness),
    // String-only stats: from string profile, with tension influence
    durability:  clamp(stringProfile.durability),
    playability: clamp(stringProfile.playability + tensionMod.playabilityMod)
  };

  // Attach debug info for inspection
  stats._debug = { frameBase, stringProfile, stringMod, tensionMod, _frameDebug: frameBase._frameDebug };

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
  if (stats.forgiveness >= 65) bestFor.push('Developing players building consistency');
  if (stats.playability >= 80) bestFor.push('Frequent players (3+ times/week)');

  if (bestFor.length === 0) bestFor.push('Versatile all-court players');

  if (stats.power <= 40) watchOut.push('Players who need free power from the frame');
  if (stats.comfort <= 45) watchOut.push('Players with arm/elbow issues — too stiff');
  if (stats.control <= 50) watchOut.push('Players who need help keeping the ball in');
  if (stats.spin <= 50) watchOut.push('Heavy topspin players — limited spin access');
  if (stats.forgiveness <= 45) watchOut.push('Beginners — small effective sweet spot');
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
const scrollPositions = { overview: 0, tune: 0, compare: 0, howitworks: 0 };
let _compareInitialized = false;
let _tuneInitialized = false;

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
    populateGaugeDropdown(document.getElementById('gauge-display-mains'), preset.mainsId);
    $('#input-tension-mains').value = preset.mainsTension;
    ssInstances['select-string-crosses']?.setValue(preset.crossesId);
    populateGaugeDropdown(document.getElementById('gauge-display-crosses'), preset.crossesId);
    $('#input-tension-crosses').value = preset.crossesTension;
  } else {
    setHybridMode(false);
    ssInstances['select-string-full']?.setValue(preset.stringId);
    populateGaugeDropdown(document.getElementById('gauge-display-full'), preset.stringId);
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

const STAT_KEYS = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'durability', 'playability'];
const STAT_LABELS = ['Spin', 'Power', 'Control', 'Launch', 'Feel', 'Comfort', 'Stability', 'Forgiveness', 'Durability', 'Playability'];
const STAT_LABELS_FULL = ['Spin', 'Power', 'Control', 'Launch', 'Feel', 'Comfort', 'Stability', 'Forgiveness', 'Durability', 'Playability Duration'];
const STAT_CSS_CLASSES = ['spin', 'power', 'control', 'launch', 'feel', 'comfort', 'stability', 'forgiveness', 'durability', 'playability'];

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
      return s ? `${s.name} ${s.gauge}` : '';
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
        primaryText = item.name;
        secondaryText = item.year ? String(item.year) : '';
        badgeHTML = '';
      } else {
        searchText = `${item.name} ${item.gauge} ${item.material || ''} ${item.gaugeNum || ''}`.toLowerCase();
        groupKey = item.name.split(' ')[0];
        primaryText = item.name;
        secondaryText = item.gauge;
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
        // Single-line layout for racquets (unchanged)
        opt.innerHTML = `
          <span class="ss-opt-primary">${primaryText}</span>
          ${badgeHTML}
          <span class="ss-opt-secondary">${secondaryText}</span>
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
  if (!stringId) {
    el.textContent = '—';
    return;
  }
  const s = STRINGS.find(x => x.id === stringId);
  el.textContent = s ? s.gauge : '—';
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

    return {
      racquet,
      stringConfig: {
        isHybrid: true,
        mains: STRINGS.find(s => s.id === mainsId),
        crosses: STRINGS.find(s => s.id === crossesId),
        mainsTension: parseInt($('#input-tension-mains').value) || 55,
        crossesTension: parseInt($('#input-tension-crosses').value) || 53
      }
    };
  } else {
    const stringId = ssInstances['select-string-full']?.getValue() || '';
    if (!stringId) return null;

    return {
      racquet,
      stringConfig: {
        isHybrid: false,
        string: STRINGS.find(s => s.id === stringId),
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

function computeCompositeScore(stats) {
  // Full 10-stat weighted composite — every modeled stat contributes.
  // Core performance: control, spin, power, comfort — 58%
  // Feel & playability: feel, playability — 18%
  // Frame qualities: stability, forgiveness — 16%
  // Trajectory & longevity: launch, durability — 8%
  const raw = stats.control * 0.18
            + stats.spin * 0.14
            + stats.comfort * 0.14
            + stats.power * 0.12
            + stats.feel * 0.12
            + stats.stability * 0.08
            + stats.forgiveness * 0.08
            + stats.playability * 0.06
            + stats.launch * 0.04
            + stats.durability * 0.04;
  // Rescale: the raw weighted average clusters in a narrow band (~59–68)
  // because individual stats are already compressed to ~45–85.
  // Map to a wider 0–100 display scale so the OBS rank ladder is meaningful.
  // Anchor: 58 → 30 (poor), 63 → 60 (mid), 67 → 85 (elite)
  const scaled = 30 + (raw - 58) * (55 / 9); // ~6.11 display pts per raw pt
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
  renderOCRating(stats, identity);
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

function renderOCRating(stats, identity) {
  const el = $('#oc-rating');
  const score = computeCompositeScore(stats);
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
    const obsScore = computeCompositeScore(slot.stats).toFixed(1);
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

  // Score each tension using the full 10-stat composite
  const scored = data.map(d => {
    const s = d.stats;
    const score = computeCompositeScore(s);
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
  const score = computeCompositeScore(stats);
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

  // Identify the current string to exclude from candidates
  let currentStringId = null;
  if (!stringConfig.isHybrid && stringConfig.string) {
    currentStringId = stringConfig.string.id;
  }

  // Filter out the current string and compute deltas for each candidate
  const scored = allCandidates
    .filter(c => c.string.id !== currentStringId)
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
  const more = scored.find(c => c.string.id !== closest.string.id) || scored[0];

  // Step 3: Pick Corrective Move — penalize candidates similar to both previous picks
  for (const c of scored) {
    const simClosest = candidateSimilarity(c.stats, closest.stats);
    const simMore = candidateSimilarity(c.stats, more.stats);
    if (simClosest < 6) c.correctiveScore -= DISTINCTNESS_PENALTY;
    if (simMore < 6) c.correctiveScore -= DISTINCTNESS_PENALTY;
  }
  scored.sort((a, b) => b.correctiveScore - a.correctiveScore);
  const corrective = scored.find(c => c.string.id !== closest.string.id && c.string.id !== more.string.id) || scored[0];

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
          <div class="wttn-build-name">${pick.string.name} <span class="wttn-gauge">${pick.string.gauge}</span></div>
          <span class="wttn-build-tension">${pick.tension} lbs</span>
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

  // Score every string in the DB for this frame at its optimal tension
  const candidates = [];
  const midTension = Math.round((racquet.tensionRange[0] + racquet.tensionRange[1]) / 2);
  const sweepMin = Math.max(racquet.tensionRange[0] - 3, 30);
  const sweepMax = Math.min(racquet.tensionRange[1] + 3, 75);

  STRINGS.forEach(s => {
    // Run a mini-sweep for each string to find its peak composite tension
    let bestScore = -1;
    let bestTension = midTension;
    let bestStats = null;

    for (let t = sweepMin; t <= sweepMax; t += 1) {
      const cfg = { isHybrid: false, string: s, mainsTension: t, crossesTension: t };
      const stats = predictSetup(racquet, cfg);
      if (!stats) continue;
      const score = computeCompositeScore(stats);
      if (score > bestScore) {
        bestScore = score;
        bestTension = t;
        bestStats = stats;
      }
    }

    if (bestStats) {
      candidates.push({
        string: s,
        tension: bestTension,
        score: bestScore,
        stats: bestStats
      });
    }
  });

  // Sort by score descending, take top 5
  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, 5);

  // Identify current string
  let currentStringId = null;
  if (!stringConfig.isHybrid && stringConfig.string) {
    currentStringId = stringConfig.string.id;
  }

  const isCurrentInTop = currentStringId && top.some(c => c.string.id === currentStringId);

  container.innerHTML = `
    <div class="recs-list">
      ${top.map((c, i) => {
        const isCurrent = currentStringId === c.string.id;
        return `
          <div class="recs-item ${isCurrent ? 'recs-item-current' : ''}">
            <div class="recs-rank">${i + 1}</div>
            <div class="recs-info">
              <div class="recs-name">${c.string.name} <span class="recs-gauge">${c.string.gauge}</span></div>
              <div class="recs-meta">
                <span class="recs-material">${c.string.material}</span>
                <span class="recs-tension-rec">${c.tension} lbs</span>
                ${isCurrent ? '<span class="recs-badge-current">CURRENT</span>' : ''}
              </div>
            </div>
            <div class="recs-scores">
              <span class="recs-score-item" title="Control">CTL ${c.stats.control}</span>
              <span class="recs-score-item" title="Comfort">CMF ${c.stats.comfort}</span>
              <span class="recs-score-item" title="Spin">SPN ${c.stats.spin}</span>
              <span class="recs-score-item" title="Power">PWR ${c.stats.power}</span>
            </div>
            <div class="recs-composite">
              <span class="recs-composite-value">${c.score.toFixed(1)}</span>
              <span class="recs-composite-label">Score</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <p class="recs-footnote">Composite score across all 10 stats, evaluated at optimal tension for <strong>${racquet.name}</strong>.</p>
  `;

  // Show "Try a Different String" section if current string isn't in top 5
  renderExplorePrompt(setup, isCurrentInTop, top);

  // Render What To Try Next using the full candidates list
  renderWhatToTryNext(setup, candidates);
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
    populateGaugeDropdown(document.getElementById('gauge-display-mains'), slot.mainsId);
    $('#input-tension-mains').value = slot.mainsTension;
    ssInstances['select-string-crosses']?.setValue(slot.crossesId);
    populateGaugeDropdown(document.getElementById('gauge-display-crosses'), slot.crossesId);
    $('#input-tension-crosses').value = slot.crossesTension;
  } else {
    setHybridMode(false);
    ssInstances['select-string-full']?.setValue(slot.stringId);
    populateGaugeDropdown(document.getElementById('gauge-display-full'), slot.stringId);
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

document.addEventListener('DOMContentLoaded', () => {
  init();
  handleResponsiveHeader();
});

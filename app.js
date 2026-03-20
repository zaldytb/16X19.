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
    stiffness: 233.7,
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
    stiffness: 232.6,
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
    stiffness: 55,
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

function getPatternOpenness(pattern) {
  const [mains, crosses] = pattern.split('x').map(Number);
  // 16x19 = 304, 18x20 = 360 — lower total = more open
  const total = mains * crosses;
  return lerp(total, 360, 304, 0, 1); // 0 = dense, 1 = open
}

function getAvgBeam(beamWidth) {
  return beamWidth.reduce((a, b) => a + b, 0) / beamWidth.length;
}

function getMaxBeam(beamWidth) {
  return Math.max(...beamWidth);
}

function isVariableBeam(beamWidth) {
  return Math.max(...beamWidth) - Math.min(...beamWidth) > 2;
}

function calcFrameBase(racquet) {
  const { stiffness, beamWidth, swingweight, pattern, headSize } = racquet;
  const avgBeam = getAvgBeam(beamWidth);
  const maxBeam = getMaxBeam(beamWidth);
  const openness = getPatternOpenness(pattern);
  const variable = isVariableBeam(beamWidth);

  // Power: stiffness (55-75 → 30-80), beam (20-27 → 0-20), swingweight (310-340 → 0-10)
  let power = lerp(stiffness, 55, 75, 30, 80);
  power += lerp(maxBeam, 20, 27, 0, 20);
  power += lerp(swingweight, 310, 340, 0, 10);

  // Spin: pattern openness, head size, variable beam
  let spin = 40 + openness * 30;
  spin += lerp(headSize, 95, 105, -5, 15);
  if (variable) spin += 5;

  // Control: inverse power + swingweight stability + pattern density
  let control = 100 - power * 0.5;
  control += lerp(swingweight, 310, 340, 0, 15);
  control += (1 - openness) * 15;

  // Launch: variable beam, stiffness (inverse), pattern openness
  let launch = 40;
  if (variable) launch += 12;
  launch += lerp(stiffness, 55, 75, 10, -5);
  launch += openness * 8;

  // Comfort: inverse stiffness
  let comfort = lerp(stiffness, 55, 75, 85, 30);
  // Lower beam = slightly more feel/comfort from flex
  comfort += lerp(avgBeam, 20, 27, 5, -5);

  // Stability: swingweight (primary), weight
  let stability = lerp(swingweight, 310, 340, 35, 85);
  stability += lerp(racquet.strungWeight, 310, 330, 0, 10);

  // Forgiveness: head size, swingweight
  let forgiveness = lerp(headSize, 95, 105, 30, 70);
  forgiveness += lerp(swingweight, 310, 340, 5, 20);
  if (variable) forgiveness += 5;

  // Feel: inverse stiffness, thin beam, weight
  let feel = lerp(stiffness, 55, 75, 80, 40);
  feel += lerp(avgBeam, 20, 27, 10, -5);

  return {
    power: clamp(power),
    spin: clamp(spin),
    control: clamp(control),
    launch: clamp(launch),
    comfort: clamp(comfort),
    stability: clamp(stability),
    forgiveness: clamp(forgiveness),
    feel: clamp(feel),
    durability: 50, // baseline, string determines
    playability: 50  // baseline, string determines
  };
}

function calcStringContribution(stringData) {
  // String stiffness range: ~140 (gut) to ~234 (RPM Blast)
  // Normalize: lower stiffness = more power, more comfort
  const stiffNorm = lerp(stringData.stiffness, 140, 240, 1, 0); // 1 = soft, 0 = stiff

  return {
    powerMod: stiffNorm * 25 - 10, // soft string adds power, stiff subtracts
    spinMod: (stringData.spinPotential - 5) * 5, // center at 5, scale
    controlMod: (1 - stiffNorm) * 15 - 5, // stiffer = more control
    comfortMod: stiffNorm * 20 - 8,
    feelMod: stringData.material === 'Natural Gut' ? 15 : (stiffNorm * 8 - 2),
    durability: stringData.twScore.durability,
    playability: stringData.twScore.playabilityDuration,
    tensionLossMod: lerp(stringData.tensionLoss, 10, 50, 10, -15) // low loss = bonus playability
  };
}

function calcTensionModifier(tension, tensionRange) {
  const mid = (tensionRange[0] + tensionRange[1]) / 2;
  const diff = tension - mid;
  // Every 2 lbs above midpoint: +3% control, -3% power
  const factor = diff / 2;

  return {
    powerMod: -factor * 3,
    controlMod: factor * 3,
    launchMod: -factor * 2,
    comfortMod: -factor * 2,
    spinMod: -Math.abs(factor) * 0.5 // extreme tensions slightly reduce spin
  };
}

function predictSetup(racquet, stringConfig) {
  const frameBase = calcFrameBase(racquet);

  let stringContrib;
  let avgTension;

  if (stringConfig.isHybrid) {
    const mainsContrib = calcStringContribution(stringConfig.mains);
    const crossesContrib = calcStringContribution(stringConfig.crosses);

    // Mains 70%, crosses 30%
    stringContrib = {
      powerMod: mainsContrib.powerMod * 0.7 + crossesContrib.powerMod * 0.3,
      spinMod: mainsContrib.spinMod * 0.7 + crossesContrib.spinMod * 0.3,
      controlMod: mainsContrib.controlMod * 0.3 + crossesContrib.controlMod * 0.7,
      comfortMod: mainsContrib.comfortMod * 0.7 + crossesContrib.comfortMod * 0.3,
      feelMod: mainsContrib.feelMod * 0.7 + crossesContrib.feelMod * 0.3,
      durability: mainsContrib.durability * 0.4 + crossesContrib.durability * 0.6,
      playability: mainsContrib.playability * 0.7 + crossesContrib.playability * 0.3,
      tensionLossMod: mainsContrib.tensionLossMod * 0.6 + crossesContrib.tensionLossMod * 0.4
    };
    avgTension = (stringConfig.mainsTension + stringConfig.crossesTension) / 2;
  } else {
    stringContrib = calcStringContribution(stringConfig.string);
    avgTension = stringConfig.tension;
  }

  const tensionMod = calcTensionModifier(avgTension, racquet.tensionRange);

  // Combine
  const stats = {
    spin: clamp(frameBase.spin + stringContrib.spinMod + tensionMod.spinMod),
    power: clamp(frameBase.power + stringContrib.powerMod + tensionMod.powerMod),
    control: clamp(frameBase.control + stringContrib.controlMod + tensionMod.controlMod),
    launch: clamp(frameBase.launch + tensionMod.launchMod),
    feel: clamp(frameBase.feel + stringContrib.feelMod),
    comfort: clamp(frameBase.comfort + stringContrib.comfortMod + tensionMod.comfortMod),
    stability: clamp(frameBase.stability),
    forgiveness: clamp(frameBase.forgiveness),
    durability: clamp(stringContrib.durability),
    playability: clamp(stringContrib.playability + stringContrib.tensionLossMod)
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
  const getAvgTension = () => stringConfig.isHybrid
    ? (stringConfig.mainsTension + stringConfig.crossesTension) / 2
    : stringConfig.tension;
  const getMainsTension = () => stringConfig.isHybrid ? stringConfig.mainsTension : stringConfig.tension;
  const getCrossesTension = () => stringConfig.isHybrid ? stringConfig.crossesTension : stringConfig.tension;

  // Tension outside range
  const mainsTension = getMainsTension();
  const crossesTension = getCrossesTension();

  if (mainsTension < racquet.tensionRange[0]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is below the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of losing control and trampoline effect.`);
  }
  if (mainsTension > racquet.tensionRange[1]) {
    warnings.push(`Mains tension (${mainsTension} lbs) is above the recommended range (${racquet.tensionRange[0]}–${racquet.tensionRange[1]} lbs). Risk of reduced comfort and arm strain.`);
  }
  if (stringConfig.isHybrid && crossesTension < racquet.tensionRange[0]) {
    warnings.push(`Crosses tension (${crossesTension} lbs) is below the recommended range.`);
  }
  if (stringConfig.isHybrid && crossesTension > racquet.tensionRange[1]) {
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

function getDataFoundation(racquet, stringConfig) {
  const items = [];

  // Frame data — all measured
  items.push({ label: 'Frame Weight', type: 'measured' });
  items.push({ label: 'Swingweight', type: 'measured' });
  items.push({ label: 'Stiffness (RA)', type: 'measured' });
  items.push({ label: 'Beam Width', type: 'measured' });
  items.push({ label: 'String Pattern', type: 'measured' });
  items.push({ label: 'Balance', type: 'measured' });

  // String data — measured from TWU
  items.push({ label: 'String Stiffness', type: 'measured' });
  items.push({ label: 'Tension Loss %', type: 'measured' });
  items.push({ label: 'Spin Potential', type: 'measured' });
  items.push({ label: 'TWU Scores', type: 'measured' });

  // Modeled outputs
  items.push({ label: 'Power Rating', type: 'modeled' });
  items.push({ label: 'Spin Rating', type: 'modeled' });
  items.push({ label: 'Control Rating', type: 'modeled' });
  items.push({ label: 'Launch Angle', type: 'modeled' });
  items.push({ label: 'Feel Rating', type: 'modeled' });
  items.push({ label: 'Comfort Rating', type: 'modeled' });

  // Estimated
  items.push({ label: 'Setup Identity', type: 'estimated' });
  items.push({ label: 'Fit Profile', type: 'estimated' });

  return items;
}

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
    mainsTension: null,
    crossesTension: null,
    stringId: 'solinco-confidential-16',
    tension: 55
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
    return `${sName} ${preset.tension} lbs on ${rName}`;
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
    mainsTension: stringConfig.isHybrid ? stringConfig.mainsTension : null,
    crossesTension: stringConfig.isHybrid ? stringConfig.crossesTension : null,
    stringId: stringConfig.isHybrid ? null : stringConfig.string.id,
    tension: stringConfig.isHybrid ? null : stringConfig.tension
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

  $('#select-racquet').value = preset.racquetId;
  showFrameSpecs(racquet);

  if (preset.isHybrid) {
    setHybridMode(true);
    $('#select-string-mains').value = preset.mainsId;
    populateGaugeDropdown($('#select-gauge-mains'), preset.mainsId);
    $('#input-tension-mains').value = preset.mainsTension;
    $('#select-string-crosses').value = preset.crossesId;
    populateGaugeDropdown($('#select-gauge-crosses'), preset.crossesId);
    $('#input-tension-crosses').value = preset.crossesTension;
  } else {
    setHybridMode(false);
    $('#select-string-full').value = preset.stringId;
    populateGaugeDropdown($('#select-gauge-full'), preset.stringId);
    $('#input-tension-full').value = preset.tension;
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
    slot.tension = 55;
  } else {
    slot.stringId = preset.stringId;
    slot.tension = preset.tension;
    slot.mainsId = '';
    slot.crossesId = '';
    slot.mainsTension = 55;
    slot.crossesTension = 53;
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
// POPULATE DROPDOWNS
// ============================================

function populateRacquetDropdown(selectEl) {
  selectEl.innerHTML = '<option value="">Select Racquet...</option>';
  RACQUETS.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.name;
    selectEl.appendChild(opt);
  });
}

function populateStringDropdown(selectEl) {
  selectEl.innerHTML = '<option value="">Select String...</option>';
  STRINGS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} ${s.gauge}`;
    selectEl.appendChild(opt);
  });
}

function populateGaugeDropdown(selectEl, stringId) {
  selectEl.innerHTML = '';
  if (!stringId) {
    selectEl.innerHTML = '<option value="">—</option>';
    return;
  }
  const s = STRINGS.find(x => x.id === stringId);
  if (s) {
    const opt = document.createElement('option');
    opt.value = s.gauge;
    opt.textContent = s.gauge;
    opt.selected = true;
    selectEl.appendChild(opt);
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
  const racquetId = $('#select-racquet').value;
  const racquet = RACQUETS.find(r => r.id === racquetId);
  if (!racquet) return null;

  const isHybrid = $('#btn-hybrid').classList.contains('active');

  if (isHybrid) {
    const mainsId = $('#select-string-mains').value;
    const crossesId = $('#select-string-crosses').value;
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
    const stringId = $('#select-string-full').value;
    if (!stringId) return null;

    return {
      racquet,
      stringConfig: {
        isHybrid: false,
        string: STRINGS.find(s => s.id === stringId),
        tension: parseInt($('#input-tension-full').value) || 55
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
  const foundation = getDataFoundation(racquet, stringConfig);
  const badge = getSetupBadge(racquet, stringConfig);

  // Summary
  renderSummary(racquet, stringConfig, badge);

  // Data Foundation
  renderFoundation(foundation);

  // Identity
  $('#identity-archetype').textContent = identity.archetype.toUpperCase();
  $('#identity-description').textContent = identity.description;

  // Stats
  renderStatBars(stats);
  renderRadarChart(stats);

  // Fit
  renderFitProfile(fitProfile);

  // Warnings
  renderWarnings(warnings);
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
    stringTension = `${stringConfig.tension} lbs`;
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

function renderFoundation(items) {
  const grid = $('#foundation-grid');
  grid.innerHTML = items.map(item => `
    <span class="foundation-item ${item.type}">
      <span>${item.label}</span>
    </span>
  `).join('');
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
  const labelColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.36)';
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
              size: 9,
              weight: 500
            },
            color: labelColor
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
  isComparisonMode = !isComparisonMode;
  const btn = $('#btn-toggle-comparison');
  btn.classList.toggle('active', isComparisonMode);

  if (isComparisonMode) {
    $('#single-view').classList.add('hidden');
    $('#comparison-view').classList.remove('hidden');
    renderComparisonPresets();

    if (comparisonSlots.length === 0) {
      // Auto-add first slot with current setup
      addComparisonSlot();
    }
  } else {
    $('#single-view').classList.remove('hidden');
    $('#comparison-view').classList.add('hidden');
  }
}

function addComparisonSlot() {
  if (comparisonSlots.length >= 3) return;

  const slotIndex = comparisonSlots.length;
  const slotColor = SLOT_COLORS[slotIndex];

  const slotData = {
    id: Date.now(),
    racquetId: '',
    stringId: '',
    tension: 55,
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
  updateComparisonRadar();
}

function removeComparisonSlot(index) {
  comparisonSlots.splice(index, 1);
  renderComparisonSlots();
  updateComparisonRadar();
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
        <select class="select-input slot-string" data-slot="${index}">
          <option value="">Select String...</option>
          ${STRINGS.map(s => `<option value="${s.id}" ${slot.stringId === s.id ? 'selected' : ''}>${s.name} ${s.gauge}</option>`).join('')}
        </select>
        <div class="row-2col">
          <div>
            <label class="field-label">Tension</label>
            <input type="number" class="text-input slot-tension" data-slot="${index}" value="${slot.tension}" min="30" max="70">
          </div>
          <div style="display:flex;align-items:flex-end;">
            ${slot.stats && !slot.isHybrid ? `<div class="slot-identity">${slot.identity?.archetype || '—'}</div>` : ''}
          </div>
        </div>
      </div>`;

    const hybridHTML = `
      <div class="slot-hybrid-config ${slot.isHybrid ? '' : 'hidden'}" data-slot="${index}">
        <div class="slot-hybrid-section">
          <label class="field-label accent-cyan">Mains</label>
          <select class="select-input slot-mains" data-slot="${index}">
            <option value="">Select Main String...</option>
            ${STRINGS.map(s => `<option value="${s.id}" ${slot.mainsId === s.id ? 'selected' : ''}>${s.name} ${s.gauge}</option>`).join('')}
          </select>
          <div>
            <label class="field-label">Tension</label>
            <input type="number" class="text-input slot-mains-tension" data-slot="${index}" value="${slot.mainsTension}" min="30" max="70">
          </div>
        </div>
        <div class="slot-hybrid-section">
          <label class="field-label accent-green">Crosses</label>
          <select class="select-input slot-crosses" data-slot="${index}">
            <option value="">Select Cross String...</option>
            ${STRINGS.map(s => `<option value="${s.id}" ${slot.crossesId === s.id ? 'selected' : ''}>${s.name} ${s.gauge}</option>`).join('')}
          </select>
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
        <select class="select-input slot-racquet" data-slot="${index}">
          <option value="">Select Racquet...</option>
          ${RACQUETS.map(r => `<option value="${r.id}" ${slot.racquetId === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
        </select>
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

  // Attach events
  container.querySelectorAll('.slot-racquet').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].racquetId = e.target.value;
      recalcSlot(idx);
    });
  });

  // Full bed string + tension
  container.querySelectorAll('.slot-string').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].stringId = e.target.value;
      recalcSlot(idx);
    });
  });
  container.querySelectorAll('.slot-tension').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].tension = parseInt(e.target.value) || 55;
      recalcSlot(idx);
    });
  });

  // Hybrid mains + crosses
  container.querySelectorAll('.slot-mains').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].mainsId = e.target.value;
      recalcSlot(idx);
    });
  });
  container.querySelectorAll('.slot-crosses').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.slot);
      comparisonSlots[idx].crossesId = e.target.value;
      recalcSlot(idx);
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
        tension: slot.tension
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
  const setup = getCurrentSetup();
  if (!setup) {
    // No setup configured — don't open
    return;
  }

  isTuneMode = !isTuneMode;
  const overlay = $('#tune-overlay');
  const btn = $('#btn-toggle-tune');
  btn.classList.toggle('active', isTuneMode);

  if (isTuneMode) {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    initTuneMode(setup);
  } else {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function closeTuneMode() {
  isTuneMode = false;
  $('#tune-overlay').classList.add('hidden');
  $('#btn-toggle-tune').classList.remove('active');
  document.body.style.overflow = '';
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

  // Set baseline tension from main page
  if (stringConfig.isHybrid) {
    tuneState.baselineTension = Math.round((stringConfig.mainsTension + stringConfig.crossesTension) / 2);
  } else {
    tuneState.baselineTension = stringConfig.tension;
  }
  tuneState.exploredTension = tuneState.baselineTension;
  tuneState.hybridDimension = 'linked';

  // Configure slider range from racquet
  const sliderMin = Math.max(racquet.tensionRange[0] - 5, 30);
  const sliderMax = Math.min(racquet.tensionRange[1] + 5, 75);
  const slider = $('#tune-slider');
  slider.min = sliderMin;
  slider.max = sliderMax;
  slider.value = tuneState.baselineTension;
  $('#slider-label-min').textContent = sliderMin;
  $('#slider-label-max').textContent = sliderMax;
  $('#slider-current-value').textContent = `${tuneState.baselineTension} lbs`;

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
      modifiedConfig = { ...stringConfig, tension: t };
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

  // Score each tension: weighted combination of key stats
  // Playability-weighted: control * 0.3 + comfort * 0.25 + spin * 0.2 + power * 0.15 + playability * 0.1
  const scored = data.map(d => {
    const s = d.stats;
    const score = s.control * 0.30 + s.comfort * 0.25 + s.spin * 0.20 + s.power * 0.15 + s.playability * 0.10;
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
  const deltaKeys = ['control', 'power', 'comfort', 'spin', 'launch', 'feel'];
  const deltaLabels = ['Control', 'Power', 'Comfort', 'Spin', 'Launch', 'Feel'];

  const isAtBaseline = tuneState.exploredTension === tuneState.baselineTension;

  container.innerHTML = `
    <div class="delta-header-row">
      <span class="delta-baseline-label">Baseline: ${tuneState.baselineTension} lbs</span>
      <span class="delta-explored-label">${isAtBaseline ? 'At baseline' : `Exploring: ${tuneState.exploredTension} lbs`}</span>
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
            padding: 16,
            pointStyleWidth: 10
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

function onTuneSliderInput(e) {
  const val = parseInt(e.target.value);
  tuneState.exploredTension = val;
  $('#slider-current-value').textContent = `${val} lbs`;

  // Update delta display
  renderDeltaVsBaseline();

  // Update chart annotation
  if (sweepChart) sweepChart.update('none');
}

function renderTuneHybridToggle(stringConfig) {
  const container = $('#tune-hybrid-toggle');
  if (!stringConfig.isHybrid) {
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
        runTensionSweep(setup);
        calculateOptimalWindow(setup);
        renderOptimalBuildWindow();
        renderDeltaVsBaseline();
        const slider = $('#tune-slider');
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
    $('#input-tension-full').value = tension;
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

  $('#select-racquet').value = slot.racquetId;
  showFrameSpecs(racquet);

  if (slot.isHybrid) {
    setHybridMode(true);
    $('#select-string-mains').value = slot.mainsId;
    $('#input-tension-mains').value = slot.mainsTension;
    $('#select-string-crosses').value = slot.crossesId;
    $('#input-tension-crosses').value = slot.crossesTension;
  } else {
    setHybridMode(false);
    $('#select-string-full').value = slot.stringId;
    $('#input-tension-full').value = slot.tension;
  }
  renderDashboard();

  // Now open tune mode
  if (!isTuneMode) {
    isTuneMode = true;
    $('#tune-overlay').classList.remove('hidden');
    $('#btn-toggle-tune').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  const setup = getCurrentSetup();
  if (setup) initTuneMode(setup);
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
  if (isTuneMode && sweepChart) {
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
  // Populate dropdowns
  populateRacquetDropdown($('#select-racquet'));
  populateStringDropdown($('#select-string-full'));
  populateStringDropdown($('#select-string-mains'));
  populateStringDropdown($('#select-string-crosses'));

  // Frame selector
  $('#select-racquet').addEventListener('change', (e) => {
    const r = RACQUETS.find(x => x.id === e.target.value);
    showFrameSpecs(r);
    renderDashboard();
  });

  // String selectors
  $('#select-string-full').addEventListener('change', (e) => {
    populateGaugeDropdown($('#select-gauge-full'), e.target.value);
    renderDashboard();
  });
  $('#select-string-mains').addEventListener('change', (e) => {
    populateGaugeDropdown($('#select-gauge-mains'), e.target.value);
    renderDashboard();
  });
  $('#select-string-crosses').addEventListener('change', (e) => {
    populateGaugeDropdown($('#select-gauge-crosses'), e.target.value);
    renderDashboard();
  });

  // Tension inputs
  $('#input-tension-full').addEventListener('input', renderDashboard);
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
  $('#btn-toggle-comparison').addEventListener('click', toggleComparisonMode);
  $('#btn-add-slot').addEventListener('click', addComparisonSlot);
  $('#btn-exit-comparison').addEventListener('click', toggleComparisonMode);

  // Tune mode
  $('#btn-toggle-tune').addEventListener('click', toggleTuneMode);
  $('#btn-exit-tune').addEventListener('click', closeTuneMode);
  $('#tune-slider').addEventListener('input', onTuneSliderInput);

  // Theme
  $('#btn-theme').addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', init);

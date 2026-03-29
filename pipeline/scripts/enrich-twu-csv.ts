'use strict';
/**
 * Enrich TWU-scraped CSV with required fields for pipeline ingestion.
 * 
 * TWU provides: headSize, strungWeight, balance, swingweight, stiffness
 * Missing: beamWidth, pattern, tensionRange, powerLevel, strokeStyle, swingSpeed
 * 
 * This script uses frame family patterns to infer reasonable defaults.
 */
const fs   = require('fs');
const path = require('path');

// ─── Frame family patterns ───────────────────────────────────────────────────
// Maps frame family keywords to typical specs
// CRITICAL: Order within each family group is SPECIFIC FIRST, GENERIC LAST
// First-match-wins means broader patterns must come after narrower ones
const FAMILY_PATTERNS = [
  // Babolat Aero family - SPECIFIC FIRST
  { match: /pure.aero.98|aero.vs/i, beam: [21,23,22], pattern: '16x20', tension: [46,55], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /aero.112|aero.*plus/i, beam: [23,26,23], pattern: '16x19', tension: [48,57], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /pure.aero|aeropro|aero.storm|aero.tour|aero.blast/i, beam: [21,23,22], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Full', speed: 'Fast' },
  
  // Babolat Pure Drive family - SPECIFIC FIRST
  { match: /pure.drive.*tour|pdt|pd.*tour/i, beam: [23,26,23], pattern: '16x19', tension: [50,59], power: 'Medium', stroke: 'Full', speed: 'Fast' },
  { match: /pure.drive.*team|pd.*team/i, beam: [23,26,23], pattern: '16x19', tension: [50,59], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /pure.drive.*lite|pd.*lite/i, beam: [23,26,23], pattern: '16x19', tension: [50,59], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /pure.drive.98/i, beam: [21,23,21], pattern: '16x19', tension: [50,59], power: 'Medium', stroke: 'Full', speed: 'Fast' },
  { match: /pure.drive.107|pd.*107/i, beam: [23,26,23], pattern: '16x19', tension: [50,59], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /pure.drive.110|pd.*110/i, beam: [24,27,24], pattern: '16x20', tension: [48,57], power: 'High', stroke: 'Short', speed: 'Slow' },
  { match: /pure.drive|pure.control/i, beam: [23,26,23], pattern: '16x19', tension: [50,59], power: 'Medium-High', stroke: 'Medium', speed: 'Medium-Fast' },
  
  // Babolat Pure Strike family - mostly OK, ensure specific-first
  { match: /pure.strike.*97|strike.*97/i, beam: [21,22,21], pattern: '16x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /pure.strike.*98.*18x20|strike.*18x20/i, beam: [21,23,21], pattern: '18x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /pure.strike.*98.*16x19|strike.*16x19/i, beam: [21,23,21], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /pure.strike.*100|strike.*100/i, beam: [21,23,21], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Fast' },
  { match: /pure.strike|strike/i, beam: [21,23,21], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  
  // Head Speed family - SPECIFIC FIRST
  { match: /speed.*mp.*legend|speed.*mp.*2026/i, beam: [23,23,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /speed.*tour.*2026|speed.*tour.*97/i, beam: [23,23,23], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /speed.*pro|speed.*legend/i, beam: [23,23,23], pattern: '18x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /speed.*mp|speed.*tour/i, beam: [23,23,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /speed.*team/i, beam: [24,24,24], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /speed.*elite|speed.*lite/i, beam: [25,25,25], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /speed.*l$/i, beam: [23,23,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /speed/i, beam: [23,23,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Head Radical family
  { match: /radical.*pro/i, beam: [20,23,21], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /radical.*mp|radical.*tour/i, beam: [21,23,21], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /radical.*team|radical.*s$/i, beam: [22,25,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /radical.*os/i, beam: [22,25,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /radical/i, beam: [21,23,21], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  
  // Head Prestige family
  { match: /prestige.*tour|prestige.*pro/i, beam: [20,20,20], pattern: '18x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /prestige.*mid/i, beam: [20,20,20], pattern: '18x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /prestige.*mp/i, beam: [20,20,20], pattern: '18x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /prestige/i, beam: [20,20,20], pattern: '18x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  
  // Head Gravity family
  { match: /gravity.*pro/i, beam: [20,20,20], pattern: '18x20', tension: [48,57], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /gravity.*tour/i, beam: [22,22,22], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Fast' },
  { match: /gravity.*mp/i, beam: [22,22,22], pattern: '16x20', tension: [48,57], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Fast' },
  { match: /gravity.*team|gravity.*lite/i, beam: [22,22,22], pattern: '16x20', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /gravity/i, beam: [22,22,22], pattern: '16x20', tension: [48,57], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Fast' },
  
  // Head Extreme family
  { match: /extreme.*tour|extreme.*pro/i, beam: [23,26,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Full', speed: 'Fast' },
  { match: /extreme.*mp/i, beam: [24,26,24], pattern: '16x19', tension: [48,57], power: 'Medium-High', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /extreme.*team|extreme.*lite|extreme.*s$/i, beam: [24,26,24], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /extreme/i, beam: [24,26,24], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Head Boom family
  { match: /boom.*pro/i, beam: [22,22,22], pattern: '16x19', tension: [48,57], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /boom.*mp/i, beam: [22,22,22], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /boom.*team/i, beam: [22,22,22], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /boom/i, beam: [22,22,22], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Head Instinct family
  { match: /instinct.*pwr/i, beam: [26,28,26], pattern: '16x19', tension: [48,57], power: 'High', stroke: 'Short', speed: 'Slow' },
  { match: /instinct.*mp/i, beam: [23,26,23], pattern: '16x19', tension: [48,57], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /instinct.*lite|instinct.*s/i, beam: [23,26,23], pattern: '16x19', tension: [48,57], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /instinct/i, beam: [23,26,23], pattern: '16x19', tension: [48,57], power: 'Medium-High', stroke: 'Medium', speed: 'Medium-Fast' },
  
  // Wilson Blade family
  { match: /blade.*98.*v8|blade.*98.*2024/i, beam: [21,21,21], pattern: '16x19', tension: [50,60], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /blade.*98.*18x20|blade.*98s/i, beam: [21,21,21], pattern: '18x20', tension: [50,60], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /blade.*100|blade.*104/i, beam: [21,21,21], pattern: '16x19', tension: [50,60], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /blade.*98/i, beam: [21,21,21], pattern: '16x19', tension: [50,60], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /blade/i, beam: [21,21,21], pattern: '16x19', tension: [50,60], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  
  // Wilson Pro Staff family
  { match: /pro.staff.*97.*v14|pro.staff.*97.*2024/i, beam: [21.5,21.5,21.5], pattern: '16x19', tension: [50,60], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /pro.staff.*97/i, beam: [21.5,21.5,21.5], pattern: '16x19', tension: [50,60], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /pro.staff.*rf01|rf01/i, beam: [23.2,23,22], pattern: '16x19', tension: [50,60], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /pro.staff/i, beam: [21.5,21.5,21.5], pattern: '16x19', tension: [50,60], power: 'Low', stroke: 'Full', speed: 'Fast' },
  
  // Wilson Shift family
  { match: /shift.*99.*l/i, beam: [23.5,23.5,23.5], pattern: '16x20', tension: [48,58], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /shift.*99/i, beam: [23.5,23.5,23.5], pattern: '16x20', tension: [48,58], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /shift/i, beam: [23.5,23.5,23.5], pattern: '16x20', tension: [48,58], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Wilson Ultra family
  { match: /ultra.*100|ultra.*108/i, beam: [24,26.5,24], pattern: '16x19', tension: [50,60], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /ultra.*95|ultra.*pro/i, beam: [24,26.5,24], pattern: '18x20', tension: [50,60], power: 'Medium', stroke: 'Full', speed: 'Fast' },
  { match: /ultra/i, beam: [24,26.5,24], pattern: '16x19', tension: [50,60], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  
  // Wilson Clash family
  { match: /clash.*98|clash.*pro/i, beam: [24,24,24], pattern: '16x20', tension: [50,60], power: 'Medium', stroke: 'Full', speed: 'Fast' },
  { match: /clash.*100|clash.*108/i, beam: [24,24,24], pattern: '16x19', tension: [50,60], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /clash/i, beam: [24,24,24], pattern: '16x19', tension: [50,60], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Yonex EZONE family - SPECIFIC FIRST
  { match: /ezone.*98/i, beam: [23.8,26.5,22], pattern: '16x19', tension: [45,60], power: 'Low-Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /ezone.*100/i, beam: [23.8,26.5,22], pattern: '16x19', tension: [45,60], power: 'Medium', stroke: 'Medium', speed: 'Medium-Fast' },
  { match: /ezone.*105|ezone.*110/i, beam: [24,27,23], pattern: '16x18', tension: [45,60], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /ezone/i, beam: [23.8,26.5,22], pattern: '16x19', tension: [45,60], power: 'Medium', stroke: 'Medium', speed: 'Medium-Fast' },
  
  // Yonex VCORE/Muse family
  { match: /vcore.*100|muse.*100/i, beam: [25.3,25.3,22], pattern: '16x19', tension: [45,60], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /vcore.*98|muse.*98/i, beam: [24,24,18], pattern: '16x18', tension: [45,60], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /vcore.*95|muse.*95/i, beam: [21,21,21], pattern: '16x20', tension: [45,60], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /vcore|muse/i, beam: [24,24,22], pattern: '16x19', tension: [45,60], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Prince family
  { match: /prince.*tour.*95|prince.*textreme.*95/i, beam: [20,20,20], pattern: '18x20', tension: [48,58], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /prince.*tour.*100|prince.*textreme.*100/i, beam: [21.5,21.5,21.5], pattern: '18x20', tension: [48,58], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /prince.*phantom.*100/i, beam: [20,20,20], pattern: '16x19', tension: [48,58], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /prince.*phantom|prince.*93/i, beam: [19,19,19], pattern: '14x18', tension: [48,58], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /prince.*graphite|prince.*original/i, beam: [19,19,19], pattern: '18x20', tension: [48,58], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  
  // Dunlop CX/FX/SX family
  { match: /dunlop.*cx.*tour.*18x20/i, beam: [21,21,21], pattern: '18x20', tension: [45,55], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /dunlop.*cx.*tour.*16x19|dunlop.*cx.*200/i, beam: [21,21,21], pattern: '16x19', tension: [45,55], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /dunlop.*cx.*400|dunlop.*cx.*tour/i, beam: [21,21,21], pattern: '16x19', tension: [45,55], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /dunlop.*cx/i, beam: [21,21,21], pattern: '16x19', tension: [45,55], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /dunlop.*fx.*tour/i, beam: [23,26,23], pattern: '16x19', tension: [45,55], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /dunlop.*fx.*500|dunlop.*fx.*ls/i, beam: [23,26,23], pattern: '16x19', tension: [45,55], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /dunlop.*fx.*lite|dunlop.*fx.*700/i, beam: [24,27,24], pattern: '16x19', tension: [45,55], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /dunlop.*fx/i, beam: [23,26,23], pattern: '16x19', tension: [45,55], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /dunlop.*sx.*tour/i, beam: [23,26,23], pattern: '16x19', tension: [45,55], power: 'Medium', stroke: 'Full', speed: 'Fast' },
  { match: /dunlop.*sx/i, beam: [23,26,23], pattern: '16x19', tension: [45,55], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Volkl family
  { match: /volkl.*v1|volkl.*organix|volkl.*v-feel|volkl.*v-sense/i, beam: [24,28,24], pattern: '16x19', tension: [50,60], power: 'Medium', stroke: 'Medium', speed: 'Medium' },
  { match: /volkl.*c10|volkl.*10/i, beam: [20,20,20], pattern: '16x19', tension: [50,60], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /volkl/i, beam: [22,24,22], pattern: '16x19', tension: [50,60], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Tecnifibre family
  { match: /tecnifibre.*tfight.*iso|tecnifibre.*rs.*iso/i, beam: [22.5,22.5,22.5], pattern: '18x19', tension: [49,59], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /tecnifibre.*tfight|tecnifibre.*rs/i, beam: [22.5,22.5,22.5], pattern: '16x19', tension: [49,59], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  { match: /tecnifibre.*tflash|tecnifibre.*tf.*x1/i, beam: [24,26,24], pattern: '16x19', tension: [49,59], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /tecnifibre.*tempo/i, beam: [22,22,22], pattern: '16x19', tension: [49,59], power: 'Medium', stroke: 'Medium-Full', speed: 'Fast' },
  { match: /tecnifibre/i, beam: [23,25,23], pattern: '16x19', tension: [49,59], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  
  // Solinco family
  { match: /solinco.*whiteout|solinco.*blackout/i, beam: [21.7,21.7,21.7], pattern: '16x19', tension: [45,55], power: 'Low-Medium', stroke: 'Full', speed: 'Fast' },
  
  // Generic defaults by head size
  { match: /95|97|93|90/i, beam: [21,21,21], pattern: '16x19', tension: [50,60], power: 'Low', stroke: 'Full', speed: 'Fast' },
  { match: /98|100/i, beam: [23,26,23], pattern: '16x19', tension: [50,60], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' },
  { match: /102|104|105/i, beam: [24,27,24], pattern: '16x19', tension: [48,58], power: 'Medium-High', stroke: 'Medium', speed: 'Medium' },
  { match: /107|108|110|112|115|118|120|124|137/i, beam: [26,29,26], pattern: '16x19', tension: [45,55], power: 'High', stroke: 'Short', speed: 'Slow' },
];

// ─── Filter configuration ────────────────────────────────────────────────────

// Discontinued/irrelevant brands (exclude these)
const DISCONTINUED_BRANDS = [
  'Adidas', 'Boris Becker', 'Avery', 'Kneissl', 'Lacoste', 'Mantis', 
  'OneStrings', 'Pacific', 'PowerAngle', 'Slazenger', 'Fischer'
];

// Legacy tech patterns that indicate pre-2012 frames (exclude these)
const LEGACY_TECH_PATTERNS = [
  // Head
  { pattern: /flexpoint|metallix|liquidmetal|liquid-metal|microgel|micro-gel|crossbow|airflow/i, brand: 'Head', name: 'Flexpoint/Metallix/Liquidmetal/MicroGEL/Crossbow/Airflow' },
  { pattern: /youtek(?!.*graphene)/i, brand: 'Head', name: 'YOUTEK (pre-Graphene)' },
  // Wilson  
  { pattern: /kblade|kfour|kfive|kone|kpro|ksix|ksurge|ktour|kzen/i, brand: 'Wilson', name: 'K-Factor series' },
  { pattern: /nblade|npro|nsix|ntour|n fury/i, brand: 'Wilson', name: 'nCode series' },
  { pattern: /hyper hammer/i, brand: 'Wilson', name: 'Hyper Hammer' },
  { pattern: /\bblx\b(?!.*blade)/i, brand: 'Wilson', name: 'BLX (early)' },
  // Dunlop
  { pattern: /\baerogel\b(?!.*4d)/i, brand: 'Dunlop', name: 'Aerogel (pre-4D)' },
  { pattern: /m-fil/i, brand: 'Dunlop', name: 'M-Fil' },
  { pattern: /\bdnx\b/i, brand: 'Dunlop', name: 'DNX' },
  // Prince
  { pattern: /o3 speedport/i, brand: 'Prince', name: 'O3 Speedport' },
  { pattern: /exo3/i, brand: 'Prince', name: 'EXO3' },
  { pattern: /lightning/i, brand: 'Prince', name: 'Lightning' },
  { pattern: /triple threat/i, brand: 'Prince', name: 'Triple Threat' },
  { pattern: /cts synergy/i, brand: 'Prince', name: 'CTS Synergy' },
  // Volkl
  { pattern: /\bdnx\b/i, brand: 'Volkl', name: 'DNX' },
  { pattern: /power bridge|powerbridge/i, brand: 'Volkl', name: 'Power Bridge' },
  { pattern: /catapult/i, brand: 'Volkl', name: 'Catapult' },
  { pattern: /quantum/i, brand: 'Volkl', name: 'Quantum' },
  // Babolat
  { pattern: /drive z|drivez/i, brand: 'Babolat', name: 'Drive Z' },
  { pattern: /vs nct/i, brand: 'Babolat', name: 'VS NCT' },
  { pattern: /\bxs\b/i, brand: 'Babolat', name: 'XS series' },
  { pattern: /\by\s+\d+/i, brand: 'Babolat', name: 'Y series' },
  // Gamma
  { pattern: /cp-\d/i, brand: 'Gamma', name: 'CP-' },
  { pattern: /\bt-\d/i, brand: 'Gamma', name: 'T-' },
  { pattern: /ipex/i, brand: 'Gamma', name: 'Ipex' },
  { pattern: /g250|g260|g310/i, brand: 'Gamma', name: 'G250/G260/G310' },
];

// Current family patterns (include regardless of year)
const CURRENT_FAMILY_PATTERNS = [
  // Babolat
  /pure aero|pure drive|pure strike/i,
  // Head
  /\bspeed\b|\bradical\b|\bprestige\b|\bgravity\b|\bextreme\b|\bboom\b/i,
  // Wilson
  /\bblade\b|\bpro staff\b|\bclash\b|\bshift\b|\bultra\b|\brf\s*01/i,
  // Yonex
  /\bezone\b|\bvcore\b|\bpercept\b|\bmuse\b/i,
  // Dunlop
  /\bcx\b|\bfx\b|\bsx\b/i,
  // Tecnifibre
  /\btfight\b|\btf40\b|\btfx1\b|\btrebound\b|\brs\b/i,
  // Prince
  /\bphantom\b|\btextreme\b|\bats\b|\bripstick\b|\bripcord\b|\bvortex\b/i,
  // Volkl
  /\bv-cell\b|\bv-feel\b|\bv-sense\b|\bc10\b/i,
  // Solinco
  /\bwhiteout\b|\bblackout\b|\bprotocol\b/i,
  // ProKennex
  /\bblack ace\b|\bki q\+\b|\bki 5\b|\bki 10\b|\bki 15\b/i,
];

// ─── Utilities ─────────────────────────────────────────────────────────────────

function findPattern(name) {
  const normalized = name.toLowerCase();
  for (const p of FAMILY_PATTERNS) {
    if (p.match.test(normalized)) return p;
  }
  // Ultimate fallback
  return { beam: [23,26,23], pattern: '16x19', tension: [50,60], power: 'Medium', stroke: 'Medium-Full', speed: 'Medium-Fast' };
}

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have header and data');
  function parseLine(line) {
    const fields = [];
    let i = 0;
    while (i <= line.length) {
      if (i === line.length) { fields.push(''); break; }
      if (line[i] === '"') {
        let j = i + 1, val = '';
        while (j < line.length) {
          if (line[j] === '"' && line[j + 1] === '"') { val += '"'; j += 2; }
          else if (line[j] === '"') { j++; break; }
          else { val += line[j++]; }
        }
        fields.push(val);
        i = j + 1;
      } else {
        const j = line.indexOf(',', i);
        if (j === -1) { fields.push(line.slice(i).trim()); break; }
        fields.push(line.slice(i, j).trim());
        i = j + 1;
      }
    }
    return fields;
  }
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim(); });
    return row;
  });
}

function generateFrameProfile(name, pattern, beam) {
  const beamStr = Array.isArray(beam) ? beam.join('/') : beam;
  return `${beamStr}mm beam, ${pattern} pattern`;
}

function generateIdentity(name) {
  const parts = [];
  if (/tour|pro/i.test(name)) parts.push('Control');
  else if (/mp|team/i.test(name)) parts.push('All-Rounder');
  else if (/lite|team|s$/i.test(name)) parts.push('Lightweight');
  else if (/plus|oversize/i.test(name)) parts.push('Power');
  else parts.push('Standard');
  
  if (/18x20/i.test(name)) parts.push('Precision');
  if (/16x18|16x20/i.test(name)) parts.push('Spin');
  
  return parts.join(' ');
}

// ─── Pattern shadowing check ───────────────────────────────────────────────────

function findPatternIndex(name) {
  const normalized = name.toLowerCase();
  for (let i = 0; i < FAMILY_PATTERNS.length; i++) {
    if (FAMILY_PATTERNS[i].match.test(normalized)) return i;
  }
  return -1;
}

function checkPatternShadowing() {
  console.log('Checking for pattern shadowing...\n');
  const issues = [];
  
  // Test cases: strings that should match specific patterns
  // We define expected patterns by regex source substring, not index
  const testCases = [
    // Babolat Aero family - specific first, then oversize, then generic
    { name: 'Babolat Pure Aero 98', shouldMatchSource: 'pure.aero.98|aero.vs', desc: 'Pure Aero 98 specific' },
    { name: 'Babolat Aero 112', shouldMatchSource: 'aero.112|aero.*plus', desc: 'Aero 112 oversize' },
    { name: 'Babolat Pure Aero', shouldMatchSource: 'pure.aero|aeropro', desc: 'Pure Aero generic' },
    { name: 'Babolat AeroPro Drive', shouldMatchSource: 'pure.aero|aeropro', desc: 'AeroPro generic' },
    
    // Babolat Pure Drive family - specific variants first, then head sizes, then generic
    { name: 'Babolat Pure Drive Tour', shouldMatchSource: 'pure.drive.*tour|pdt', desc: 'Pure Drive Tour' },
    { name: 'Babolat Pure Drive Team', shouldMatchSource: 'pure.drive.*team|pd.*team', desc: 'Pure Drive Team' },
    { name: 'Babolat Pure Drive Lite', shouldMatchSource: 'pure.drive.*lite|pd.*lite', desc: 'Pure Drive Lite' },
    { name: 'Babolat Pure Drive 98', shouldMatchSource: 'pure.drive.98', desc: 'Pure Drive 98' },
    { name: 'Babolat Pure Drive 107', shouldMatchSource: 'pure.drive.107|pd.*107', desc: 'Pure Drive 107' },
    { name: 'Babolat Pure Drive 110', shouldMatchSource: 'pure.drive.110|pd.*110', desc: 'Pure Drive 110' },
    { name: 'Babolat Pure Drive', shouldMatchSource: 'pure.drive|pure.control', desc: 'Pure Drive generic' },
    
    // Yonex EZONE family - 98 first, then 100, then oversize, then generic
    { name: 'Yonex EZONE 98', shouldMatchSource: 'ezone.*98', desc: 'EZONE 98 specific' },
    { name: 'Yonex EZONE 100', shouldMatchSource: 'ezone.*100', desc: 'EZONE 100 specific' },
    { name: 'Yonex EZONE 105', shouldMatchSource: 'ezone.*105|ezone.*110', desc: 'EZONE 105 oversize' },
    { name: 'Yonex EZONE', shouldMatchSource: 'ezone', desc: 'EZONE generic' },
    
    // Head Speed family
    { name: 'Head Speed Pro', shouldMatchSource: 'speed.*pro|speed.*legend', desc: 'Speed Pro' },
    { name: 'Head Speed MP', shouldMatchSource: 'speed.*mp|speed.*tour', desc: 'Speed MP' },
    { name: 'Head Speed MP Legend', shouldMatchSource: 'speed.*mp.*legend|speed.*mp.*2026', desc: 'Speed MP Legend' },
  ];
  
  for (const test of testCases) {
    const matchedIndex = findPatternIndex(test.name);
    const matchedPattern = matchedIndex >= 0 ? FAMILY_PATTERNS[matchedIndex] : null;
    const matchedSource = matchedPattern ? matchedPattern.match.source : 'none';
    
    // Check if the matched pattern's source contains the expected source
    if (!matchedSource.includes(test.shouldMatchSource)) {
      issues.push(`"${test.name}" (${test.desc}) should match "${test.shouldMatchSource}" but matched "${matchedSource}"`);
    }
  }
  
  if (issues.length === 0) {
    console.log('✓ No pattern shadowing detected.');
    console.log(`  Tested ${testCases.length} representative frame names.`);
  } else {
    console.log('Pattern shadowing detected:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  return issues.length;
}

// ─── Filtering logic ───────────────────────────────────────────────────────────

function loadExistingFrames() {
  const framesPath = path.join(__dirname, '..', 'data', 'frames.json');
  if (!fs.existsSync(framesPath)) return new Set();
  try {
    const frames = JSON.parse(fs.readFileSync(framesPath, 'utf8'));
    return new Set(frames.map(f => f.id));
  } catch (e) {
    return new Set();
  }
}

function extractBrand(name) {
  if (!name) return '';
  const lowerName = name.toLowerCase();
  // Check for multi-word discontinued brands first
  for (const brand of DISCONTINUED_BRANDS) {
    if (lowerName.startsWith(brand.toLowerCase())) {
      return brand;
    }
  }
  // Fall back to first word
  const firstWord = name.split(/\s+/)[0];
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

function shouldIncludeFrame(row, existingIds, sinceYear) {
  const name = row.name || '';
  const lowerName = name.toLowerCase();
  const year = parseInt(row.year, 10) || null;
  const brand = extractBrand(name);
  
  // Check if already in database (never filter out)
  if (existingIds.has(row.id)) {
    return { include: true, reason: 'existing' };
  }
  
  // Check discontinued brands
  if (DISCONTINUED_BRANDS.some(b => brand.toLowerCase() === b.toLowerCase())) {
    return { include: false, reason: 'discontinued-brand' };
  }
  
  // Check legacy tech patterns
  for (const legacy of LEGACY_TECH_PATTERNS) {
    if (legacy.pattern.test(lowerName)) {
      // Special case: Aerogel 4D is 2010+, keep if year >= cutoff
      if (legacy.name === 'Aerogel (pre-4D)' && /4d/i.test(name)) {
        if (year && year >= sinceYear) {
          continue; // Not legacy, check other criteria
        }
      }
      return { include: false, reason: 'legacy-tech', detail: legacy.name };
    }
  }
  
  // Check year cutoff
  if (year && year >= sinceYear) {
    return { include: true, reason: 'year' };
  }
  
  // Check current family patterns
  for (const pattern of CURRENT_FAMILY_PATTERNS) {
    if (pattern.test(lowerName)) {
      return { include: true, reason: 'current-family' };
    }
  }
  
  // No match - exclude
  return { include: false, reason: 'no-match' };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf('--input');
  const outputIdx = args.indexOf('--output');
  const sinceIdx = args.indexOf('--since');
  
  const doFilter = args.includes('--filter');
  const doDedup = args.includes('--dedup');
  const doCheckPatterns = args.includes('--check-patterns');
  const doFilterDebug = args.includes('--filter-debug');
  
  if (doCheckPatterns) {
    const issues = checkPatternShadowing();
    process.exit(issues > 0 ? 1 : 0);
  }
  
  if (args.includes('--help') || args.includes('-h') || inputIdx === -1) {
    console.log(`
Usage: node pipeline/scripts/enrich-twu-csv.js --input <twu-scrape.csv> [options]

Enriches TWU-scraped racquet data with required fields for pipeline ingestion:
  - beamWidth (inferred from frame family)
  - pattern (inferred from frame family)
  - tensionRange (inferred from frame family)
  - powerLevel, strokeStyle, swingSpeed (inferred from frame family)
  - frameProfile (auto-generated)
  - identity (auto-generated)

Options:
  --input <path>       Input CSV file (required)
  --output <path>      Output CSV file (default: input-enriched.csv)
  --filter             Filter to modern, relevant frames only
  --filter-debug       Print filtering decision for each frame
  --since <year>       Year cutoff for filtering (default: 2018)
  --dedup              Remove duplicate names (keep first occurrence)
  --check-patterns     Check FAMILY_PATTERNS for shadowing issues
  --help, -h           Show this help

Examples:
  # Enrich all frames
  node pipeline/scripts/enrich-twu-csv.js --input pipeline/data/twu-scrape-2026-03-23.csv

  # Enrich and filter to modern frames
  node pipeline/scripts/enrich-twu-csv.js --input twu-scrape.csv --filter

  # Enrich with custom year cutoff
  node pipeline/scripts/enrich-twu-csv.js --input twu-scrape.csv --filter --since 2020

  # Full pipeline
  node pipeline/scripts/enrich-twu-csv.js --input twu-scrape.csv --filter --dedup
`);
    process.exit(0);
  }
  
  const inputPath = args[inputIdx + 1];
  const outputPath = outputIdx !== -1 ? args[outputIdx + 1] : inputPath.replace('.csv', '-enriched.csv');
  const sinceYear = sinceIdx !== -1 ? parseInt(args[sinceIdx + 1], 10) : 2018;
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  console.log(`Reading ${inputPath}...`);
  let rows = parseCSV(fs.readFileSync(inputPath, 'utf8'));
  console.log(`Loaded ${rows.length} frames`);
  
  // Deduplication
  if (doDedup) {
    const seenNames = new Set();
    const uniqueRows = [];
    let dupCount = 0;
    for (const row of rows) {
      if (seenNames.has(row.name)) {
        dupCount++;
        continue;
      }
      seenNames.add(row.name);
      uniqueRows.push(row);
    }
    if (dupCount > 0) {
      console.log(`Removed ${dupCount} duplicate names`);
      rows = uniqueRows;
    }
  }
  
  // Filtering
  let filterStats = null;
  if (doFilter) {
    const existingIds = loadExistingFrames();
    console.log(`Filtering with year cutoff: ${sinceYear}`);
    
    const filteredRows = [];
    filterStats = {
      input: rows.length,
      kept: { year: 0, family: 0, existing: 0 },
      removed: { discontinued: 0, legacy: 0, noMatch: 0 }
    };
    
    for (const row of rows) {
      const decision = shouldIncludeFrame(row, existingIds, sinceYear);
      
      if (doFilterDebug) {
        const name = row.name || '(no name)';
        const year = row.year || '(no year)';
        const brand = extractBrand(name);
        console.log(`DEBUG: "${name}" (year=${year}, brand=${brand}) → ${decision.include ? 'KEEP' : 'REMOVE'} (${decision.reason}${decision.detail ? ': ' + decision.detail : ''})`);
      }
      
      if (decision.include) {
        filteredRows.push(row);
        // Map 'current-family' to 'family' for stats
        const statKey = decision.reason === 'current-family' ? 'family' : decision.reason;
        filterStats.kept[statKey]++;
      } else {
        if (decision.reason === 'discontinued-brand') filterStats.removed.discontinued++;
        else if (decision.reason === 'legacy-tech') filterStats.removed.legacy++;
        else filterStats.removed.noMatch++;
      }
    }
    
    rows = filteredRows;
  }
  
  // Enrichment
  let enriched = 0;
  let skipped = 0;
  let lengthAddedToNotes = 0;
  
  for (const row of rows) {
    if (!row.name) {
      skipped++;
      continue;
    }
    
    const pattern = findPattern(row.name);
    
    // Fill in missing fields
    if (!row.beamWidth) {
      row.beamWidth = pattern.beam.join(',');
      enriched++;
    }
    if (!row.pattern) {
      row.pattern = pattern.pattern;
      enriched++;
    }
    if (!row.tensionRange) {
      row.tensionRange = `${pattern.tension[0]},${pattern.tension[1]}`;
      enriched++;
    }
    if (!row.powerLevel) row.powerLevel = pattern.power;
    if (!row.strokeStyle) row.strokeStyle = pattern.stroke;
    if (!row.swingSpeed) row.swingSpeed = pattern.speed;
    if (!row.frameProfile) row.frameProfile = generateFrameProfile(row.name, row.pattern, pattern.beam);
    if (!row.identity) row.identity = generateIdentity(row.name);
    
    // Ensure year is present
    if (!row.year) row.year = '';
    
    // Handle length: if not 27.00, append to notes
    if (row.length && row.length !== '27' && row.length !== '27.0' && row.length !== '27.00') {
      const lengthNote = `length=${row.length}in`;
      if (row.notes) {
        row.notes = `${row.notes} ${lengthNote}`;
      } else {
        row.notes = `TWU: ${lengthNote}`;
      }
      lengthAddedToNotes++;
    }
  }
  
  // Write enriched CSV (without length column)
  const headers = ['id','name','year','headSize','strungWeight','balance','balancePts','swingweight','stiffness','beamWidth','pattern','tensionRange','powerLevel','strokeStyle','swingSpeed','frameProfile','identity','notes'];
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeCSV(row[h] ?? '')).join(','))
  ];
  
  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf8');
  
  console.log(`\nEnrichment complete:`);
  console.log(`  Total frames: ${rows.length}`);
  console.log(`  Fields enriched: ${enriched}`);
  if (lengthAddedToNotes > 0) {
    console.log(`  Length values moved to notes: ${lengthAddedToNotes}`);
  }
  if (skipped > 0) {
    console.log(`  Skipped (no name): ${skipped}`);
  }
  
  if (filterStats) {
    const totalKept = filterStats.kept.year + filterStats.kept.family + filterStats.kept.existing;
    const totalRemoved = filterStats.removed.discontinued + filterStats.removed.legacy + filterStats.removed.noMatch;
    console.log(`\nFilter results:`);
    console.log(`  Input: ${filterStats.input} frames`);
    console.log(`  Kept: ${totalKept} (by year: ${filterStats.kept.year}, by family: ${filterStats.kept.family}, by existing: ${filterStats.kept.existing})`);
    console.log(`  Removed: ${totalRemoved} (discontinued brand: ${filterStats.removed.discontinued}, legacy tech: ${filterStats.removed.legacy}, no match: ${filterStats.removed.noMatch})`);
  }
  
  console.log(`\nOutput written to: ${outputPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review the enriched CSV in a spreadsheet editor`);
  console.log(`  2. Open tools/frame-editor.html to review/edit visually`);
  console.log(`  3. Run: node pipeline/scripts/ingest.js --type frame --csv ${outputPath}`);
}

main();

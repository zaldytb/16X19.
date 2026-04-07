// src/engine/hybridRole.ts
// Hybrid role classification and partner recommendation for the string compendium.
//
// Classification rules:
//
// NON-POLY (Natural Gut, Multifilament, Synthetic Gut):
//   Always VERSATILE. These strings are used in both positions depending on
//   setup goals — gut especially is a classic mains choice but also used as
//   cross in gut/poly hybrids. Fixing them to one role would be misleading.
//
// POLY / CO-POLY:
//   Role is derived from physical properties. Crucially, edge geometry is a
//   BONUS signal for MAINS (confirms it), not a prerequisite. A round poly
//   with high spin potential (surface texture, ball bite) is still a mains
//   string — the absence of edges does not make it a cross string.
//   The primary signals for poly classification are:
//     - Spin potential + stiffness → mains orientation
//     - Very soft stiffness + round shape → cross platform orientation
//   Only polys that are genuinely platform-soft (low stiffness, round, low spin)
//   are classified as CROSS.
//
// Partner ranking uses computePairingAffinity directly for poly×poly pairs,
// giving the same physical model that drives OBS scoring.

import type { StringData } from './types.js';
import { computePairingAffinity, deriveEdgeAcuity, deriveMainsRotationTendency } from './pairingAffinity.js';

export type HybridRole = 'MAINS' | 'CROSS' | 'VERSATILE';

export interface HybridRoleResult {
  role: HybridRole;
  mainsScore: number; // 0-1
  crossScore: number; // 0-1
}

export interface HybridPartnerCard {
  id: string;
  name: string;
  material: string;
  shape: string;
  affinityScore: number; // 0-100 display
  partnerRole: 'mains' | 'cross'; // what role this partner should play
  compatibilityLabel: string;    // e.g. "Excellent", "Good", "Moderate"
}

// ── Threshold: score advantage needed to call a string definitively MAINS or CROSS ──
const ROLE_THRESHOLD = 0.12;

// Materials that are always VERSATILE regardless of physical properties
const POLY_MATERIALS = new Set(['Polyester', 'Co-Polyester (elastic)']);

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Derive the hybrid role of a string from first-principles physical properties.
 *
 * Non-poly strings return VERSATILE immediately — gut, multifilament, and
 * synthetic gut strings do not have a fixed hybrid role: gut is a classic
 * mains choice but is also widely used as cross, and fixing it to one role
 * would give incorrect guidance.
 *
 * For poly strings, spin potential and stiffness are the primary signals.
 * Edge acuity is a confirmatory bonus for MAINS (shaped poly = definitely mains)
 * but its absence does NOT push toward CROSS. A round textured poly with high
 * spin potential is still a mains string.
 */
export function deriveHybridRole(s: StringData): HybridRoleResult {
  // Non-poly: always VERSATILE
  if (!POLY_MATERIALS.has(s.material)) {
    return { role: 'VERSATILE', mainsScore: 0.5, crossScore: 0.5 };
  }

  const edgeAcuity = deriveEdgeAcuity(s.shape);
  const rotationTendency = deriveMainsRotationTendency(s.shape);
  const stiffNorm = clamp01((s.stiffness - 115) / (234 - 115));
  const spinNorm = clamp01(((s.spinPotential || 5) - 4.5) / (9.4 - 4.5));
  const tensionMaintenanceNorm = clamp01(1 - (s.tensionLoss || 20) / 50);

  // MAINS score: spin potential and stiffness are the primary drivers.
  // Edge acuity / rotation tendency are supplementary bonuses — shaped = confirmed mains,
  // but round poly with high spin is still a mains candidate.
  const mainsScore = clamp01(
    spinNorm           * 0.45 +
    stiffNorm          * 0.30 +
    edgeAcuity         * 0.15 +
    rotationTendency   * 0.10
  );

  // CROSS score: very soft stiffness + round geometry + good tension maintenance.
  // Low spin potential is a soft cross signal (cross doesn't need to generate spin).
  const crossScore = clamp01(
    (1 - stiffNorm)        * 0.45 +
    tensionMaintenanceNorm  * 0.30 +
    (1 - edgeAcuity)        * 0.15 +
    (1 - spinNorm)          * 0.10
  );

  let role: HybridRole;
  if (mainsScore > crossScore + ROLE_THRESHOLD) {
    role = 'MAINS';
  } else if (crossScore > mainsScore + ROLE_THRESHOLD) {
    role = 'CROSS';
  } else {
    role = 'VERSATILE';
  }

  return { role, mainsScore, crossScore };
}

function compatibilityLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Moderate';
  return 'Low';
}

/**
 * Find best hybrid partners for a given string.
 *
 * Strategy:
 * - MAINS string: find best CROSS partners. Polys are ranked by affinity.total;
 *   soft strings (gut/multi/synth) are ranked by their tension maintenance and compliance proxy.
 * - CROSS string: find best MAINS partners. Ranked by affinity.total (this string as cross).
 * - VERSATILE: find best partners in both roles, deduplicated, best 4 overall.
 *
 * For poly×poly pairs, computePairingAffinity is used directly — same model as engine scoring.
 * For mixed-material pairs, a simpler compatibility score is derived from string properties.
 */
export function findBestHybridPartners(
  string: StringData,
  allStrings: StringData[],
  limit = 4
): HybridPartnerCard[] {
  const { role } = deriveHybridRole(string);
  const candidates = allStrings.filter((s) => s.id !== string.id);

  if (role === 'MAINS') {
    return rankCrossPartners(string, candidates, limit);
  } else if (role === 'CROSS') {
    return rankMainsPartners(string, candidates, limit);
  } else {
    // VERSATILE: show top 2 as mains + top 2 as cross, deduplicated by best score
    const asMains = rankCrossPartners(string, candidates, 3);
    const asCross = rankMainsPartners(string, candidates, 3);
    const seen = new Set<string>();
    const merged: HybridPartnerCard[] = [];
    for (const card of [...asMains, ...asCross]) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        merged.push(card);
      }
    }
    return merged.slice(0, limit);
  }
}

/**
 * Rank candidate strings as CROSS partners for a given mains string.
 * Poly candidates: ranked by computePairingAffinity(mains, candidate).total.
 * Non-poly candidates: ranked by a simpler compliance + tension maintenance score.
 */
function rankCrossPartners(mains: StringData, candidates: StringData[], limit: number): HybridPartnerCard[] {
  const scored = candidates.map((cross) => {
    let raw: number;
    if (POLY_MATERIALS.has(mains.material) && POLY_MATERIALS.has(cross.material)) {
      raw = computePairingAffinity(mains, cross).total;
    } else {
      // Mixed material: proxy from cross softness + tension maintenance + round geometry
      const stiffNorm = clamp01((cross.stiffness - 115) / (234 - 115));
      const tensionMaint = clamp01(1 - (cross.tensionLoss || 20) / 50);
      const edgeAcuity = deriveEdgeAcuity(cross.shape);
      raw = clamp01((1 - edgeAcuity) * 0.35 + tensionMaint * 0.35 + (1 - stiffNorm) * 0.30);
    }
    return { cross, score: raw };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ cross, score }) => {
      const display = Math.round(score * 100);
      return {
        id: cross.id,
        name: cross.name,
        material: cross.material,
        shape: cross.shape,
        affinityScore: display,
        partnerRole: 'cross' as const,
        compatibilityLabel: compatibilityLabel(display),
      };
    });
}

/**
 * Rank candidate strings as MAINS partners for a given cross string.
 * Poly candidates: ranked by computePairingAffinity(candidate, cross).total.
 * Non-poly candidates: ranked by a simpler spin + edge acuity score.
 */
function rankMainsPartners(cross: StringData, candidates: StringData[], limit: number): HybridPartnerCard[] {
  const scored = candidates.map((mains) => {
    let raw: number;
    if (POLY_MATERIALS.has(cross.material) && POLY_MATERIALS.has(mains.material)) {
      raw = computePairingAffinity(mains, cross).total;
    } else if (POLY_MATERIALS.has(mains.material)) {
      // Poly mains + non-poly cross: use same proxy as above, inverted
      const stiffNorm = clamp01((cross.stiffness - 115) / (234 - 115));
      const tensionMaint = clamp01(1 - (cross.tensionLoss || 20) / 50);
      const edgeAcuity = deriveEdgeAcuity(cross.shape);
      raw = clamp01((1 - edgeAcuity) * 0.35 + tensionMaint * 0.35 + (1 - stiffNorm) * 0.30);
    } else {
      // Both non-poly: compatible but low priority — rank by feel/comfort proximity
      const spinNorm = clamp01(((mains.spinPotential || 5) - 4.5) / (9.4 - 4.5));
      const edgeAcuity = deriveEdgeAcuity(mains.shape);
      raw = clamp01(edgeAcuity * 0.4 + spinNorm * 0.6) * 0.6; // cap non-poly mains lower
    }
    return { mains, score: raw };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ mains, score }) => {
      const display = Math.round(score * 100);
      return {
        id: mains.id,
        name: mains.name,
        material: mains.material,
        shape: mains.shape,
        affinityScore: display,
        partnerRole: 'mains' as const,
        compatibilityLabel: compatibilityLabel(display),
      };
    });
}

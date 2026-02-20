export interface PriorityScore {
  score: number;          // 0-100
  isHighPriority: boolean;
  reason: string;
}

/**
 * Calculate priority based on effort-to-impact ratio.
 * A small item blocking many things = HIGH priority (less effort, more gain).
 * A large item equally late = LOWER priority (more effort for same gain).
 */
export function calculateCapabilityPriority(
  buildBand: string | null,       // 'red' | 'amber' | 'green' | null
  l3ChildCount: number,           // How many L3s under this L2 cap
  policyToolLinkCount: number,    // How many policy tools reference this cap
  expectedDelayDays: number       // From EntityRisk
): PriorityScore {
  if (!buildBand || buildBand === 'green') {
    return { score: 0, isHighPriority: false, reason: 'On track' };
  }

  // Impact: how many policy tools depend on this capability
  const impactScore = Math.min(policyToolLinkCount * 25, 100);

  // Effort (inverse): fewer L3 children = easier to fix = higher priority
  const effortScore = l3ChildCount <= 2 ? 90 : l3ChildCount <= 5 ? 60 : l3ChildCount <= 10 ? 40 : 20;

  // Urgency: red is more urgent than amber
  const urgencyScore = buildBand === 'red' ? 80 : 50;
  const delayBonus = Math.min(expectedDelayDays / 5, 20);

  // Composite
  const score = Math.round((impactScore * 0.4) + (effortScore * 0.3) + ((urgencyScore + delayBonus) * 0.3));

  const isHighPriority = score >= 65 && buildBand === 'red' && effortScore >= 60;

  return {
    score,
    isHighPriority,
    reason: isHighPriority
      ? 'Small blocker of major objective — high leverage fix'
      : buildBand === 'red' ? 'Late but larger effort needed' : 'At risk'
  };
}

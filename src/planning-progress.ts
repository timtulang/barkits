export type PlanningStage = 'who' | 'when' | 'where' | 'review';

export function initialPlanningStage(status: string, people: number, mapped: number): PlanningStage {
  if (['decided', 'completed', 'archived'].includes(status.toLowerCase())) return 'review';
  return status.toLowerCase() === 'draft' || !people || mapped < people ? 'who' : 'where';
}

export function peopleProgress(people: number, mapped: number) {
  if (!people) return 'Add friends';
  return mapped === people ? `${people} ${people === 1 ? 'friend' : 'friends'} ready` : `${people - mapped} starting ${people - mapped === 1 ? 'point' : 'points'} needed`;
}

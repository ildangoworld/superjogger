export type AnalysisCoreFields = {
  category: string;
  localDate: string;
  durationSeconds: number;
  distanceMeters: number;
  perceivedExertion: number;
  conditionScore: number;
  hasPain: boolean;
  painArea: string | null;
  painDetails: string | null;
  averageHeartRate: number | null;
};

export function hasCoreAnalysisFieldsChanged(
  before: AnalysisCoreFields,
  after: AnalysisCoreFields,
): boolean {
  return (
    before.category !== after.category ||
    before.localDate !== after.localDate ||
    before.durationSeconds !== after.durationSeconds ||
    before.distanceMeters !== after.distanceMeters ||
    before.perceivedExertion !== after.perceivedExertion ||
    before.conditionScore !== after.conditionScore ||
    before.hasPain !== after.hasPain ||
    (before.painArea ?? null) !== (after.painArea ?? null) ||
    (before.painDetails ?? null) !== (after.painDetails ?? null) ||
    (before.averageHeartRate ?? null) !== (after.averageHeartRate ?? null)
  );
}

/**
 * The counts of the tabs of Bureau & staff: people there today (Effectif),
 * people with an ended passage (Anciens membres), functions of the structure.
 */
export type StaffSummary = Readonly<{
  formerCount: number;
  functionCount: number;
  memberCount: number;
}>;

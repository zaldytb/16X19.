export type OverviewWarningsViewModel = {
  messages: string[];
};

export function buildOverviewWarningsViewModel(warnings: string[]): OverviewWarningsViewModel {
  return { messages: warnings };
}

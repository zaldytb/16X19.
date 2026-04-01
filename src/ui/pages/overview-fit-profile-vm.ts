export type OverviewFitProfileCardViewModel = {
  bestForText: string;
  watchOutText: string;
  tensionText: string;
};

export function buildOverviewFitProfileCardViewModel(fitProfile: {
  bestFor: string[];
  watchOut: string[];
  tensionRec: string;
}): OverviewFitProfileCardViewModel {
  const bestForList = Array.isArray(fitProfile.bestFor) ? fitProfile.bestFor : [];
  const watchOutList = Array.isArray(fitProfile.watchOut) ? fitProfile.watchOut : [];
  const bestForText = bestForList.join(', ') || 'Versatile all-court players';
  const watchOutText =
    watchOutList.length > 0 && !watchOutList[0].toLowerCase().includes('no major')
      ? watchOutList.join(', ')
      : 'No major red flags';
  const tensionText = fitProfile.tensionRec || 'Use the frame range midpoint';

  return { bestForText, watchOutText, tensionText };
}

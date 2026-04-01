import type { FmbDirectionsVm } from '../../ui/pages/find-my-build-vm.js';

type Props = {
  model: FmbDirectionsVm;
};

export function FmbResultsDirections({ model }: Props) {
  return (
    <div className="fmb-frame-results">
      <h4 className="fmb-frames-title">Recommended Frames</h4>
      <p className="fmb-frames-sub">Based on your playstyle profile. Each frame shows its best builds.</p>
      <div className="fmb-frame-list">
        {model.frames.map((frame) => (
          <div key={frame.frameIdx} className="fmb-frame-card" data-frame-idx={frame.frameIdx}>
            <div className="fmb-frame-header">
              <div className="fmb-frame-name">{frame.frameName}</div>
              <div className="fmb-frame-meta">{frame.frameMeta}</div>
            </div>
            {frame.builds.length ? (
              <div className="fmb-frame-builds">
                {frame.builds.map((build) => (
                  <div key={`${build.frameIdx}-${build.buildIdx}`} className="fmb-build-row">
                    <div className="fmb-build-info">
                      <span className="fmb-build-name">{build.name}</span>
                      <span className="fmb-build-tension">{build.tensionLabel}</span>
                    </div>
                    <div className="fmb-build-obs">{build.obs}</div>
                    <div className="fmb-build-actions">
                      <button className="fmb-build-btn" data-fmb-action="activate" data-frame-idx={build.frameIdx} data-build-idx={build.buildIdx}>Activate</button>
                      <button className="fmb-build-btn fmb-build-btn-secondary" data-fmb-action="save" data-frame-idx={build.frameIdx} data-build-idx={build.buildIdx}>Save</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="fmb-also-try">
        <p className="fmb-also-try-text">Want more options?</p>
        <button className="fmb-dir-btn" data-fmb-action="searchDirection" data-fmb-direction="closest">Search All Strings in Optimizer</button>
      </div>
    </div>
  );
}

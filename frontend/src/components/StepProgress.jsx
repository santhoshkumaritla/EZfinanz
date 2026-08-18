import { STAGES, getStageIndex } from '../utils/constants';

export default function StepProgress({ currentStage }) {
  const currentIndex = getStageIndex(currentStage);

  const visibleStages = STAGES.filter((s) =>
    !['approved', 'disbursed'].includes(s.key) || s.key === currentStage
  ).slice(0, 8);

  return (
    <div className="step-progress">
      {visibleStages.map((stage, idx) => {
        const stageIdx = getStageIndex(stage.key);
        const isComplete = stageIdx < currentIndex;
        const isCurrent = stage.key === currentStage;

        return (
          <div
            key={stage.key}
            className={`step-item ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}
          >
            <div className="step-circle">
              {isComplete ? '✓' : idx + 1}
            </div>
            <span className="step-label">{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
}

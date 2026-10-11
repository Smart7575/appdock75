import React from 'react';
import {
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  DevelopmentSubstatus,
  DEVELOPMENT_SUBSTATUSES,
  DevSubstatusInfo,
  calculateSubphaseProgress,
} from '../../types';

interface DevSubstatusPipelineProps {
  currentSubstatus?: DevelopmentSubstatus;
  onSelectSubstatus?: (substatus: DevelopmentSubstatus) => void;
  compact?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

export const DevSubstatusPipeline: React.FC<DevSubstatusPipelineProps> = ({
  currentSubstatus = 'Design',
  onSelectSubstatus,
  compact = false,
  showDescriptions = false,
  className = '',
}) => {
  const currentStepInfo =
    DEVELOPMENT_SUBSTATUSES.find(s => s.id === currentSubstatus) ||
    DEVELOPMENT_SUBSTATUSES[0];
  const currentStepNum = currentStepInfo.step;
  const progressPercent = calculateSubphaseProgress(currentSubstatus);

  return (
    <div
      className={`rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 transition-all ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {/* Header with Title & Quick Select Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white tracking-tight">
                Development Subphases
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                Step {currentStepNum}/7: {currentStepInfo.name}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {currentStepInfo.description}
            </p>
          </div>
        </div>

        {/* Quick select dropdown */}
        {onSelectSubstatus && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Phase:</span>
            <select
              value={currentSubstatus}
              onChange={e => onSelectSubstatus(e.target.value as DevelopmentSubstatus)}
              onClick={e => e.stopPropagation()}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {DEVELOPMENT_SUBSTATUSES.map(sub => (
                <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                  {sub.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Visual 7-Step Pipeline / Stepper Bar */}
      <div className="w-full">
        {/* Progress meter bar */}
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Items Grid / Flex */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-1">
          {DEVELOPMENT_SUBSTATUSES.map(sub => {
            const isCompleted = sub.step < currentStepNum;
            const isCurrent = sub.step === currentStepNum;
            const isFuture = sub.step > currentStepNum;

            let stepClasses =
              'border bg-slate-800/40 text-slate-400 hover:border-slate-700';
            if (isCompleted) {
              stepClasses =
                'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-950/40';
            } else if (isCurrent) {
              stepClasses =
                'border-blue-500 bg-blue-600/20 text-white font-semibold shadow-sm shadow-blue-500/20 ring-1 ring-blue-500/40';
            }

            return (
              <button
                key={sub.id}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  if (onSelectSubstatus) {
                    onSelectSubstatus(sub.id);
                  }
                }}
                disabled={!onSelectSubstatus}
                title={`${sub.label}: ${sub.description}`}
                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-center transition-all ${
                  onSelectSubstatus ? 'cursor-pointer' : 'cursor-default'
                } ${stepClasses}`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : sub.step}
                  </span>
                  <span
                    className={`text-[10px] truncate max-w-[80px] sm:max-w-none ${
                      isCurrent
                        ? 'text-white font-bold'
                        : isCompleted
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {compact ? sub.shortLabel : sub.name}
                  </span>
                </div>

                {isCurrent && (
                  <span className="text-[9px] font-medium text-blue-400 uppercase tracking-wider scale-90 -mt-0.5">
                    Active
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[9px] text-emerald-400/80 scale-90 -mt-0.5">
                    Done
                  </span>
                )}
                {isFuture && (
                  <span className="text-[9px] text-slate-500 scale-90 -mt-0.5">
                    Pending
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showDescriptions && (
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            Current Focus: <strong className="text-slate-200">{currentStepInfo.name}</strong> — {currentStepInfo.description}
          </span>
          <span className="font-mono text-slate-400 text-[10px]">
            {progressPercent}% Complete
          </span>
        </div>
      )}
    </div>
  );
};

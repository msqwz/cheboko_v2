import React from 'react';
import { TicketStatus } from '../types';
import { Check } from 'lucide-react';
import { cn } from '../utils';

interface TicketProgressBarProps {
  status: TicketStatus;
  className?: string;
  compact?: boolean;
}

const STEPS = [
  { id: 'created', label: 'Создана', statuses: ['created', 'opened'] },
  { id: 'assigned', label: 'Назначена', statuses: ['assigned'] },
  { id: 'enroute', label: 'В пути', statuses: ['enroute'] },
  { id: 'in_work', label: 'В работе', statuses: ['in_work', 'on_hold'] },
  { id: 'completed', label: 'Завершена', statuses: ['completed', 'canceled'] },
];

export const TicketProgressBar: React.FC<TicketProgressBarProps> = ({ status, className, compact = false }) => {
  // Find current step index
  let currentStepIndex = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].statuses.includes(status)) {
      currentStepIndex = i;
      break;
    }
  }

  const isCanceled = status === 'canceled';

  return (
    <div className={cn("w-full", compact ? "py-2" : "py-4", className)}>
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
        
        <div 
          className={cn(
            "absolute left-0 top-1/2 transform -translate-y-1/2 h-1 rounded-full z-0 transition-all duration-500",
            isCanceled ? "bg-red-500" : "bg-indigo-600"
          )}
          style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
        ></div>

        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          let bgColor = "bg-white border-2 border-gray-300";
          let textColor = "text-gray-500";
          
          if (isCompleted) {
            bgColor = isCanceled ? "bg-red-500 border-red-500" : "bg-indigo-600 border-indigo-600";
            textColor = isCanceled ? "text-red-600" : "text-indigo-600";
          } else if (isCurrent) {
            bgColor = isCanceled ? "bg-red-500 border-red-500" : "bg-indigo-600 border-indigo-600";
            textColor = isCanceled ? "text-red-600 font-medium" : "text-indigo-600 font-medium";
          }

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={cn(compact ? "w-4 h-4" : "w-6 h-6", "rounded-full flex items-center justify-center transition-colors duration-300", bgColor)}>
                {isCompleted || (isCurrent && isCanceled) ? (
                  <Check className={cn(compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5", "text-white")} />
                ) : isCurrent ? (
                  <div className={cn(compact ? "w-1.5 h-1.5" : "w-2 h-2", "rounded-full bg-white")}></div>
                ) : null}
              </div>
              {!compact && (
                <span className={cn("absolute top-8 text-[10px] sm:text-xs whitespace-nowrap", textColor)}>
                  {step.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

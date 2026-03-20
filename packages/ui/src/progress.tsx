

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  sublabel?: string;
  tone?: "default" | "success" | "warning" | "danger";
}

export function ProgressBar({ value, max, label, sublabel, tone = "default" }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const toneClass = {
    default: "progress-tone-default",
    success: "progress-tone-success",
    warning: "progress-tone-warning",
    danger: "progress-tone-danger"
  }[tone];

  return (
    <div className="progress-container">
      {(label || sublabel) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {sublabel && <span className="progress-sublabel">{sublabel}</span>}
        </div>
      )}
      <div className="progress-track">
        <div 
          className={`progress-fill ${toneClass}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

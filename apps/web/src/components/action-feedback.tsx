"use client";

import type { ActionFeedbackState } from "../lib/async-action";

export function ActionFeedback({ feedback }: { feedback: ActionFeedbackState }) {
  return (
    <div className={`status-text ${feedback.message ? feedback.tone : ""}`}>
      {feedback.message}
    </div>
  );
}

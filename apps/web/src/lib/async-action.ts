"use client";

import { useState } from "react";

export type ActionFeedbackTone = "idle" | "success" | "error";

export interface ActionFeedbackState {
  message: string;
  tone: ActionFeedbackTone;
}

interface RunActionOptions<TResult> {
  errorMessage?: string;
  resetFeedback?: boolean;
  successMessage?: string | ((result: TResult) => string | null | undefined);
  onError?: (message: string, error: unknown) => void | Promise<void>;
  onSuccess?: (result: TResult) => void | Promise<void>;
}

const EMPTY_FEEDBACK: ActionFeedbackState = {
  message: "",
  tone: "idle"
};

export function toActionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useAsyncAction() {
  const [feedback, setFeedback] = useState<ActionFeedbackState>(EMPTY_FEEDBACK);
  const [pending, setPending] = useState(false);

  function clearFeedback() {
    setFeedback(EMPTY_FEEDBACK);
  }

  async function run<TResult>(
    task: () => Promise<TResult>,
    options: RunActionOptions<TResult> = {}
  ): Promise<TResult | null> {
    if (options.resetFeedback !== false) {
      clearFeedback();
    }

    setPending(true);

    try {
      const result = await task();
      await options.onSuccess?.(result);

      const successMessage = typeof options.successMessage === "function"
        ? options.successMessage(result)
        : options.successMessage;

      if (successMessage) {
        setFeedback({
          message: successMessage,
          tone: "success"
        });
      }

      return result;
    } catch (error) {
      const message = toActionErrorMessage(error, options.errorMessage ?? "Request failed.");

      setFeedback({
        message,
        tone: "error"
      });

      await options.onError?.(message, error);
      return null;
    } finally {
      setPending(false);
    }
  }

  return {
    clearFeedback,
    feedback,
    pending,
    run,
    setFeedback
  };
}

"use client";

import { useRef, useState, type ChangeEvent } from "react";

type FormValue = string | number | boolean | null | undefined;
type InputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type StringFieldKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export function useFormState<T extends Record<string, FormValue>>(initialValues: T) {
  const initialValuesRef = useRef(initialValues);
  const [values, setValues] = useState(initialValues);

  function setField<K extends keyof T>(field: K, value: T[K]) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  function patch(nextValues: Partial<T>) {
    setValues((current) => ({
      ...current,
      ...nextValues
    }));
  }

  function reset(nextValues?: Partial<T>) {
    setValues({
      ...initialValuesRef.current,
      ...nextValues
    } as T);
  }

  function bind<K extends StringFieldKeys<T>>(field: K) {
    return {
      value: String(values[field] ?? ""),
      onChange: (event: ChangeEvent<InputElement>) => {
        setField(field, event.target.value as T[K]);
      }
    };
  }

  return {
    values,
    setField,
    patch,
    reset,
    bind
  };
}

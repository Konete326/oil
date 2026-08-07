import { useState, useCallback } from "react";

export function useFormValidation(initialFields = {}) {
  const [fieldValidities, setFieldValidities] = useState(initialFields);

  const setFieldValid = useCallback((fieldName, isValid) => {
    setFieldValidities((prev) => {
      if (prev[fieldName] === isValid) return prev;
      return { ...prev, [fieldName]: isValid };
    });
  }, []);

  const isFormValid = Object.values(fieldValidities).every((val) => val === true);

  const resetValidation = useCallback((newValidities = {}) => {
    setFieldValidities(newValidities);
  }, []);

  return {
    isFormValid,
    setFieldValid,
    resetValidation,
    fieldValidities,
  };
}

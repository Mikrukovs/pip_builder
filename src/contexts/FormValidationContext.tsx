'use client';

import { createContext, useContext, useState, useCallback, useRef, useMemo, ReactNode, RefObject } from 'react';

interface InputRegistration {
  isValid: boolean | null;
  touched: boolean;
  hasValidation: boolean;
  ref: RefObject<HTMLInputElement | HTMLButtonElement | null>;
  order: number; // Порядок регистрации для сортировки
}

interface ValidationState {
  [inputId: string]: InputRegistration;
}

interface FormValidationContextType {
  validationState: ValidationState;
  registerInput: (inputId: string, hasValidation: boolean, ref: RefObject<HTMLInputElement | HTMLButtonElement | null>) => void;
  unregisterInput: (inputId: string) => void;
  updateValidation: (inputId: string, isValid: boolean | null, touched: boolean) => void;
  isFormValid: () => boolean;
  focusFirstInvalid: () => boolean; // Возвращает true если нашёл и сфокусировал
}

const FormValidationContext = createContext<FormValidationContextType | null>(null);

export function FormValidationProvider({ children }: { children: ReactNode }) {
  const [validationState, setValidationState] = useState<ValidationState>({});
  const orderCounter = useRef(0);

  const registerInput = useCallback((inputId: string, hasValidation: boolean, ref: RefObject<HTMLInputElement | HTMLButtonElement | null>) => {
    setValidationState(prev => ({
      ...prev,
      [inputId]: { isValid: null, touched: false, hasValidation, ref, order: orderCounter.current++ }
    }));
  }, []);

  const unregisterInput = useCallback((inputId: string) => {
    setValidationState(prev => {
      const next = { ...prev };
      delete next[inputId];
      return next;
    });
  }, []);

  const updateValidation = useCallback((inputId: string, isValid: boolean | null, touched: boolean) => {
    setValidationState(prev => ({
      ...prev,
      [inputId]: { ...prev[inputId], isValid, touched }
    }));
  }, []);

  const isFormValid = useCallback(() => {
    const inputsWithValidation = Object.values(validationState).filter(v => v.hasValidation);
    
    // Если нет инпутов с валидацией - форма валидна
    if (inputsWithValidation.length === 0) return true;
    
    // Проверяем что все инпуты с валидацией touched и valid
    return inputsWithValidation.every(v => v.touched && v.isValid === true);
  }, [validationState]);

  const focusFirstInvalid = useCallback(() => {
    // Находим все невалидные инпуты с валидацией
    const invalidInputs = Object.values(validationState)
      .filter(v => v.hasValidation && (v.isValid !== true))
      .sort((a, b) => a.order - b.order);
    
    if (invalidInputs.length > 0 && invalidInputs[0].ref.current) {
      invalidInputs[0].ref.current.focus();
      return true;
    }
    return false;
  }, [validationState]);

  const value = useMemo(() => ({
    validationState,
    registerInput,
    unregisterInput,
    updateValidation,
    isFormValid,
    focusFirstInvalid,
  }), [validationState, registerInput, unregisterInput, updateValidation, isFormValid, focusFirstInvalid]);

  return (
    <FormValidationContext.Provider value={value}>
      {children}
    </FormValidationContext.Provider>
  );
}

export function useFormValidation() {
  const context = useContext(FormValidationContext);
  // Возвращаем null если контекст не доступен (не обёрнуто в Provider)
  return context;
}

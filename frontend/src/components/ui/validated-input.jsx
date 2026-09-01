import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon, CheckCircle2Icon, EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatPhoneNumber(val) {
  if (!val) return "";
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export const VALIDATION_RULES = {
  email: {
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    suggestion: "Invalid",
    validMsg: "Valid",
  },
  password: {
    regex: /^.{6,}$/,
    suggestion: "Min 6 chars",
    validMsg: "Valid",
  },
  name: {
    regex: /^[a-zA-Z0-9\s._\-\/\(\)]{2,}$/,
    suggestion: "Invalid",
    validMsg: "Valid",
  },
  text: {
    regex: /^\s*\S[\s\S]*$/,
    suggestion: "Invalid",
    validMsg: "Valid",
  },
  phone: {
    regex: /^(03\d{2}-\d{7}|\d{4}-\d{7})$/,
    suggestion: "0300-1234567 (11 Digits)",
    validMsg: "Valid (11 Digits)",
  },
  positiveNumber: {
    regex: /^(0|[1-9]\d*)(\.\d+)?$/,
    suggestion: "Invalid",
    validMsg: "Valid",
  },
  amount: {
    regex: /^[1-9]\d*(\.\d+)?$/,
    suggestion: "Invalid",
    validMsg: "Valid",
  },
  code: {
    regex: /^[a-zA-Z0-9_\-]{2,}$/,
    suggestion: "Invalid",
    validMsg: "Valid",
  },
};

export const ValidatedInput = React.forwardRef(
  (
    {
      label,
      rule = "text",
      customRegex,
      customSuggestion,
      customValidMsg,
      value = "",
      onChange,
      onValidationChange,
      required = false,
      containerClassName = "",
      className = "",
      type = "text",
      showSuccess = true,
      placeholder,
      disabled = false,
      maxLength,
      ...props
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = rule === "password" || type === "password";
    const actualType = isPasswordField ? (showPassword ? "text" : "password") : type;

    const ruleConfig = VALIDATION_RULES[rule] || VALIDATION_RULES.text;
    const activeRegex = customRegex || ruleConfig.regex;
    const suggestionText = customSuggestion || ruleConfig.suggestion || "Invalid";
    const validText = customValidMsg || ruleConfig.validMsg || "Valid";

    const strVal = value !== null && value !== undefined ? String(value) : "";
    const isEmpty = strVal.trim() === "";

    let isValid = true;
    if (required || !isEmpty) {
      isValid = activeRegex.test(strVal.trim());
    }

    useEffect(() => {
      if (onValidationChange) {
        onValidationChange(isValid);
      }
    }, [isValid, onValidationChange]);

    const handleBlur = (e) => {
      setTouched(true);
      if (props.onBlur) props.onBlur(e);
    };

    const handleKeyDown = (e) => {
      if (rule === "amount" || rule === "positiveNumber") {
        if (["e", "E", "+", "-"].includes(e.key)) {
          e.preventDefault();
        }
      }
      if (props.onKeyDown) props.onKeyDown(e);
    };

    const handleChange = (e) => {
      let finalVal = e.target.value;
      if (rule === "phone") {
        finalVal = formatPhoneNumber(finalVal);
        e.target.value = finalVal;
      } else if (rule === "amount" || rule === "positiveNumber") {
        finalVal = finalVal.replace(/[^0-9.]/g, "");
        const parts = finalVal.split(".");
        if (parts.length > 2) {
          finalVal = parts[0] + "." + parts.slice(1).join("");
        }
        e.target.value = finalVal;
      }
      if (!touched && finalVal.length > 0) {
        setTouched(true);
      }
      if (onChange) onChange(e);
    };

    const effectiveMaxLength = maxLength || (rule === "phone" ? 12 : undefined);

    const showErrorState = touched && !isValid;
    const showValidState = touched && isValid && !isEmpty && showSuccess;

    return (
      <div className={cn("space-y-1 w-full text-xs", containerClassName)}>
        {label && (
          <div className="flex items-center justify-between font-medium text-foreground">
            <span>
              {label}
              {required && <span className="text-destructive ms-0.5">*</span>}
            </span>
            {touched && (
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors duration-150 flex items-center gap-1",
                  showErrorState ? "text-destructive" : "text-emerald-500"
                )}
              >
                {showErrorState ? suggestionText : validText}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center">
          <Input
            ref={ref}
            type={actualType}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={effectiveMaxLength}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              isPasswordField ? "pe-16" : "pe-8",
              "text-xs transition-all duration-200",
              showErrorState &&
                "border-destructive bg-destructive/5 ring-1 ring-destructive/30 focus-visible:ring-destructive focus-visible:border-destructive",
              showValidState &&
                "border-emerald-500/70 bg-emerald-500/5 ring-1 ring-emerald-500/20 focus-visible:ring-emerald-500 focus-visible:border-emerald-500",
              className
            )}
            {...props}
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            {touched && (
              <div className="flex items-center justify-center pointer-events-none">
                {showErrorState ? (
                  <AlertCircleIcon className="size-3.5 text-destructive animate-in zoom-in-50 duration-150" />
                ) : showValidState ? (
                  <CheckCircle2Icon className="size-3.5 text-emerald-500 animate-in zoom-in-50 duration-150" />
                ) : null}
              </div>
            )}

            {isPasswordField && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded transition-colors focus:outline-hidden"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

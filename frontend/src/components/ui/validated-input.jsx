import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export const VALIDATION_RULES = {
  email: {
    regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    suggestion: "Enter a valid email address (e.g. user@domain.com)",
    validMsg: "Valid Email Format",
  },
  password: {
    regex: /^.{6,}$/,
    suggestion: "Minimum 6 characters required",
    validMsg: "Password Strength OK",
  },
  name: {
    regex: /^[a-zA-Z0-9\s._\-\/\(\)]{2,}$/,
    suggestion: "Minimum 2 characters required",
    validMsg: "Valid Name",
  },
  text: {
    regex: /^\s*\S[\s\S]*$/,
    suggestion: "This field cannot be empty",
    validMsg: "Looks Good",
  },
  phone: {
    regex: /^[0-9\+\-\s\(\)]{7,15}$/,
    suggestion: "Enter valid contact number (7-15 digits)",
    validMsg: "Valid Contact",
  },
  positiveNumber: {
    regex: /^(0|[1-9]\d*)(\.\d+)?$/,
    suggestion: "Enter a valid non-negative number",
    validMsg: "Valid Number",
  },
  amount: {
    regex: /^[1-9]\d*(\.\d+)?$/,
    suggestion: "Enter amount greater than 0",
    validMsg: "Valid Amount",
  },
  code: {
    regex: /^[a-zA-Z0-9_\-]{2,}$/,
    suggestion: "Min 2 alphanumeric chars required",
    validMsg: "Valid Code",
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
      ...props
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false);

    const ruleConfig = VALIDATION_RULES[rule] || VALIDATION_RULES.text;
    const activeRegex = customRegex || ruleConfig.regex;
    const suggestionText = customSuggestion || ruleConfig.suggestion;
    const validText = customValidMsg || ruleConfig.validMsg;

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

    const handleChange = (e) => {
      if (!touched && e.target.value.length > 0) {
        setTouched(true);
      }
      if (onChange) onChange(e);
    };

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
            type={type}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              "pe-8 text-xs transition-all duration-200",
              showErrorState &&
                "border-destructive bg-destructive/5 ring-1 ring-destructive/30 focus-visible:ring-destructive focus-visible:border-destructive",
              showValidState &&
                "border-emerald-500/70 bg-emerald-500/5 ring-1 ring-emerald-500/20 focus-visible:ring-emerald-500 focus-visible:border-emerald-500",
              className
            )}
            {...props}
          />
          {touched && (
            <div className="absolute right-2.5 pointer-events-none flex items-center justify-center">
              {showErrorState ? (
                <AlertCircleIcon className="size-4 text-destructive animate-in zoom-in-50 duration-150" />
              ) : showValidState ? (
                <CheckCircle2Icon className="size-4 text-emerald-500 animate-in zoom-in-50 duration-150" />
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

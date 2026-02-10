/**
 * FormField Component
 *
 * A reusable form field component that provides consistent styling and structure
 * for various input types across the application. Supports labels, hints, errors,
 * and multiple input variants.
 *
 * Usage examples:
 *
 * // Text input
 * <FormField label="Name" name="name" value={value} onChange={onChange} />
 *
 * // Select dropdown
 * <FormField label="Function" type="select" name="function" value={value} onChange={onChange}>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </FormField>
 *
 * // Textarea
 * <FormField label="Description" type="textarea" name="desc" value={value} onChange={onChange} rows={4} />
 *
 * // Checkbox
 * <FormField label="Enable" type="checkbox" name="enable" checked={checked} onChange={onChange} />
 *
 * // Custom content
 * <FormField label="Custom">
 *   <div>Your custom content here</div>
 * </FormField>
 */

import type { ReactNode, ChangeEvent, FocusEvent } from 'react';
import formStyles from '@/lib/styles/forms.module.css';

type InputType = 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'custom';

type Theme = 'light' | 'dark';

type Size = 'default' | 'small';

interface BaseFormFieldProps {
  /** Label text displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  hint?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Whether the field is required (adds asterisk to label) */
  required?: boolean;
  /** Theme variant (light or dark) */
  theme?: Theme;
  /** Size variant */
  size?: Size;
  /** Additional CSS class for the field container */
  className?: string;
  /** Additional CSS class for the label */
  labelClassName?: string;
  /** Additional CSS class for the input */
  inputClassName?: string;
  /** Unique identifier for the input */
  id?: string;
  /** Name attribute for the input */
  name?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is readonly */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA description for accessibility */
  'aria-describedby'?: string;
}

interface TextInputProps extends BaseFormFieldProps {
  type?: 'text';
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  children?: never;
}

interface NumberInputProps extends BaseFormFieldProps {
  type: 'number';
  value?: number | string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  children?: never;
}

interface SelectInputProps extends BaseFormFieldProps {
  type: 'select';
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: FocusEvent<HTMLSelectElement>) => void;
  onFocus?: (e: FocusEvent<HTMLSelectElement>) => void;
  /** Select options (rendered as children) */
  children: ReactNode;
}

interface TextareaInputProps extends BaseFormFieldProps {
  type: 'textarea';
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: FocusEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  children?: never;
}

interface CheckboxInputProps extends BaseFormFieldProps {
  type: 'checkbox';
  checked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  value?: string;
  children?: never;
}

interface CustomInputProps extends BaseFormFieldProps {
  type: 'custom';
  /** Custom input content */
  children: ReactNode;
}

export type FormFieldProps =
  | TextInputProps
  | NumberInputProps
  | SelectInputProps
  | TextareaInputProps
  | CheckboxInputProps
  | CustomInputProps;

/**
 * Determines the input CSS class based on type, theme, and size
 */
function getInputClassName(
  type: InputType,
  theme: Theme,
  size: Size,
  error: string | undefined,
  customClassName?: string
): string {
  const classes: string[] = [];

  if (type === 'select') {
    classes.push(formStyles['input-select']);
    if (theme === 'dark') classes.push(formStyles.dark);
    if (size === 'small') classes.push(formStyles.small);
  } else if (type === 'textarea') {
    classes.push(formStyles['input-textarea']);
    if (theme === 'dark') classes.push(formStyles.dark);
  } else if (type === 'checkbox') {
    classes.push(formStyles['input-checkbox']);
    if (theme === 'dark') classes.push(formStyles.dark);
  } else if (type === 'text' || type === 'number') {
    if (size === 'small') {
      classes.push(formStyles['input-small']);
    } else if (theme === 'dark') {
      classes.push(formStyles['input-dark']);
    } else {
      classes.push(formStyles['input-field']);
    }
  }

  if (error) {
    classes.push(formStyles.error);
  }

  if (customClassName) {
    classes.push(customClassName);
  }

  return classes.filter(Boolean).join(' ');
}

/**
 * FormField Component
 * Provides a consistent wrapper for form inputs with label, hint, and error display
 */
export function FormField(props: FormFieldProps) {
  const {
    label,
    hint,
    error,
    required = false,
    theme = 'light',
    size = 'default',
    className,
    labelClassName,
    inputClassName,
    id,
    name,
    disabled = false,
    readOnly = false,
    placeholder,
    autoFocus = false,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    type = 'text',
  } = props;

  // Generate unique ID if not provided
  const inputId = id || (name ? `field-${name}` : undefined);
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, hintId, errorId].filter(Boolean).join(' ') || undefined;

  // Render the appropriate input element
  const renderInput = () => {
    const inputClass = getInputClassName(type, theme, size, error, inputClassName);

    if (type === 'custom' && 'children' in props) {
      return props.children;
    }

    if (type === 'select' && 'children' in props) {
      const selectProps = props as SelectInputProps;
      return (
        <select
          id={inputId}
          name={name}
          value={selectProps.value}
          onChange={selectProps.onChange}
          onBlur={selectProps.onBlur}
          onFocus={selectProps.onFocus}
          className={inputClass}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          autoFocus={autoFocus}
        >
          {selectProps.children}
        </select>
      );
    }

    if (type === 'textarea') {
      const textareaProps = props as TextareaInputProps;
      return (
        <textarea
          id={inputId}
          name={name}
          value={textareaProps.value}
          onChange={textareaProps.onChange}
          onBlur={textareaProps.onBlur}
          onFocus={textareaProps.onFocus}
          className={inputClass}
          rows={textareaProps.rows || 3}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          autoFocus={autoFocus}
        />
      );
    }

    if (type === 'checkbox') {
      const checkboxProps = props as CheckboxInputProps;
      return (
        <input
          type="checkbox"
          id={inputId}
          name={name}
          checked={checkboxProps.checked}
          value={checkboxProps.value}
          onChange={checkboxProps.onChange}
          onBlur={checkboxProps.onBlur}
          onFocus={checkboxProps.onFocus}
          className={inputClass}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          autoFocus={autoFocus}
        />
      );
    }

    if (type === 'number') {
      const numberProps = props as NumberInputProps;
      return (
        <input
          type="number"
          id={inputId}
          name={name}
          value={numberProps.value}
          onChange={numberProps.onChange}
          onBlur={numberProps.onBlur}
          onFocus={numberProps.onFocus}
          className={inputClass}
          min={numberProps.min}
          max={numberProps.max}
          step={numberProps.step}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          autoFocus={autoFocus}
        />
      );
    }

    // Default to text input
    const textProps = props as TextInputProps;
    return (
      <input
        type="text"
        id={inputId}
        name={name}
        value={textProps.value}
        onChange={textProps.onChange}
        onBlur={textProps.onBlur}
        onFocus={textProps.onFocus}
        className={inputClass}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={error ? 'true' : undefined}
        autoFocus={autoFocus}
      />
    );
  };

  // Determine container class
  const containerClass = className || formStyles['form-group'];

  // Determine label class
  const labelClass = labelClassName || `${formStyles['form-label']}${theme === 'dark' ? ` ${formStyles.dark}` : ''}${required ? ` ${formStyles.required}` : ''}`;

  return (
    <div className={containerClass}>
      {label && (
        <label htmlFor={inputId} className={labelClass}>
          {label}
        </label>
      )}
      {renderInput()}
      {hint && !error && (
        <div id={hintId} className={`${formStyles['form-hint']}${theme === 'dark' ? ` ${formStyles.dark}` : ''}`}>
          {hint}
        </div>
      )}
      {error && (
        <div id={errorId} className={`${formStyles['form-error']}${theme === 'dark' ? ` ${formStyles.dark}` : ''}`}>
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Convenience component for checkbox fields with label on the right
 * This matches the common pattern where checkboxes have labels next to them
 */
export function FormFieldCheckbox(
  props: Omit<CheckboxInputProps, 'type'> & { labelPosition?: 'left' | 'right' }
) {
  const { label, labelPosition = 'right', theme = 'light', className, ...rest } = props;

  if (labelPosition === 'left' || !label) {
    return <FormField {...rest} type="checkbox" label={label} theme={theme} className={className} />;
  }

  // For right-positioned label, render checkbox and label inline
  const inputId = rest.id || (rest.name ? `field-${rest.name}` : undefined);
  const inputClass = getInputClassName('checkbox', theme, 'default', rest.error, rest.inputClassName);

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        id={inputId}
        name={rest.name}
        checked={rest.checked}
        value={rest.value}
        onChange={rest.onChange}
        onBlur={rest.onBlur}
        onFocus={rest.onFocus}
        className={inputClass}
        disabled={rest.disabled}
        aria-label={rest['aria-label']}
        aria-describedby={rest['aria-describedby']}
        aria-invalid={rest.error ? 'true' : undefined}
        autoFocus={rest.autoFocus}
      />
      <label
        htmlFor={inputId}
        className={rest.labelClassName || formStyles['form-label']}
        style={{ margin: 0, cursor: rest.disabled ? 'not-allowed' : 'pointer' }}
      >
        {label}
      </label>
    </div>
  );
}

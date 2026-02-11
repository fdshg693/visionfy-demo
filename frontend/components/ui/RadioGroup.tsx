/**
 * RadioGroup Component
 *
 * A reusable radio group component for selecting one option from multiple choices.
 * Each option can have a label and description for better context.
 *
 * Usage example:
 * <RadioGroup
 *   name="format"
 *   value={selectedValue}
 *   onChange={setValue}
 *   options={[
 *     { value: 'simple', label: 'Simple Format', description: 'Basic data only' },
 *     { value: 'full', label: 'Full Format', description: 'Complete workflow state' }
 *   ]}
 * />
 */

import styles from './RadioGroup.module.css';

export type RadioOption = {
  value: string;
  label: string;
  description?: string;
};

type RadioGroupProps = {
  /** Radio group name (required for grouping) */
  name: string;
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Array of radio options */
  options: RadioOption[];
  /** Whether the radio group is disabled */
  disabled?: boolean;
  /** Additional CSS class for the container */
  className?: string;
};

/**
 * RadioGroup component for selecting one option from multiple choices
 */
export function RadioGroup({
  name,
  value,
  onChange,
  options,
  disabled = false,
  className,
}: RadioGroupProps) {
  return (
    <div className={`${styles.radioGroup} ${className || ''}`} role="radiogroup">
      {options.map((option) => {
        const inputId = `${name}-${option.value}`;
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={`${styles.radioOption} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
          >
            <input
              type="radio"
              id={inputId}
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className={styles.radioInput}
            />
            <div className={styles.radioContent}>
              <div className={styles.radioLabel}>{option.label}</div>
              {option.description && (
                <div className={styles.radioDescription}>{option.description}</div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

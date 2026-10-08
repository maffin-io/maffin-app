import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

export type ReportFormat = 'pdf' | 'excel';

const OPTIONS: { value: ReportFormat, label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
];

export type ReportFormatInputProps = {
  registration: UseFormRegisterReturn<'format'>,
};

export default function ReportFormatInput({
  registration,
}: ReportFormatInputProps): React.JSX.Element {
  return (
    <fieldset className="text-center">
      <legend className="inline-block text-sm my-2">Format</legend>
      <div className="flex justify-center gap-4">
        {OPTIONS.map(option => (
          <label
            key={option.value}
            htmlFor={`format-${option.value}`}
            className="flex items-center gap-1 cursor-pointer"
          >
            <input
              id={`format-${option.value}`}
              type="radio"
              value={option.value}
              className="accent-primary"
              {...registration}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

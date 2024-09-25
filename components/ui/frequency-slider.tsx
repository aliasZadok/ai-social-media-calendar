import React from 'react';
import { Slider } from "@/components/ui/slider"

const frequencyOptions = [
  { value: 1, label: 'Daily' },
  { value: 7, label: 'Weekly' },
  { value: 14, label: 'Bi-weekly' },
  { value: 30, label: 'Monthly' }
] as const;

type FrequencyOption = typeof frequencyOptions[number]['value'];

interface FrequencySliderProps {
  value: FrequencyOption;
  onChange: (value: FrequencyOption) => void;
}

export default function FrequencySlider({ value, onChange }: FrequencySliderProps) {
  const getLabel = (val: FrequencyOption): string => {
    const option = frequencyOptions.find(opt => opt.value === val);
    return option ? option.label : '';
  };

  const handleValueChange = (newValue: number[]) => {
    const exactMatch = frequencyOptions.find(opt => opt.value === newValue[0]);
    if (exactMatch) {
      onChange(exactMatch.value);
    }
  };

  // Convert frequency value to slider index
  const valueToIndex = (val: FrequencyOption): number => {
    return frequencyOptions.findIndex(opt => opt.value === val);
  };

  return (
    <div className="space-y-4">
      <label htmlFor="frequency-slider" className="block text-sm font-medium text-gray-700">
        How often do you want to post?
      </label>
      <Slider
        id="frequency-slider"
        min={0}
        max={frequencyOptions.length - 1}
        step={1}
        value={[valueToIndex(value)]}
        onValueChange={(newValue) => handleValueChange([frequencyOptions[newValue[0]].value])}
        className="w-[calc(100%-1rem)] mx-2"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        {frequencyOptions.map((option, index) => (
          <span
            key={option.value}
            className={valueToIndex(value) === index ? 'font-bold text-foreground' : ''}
          >
            {option.label}
          </span>
        ))}
      </div>
    </div>
  );
}
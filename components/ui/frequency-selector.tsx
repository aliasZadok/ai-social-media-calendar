import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const frequencyOptions = [
  { value: 1, label: '1 post per week (Every Monday)', days: ['Monday'] },
  { value: 2, label: '2 posts per week (Tuesday and Friday)', days: ['Tuesday', 'Friday'] },
  { value: 3, label: '3 posts per week (Monday, Wednesday, Friday)', days: ['Monday', 'Wednesday', 'Friday'] },
  { value: 5, label: '5 posts per week (Monday through Friday)', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  { value: 7, label: '7 posts per week (Daily)', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
];

interface FrequencySelectorProps {
  value: number;
  onChange: (value: number, days: string[]) => void;
  maxFrequency: number;
}

export default function FrequencySelector({ value, onChange, maxFrequency }: FrequencySelectorProps) {
  const handleChange = (newValue: string) => {
    const selectedOption = frequencyOptions.find(option => option.value === parseInt(newValue));
    if (selectedOption) {
      onChange(selectedOption.value, selectedOption.days);
    }
  };

  const filteredOptions = React.useMemo(() => 
    frequencyOptions.filter(option => option.value <= maxFrequency),
    [maxFrequency]
  );

  const selectedOption = React.useMemo(() => 
    filteredOptions.find(option => option.value === value) || filteredOptions[0],
    [filteredOptions, value]
  );

  React.useEffect(() => {
    if (value > maxFrequency) {
      const newOption = filteredOptions[filteredOptions.length - 1];
      onChange(newOption.value, newOption.days);
    }
  }, [maxFrequency, value, onChange, filteredOptions]);

  return (
    <div className="space-y-4">
      <label htmlFor="frequency-selector" className="block text-sm font-medium text-gray-700">
        How often do you want to post?
      </label>
      <Select onValueChange={handleChange} value={selectedOption.value.toString()}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select posting frequency" />
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
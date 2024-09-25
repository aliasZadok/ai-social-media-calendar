import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount = true, onChange, value, maxLength, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0);

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const input = maxLength ? e.target.value.slice(0, maxLength) : e.target.value;
      setCharCount(input.length);
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: input }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          onChange={handleChange}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
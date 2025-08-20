import { useState } from 'react';
import { Link, Clipboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: (url: string) => void;
  isValidating: boolean;
}

export function UrlInput({ value, onChange, onValidate, isValidating }: UrlInputProps) {
  const [hasFocus, setHasFocus] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounce validation
    setTimeout(() => {
      if (newValue.trim()) {
        onValidate(newValue);
      }
    }, 500);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
      onValidate(text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        File URL
      </Label>
      <div className="relative">
        <Input
          id="url-input"
          type="url"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setHasFocus(true)}
          onBlur={() => setHasFocus(false)}
          placeholder="https://example.com/file.mp4"
          className={`w-full pl-12 pr-12 py-3 rounded-xl transition-all duration-200 ${
            hasFocus 
              ? 'ring-2 ring-primary border-primary' 
              : 'border-gray-300 dark:border-gray-600'
          } ${isValidating ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
          disabled={isValidating}
        />
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Link className={`h-5 w-5 transition-colors ${
            hasFocus ? 'text-primary' : 'text-gray-400'
          }`} />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handlePaste}
          className="absolute inset-y-0 right-0 pr-4 text-primary hover:text-primary/80"
          disabled={isValidating}
        >
          <Clipboard className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

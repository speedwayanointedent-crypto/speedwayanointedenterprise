import React from 'react';
import { Minus, Plus } from 'lucide-react';
import classNames from 'classnames';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showWarning?: boolean;
  warningThreshold?: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = Infinity,
  disabled = false,
  size = 'md',
  showWarning = false,
  warningThreshold = 5
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const sizeClasses = {
    sm: {
      button: 'w-7 h-7',
      input: 'w-10 text-xs',
      icon: 'h-3 w-3'
    },
    md: {
      button: 'w-8 h-8',
      input: 'w-12 text-sm',
      icon: 'h-4 w-4'
    },
    lg: {
      button: 'w-10 h-10',
      input: 'w-14 text-base',
      icon: 'h-5 w-5'
    }
  };

  const isLowStock = showWarning && value <= warningThreshold && value > 0;
  const isMaxReached = value >= max;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={classNames(
          'flex items-center justify-center rounded-lg border border-border bg-background transition-all duration-200',
          sizeClasses[size].button,
          'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40',
          'focus:outline-none focus:ring-2 focus:ring-primary/20'
        )}
      >
        <Minus className={sizeClasses[size].icon} />
      </button>

      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className={classNames(
          'flex items-center justify-center rounded-lg border border-border bg-background text-center font-semibold transition-all duration-200',
          sizeClasses[size].input,
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-40',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          isLowStock && 'border-warning text-warning',
          isMaxReached && !isLowStock && 'border-destructive text-destructive'
        )}
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={classNames(
          'flex items-center justify-center rounded-lg border border-border bg-background transition-all duration-200',
          sizeClasses[size].button,
          'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40',
          'focus:outline-none focus:ring-2 focus:ring-primary/20'
        )}
      >
        <Plus className={sizeClasses[size].icon} />
      </button>
    </div>
  );
};

interface StockIndicatorProps {
  quantity: number;
  lowThreshold?: number;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  quantity,
  lowThreshold = 5
}) => {
  const getStatus = () => {
    if (quantity <= 0) return { color: 'destructive', label: 'Out of Stock' };
    if (quantity <= lowThreshold) return { color: 'warning', label: `Low Stock (${quantity})` };
    return { color: 'success', label: 'In Stock' };
  };

  const status = getStatus();

  return (
    <div
      className={classNames(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        {
          'bg-destructive/10 text-destructive': status.color === 'destructive',
          'bg-warning/10 text-warning': status.color === 'warning',
          'bg-success/10 text-success': status.color === 'success'
        }
      )}
    >
      <span
        className={classNames('h-1.5 w-1.5 rounded-full', {
          'bg-destructive': status.color === 'destructive',
          'bg-warning': status.color === 'warning',
          'bg-success': status.color === 'success'
        })}
      />
      {status.label}
    </div>
  );
};

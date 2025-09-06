import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({ text, disabled = false, speed = 5, className = '' }) => {
  return (
    <div
      className={`shiny-text ${disabled ? 'disabled' : ''} ${className}`}
      style={{
        animationDuration: `${speed}s`
      }}
    >
      {text}
    </div>
  );
};

export default ShinyText;
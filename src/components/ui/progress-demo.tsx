import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function ProgressDemo() {
  const [value, setValue] = useState(0);
  
  return (
    <div className="flex flex-col gap-4 w-1/2 p-6">
      <h3 className="text-lg font-semibold">Progress Bar Demo</h3>
      
      {/* Dynamic Colors Progress Bar */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Dynamic Colors Progress</label>
        <Progress
          colors={{
            0: "var(--geist-foreground)",
            25: "var(--geist-error)",
            50: "var(--geist-warning)",
            75: "var(--geist-highlight-pink)",
            100: "var(--geist-success)"
          }}
          value={value}
        />
        <div className="text-sm text-muted-foreground">Value: {value}%</div>
      </div>

      {/* Type-based Progress Bars */}
      <div className="space-y-4">
        <label className="text-sm font-medium">Type-based Progress Bars</label>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Default</label>
          <Progress type="default" value={value} />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Success</label>
          <Progress type="success" value={value} />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Warning</label>
          <Progress type="warning" value={value} />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Error</label>
          <Progress type="error" value={value} />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Secondary</label>
          <Progress type="secondary" value={value} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <Button
          onClick={() => {
            if (value < 100) setValue(value + 10);
          }}
          disabled={value >= 100}
        >
          Increase (+10)
        </Button>
        <Button
          onClick={() => {
            if (value > 0) setValue(value - 10);
          }}
          disabled={value <= 0}
          variant="outline"
        >
          Decrease (-10)
        </Button>
        <Button
          onClick={() => setValue(0)}
          variant="secondary"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

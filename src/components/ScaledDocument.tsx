import React, { useRef, useState, useEffect } from "react";

export function ScaledDocument({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const docWidth = 1050; // Largeur fixe du DocumentTemplate
      const padding = 32; // 16px de chaque côté
      const availableWidth = width - padding;
      
      if (availableWidth < docWidth) {
        setScale(availableWidth / docWidth);
      } else {
        setScale(1);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center overflow-x-hidden">
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: "top center",
          width: "1050px", 
          display: "flex", 
          flexDirection: "column",
          marginBottom: `-${1485 * (1 - scale)}px` // Reduce the logical bottom margin so we don't have massive empty scroll space
        }}
      >
        {children}
      </div>
    </div>
  );
}

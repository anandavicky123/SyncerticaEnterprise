"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  delay = 500,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTimeout, setShowTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }

    const timeout = setTimeout(() => {
      // Calculate position based on trigger element
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        let x = rect.left + scrollX;
        let y = rect.top + scrollY;

        switch (position) {
          case "top":
            x += rect.width / 2;
            y -= 8;
            break;
          case "bottom":
            x += rect.width / 2;
            y += rect.height + 8;
            break;
          case "left":
            x -= 8;
            y += rect.height / 2;
            break;
          case "right":
            x += rect.width + 8;
            y += rect.height / 2;
            break;
        }

        setTooltipPosition({ x, y });
      }
      setIsVisible(true);
    }, delay);
    setShowTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (showTimeout) {
      clearTimeout(showTimeout);
      setShowTimeout(null);
    }

    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 100);
    setHideTimeout(timeout);
  };

  const getTooltipStyles = () => {
    const baseStyle = {
      position: "fixed" as const,
      left: `${tooltipPosition.x}px`,
      top: `${tooltipPosition.y}px`,
      zIndex: 999999,
    };

    switch (position) {
      case "top":
        return {
          ...baseStyle,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          ...baseStyle,
          transform: "translate(-50%, 0%)",
        };
      case "left":
        return {
          ...baseStyle,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          ...baseStyle,
          transform: "translate(0%, -50%)",
        };
      default:
        return {
          ...baseStyle,
          transform: "translate(-50%, -100%)",
        };
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200"
            style={getTooltipStyles()}
          >
            {content}
          </div>,
          document.body
        )}
    </div>
  );
};

export default Tooltip;

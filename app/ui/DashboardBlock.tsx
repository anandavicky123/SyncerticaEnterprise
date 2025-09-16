import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  X,
} from "lucide-react";
import { DashboardBlock } from "../shared/types/dashboard";

interface DashboardBlockProps {
  block: DashboardBlock;
  onRemove?: (blockId: string) => void;
  onMinimize?: (blockId: string) => void;
}

const DashboardBlockComponent: React.FC<DashboardBlockProps> = ({
  block,
  onRemove,
  onMinimize,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (onMinimize) {
      onMinimize(block.id);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(block.id);
    }
  };
  const renderBlock = () => {
    switch (block.type) {
      case "metric":
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                {block.title}
              </h3>
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={handleMinimize}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Minimize block"
                >
                  <Minus className="w-3 h-3 text-gray-400" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Remove block"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            {!isMinimized && (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {block.value}
                  </span>
                  <span
                    className={`text-sm flex items-center gap-1 ${
                      block.changeType === "positive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {block.changeType === "positive" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {block.change}
                  </span>
                </div>
                {block.period && (
                  <p className="text-xs text-gray-500 mt-1">{block.period}</p>
                )}
              </>
            )}
          </div>
        );
      case "chart":
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                {block.title}
              </h3>
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={handleMinimize}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Minimize block"
                >
                  <Minus className="w-3 h-3 text-gray-400" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Remove block"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            {!isMinimized && (
              <div className="h-48 bg-gradient-to-br from-blue-50 to-cyan-50 rounded flex items-center justify-center">
                <BarChart3 className="w-12 h-12 text-blue-400" />
                <span className="ml-2 text-blue-600">Chart Visualization</span>
              </div>
            )}
          </div>
        );
      case "pie":
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                {block.title}
              </h3>
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={handleMinimize}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Minimize block"
                >
                  <Minus className="w-3 h-3 text-gray-400" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Remove block"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            {!isMinimized && (
              <>
                <div className="flex items-center justify-center h-48">
                  <div className="relative">
                    <PieChart className="w-32 h-32 text-blue-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm text-gray-600">Expenses</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {block.data?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      case "line":
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                {block.title}
              </h3>
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={handleMinimize}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Minimize block"
                >
                  <Minus className="w-3 h-3 text-gray-400" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Remove block"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            {!isMinimized && (
              <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-green-400" />
                <div className="ml-4">
                  <p className="text-green-600 font-medium">Sep-22</p>
                  <p className="text-sm text-gray-500">
                    Forecast: {block.forecast}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      case "comparison":
        return (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                {block.title}
              </h3>
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <button
                  onClick={handleMinimize}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Minimize block"
                >
                  <Minus className="w-3 h-3 text-gray-400" />
                </button>
                <button
                  onClick={handleRemove}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Remove block"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            {!isMinimized && (
              <div className="h-48 bg-gradient-to-br from-purple-50 to-pink-50 rounded flex items-center justify-center">
                <Activity className="w-12 h-12 text-purple-400" />
                <span className="ml-2 text-purple-600">Comparison Chart</span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="relative transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderBlock()}
    </div>
  );
};

export default DashboardBlockComponent;

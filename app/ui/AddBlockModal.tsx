import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { DashboardBlock } from "../shared/types/dashboard";

interface AddBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: string;
  onAddBlock: (block: DashboardBlock) => void;
}

const AddBlockModal: React.FC<AddBlockModalProps> = ({
  isOpen,
  onClose,
  section,
  onAddBlock,
}) => {
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);

  // Available blocks based on section
  const getAvailableBlocks = () => {
    const blockTemplates = {
      overview: [
        {
          id: "total-users",
          title: "Total Users",
          type: "metric" as const,
          value: "12,543",
          change: "+12%",
          icon: "👥",
          color: "blue",
        },
        {
          id: "revenue",
          title: "Revenue",
          type: "metric" as const,
          value: "$45,231",
          change: "+8%",
          icon: "💰",
          color: "green",
        },
        {
          id: "conversion-rate",
          title: "Conversion Rate",
          type: "metric" as const,
          value: "3.2%",
          change: "+0.5%",
          icon: "📈",
          color: "purple",
        },
        {
          id: "active-sessions",
          title: "Active Sessions",
          type: "metric" as const,
          value: "2,341",
          change: "-2%",
          icon: "🔥",
          color: "orange",
        },
        {
          id: "performance-chart",
          title: "Performance Overview",
          type: "chart" as const,
          value: "Chart Data",
          change: "",
          icon: "📊",
          color: "blue",
        },
        {
          id: "recent-activity",
          title: "Recent Activity",
          type: "comparison" as const,
          value: "Activity List",
          change: "",
          icon: "⚡",
          color: "gray",
        },
      ],
      sales: [
        {
          id: "total-sales",
          title: "Total Sales",
          type: "metric" as const,
          value: "$89,543",
          change: "+15%",
          icon: "💵",
          color: "green",
        },
        {
          id: "monthly-targets",
          title: "Monthly Targets",
          type: "metric" as const,
          value: "85%",
          change: "+5%",
          icon: "🎯",
          color: "blue",
        },
        {
          id: "top-products",
          title: "Top Products",
          type: "comparison" as const,
          value: "Product List",
          change: "",
          icon: "🏆",
          color: "yellow",
        },
        {
          id: "sales-funnel",
          title: "Sales Funnel",
          type: "chart" as const,
          value: "Funnel Data",
          change: "",
          icon: "🔄",
          color: "purple",
        },
        {
          id: "customer-acquisition",
          title: "Customer Acquisition",
          type: "metric" as const,
          value: "234",
          change: "+18%",
          icon: "🎉",
          color: "pink",
        },
        {
          id: "sales-by-region",
          title: "Sales by Region",
          type: "chart" as const,
          value: "Regional Data",
          change: "",
          icon: "🌍",
          color: "blue",
        },
      ],
      workers: [
        {
          id: "total-employees",
          title: "Total Employees",
          type: "metric" as const,
          value: "1,247",
          change: "+23",
          icon: "👨‍💼",
          color: "blue",
        },
        {
          id: "attendance-rate",
          title: "Attendance Rate",
          type: "metric" as const,
          value: "96.5%",
          change: "+1.2%",
          icon: "✅",
          color: "green",
        },
        {
          id: "performance-rating",
          title: "Avg Performance",
          type: "metric" as const,
          value: "8.7/10",
          change: "+0.3",
          icon: "⭐",
          color: "yellow",
        },
        {
          id: "department-breakdown",
          title: "Department Breakdown",
          type: "chart" as const,
          value: "Department Data",
          change: "",
          icon: "🏢",
          color: "purple",
        },
        {
          id: "recent-hires",
          title: "Recent Hires",
          type: "comparison" as const,
          value: "New Employees",
          change: "",
          icon: "🆕",
          color: "green",
        },
        {
          id: "productivity-trends",
          title: "Productivity Trends",
          type: "chart" as const,
          value: "Productivity Data",
          change: "",
          icon: "📈",
          color: "orange",
        },
      ],
    };

    return blockTemplates[section as keyof typeof blockTemplates] || [];
  };

  const availableBlocks = getAvailableBlocks();

  const handleBlockToggle = (blockId: string) => {
    setSelectedBlocks((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [...prev, blockId]
    );
  };

  const handleAddBlocks = () => {
    selectedBlocks.forEach((blockId) => {
      const blockTemplate = availableBlocks.find((b) => b.id === blockId);
      if (blockTemplate) {
        const newBlock: DashboardBlock = {
          ...blockTemplate,
          id: `${blockTemplate.id}-${Date.now()}`, // Make unique
        };
        onAddBlock(newBlock);
      }
    });

    setSelectedBlocks([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Blocks</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select blocks to add to your {section} dashboard
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableBlocks.map((block) => (
              <div
                key={block.id}
                onClick={() => handleBlockToggle(block.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedBlocks.includes(block.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{block.icon}</span>
                    <span
                      className={`w-2 h-2 rounded-full bg-${block.color}-500`}
                    ></span>
                  </div>
                  {selectedBlocks.includes(block.id) && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Plus className="w-3 h-3 text-white rotate-45" />
                    </div>
                  )}
                </div>

                <h3 className="font-medium text-gray-900 mb-2">
                  {block.title}
                </h3>

                <div className="space-y-1">
                  <div className="text-lg font-semibold text-gray-900">
                    {block.value}
                  </div>
                  {block.change && (
                    <div
                      className={`text-sm ${
                        block.change.startsWith("+")
                          ? "text-green-600"
                          : block.change.startsWith("-")
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {block.change}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 capitalize">
                    {block.type} block
                  </div>
                </div>
              </div>
            ))}
          </div>

          {availableBlocks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <p>No blocks available for this section</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedBlocks.length} block
            {selectedBlocks.length !== 1 ? "s" : ""} selected
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBlocks}
              disabled={selectedBlocks.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedBlocks.length} Block
              {selectedBlocks.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBlockModal;

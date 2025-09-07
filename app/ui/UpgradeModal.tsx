"use client";

import React from "react";
import { Lock, CheckCircle } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: "workers" | "audit-logs" | "priority-support";
}

const featureDescriptions = {
  workers: "Add unlimited workers to your team",
  "audit-logs": "Access detailed security audit logs",
  "priority-support": "Get priority support and custom solutions",
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  feature,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upgrade to Pro
          </h2>
          <p className="text-gray-600">
            Get access to advanced features and take your team management to the
            next level
          </p>
        </div>

        {/* Feature List */}
        <div className="px-6 py-4 border-t border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            Pro features include:
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Unlimited Workers</p>
                <p className="text-sm text-gray-500">
                  Add as many workers as you need
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Security Audit Logs</p>
                <p className="text-sm text-gray-500">
                  Detailed security tracking and compliance
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Priority Support</p>
                <p className="text-sm text-gray-500">
                  Get help when you need it most
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-end bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: Implement upgrade flow
              alert("Upgrade flow will be implemented here");
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;

"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  WebSocketMessage,
  ActivityFeedItem,
  OnlineUser,
} from "../shared/types/dashboard";
import {
  mockNotifications,
  mockActivityFeed,
  mockOnlineUsers,
} from "../shared/constants/dashboardData";
import Tooltip from "./Tooltip";

interface RealtimeNotificationsProps {
  className?: string;
}

const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({
  className = "",
}) => {
  const [notifications, setNotifications] =
    useState<WebSocketMessage[]>(mockNotifications);
  const [activityFeed, setActivityFeed] =
    useState<ActivityFeedItem[]>(mockActivityFeed);
  const [onlineUsers] = useState<OnlineUser[]>(mockOnlineUsers);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new notification
      if (Math.random() > 0.8) {
        const newNotification: WebSocketMessage = {
          id: Date.now().toString(),
          type: Math.random() > 0.5 ? "notification" : "activity",
          title: "Real-time Update",
          message: `Simulated AWS ${
            Math.random() > 0.5 ? "Lambda" : "DynamoDB"
          } event at ${new Date().toLocaleTimeString()}`,
          timestamp: new Date().toISOString(),
          severity: Math.random() > 0.7 ? "high" : "medium",
          read: false,
        };

        setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]);
      }

      // Simulate activity feed updates
      if (Math.random() > 0.9) {
        const actions = [
          "deployed to AWS",
          "updated configuration",
          "completed task",
          "joined meeting",
        ];
        const newActivity: ActivityFeedItem = {
          id: Date.now().toString(),
          userId: `user-${Math.floor(Math.random() * 5)}`,
          userName: `User ${Math.floor(Math.random() * 5) + 1}`,
          action: actions[Math.floor(Math.random() * actions.length)],
          target: "AWS Environment",
          timestamp: new Date().toISOString(),
          type: "task_completed",
        };

        setActivityFeed((prev) => [newActivity, ...prev.slice(0, 9)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium":
        return <Info className="w-4 h-4 text-blue-500" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Tooltip
        content={`${
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "No new notifications"
        }`}
      >
        <button
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </Tooltip>

      {/* Notification Panel */}
      {isNotificationOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white shadow-2xl rounded-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Real-time Updates
            </h3>
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Notifications Tab */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Notifications
              </h4>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.read
                        ? "bg-gray-50 border-gray-200"
                        : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(notification.severity || "low")}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(
                            notification.timestamp
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Recent Activity
              </h4>
              <div className="space-y-3">
                {activityFeed.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      {activity.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.userName}</span>{" "}
                        {activity.action}{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Online Users */}
            <div className="p-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Online Users
              </h4>
              <div className="flex flex-wrap gap-2">
                {onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
                  >
                    <div className="relative">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                          user.status
                        )}`}
                      />
                    </div>
                    <span className="text-xs text-gray-700">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeNotifications;

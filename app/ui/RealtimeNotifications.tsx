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
import { WebSocketMessage } from "../shared/types/dashboard";
import Tooltip from "./Tooltip";

interface RealtimeNotificationsProps {
  className?: string;
}

const RealtimeNotifications: React.FC<RealtimeNotificationsProps> = ({
  className = "",
}) => {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  // activityFeed and onlineUsers removed — notifications only
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    // Poll notifications from server every 8 seconds
    let mounted = true;

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();

        // Map Dynamo items to WebSocketMessage-compatible shape
        type NotificationFromServer = {
          notifId: string;
          type: string;
          message?: string;
          workerId?: string;
          taskId?: string;
          createdAt: string;
          status: string;
        };

        const mapped: WebSocketMessage[] = (
          data as NotificationFromServer[]
        ).map((n) => ({
          id: n.notifId,
          type: n.type === "worker_message" ? "message" : "notification",
          title: undefined,
          message: n.message || "",
          timestamp: n.createdAt,
          userId: n.workerId,
          severity: n.type === "task_update" ? "high" : "low",
          read: n.status === "read",
        }));

        if (mounted) {
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
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
    // Optimistic update
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );

    // Update server
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifId: id }),
    }).catch((err) => console.error("Failed to mark notif read:", err));
  };

  // No online users feature in this simplified notifications panel

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
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  // Optimistically mark all as read locally
                  setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true })),
                  );
                  try {
                    await fetch("/api/notifications/mark-all-read", {
                      method: "POST",
                    });
                  } catch (err) {
                    console.error("Failed to mark all read:", err);
                    // revert if fail by refetching notifications
                    // (simple approach: toggle panel to force refetch on reopen)
                    setIsNotificationOpen(false);
                  }
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Read All
              </button>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Notifications list only (messages and task updates) */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Notifications
              </h4>
              <div className="space-y-3">
                {notifications
                  .filter(
                    (n) => n.type === "message" || n.type === "notification",
                  )
                  .slice(0, 10)
                  .map((notification) => (
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
                            {notification.type === "message"
                              ? "New message"
                              : "Task update"}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(
                              notification.timestamp,
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
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

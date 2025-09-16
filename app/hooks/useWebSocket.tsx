"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { WebSocketMessage } from "../shared/types/dashboard";

interface WebSocketContextType {
  isConnected: boolean;
  notifications: WebSocketMessage[];
  sendMessage: (message: Record<string, unknown>) => void;
  markAsRead: (id: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    // Simulate WebSocket connection
    const connectTimeout = setTimeout(() => {
      setIsConnected(true);
      console.log("🔗 WebSocket connected (simulated)");
    }, 1000);

    // Simulate periodic messages from AWS services
    const messageInterval = setInterval(() => {
      const awsServices = ["Lambda", "DynamoDB", "S3", "CloudWatch", "Cognito"];
      const messageTypes = ["notification", "alert", "activity"];
      const severities = ["low", "medium", "high"];

      const randomService =
        awsServices[Math.floor(Math.random() * awsServices.length)];
      const randomType =
        messageTypes[Math.floor(Math.random() * messageTypes.length)];
      const randomSeverity =
        severities[Math.floor(Math.random() * severities.length)];

      const messages = [
        `AWS ${randomService} executed successfully`,
        `${randomService} performance metrics updated`,
        `New deployment to ${randomService} completed`,
        `${randomService} scaling event triggered`,
        `Free tier usage alert for ${randomService}`,
      ];

      const newNotification: WebSocketMessage = {
        id: `ws-${Date.now()}`,
        type: randomType as "notification" | "alert" | "activity",
        title: `AWS ${randomService} Update`,
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date().toISOString(),
        severity: randomSeverity as "low" | "medium" | "high",
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev.slice(0, 19)]); // Keep last 20
    }, 8000); // New message every 8 seconds

    return () => {
      clearTimeout(connectTimeout);
      clearInterval(messageInterval);
      setIsConnected(false);
      console.log("🔌 WebSocket disconnected (simulated)");
    };
  }, []);

  const sendMessage = (message: Record<string, unknown>) => {
    if (isConnected) {
      console.log("📤 Sending message:", message);
      // Simulate message sending
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const value: WebSocketContextType = {
    isConnected,
    notifications,
    sendMessage,
    markAsRead,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

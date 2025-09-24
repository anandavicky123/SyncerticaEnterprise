"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatRow {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; name: string; email: string };
  receiver?: { id: string; name: string; email: string };
}

interface Worker {
  id: string;
  name: string;
  email: string;
}

interface WorkerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkerChatModal({
  isOpen,
  onClose,
}: WorkerChatModalProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [managerInfo, setManagerInfo] = useState<Worker | null>(null);
  const [activeChat, setActiveChat] = useState<Worker | null>(null);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [unreadBySender, setUnreadBySender] = useState<Record<string, number>>(
    {},
  );
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isChatsLoading, setIsChatsLoading] = useState(false);

  // Normalize special contact IDs (e.g., manager:<uuid>) to match unread map keys
  const normalizeSenderId = (id: string) =>
    id.startsWith("manager:") ? id.substring(8) : id;

  const getUnreadCount = (id: string) => {
    // Try multiple ID formats to handle different server key formats:
    // 1. Original ID as-is (e.g., "manager:uuid" or "worker-id")
    // 2. Normalized ID (e.g., "uuid" from "manager:uuid")
    // 3. Prefixed manager ID (e.g., "manager:uuid" from "uuid")
    const normalizedId = normalizeSenderId(id);
    const managerPrefixedId = id.startsWith("manager:") ? id : `manager:${id}`;

    const count =
      unreadBySender[id] ||
      unreadBySender[normalizedId] ||
      unreadBySender[managerPrefixedId] ||
      0;

    console.debug(
      `Getting unread count for ${id}: ${count} (tried keys: ${id}, ${normalizedId}, ${managerPrefixedId})`,
    );
    console.debug("Current unreadBySender map:", unreadBySender);
    return count;
  };

  // Load current worker info and co-workers
  useEffect(() => {
    if (isOpen) {
      let mounted = true;
      setIsModalLoading(true);
      (async () => {
        try {
          // Get current worker info
          const workerRes = await fetch("/api/workers/me", {
            credentials: "include",
          });
          if (workerRes.ok) {
            const worker = await workerRes.json();
            setCurrentWorker({
              id: worker.id,
              name: worker.name,
              email: worker.email,
            });

            // If worker has a managerDeviceUUID, expose a manager contact
            if (worker.managerDeviceUUID) {
              const managerContactId = `manager:${worker.managerDeviceUUID}`;
              console.debug(
                "Creating manager contact with ID:",
                managerContactId,
              );
              setManagerInfo({
                id: managerContactId,
                name: "Manager",
                email: "manager@local",
              });
            }

            // Get all workers under the same manager
            const workersRes = await fetch("/api/workers", {
              credentials: "include",
            });
            if (workersRes.ok) {
              const allWorkers = await workersRes.json();
              // Filter out current worker and keep list as-is; Manager will be rendered separately at top
              const coWorkers = allWorkers.filter(
                (w: Worker) => w.id !== worker.id,
              );
              if (mounted) setWorkers(coWorkers);
            }
          }
        } catch (err) {
          console.error("Error loading workers:", err);
          if (mounted) setWorkers([]);
        } finally {
          // small delay to avoid flicker for very fast responses
          setTimeout(() => {
            if (mounted) setIsModalLoading(false);
          }, 120);
        }
      })();
      return () => {
        mounted = false;
      };
    }
  }, [isOpen]);

  // Load per-contact unread counts for the current worker on open
  useEffect(() => {
    if (!isOpen) return;

    const loadUnreadCounts = async () => {
      try {
        const ubRes = await fetch("/api/notifications/unread-by-conversation", {
          credentials: "include",
        });
        if (ubRes.ok) {
          const data = await ubRes.json();
          // API returns { bySender: Record<string, number>, total } for workers
          // or { byWorker: Record<string, number>, total } for managers
          const map = (data && (data.bySender || data.byWorker)) || {};
          console.debug("Loaded unread counts for worker:", data); // Debug full response
          console.debug("Available unread keys:", Object.keys(map)); // Debug keys
          setUnreadBySender(map);
        } else {
          console.warn(
            "Failed to fetch unread counts:",
            ubRes.status,
            ubRes.statusText,
          );
        }
      } catch (e) {
        console.debug("Failed to load unread-by-conversation for worker", e);
      }
    };

    // Load immediately
    loadUnreadCounts();

    // Set up periodic refresh every 30 seconds to catch new messages
    const interval = setInterval(loadUnreadCounts, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen]);

  // Load chats when activeChat changes
  useEffect(() => {
    if (activeChat) {
      let mounted = true;
      setIsChatsLoading(true);
      (async () => {
        try {
          // activeChat.id may be in form "manager:<uuid>" or a worker id
          const res = await fetch(
            `/api/chat?receiverId=${encodeURIComponent(activeChat.id)}`,
            {
              credentials: "include",
            },
          );
          if (res.ok) {
            const list = await res.json();
            if (mounted) setChats(list);
          } else {
            if (mounted) setChats([]);
          }
        } catch (err) {
          console.error("Error loading chats:", err);
          if (mounted) setChats([]);
        } finally {
          setTimeout(() => {
            if (mounted) setIsChatsLoading(false);
          }, 80);
        }
      })();
      return () => {
        mounted = false;
      };
    }
  }, [activeChat]);

  const handleStartChat = (worker: Worker) => {
    setActiveChat(worker);
    // Mark notifications from this sender as read (worker marking manager/coworker messages as read)
    (async () => {
      try {
        // For manager contacts, we need to extract the actual manager UUID from the ID
        const actualSenderId = worker.id.startsWith("manager:")
          ? worker.id.substring(8) // Remove 'manager:' prefix
          : worker.id;

        await fetch("/api/notifications/mark-read-sender", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: actualSenderId }),
        });
        // Optimistically clear local badge for this contact.
        // Clear multiple ID formats to ensure we catch the right key.
        setUnreadBySender((prev) => {
          const updated = { ...prev } as Record<string, number>;
          const normalizedId = normalizeSenderId(worker.id);
          const managerPrefixedId = worker.id.startsWith("manager:")
            ? worker.id
            : `manager:${worker.id}`;

          // Clear all possible formats
          updated[worker.id] = 0;
          updated[actualSenderId] = 0;
          updated[normalizedId] = 0;
          updated[managerPrefixedId] = 0;

          console.debug("Cleared unread badges for keys:", [
            worker.id,
            actualSenderId,
            normalizedId,
            managerPrefixedId,
          ]);
          return updated;
        });
      } catch (err) {
        console.debug("Failed to mark notifications as read for sender", err);
      }
    })();
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && activeChat) {
      (async () => {
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receiverId: activeChat.id,
              content: chatMessage,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.error("Send message failed:", res.status, body);
            alert(body.error || "Failed to send message");
            return;
          }

          const created = await res.json();
          // append the new message locally for immediate UX
          setChats((prev) => [...prev, created]);
          setChatMessage("");

          // Refresh unread counts after sending a message to catch any new messages from others
          try {
            const ubRes = await fetch(
              "/api/notifications/unread-by-conversation",
              {
                credentials: "include",
              },
            );
            if (ubRes.ok) {
              const data = await ubRes.json();
              const map = (data && (data.bySender || data.byWorker)) || {};
              setUnreadBySender(map);
            }
          } catch (e) {
            console.debug("Failed to refresh unread counts after sending", e);
          }
        } catch (err) {
          console.error("Error sending chat:", err);
          alert(err instanceof Error ? err.message : "Failed to send message");
        }
      })();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex">
        {/* Global close button so modal can be closed without selecting a chat.
            Hide it when an active chat is selected to avoid duplicate close buttons. */}
        {!activeChat && (
          <button
            onClick={onClose}
            aria-label="Close chat modal"
            className="absolute top-3 right-3 p-2 hover:bg-gray-200 rounded-full z-20"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
        {/* Left sidebar - Workers list */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Co-workers</h3>
            <p className="text-sm text-gray-500">Chat with your teammates</p>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {/* Sticky manager contact at top inside the scrollable area */}
              {managerInfo && (
                <div
                  onClick={() => handleStartChat(managerInfo)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 sticky top-0 bg-white z-10 ${
                    activeChat?.id === managerInfo.id
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {managerInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {managerInfo.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {managerInfo.email}
                      </div>
                    </div>
                    {getUnreadCount(managerInfo.id) > 0 && (
                      <span
                        title={`${getUnreadCount(managerInfo.id)} unread message${
                          getUnreadCount(managerInfo.id) > 1 ? "s" : ""
                        }`}
                        className="w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0"
                      >
                        <span className="text-white text-xs font-medium">
                          {getUnreadCount(managerInfo.id) > 9
                            ? "9+"
                            : getUnreadCount(managerInfo.id)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {isModalLoading ? (
                <div className="p-6 flex items-center justify-center">
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-3"
                  >
                    <svg
                      className="animate-spin -ml-1 h-6 w-6 text-gray-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    <div className="text-sm text-gray-600">
                      Loading contacts…
                    </div>
                  </div>
                </div>
              ) : workers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No co-workers found
                </div>
              ) : (
                workers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleStartChat(worker)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      activeChat?.id === worker.id
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {worker.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {worker.email}
                        </div>
                      </div>
                      {getUnreadCount(worker.id) > 0 && (
                        <span
                          title={`${getUnreadCount(worker.id)} unread message${
                            getUnreadCount(worker.id) > 1 ? "s" : ""
                          }`}
                          className="w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0"
                        >
                          <span className="text-white text-xs font-medium">
                            {getUnreadCount(worker.id) > 9
                              ? "9+"
                              : getUnreadCount(worker.id)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right side - Chat area */}
        <div className="flex-1 flex flex-col">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a co-worker to start chatting
                </h3>
                <p className="text-gray-500">
                  Choose someone from the list to begin a conversation
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {activeChat.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {activeChat.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activeChat.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {/* Chat messages */}
              <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
                <div className="space-y-3">
                  {isChatsLoading ? (
                    <div className="p-6 flex items-center justify-center">
                      <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-3"
                      >
                        <svg
                          className="animate-spin -ml-1 h-6 w-6 text-gray-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        <div className="text-sm text-gray-600">
                          Loading messages…
                        </div>
                      </div>
                    </div>
                  ) : chats.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm">
                      Start chatting with {activeChat.name}
                    </div>
                  ) : (
                    chats.map((c) => {
                      const isFromMe = c.senderId === currentWorker?.id;
                      return (
                        <div
                          key={c.id}
                          className={`flex ${
                            isFromMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isFromMe
                                ? "bg-blue-500 text-white"
                                : "bg-white border text-gray-800"
                            }`}
                          >
                            <div className="text-sm">{c.content}</div>
                            <div
                              className={`text-xs mt-1 ${
                                isFromMe ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(c.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      // Allow Shift+Enter for newline, Enter to send
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

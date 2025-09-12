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
  const [activeChat, setActiveChat] = useState<Worker | null>(null);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);

  // Load current worker info and co-workers
  useEffect(() => {
    if (isOpen) {
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

            // Get all workers under the same manager
            const workersRes = await fetch("/api/workers", {
              credentials: "include",
            });
            if (workersRes.ok) {
              const allWorkers = await workersRes.json();
              // Filter out current worker
              const coWorkers = allWorkers.filter(
                (w: Worker) => w.id !== worker.id
              );
              setWorkers(coWorkers);
            }
          }
        } catch (err) {
          console.error("Error loading workers:", err);
        }
      })();
    }
  }, [isOpen]);

  // Load chats when activeChat changes
  useEffect(() => {
    if (activeChat) {
      (async () => {
        try {
          const res = await fetch(`/api/chat?receiverId=${activeChat.id}`, {
            credentials: "include",
          });
          if (res.ok) {
            const list = await res.json();
            setChats(list);
          }
        } catch (err) {
          console.error("Error loading chats:", err);
        }
      })();
    }
  }, [activeChat]);

  const handleStartChat = (worker: Worker) => {
    setActiveChat(worker);
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
          if (!res.ok) throw new Error("Failed to send message");
          setChatMessage("");
          // reload chats
          const listRes = await fetch(`/api/chat?receiverId=${activeChat.id}`, {
            credentials: "include",
          });
          if (listRes.ok) {
            const list = await listRes.json();
            setChats(list);
          }
        } catch (err) {
          console.error("Error sending chat:", err);
          alert("Failed to send message");
        }
      })();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex">
        {/* Left sidebar - Workers list */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Co-workers</h3>
            <p className="text-sm text-gray-500">Chat with your teammates</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {workers.length === 0 ? (
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
                  </div>
                </div>
              ))
            )}
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
                  {chats.length === 0 ? (
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
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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

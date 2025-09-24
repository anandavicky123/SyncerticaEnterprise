import React, { useState, useEffect, useRef } from "react";
import { Phone, MessageCircle, X, User, Video } from "lucide-react";
import { User as UserType } from "../shared/types/dashboard";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "online" | "away" | "busy" | "offline";
  avatar?: string;
  unread?: number;
}

interface WorkerRow {
  id: string;
  name: string;
  email?: string;
  jobRole?: string;
}

interface ChatRow {
  id: string;
  senderId: string;
  receiverId: string;
  sender: { id: string; name: string; email?: string };
  receiver: { id: string; name: string; email?: string };
  content: string;
  createdAt: string;
  isFromCurrentUser: boolean;
}

interface CallChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  // Optional: when provided, auto-select this member on open
  initialMemberId?: string;
  initialMode?: "chat" | "call";
}

const CallChatModal: React.FC<CallChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialMemberId,
  initialMode,
}) => {
  const [activeChat, setActiveChat] = useState<TeamMember | null>(null);
  const [activeCall, setActiveCall] = useState<TeamMember | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isChatsLoading, setIsChatsLoading] = useState(false);
  // Track if we've already auto-selected a member for this open cycle to avoid re-running
  const autoInitRef = useRef<string | null>(null);

  // Fetch team members (workers) for the current managerDeviceUUID (middleware will scope by headers)
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setIsModalLoading(true);
    async function loadWorkers() {
      try {
        const res = await fetch("/api/workers", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch workers");
        const data = await res.json();
        if (!mounted) return;
        // Map to TeamMember shape; keep status "offline" as default
        const mapped: TeamMember[] = data
          .filter((w: WorkerRow) => w.name !== (currentUser?.name || ""))
          .map((w: WorkerRow) => ({
            id: w.id,
            name: w.name,
            role: w.jobRole || "employee",
            department: "",
            status: "offline",
          }));
        // Fetch unread counts grouped by sender/worker for manager
        try {
          const ubRes = await fetch(
            "/api/notifications/unread-by-conversation",
            {
              credentials: "include",
            },
          );
          if (ubRes.ok) {
            const ub = await ubRes.json();
            // attach badge counts to mapped team members
            const byWorker: Record<string, number> = ub.byWorker || {};
            mapped.forEach((m) => {
              m.unread = byWorker[m.id] || 0;
            });
          }
        } catch (e) {
          console.debug("Failed to load per-worker unread counts", e);
        }
        setTeamMembers(mapped);
        // small delay to avoid flicker for very fast responses
        setTimeout(() => {
          if (mounted) setIsModalLoading(false);
        }, 120);
      } catch (err) {
        if (mounted) setIsModalLoading(false);
        console.error("Error loading workers:", err);
      }
    }
    loadWorkers();
    return () => {
      mounted = false;
    };
  }, [isOpen, currentUser?.name]);

  // If an initial member and mode are provided, auto-start chat/call once
  // the teamMembers list is loaded. Guard against re-runs when teamMembers
  // changes (e.g., unread badge updates) to avoid clearing chats after load.
  useEffect(() => {
    if (!isOpen || !initialMemberId || !teamMembers || teamMembers.length === 0)
      return;

    // Prevent re-initializing for the same member during this open cycle
    if (autoInitRef.current === initialMemberId) return;

    const member = teamMembers.find((m) => m.id === initialMemberId);
    if (!member) return;

    if (initialMode === "call") {
      handleStartCall(member);
    } else {
      handleStartChat(member);
    }

    autoInitRef.current = initialMemberId;
  }, [isOpen, initialMemberId, initialMode, teamMembers]);

  // Reset the initialization guard when modal is closed
  useEffect(() => {
    if (!isOpen) {
      autoInitRef.current = null;
    }
  }, [isOpen]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-red-600";
      case "manager":
        return "text-yellow-600";
      case "employee":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleStartChat = (member: TeamMember) => {
    // Clear current messages immediately to avoid showing a previous conversation
    setChats([]);
    setActiveChat(member);
    // Mark notifications from this sender as read (manager marking worker messages as read)
    (async () => {
      try {
        await fetch("/api/notifications/mark-read-sender", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderId: member.id }),
        });
        // Optimistically clear local badge
        setTeamMembers((prev) =>
          prev.map((p) => (p.id === member.id ? { ...p, unread: 0 } : p)),
        );
      } catch (err) {
        console.debug("Failed to mark sender notifications read", err);
      }
    })();
    setActiveCall(null);
  };

  const handleStartCall = (member: TeamMember) => {
    setActiveCall(member);
    setActiveChat(null);
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

  // load chats when activeChat changes
  useEffect(() => {
    if (!activeChat) return;
    let mounted = true;
    setIsChatsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/chat?receiverId=${activeChat.id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch chats");
        const data = await res.json();
        if (mounted) setChats(data);
      } catch (err) {
        console.error(err);
        if (mounted) setChats([]);
      } finally {
        // small delay to reduce flicker
        setTimeout(() => {
          if (mounted) setIsChatsLoading(false);
        }, 80);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeChat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex">
        {/* Team Members List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Team Members
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isModalLoading ? (
              <div className="flex items-center justify-center p-8">
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
                    Loading team members…
                  </div>
                </div>
              </div>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(
                        member.status,
                      )} rounded-full border-2 border-white`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {member.name}
                    </div>
                    <div className={`text-xs ${getRoleColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() +
                        member.role.slice(1)}{" "}
                      • {member.department}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {member.status}
                    </div>
                  </div>

                  {/* Unread badge for this team member (manager view) */}
                  {member.unread && member.unread > 0 && (
                    <div className="ml-2 flex items-center">
                      <div className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {member.unread > 9 ? "9+" : member.unread}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleStartChat(member)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Start Chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStartCall(member)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Start Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat/Call Interface */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            // Chat Interface
            <>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {activeChat.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {activeChat.role.charAt(0).toUpperCase() +
                      activeChat.role.slice(1)}{" "}
                    • {activeChat.department}
                  </div>
                </div>
                <button
                  onClick={() => setActiveChat(null)}
                  className="ml-auto p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
                <div className="flex flex-col gap-3">
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
                      const isSent = Boolean(c.isFromCurrentUser);
                      return (
                        <div
                          key={c.id}
                          className={`max-w-[70%] ${
                            isSent ? "ml-auto" : "mr-auto"
                          }`}
                        >
                          <div
                            className={`p-3 rounded-lg shadow-sm border ${
                              isSent
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-800 border-gray-200"
                            }`}
                          >
                            <div
                              className={`text-xs ${
                                isSent ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {isSent ? "You" : c.sender?.name || "Unknown"} •{" "}
                              {new Date(c.createdAt).toLocaleString()}
                            </div>
                            <div className="mt-1 text-sm break-words whitespace-pre-wrap">
                              {c.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : activeCall ? (
            // Call Interface
            <>
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {activeCall.name}
                  </div>
                  <div className="text-sm text-green-600">Calling...</div>
                </div>
                <button
                  onClick={() => setActiveCall(null)}
                  className="ml-auto p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {activeCall.name}
                  </h3>
                  <p className="text-green-400">Calling...</p>
                </div>
              </div>

              <div className="p-4 bg-gray-800 flex justify-center gap-4">
                <button
                  onClick={() => setActiveCall(null)}
                  className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                >
                  <Phone className="w-5 h-5 text-white" />
                </button>
                <button className="p-3 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors">
                  <Video className="w-5 h-5 text-white" />
                </button>
              </div>
            </>
          ) : (
            // Default state
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a team member to start chatting or calling</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallChatModal;

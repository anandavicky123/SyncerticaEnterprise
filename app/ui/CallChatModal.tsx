import React, { useState } from "react";
import { Phone, MessageCircle, X, User, Video } from "lucide-react";
import { User as UserType } from "../shared/types/dashboard";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "online" | "away" | "busy" | "offline";
  avatar?: string;
}

interface CallChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
}

const CallChatModal: React.FC<CallChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeChat, setActiveChat] = useState<TeamMember | null>(null);
  const [activeCall, setActiveCall] = useState<TeamMember | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  // Mock team members
  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "John Admin",
      role: "admin",
      department: "IT",
      status: "online" as const,
    },
    {
      id: "2",
      name: "Jane Employee",
      role: "employee",
      department: "Development",
      status: "online" as const,
    },
    {
      id: "3",
      name: "Mike Manager",
      role: "manager",
      department: "Operations",
      status: "away" as const,
    },
    {
      id: "4",
      name: "Sarah Designer",
      role: "employee",
      department: "Design",
      status: "busy" as const,
    },
    {
      id: "5",
      name: "Tom Developer",
      role: "employee",
      department: "Development",
      status: "offline" as const,
    },
  ].filter((member) => member.name !== currentUser.name);

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
    setActiveChat(member);
    setActiveCall(null);
  };

  const handleStartCall = (member: TeamMember) => {
    setActiveCall(member);
    setActiveChat(null);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Mock sending message
      console.log(`Sending message to ${activeChat?.name}: ${chatMessage}`);
      setChatMessage("");
    }
  };

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
            {teamMembers.map((member) => (
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
                      member.status
                    )} rounded-full border-2 border-white`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </div>
                  <div className={`text-xs ${getRoleColor(member.role)}`}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}{" "}
                    • {member.department}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {member.status}
                  </div>
                </div>

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
            ))}
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
                <div className="text-center text-gray-500 text-sm">
                  Start chatting with {activeChat.name}
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

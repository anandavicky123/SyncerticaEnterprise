"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Brain,
  Database,
  Cloud,
  Shield,
  Zap,
  X,
  Minimize2,
  Move,
} from "lucide-react";
import { ChatMessage, AICapability } from "../../../shared/types/dashboard";

interface AIAssistantProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  className = "",
  isOpen: isOpenProp,
  onToggle: onToggleProp,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalIsOpen;
  const onToggle = onToggleProp || (() => setInternalIsOpen(!internalIsOpen));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const assistantRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "👋 Hello! I'm your AWS Q Developer assistant. I can help you with AWS services, architecture questions, cost optimization, and technical guidance. What would you like to know?",
      timestamp: new Date().toISOString(),
      metadata: {
        source: "aws_q",
        confidence: 1.0,
      },
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiCapabilities: AICapability[] = [
    {
      id: "aws-q",
      name: "AWS Q Developer",
      description: "AWS architecture and best practices",
      status: "active",
      accuracy: 94,
      lastTrained: "2024-01-15",
    },
    {
      id: "sagemaker",
      name: "SageMaker ML",
      description: "Machine learning recommendations",
      status: "active",
      accuracy: 87,
      lastTrained: "2024-01-10",
    },
    {
      id: "bedrock",
      name: "Amazon Bedrock",
      description: "Foundation model integration",
      status: "training",
      accuracy: 91,
      lastTrained: "2024-01-20",
    },
  ];

  const predefinedResponses: Record<string, string> = {
    "aws costs":
      "Based on your current usage, you're well within the AWS Always Free tier limits. Your Lambda functions have used 23% of the monthly allocation, DynamoDB is at 45%, and S3 storage is minimal. No charges expected this month! 💰",

    "lambda optimization":
      "Here are some Lambda optimization tips:\n\n🚀 Memory optimization: Your functions average 245ms execution time. Consider reducing memory allocation for cost efficiency.\n⚡ Cold starts: Implement provisioned concurrency for critical functions.\n📦 Bundle size: Use tree-shaking to reduce deployment packages.\n🔄 Connection pooling: Reuse database connections outside the handler.",

    "dynamodb performance":
      "Your DynamoDB performance looks good! Current metrics:\n\n📊 Read/Write capacity: Auto-scaling enabled\n⚡ Average latency: 2.3ms\n🎯 Hot partitions: None detected\n💡 Tip: Consider using Global Secondary Indexes for your query patterns.",

    "security best practices":
      "Your security posture is strong! Current status:\n\n🛡️ AWS WAF: Active with 3 rules\n🔐 Cognito: MFA enabled for admin users\n📝 CloudTrail: All API calls logged\n🔍 Security Hub: 87% compliance score\n💡 Consider enabling GuardDuty for threat detection.",

    "architecture review":
      "Your current architecture follows AWS Well-Architected principles:\n\n✅ Reliability: Multi-AZ deployment\n✅ Security: IAM least privilege\n✅ Performance: CloudFront CDN\n✅ Cost Optimization: Free tier maximized\n⚠️ Consider: Implement AWS X-Ray for better observability",

    "ci/cd pipeline":
      "Your CodePipeline status:\n\n🟢 Build: Success (2m 34s)\n🟢 Test: 47 tests passed\n🟢 Deploy: Staging environment updated\n📊 Success rate: 94% (last 30 days)\n🚀 Next: Consider blue-green deployments",

    "monitoring setup":
      "CloudWatch monitoring active:\n\n📈 Custom metrics: 12 configured\n🚨 Alarms: 8 active, 0 triggered\n📊 Dashboards: 3 operational\n💡 X-Ray tracing shows 99.2% success rate\n🔍 Log retention: 30 days configured",
  };

  const quickQuestions = [
    "How are my AWS costs?",
    "Lambda optimization tips",
    "DynamoDB performance",
    "Security best practices",
    "Architecture review",
    "CI/CD pipeline status",
    "Monitoring setup",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".drag-handle")) {
      setIsDragging(true);
      const rect = assistantRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - 384; // 384px is the width of the assistant
        const maxY = window.innerHeight - 600; // approximate height

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const lowerInput = inputMessage.toLowerCase();
      let response =
        "I understand you're asking about that topic. While I'm a demo version, in a full implementation I would connect to AWS Q Developer, SageMaker, or Amazon Bedrock to provide detailed, context-aware responses about your AWS environment.";

      // Check for predefined responses
      for (const [key, value] of Object.entries(predefinedResponses)) {
        if (lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
        metadata: {
          source: "aws_q",
          confidence: 0.92,
          functionCalls: ["getAWSMetrics", "analyzeUsage"],
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "aws_q":
        return <Brain className="w-4 h-4 text-orange-500" />;
      case "sagemaker":
        return <Zap className="w-4 h-4 text-green-500" />;
      case "bedrock":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Bot className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center z-50"
        style={{
          bottom: "1.5rem",
          right: "1.5rem",
        }}
      >
        <Bot className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </button>
    );
  }

  return (
    <div
      ref={assistantRef}
      onMouseDown={handleMouseDown}
      className={`fixed w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 ${
        isDragging ? "cursor-grabbing" : ""
      } ${className}`}
      style={{
        left: position.x || (isOpen ? "auto" : "auto"),
        top: position.y || (isOpen ? "auto" : "auto"),
        bottom: position.x === 0 && position.y === 0 ? "1.5rem" : "auto",
        right: position.x === 0 && position.y === 0 ? "1.5rem" : "auto",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-6 h-6" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
          </div>
          <div>
            <h3 className="font-semibold">AWS Q Developer</h3>
            <p className="text-xs text-blue-100">AI Assistant • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="drag-handle cursor-grab hover:cursor-grabbing p-1 hover:bg-white/20 rounded">
            <Move className="w-4 h-4" />
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onToggle} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* AI Capabilities Status */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-700">
                AI Models Active
              </span>
            </div>
            <div className="flex gap-1">
              {aiCapabilities.map((capability) => (
                <div
                  key={capability.id}
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                    capability.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {getSourceIcon(capability.id)}
                  {capability.accuracy}%
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.metadata && (
                    <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                      {getSourceIcon(message.metadata.source)}
                      <span>
                        {message.metadata.confidence &&
                          `${Math.round(
                            message.metadata.confidence * 100
                          )}% confidence`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-1">
              {quickQuestions.slice(0, 3).map((question) => (
                <button
                  key={question}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about AWS services, costs, or architecture..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                <span>AWS Q</span>
              </div>
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>SageMaker</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Bedrock</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;

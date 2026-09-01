"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, Plus, Send, Paperclip, X, FileText, Trash2, Edit2, 
  Check, CheckCheck, MessageSquare, Search, SmilePlus, 
  Globe, Building2, UserPlus, Image, Download, Eye
} from "lucide-react";
import { ApiWrapper } from "@/services/api/ApiWrapper";

interface Conversation {
  conversation_id: number;
  title: string;
  institution_id: number;
  created_by: number;
  status: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
  group_type?: "dm" | "everyone" | "insti" | "custom";
  institution_name?: string;
}

interface Participant {
  participant_id: number;
  conversation_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  last_read_at: string | null;
}

interface Message {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  message_type: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  read_by?: number[];
  reactions?: Reaction[];
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
}

interface Reaction {
  reaction_id: number;
  message_id: number;
  user_id: number;
  emoji: string;
  created_at: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  institution_id: number;
  institution_name?: string;
  is_online?: boolean;
  last_seen?: string;
}

interface TypingUser {
  user_id: number;
  user_name: string;
  conversation_id: number;
}

interface Institution {
  institution_id: number;
  institution_name: string;
  institution_code: string;
}

const QUICK_REPLIES = [
  "Hello! 👋",
  "Thank you!",
  "Got it, thanks!",
  "I'll look into it",
  "Let me check",
  "Sure, no problem!",
  "Can you clarify?",
  "On it! 🚀",
];

const REACTION_EMOJIS = [
  { emoji: "👍", label: "Thumbs up" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "🙏", label: "Pray" },
];

const GROUP_TYPES = [
  { value: "dm", label: "Direct Message", icon: MessageSquare, description: "Send a private message to someone" },
  { value: "everyone", label: "Everyone", icon: Globe, description: "All users can participate" },
  { value: "insti", label: "Institution", icon: Building2, description: "Cross-institution communication" },
  { value: "custom", label: "Custom Group", icon: UserPlus, description: "Select specific users" },
];

// Circle avatar with online status
function UserAvatar({ 
  firstName, 
  lastName, 
  size = "md", 
  isOnline = false,
  showStatus = true,
  className = "" 
}: { 
  firstName: string; 
  lastName: string; 
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}) {
  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  const statusSizes = {
    sm: "w-2.5 h-2.5 border",
    md: "w-3 h-3 border-2",
    lg: "w-3.5 h-3.5 border-2",
  };

  // Generate consistent color based on name
  const colorIndex = (firstName?.charCodeAt(0) || 0) % 5;
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
  ];

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold shrink-0`}>
        {initials}
      </div>
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${statusSizes[size]} rounded-full border-white ${
          isOnline ? "bg-emerald-500" : "bg-gray-400"
        }`} />
      )}
    </div>
  );
}

// File attachment component
function FileAttachment({ 
  url, 
  name, 
  type,
  isOwnMessage 
}: { 
  url: string; 
  name: string; 
  type: string;
  isOwnMessage: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const isImage = type?.startsWith("image/") || name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = type === "application/pdf" || name?.endsWith(".pdf");

  const getFileIcon = () => {
    if (isPDF) return <FileText size={20} className="text-red-500" />;
    if (isImage) return <Image size={20} className="text-blue-500" />;
    return <FileText size={20} className="text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isImage) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPreview(true)}
          className="block overflow-hidden rounded-xl max-w-[250px] hover:opacity-90 transition-opacity"
        >
          <img
            src={url}
            alt={name}
            className="w-full h-auto object-cover"
          />
        </button>
        {showPreview && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
            onClick={() => setShowPreview(false)}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-6 right-6 text-white/80 hover:text-white"
            >
              <X size={28} />
            </button>
            <img
              src={url}
              alt={name}
              className="max-w-full max-h-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className={`mt-1 text-[11px] ${isOwnMessage ? "text-emerald-100" : "text-gray-400"}`}>
          {name}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${
      isOwnMessage ? "bg-emerald-600/40" : "bg-gray-100"
    }`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        isPDF ? "bg-red-100" : "bg-blue-100"
      }`}>
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOwnMessage ? "text-white" : "text-gray-900"}`}>
          {name}
        </p>
        <p className={`text-xs ${isOwnMessage ? "text-emerald-100" : "text-gray-500"}`}>
          {type?.split("/")[1]?.toUpperCase() || "File"}
        </p>
      </div>
      <a
        href={url}
        download={name}
        className={`p-2 rounded-full hover:bg-black/10 transition-colors ${
          isOwnMessage ? "text-white" : "text-gray-500"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Download size={16} />
      </a>
    </div>
  );
}

function ConversationRow({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  users,
  currentUser,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  users: User[];
  currentUser?: User | null;
}) {
  const getGroupIcon = () => {
    switch (conversation.group_type) {
      case "dm":
        return null; // Will use user avatar instead
      case "everyone":
        return <Globe size={18} className="text-blue-500" />;
      case "insti":
        return <Building2 size={18} className="text-purple-500" />;
      default:
        return <Users size={18} className="text-emerald-600" />;
    }
  };

  const getGroupBadge = () => {
    switch (conversation.group_type) {
      case "dm":
        return <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">Direct</span>;
      case "everyone":
        return <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">Global</span>;
      case "insti":
        return <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">Insti</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">Group</span>;
    }
  };

  // For DM, show the other user's avatar
  const getDmUser = () => {
    if (conversation.group_type !== "dm") return null;
    // Find the other participant (not current user)
    const currentUserId = currentUser?.id;
    return users.find(u => u.id !== currentUserId && conversation.title.includes(u.first_name));
  };

  const dmUser = getDmUser();

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left
        transition-colors group ${
          isSelected
            ? "border-emerald-400 bg-white shadow-sm"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
    >
      {conversation.group_type === "dm" && dmUser ? (
        <UserAvatar firstName={dmUser.first_name} lastName={dmUser.last_name} size="md" isOnline={dmUser.is_online} />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          {getGroupIcon()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {conversation.title}
          </p>
          {getGroupBadge()}
        </div>
        {conversation.last_message && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{conversation.last_message}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {conversation.unread_count !== undefined && conversation.unread_count > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-emerald-500 rounded-full">
            {conversation.unread_count}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
          aria-label="Delete conversation"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </button>
  );
}

function ReadReceiptIcon({ isRead, readCount }: { isRead: boolean; readCount: number }) {
  if (!isRead) {
    return <Check size={14} className="text-gray-400" />;
  }
  if (readCount > 1) {
    return <CheckCheck size={14} className="text-emerald-500" />;
  }
  return <CheckCheck size={14} className="text-gray-400" />;
}

function ReactionPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1 z-50">
      {REACTION_EMOJIS.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => {
            onSelect(reaction.emoji);
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-full transition-colors"
          aria-label={reaction.label}
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  );
}

function MessageReactions({
  reactions,
  onReact,
  currentUserId,
}: {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
  currentUserId: number;
}) {
  const [showPicker, setShowPicker] = useState(false);

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, users: [], hasReacted: false };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.user_id);
    if (reaction.user_id === currentUserId) {
      acc[reaction.emoji].hasReacted = true;
    }
    return acc;
  }, {} as Record<string, { count: number; users: number[]; hasReacted: boolean }>);

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {Object.entries(groupedReactions).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-colors ${
            data.hasReacted
              ? "bg-emerald-50 border-emerald-200 text-emerald-600"
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>{emoji}</span>
          <span>{data.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Add reaction"
        >
          <SmilePlus size={14} />
        </button>
        {showPicker && (
          <ReactionPicker
            onSelect={onReact}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
  onReact,
  currentUserId,
  sender,
}: {
  message: Message;
  isOwnMessage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  currentUserId: number;
  sender?: User;
}) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const readCount = message.read_by?.length || 0;
  const isRead = readCount > 0;
  const hasAttachment = message.attachment_url && message.attachment_name;

  return (
    <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isOwnMessage && sender && (
        <UserAvatar 
          firstName={sender.first_name} 
          lastName={sender.last_name} 
          size="sm" 
          isOnline={sender.is_online}
        />
      )}
      
      <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} group relative max-w-[70%]`}>
        {/* Sender name */}
        {!isOwnMessage && sender && (
          <div className="flex items-center gap-2 mb-1 ml-1">
            <span className="text-xs font-medium text-gray-500">
              {sender.first_name} {sender.last_name}
            </span>
            {sender.is_online && (
              <span className="text-[10px] text-emerald-500">● Online</span>
            )}
          </div>
        )}

        {/* Reaction picker */}
        {!isOwnMessage && (
          <div className="relative">
            {showReactionPicker && (
              <ReactionPicker
                onSelect={(emoji) => {
                  onReact(emoji);
                  setShowReactionPicker(false);
                }}
                onClose={() => setShowReactionPicker(false)}
              />
            )}
          </div>
        )}

        {/* Message content or attachment */}
        {hasAttachment ? (
          <FileAttachment
            url={message.attachment_url!}
            name={message.attachment_name!}
            type={message.attachment_type || ""}
            isOwnMessage={isOwnMessage}
          />
        ) : (
          <div
            className={`rounded-2xl text-sm flex flex-col gap-1.5 px-4 py-2.5 ${
              isOwnMessage
                ? "bg-emerald-500 text-white rounded-br-md"
                : "bg-white border border-gray-200 text-gray-700 rounded-bl-md"
            }`}
          >
            {message.is_edited && (
              <span className={`text-xs ${isOwnMessage ? "text-emerald-100" : "text-gray-400"}`}>
                (edited)
              </span>
            )}
            <span>{message.content}</span>
          </div>
        )}

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            onReact={onReact}
            currentUserId={currentUserId}
          />
        )}

        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[11px] text-gray-400">{time}</span>
          {isOwnMessage && (
            <div className="flex items-center gap-1">
              <ReadReceiptIcon isRead={isRead} readCount={readCount} />
              <button
                onClick={onEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Edit message"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={onDelete}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete message"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
          {!isOwnMessage && (
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Add reaction"
            >
              <SmilePlus size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ typingUsers }: { typingUsers: TypingUser[] }) {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.user_name);
  let text = "";
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-xs">{text}</span>
    </div>
  );
}

function QuickReplySuggestions({ onSelect }: { onSelect: (reply: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {QUICK_REPLIES.map((reply, index) => (
        <button
          key={index}
          onClick={() => onSelect(reply)}
          className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-emerald-600 
            bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 
            transition-colors shrink-0"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}

function CreateConversationModal({
  onClose,
  onCreate,
  users,
  institutions,
  currentUser,
  conversations,
}: {
  onClose: () => void;
  onCreate: (title: string, userIds: number[], groupType: string, institutionId?: number) => void;
  users: User[];
  institutions: Institution[];
  currentUser: User | null;
  conversations: Conversation[];
}) {
  const [title, setTitle] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupType, setGroupType] = useState("dm");
  const [selectedInstitution, setSelectedInstitution] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const filteredUsers = users.filter((user) => {
    const searchLower = userSearch.toLowerCase();
    const nameMatch = `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchLower);
    const emailMatch = user.email.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  // "Everyone" is a single shared group - don't let people spawn duplicates of it
  const existingEveryoneGroup = conversations.find((c) => c.group_type === "everyone");

  // Every institution has exactly one group - map institution_id -> existing conversation
  const instiGroupMap = new Map<number, Conversation>(
    conversations
      .filter((c) => c.group_type === "insti" && c.institution_id)
      .map((c) => [c.institution_id, c])
  );
  const existingInstiGroup = selectedInstitution ? instiGroupMap.get(selectedInstitution) : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (groupType === "dm" && selectedUsers.length === 1) {
      // Direct message - title will be the other user's name
      const otherUser = users.find(u => u.id === selectedUsers[0]);
      if (otherUser) {
        const dmTitle = `${otherUser.first_name} ${otherUser.last_name}`;
        onCreate(dmTitle, [currentUser?.id || 0, otherUser.id], "dm");
      }
    } else if (groupType === "everyone") {
      const allUserIds = users.map(u => u.id);
      onCreate("Everyone", allUserIds, "everyone");
    } else if (groupType === "insti" && selectedInstitution) {
      const instiUsers = users.filter(u => u.institution_id === selectedInstitution).map(u => u.id);
      const instName = institutions.find(i => i.institution_id === selectedInstitution)?.institution_name || "Institution";
      onCreate(instName, instiUsers, "insti", selectedInstitution);
    } else if (groupType === "custom" && title.trim() && selectedUsers.length > 0) {
      onCreate(title.trim(), selectedUsers, "custom");
    }
  };

  const toggleUser = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const canSubmit = () => {
    if (groupType === "dm") return selectedUsers.length === 1;
    if (groupType === "everyone") return true;
    if (groupType === "insti") return selectedInstitution !== null;
    if (groupType === "custom") return title.trim() && selectedUsers.length > 0;
    return false;
  };

  const submitLabel = () => {
    if (groupType === "dm") return "Start Conversation";
    if (groupType === "everyone") return existingEveryoneGroup ? "Go to Everyone" : "Create Everyone Group";
    if (groupType === "insti") return existingInstiGroup ? "Go to Group" : "Create Institution Group";
    return "Create Conversation";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">New Conversation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Group Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Group Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {GROUP_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setGroupType(type.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    groupType === type.value
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    groupType === type.value ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{type.label}</span>
                  <span className="text-[10px] text-gray-400 text-center">{type.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
        {/* Direct Message */}
        {groupType === "dm" && (
          <>
            <div className="mb-4 p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <MessageSquare size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Direct Message</p>
                  <p className="text-sm text-gray-500">Send a private message to one person</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for a person to message
              </label>
              
              {/* Search input - searches the user list, not conversations */}
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  autoFocus
                />
              </div>

              {/* User list - single select, this always produces a "dm", never a group */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredUsers.filter(u => u.id !== currentUser?.id).length > 0 ? (
                  filteredUsers.filter(u => u.id !== currentUser?.id).map((user) => {
                    const existingDm = conversations.find(
                      (c) => c.group_type === "dm" && c.title === `${user.first_name} ${user.last_name}`
                    );
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUsers([user.id])}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                          selectedUsers.includes(user.id) ? "bg-emerald-50" : ""
                        }`}
                      >
                        <UserAvatar 
                          firstName={user.first_name} 
                          lastName={user.last_name} 
                          size="md" 
                          isOnline={user.is_online}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {existingDm && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">
                            Existing chat
                          </span>
                        )}
                        {selectedUsers.includes(user.id) && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Everyone Group */}
        {groupType === "everyone" && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Globe size={24} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Everyone</p>
                  {existingEveryoneGroup ? (
                    <p className="text-sm text-gray-500">This group already exists — you'll be taken straight to it.</p>
                  ) : (
                    <p className="text-sm text-gray-500">All {users.length} users will be added to this conversation</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Institution Group */}
          {groupType === "insti" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Institution
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {institutions.map((inst) => {
                  const instUsers = users.filter(u => u.institution_id === inst.institution_id);
                  const hasExistingGroup = instiGroupMap.has(inst.institution_id);
                  return (
                    <button
                      key={inst.institution_id}
                      type="button"
                      onClick={() => setSelectedInstitution(inst.institution_id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedInstitution === inst.institution_id ? "bg-purple-50" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <Building2 size={18} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{inst.institution_name}</p>
                        <p className="text-xs text-gray-500">{instUsers.length} users</p>
                      </div>
                      {hasExistingGroup && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                          Existing group
                        </span>
                      )}
                      {selectedInstitution === inst.institution_id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {existingInstiGroup && (
                <p className="text-xs text-gray-400 mt-2">
                  This institution already has a group — you'll be taken straight to it.
                </p>
              )}
            </div>
          )}

          {/* Custom Group */}
          {groupType === "custom" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search & Select Users
                </label>
                
                {/* Search input */}
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  />
                </div>

                {/* Selected users */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedUsers.map((userId) => {
                      const user = users.find(u => u.id === userId);
                      if (!user) return null;
                      return (
                        <div
                          key={userId}
                          className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs"
                        >
                          <UserAvatar firstName={user.first_name} lastName={user.last_name} size="sm" className="!w-5 !h-5 !text-[8px]" showStatus={false} />
                          <span>{user.first_name} {user.last_name}</span>
                          <button
                            type="button"
                            onClick={() => toggleUser(userId)}
                            className="hover:text-emerald-900"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* User list */}
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleUser(user.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                          selectedUsers.includes(user.id) ? "bg-emerald-50" : ""
                        }`}
                      >
                        <UserAvatar 
                          firstName={user.first_name} 
                          lastName={user.last_name} 
                          size="sm" 
                          isOnline={user.is_online}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit()}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
            >
              {submitLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { Suspense } from "react";

function ChatPageInner() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = useCallback(async () => {
    try {
      const response = await ApiWrapper.getConversationsWithUnread() as any;
      const data = response?.response || response?.data || response;
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      }
      
      const instId = localStorage.getItem("institution_id");
      if (instId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/protected/get-users/${instId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        const usersList = data?.response || data?.data || [];
        // Add simulated online status
        const usersWithStatus = Array.isArray(usersList) ? usersList.map((user: User) => ({
          ...user,
          is_online: Math.random() > 0.5, // Simulated
          last_seen: new Date().toISOString(),
        })) : [];
        setUsers(usersWithStatus);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  const fetchInstitutions = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/institution/get`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      const instList = data?.response || data?.data || [];
      setInstitutions(Array.isArray(instList) ? instList : []);
    } catch (error) {
      console.error("Failed to fetch institutions:", error);
    }
  }, []);

  const fetchParticipants = useCallback(async (conversationId: number) => {
    try {
      const response = await ApiWrapper.getParticipants(conversationId) as any;
      const data = response?.response || response?.data || response;
      setParticipants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch participants:", error);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const response = await ApiWrapper.getMessages(conversationId) as any;
      const data = response?.response || response?.data || response;
      setMessages(Array.isArray(data) ? data.reverse() : []);
      
      await ApiWrapper.markAsRead(conversationId);
      await fetchParticipants(conversationId);
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [fetchParticipants]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchUsers(), fetchInstitutions()]);
      setLoading(false);
    };
    init();
  }, [fetchConversations, fetchUsers, fetchInstitutions]);

  useEffect(() => {
    if (selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMessages(selectedId);
      setMessageSearchQuery("");
      setShowMessageSearch(false);
      setPendingFile(null);
    }
  }, [selectedId, fetchMessages]);

  // Auto-select conversation from URL search param (e.g. /chat?conversation=123)
  useEffect(() => {
    const convParam = searchParams.get("conversation");
    if (convParam && conversations.length > 0) {
      const convId = Number(convParam);
      if (!isNaN(convId) && conversations.some(c => c.conversation_id === convId)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedId(convId);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateConversation = async (title: string, userIds: number[], groupType: string, institutionId?: number) => {
    try {
      // "Everyone" is a single shared group - reuse it instead of making a duplicate
      if (groupType === "everyone") {
        const existing = conversations.find((c) => c.group_type === "everyone");
        if (existing) {
          setSelectedId(existing.conversation_id);
          setShowCreateModal(false);
          return;
        }
      }

      // Each institution already has one group - reuse it instead of making a duplicate
      if (groupType === "insti" && institutionId) {
        const existing = conversations.find(
          (c) => c.group_type === "insti" && c.institution_id === institutionId
        );
        if (existing) {
          setSelectedId(existing.conversation_id);
          setShowCreateModal(false);
          return;
        }
      }

      // A DM with this same person already exists - open it instead of duplicating
      if (groupType === "dm") {
        const existing = conversations.find((c) => c.group_type === "dm" && c.title === title);
        if (existing) {
          setSelectedId(existing.conversation_id);
          setShowCreateModal(false);
          return;
        }
      }

      await ApiWrapper.createConversation(title, userIds, groupType, institutionId);
      setShowCreateModal(false);
      await fetchConversations();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleStartDirectMessage = async (user: User) => {
    const dmTitle = `${user.first_name} ${user.last_name}`;
    const existing = conversations.find((c) => c.group_type === "dm" && c.title === dmTitle);
    if (existing) {
      setSelectedId(existing.conversation_id);
      setSidebarSearch("");
      return;
    }
    await handleCreateConversation(dmTitle, [currentUser?.id || 0, user.id], "dm");
    setSidebarSearch("");
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await ApiWrapper.deleteConversation(conversationId);
      if (selectedId === conversationId) {
        setSelectedId(null);
        setMessages([]);
        setParticipants([]);
      }
      await fetchConversations();
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setPendingFile(file);
    }
  };

  const handleRemoveFile = () => {
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!selectedId) return;
    if (!draft.trim() && !pendingFile) return;
    
    setUploading(true);
    try {
      if (pendingFile) {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("content", draft.trim() || pendingFile.name);
        
        // Upload file and create message
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/chat/conversations/${selectedId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to upload file");
        }
        
        setPendingFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        await ApiWrapper.sendMessage(selectedId, draft.trim());
      }
      
      setDraft("");
      setShowSuggestions(false);
      setTypingUsers([]);
      await fetchMessages(selectedId);
      await fetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleQuickReply = async (reply: string) => {
    if (!selectedId) return;
    try {
      await ApiWrapper.sendMessage(selectedId, reply);
      setShowSuggestions(false);
      await fetchMessages(selectedId);
      await fetchConversations();
    } catch (error) {
      console.error("Failed to send quick reply:", error);
    }
  };

  const handleEditMessage = async (messageId: number) => {
    if (!editDraft.trim()) return;
    try {
      await ApiWrapper.editMessage(messageId, editDraft.trim());
      setEditingMessageId(null);
      setEditDraft("");
      if (selectedId) {
        await fetchMessages(selectedId);
      }
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await ApiWrapper.deleteMessage(messageId);
      if (selectedId) {
        await fetchMessages(selectedId);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleReact = async (messageId: number, emoji: string) => {
    try {
      setMessages(prev => prev.map(msg => {
        if (msg.message_id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(
            r => r.user_id === currentUser?.id && r.emoji === emoji
          );
          
          if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.filter(r => r.reaction_id !== existingReaction.reaction_id),
            };
          } else {
            const newReaction: Reaction = {
              reaction_id: Date.now(),
              message_id: messageId,
              user_id: currentUser?.id || 0,
              emoji,
              created_at: new Date().toISOString(),
            };
            return {
              ...msg,
              reactions: [...reactions, newReaction],
            };
          }
        }
        return msg;
      }));
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, messageId: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEditMessage(messageId);
    } else if (e.key === "Escape") {
      setEditingMessageId(null);
      setEditDraft("");
    }
  };

  const filteredMessages = messageSearchQuery
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
      )
    : messages;

  const filteredConversations = sidebarSearch
    ? conversations.filter((conv) =>
        conv.title.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : conversations;

  // The sidebar search bar also searches people, not just existing conversation titles,
  // so you can find someone and start a direct message with them.
  const matchedUsers = sidebarSearch
    ? users.filter((user) => {
        if (user.id === currentUser?.id) return false;
        const q = sidebarSearch.toLowerCase();
        return (
          `${user.first_name} ${user.last_name}`.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q)
        );
      })
    : [];

  const selectedConversation = conversations.find((c) => c.conversation_id === selectedId);

  const getSender = (senderId: number) => users.find(u => u.id === senderId);

  const getFilePreview = (file: File): string | undefined => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return undefined;
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="text-gray-400">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] w-full bg-slate-50 gap-4">
      {showCreateModal && (
        <CreateConversationModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateConversation}
          users={users}
          institutions={institutions}
          currentUser={currentUser}
          conversations={conversations}
        />
      )}

      {/* Sidebar */}
      <div className="w-full max-w-[380px] bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-lg">Messages</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              aria-label="New conversation"
            >
              <Plus size={16} />
            </button>
          </div>
          
          {/* Search bar - searches conversations AND people */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search conversations or people..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl 
                focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:bg-white"
            />
          </div>
        </div>

        {/* Conversation + People List */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* People matches - tapping one opens/starts a direct message, never a group */}
          {sidebarSearch && matchedUsers.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase px-2 py-1">People</p>
              <div className="flex flex-col gap-1">
                {matchedUsers.map((user) => {
                  const existingDm = conversations.find(
                    (c) => c.group_type === "dm" && c.title === `${user.first_name} ${user.last_name}`
                  );
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleStartDirectMessage(user)}
                      className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:border-gray-300 transition-colors"
                    >
                      <UserAvatar
                        firstName={user.first_name}
                        lastName={user.last_name}
                        size="md"
                        isOnline={user.is_online}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full shrink-0">
                        {existingDm ? "Open chat" : "Message"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredConversations.length > 0 ? (
            <div className="flex flex-col gap-1">
              {sidebarSearch && matchedUsers.length > 0 && (
                <p className="text-xs font-medium text-gray-400 uppercase px-2 py-1">Conversations</p>
              )}
              {filteredConversations.map((conversation) => (
                <ConversationRow
                  key={conversation.conversation_id}
                  conversation={conversation}
                  isSelected={selectedId === conversation.conversation_id}
                  onSelect={() => setSelectedId(conversation.conversation_id)}
                  onDelete={() => handleDeleteConversation(conversation.conversation_id)}
                  users={users}
                  currentUser={currentUser}
                />
              ))}
            </div>
          ) : matchedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <MessageSquare size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Create one to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Plus size={14} className="inline mr-1" />
                New Conversation
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col min-h-0 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users size={20} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">
                    {selectedConversation.title}
                  </p>
                  {selectedConversation.group_type === "everyone" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">Global</span>
                  )}
                  {selectedConversation.group_type === "insti" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">Insti</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {participants.length} participant{participants.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowMessageSearch(!showMessageSearch)}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                  showMessageSearch
                    ? "bg-emerald-100 text-emerald-600"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
                aria-label="Search messages"
              >
                <Search size={18} />
              </button>
            </div>

            {/* Message Search Bar */}
            {showMessageSearch && (
              <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={messageSearchQuery}
                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                    placeholder="Search in messages..."
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-emerald-400/40 bg-white"
                    autoFocus
                  />
                  {messageSearchQuery && (
                    <button
                      onClick={() => setMessageSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-4">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div key={message.message_id}>
                    {editingMessageId === message.message_id ? (
                      <div className="flex items-center gap-2 max-w-[65%]">
                        <input
                          type="text"
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, message.message_id)}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditMessage(message.message_id)}
                          className="text-emerald-500 hover:text-emerald-600"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditDraft("");
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <MessageBubble
                        message={message}
                        isOwnMessage={currentUser ? message.sender_id === currentUser.id : false}
                        onEdit={() => {
                          setEditingMessageId(message.message_id);
                          setEditDraft(message.content);
                        }}
                        onDelete={() => handleDeleteMessage(message.message_id)}
                        onReact={(emoji) => handleReact(message.message_id, emoji)}
                        currentUserId={currentUser?.id || 0}
                        sender={getSender(message.sender_id)}
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare size={48} className="mb-3 text-gray-300" />
                  <p className="text-sm">
                    {messageSearchQuery ? "No messages found" : "No messages yet. Say hello!"}
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            <TypingIndicator typingUsers={typingUsers} />

            {/* Quick Reply Suggestions */}
            {showSuggestions && messages.length === 0 && (
              <div className="px-6 pb-2">
                <p className="text-xs text-gray-400 mb-2">Quick replies:</p>
                <QuickReplySuggestions onSelect={handleQuickReply} />
              </div>
            )}

            {/* File Preview */}
            {pendingFile && (
              <div className="px-6 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  {pendingFile.type.startsWith("image/") ? (
                    <img
                      src={getFilePreview(pendingFile)}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{pendingFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(pendingFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {/* File upload button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                  aria-label="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingFile ? "Add a caption..." : "Type a message..."}
                  className="flex-1 border border-gray-200 rounded-full px-5 py-3 text-sm
                    text-gray-700 bg-gray-50 focus:outline-none focus:ring-2
                    focus:ring-emerald-400/40 focus:bg-white placeholder:text-gray-400"
                />
                <button
                  onClick={handleSend}
                  disabled={(!draft.trim() && !pendingFile) || uploading}
                  aria-label="Send message"
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-emerald-500
                    text-white hover:bg-emerald-600 transition-colors shrink-0
                    disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-16 h-16 flex items-center justify-center bg-emerald-50 rounded-full">
              <MessageSquare size={32} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-lg">
                Welcome to Chat
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Select a conversation or create a new one
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors"
            >
              <Plus size={16} />
              New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center bg-slate-50"><div className="text-gray-400">Loading...</div></div>}>
      <ChatPageInner />
    </Suspense>
  );
}
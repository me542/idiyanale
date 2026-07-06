"use client";
import { useState } from "react";
import { Users, Plus, Send, Paperclip, X, FileText } from "lucide-react";

interface Conversation {
    id: string;
    name: string;
    preview: string;
    avatar?: "group" | "placeholder";
    unread?: boolean;
}

interface Attachment {
    name: string;
    url: string;
    type: "image" | "file";
}

interface Message {
    id: string;
    conversationId: string;
    text: string;
    fromMe: boolean;
    attachment?: Attachment;
    time: string;
}

const HOME_CONVERSATIONS: Conversation[] = [
    { id: "everyone", name: "Everyone", preview: "No Conversion", avatar: "group", unread: false },
    { id: "reyvin-flor", name: "Reyvin Flor", preview: "Hello World", avatar: "placeholder", unread: true },
];

const INSTITUTION_CONVERSATIONS: Conversation[] = [
    {
        id: "bakawan-data",
        name: "Bakawan Data Analytics Inc.",
        preview: "Reyvin Flor: Hello World",
        avatar: "placeholder",
        unread: false,
    },
];

const INITIAL_MESSAGES: Message[] = [
    { id: "m1", conversationId: "reyvin-flor", text: "Hello World", fromMe: false, time: "9:14 AM" },
    {
        id: "m2",
        conversationId: "bakawan-data",
        text: "Reyvin Flor: Hello World",
        fromMe: false,
        time: "9:15 AM",
    },
];

interface ConversationRowProps {
    conversation: Conversation;
    isSelected: boolean;
    onSelect: () => void;
}

function ConversationRow({ conversation, isSelected, onSelect }: ConversationRowProps) {
    return (
        <button
            onClick={onSelect}
            className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left
                transition-colors ${
                    isSelected
                        ? "border-emerald-400 bg-white"
                        : "border-gray-200 bg-white hover:border-gray-300"
                }`}
        >
            {conversation.avatar === "group" ? (
                <div className="w-9 h-9 flex items-center justify-center shrink-0 text-emerald-600">
                    <Users size={22} />
                </div>
            ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
            )}
            <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                    {conversation.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{conversation.preview}</p>
            </div>
        </button>
    );
}

/** Custom two-bubble chat icon matching the mockup (lucide's MessagesSquare
 * renders with squared-off bubbles; this uses rounded speech-bubble shapes
 * with tails instead). */
function ChatBubblesIcon({ size = 44 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M8 3.5h8.5a2 2 0 0 1 2 2V11a2 2 0 0 1-2 2H12l-2.8 2.5V13H8a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
            <path d="M5.5 9.5H4a2 2 0 0 0-2 2V17a2 2 0 0 0 2 2h1.2v2.5L8 19h6.5a2 2 0 0 0 2-2v-1" />
        </svg>
    );
}

function MessageBubble({
    message,
    onImageClick,
}: {
    message: Message;
    onImageClick: (url: string) => void;
}) {
    return (
        <div className={`flex flex-col ${message.fromMe ? "items-end" : "items-start"}`}>
            <div
                className={`max-w-[65%] rounded-2xl text-sm flex flex-col gap-1.5 ${
                    message.attachment?.type === "image" ? "p-1.5" : "px-4 py-2.5"
                } ${
                    message.fromMe
                        ? "bg-emerald-500 text-white rounded-br-md"
                        : "bg-white border border-gray-200 text-gray-700 rounded-bl-md"
                }`}
            >
                {message.attachment?.type === "image" && (
                    <button
                        onClick={() => onImageClick(message.attachment!.url)}
                        className="block overflow-hidden rounded-xl"
                    >
                        <img
                            src={message.attachment.url}
                            alt={message.attachment.name}
                            className="max-h-64 w-auto object-cover hover:opacity-90 transition-opacity cursor-pointer"
                        />
                    </button>
                )}
                {message.attachment?.type === "file" && (
                    <div
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            message.fromMe
                                ? "bg-emerald-600/40 text-white"
                                : "bg-gray-100 text-gray-600"
                        }`}
                    >
                        <FileText size={14} className="shrink-0" />
                        <span className="truncate">{message.attachment.name}</span>
                    </div>
                )}
                {message.text && (
                    <span className={message.attachment?.type === "image" ? "px-2 pb-1" : ""}>
                        {message.text}
                    </span>
                )}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 px-1">{message.time}</span>
        </div>
    );
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-8"
        >
            <button
                onClick={onClose}
                aria-label="Close image preview"
                className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
            >
                <X size={28} />
            </button>
            <img
                src={url}
                alt="Attachment preview"
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-full rounded-lg object-contain"
            />
        </div>
    );
}

export default function ConversationsPanel() {
    const [selectedId, setSelectedId] = useState<string | null>("reyvin-flor");
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [draft, setDraft] = useState("");
    const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const allConversations = [...HOME_CONVERSATIONS, ...INSTITUTION_CONVERSATIONS];
    const selectedConversation = allConversations.find((c) => c.id === selectedId) ?? null;
    const threadMessages = messages.filter((m) => m.conversationId === selectedId);

    const handleAttachClick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt";
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const isImage = file.type.startsWith("image/");
            setPendingAttachment({
                name: file.name,
                url: URL.createObjectURL(file),
                type: isImage ? "image" : "file",
            });
        };
        input.click();
    };

    const handleSend = () => {
        const text = draft.trim();
        if (!selectedId || (!text && !pendingAttachment)) return;
        setMessages((prev) => [
            ...prev,
            {
                id: `m-${Date.now()}`,
                conversationId: selectedId,
                text,
                fromMe: true,
                attachment: pendingAttachment ?? undefined,
                time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            },
        ]);
        setDraft("");
        setPendingAttachment(null);
    };

    const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
        }
    };

    const visibleHomeConversations = unreadOnly
        ? HOME_CONVERSATIONS.filter((c) => c.unread)
        : HOME_CONVERSATIONS;

    const visibleInstitutionConversations = unreadOnly
        ? INSTITUTION_CONVERSATIONS.filter((c) => c.unread)
        : INSTITUTION_CONVERSATIONS;

    return (
        <div className="flex h-full w-full bg-slate-50 p-4 gap-4">
            {lightboxUrl && (
                <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
            )}
            {/* Sidebar */}
            <div className="w-full max-w-[420px] bg-slate-50 border border-gray-200 rounded-2xl p-5">
                {/* Home section header */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-900 text-base">Home</h2>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">unread</span>
                        <button
                            role="switch"
                            aria-checked={unreadOnly}
                            aria-label="Show unread conversations only"
                            onClick={() => setUnreadOnly((prev) => !prev)}
                            className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-200 ${
                                unreadOnly ? "bg-emerald-400" : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
                                    transition-transform duration-200 ${
                                        unreadOnly ? "translate-x-4" : "translate-x-0"
                                    }`}
                            />
                        </button>
                        <button
                            aria-label="New conversation"
                            className="w-7 h-7 flex items-center justify-center rounded-full border
                                border-emerald-400 text-emerald-500 hover:bg-emerald-50 transition-colors shrink-0"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                    {visibleHomeConversations.length > 0 ? (
                        visibleHomeConversations.map((conversation) => (
                            <ConversationRow
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={selectedId === conversation.id}
                                onSelect={() => setSelectedId(conversation.id)}
                            />
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 px-1">No unread conversations.</p>
                    )}
                </div>

                {/* Institution section */}
                <h2 className="font-bold text-gray-900 text-base mb-3">Institution</h2>
                <div className="flex flex-col gap-3">
                    {visibleInstitutionConversations.length > 0 ? (
                        visibleInstitutionConversations.map((conversation) => (
                            <ConversationRow
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={selectedId === conversation.id}
                                onSelect={() => setSelectedId(conversation.id)}
                            />
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 px-1">No unread conversations.</p>
                    )}
                </div>
            </div>

            {/* Detail panel */}
            <div className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl flex flex-col min-h-0 overflow-hidden">
                {selectedConversation ? (
                    <>
                        {/* Thread header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 shrink-0">
                            {selectedConversation.avatar === "group" ? (
                                <div className="w-9 h-9 flex items-center justify-center shrink-0 text-emerald-600">
                                    <Users size={20} />
                                </div>
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                            )}
                            <p className="font-bold text-gray-900 text-sm">
                                {selectedConversation.name}
                            </p>
                        </div>

                        {/* Message thread */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-3">
                            {threadMessages.length > 0 ? (
                                threadMessages.map((message) => (
                                    <MessageBubble
                                        key={message.id}
                                        message={message}
                                        onImageClick={setLightboxUrl}
                                    />
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center mt-8">
                                    No messages yet. Say hello!
                                </p>
                            )}
                        </div>

                        {/* Composer */}
                        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex flex-col gap-2.5">
                            {pendingAttachment && (
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-fit max-w-full">
                                    {pendingAttachment.type === "image" ? (
                                        <img
                                            src={pendingAttachment.url}
                                            alt={pendingAttachment.name}
                                            className="w-8 h-8 rounded object-cover shrink-0"
                                        />
                                    ) : (
                                        <FileText size={14} className="text-gray-500 shrink-0" />
                                    )}
                                    <span className="text-xs text-gray-600 truncate">
                                        {pendingAttachment.name}
                                    </span>
                                    <button
                                        onClick={() => setPendingAttachment(null)}
                                        aria-label="Remove attachment"
                                        className="text-gray-400 hover:text-gray-600 shrink-0"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAttachClick}
                                    aria-label="Attach file"
                                    className="w-10 h-10 flex items-center justify-center rounded-full border
                                        border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                                >
                                    <Paperclip size={16} />
                                </button>
                                <input
                                    type="text"
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={handleComposerKeyDown}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm
                                        text-gray-700 bg-white focus:outline-none focus:ring-2
                                        focus:ring-emerald-400/40 placeholder:text-gray-300"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!draft.trim() && !pendingAttachment}
                                    aria-label="Send message"
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500
                                        text-white hover:bg-emerald-600 transition-colors shrink-0
                                        disabled:bg-gray-200 disabled:text-gray-400"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-emerald-500">
                        <ChatBubblesIcon size={44} />
                        <p className="font-bold text-sm text-gray-900">
                            No Conversation Selected
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
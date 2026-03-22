"use client";

import { useState, useCallback, useRef, useEffect, useMemo, FormEvent } from "react";
import {
  X,
  Camera,
  Mic,
  Paperclip,
  MapPin,
  Loader2,
  ChevronDown,
  Check,
  AlertCircle,
  Wrench,
  RotateCcw,
} from "lucide-react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { streamChat, type ChatMessage } from "@/lib/chat-stream";

// ── Types ──────────────────────────────────────────────────────────

interface ToolStep {
  name: string;
  label: string;
  detail?: string;
  resultSummary?: string;
  status: "running" | "ok" | "error";
}

interface UIMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
  /** Active thinking label */
  thinking?: string;
  /** Completed/in-progress tool call steps */
  toolCalls?: ToolStep[];
}

let msgId = Date.now();
function nextId() {
  return String(++msgId);
}

const WELCOME_ID = "welcome";

// ── LocalStorage persistence ───────────────────────────────────────

const LS_MESSAGES_KEY = "solveyvr-chat-messages";
const LS_HISTORY_KEY = "solveyvr-chat-history";

function loadSavedMessages(): UIMsg[] | null {
  try {
    const raw = localStorage.getItem(LS_MESSAGES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UIMsg[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    // Re-key all messages to avoid collisions with new IDs
    return parsed.map((m) => ({
      ...m,
      id: m.id === WELCOME_ID ? WELCOME_ID : nextId(),
    }));
  } catch {
    return null;
  }
}

function loadSavedHistory(): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveChat(messages: UIMsg[], history: ChatMessage[]) {
  try {
    localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(messages));
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function clearSavedChat() {
  localStorage.removeItem(LS_MESSAGES_KEY);
  localStorage.removeItem(LS_HISTORY_KEY);
}

// ── Tool calls display ─────────────────────────────────────────────

function ToolCallsDisplay({ steps }: { steps: ToolStep[] }) {
  const [expanded, setExpanded] = useState(false);
  const allDone = steps.every((s) => s.status !== "running");
  const label = allDone
    ? `Used ${steps.length} tool${steps.length > 1 ? "s" : ""}`
    : `Running ${steps.filter((s) => s.status === "running").length} tool${steps.filter((s) => s.status === "running").length > 1 ? "s" : ""}...`;

  return (
    <div className="flex flex-col gap-1 pl-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        {allDone ? (
          <Wrench className="h-3 w-3" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        <span>{label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="ml-1 flex flex-col gap-1 border-l-2 border-muted pl-3 pt-1">
          {steps.map((step, i) => (
            <div key={`${step.name}-${i}`} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs">
                {step.status === "running" && (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
                )}
                {step.status === "ok" && (
                  <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="h-3 w-3 shrink-0 text-red-500" />
                )}
                <span className="font-medium">{step.label}</span>
              </div>
              {step.detail && (
                <p className="ml-[18px] text-[11px] text-muted-foreground truncate max-w-full">
                  {step.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────

const WELCOME_MESSAGE =
  "Hi! I'm here to help you report a city issue to Vancouver 311.\n\nWhat's going on? Just describe the problem in your own words.";

export interface ReportChatProps {
  onClose: () => void;
  /** Pre-fill location context from a map pin click */
  initialLocation?: { lat: number; lng: number; address?: string } | null;
}

export function ReportChat({ onClose, initialLocation }: ReportChatProps) {
  // If a location is provided and no saved chat exists, show a location-aware welcome
  const welcomeText = useMemo(() => {
    if (initialLocation?.address) {
      return `Hi! I'm here to help you report a city issue to Vancouver 311.\n\n📍 **${initialLocation.address}**\n\nWhat's going on at this location?`;
    }
    return WELCOME_MESSAGE;
  }, [initialLocation]);

  const [messages, setMessages] = useState<UIMsg[]>(() => {
    // If location was provided, start a fresh chat with location context (don't restore old)
    if (initialLocation) {
      clearSavedChat();
      return [{ id: WELCOME_ID, role: "assistant", text: welcomeText }];
    }
    const saved = loadSavedMessages();
    return saved ?? [{ id: WELCOME_ID, role: "assistant", text: WELCOME_MESSAGE }];
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  // Full conversation history sent to the backend (user + assistant only)
  const historyRef = useRef<ChatMessage[]>(
    initialLocation ? [] : (loadSavedHistory() ?? [])
  );
  const abortRef = useRef<AbortController | null>(null);

  // When a location is provided, prepend it as context in the history
  // so the agent knows where the user is reporting from
  const didSendLocation = useRef(false);
  useEffect(() => {
    if (initialLocation && !didSendLocation.current) {
      didSendLocation.current = true;
      const locText = initialLocation.address
        ? `The issue is at ${initialLocation.address} (lat: ${initialLocation.lat}, lng: ${initialLocation.lng}).`
        : `The issue is at coordinates ${initialLocation.lat}, ${initialLocation.lng}.`;
      historyRef.current = [
        { role: "system", content: `User selected a location on the map: ${locText} Use this location for the report — don't ask for the address again.` },
      ];
    }
  }, [initialLocation]);

  // Persist chat to localStorage whenever messages change
  useEffect(() => {
    if (!streaming) {
      saveChat(messages, historyRef.current);
    }
  }, [messages, streaming]);

  // ── Clear / restart chat ──────────────────────────────────────

  const handleClearChat = useCallback(() => {
    abortRef.current?.abort();
    clearSavedChat();
    historyRef.current = [];
    setMessages([{ id: WELCOME_ID, role: "assistant", text: WELCOME_MESSAGE }]);
    setStreaming(false);
    setInput("");
  }, []);

  // ── Send a message to the agent ────────────────────────────────

  const sendToAgent = useCallback(async (userText: string, showInUI = true) => {
    // Add user message to history
    historyRef.current.push({ role: "user", content: userText });

    // Optionally show user bubble (skip for the initial hidden prompt)
    if (showInUI) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "user", text: userText },
      ]);
    }

    // Create a placeholder assistant message that we'll stream into
    const assistantId = nextId();
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let fullText = "";
    let currentThinking = "";

    try {
      for await (const event of streamChat(historyRef.current, controller.signal)) {
        switch (event.type) {
          case "delta":
            fullText += event.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, text: fullText, thinking: undefined }
                  : m
              )
            );
            break;

          case "thinking_start": {
            const steps: ToolStep[] = event.steps.map((s) => ({
              name: s.name,
              label: s.label,
              status: "running" as const,
            }));
            currentThinking = event.steps.map((s) => s.label).join(", ") + "...";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, thinking: currentThinking, toolCalls: [...(m.toolCalls || []), ...steps] }
                  : m
              )
            );
            break;
          }

          case "thinking_step":
            currentThinking = event.label + "...";
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                const tools = (m.toolCalls || []).map((t) =>
                  t.name === event.name && t.status === "running"
                    ? {
                        ...t,
                        status: event.status as "ok" | "error",
                        detail: event.detail,
                        resultSummary: event.result_summary,
                      }
                    : t
                );
                return { ...m, thinking: currentThinking, toolCalls: tools };
              })
            );
            break;

          case "thinking_end":
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, thinking: undefined } : m
              )
            );
            break;

          case "done":
            // Update history with the full assistant reply
            if (event.reply) {
              historyRef.current.push({
                role: "assistant",
                content: event.reply,
              });
            }
            break;

          case "error":
            fullText += `\n\n_Error: ${event.message}_`;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, text: fullText, thinking: undefined }
                  : m
              )
            );
            break;
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errMsg =
          err instanceof Error ? err.message : "Connection failed";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  text: fullText || `_Could not reach the agent: ${errMsg}_`,
                  thinking: undefined,
                }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, []);

  // ── Handle form submit ─────────────────────────────────────────

  const handlePromptSubmit = useCallback(
    (message: PromptInputMessage, _e: FormEvent<HTMLFormElement>) => {
      const text = message.text.trim();
      if (!text || streaming) return;
      setInput("");
      sendToAgent(text);
    },
    [streaming, sendToAgent]
  );

  // ── Handle stop ────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Determine chat status for PromptInputSubmit ────────────────

  const chatStatus = streaming ? ("streaming" as const) : ("ready" as const);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Report an Issue</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="New chat"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4 px-4 pt-4 pb-4">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 opacity-40" />
              <p className="text-sm">
                Describe your issue and the agent will help you file a report
                with the City of Vancouver.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-2">
              {/* Text content */}
              {msg.text && (
                <Message from={msg.role}>
                  <MessageContent>
                    <MessageResponse>{msg.text}</MessageResponse>
                  </MessageContent>
                </Message>
              )}

              {/* Tool calls */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <ToolCallsDisplay steps={msg.toolCalls} />
              )}

              {/* Thinking indicator */}
              {msg.thinking && (
                <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {msg.thinking}
                </div>
              )}

              {/* Streaming cursor (empty assistant message, no tools yet) */}
              {msg.role === "assistant" &&
                !msg.text &&
                !msg.thinking &&
                !msg.toolCalls?.length &&
                streaming && (
                  <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking...
                  </div>
                )}
            </div>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input — always at bottom */}
      <div className="shrink-0 border-t px-3 py-2">
        <PromptInput
          onSubmit={handlePromptSubmit}
          accept="image/*"
          multiple
        >
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Describe your issue..."
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              className="min-h-10"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton tooltip="Add photo">
                <Camera className="size-4" />
              </PromptInputButton>
              <PromptInputButton tooltip="Voice note">
                <Mic className="size-4" />
              </PromptInputButton>
              <PromptInputButton tooltip="Attach file">
                <Paperclip className="size-4" />
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              status={chatStatus}
              onStop={handleStop}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

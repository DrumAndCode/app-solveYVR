"use client";

import { useState, useCallback, useRef, useEffect, useMemo, FormEvent } from "react";
import {
  X,
  Camera,
  Mic,
  Paperclip,
  MapPin,
  Loader2,
  Check,
  AlertCircle,

  Square,
  FileIcon,
  Music,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  PromptInputHeader,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { streamChat, type ChatMessage } from "@/lib/chat-stream";
import { saveSubmittedReport } from "@/lib/submitted-reports";

// ── Types ──────────────────────────────────────────────────────────

interface ToolStep {
  name: string;
  label: string;
  detail?: string;
  resultSummary?: string;
  status: "running" | "ok" | "error";
}

interface Attachment {
  id: string;
  name: string;
  type: string; // MIME
  url: string; // blob or data URL (empty after reload from localStorage)
  storageId?: string; // Convex storage ID for persistent access
}

interface Submission {
  ref: string;
  caseid?: string;
  address?: string;
}

interface UIMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
  thinking?: string;
  toolCalls?: ToolStep[];
  attachments?: Attachment[];
  submission?: Submission;
}

let msgId = Date.now();
function nextId() {
  return String(++msgId);
}

const WELCOME_ID = "welcome";

const ANON_ID_KEY = "solveyvr-anon-id";
function getAnonUserId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = `anon-${crypto.randomUUID()}`;
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

function getAttachmentKind(
  mimeType?: string
): "image" | "video" | "audio" | "file" {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  if (mimeType?.startsWith("audio/")) return "audio";
  return "file";
}

// ── LocalStorage persistence ───────────────────────────────────────

const LS_MESSAGES_KEY = "solveyvr-chat-messages";
const LS_HISTORY_KEY = "solveyvr-chat-history";

function loadSavedMessages(): UIMsg[] | null {
  try {
    const raw = localStorage.getItem(LS_MESSAGES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UIMsg[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
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
    const serializable = messages.map((m) => ({
      ...m,
      attachments: m.attachments?.map((a) => ({
        ...a,
        url: "", // strip large data/blob URLs — images reload via storageId
      })),
    }));
    localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(serializable));
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable
  }
}

function clearSavedChat() {
  localStorage.removeItem(LS_MESSAGES_KEY);
  localStorage.removeItem(LS_HISTORY_KEY);
}

// ── Tool calls display ─────────────────────────────────────────────

function ToolCallsDisplay({ steps }: { steps: ToolStep[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, i) => (
        <div
          key={`${step.name}-${i}`}
          className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 max-w-[85%] text-xs"
        >
          <div className="mt-0.5 shrink-0">
            {step.status === "running" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            {step.status === "ok" && (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            )}
            {step.status === "error" && (
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-medium">{step.label}</span>
            {step.detail && (
              <span className="text-muted-foreground truncate">
                {step.detail}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Submission confirmation card ─────────────────────────────────────

function SubmissionCard({ submission }: { submission: Submission }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 max-w-[90%]">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <span className="text-sm font-semibold text-emerald-900">Report Submitted</span>
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
          <span className="text-emerald-700">Reference</span>
          <span className="font-mono font-semibold text-emerald-900">{submission.ref}</span>
        </div>
        {submission.caseid && (
          <div className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
            <span className="text-emerald-700">Case ID</span>
            <span className="font-mono text-emerald-900">{submission.caseid}</span>
          </div>
        )}
        {submission.address && (
          <div className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2">
            <span className="text-emerald-700">Location</span>
            <span className="text-emerald-900 truncate ml-2 text-right">{submission.address}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-emerald-600">
        Save your reference number to track this report.
      </p>
    </div>
  );
}

// ── Attachment previews in input header ─────────────────────────────

function AttachmentPreviews() {
  const { files, remove } = usePromptInputAttachments();
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((file) => {
        const isImage = file.mediaType?.startsWith("image/");
        const isAudio = file.mediaType?.startsWith("audio/");
        return (
          <div
            key={file.id}
            className="group relative flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs"
          >
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.url}
                alt={file.filename || "attachment"}
                className="h-8 w-8 rounded object-cover"
              />
            ) : isAudio ? (
              <Music className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="max-w-[100px] truncate">
              {file.filename || "file"}
            </span>
            <button
              onClick={() => remove(file.id)}
              className="ml-0.5 rounded-full p-0.5 opacity-60 hover:bg-muted hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Attachment buttons wired to PromptInput context ─────────────────

function PhotoButton() {
  const { openFileDialog } = usePromptInputAttachments();
  return (
    <PromptInputButton tooltip="Add photo" onClick={openFileDialog}>
      <Camera className="size-4" />
    </PromptInputButton>
  );
}

function FileButton() {
  const { add } = usePromptInputAttachments();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) add(e.target.files);
          e.target.value = "";
        }}
      />
      <PromptInputButton
        tooltip="Attach file"
        onClick={() => fileRef.current?.click()}
      >
        <Paperclip className="size-4" />
      </PromptInputButton>
    </>
  );
}

function VoiceButton() {
  const { add } = usePromptInputAttachments();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleRecording = useCallback(async () => {
    if (recording) {
      // Stop
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        add([file]);
        // Stop all tracks
        for (const track of stream.getTracks()) track.stop();
      };

      recorder.start();
      setRecording(true);
    } catch {
      // Mic permission denied
    }
  }, [recording, add]);

  return (
    <PromptInputButton
      tooltip={recording ? "Stop recording" : "Voice note"}
      onClick={toggleRecording}
      className={recording ? "text-red-500" : ""}
    >
      {recording ? <Square className="size-4 fill-current" /> : <Mic className="size-4" />}
    </PromptInputButton>
  );
}

// ── Image component that resolves Convex storageId ──────────────────

function StorageImage({ storageId, alt }: { storageId: string; alt: string }) {
  const url = useQuery(api.attachments.getUrl, { storageId });
  if (!url) {
    return <div className="h-20 w-20 animate-pulse rounded-lg bg-muted" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="max-h-48 max-w-[240px] rounded-lg object-cover"
    />
  );
}

// ── Message attachment display ──────────────────────────────────────

function MessageAttachments({ attachments }: { attachments: Attachment[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((att) => {
        const isImage = att.type.startsWith("image/");
        const isAudio = att.type.startsWith("audio/");

        if (isImage) {
          if (att.url) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={att.id}
                src={att.url}
                alt={att.name}
                className="max-h-48 max-w-[240px] rounded-lg object-cover"
              />
            );
          }
          if (att.storageId) {
            return (
              <StorageImage
                key={att.id}
                storageId={att.storageId}
                alt={att.name}
              />
            );
          }
        }

        return (
          <div
            key={att.id}
            className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 text-xs"
          >
            {isAudio ? (
              <Music className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="max-w-[120px] truncate text-muted-foreground">
              {att.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────

const WELCOME_MESSAGE =
  "Hi! I'm here to help you report a city issue to Vancouver 311.\n\nWhat's going on? Just describe the problem in your own words.";

export interface ReportChatProps {
  onClose: () => void;
  initialLocation?: { lat: number; lng: number; address?: string } | null;
}

export function ReportChat({ onClose, initialLocation }: ReportChatProps) {
  const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
  const createAttachment = useMutation(api.attachments.create);

  const welcomeText = useMemo(() => {
    if (initialLocation?.address) {
      return `Hi! I'm here to help you report a city issue to Vancouver 311.\n\n📍 **${initialLocation.address}**\n\nWhat's going on at this location?`;
    }
    return WELCOME_MESSAGE;
  }, [initialLocation]);

  const [messages, setMessages] = useState<UIMsg[]>(() => {
    if (initialLocation) {
      clearSavedChat();
      return [{ id: WELCOME_ID, role: "assistant", text: welcomeText }];
    }
    const saved = loadSavedMessages();
    return saved ?? [{ id: WELCOME_ID, role: "assistant", text: WELCOME_MESSAGE }];
  });
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const historyRef = useRef<ChatMessage[]>(
    initialLocation ? [] : (loadSavedHistory() ?? [])
  );
  const abortRef = useRef<AbortController | null>(null);

  const uploadFileToConvex = useCallback(
    async (fileUrl: string, mimeType: string, filename: string, attachmentLocalId: string) => {
      try {
        const uploadUrl = await generateUploadUrl();
        const blob = await fetch(fileUrl).then((r) => r.blob());
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": mimeType || "application/octet-stream" },
          body: blob,
        });
        const { storageId } = await result.json();

        await createAttachment({
          user_id: getAnonUserId(),
          storage_id: storageId,
          kind: getAttachmentKind(mimeType),
          mime_type: mimeType || undefined,
          filename: filename || undefined,
          size_bytes: blob.size,
        });

        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            attachments: m.attachments?.map((a) =>
              a.id === attachmentLocalId ? { ...a, storageId } : a
            ),
          }))
        );
      } catch (err) {
        console.error("Failed to upload attachment:", err);
      }
    },
    [generateUploadUrl, createAttachment]
  );

  // When a location is provided, inject it as system context
  const didSendLocation = useRef(false);
  useEffect(() => {
    if (initialLocation && !didSendLocation.current) {
      didSendLocation.current = true;
      const addr = initialLocation.address || "unknown";
      historyRef.current = [
        { role: "system", content: `The user dropped a pin on the map at: ${addr} (coordinates: ${initialLocation.lat}, ${initialLocation.lng}). Always use this exact address ("${addr}") as the location for the report. Do not ask the user for an address — it has already been provided via the map pin. Only ask about the issue itself.` },
      ];
    }
  }, [initialLocation]);

  // Persist chat to localStorage
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

  const sendToAgent = useCallback(async (userText: string, attachments?: Attachment[]) => {
    historyRef.current.push({ role: "user", content: userText });

    // Add user bubble with attachments
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text: userText, attachments },
    ]);

    // Track the current assistant message being streamed into.
    // After tool calls finish, we create a NEW message for the follow-up text.
    let currentMsgId = nextId();
    setMessages((prev) => [...prev, { id: currentMsgId, role: "assistant", text: "" }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let fullText = "";
    let currentThinking = "";
    let hadToolCalls = false;
    let postToolTimer: ReturnType<typeof setTimeout> | null = null;
    let gotDeltaAfterTools = false;

    try {
      for await (const event of streamChat(historyRef.current, controller.signal)) {
        switch (event.type) {
          case "delta":
            // Clear post-tool thinking timer
            if (postToolTimer) {
              clearTimeout(postToolTimer);
              postToolTimer = null;
            }
            gotDeltaAfterTools = true;
            // If we just finished tool calls, start a new message for the reply
            if (hadToolCalls) {
              hadToolCalls = false;
              fullText = "";
              currentMsgId = nextId();
              setMessages((prev) => [
                ...prev,
                { id: currentMsgId, role: "assistant", text: "" },
              ]);
            }
            fullText += event.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === currentMsgId
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
                m.id === currentMsgId
                  ? { ...m, thinking: currentThinking, toolCalls: [...(m.toolCalls || []), ...steps] }
                  : m
              )
            );
            break;
          }

          case "thinking_step": {
            currentThinking = event.label + "...";
            // Detect successful submission and extract ref/caseid
            let submission: Submission | undefined;
            if (
              event.name === "submit_request" &&
              event.status === "ok" &&
              event.result_summary
            ) {
              const refMatch = event.result_summary.match(/ref=(\S+)/);
              const caseMatch = event.result_summary.match(/caseid=(\S+)/);
              if (refMatch) {
                submission = {
                  ref: refMatch[1],
                  caseid: caseMatch?.[1],
                  address: initialLocation?.address || undefined,
                };
                // Persist to My Reports
                saveSubmittedReport({
                  id: refMatch[1],
                  ref: refMatch[1],
                  caseid: caseMatch?.[1],
                  address: initialLocation?.address || undefined,
                  submittedAt: Date.now(),
                });
              }
            }
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== currentMsgId) return m;
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
                return {
                  ...m,
                  thinking: currentThinking,
                  toolCalls: tools,
                  ...(submission ? { submission } : {}),
                };
              })
            );
            break;
          }

          case "thinking_end":
            hadToolCalls = true;
            gotDeltaAfterTools = false;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === currentMsgId ? { ...m, thinking: undefined } : m
              )
            );
            // Show "Thinking..." if no delta arrives within 1.5s
            postToolTimer = setTimeout(() => {
              if (!gotDeltaAfterTools) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === currentMsgId ? { ...m, thinking: "Thinking..." } : m
                  )
                );
              }
            }, 1500);
            break;

          case "done":
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
                m.id === currentMsgId
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
            m.id === currentMsgId
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
      if (postToolTimer) clearTimeout(postToolTimer);
      setStreaming(false);
      abortRef.current = null;
    }
  }, []);

  // ── Handle form submit ─────────────────────────────────────────

  const handlePromptSubmit = useCallback(
    (message: PromptInputMessage, _e: FormEvent<HTMLFormElement>) => {
      const text = message.text.trim();
      const hasFiles = message.files.length > 0;
      if ((!text && !hasFiles) || streaming) return;
      setInput("");

      const atts: Attachment[] = message.files.map((f) => ({
        id: nextId(),
        name: f.filename || "file",
        type: f.mediaType || "application/octet-stream",
        url: f.url,
      }));

      // Upload files to Convex storage in the background
      for (const [i, file] of message.files.entries()) {
        uploadFileToConvex(
          file.url,
          file.mediaType || "application/octet-stream",
          file.filename || "file",
          atts[i].id
        );
      }

      let agentText = text;
      if (atts.length > 0) {
        const fileDesc = atts
          .map((a) => {
            if (a.type.startsWith("image/")) return `[Photo: ${a.name}]`;
            if (a.type.startsWith("audio/")) return `[Voice note: ${a.name}]`;
            return `[File: ${a.name}]`;
          })
          .join(" ");
        agentText = agentText ? `${agentText}\n\n${fileDesc}` : fileDesc;
      }

      sendToAgent(agentText, atts.length > 0 ? atts : undefined);
    },
    [streaming, sendToAgent, uploadFileToConvex]
  );

  // ── Handle stop ────────────────────────────────────────────────

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const chatStatus = streaming ? ("streaming" as const) : ("ready" as const);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Report an Issue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            className="rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Restart
          </button>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
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

          {messages.map((msg, idx) => {
            const isStreaming = streaming && idx === messages.length - 1 && msg.role === "assistant";
            return (
              <div key={msg.id} className="flex flex-col gap-2">
                {/* Text content */}
                {msg.text && (
                  <Message from={msg.role}>
                    <MessageContent>
                      <MessageResponse mode={isStreaming ? "streaming" : "static"}>{msg.text}</MessageResponse>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <MessageAttachments attachments={msg.attachments} />
                      )}
                    </MessageContent>
                  </Message>
                )}

                {/* Attachment-only message (no text) */}
                {!msg.text && msg.attachments && msg.attachments.length > 0 && (
                  <Message from={msg.role}>
                    <MessageContent>
                      <MessageAttachments attachments={msg.attachments} />
                    </MessageContent>
                  </Message>
                )}

                {/* Tool calls */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <ToolCallsDisplay steps={msg.toolCalls} />
                )}

                {/* Submission confirmation */}
                {msg.submission && (
                  <SubmissionCard submission={msg.submission} />
                )}

                {/* Thinking indicator */}
                {msg.thinking && (
                  <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {msg.thinking}
                  </div>
                )}

                {/* Streaming cursor */}
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
            );
          })}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input — always at bottom */}
      <div className="shrink-0 border-t px-3 py-2">
        <PromptInput
          onSubmit={handlePromptSubmit}
          accept="image/*,audio/*"
          multiple
        >
          <PromptInputHeader>
            <AttachmentPreviews />
          </PromptInputHeader>
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
              <PhotoButton />
              <VoiceButton />
              <FileButton />
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

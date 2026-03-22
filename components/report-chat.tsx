"use client";

import { useState, useCallback, FormEvent } from "react";
import { X, Camera, Mic, Paperclip, MapPin, Loader2 } from "lucide-react";
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
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { ReportPreview } from "@/components/report-preview";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
  suggestions?: string[];
  showPreview?: boolean;
  showConfirmation?: boolean;
}

type Step = "location" | "capture" | "processing" | "review" | "done";

// ── Mock flow data ─────────────────────────────────────────────────

const MOCK_ADDRESS = "1425 W 4th Ave, Kitsilano";

const MOCK_REPORT = {
  category: "Abandoned Garbage Case",
  department: "ENG - Sanitation Services",
  address: MOCK_ADDRESS,
  description:
    "Large pile of household waste including broken furniture and garbage bags left on the sidewalk. Blocking pedestrian path. Approximately 2m x 1m area. Requires truck pickup.",
};

let msgId = 0;
function nextId() {
  return String(++msgId);
}

// ── Component ──────────────────────────────────────────────────────

export function ReportChat({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("location");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: nextId(),
      role: "assistant",
      text: "Hi! Let's report an issue. First — where is it?",
    },
    {
      id: nextId(),
      role: "assistant",
      text: `📍 Using your location:\n\n**${MOCK_ADDRESS}**`,
      suggestions: ["That's correct", "Enter a different address"],
    },
  ]);
  const [input, setInput] = useState("");
  const [photoCount, setPhotoCount] = useState(0);

  const push = useCallback((...msgs: Omit<ChatMsg, "id">[]) => {
    setMessages((prev) => [...prev, ...msgs.map((m) => ({ ...m, id: nextId() }))]);
  }, []);

  // ── Suggestion handler ────────────────────────────────────────

  const handleSuggestion = useCallback(
    (text: string) => {
      if (step === "location") {
        push(
          { role: "user", text },
          {
            role: "assistant",
            text: "Got it. What's going on there?\nSend photos, a video, or just describe it — whatever's easiest.",
          }
        );
        setStep("capture");
      } else if (step === "capture") {
        push({ role: "user", text });
        handleFollowUp(text);
      }
    },
    [step]
  );

  // ── Photo handler ─────────────────────────────────────────────

  const handleAddPhoto = useCallback(() => {
    const newCount = photoCount + 1;
    setPhotoCount(newCount);
    if (newCount === 1) {
      push(
        { role: "user", text: "📷 Photo attached" },
        {
          role: "assistant",
          text: "Looks like abandoned garbage. A few quick questions so the city can act on this:\n\nHow big is the pile roughly?",
          suggestions: [
            "Small — fits in a bag",
            "Medium — a few bags",
            "Large — needs a truck",
          ],
        }
      );
    } else {
      push(
        { role: "user", text: `📷 Photo ${newCount} attached` },
        {
          role: "assistant",
          text: `Got it — ${newCount} photos attached. You can add more or continue.`,
        }
      );
    }
  }, [photoCount]);

  // ── Follow-up handler ─────────────────────────────────────────

  function handleFollowUp(answer: string) {
    const blocking =
      answer.includes("sidewalk") ||
      answer.includes("road") ||
      answer.includes("private");

    if (blocking) {
      setStep("processing");
      push({
        role: "assistant",
        text: "Analyzing your photos and generating the report...",
      });
      setTimeout(() => {
        setStep("review");
        push({
          role: "assistant",
          text: "Here's your report. Review it and hit send.",
          showPreview: true,
        });
      }, 2000);
    } else {
      push({
        role: "assistant",
        text: "Is it blocking the sidewalk or roadway?",
        suggestions: [
          "Yes — sidewalk",
          "Yes — road",
          "No — on private property",
        ],
      });
    }
  }

  // ── Submit report ─────────────────────────────────────────────

  const handleSubmitReport = useCallback(() => {
    setStep("done");
    push({ role: "assistant", text: "", showConfirmation: true });
  }, []);

  // ── Text submit ───────────────────────────────────────────────

  const handlePromptSubmit = useCallback(
    (message: PromptInputMessage, _e: FormEvent<HTMLFormElement>) => {
      const text = message.text.trim();
      if (!text) return;
      setInput("");
      push({ role: "user", text });

      if (step === "capture") {
        setStep("processing");
        setTimeout(() => {
          push({
            role: "assistant",
            text: "Analyzing your description and generating the report...",
          });
        }, 300);
        setTimeout(() => {
          setStep("review");
          push({
            role: "assistant",
            text: "Here's your report. Review it and hit send.",
            showPreview: true,
          });
        }, 2300);
      }
    },
    [step]
  );

  // ── Last message's suggestions (only show on the latest) ──────

  const lastMsg = messages[messages.length - 1];
  const activeSuggestions =
    lastMsg?.suggestions && step !== "processing" && step !== "done"
      ? lastMsg.suggestions
      : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Report an Issue</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages — AI Elements Conversation */}
      <Conversation className="flex-1">
        <ConversationContent className="gap-4 px-4 py-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-2">
              {/* Text message */}
              {msg.text && (
                <Message from={msg.role}>
                  <MessageContent>
                    <MessageResponse>{msg.text}</MessageResponse>
                  </MessageContent>
                </Message>
              )}

              {/* Processing spinner */}
              {step === "processing" &&
                msg === lastMsg &&
                msg.role === "assistant" && (
                  <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Classifying issue...
                  </div>
                )}

              {/* Report preview card */}
              {msg.showPreview && (
                <div className="max-w-[95%]">
                  <ReportPreview
                    category={MOCK_REPORT.category}
                    department={MOCK_REPORT.department}
                    address={MOCK_REPORT.address}
                    description={MOCK_REPORT.description}
                    photoCount={photoCount}
                    onSubmit={handleSubmitReport}
                  />
                </div>
              )}

              {/* Confirmation */}
              {msg.showConfirmation && (
                <div className="flex flex-col gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">&#10003;</span>
                    <span className="text-sm font-semibold text-emerald-800">
                      Report submitted!
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-emerald-700">
                    <p>Emailed to 311@vancouver.ca</p>
                    <p>Reference: #SYV-00248</p>
                  </div>
                  <p className="text-xs text-emerald-600">
                    We&apos;ll check for status updates from the city and notify
                    you.
                  </p>
                  <div className="flex gap-2">
                    <a
                      href="/my-reports"
                      className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted"
                    >
                      View in My Reports
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={onClose}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Suggestion chips — AI Elements Suggestions */}
      {activeSuggestions && (
        <div className="border-t px-4 py-2">
          <Suggestions>
            {activeSuggestions.map((s) => (
              <Suggestion
                key={s}
                suggestion={s}
                onClick={handleSuggestion}
              />
            ))}
          </Suggestions>
        </div>
      )}

      {/* Input bar — AI Elements PromptInput */}
      {step !== "done" && (
        <div className="border-t px-3 py-2">
          <PromptInput
            onSubmit={handlePromptSubmit}
            accept="image/*"
            multiple
          >
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Type or attach..."
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                className="min-h-10"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputButton
                  tooltip="Add photo"
                  onClick={handleAddPhoto}
                >
                  <Camera className="size-4" />
                </PromptInputButton>
                <PromptInputButton tooltip="Voice note">
                  <Mic className="size-4" />
                </PromptInputButton>
                <PromptInputButton tooltip="Attach file">
                  <Paperclip className="size-4" />
                </PromptInputButton>
              </PromptInputTools>
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>
        </div>
      )}
    </div>
  );
}

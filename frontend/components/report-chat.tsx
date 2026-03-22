"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, Mic, Paperclip, Send, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReportPreview } from "@/components/report-preview";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  suggestions?: string[];
  preview?: boolean;
  confirmation?: boolean;
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

// ── Component ──────────────────────────────────────────────────────

export function ReportChat({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("location");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! Let's report an issue. First — where is it?",
    },
    {
      id: "2",
      role: "assistant",
      content: `📍 Using your location:\n**${MOCK_ADDRESS}**`,
      suggestions: ["That's correct", "Enter a different address"],
    },
  ]);
  const [input, setInput] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function addMessages(...msgs: Omit<ChatMessage, "id">[]) {
    setMessages((prev) => [
      ...prev,
      ...msgs.map((m, i) => ({ ...m, id: `${Date.now()}-${i}` })),
    ]);
  }

  function handleSuggestion(text: string) {
    if (step === "location") {
      addMessages(
        { role: "user", content: text },
        {
          role: "assistant",
          content:
            "Got it. What's going on there?\nSend photos, a video, or just describe it — whatever's easiest.",
        }
      );
      setStep("capture");
    } else if (step === "capture") {
      // Follow-up suggestions (size, blocking, etc.)
      addMessages({ role: "user", content: text });
      handleFollowUp(text);
    }
  }

  function handleAddPhoto() {
    const newCount = photoCount + 1;
    setPhotoCount(newCount);
    addMessages(
      { role: "user", content: `📷 Photo ${newCount} attached` },
      newCount === 1
        ? {
            role: "assistant",
            content:
              "Looks like abandoned garbage. A few quick questions so the city can act on this:\n\nHow big is the pile roughly?",
            suggestions: [
              "Small — fits in a bag",
              "Medium — a few bags",
              "Large — needs a truck",
            ],
          }
        : {
            role: "assistant",
            content: `Got it — ${newCount} photos attached. You can add more or continue.`,
          }
    );
  }

  function handleFollowUp(answer: string) {
    if (answer.includes("Large") || answer.includes("truck")) {
      addMessages({
        role: "assistant",
        content: "Is it blocking the sidewalk or roadway?",
        suggestions: [
          "Yes — sidewalk",
          "Yes — road",
          "No — on private property",
        ],
      });
    } else if (
      answer.includes("sidewalk") ||
      answer.includes("road") ||
      answer.includes("private")
    ) {
      // Trigger processing
      setStep("processing");
      addMessages({
        role: "assistant",
        content: "Analyzing your photos and generating the report...",
      });
      setTimeout(() => {
        setStep("review");
        addMessages({
          role: "assistant",
          content: "Here's your report. Review it and hit send.",
          preview: true,
        });
      }, 2000);
    } else if (answer.includes("Small") || answer.includes("bag")) {
      addMessages({
        role: "assistant",
        content: "Is it blocking the sidewalk or roadway?",
        suggestions: [
          "Yes — sidewalk",
          "Yes — road",
          "No — on private property",
        ],
      });
    } else if (answer.includes("Medium")) {
      addMessages({
        role: "assistant",
        content: "Is it blocking the sidewalk or roadway?",
        suggestions: [
          "Yes — sidewalk",
          "Yes — road",
          "No — on private property",
        ],
      });
    }
  }

  function handleSubmitReport() {
    setStep("done");
    addMessages({
      role: "assistant",
      content: "",
      confirmation: true,
    });
  }

  function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    addMessages({ role: "user", content: text });

    if (step === "capture") {
      // Treat text as description, move to processing
      setStep("processing");
      setTimeout(() => {
        addMessages({
          role: "assistant",
          content: "Analyzing your description and generating the report...",
        });
      }, 300);
      setTimeout(() => {
        setStep("review");
        addMessages({
          role: "assistant",
          content: "Here's your report. Review it and hit send.",
          preview: true,
        });
      }, 2300);
    }
  }

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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-2">
              {/* Message bubble */}
              {msg.content && (
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "assistant"
                      ? "self-start bg-muted"
                      : "self-end bg-primary text-primary-foreground"
                  )}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                      {line.startsWith("**") && line.endsWith("**") ? (
                        <strong>{line.slice(2, -2)}</strong>
                      ) : (
                        line
                      )}
                    </p>
                  ))}
                </div>
              )}

              {/* Processing spinner */}
              {step === "processing" &&
                msg === messages[messages.length - 1] &&
                msg.role === "assistant" && (
                  <div className="flex items-center gap-2 self-start px-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Classifying issue...
                  </div>
                )}

              {/* Report preview */}
              {msg.preview && (
                <div className="self-start max-w-[95%]">
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
              {msg.confirmation && (
                <div className="flex flex-col gap-3 self-start rounded-2xl bg-emerald-50 px-4 py-3">
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
                    <Button size="sm" variant="outline" className="text-xs" asChild>
                      <a href="/my-reports">View in My Reports</a>
                    </Button>
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

              {/* Suggestion chips */}
              {msg.suggestions && step !== "processing" && step !== "done" && (
                <div className="flex flex-wrap gap-1.5 self-start pl-1">
                  {msg.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSuggestion(s)}
                      className="rounded-full border bg-background px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input bar */}
      {step !== "done" && (
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={handleAddPhoto}
                title="Add photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <button
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Voice note"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
            <Input
              placeholder="Type or attach..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button size="icon" variant="ghost" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

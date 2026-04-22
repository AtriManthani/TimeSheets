"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function InterviewChat({
  timesheetId,
  onGenerated,
}: {
  timesheetId: string;
  onGenerated?: () => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genWarnings, setGenWarnings] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    loadOrStartSession();
  }, [timesheetId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadOrStartSession() {
    setInitializing(true);
    try {
      const res = await fetch(`/api/workflow/interview?timesheetId=${timesheetId}`);
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        // Restore existing session
        setMessages(data.messages);
        setIsComplete(data.isComplete);
      } else {
        // New session — AI sends the first question
        await sendMessage("Hello, I need to fill out my timesheet.", true);
      }
    } catch {
      setError("Failed to load interview session.");
    } finally {
      setInitializing(false);
    }
  }

  async function sendMessage(text?: string, silent = false) {
    const userText = text ?? input.trim();
    if (!userText || loading) return;

    if (!silent) setInput("");
    setError(null);

    const newMessages: Message[] = silent
      ? messages
      : [...messages, { role: "user", content: userText }];

    if (!silent) setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/workflow/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timesheetId, message: userText }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      const aiMsg: Message = { role: "assistant", content: data.response };

      if (silent) {
        // First message: just show AI response, no user bubble
        setMessages([aiMsg]);
      } else {
        setMessages([...newMessages, aiMsg]);
      }

      setIsComplete(data.isComplete);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function generateTimesheet() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/workflow/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timesheetId }),
      });
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.complianceErrors?.join("; ") ?? data.details?.join("; ") ?? data.error ?? "Generation failed";
        setError(errMsg);
        return;
      }

      if (data.warnings?.length > 0) setGenWarnings(data.warnings);
      if (onGenerated) {
        onGenerated();
      } else {
        router.push(`/timesheets/${timesheetId}`);
        router.refresh();
      }
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (initializing) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm">Starting interview…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "70vh" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">Starting your interview…</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-3">
              <div className="flex gap-1">
                {[0, 0.1, 0.2].map((delay, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Warnings */}
      {genWarnings.length > 0 && (
        <div className="mx-4 mb-2 rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
          <p className="font-medium">Warnings (review before submitting):</p>
          <ul className="mt-1 list-inside list-disc">
            {genWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        {isComplete ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-green-700">
              ✓ Interview complete — all information collected.
            </p>
            <Button onClick={generateTimesheet} loading={generating} className="w-full sm:w-auto">
              Generate Timesheet Draft
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your answer…"
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50"
            />
            <Button onClick={() => sendMessage()} loading={loading} disabled={!input.trim()}>
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

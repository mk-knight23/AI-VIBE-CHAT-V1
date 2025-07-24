import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, MicIcon, StopCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
}

export function ChatInput({ onSendMessage, isLoading, onStopGeneration }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div className="relative flex items-end space-x-3">
          {/* Voice Recording Button */}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full transition-colors",
              isRecording && "bg-destructive text-destructive-foreground"
            )}
            onClick={() => setIsRecording(!isRecording)}
          >
            <MicIcon className="w-4 h-4" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message ChatGPT..."
              className={cn(
                "min-h-[44px] max-h-32 resize-none rounded-2xl border-input bg-muted/50",
                "focus:ring-2 focus:ring-primary focus:border-transparent",
                "placeholder:text-muted-foreground pr-12"
              )}
              disabled={isLoading}
            />
            
            {/* Send/Stop Button */}
            <div className="absolute right-2 bottom-2">
              {isLoading ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-full hover:bg-destructive/10"
                  onClick={onStopGeneration}
                >
                  <StopCircleIcon className="w-4 h-4 text-destructive" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "w-8 h-8 rounded-full transition-colors",
                    message.trim()
                      ? "hover:bg-primary/10 text-primary"
                      : "text-muted-foreground cursor-not-allowed"
                  )}
                  onClick={handleSend}
                  disabled={!message.trim()}
                >
                  <SendIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
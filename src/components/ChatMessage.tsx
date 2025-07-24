import { cn } from "@/lib/utils";
import { BotIcon, UserIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("group flex w-full py-6 px-4", isUser ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[80%] space-x-3">
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <BotIcon className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className="flex-1 space-y-2">
          <div
            className={cn(
              "rounded-2xl px-4 py-3 shadow-chat transition-all duration-200",
              isUser
                ? "bg-chat-user-bg text-chat-user-fg ml-auto"
                : "bg-chat-assistant-bg text-chat-assistant-fg"
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>
          
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs hover:bg-chat-hover"
              onClick={handleCopy}
            >
              <CopyIcon className="w-3 h-3 mr-1" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
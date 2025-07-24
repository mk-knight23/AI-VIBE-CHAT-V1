import { BotIcon } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex w-full py-6 px-4">
      <div className="flex max-w-[80%] space-x-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
          <BotIcon className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="bg-chat-assistant-bg text-chat-assistant-fg rounded-2xl px-4 py-3 shadow-chat">
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm text-muted-foreground ml-2">ChatGPT is typing...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
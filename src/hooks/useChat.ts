import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
}

// Mock API call - replace with your actual API integration
const mockApiCall = async (message: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Mock responses based on input
  const responses = [
    "I understand your question. Let me help you with that.",
    "That's an interesting point. Here's what I think about it...",
    "Based on what you've asked, I can provide some insights.",
    "Great question! Let me break this down for you.",
    "I can help you with that. Here's my response...",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)] + 
    ` You asked: "${message}". This is a mock response. To connect to a real API, replace the mockApiCall function in useChat.ts with your actual API integration.`;
};

export function useChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: "New Chat",
      messages: [],
      timestamp: new Date(),
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    
    return newChat.id;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeChat) {
      createNewChat();
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.messages.length === 0 ? content.slice(0, 30) : chat.title
          }
        : chat
    ));

    setIsLoading(true);

    try {
      // Call your API here
      const response = await mockApiCall(content);
      
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      // Add assistant response
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from API. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeChat, createNewChat]);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (activeChat === chatId) {
      setActiveChat(null);
    }
  }, [activeChat]);

  const selectChat = useCallback((chatId: string) => {
    setActiveChat(chatId);
  }, []);

  const getCurrentChat = useCallback(() => {
    return chats.find(chat => chat.id === activeChat) || null;
  }, [chats, activeChat]);

  return {
    chats,
    activeChat,
    isLoading,
    createNewChat,
    sendMessage,
    deleteChat,
    selectChat,
    getCurrentChat,
  };
}
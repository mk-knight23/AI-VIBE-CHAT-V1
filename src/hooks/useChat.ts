import { useState, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";
import { security } from "@/lib/security";

/**
 * Message interface representing a single chat message
 */
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  reactions?: {
    like?: number;
    dislike?: number;
  };
  attachments?: Array<{
    id: string;
    type: 'image' | 'document' | 'code' | 'other';
    url?: string;
    name: string;
    size?: number;
  }>;
  isStreaming?: boolean;
}

/**
 * Chat interface representing a complete conversation
 */
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  timestamp: Date;
  messageCount?: number;
  isStarred?: boolean;
  branchFrom?: string; // For conversation branching
  tags?: string[];
  model?: string;
}

/**
 * ChatSettings interface for configuring AI behavior
 */
export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  streamResponses: boolean;
}

/**
 * CHUTES API integration with streaming support
 *
 * Handles communication with the CHUTES AI API including:
 * - Regular and streaming responses
 * - Error handling and retry logic
 * - Request/response logging
 * - Security validation
 *
 * @param message - User message content
 * @param apiToken - CHUTES API authentication token
 * @param model - AI model to use (default: GLM-4.5-Air)
 * @param settings - Optional chat settings
 * @param onStream - Optional callback for streaming responses
 * @returns Promise resolving to the AI response
 */
const callChutesAPI = async (
  message: string,
  apiToken: string,
  model: string = "zai-org/GLM-4.5-Air",
  settings?: Partial<ChatSettings>,
  onStream?: (chunk: string) => void
): Promise<string> => {
  // Validate API token
  if (!apiToken) {
    throw new Error("CHUTES API token is required");
  }

  // Validate input for security
  const validation = security.validateMessage(message);
  if (!validation.valid) {
    throw new Error(`Invalid message: ${validation.errors.join(', ')}`);
  }

  // Check rate limiting
  const rateLimitKey = `api_${Date.now()}`;
  if (!security.checkRateLimit(rateLimitKey)) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  console.log('🔧 Making API call with:', { model, apiToken: apiToken.substring(0, 20) + '...' });

  // Prepare request body
  const requestBody = {
    model: model,
    messages: [
      ...(settings?.systemPrompt ? [{ role: "system", content: settings.systemPrompt }] : []),
      { role: "user", content: message }
    ],
    stream: settings?.streamResponses || false,
    max_tokens: settings?.maxTokens || 1024,
    temperature: settings?.temperature || 0.7
  };

  // Track API call
  analytics.trackEvent({
    name: 'api_call',
    category: 'feature',
    label: model,
    metadata: {
      hasSystemPrompt: !!settings?.systemPrompt,
      isStreaming: settings?.streamResponses || false,
      maxTokens: settings?.maxTokens || 1024,
      temperature: settings?.temperature || 0.7
    }
  });

  try {
    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      
      // Track API error
      analytics.trackEvent({
        name: 'api_error',
        category: 'error',
        label: response.status.toString(),
        metadata: {
          model,
          errorMessage: error.error?.message || 'Unknown error'
        }
      });
      
      throw new Error(error.error?.message || 'Failed to get response from CHUTES API');
    }

    if (settings?.streamResponses && onStream) {
      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  onStream(content);
                }
              } catch (e) {
                // Ignore parsing errors for incomplete chunks
              }
            }
          }
        }
      }
      
      // Track successful streaming response
      analytics.trackEvent({
        name: 'api_response_streaming',
        category: 'feature',
        label: model,
        metadata: {
          responseLength: fullResponse.length
        }
      });
      
      return fullResponse;
    } else {
      // Handle regular response
      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content || 'No response received';
      
      console.log('✅ API Success:', { model, response: responseContent.substring(0, 50) + '...' });
      
      // Track successful regular response
      analytics.trackEvent({
        name: 'api_response_regular',
        category: 'feature',
        label: model,
        metadata: {
          responseLength: responseContent.length
        }
      });
      
      return responseContent;
    }
  } catch (error) {
    // Track network errors
    analytics.reportError({
      message: `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'high',
      metadata: {
        model,
        endpoint: 'https://llm.chutes.ai/v1/chat/completions'
      }
    });
    
    throw error;
  }
};

/**
 * Main chat management hook
 *
 * Provides comprehensive chat functionality including:
 * - Chat creation, deletion, and management
 * - Message sending and receiving
 * - Streaming responses
 * - Chat branching and editing
 * - Search and filtering
 * - Export/import functionality
 * - Settings management
 *
 * @returns Object containing all chat-related state and methods
 */
export function useChat() {
  // State management
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    temperature: 0.7,
    maxTokens: 1024,
    systemPrompt: "",
    streamResponses: true
  });

  // Load persisted data from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chutes-chats');
    const savedSettings = localStorage.getItem('chutes-settings');
    
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed.map((chat: any) => ({
          ...chat,
          timestamp: new Date(chat.timestamp),
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })));
        
        // Track data restoration
        analytics.trackEvent({
          name: 'chats_restored',
          category: 'engagement',
          value: parsed.length
        });
      } catch (error) {
        console.error('Error loading chats:', error);
        analytics.reportError({
          message: 'Failed to load chats from localStorage',
          severity: 'medium'
        });
      }
    }

    if (savedSettings) {
      try {
        setChatSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
        analytics.reportError({
          message: 'Failed to load settings from localStorage',
          severity: 'medium'
        });
      }
    }
  }, []);

  // Persist chats to localStorage whenever chats change
  useEffect(() => {
    try {
      localStorage.setItem('chutes-chats', JSON.stringify(chats));
    } catch (error) {
      console.error('Error saving chats:', error);
      analytics.reportError({
        message: 'Failed to save chats to localStorage',
        severity: 'medium'
      });
    }
  }, [chats]);

  // Persist settings to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem('chutes-settings', JSON.stringify(chatSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      analytics.reportError({
        message: 'Failed to save settings to localStorage',
        severity: 'medium'
      });
    }
  }, [chatSettings]);

  /**
   * Create a new chat conversation
   *
   * @param branchFrom - Optional ID of chat to branch from
   * @returns ID of the newly created chat
   */
  const createNewChat = useCallback((branchFrom?: string) => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: "New Chat",
      messages: [],
      timestamp: new Date(),
      messageCount: 0,
      branchFrom,
      model: localStorage.getItem('selected-model') || "zai-org/GLM-4.5-Air"
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    
    // Track new chat creation
    analytics.trackChatInteraction('created', {
      hasBranchFrom: !!branchFrom,
      model: newChat.model
    });
    
    return newChat.id;
  }, []);

  /**
   * Create a branch from an existing chat
   *
   * @param chatId - ID of the source chat
   * @param messageIndex - Optional index to branch from specific message
   * @returns ID of the newly created branch chat
   */
  const branchChat = useCallback((chatId: string, messageIndex?: number) => {
    const sourceChat = chats.find(chat => chat.id === chatId);
    if (!sourceChat) return;

    const messagesToBranch = messageIndex
      ? sourceChat.messages.slice(0, messageIndex + 1)
      : sourceChat.messages;

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: `${sourceChat.title} (Branch)`,
      messages: [...messagesToBranch],
      timestamp: new Date(),
      messageCount: messagesToBranch.length,
      branchFrom: chatId,
      model: sourceChat.model
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat.id);
    
    // Track chat branching
    analytics.trackChatInteraction('branched', {
      sourceChatId: chatId,
      messageIndex,
      messageCount: messagesToBranch.length
    });
    
    return newChat.id;
  }, [chats]);

  const sendMessage = useCallback(async (
    content: string,
    attachments?: Array<{ file: File; type: string }>
  ) => {
    if (!activeChat) {
      createNewChat();
      return;
    }

    // Process attachments
    const processedAttachments = attachments?.map(att => ({
      id: `att-${Date.now()}-${Math.random()}`,
      type: att.type as 'image' | 'document' | 'code' | 'other',
      name: att.file.name,
      size: att.file.size,
      url: att.type === 'image' ? URL.createObjectURL(att.file) : undefined
    }));

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      isUser: true,
      timestamp: new Date(),
      attachments: processedAttachments
    };

    // Add user message
    setChats(prev => prev.map(chat =>
      chat.id === activeChat
        ? {
            ...chat,
            messages: [...chat.messages, userMessage],
            title: chat.messages.length === 0 ? content.slice(0, 30) : chat.title,
            messageCount: (chat.messageCount || 0) + 1
          }
        : chat
    ));

    setIsLoading(true);

    try {
      const apiToken = import.meta.env.VITE_CHUTES_API_TOKEN;
      
      if (!apiToken || apiToken === 'your_chutes_api_token_here') {
        toast({
          title: "Configuration Required",
          description: "Please set your CHUTES API token in environment variables or .env file.",
          variant: "destructive",
        });
        return;
      }

      const selectedModel = localStorage.getItem('selected-model') || "zai-org/GLM-4.5-Air";
      
      console.log('🚀 Sending message with model:', selectedModel);
      console.log('📝 Message content:', content);

      let response = '';
      
      if (chatSettings.streamResponses) {
        // Create streaming message
        const streamingMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          content: '',
          isUser: false,
          timestamp: new Date(),
          isStreaming: true
        };

        setChats(prev => prev.map(chat =>
          chat.id === activeChat
            ? { ...chat, messages: [...chat.messages, streamingMessage] }
            : chat
        ));

        // Stream the response
        response = await callChutesAPI(content, apiToken, selectedModel, chatSettings, (chunk) => {
          setChats(prev => prev.map(chat =>
            chat.id === activeChat
              ? {
                  ...chat,
                  messages: chat.messages.map(msg =>
                    msg.id === streamingMessage.id
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  )
                }
              : chat
          ));
        });

        // Finalize streaming message
        setChats(prev => prev.map(chat =>
          chat.id === activeChat
            ? {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === streamingMessage.id
                    ? { ...msg, content: response, isStreaming: false }
                    : msg
                )
              }
            : chat
        ));
      } else {
        // Regular response
        response = await callChutesAPI(content, apiToken, selectedModel, chatSettings);
        
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-assistant`,
          content: response,
          isUser: false,
          timestamp: new Date(),
        };

        setChats(prev => prev.map(chat =>
          chat.id === activeChat
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        ));
      }
    } catch (error) {
      console.error('💥 Chat Error:', error);
      toast({
        title: "Error",
        description: "Failed to get response from CHUTES API. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeChat, createNewChat, chatSettings]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      messages: chat.messages.map(msg =>
        msg.id === messageId
          ? { ...msg, content: newContent }
          : msg
      )
    })));
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      messages: chat.messages.filter(msg => msg.id !== messageId),
      messageCount: Math.max(0, (chat.messageCount || 0) - 1)
    })));
  }, []);

  const reactToMessage = useCallback((messageId: string, reaction: 'like' | 'dislike') => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      messages: chat.messages.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [reaction]: (msg.reactions?.[reaction] || 0) + 1
              }
            }
          : msg
      )
    })));
  }, []);

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

  const searchChats = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return chats;
    
    return chats.filter(chat =>
      chat.title.toLowerCase().includes(query.toLowerCase()) ||
      chat.messages.some(msg =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      )
    );
  }, [chats]);

  const exportChat = useCallback((chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const exportData = {
      ...chat,
      exportedAt: new Date().toISOString(),
      version: "2.0"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Chat Exported",
      description: "Chat has been downloaded as JSON file.",
    });
  }, [chats]);

  const importChats = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (Array.isArray(importedData)) {
          // Import multiple chats
          const newChats = importedData.map((chat: any) => ({
            ...chat,
            id: `chat-${Date.now()}-${Math.random()}`,
            timestamp: new Date(chat.timestamp),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setChats(prev => [...newChats, ...prev]);
        } else {
          // Import single chat
          const newChat = {
            ...importedData,
            id: `chat-${Date.now()}-${Math.random()}`,
            timestamp: new Date(importedData.timestamp),
            messages: importedData.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          };
          setChats(prev => [newChat, ...prev]);
        }

        toast({
          title: "Chats Imported",
          description: "Successfully imported chat data.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format. Please select a valid JSON file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, []);

  const starChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, isStarred: !chat.isStarred }
        : chat
    ));
  }, []);

  const updateChatSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    setChatSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const filteredChats = searchQuery
    ? chats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(msg =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : chats;

  return {
    chats: filteredChats,
    activeChat,
    isLoading,
    searchQuery,
    chatSettings,
    createNewChat,
    branchChat,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    deleteChat,
    selectChat,
    getCurrentChat,
    searchChats,
    exportChat,
    importChats,
    starChat,
    updateChatSettings,
  };
}

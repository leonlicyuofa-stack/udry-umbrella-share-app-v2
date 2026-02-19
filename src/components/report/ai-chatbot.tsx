
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { httpsCallable } from 'firebase/functions';
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const { firebaseServices } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: language === 'zh-HK'
        ? '你好！我是 U-Dry 智能助理。請問有什麼可以幫到你？'
        : 'Hi! I\'m the U-Dry AI assistant. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    if (!firebaseServices?.functions) {
      setError('Service unavailable. Please try again later.');
      return;
    }

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const askSupport = httpsCallable<
        { question: string; language: string },
        { answer: string }
      >(firebaseServices.functions, 'askSupport');

      const result = await askSupport({ question, language });
      const answer = result.data?.answer;

      if (!answer) throw new Error('Empty response from assistant.');

      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err: any) {
      console.error('AIChatbot error:', err);
      setError(
        language === 'zh-HK'
          ? '抱歉，助理暫時無法回應。請稍後再試，或致電客服。'
          : 'Sorry, the assistant is temporarily unavailable. Please try again or contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-64 border rounded-lg overflow-hidden bg-background">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-2 text-sm',
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {/* Avatar */}
            <div className={cn(
              'flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center',
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              {msg.role === 'user'
                ? <User className="h-3 w-3" />
                : <Bot className="h-3 w-3" />
              }
            </div>
            {/* Bubble */}
            <div className={cn(
              'rounded-lg px-3 py-2 max-w-[80%] leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 text-sm">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <Bot className="h-3 w-3" />
            </div>
            <div className="rounded-lg px-3 py-2 bg-muted text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {language === 'zh-HK' ? '思考中...' : 'Thinking...'}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-destructive text-center px-2">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t p-2 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={language === 'zh-HK' ? '輸入你的問題...' : 'Type your question...'}
          disabled={isLoading}
          className="text-sm h-8"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          {isLoading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Send className="h-3 w-3" />
          }
        </Button>
      </div>
    </div>
  );
}

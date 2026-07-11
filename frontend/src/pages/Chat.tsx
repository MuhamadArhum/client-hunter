import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Copy, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'How do I qualify a good lead?',
  'Write a cold outreach email template',
  'What makes a great sales proposal?',
  'How to follow up without being pushy?',
  'Tips for improving conversion rate',
  'How to find clients on LinkedIn?',
];

function MessageBubble({ msg }: { msg: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #10B981, #21F6A8)' }
            : { background: 'linear-gradient(135deg, #21F6A8, #10B981)' }
        }
      >
        {isUser
          ? <User className="h-3.5 w-3.5 text-gray-900" />
          : <Bot className="h-3.5 w-3.5 text-gray-900" />
        }
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm text-gray-900'
              : 'bg-muted text-foreground rounded-tl-sm border border-border/60',
          )}
          style={isUser ? { background: 'linear-gradient(135deg, #21F6A8, #10B981)' } : {}}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Time + Copy */}
        <div className={cn(
          'flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
          isUser && 'flex-row-reverse',
        )}>
          <span className="text-[10px] text-muted-foreground/60">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              {copied
                ? <Check className="h-3 w-3 text-emerald-500" />
                : <Copy className="h-3 w-3" />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
      >
        <Bot className="h-3.5 w-3.5 text-gray-900" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3 bg-muted border border-border/60">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, background: '#21F6A8' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Abyte Hunter AI Assistant powered by Groq. I can help you with lead qualification, outreach strategies, proposal writing, and sales guidance. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { data } = await api.post('/chat', { message: trimmed, history });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Chat cleared! How can I help you with your client hunting today?',
      timestamp: new Date(),
    }]);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col p-5" style={{ height: 'calc(100vh - 70px)' }}>

      {/* ── Chat header ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
          >
            <Sparkles className="h-4.5 w-4.5 text-gray-900" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Sales Assistant</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Powered by Groq · LLaMA 3.3 70B</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border" style={{ background: 'rgba(33,246,168,0.06)', borderColor: 'rgba(33,246,168,0.2)' }}>
            <Zap className="h-3 w-3" style={{ color: '#0D9C6A' }} />
            <span className="text-xs font-medium" style={{ color: '#0D9C6A' }}>Groq AI</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-4 mb-3">

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        {/* Quick suggestions */}
        {showSuggestions && !loading && (
          <div className="pt-2">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Quick suggestions to get started
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg border border-border transition-all duration-150 text-muted-foreground hover:text-foreground"
                  style={{}}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(33,246,168,0.4)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(33,246,168,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '';
                    (e.currentTarget as HTMLButtonElement).style.background = '';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div
        className="shrink-0 rounded-xl border border-border bg-card p-3 transition-colors"
        style={{}}
        onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(33,246,168,0.4)'; }}
        onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = ''; }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about leads, outreach, proposals, or sales strategy..."
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent text-sm focus-visible:ring-0 min-h-[36px] max-h-[100px] p-0 placeholder:text-muted-foreground/60"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            size="sm"
            className={cn(
              'h-8 w-8 p-0 rounded-lg shrink-0 transition-all',
              input.trim() && !loading
                ? 'text-gray-900'
                : 'bg-muted text-muted-foreground',
            )}
            style={input.trim() && !loading ? { background: 'linear-gradient(135deg, #21F6A8, #10B981)' } : {}}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/50 mt-2 shrink-0">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

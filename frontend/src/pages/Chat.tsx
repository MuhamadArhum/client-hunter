import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Copy, Check } from 'lucide-react';
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
  'Tips for improving lead conversion rate',
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
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1"
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #9F8DD4, #1DD2D7)' }
            : { background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }
        }
      >
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>

      {/* Bubble */}
      <div className={cn('flex flex-col max-w-[75%]', isUser && 'items-end')}>
        <div
          className="relative rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg, rgba(159,141,212,0.25), rgba(29,210,215,0.2))',
                  border: '1px solid rgba(159,141,212,0.3)',
                  color: 'rgba(230,240,255,0.95)',
                  borderTopRightRadius: 4,
                }
              : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(210,225,240,0.9)',
                  borderTopLeftRadius: 4,
                }
          }
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Time + Copy */}
        <div className={cn('flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity', isUser && 'flex-row-reverse')}>
          <span className="text-[10px]" style={{ color: 'rgba(150,170,200,0.5)' }}>
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] transition-colors" style={{ color: 'rgba(150,170,200,0.5)' }}>
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
           style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)' }}>
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
           style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderTopLeftRadius: 4 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full animate-bounce"
                style={{ background: '#1DD2D7', animationDelay: `${i * 0.15}s` }} />
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
      content: "Hi! I'm your Abyte Hunter AI Assistant. I can help you with lead qualification, outreach strategies, proposal writing, and sales tips. What would you like to know?",
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
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Chat cleared! How can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
               style={{ background: 'linear-gradient(135deg, #1DD2D7, #9F8DD4)', boxShadow: '0 4px 16px rgba(29,210,215,0.3)' }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'rgba(230,240,255,0.95)' }}>
              AI Assistant
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span className="text-xs" style={{ color: 'rgba(150,170,200,0.7)' }}>Powered by Groq · Llama 3.3</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat}
                className="gap-2 text-xs hover:bg-red-500/10 hover:text-red-400"
                style={{ color: 'rgba(150,170,200,0.6)' }}>
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 mb-4"
           style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        {/* Suggestions */}
        {showSuggestions && !loading && (
          <div className="pt-2">
            <p className="text-xs mb-3 text-center" style={{ color: 'rgba(150,170,200,0.5)' }}>
              Quick suggestions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl transition-all duration-150 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(29,210,215,0.06)',
                    border: '1px solid rgba(29,210,215,0.15)',
                    color: 'rgba(210,225,240,0.8)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(29,210,215,0.12)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(29,210,215,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(29,210,215,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(29,210,215,0.15)';
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

      {/* Input */}
      <div className="relative rounded-2xl p-3"
           style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about leads, outreach, proposals..."
          rows={1}
          className="resize-none border-0 bg-transparent pr-12 text-sm focus-visible:ring-0 min-h-[40px] max-h-[120px]"
          style={{ color: 'rgba(210,225,240,0.9)', scrollbarWidth: 'none' }}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          size="sm"
          className="absolute right-3 bottom-3 h-8 w-8 p-0 rounded-xl transition-all"
          style={{
            background: input.trim() && !loading
              ? 'linear-gradient(135deg, #1DD2D7, #9F8DD4)'
              : 'rgba(255,255,255,0.08)',
            boxShadow: input.trim() && !loading ? '0 2px 12px rgba(29,210,215,0.4)' : 'none',
          }}
        >
          <Send className="h-3.5 w-3.5 text-white" />
        </Button>
      </div>

      <p className="text-center text-[10px] mt-2" style={{ color: 'rgba(150,170,200,0.35)' }}>
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

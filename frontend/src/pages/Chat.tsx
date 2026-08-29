import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Copy, Check, Zap } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import api from '@/services/api';

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
    <div style={{ display: 'flex', gap: 12, flexDirection: isUser ? 'row-reverse' : 'row' }} className="group">
      {/* Avatar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 4, flexShrink: 0, marginTop: 2,
        background: '#1FB2A6',
      }}>
        {isUser
          ? <User style={{ width: 13, height: 13, color: '#fff' }} />
          : <Bot style={{ width: 13, height: 13, color: '#fff' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '80%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
          borderRadius: 4,
          background: isUser ? '#1FB2A6' : '#fff',
          color: isUser ? '#fff' : '#1B1F2B',
          border: isUser ? 'none' : '1px solid #CBD3CF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
        </div>

        {/* Time + Copy */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
          flexDirection: isUser ? 'row-reverse' : 'row',
          opacity: 0, transition: 'opacity 0.15s',
        }} className="group-hover:opacity-100">
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0' }}>
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {copied
                ? <Check style={{ width: 11, height: 11, color: '#1FB2A6' }} />
                : <Copy style={{ width: 11, height: 11, color: '#9CADB0' }} />
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
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 4, background: '#1FB2A6', flexShrink: 0 }}>
        <Bot style={{ width: 13, height: 13, color: '#fff' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 4, background: '#fff', border: '1px solid #CBD3CF' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, background: '#1FB2A6', display: 'inline-block' }}
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
    <div style={{ display: 'flex', flexDirection: 'column', padding: 24, height: 'calc(100vh - 70px)', background: '#E6E9E5' }}>

      {/* Chat header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 4, background: '#1FB2A6', flexShrink: 0 }}>
            <Sparkles style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1B1F2B', margin: 0 }}>AI Sales Assistant</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#1FB2A6', animation: 'pulse 2s infinite' }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#6E7D79' }}>Powered by Groq · LLaMA 3.3 70B</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 4, background: 'rgba(31,178,166,0.08)', border: '1px solid rgba(31,178,166,0.2)' }}>
            <Zap style={{ width: 11, height: 11, color: '#1FB2A6' }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, fontWeight: 700, color: '#1FB2A6' }}>Groq AI</span>
          </div>
          <button
            onClick={clearChat}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 4, background: '#F1F4F0', border: '1px solid #CBD3CF', cursor: 'pointer', color: '#6E7D79', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C23B2E'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(194,59,46,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6E7D79'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD3CF'; }}
          >
            <Trash2 style={{ width: 13, height: 13 }} />
            Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', borderRadius: 4, border: '1px solid #CBD3CF', background: '#F1F4F0', padding: 16, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        {/* Quick suggestions */}
        {showSuggestions && !loading && (
          <div style={{ paddingTop: 8 }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#9CADB0', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick suggestions to get started
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    textAlign: 'left', fontSize: 12, padding: '10px 12px', borderRadius: 4,
                    border: '1px solid #CBD3CF', background: '#fff', color: '#6E7D79', cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(31,178,166,0.4)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31,178,166,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#1B1F2B';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD3CF';
                    (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6E7D79';
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

      {/* Input area */}
      <div
        style={{ flexShrink: 0, borderRadius: 4, border: '1px solid #CBD3CF', background: '#F1F4F0', padding: 12, transition: 'border-color 0.15s' }}
        onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(31,178,166,0.5)')}
        onBlurCapture={e => (e.currentTarget.style.borderColor = '#CBD3CF')}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about leads, outreach, proposals, or sales strategy..."
            rows={1}
            style={{ flex: 1, resize: 'none', border: 'none', background: 'transparent', fontSize: 13, color: '#1B1F2B', outline: 'none', boxShadow: 'none', minHeight: 36, maxHeight: 100, padding: 0 }}
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 34, height: 34, borderRadius: 4, border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: (input.trim() && !loading) ? '#1FB2A6' : '#CBD3CF',
              transition: 'background 0.15s',
            }}
          >
            <Send style={{ width: 13, height: 13, color: '#fff' }} />
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#9CADB0', marginTop: 8, flexShrink: 0 }}>
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

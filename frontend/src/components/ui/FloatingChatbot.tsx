import React, { FormEvent, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, Mic, Send, X, Maximize2, Minimize2, LogOut, PanelLeft, User, Search, Sparkles } from 'lucide-react';
import { publicChatApi, workspaceApi } from '../../api/client';
import { signOutCurrentUser } from '../../utils/auth';
import { useAppStore } from '../../store/useAppStore';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

interface FloatingChatbotProps {
  publicMode?: boolean;
}

interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const starterMessage: ChatMessage = {
  role: 'model',
  content: 'Hey bro, I am BroBot. Ask me how BroFocus can help you plan, focus, and level up your workday.',
};

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ publicMode = false }) => {
  const { user, logout } = useAppStore();
  const isPublicAssistant = publicMode;
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [proposal, setProposal] = useState<{ proposal_id: string; type: string; payload: Record<string, unknown> } | null>(null);
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 520 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!open || maximized) return;

    const handleMove = (event: MouseEvent) => {
      if (!dragging) return;
      const maxX = window.innerWidth - 360;
      const maxY = window.innerHeight - 420;
      setPosition({
        x: Math.min(Math.max(event.clientX - dragOffset.current.x, 12), maxX),
        y: Math.min(Math.max(event.clientY - dragOffset.current.y, 12), maxY),
      });
    };

    const handleUp = () => setDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, open, maximized]);

  const startDrag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (maximized || !open) return;
    dragOffset.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (isPublicAssistant) {
      setMaximized(false);
    }
  }, [isPublicAssistant]);

  const handleSignOut = async () => {
    await signOutCurrentUser();
    logout();
    window.location.href = '/landing';
  };

  const streamResponse = (response: string) => {
    const messageIndex = messages.length + 1;
    setMessages((current) => [...current, { role: 'model', content: '' }]);
    let cursor = 0;
    const interval = window.setInterval(() => {
      cursor = Math.min(response.length, cursor + 4);
      setMessages((current) => current.map((message, index) => index === messageIndex ? { ...message, content: response.slice(0, cursor) } : message));
      if (cursor >= response.length) window.clearInterval(interval);
    }, 18);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;

    setInput('');
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setIsSending(true);

    try {
      const response = publicMode
        ? await publicChatApi.chat(message)
        : await workspaceApi.chat(message);
      if (response.proposal) setProposal(response.proposal);
      streamResponse(response.response);
    } catch (error: any) {
      const detail = error?.response?.data?.error || 'I could not reach the BroFocus brain right now. Please try again in a moment.';
      setMessages((current) => [...current, { role: 'model', content: detail }]);
    } finally {
      setIsSending(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessages((current) => [...current, { role: 'model', content: 'Voice input is not supported by this browser. You can still type your request.' }]);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const confirmProposal = async (confirmed: boolean) => {
    if (!proposal) return;
    try {
      if (confirmed) await workspaceApi.confirm(proposal.proposal_id, true);
      setMessages((current) => [...current, { role: 'model', content: confirmed ? 'Done. I applied the confirmed change.' : 'No changes made. I discarded that proposal.' }]);
    } catch (error: any) {
      setMessages((current) => [...current, { role: 'model', content: error?.response?.data?.error || 'The confirmed action could not be completed.' }]);
    } finally {
      setProposal(null);
    }
  };

  return (
    <div className="fixed bottom-8 right-6 z-[70] sm:right-8">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={maximized && !isPublicAssistant ? 'fixed inset-4 z-[80] flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/30 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.35)]' : 'fixed flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/30 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.35)]'}
            style={maximized && !isPublicAssistant ? undefined : { width: 'min(420px, calc(100vw - 2rem))', height: 'min(560px, calc(100vh - 3rem))', left: position.x, top: position.y }}
          >
            <div
              className="flex cursor-grab items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-3 text-white active:cursor-grabbing"
              onMouseDown={startDrag}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">BroBot</div>
                  <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-blue-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Gemini AI online
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isPublicAssistant && (
                  <button type="button" onClick={() => setMaximized((value) => !value)} className="rounded-full p-1.5 transition hover:bg-white/10" aria-label={maximized ? 'Minimize chatbot' : 'Maximize chatbot'}>
                    {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 transition hover:bg-white/10" aria-label="Close chatbot">
                  <X size={16} />
                </button>
              </div>
            </div>

            {maximized && !isPublicAssistant ? (
              <div className="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)] bg-slate-100 text-slate-800">
                <aside className="flex flex-col border-r border-slate-200 bg-slate-50/80">
                  <div className="border-b border-slate-200 p-3">
                    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Search size={14} className="text-slate-500" />
                        Threads
                      </div>
                      <button type="button" onClick={() => setMaximized(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
                        <PanelLeft size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto p-3">
                    <div className="rounded-2xl bg-indigo-50 p-3 shadow-sm ring-1 ring-indigo-200">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Active chat</div>
                      <div className="mt-2 text-sm font-semibold text-slate-800">Workspace triage</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Yesterday</div>
                      <div className="mt-2 text-sm font-medium text-slate-700">Gmail follow-ups</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Saved</div>
                      <div className="mt-2 text-sm font-medium text-slate-700">Agenda recap</div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-bold text-white">
                        {user?.name?.[0]?.toUpperCase() || 'B'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">{user?.name || 'BroFocus User'}</div>
                        <div className="truncate text-[11px] text-slate-500">{user?.email || 'bro@brofocus.ai'}</div>
                      </div>
                      <button type="button" onClick={handleSignOut} className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50" aria-label="Sign out">
                        <LogOut size={15} />
                      </button>
                    </div>
                  </div>
                </aside>

                <div className="flex min-h-0 min-w-0 flex-col bg-slate-100">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      Workspace assistant
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      {user?.name || 'You'}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-100 p-4">
                    {messages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                        {message.role === 'model' && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-indigo-700 ring-1 ring-slate-200">
                            <Bot size={15} />
                          </div>
                        )}
                        <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-tr-none bg-indigo-600 text-white' : 'rounded-tl-none border border-slate-200 bg-white text-slate-700'}`}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isSending && <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Loader2 className="animate-spin" size={14} /> BroBot is thinking...</div>}
                    {proposal && !isPublicAssistant && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
                        <p className="font-bold text-indigo-700">Confirm this {proposal.type === 'calendar_event' ? 'calendar event' : 'task'}?</p>
                        <p className="mt-1 text-slate-600">{String(proposal.payload.summary || proposal.payload.title)}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => confirmProposal(true)} className="rounded-full bg-indigo-600 px-3 py-1.5 font-bold text-white">Confirm</button>
                          <button type="button" onClick={() => confirmProposal(false)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <button type="button" onClick={toggleVoiceInput} className={`rounded-full p-2 transition ${isListening ? 'bg-rose-100 text-rose-600' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`} aria-label={isListening ? 'Stop voice input' : 'Start voice input'}>
                        <Mic size={16} />
                      </button>
                      <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Ask BroBot..."
                        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                      />
                      <button type="submit" onClick={(event) => void sendMessage(event as unknown as FormEvent)} disabled={isSending || !input.trim()} className="rounded-full bg-indigo-600 p-2 text-white transition hover:bg-indigo-700 disabled:opacity-40" aria-label="Send message">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex min-h-0 flex-1 flex-col bg-slate-100">
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-100 p-4">
                    {messages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                        {message.role === 'model' && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-700"><Bot size={16} /></div>}
                        <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-tr-none bg-indigo-600 text-white' : 'rounded-tl-none border border-slate-200 bg-white text-slate-700'}`}>
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isSending && <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Loader2 className="animate-spin" size={14} /> BroBot is thinking...</div>}
                    {proposal && !isPublicAssistant && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-sm">
                        <p className="font-bold text-indigo-700">Confirm this {proposal.type === 'calendar_event' ? 'calendar event' : 'task'}?</p>
                        <p className="mt-1 text-slate-600">{String(proposal.payload.summary || proposal.payload.title)}</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => confirmProposal(true)} className="rounded-full bg-indigo-600 px-3 py-1.5 font-bold text-white">Confirm</button>
                          <button type="button" onClick={() => confirmProposal(false)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                      <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Ask BroBot..."
                        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                      />
                      <button type="button" onClick={toggleVoiceInput} className={`rounded-full p-2 transition ${isListening ? 'bg-rose-100 text-rose-600' : 'bg-white text-indigo-600 hover:bg-indigo-50'}`} aria-label={isListening ? 'Stop voice input' : 'Start voice input'}>
                        <Mic size={16} />
                      </button>
                      <button type="submit" onClick={(event) => void sendMessage(event as unknown as FormEvent)} disabled={isSending || !input.trim()} className="rounded-full bg-indigo-600 p-2 text-white transition hover:bg-indigo-700 disabled:opacity-40" aria-label="Send message">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="group flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-[0_12px_35px_rgba(37,99,235,0.45)] transition"
          aria-label={open ? 'Close BroBot' : 'Open BroBot'}
        >
          <Bot size={28} />
        </motion.button>
      )}
    </div>
  );
};

export default FloatingChatbot;

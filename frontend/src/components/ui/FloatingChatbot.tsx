import React, { FormEvent, useRef, useState } from 'react';
import { Bot, Loader2, Mic, Send, X } from 'lucide-react';
import { publicChatApi, workspaceApi } from '../../api/client';

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
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([starterMessage]);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [proposal, setProposal] = useState<{ proposal_id: string; type: string; payload: Record<string, unknown> } | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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
    <div className="fixed bottom-8 right-6 z-[60] sm:right-8">
      {open && (
        <div className="mb-4 flex h-[500px] w-[min(400px,calc(100vw-3rem))] flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
          <div className="flex items-center justify-between bg-primary p-5 text-on-primary">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><Bot size={22} /></div>
              <div>
                <h2 className="text-sm font-bold">BroBot</h2>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-80">
                  <span className="h-2 w-2 rounded-full bg-success-green" /> Gemini AI online
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 transition hover:bg-white/10" aria-label="Close chatbot">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-surface-container-low p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                {message.role === 'model' && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-primary"><Bot size={16} /></div>}
                <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-tr-none bg-primary text-on-primary' : 'rounded-tl-none border border-outline-variant bg-white text-on-surface'}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {isSending && <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant"><Loader2 className="animate-spin" size={14} /> BroBot is thinking...</div>}
            {proposal && !publicMode && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-on-surface">
                <p className="font-bold text-primary">Confirm this {proposal.type === 'calendar_event' ? 'calendar event' : 'task'}?</p>
                <p className="mt-1 text-on-surface-variant">{String(proposal.payload.summary || proposal.payload.title)}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => confirmProposal(true)} className="rounded-full bg-primary px-3 py-1.5 font-bold text-white">Confirm</button>
                  <button type="button" onClick={() => confirmProposal(false)} className="rounded-full border border-outline-variant bg-white px-3 py-1.5 font-bold text-on-surface-variant">Cancel</button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="border-t border-outline-variant bg-white p-3">
            <div className="flex items-center gap-2 rounded-full bg-surface-container px-3 py-1">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask BroBot..."
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-0"
              />
              <button type="button" onClick={toggleVoiceInput} className={`rounded-full p-2 transition hover:bg-white ${isListening ? 'text-error' : 'text-primary'}`} aria-label={isListening ? 'Stop voice input' : 'Start voice input'}>
                <Mic size={18} />
              </button>
              <button type="submit" disabled={isSending || !input.trim()} className="rounded-full p-2 text-primary transition hover:bg-white disabled:opacity-40" aria-label="Send message">
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {!open && <div className="pointer-events-none absolute bottom-full right-0 mb-4 whitespace-nowrap rounded-xl bg-on-surface px-4 py-2 text-xs font-bold text-surface opacity-0 shadow-xl transition group-hover:opacity-100">Need help, bro?</div>}
      <button type="button" onClick={() => setOpen((current) => !current)} className="group flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-primary text-on-primary shadow-[0_8px_32px_rgba(58,71,209,0.4)] transition hover:scale-110 active:scale-95" aria-label={open ? 'Close BroBot' : 'Open BroBot'}>
        {open ? <X size={28} /> : <Bot size={30} />}
      </button>
    </div>
  );
};

export default FloatingChatbot;

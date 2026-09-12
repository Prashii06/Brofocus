// BroFocus - Chat Bubble Component
import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Cpu, ExternalLink, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
  onActionClick?: (action: string) => void;
}

const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const processed = (content || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(139,77,255,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>'
    )
    .replace(/\n/g, '<br/>');

  return <span dangerouslySetInnerHTML={{ __html: processed }} />;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onActionClick }) => {
  const isUser = message.sender === 'user' || message.role === 'user';
  const textContent = message.text || message.content || '';
  const isLoading = message.isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
          isUser
            ? 'bg-gradient-to-br from-cyan-500 to-violet-500 text-white'
            : 'bg-gradient-to-br from-violet-600 to-cyan-700 text-cyan-200 border border-violet-500/30'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div
        className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-lg backdrop-blur-md ${
          isUser
            ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-tr-xs'
            : 'bg-slate-900/90 text-slate-200 rounded-tl-xs border border-slate-800'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-violet-300">
            <Sparkles size={14} className="animate-spin" />
            <span>Gemini AI is generating response...</span>
          </div>
        ) : (
          <>
            <SimpleMarkdown content={textContent} />

            {/* Grounding Sources */}
            {message.grounding_sources && message.grounding_sources.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                <span className="text-[10px] font-semibold text-cyan-400 block uppercase">Sources:</span>
                {message.grounding_sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-cyan-300 hover:underline"
                  >
                    <ExternalLink size={10} />
                    <span>{src.title || src.url}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Suggested Actions */}
            {message.suggested_actions && message.suggested_actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {message.suggested_actions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => onActionClick && onActionClick(act)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30 transition-all"
                  >
                    {act}
                  </button>
                ))}
              </div>
            )}

            {/* Timestamp & Attribution */}
            <div className={`flex items-center gap-1.5 text-[10px] opacity-60 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span>{message.timestamp}</span>
              {!isUser && (
                <span className="flex items-center gap-0.5 text-cyan-400 font-semibold">
                  <Bot size={10} /> Gemini 1.5
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatBubble;

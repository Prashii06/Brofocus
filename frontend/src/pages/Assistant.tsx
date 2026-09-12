// BroFocus - AI Assistant & Multimodal Hub Page
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Globe,
  Sparkles,
  Paperclip,
  Trash2,
  Volume2,
  Loader2,
  Cpu,
  CornerDownLeft,
  X,
  Zap,
} from 'lucide-react';
import { assistantApi, multimodalApi } from '../api/client';
import { ChatBubble } from '../components/ui/ChatBubble';
import { useAppStore } from '../store/useAppStore';
import { ChatMessage } from '../types';

export const Assistant: React.FC = () => {
  const { chatHistory, addChatMessage, clearChatHistory, addNotification } = useAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const [webSearchMode, setWebSearchMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; preview: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Mutation: Send Text Chat
  const chatMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await assistantApi.sendMessage(text, webSearchMode);
      return res.data;
    },
    onSuccess: (data) => {
      addChatMessage({
        id: 'msg-' + Date.now(),
        sender: 'ai',
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_actions: data.suggested_actions,
        grounding_sources: data.grounding_sources,
      });
    },
  });

  // Mutation: Vision Upload
  const visionMutation = useMutation({
    mutationFn: async ({ base64, prompt }: { base64: string; prompt: string }) => {
      const res = await multimodalApi.analyzeVision(base64, 'image/jpeg', prompt);
      return res.data;
    },
    onSuccess: (data) => {
      addChatMessage({
        id: 'msg-' + Date.now(),
        sender: 'ai',
        text: data.result,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setSelectedImage(null);
    },
  });

  // Mutation: Voice STT/TTS
  const voiceMutation = useMutation({
    mutationFn: async (audioBase64: string) => {
      const res = await multimodalApi.processVoice(audioBase64, 'audio/mp3');
      return res.data;
    },
    onSuccess: (data) => {
      addChatMessage({
        id: 'msg-' + Date.now(),
        sender: 'ai',
        text: `**Voice Transcription:** "${data.transcript}"\n\n${data.response}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    },
  });

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() && !selectedImage) return;

    // Add user message
    addChatMessage({
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text || (selectedImage ? '[Uploaded image for analysis]' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    if (selectedImage) {
      visionMutation.mutate({
        base64: selectedImage.base64,
        prompt: text || 'Analyze this image and extract tasks/insights.',
      });
    } else {
      chatMutation.mutate(text);
    }

    setInputMessage('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedImage({
        base64: base64String,
        preview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      addNotification({
        title: 'Microphone Active',
        message: 'Listening... Speak your command or schedule update.',
        type: 'info',
      });
      // Simulate 3s voice capture
      setTimeout(() => {
        setIsRecording(false);
        voiceMutation.mutate('mock-audio-base64-data');
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const presetPrompts = [
    '⚡ Rebalance my schedule for peak energy',
    '📝 Summarize EOD achievements & pending tasks',
    '🔍 Grounding: Find current AI productivity frameworks',
    '📅 Draft email to team about schedule changes',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
              BroFocus AI Assistant
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Gemini 1.5 Pro
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Multimodal command center: text, voice STT/TTS, vision extraction, and Google Grounding.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Grounding Mode Toggle */}
          <button
            onClick={() => setWebSearchMode(!webSearchMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              webSearchMode
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe size={14} className={webSearchMode ? 'text-cyan-400 animate-pulse' : ''} />
            <span>Search Grounding</span>
          </button>

          {/* Clear History Button */}
          <button
            onClick={clearChatHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-sm space-y-4 shadow-inner">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-cyan-400">
              <Sparkles size={36} />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-base font-bold text-slate-200">How can I boost your focus today?</h3>
              <p className="text-xs text-slate-400">
                Ask me to reschedule overlapping meetings, summarize documents, parse screenshots, or search real-time web info.
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-4">
              {presetPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt.replace(/^[^a-zA-Z0-9]+/, ''))}
                  className="p-3 text-left text-xs font-medium rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg: any) => (
            <ChatBubble key={msg.id} message={msg} onActionClick={(action) => handleSendMessage(action)} />
          ))

        )}

        {(chatMutation.isPending || visionMutation.isPending || voiceMutation.isPending) && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-950/30 border border-violet-500/20 max-w-xs text-xs text-violet-300">
            <Loader2 size={16} className="animate-spin text-cyan-400" />
            <span>Gemini AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 backdrop-blur-md">
        {/* Selected Image Thumbnail */}
        {selectedImage && (
          <div className="relative inline-block">
            <img
              src={selectedImage.preview}
              alt="Upload preview"
              className="w-16 h-16 object-cover rounded-lg border border-cyan-500/40 shadow-md"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-700"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-center gap-2">
          {/* File/Vision Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-950 text-slate-400 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all"
            title="Upload Image for Vision AI"
          >
            <ImageIcon size={18} />
          </button>

          {/* Voice STT Toggle */}
          <button
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl border transition-all ${
              isRecording
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                : 'bg-slate-950 text-slate-400 hover:text-violet-400 border-slate-800 hover:border-violet-500/30'
            }`}
            title="Voice Input (STT)"
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Main Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              isRecording
                ? 'Listening to your voice...'
                : webSearchMode
                ? 'Ask anything (Web Search Grounding active)...'
                : 'Ask Gemini AI or type command...'
            }
            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() && !selectedImage}
            className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

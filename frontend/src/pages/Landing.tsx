// BroFocus - AI Focus Time Landing Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Calendar,
  Mic,
  Trophy,
  PlayCircle,
  BellOff,
  Flag,
  Brain,
  Rocket,
  Quote,
  Globe,
  Users,
  Send,
  ChevronDown,
  ArrowRight,
  Zap,
  X,
} from 'lucide-react';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAppStore } from '../store/useAppStore';
import BrandLogo from '../components/ui/BrandLogo';
import FloatingChatbot from '../components/ui/FloatingChatbot';


export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle);
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleCredential = async (credential: string) => {
    setSignInError(null);
    const result = await loginWithGoogle(credential);
    if (result.ok) {
      setShowSignIn(false);
      navigate('/');
    } else {
      setSignInError(result.error);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen font-sans selection:bg-sky-active selection:text-white">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/30 h-20 px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <BrandLogo />
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8 relative">
            {/* Products Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button className="flex items-center gap-1 font-label-bold text-on-surface-variant hover:text-primary transition-colors py-2">
                Products <ChevronDown size={16} className={`transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {productsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-[480px] bg-white rounded-2xl shadow-2xl border border-outline-variant p-5 z-50 grid grid-cols-2 gap-3"
                  >
                    <div
                      onClick={() => navigate('/schedule')}
                      className="flex gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Timer size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">AI Focus Time</div>
                        <p className="text-xs text-on-surface-variant mt-0.5">Auto-block deep work sessions.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigate('/schedule')}
                      className="flex gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-active/10 flex items-center justify-center text-sky-active shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">Smart Scheduling</div>
                        <p className="text-xs text-on-surface-variant mt-0.5">Instant team huddle coordination.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigate('/assistant')}
                      className="flex gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-electric-yellow/20 flex items-center justify-center text-amber-700 shrink-0">
                        <Mic size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">Voice-to-Task</div>
                        <p className="text-xs text-on-surface-variant mt-0.5">Turn rants into action items.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => navigate('/kanban')}
                      className="flex gap-3 p-3 rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-on-surface">Gamified Streaks</div>
                        <p className="text-xs text-on-surface-variant mt-0.5">Earn XP and unlock epic badges.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a className="font-label-bold text-on-surface-variant hover:text-primary transition-colors" href="#how-it-works">
              How It Works
            </a>

            <div
              className="relative"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button className="flex items-center gap-1 font-label-bold text-on-surface-variant hover:text-primary transition-colors py-2">
                Resources <ChevronDown size={16} className={`transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {resourcesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-60 bg-white rounded-2xl shadow-2xl border border-outline-variant p-3 z-50 space-y-1"
                  >
                    <div onClick={() => navigate('/analytics')} className="p-2.5 rounded-xl hover:bg-surface-container cursor-pointer text-xs font-semibold text-on-surface">
                      Analytics Hub
                    </div>
                    <div onClick={() => navigate('/engagement')} className="p-2.5 rounded-xl hover:bg-surface-container cursor-pointer text-xs font-semibold text-on-surface">
                      Daily Kickoff Briefs
                    </div>
                    <div onClick={() => navigate('/integrations')} className="p-2.5 rounded-xl hover:bg-surface-container cursor-pointer text-xs font-semibold text-on-surface">
                      Ecosystem Integrations
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <a className="font-label-bold text-on-surface-variant hover:text-primary transition-colors" href="#contact">
              Contact Us
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSignIn(true)}
            className="bg-gradient-to-r from-sky-active to-primary text-white font-label-bold px-7 py-2.5 rounded-full shadow-[0_4px_15px_rgba(85,98,235,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all text-sm"
          >
            Launch App
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-surface-container-low to-background py-12 lg:py-0">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <div className="absolute top-20 left-10 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-active rounded-full blur-[120px]"></div>
          </div>

          <div className="container max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 z-10">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider mb-6 border border-primary/20">
                ⚡ Powered by Gemini 1.5 Pro AI
              </span>
              <h1 className="font-display-lg text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] mb-6 text-on-background">
                Master Your Deep Work with <span className="text-primary">AI Focus Time</span>
              </h1>
              <p className="font-body-lg text-lg text-on-surface-variant mb-8 max-w-2xl mx-auto lg:mx-0">
                Stop battling distractions. Our AI auto-blocks your calendar, silences the digital noise, and builds the perfect environment for absolute focus.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => setShowSignIn(true)}
                  className="bg-primary text-on-primary font-bold text-base px-9 py-4 rounded-full hover:shadow-[0_10px_30px_rgba(58,71,209,0.3)] hover:-translate-y-1 transition-all active:scale-95"
                >
                  Try BroFocus Now
                </button>
                <button
                  onClick={() => setShowSignIn(true)}
                  className="glass-card text-on-surface font-semibold text-base px-8 py-4 rounded-full hover:bg-white transition-all border border-white/50 flex items-center justify-center gap-2"
                >
                  <PlayCircle size={20} className="text-primary" />
                  Try AI Assistant
                </button>
              </div>
            </div>

            <div className="flex-1 w-full max-w-2xl">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-sky-active rounded-2xl blur-2xl opacity-20"></div>
                <div className="glass-card p-4 rounded-2xl shadow-2xl relative border border-white/60">
                  <div className="aspect-video rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800 flex flex-col p-5 text-white justify-between shadow-2xl">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-mono text-slate-400 ml-2">brofocus-ai-session.v1</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                        DEEP FOCUS ACTIVE
                      </span>
                    </div>

                    <div className="text-center space-y-2 py-4">
                      <div className="text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-active to-primary">
                        45:00
                      </div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                        Task: Refactor Gemini Multimodal Engine
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-slate-800">
                      <div className="p-2 rounded-lg bg-slate-800/60">
                        <span className="text-slate-400 block text-[10px]">XP Gain Rate</span>
                        <span className="font-bold text-amber-400">+10 XP / min</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/60">
                        <span className="text-slate-400 block text-[10px]">Distractions</span>
                        <span className="font-bold text-emerald-400">0 Blocked</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/60">
                        <span className="text-slate-400 block text-[10px]">Energy Window</span>
                        <span className="font-bold text-cyan-400">Peak (98%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Badge floating overlay */}
                  <div className="absolute -bottom-5 -left-5 glass-card p-4 rounded-xl shadow-xl flex items-center gap-3 border border-white/50 bg-white/90">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
                      <BellOff size={22} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">FOCUS ACTIVE</p>
                      <p className="text-xs font-bold text-primary">All Pings & Alerts Silenced</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-24 px-6 lg:px-8 bg-surface">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display-lg text-3xl lg:text-4xl font-extrabold mb-3">How It Works</h2>
              <p className="font-body-md text-on-surface-variant text-base">Go from chaos to focus in four simple steps.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="relative group">
                <div className="h-full glass-card p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-primary/10 group-hover:-translate-y-2 flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center text-on-primary-container mb-6 shadow-lg">
                      <Calendar size={28} />
                    </div>
                    <span className="text-primary font-black opacity-10 absolute top-4 right-6 text-5xl">01</span>
                    <h3 className="font-bold text-lg mb-2">Connect Calendar</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Sync Google or Outlook. Our AI scans your commitments to find peak focus gaps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="h-full glass-card p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-primary/10 group-hover:-translate-y-2 flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-motivation-orange rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                      <Flag size={28} />
                    </div>
                    <span className="text-primary font-black opacity-10 absolute top-4 right-6 text-5xl">02</span>
                    <h3 className="font-bold text-lg mb-2">Daily Grind Goals</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Define what winning looks like today. Set your core priorities and Kanban tasks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="h-full glass-card p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-primary/10 group-hover:-translate-y-2 flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-sky-active rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg">
                      <Brain size={28} />
                    </div>
                    <span className="text-primary font-black opacity-10 absolute top-4 right-6 text-5xl">03</span>
                    <h3 className="font-bold text-lg mb-2">Smart Blocking</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      AI identifies high-energy windows and auto-reserves your deep focus blocks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative group">
                <div className="h-full glass-card p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-primary/10 group-hover:-translate-y-2 flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-electric-yellow rounded-2xl flex items-center justify-center text-on-tertiary-fixed mb-6 shadow-lg">
                      <Rocket size={28} />
                    </div>
                    <span className="text-primary font-black opacity-10 absolute top-4 right-6 text-5xl">04</span>
                    <h3 className="font-bold text-lg mb-2">Go Savage Mode</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      One click to trigger total lockdown. Start your session, earn XP, and crush it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Quote */}
        <section className="py-20 px-6 lg:px-8 text-center bg-on-background text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent"></div>
          </div>
          <div className="container max-w-4xl mx-auto relative z-10 space-y-6">
            <div className="w-12 h-12 rounded-full bg-electric-yellow/20 text-electric-yellow mx-auto flex items-center justify-center">
              <Quote size={32} />
            </div>
            <blockquote className="font-display-lg text-2xl sm:text-3xl lg:text-[40px] leading-tight font-extrabold italic">
              "Stop being busy, start being productive."
            </blockquote>
            <p className="font-label-bold text-sky-active tracking-widest text-sm uppercase">— THE BRO PROTOCOL</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 lg:px-8 bg-primary">
          <div className="container max-w-5xl mx-auto glass-card p-10 md:p-16 rounded-3xl text-center border-none shadow-2xl relative overflow-hidden bg-white/90">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-electric-yellow/20 rounded-full blur-[80px]"></div>
            <div className="relative z-10 space-y-6">
              <h2 className="font-display-lg text-3xl sm:text-4xl font-extrabold text-on-background">
                Ready to level up your focus?
              </h2>
              <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-base">
                Join 100,000+ top performers who use BroFocus AI Time to dominate their goals.
              </p>
              <button
                onClick={() => setShowSignIn(true)}
                className="bg-primary text-on-primary font-bold text-base px-10 py-4 rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-xl active:scale-95"
              >
                GET STARTED FOR FREE
              </button>
              <p className="text-xs font-bold text-on-surface-variant opacity-60">
                NO CREDIT CARD REQUIRED • CANCEL ANYTIME
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-[#0b0e14] text-white pt-20 pb-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-sky-active flex items-center justify-center text-white font-bold">
                  <Zap size={18} />
                </div>
                <span className="font-bold text-xl text-white">BroFocus</span>
              </div>
              <p className="text-on-secondary-container text-xs max-w-xs leading-relaxed">
                The intelligent co-pilot for high-performance teams. Stay focused, stay savage.
              </p>
              <div className="flex gap-3">
                <a className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-slate-400 hover:text-white" href="#">
                  <Globe size={18} />
                </a>
                <a className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-slate-400 hover:text-white" href="#">
                  <Users size={18} />
                </a>
                <a className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-colors text-slate-400 hover:text-white" href="#">
                  <Send size={18} />
                </a>
              </div>
            </div>


            <div>
              <h4 className="font-bold text-white uppercase tracking-widest text-[11px] mb-4">Product</h4>
              <ul className="space-y-2.5 text-on-secondary-container text-xs">
                <li><a className="hover:text-white transition-colors" href="#">Features</a></li>
                <li><a className="hover:text-white transition-colors" href="#">AI Engine</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Pricing</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Chrome Extension</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-widest text-[11px] mb-4">Resources</h4>
              <ul className="space-y-2.5 text-on-secondary-container text-xs">
                <li><a className="hover:text-white transition-colors" href="#">Blog</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Help Center</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Community</a></li>
                <li><a className="hover:text-white transition-colors" href="#">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-widest text-[11px] mb-4">Company</h4>
              <ul className="space-y-2.5 text-on-secondary-container text-xs">
                <li><a className="hover:text-white transition-colors" href="#">About Us</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Careers</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Manifesto</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-widest text-[11px] mb-4">Legal</h4>
              <ul className="space-y-2.5 text-on-secondary-container text-xs">
                <li><a className="hover:text-white transition-colors" href="#">Privacy</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Terms</a></li>
                <li><a className="hover:text-white transition-colors" href="#">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-secondary-container">
            <p>© 2026 BroFocus AI. All rights reserved.</p>
            <div className="flex gap-6">
              <a className="hover:text-white transition-colors" href="#">Cookie Policy</a>
              <a className="hover:text-white transition-colors" href="#">Status</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sign-in Modal */}
      <AnimatePresence>
        {showSignIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSignIn(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full relative shadow-2xl text-center"
            >
              <button
                onClick={() => setShowSignIn(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-sky-active flex items-center justify-center text-white mx-auto mb-4">
                <Zap size={22} />
              </div>
              <h3 className="font-display-lg text-xl font-extrabold text-on-background mb-1">
                Sign in to BroFocus
              </h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Continue with your Google account to get started.
              </p>

              <div className="flex justify-center">
                <GoogleSignInButton onCredential={handleCredential} onError={setSignInError} />
              </div>

              {signInError && (
                <p className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                  {signInError}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <FloatingChatbot publicMode />
    </div>
  );
};

export default Landing;

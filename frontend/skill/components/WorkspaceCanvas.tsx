import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Search, Sparkles, Pin, MoreHorizontal, Layers, PlayCircle, 
  Plus, MousePointer2, ZoomIn, ZoomOut, Maximize2, X, Send, 
  FileText, Zap, MessageSquare, Hash, Link2, RotateCcw
} from 'lucide-react';
import { Lang, ViewMode } from '../types';
import { geminiService } from '../services/geminiService';
import { ASSETS } from '../constants/assets';

interface NodeData {
  id: string;
  title: string;
  type: string;
  icon: React.ElementType;
  tag: string;
  color: string;
  x: number;
  y: number;
  description?: string;
}

interface EdgeData {
  id: string;
  from: string;
  to: string;
  label: string;
}

interface DraggableNodeProps extends NodeData {
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  scale: number;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ 
  id, title, type, icon: Icon, tag, color, x, y, isSelected, onSelect, onPositionChange, scale 
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onDrag={(_, info) => onPositionChange(id, x + info.delta.x / scale, y + info.delta.y / scale)}
      onTap={() => onSelect(id)}
      initial={false}
      animate={{ 
        x: x, 
        y: y,
        scale: isSelected ? 1.05 : 1,
        borderColor: isSelected ? 'rgba(34, 211, 238, 0.8)' : 'rgba(255, 255, 255, 0.1)',
        boxShadow: isSelected ? `0 0 50px -10px #22d3ee, 0 20px 50px -10px rgba(0, 0, 0, 0.5)` : '0 20px 50px -10px rgba(0, 0, 0, 0.3)'
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`absolute w-72 bg-eden-card/40 backdrop-blur-2xl border rounded-[24px] p-6 cursor-grab active:cursor-grabbing select-none group shadow-2xl z-20`}
      style={{ left: 0, top: 0 }}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${isSelected ? 'text-eden-accent bg-eden-accent/10 border-eden-accent/30' : 'text-slate-400'} group-hover:text-eden-accent transition-all duration-300`}>
            <Icon size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-eden-accent uppercase tracking-widest mb-0.5">{tag}</span>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{type}</p>
          </div>
        </div>
        {isSelected && (
          <motion.div 
            layoutId="selection-dot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-eden-accent shadow-[0_0_12px_#22d3ee]" 
          />
        )}
      </div>
      
      <h3 className="font-bold text-white text-sm mb-6 leading-tight group-hover:text-eden-accent transition-colors">
        {title}
      </h3>
      
      <div className="flex items-center justify-between pt-5 border-t border-white/5">
         <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-eden-bg bg-slate-800 flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="user" className="w-full h-full object-cover" />
              </div>
            ))}
         </div>
         <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <Zap size={10} className="text-eden-accent" /> Intelligence Active
         </div>
      </div>
    </motion.div>
  );
};

const ContentInspector: React.FC<{ 
  node: NodeData; 
  onClose: () => void; 
  lang: Lang 
}> = ({ node, onClose, lang }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const isEn = lang === 'en';

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const text = customText || input;
    if (!text.trim() || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    const context = `You are an AI assistant helping a user explore their research nodes. 
    Current Node: ${node.title} (${node.type}). 
    Description: ${node.description || 'No description provided'}.`;

    const response = await geminiService.chat(text, context);
    setMessages(prev => [...prev, { role: 'bot', text: response || 'Neural synchronization failure.' }]);
    setIsTyping(false);
  };

  const handleAction = (action: string) => {
    const prompts: Record<string, string> = {
      'Summarize': `Summarize the key points of this ${node.type}: "${node.title}"`,
      'Insights': `What are the most interesting insights or trends related to "${node.title}"?`,
      'Links': `List any relevant external references or links for the topic: "${node.title}"`
    };
    handleSend(prompts[action]);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-eden-bg/80 backdrop-blur-[24px] border-l border-white/10 z-[60] flex flex-col shadow-[-40px_0_100px_rgba(0,0,0,0.8)]"
    >
      {/* Panel Header */}
      <div className="pt-24 p-8 border-b border-white/5 bg-white/5">
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-[20px] bg-eden-accent/10 flex items-center justify-center text-eden-accent border border-eden-accent/20 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <node.icon size={28} />
             </div>
             <div>
                <span className="text-[10px] font-black text-eden-accent uppercase tracking-[0.3em] mb-1 block">{node.tag}</span>
                <h2 className="text-white font-bold text-xl leading-tight">{node.title}</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{node.type}</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
           <button onClick={() => handleAction("Summarize")} className="py-3 bg-white/5 rounded-xl hover:bg-eden-accent/10 hover:border-eden-accent/30 hover:text-eden-accent transition-all flex flex-col items-center gap-2 border border-white/5 group">
             <FileText size={16} className="text-slate-500 group-hover:text-eden-accent transition-colors" />
             <span className="text-[9px] font-black uppercase tracking-widest">{isEn ? 'Summarize' : 'تلخيص'}</span>
           </button>
           <button onClick={() => handleAction("Insights")} className="py-3 bg-white/5 rounded-xl hover:bg-eden-accent/10 hover:border-eden-accent/30 hover:text-eden-accent transition-all flex flex-col items-center gap-2 border border-white/5 group">
             <Sparkles size={16} className="text-slate-500 group-hover:text-eden-accent transition-colors" />
             <span className="text-[9px] font-black uppercase tracking-widest">{isEn ? 'Insights' : 'رؤى'}</span>
           </button>
           <button onClick={() => handleAction("Links")} className="py-3 bg-white/5 rounded-xl hover:bg-eden-accent/10 hover:border-eden-accent/30 hover:text-eden-accent transition-all flex flex-col items-center gap-2 border border-white/5 group">
             <Link2 size={16} className="text-slate-500 group-hover:text-eden-accent transition-colors" />
             <span className="text-[9px] font-black uppercase tracking-widest">{isEn ? 'Links' : 'روابط'}</span>
           </button>
        </div>
      </div>

      {/* AI Chat Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-10 opacity-30">
            <MessageSquare size={48} className="text-eden-accent mb-6" />
            <p className="text-xs font-black uppercase tracking-[0.4em] text-white leading-loose">
              {isEn ? "Talk to your document.\nAsk anything about this content." : "تحدث مع مستندك.\nاسأل أي شيء عن هذا المحتوى."}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-5 rounded-[22px] text-sm leading-relaxed ${
              m.role === 'user' 
              ? 'bg-eden-accent text-eden-bg font-bold rounded-tr-none' 
              : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
             <div className="bg-white/5 border border-white/5 p-5 rounded-[22px] rounded-tl-none flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-eden-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-eden-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-eden-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
      </div>

      {/* Footer Input */}
      <div className="p-8 border-t border-white/5 bg-black/40">
        <div className="relative group">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder={isEn ? "Talk to document..." : "تحدث مع المستند..."} 
            className="w-full bg-white/5 border border-white/10 rounded-[20px] p-5 pr-14 text-sm text-white focus:outline-none focus:border-eden-accent/50 group-hover:border-white/20 transition-all"
          />
          <button 
            onClick={() => handleSend()} 
            className="absolute right-3 top-3 w-11 h-11 bg-eden-accent text-eden-bg rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-glow"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const WorkspaceCanvas: React.FC<{ lang: Lang; setView?: (v: ViewMode) => void }> = ({ lang, setView }) => {
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: '1', title: 'Advanced React Architecture', type: 'Video Course', icon: PlayCircle, tag: 'Module 01', color: 'rgba(34, 211, 238, 0.4)', x: 120, y: 180, description: 'Enterprise-grade React architecture patterns including RSC and server actions.' },
    { id: '2', title: 'Market Research Summary Q4', type: 'Technical PDF', icon: Search, tag: 'Reference', color: 'rgba(255, 255, 255, 0.2)', x: 580, y: 140, description: 'In-depth analysis of Q4 tech trends and competitor benchmarks.' },
    { id: '3', title: 'Neural Roadmap Synthesis', type: 'AI Generation', icon: Sparkles, tag: 'Gemini 3.0', color: 'rgba(168, 85, 247, 0.4)', x: 350, y: 440, description: 'Automated synthesis of research goals generated by Gemini models.' }
  ]);
  const [edges] = useState<EdgeData[]>([
    { id: 'e1', from: '1', to: '2', label: 'Reference' },
    { id: 'e2', from: '1', to: '3', label: 'Synthesis' }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  const handlePositionChange = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.z-20')) return;
    setIsPanning(true);
    lastPanPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPanPos.current.x;
    const dy = e.clientY - lastPanPos.current.y;
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPanPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.min(Math.max(prev * delta, 0.2), 3));
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedId);

  const connectionPaths = useMemo(() => {
    return edges.map(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) return null;

      const x1 = from.x + 144;
      const y1 = from.y + 100;
      const x2 = to.x + 144;
      const y2 = to.y + 100;

      const dx = Math.abs(x1 - x2);
      const isSelected = selectedEdge === edge.id;

      return (
        <g key={edge.id} onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge.id); }}>
          <path
            d={`M ${x1} ${y1} C ${x1 + dx/2} ${y1}, ${x2 - dx/2} ${y2}, ${x2} ${y2}`}
            stroke={isSelected ? "#22d3ee" : "rgba(34, 211, 238, 0.2)"}
            strokeWidth={isSelected ? 3 : 2}
            fill="none"
            className="transition-all cursor-pointer hover:stroke-eden-accent/40"
            filter={isSelected ? "url(#glow)" : ""}
          />
        </g>
      );
    });
  }, [nodes, edges, selectedEdge]);

  return (
    <div 
      className="fixed inset-0 pt-20 overflow-hidden select-none bg-transparent"
      onMouseDown={handlePanStart}
      onMouseMove={handlePanMove}
      onMouseUp={() => setIsPanning(false)}
      onMouseLeave={() => setIsPanning(false)}
      onWheel={handleWheel}
      onClick={() => { setSelectedId(null); setSelectedEdge(null); }}
    >
      {/* 
        NOTE: Background grid is semi-transparent to allow the 
        global 'textured obsidian' overlay from Layout.tsx to 
        be visible through the workspace.
      */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, #22d3ee 1px, transparent 0)`,
          backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Interactive Surface */}
      <motion.div 
        className="w-full h-full relative origin-center"
        animate={{ 
          x: pan.x, 
          y: pan.y, 
          scale: zoom,
          cursor: isPanning ? 'grabbing' : 'default'
        }}
        transition={{ type: 'spring', damping: 40, stiffness: 400 }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {connectionPaths}
        </svg>

        {nodes.map(node => (
          <DraggableNode 
            key={node.id}
            {...node}
            scale={zoom}
            isSelected={selectedId === node.id}
            onSelect={(id) => { setSelectedId(id); setSelectedEdge(null); }}
            onPositionChange={handlePositionChange}
          />
        ))}
      </motion.div>

      {/* Floating Header UI */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-eden-card/40 backdrop-blur-3xl border border-white/10 rounded-[28px] p-2.5 flex items-center justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] pointer-events-auto"
        >
          <div 
            className="flex items-center gap-4 px-5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setView && setView(ViewMode.DASHBOARD)}
          >
            <img src={ASSETS.LOGO} alt="logo" className="w-10 h-10 object-contain" />
            <div className="h-4 w-px bg-white/10"></div>
            <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Research Canvas</h2>
          </div>
          <button className="bg-eden-accent text-eden-bg px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 shadow-glow transition-all">
            <Plus size={14} strokeWidth={3} /> New Node
          </button>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-6 z-50">
         <div className="bg-eden-card/40 backdrop-blur-2xl border border-white/5 rounded-[22px] p-1.5 flex flex-col gap-1 shadow-2xl">
            <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.2, 3)); }} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-eden-accent hover:bg-white/5 rounded-2xl transition-all"><ZoomIn size={20}/></button>
            <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.2, 0.2)); }} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-eden-accent hover:bg-white/5 rounded-2xl transition-all"><ZoomOut size={20}/></button>
            <div className="w-px h-4 bg-white/10 mx-auto my-1"></div>
            <button onClick={(e) => { e.stopPropagation(); setZoom(1); setPan({x:0, y:0}); }} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-eden-accent hover:bg-white/5 rounded-2xl transition-all"><RotateCcw size={20}/></button>
         </div>

         <motion.button 
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-eden-accent text-eden-bg rounded-[26px] flex items-center justify-center shadow-[0_0_40px_-5px_#22d3ee] transition-all relative overflow-hidden group"
          >
            <Sparkles size={30} strokeWidth={2.5} />
          </motion.button>
      </div>

      {/* Neural Inspector Sidebar */}
      <AnimatePresence>
        {selectedNode && (
          <ContentInspector 
            node={selectedNode} 
            onClose={() => setSelectedId(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceCanvas;

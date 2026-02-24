
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Minimize2, BrainCircuit, GraduationCap } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Card, Button } from './UI';

interface AIAssistantProps {
    currentContext: string;
    lang: 'en' | 'ar';
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentContext, lang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isEn = lang === 'en';

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const botResponse = await geminiService.chat(userMsg, currentContext, lang);
            setMessages(prev => [...prev, { role: 'bot', text: botResponse || "Unable to process request." }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'bot',
                text: isEn
                    ? "Connectivity error with Geo Top AI service."
                    : "حدث خطأ في الاتصال بمساعد Geo Top الذكي."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {isOpen && (
                <Card className="w-[350px] sm:w-[400px] h-[500px] mb-4 !p-0 flex flex-col shadow-2xl border-2 border-primary/20 animate-in slide-in-from-bottom-5 duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary p-4 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Geo Top Assistant</h4>
                                <span className="text-[10px] opacity-70 uppercase font-bold">Secure Academic Link</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                            <Minimize2 size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-30">
                                <Bot size={48} className="mb-4 text-primary" />
                                <p className="text-sm font-semibold">
                                    {isEn ? "How can I assist your educational journey today?" : "كيف يمكنني مساعدتك في مسيرتك التعليمية اليوم؟"}
                                </p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${m.role === 'user'
                                        ? 'bg-primary text-white rounded-tr-none shadow-md'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                                    } whitespace-pre-line break-words`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="text-xs text-primary font-bold animate-pulse px-2">{isEn ? "Consulting Geo Top Data..." : "جاري استشارة البيانات..."}</div>}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800">
                        <div className="flex gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isEn ? "Ask a question..." : "اسأل سؤالاً..."}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-all"
                            />
                            <button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-slate-800 text-white' : 'bg-primary text-white hover:scale-110'
                    }`}
            >
                {isOpen ? <X size={24} /> : <GraduationCap size={28} />}
            </button>
        </div>
    );
};

export default AIAssistant;

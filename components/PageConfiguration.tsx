
import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, Transaction } from '../types';
import { Save, Building2, Bell, List, Trash2, FileText, Search, CheckCircle2, Circle, CheckSquare, Square } from 'lucide-react';
import { getFullUniverse, getIdeasWatchlist, saveIdeasWatchlist } from '../services/stockListService';

interface PageConfigurationProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  transactions: Transaction[]; 
  activeBots: Record<string, boolean>;
  onToggleBot: (broker: string) => void;
}

type TabType = 'PAPER' | 'STOCK_BROKERS' | 'IDEAS_WATCHLIST';

export const PageConfiguration: React.FC<PageConfigurationProps> = ({ settings, onSave, transactions, activeBots, onToggleBot }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeSubTab, setActiveSubTab] = useState<TabType>('IDEAS_WATCHLIST');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fullUniverse = useMemo(() => getFullUniverse(), []);

  useEffect(() => {
    setWatchlist(getIdeasWatchlist());
  }, []);

  const handleToggleStock = (sym: string) => {
    const next = watchlist.includes(sym) 
      ? watchlist.filter(s => s !== sym)
      : [...watchlist, sym];
    setWatchlist(next);
    saveIdeasWatchlist(next);
  };

  const handleSelectAll = () => {
    setWatchlist(fullUniverse);
    saveIdeasWatchlist(fullUniverse);
  };

  const handleDeselectAll = () => {
    setWatchlist([]);
    saveIdeasWatchlist([]);
  };

  const filteredUniverse = useMemo(() => {
    if (!searchTerm) return fullUniverse;
    return fullUniverse.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, fullUniverse]);

  const toggleBroker = (broker: any) => {
    setFormData(prev => {
      const isActive = prev.activeBrokers.includes(broker);
      const newBrokers = isActive 
        ? prev.activeBrokers.filter(b => b !== broker)
        : [...prev.activeBrokers, broker];
      return { ...prev, activeBrokers: newBrokers };
    });
  };

  const handleReset = () => {
    if (confirm("WARNING: This will delete ALL data. This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const tabs: {id: TabType, label: string, icon: React.ReactNode}[] = [
      { id: 'IDEAS_WATCHLIST', label: 'Ideas Watch', icon: <List size={16}/> },
      { id: 'PAPER', label: 'Paper & Bot', icon: <FileText size={16}/> },
      { id: 'STOCK_BROKERS', label: 'Brokers', icon: <Building2 size={16}/> },
  ];

  return (
    <div className="p-4 pb-24 animate-fade-in flex flex-col h-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Configuration</h1>
            <button onClick={() => onSave(formData)} className="px-6 py-2 bg-blue-600 rounded-xl text-white text-xs font-black flex items-center gap-2 shadow-xl hover:bg-blue-500 transition-all">
                <Save size={16}/> SAVE
            </button>
        </div>
        
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            {tabs.map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${activeSubTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
            {activeSubTab === 'IDEAS_WATCHLIST' && (
                <div className="space-y-4 animate-slide-up h-full flex flex-col">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex flex-col h-full max-h-[65vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <List size={14}/> Ideas Stock Watch
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={handleSelectAll} className="text-[9px] font-black text-slate-400 hover:text-white uppercase">All</button>
                                <button onClick={handleDeselectAll} className="text-[9px] font-black text-slate-400 hover:text-white uppercase">None</button>
                            </div>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 text-slate-600" size={14} />
                            <input 
                                type="text"
                                placeholder="Search symbol..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-blue-500 outline-none font-mono"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                            {filteredUniverse.map(sym => {
                                const active = watchlist.includes(sym);
                                return (
                                    <button 
                                        key={sym}
                                        onClick={() => handleToggleStock(sym)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${active ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/20 border-slate-800/50 hover:bg-slate-800/50'}`}
                                    >
                                        <span className={`text-xs font-mono font-bold ${active ? 'text-blue-400' : 'text-slate-500'}`}>{sym}</span>
                                        {active ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} className="text-slate-700" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-600 italic px-2">This list defines which stocks the AI Robots scan for the Ideas page.</p>
                </div>
            )}

            {activeSubTab === 'PAPER' && (
                <div className="space-y-8 animate-slide-up">
                    <section className="bg-surface p-6 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Bell size={14}/> Telegram Alerts</h3>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-bold">Bot Token</label>
                            <input type="text" value={formData.telegramBotToken} onChange={(e) => setFormData({...formData, telegramBotToken: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono" placeholder="123456:ABC-..." />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-bold">Chat ID</label>
                            <input type="text" value={formData.telegramChatId} onChange={(e) => setFormData({...formData, telegramChatId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono" placeholder="-100..." />
                        </div>
                    </section>

                    <button onClick={handleReset} className="w-full py-4 rounded-xl text-xs font-bold text-red-400 bg-red-900/10 border border-red-900/30 flex items-center justify-center gap-2 mt-4 hover:bg-red-900/20 transition-all">
                        <Trash2 size={14}/> Factory Reset
                    </button>
                </div>
            )}

            {activeSubTab === 'STOCK_BROKERS' && (
                <div className="space-y-4 animate-slide-up">
                    <div className={`p-5 rounded-2xl border transition-all ${formData.activeBrokers.includes('DHAN') ? 'bg-surface border-purple-500/50 shadow-lg' : 'bg-surface/50 border-slate-800'}`}>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400"><Building2 size={20}/></div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">Dhan</h4>
                                     <p className="text-[10px] text-slate-500 uppercase">Live Integration</p>
                                 </div>
                             </div>
                             <button onClick={() => toggleBroker('DHAN')} className={`w-10 h-5 rounded-full relative transition-colors ${formData.activeBrokers.includes('DHAN') ? 'bg-purple-600' : 'bg-slate-700'}`}>
                                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.activeBrokers.includes('DHAN') ? 'left-5.5' : 'left-0.5'}`}></div>
                             </button>
                         </div>
                    </div>
                    <div className={`p-5 rounded-2xl border transition-all ${formData.activeBrokers.includes('SHOONYA') ? 'bg-surface border-orange-500/50 shadow-lg' : 'bg-surface/50 border-slate-800'}`}>
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <div className="p-2 bg-orange-500/20 rounded-xl text-orange-400"><Building2 size={20}/></div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">Shoonya</h4>
                                     <p className="text-[10px] text-slate-500 uppercase">Zero Brokerage API</p>
                                 </div>
                             </div>
                             <button onClick={() => toggleBroker('SHOONYA')} className={`w-10 h-5 rounded-full relative transition-colors ${formData.activeBrokers.includes('SHOONYA') ? 'bg-orange-600' : 'bg-slate-700'}`}>
                                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.activeBrokers.includes('SHOONYA') ? 'left-5.5' : 'left-0.5'}`}></div>
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

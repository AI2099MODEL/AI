
import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, Transaction } from '../types';
import { Save, Building2, Bell, List, Trash2, FileText, Plus, X, Search, CheckCircle2, Circle } from 'lucide-react';
import { checkAndRefreshStockList, addToWatchlist, removeFromWatchlist, MASTER_STOCK_LIST, updateWatchlist } from '../services/stockListService';

interface PageConfigurationProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  transactions: Transaction[]; 
  activeBots: Record<string, boolean>;
  onToggleBot: (broker: string) => void;
}

type TabType = 'PAPER' | 'STOCK_BROKERS' | 'WATCHLIST';

export const PageConfiguration: React.FC<PageConfigurationProps> = ({ settings, onSave, transactions, activeBots, onToggleBot }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeSubTab, setActiveSubTab] = useState<TabType>('WATCHLIST');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [masterSearch, setMasterSearch] = useState('');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    const list = await checkAndRefreshStockList();
    setWatchlist(list);
  };

  const handleToggleStock = (sym: string) => {
      let newList: string[];
      if (watchlist.includes(sym)) {
          newList = watchlist.filter(s => s !== sym);
      } else {
          newList = [...watchlist, sym];
      }
      setWatchlist(updateWatchlist(newList));
  };

  const handleAddCustomSymbol = () => {
    if (!newSymbol.trim()) return;
    const updated = addToWatchlist(newSymbol.trim());
    setWatchlist(updated);
    setNewSymbol('');
  };

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

  const filteredMasterList = useMemo(() => {
      const query = masterSearch.toLowerCase();
      return MASTER_STOCK_LIST.filter(s => 
          s.symbol.toLowerCase().includes(query) || 
          s.name.toLowerCase().includes(query) ||
          s.sector.toLowerCase().includes(query)
      );
  }, [masterSearch]);

  const tabs: {id: TabType, label: string, icon: React.ReactNode}[] = [
      { id: 'WATCHLIST', label: 'Watchlist', icon: <List size={16}/> },
      { id: 'PAPER', label: 'Bot Config', icon: <FileText size={16}/> },
      { id: 'STOCK_BROKERS', label: 'Brokers', icon: <Building2 size={16}/> },
  ];

  return (
    <div className="p-4 pb-24 animate-fade-in flex flex-col h-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Configuration</h1>
            <button onClick={() => onSave(formData)} className="px-4 py-2 bg-blue-600 rounded-lg text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-blue-500 transition-all">
                <Save size={16}/> Save
            </button>
        </div>
        
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
            {tabs.map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeSubTab === tab.id ? 'bg-blue-600 text-white border border-blue-500/30 shadow-lg shadow-blue-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
            {activeSubTab === 'WATCHLIST' && (
                <div className="space-y-6 animate-slide-up">
                    <section className="bg-surface p-5 rounded-2xl border border-slate-800 flex flex-col h-[60vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Search size={14}/> Selection Universe
                            </h3>
                            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                                {watchlist.length} ACTIVE
                            </span>
                        </div>
                        
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                            <input 
                                type="text" 
                                value={masterSearch}
                                onChange={(e) => setMasterSearch(e.target.value)}
                                placeholder="Search from CSV Universe..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 mb-4">
                            {filteredMasterList.map(stock => {
                                const isSelected = watchlist.includes(stock.symbol);
                                return (
                                    <button 
                                        key={stock.symbol}
                                        onClick={() => handleToggleStock(stock.symbol)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected ? 'bg-blue-600/10 border-blue-600/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected ? <CheckCircle2 size={18} className="text-blue-500" /> : <Circle size={18} className="text-slate-600" />}
                                            <div>
                                                <div className="text-xs font-bold text-white font-mono">{stock.symbol}</div>
                                                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{stock.name}</div>
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-slate-600 uppercase font-bold tracking-tighter px-2 py-0.5 bg-slate-900/50 rounded-full">
                                            {stock.sector}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                             <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Can't find it? Add Custom:</p>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newSymbol}
                                    onChange={(e) => setNewSymbol(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSymbol()}
                                    placeholder="Enter Symbol (e.g. ZOMATO)"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white outline-none"
                                />
                                <button onClick={handleAddCustomSymbol} className="bg-slate-700 hover:bg-slate-600 text-white px-3 rounded-xl transition-all">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {activeSubTab === 'PAPER' && (
                <div className="space-y-8 animate-slide-up">
                    <section className="bg-surface p-6 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Bell size={14}/> Telegram Alerts</h3>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">Bot Token</label>
                            <input type="text" value={formData.telegramBotToken} onChange={(e) => setFormData({...formData, telegramBotToken: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono" placeholder="123456:ABC-..." />
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">Chat ID</label>
                            <input type="text" value={formData.telegramChatId} onChange={(e) => setFormData({...formData, telegramChatId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono" placeholder="-100..." />
                        </div>
                    </section>

                    <button onClick={handleReset} className="w-full py-4 rounded-xl text-xs font-bold text-red-400 bg-red-900/10 border border-red-900/30 flex items-center justify-center gap-2 mt-4 hover:bg-red-900/20 transition-all">
                        <Trash2 size={14}/> Factory Reset App
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
                                     <h4 className="font-bold text-white text-sm">Dhan Broker</h4>
                                     <p className="text-[10px] text-slate-500">Live API Execution</p>
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
                                     <h4 className="font-bold text-white text-sm">Shoonya Broker</h4>
                                     <p className="text-[10px] text-slate-500">Zero-Brokerage API</p>
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

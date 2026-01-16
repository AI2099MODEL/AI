import React, { useState } from 'react';
import { AppSettings, MarketSettings } from '../types';
import { Save, Settings, Wallet, LayoutGrid, Building2, Bell, TrendingUp, Key, Send, Check, Trash2, ArrowLeft, Zap } from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
}

type TabType = 'GENERAL' | 'MARKETS' | 'BROKERS' | 'NOTIFICATIONS';

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSave, onBack }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<TabType>('GENERAL');

  const toggleBroker = (broker: any) => {
    setFormData(prev => {
      const isActive = prev.activeBrokers.includes(broker);
      const newBrokers = isActive 
        ? prev.activeBrokers.filter(b => b !== broker)
        : [...prev.activeBrokers, broker];
      return { ...prev, activeBrokers: newBrokers };
    });
  };

  const toggleMarket = (market: keyof MarketSettings) => {
      setFormData(prev => ({
          ...prev,
          enabledMarkets: {
              ...prev.enabledMarkets,
              [market]: !prev.enabledMarkets[market]
          }
      }));
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSave = () => {
      onSave(formData);
  };

  const tabs: {id: TabType, label: string, icon: React.ReactNode}[] = [
      { id: 'GENERAL', label: 'Capital & Bots', icon: <Wallet size={16}/> },
      { id: 'MARKETS', label: 'Markets', icon: <LayoutGrid size={16}/> },
      { id: 'BROKERS', label: 'Broker Connections', icon: <Building2 size={16}/> },
      { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell size={16}/> },
  ];

  return (
    <div className="flex flex-col md:flex-row h-full bg-background animate-fade-in">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-700 p-4 flex flex-col flex-shrink-0">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft size={18} />
                <span className="text-sm font-bold">Back to Dashboard</span>
            </button>
            
            <div className="flex items-center gap-2 mb-6 px-2">
                <div className="p-2 bg-blue-600 rounded-lg"><Settings size={20} className="text-white"/></div>
                <h2 className="text-lg font-bold text-white">Configuration</h2>
            </div>
            
            <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-auto hidden md:block pt-6 border-t border-slate-800 space-y-3">
                <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all">
                    <Save size={18}/> Save Changes
                </button>
                <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 transition-all">
                    <Trash2 size={16}/> Reset App
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* === GENERAL TAB === */}
                {activeTab === 'GENERAL' && (
                    <div className="space-y-8 animate-slide-up">
                        <section>
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Wallet size={16}/> Paper Trading Capital</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-surface p-4 rounded-xl border border-slate-700">
                                    <label className="block text-xs text-slate-400 mb-2 font-bold">Equity Capital (INR)</label>
                                    <div className="relative">
                                        <TrendingUp size={14} className="absolute left-3 top-3 text-slate-500"/>
                                        <input type="number" value={formData.initialFunds.stock} onChange={(e) => setFormData({...formData, initialFunds: {...formData.initialFunds, stock: parseFloat(e.target.value)}})} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-9 pr-4 text-white focus:border-blue-500 outline-none text-sm font-mono"/>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pt-6 border-t border-slate-700">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Zap size={16}/> Auto-Trade Bot Config</h3>
                            <div className="bg-surface p-6 rounded-xl border border-slate-700">
                                <label className="block text-xs text-slate-400 mb-3 font-bold">Trade Sizing Strategy</label>
                                <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-4">
                                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-blue-400 p-2 bg-slate-900 rounded-lg border border-slate-800 flex-1">
                                        <input type="radio" name="tradeMode" checked={formData.autoTradeConfig?.mode === 'PERCENTAGE'} onChange={() => setFormData({...formData, autoTradeConfig: { mode: 'PERCENTAGE', value: 5 }})} className="accent-blue-500 w-4 h-4" /> 
                                        Percentage of Fund (%)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer hover:text-blue-400 p-2 bg-slate-900 rounded-lg border border-slate-800 flex-1">
                                        <input type="radio" name="tradeMode" checked={formData.autoTradeConfig?.mode === 'FIXED'} onChange={() => setFormData({...formData, autoTradeConfig: { mode: 'FIXED', value: 10000 }})} className="accent-blue-500 w-4 h-4" /> 
                                        Fixed Amount (INR)
                                    </label>
                                </div>
                                
                                <div className="relative">
                                    <input type="number" value={formData.autoTradeConfig?.value || 0} onChange={(e) => setFormData({...formData, autoTradeConfig: { ...formData.autoTradeConfig, value: parseFloat(e.target.value) }})} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-blue-500 outline-none text-lg font-mono"/>
                                    <span className="absolute right-4 top-3 text-slate-500 font-mono">
                                        {formData.autoTradeConfig?.mode === 'PERCENTAGE' ? '%' : 'INR'}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* === MARKETS TAB === */}
                {activeTab === 'MARKETS' && (
                    <div className="space-y-6 animate-slide-up">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2"><LayoutGrid size={16}/> Market Access</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'stocks', label: 'Indian Stocks (NSE)', icon: <TrendingUp size={24} className="text-blue-400"/>, desc: 'Momentum Equity Picks' }
                            ].map((m) => (
                                <button 
                                    key={m.id} 
                                    className={`relative p-5 rounded-xl border text-left transition-all flex items-center justify-between bg-surface border-blue-500/50 shadow-lg shadow-blue-500/10`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg bg-slate-900`}>{m.icon}</div>
                                        <div>
                                            <h4 className="font-bold text-white transition-colors">{m.label}</h4>
                                            <p className="text-xs text-slate-500">{m.desc}</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center`}>
                                        <Check size={14}/>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* === BROKERS TAB === */}
                {activeTab === 'BROKERS' && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Simplified Broker List */}
                        {['DHAN', 'SHOONYA'].map(broker => (
                            <div key={broker} className={`p-5 rounded-xl border transition-all ${formData.activeBrokers.includes(broker) ? 'bg-surface border-blue-500/50' : 'bg-surface/50 border-slate-700'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-900 rounded-lg text-blue-400"><Building2 size={20}/></div>
                                        <h4 className="font-bold text-white">{broker} Connection</h4>
                                    </div>
                                    <button onClick={() => toggleBroker(broker)} className={`w-12 h-6 rounded-full transition-colors relative ${formData.activeBrokers.includes(broker) ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.activeBrokers.includes(broker) ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* === NOTIFICATIONS TAB === */}
                {activeTab === 'NOTIFICATIONS' && (
                    <div className="bg-surface p-6 rounded-xl border border-slate-700 space-y-4">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send size={32} className="text-blue-400"/>
                        </div>
                        <h3 className="text-lg font-bold text-white text-center">Telegram Sync</h3>
                        <div>
                            <label className="block text-xs text-slate-400 mb-2 font-bold uppercase">Bot Token</label>
                            <input type="text" value={formData.telegramBotToken} onChange={(e) => setFormData({...formData, telegramBotToken: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white text-sm focus:border-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-2 font-bold uppercase">Chat ID</label>
                            <input type="text" value={formData.telegramChatId} onChange={(e) => setFormData({...formData, telegramChatId: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white text-sm focus:border-blue-500 outline-none" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
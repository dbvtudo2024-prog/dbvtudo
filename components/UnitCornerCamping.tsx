import React, { useState, useEffect } from 'react';
import { ClubType } from '../types';
import {
  ChevronLeft, Tent, Users, Backpack, Utensils, Calendar, Plus, Trash2, CheckCircle2,
  Check, Edit3, Shield, Sparkles, AlertCircle
} from 'lucide-react';

interface UnitCornerCampingProps {
  club: ClubType;
  onBack?: () => void;
}

export const UnitCornerCamping: React.FC<UnitCornerCampingProps> = ({ club, onBack }) => {
  const isPathfinder = club === ClubType.PATHFINDER;
  const clubPrefix = isPathfinder ? 'DBV' : 'AVT';

  const [activeTab, setActiveTab] = useState<'UNIT' | 'CAMPING' | 'BACKPACK'>('UNIT');

  // Cantinho da Unidade
  const [unitName, setUnitName] = useState(() => localStorage.getItem(`dbv_unit_corner_${clubPrefix}_unit_name`) || '');
  const [counselorName, setCounselorName] = useState(() => localStorage.getItem(`dbv_unit_corner_${clubPrefix}_counselor_name`) || '');
  const [members, setMembers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`dbv_unit_corner_${clubPrefix}_members`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newMemberName, setNewMemberName] = useState('');

  // Acampamento
  const [campName, setCampName] = useState(() => localStorage.getItem(`dbv_unit_corner_${clubPrefix}_camp_name`) || '');
  const [meals, setMeals] = useState<Array<{ day: string; breakfast: string; lunch: string; dinner: string }>>(() => {
    try {
      const saved = localStorage.getItem(`dbv_unit_corner_${clubPrefix}_meals`);
      return saved ? JSON.parse(saved) : [
        { day: 'Sexta', breakfast: 'Lanche Viagem', lunch: 'Almoço no Local', dinner: 'Sopa e Pães' },
        { day: 'Sábado', breakfast: 'Frutas, Pão e Granola', lunch: 'Arroz, Feijão e Saladas', dinner: 'Sanduíche Natural' },
        { day: 'Domingo', breakfast: 'Leite, Café e Frutas', lunch: 'Macarronada de Campo', dinner: 'Encerramento' }
      ];
    } catch { return []; }
  });

  // Mochila
  const [backpackItems, setBackpackItems] = useState<Array<{ id: string; name: string; checked: boolean; category: string }>>(() => {
    try {
      const saved = localStorage.getItem(`dbv_unit_corner_${clubPrefix}_backpack`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: '1', name: 'Bíblia e Lição da Escola Sabatina', checked: false, category: 'Espiritual' },
      { id: '2', name: 'Uniforme Oficial Completo', checked: false, category: 'Uniforme' },
      { id: '3', name: 'Uniforme de Atividades (Camisa do Clube)', checked: false, category: 'Uniforme' },
      { id: '4', name: 'Saco de Dormir / Isolante Térmico', checked: false, category: 'Pernoite' },
      { id: '5', name: 'Lanterna com Pilhas Extras', checked: false, category: 'Utilidades' },
      { id: '6', name: 'Cantil com Água Potável', checked: false, category: 'Saúde' },
      { id: '7', name: 'Kit de Higiene Pessoal', checked: false, category: 'Higiene' },
      { id: '8', name: 'Capa de Chuva / Agasalho', checked: false, category: 'Vestuário' },
      { id: '9', name: 'Repelente e Protetor Solar', checked: false, category: 'Saúde' },
      { id: '10', name: 'Prato, Copo e Talheres Inquebráveis', checked: false, category: 'Alimentação' }
    ];
  });
  const [newBackpackItem, setNewBackpackItem] = useState('');

  // Persistência
  useEffect(() => {
    localStorage.setItem(`dbv_unit_corner_${clubPrefix}_unit_name`, unitName);
  }, [unitName, clubPrefix]);

  useEffect(() => {
    localStorage.setItem(`dbv_unit_corner_${clubPrefix}_counselor_name`, counselorName);
  }, [counselorName, clubPrefix]);

  useEffect(() => {
    localStorage.setItem(`dbv_unit_corner_${clubPrefix}_members`, JSON.stringify(members));
  }, [members, clubPrefix]);

  useEffect(() => {
    localStorage.setItem(`dbv_unit_corner_${clubPrefix}_camp_name`, campName);
  }, [campName, clubPrefix]);

  useEffect(() => {
    localStorage.setItem(`dbv_unit_corner_${clubPrefix}_meals`, JSON.stringify(meals));
  }, [meals, clubPrefix]);

  useEffect(() => {
    localStorage.setItem(`dbv_unit_corner_${clubPrefix}_backpack`, JSON.stringify(backpackItems));
  }, [backpackItems, clubPrefix]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setMembers([...members, newMemberName.trim()]);
    setNewMemberName('');
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleToggleBackpack = (id: string) => {
    setBackpackItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleAddBackpackItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBackpackItem.trim()) return;
    setBackpackItems([
      ...backpackItems,
      { id: Date.now().toString(), name: newBackpackItem.trim(), checked: false, category: 'Geral' }
    ]);
    setNewBackpackItem('');
  };

  const checkedCount = backpackItems.filter(i => i.checked).length;
  const progressPercent = backpackItems.length > 0 ? Math.round((checkedCount / backpackItems.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${isPathfinder ? 'bg-amber-600' : 'bg-red-600'}`}>
              <Tent size={20} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none">
                Cantinho da Unidade & Campo
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                {isPathfinder ? 'Clube de Desbravadores' : 'Clube de Aventureiros'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('UNIT')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'UNIT'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            <span>Unidade</span>
          </button>
          <button
            onClick={() => setActiveTab('CAMPING')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'CAMPING'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Tent size={16} />
            <span>Acampamento</span>
          </button>
          <button
            onClick={() => setActiveTab('BACKPACK')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'BACKPACK'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Backpack size={16} />
            <span>Mochila ({checkedCount}/{backpackItems.length})</span>
          </button>
        </div>

        {/* Tab 1: Cantinho da Unidade */}
        {activeTab === 'UNIT' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users size={18} className="text-amber-500" />
                Dados da Unidade
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Nome da Unidade
                  </label>
                  <input
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="Ex: Águias da Colina"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Conselheiro(a)
                  </label>
                  <input
                    type="text"
                    value={counselorName}
                    onChange={(e) => setCounselorName(e.target.value)}
                    placeholder="Nome do Conselheiro"
                    className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Shield size={18} className="text-amber-500" />
                  Membros da Unidade ({members.length})
                </h2>
              </div>

              <form onSubmit={handleAddMember} className="flex gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Nome do desbravador/aventureiro..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </form>

              {members.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nenhum membro cadastrado nesta unidade ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((name, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-sm font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{name}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Acampamento & Cardápio */}
        {activeTab === 'CAMPING' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Tent size={18} className="text-amber-500" />
                Planejamento do Acampamento
              </h2>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Local / Nome do Acampamento
                </label>
                <input
                  type="text"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="Ex: Acampamento de Instrução Serra Dourada"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Utensils size={18} className="text-amber-500" />
                Cardápio do Campo
              </h2>
              <div className="space-y-3">
                {meals.map((meal, mIdx) => (
                  <div key={mIdx} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {meal.day}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-500">Desjejum:</span>
                        <input
                          type="text"
                          value={meal.breakfast}
                          onChange={(e) => {
                            const newMeals = [...meals];
                            newMeals[mIdx].breakfast = e.target.value;
                            setMeals(newMeals);
                          }}
                          className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">Almoço:</span>
                        <input
                          type="text"
                          value={meal.lunch}
                          onChange={(e) => {
                            const newMeals = [...meals];
                            newMeals[mIdx].lunch = e.target.value;
                            setMeals(newMeals);
                          }}
                          className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-500">Jantar:</span>
                        <input
                          type="text"
                          value={meal.dinner}
                          onChange={(e) => {
                            const newMeals = [...meals];
                            newMeals[mIdx].dinner = e.target.value;
                            setMeals(newMeals);
                          }}
                          className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Mochila & Checklist */}
        {activeTab === 'BACKPACK' && (
          <div className="mt-4 space-y-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Backpack size={18} className="text-amber-500" />
                    Checklist da Mochila
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {checkedCount} de {backpackItems.length} itens prontos ({progressPercent}%)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center font-black text-amber-600 dark:text-amber-400 text-sm">
                  {progressPercent}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <form onSubmit={handleAddBackpackItem} className="flex gap-2">
                <input
                  type="text"
                  value={newBackpackItem}
                  onChange={(e) => setNewBackpackItem(e.target.value)}
                  placeholder="Adicionar item à mochila..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </form>

              <div className="space-y-2">
                {backpackItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleBackpack(item.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                      item.checked
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                        item.checked
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {item.checked && <Check size={14} />}
                      </div>
                      <span className={`text-sm font-bold ${item.checked ? 'line-through opacity-75' : ''}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitCornerCamping;

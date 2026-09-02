
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { ClubType, Category, Especialidade, ClubClass, DesbravaMais, BibleBook, BibleVerse, BibleDictionaryEntry, BibleNote, Devocional, Cultura, UserProfile, CulturaItem, LivroClasse, LivroAno, OutroLivro, ManualDBV, CampingDBV, Formulario, Video as VideoType, VideoCategory, LivroAVT, ManualAVT, AppLink, Conquista, Trunfo } from '../types';
import { 
  fetchCategories, fetchEspecialidades, fetchClasses, fetchDesbravaMais, 
  fetchBibleBooks, fetchBibleVerses, fetchBibleDictionary, fetchDevocionais, 
  createDevocional, updateDevocional, deleteDevocional, fetchUserSpecialties, updateUserSpecialties, 
  fetchCultura, updateCultura, fetchUserProfile, supabase,
  fetchLivrosClasses, fetchLivrosAno, fetchOutrosLivros, fetchManuaisDBV,
  fetchCampingDBV, fetchFormularios, createFormulario, updateFormulario, deleteFormulario,
  fetchVideos, fetchVideoCategories,
  fetchAtividadesJogosDBV, fetchCerimoniasDBV, fetchVideosDBV,
  createVideo, updateVideo, deleteVideo, createVideoCategory, updateVideoCategory, deleteVideoCategory,
  fetchLivrosAVT, fetchManuaisAVT, fetchAppLinks, updateAppLink, deleteAppLink,
  fetchConquistas, updateConquista, deleteConquista,
  fetchTrunfos, updateTrunfo, deleteTrunfo
} from '../services/supabaseService';
import { PROFILE_KEY } from '../constants';
import { MASTERY_RULES } from '../masteryRules';
import { 
  Shield, Award, User, Layers, Sparkles, Home as HomeIcon, Search,
  ChevronRight, ChevronLeft, ChevronDown, Info, Book, Settings, Zap, Music, Flag, Shirt, Globe, Key, FileText, Library, CreditCard, MapPin, Video, Folder, BookOpen, Heart, ArrowUp, ArrowDown,
  Trash2, Plus, Save, Share2, Calendar, X, Image as ImageIcon, Download, ArrowLeft, ExternalLink, Filter, Edit2, Edit3, Check,
  AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, Minus, Trophy
} from 'lucide-react';


const getImageUrl = (url: string | undefined | null) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `https://mda.wiki.br${trimmed}`;
  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return trimmed;
};

const loadImageDataUrl = async (url: string | undefined | null): Promise<string | null> => {
  if (!url || typeof url !== 'string') return null;
  const processedUrl = getImageUrl(url);
  if (!processedUrl) return null;

  try {
    const response = await fetch(processedUrl);
    if (response.ok) {
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            resolve('');
          }
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    // Continua para fallback via Image + Canvas se fetch falhar (CORS)
  }

  return new Promise<string | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 120;
        canvas.height = img.naturalHeight || img.height || 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Erro ao desenhar imagem em canvas para PDF:', err);
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = processedUrl;
  });
};

interface CultureAdminProps {
  culturaData: Cultura | null;
  club: ClubType;
  updateCultura: (data: any) => Promise<{ data: any; error: any }>;
  setCulturaData: React.Dispatch<React.SetStateAction<Cultura | null>>;
  setActiveSubView: (view: any) => void;
  initialTab?: 'IDEALS' | 'ANTHEM' | 'HISTORY' | 'UNIFORMS' | 'EMBLEMS';
}

const normalizeCulturaList = (val: any): CulturaItem[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

const getItemImageSizeClass = (size?: string, isSubitem = false) => {
  if (isSubitem) {
    switch (size) {
      case 'sm':
        return 'w-24 h-24 sm:w-28 sm:h-28';
      case 'md':
      default:
        return 'w-36 h-36 sm:w-44 sm:h-44';
      case 'lg':
        return 'w-48 h-48 sm:w-60 sm:h-60';
      case 'xl':
        return 'w-64 h-64 sm:w-72 sm:h-72';
      case 'full':
        return 'w-full max-w-sm aspect-square sm:aspect-auto';
    }
  } else {
    switch (size) {
      case 'sm':
        return 'w-28 h-28 sm:w-36 sm:h-36';
      case 'md':
      default:
        return 'w-40 h-40 sm:w-52 sm:h-52';
      case 'lg':
        return 'w-56 h-56 sm:w-72 sm:h-72';
      case 'xl':
        return 'w-72 h-72 sm:w-96 sm:h-96';
      case 'full':
        return 'w-full max-w-xl aspect-auto max-h-[480px]';
    }
  }
};

const CultureAdmin: React.FC<CultureAdminProps> = ({ 
  culturaData, 
  club, 
  updateCultura, 
  setCulturaData, 
  setActiveSubView,
  initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'IDEALS' | 'ANTHEM' | 'HISTORY' | 'UNIFORMS' | 'EMBLEMS'>(initialTab || 'IDEALS');
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [localCultura, setLocalCultura] = useState({
    ideais: culturaData?.ideais || '',
    voto: culturaData?.voto || '',
    lei: culturaData?.lei || '',
    alvo: culturaData?.alvo || '',
    lema: culturaData?.lema || '',
    objetivo: culturaData?.objetivo || '',
    voto_biblia: culturaData?.voto_biblia || '',
    hino_letra: culturaData?.hino_letra || '',
    hino_video: culturaData?.hino_video || '',
    historia_mundial: culturaData?.historia_mundial || '',
    historia_america_sul: culturaData?.historia_america_sul || '',
    historia_argentina: culturaData?.historia_argentina || '',
    historia_bolivia: culturaData?.historia_bolivia || '',
    historia_brasil: culturaData?.historia_brasil || '',
    historia_chile: culturaData?.historia_chile || '',
    historia_colombia: culturaData?.historia_colombia || '',
    historia_equador: culturaData?.historia_equador || '',
    historia_peru: culturaData?.historia_peru || '',
    historia_uruguai: culturaData?.historia_uruguai || '',
    uniformes_list: normalizeCulturaList(culturaData?.uniformes_list),
    emblemas_list: normalizeCulturaList(culturaData?.emblemas_list)
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<CulturaItem>>({
    titulo: '',
    titleAlign: 'left',
    subtitulo: '',
    descricao: '',
    imagem: '',
    imagePosition: 'top',
    imageAlign: 'center',
    imageSize: 'md',
    blocks: [],
    club: club,
    parentId: undefined
  });
  const [currentBlockContent, setCurrentBlockContent] = useState('');
  const [currentBlockType, setCurrentBlockType] = useState<'text' | 'image'>('text');

  useEffect(() => {
    setEditingItemId(null);
    setNewItem(prev => ({ ...prev, parentId: undefined, blocks: [] }));
  }, [activeTab]);

  // Sync local state with prop data when it changes (e.g. after a save)
  useEffect(() => {
    setLocalCultura({
      ideais: culturaData?.ideais || '',
      voto: culturaData?.voto || '',
      lei: culturaData?.lei || '',
      alvo: culturaData?.alvo || '',
      lema: culturaData?.lema || '',
      objetivo: culturaData?.objetivo || '',
      voto_biblia: culturaData?.voto_biblia || '',
      hino_letra: culturaData?.hino_letra || '',
      hino_video: culturaData?.hino_video || '',
      historia_mundial: culturaData?.historia_mundial || '',
      historia_america_sul: culturaData?.historia_america_sul || '',
      historia_argentina: culturaData?.historia_argentina || '',
      historia_bolivia: culturaData?.historia_bolivia || '',
      historia_brasil: culturaData?.historia_brasil || '',
      historia_chile: culturaData?.historia_chile || '',
      historia_colombia: culturaData?.historia_colombia || '',
      historia_equador: culturaData?.historia_equador || '',
      historia_peru: culturaData?.historia_peru || '',
      historia_uruguai: culturaData?.historia_uruguai || '',
      uniformes_list: normalizeCulturaList(culturaData?.uniformes_list),
      emblemas_list: normalizeCulturaList(culturaData?.emblemas_list)
    });
  }, [culturaData]);

  const handleItemImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setNewItem(prev => ({ ...prev, imagem: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const findItemTitle = (items: CulturaItem[] | undefined | null, id: string | undefined): string | null => {
    if (!Array.isArray(items) || !id) return null;
    for (const item of items) {
      if (!item) continue;
      if (item.id === id) return item.titulo || 'Item sem título';
      if (Array.isArray(item.subitems) && item.subitems.length > 0) {
        const found = findItemTitle(item.subitems, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleStartEdit = (item: CulturaItem) => {
    setEditingItemId(item.id);
    setNewItem({
      id: item.id,
      titulo: item.titulo || '',
      titleAlign: item.titleAlign || 'left',
      subtitulo: item.subtitulo || '',
      descricao: item.descricao || '',
      imagem: item.imagem || '',
      imagePosition: item.imagePosition || 'top',
      imageAlign: item.imageAlign || 'center',
      imageSize: item.imageSize || 'md',
      blocks: Array.isArray(item.blocks) ? [...item.blocks] : [],
      club: item.club || club,
      parentId: item.parentId
    });
    setTimeout(() => {
      document.getElementById('admin-item-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setNewItem({
      titulo: '',
      titleAlign: 'left',
      subtitulo: '',
      descricao: '',
      imagem: '',
      imagePosition: 'top',
      imageAlign: 'center',
      imageSize: 'md',
      blocks: [],
      club: club,
      parentId: undefined
    });
  };

  const renderAdminItemList = (items: CulturaItem[] | undefined | null, type: 'UNIFORMS' | 'EMBLEMS', depth = 0) => {
    if (!Array.isArray(items)) return null;
    return items.filter(Boolean).map((item) => (
      <div key={item.id || Math.random().toString()} className="space-y-2">
        <div className={`flex items-center justify-between p-4 bg-white dark:bg-slate-800 border ${editingItemId === item.id ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-100 dark:border-slate-700'} rounded-2xl shadow-sm transition-all hover:border-indigo-200 ${depth > 0 ? 'ml-8' : ''}`}>
          <div className="flex items-center space-x-4">
            <div className="relative">
              {item.imagem ? (
                <img src={item.imagem} alt={item.titulo || 'Item'} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-700" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
                  <ImageIcon size={20} />
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-slate-800">
                {depth + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{item.titulo || 'Sem título'}</p>
                {item.club && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${item.club === ClubType.PATHFINDER ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}>
                    {item.club === ClubType.PATHFINDER ? 'DBV' : 'AVT'}
                  </span>
                )}
                {editingItemId === item.id && (
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white uppercase tracking-wider animate-pulse">
                    Editando
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-tight truncate">
                {item.subitems?.length || 0} sub-itens • {((item.descricao || '').length > 30 ? (item.descricao || '').substring(0, 30) + '...' : (item.descricao || 'Sem descrição'))}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => handleStartEdit(item)}
              className="p-2.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
              title="Editar Item"
            >
              <Edit2 size={18} />
            </button>
            <button 
              onClick={() => {
                setEditingItemId(null);
                setNewItem({ ...newItem, parentId: item.id });
                document.getElementById('admin-item-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-2.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
              title="Adicionar Sub-item"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => removeItem(type, item.id)}
              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
              title="Excluir Item"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
        {Array.isArray(item.subitems) && item.subitems.length > 0 && (
          <div className="space-y-2">
            {renderAdminItemList(item.subitems, type, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const UNIFORM_TEMPLATES = club === ClubType.PATHFINDER ? [
    "Uniforme de Gala",
    "Lenços e Prendedores",
    "Cobertura",
    "Cinto",
    "Calçados e Meias",
    "Torçal",
    "Platina ou Galão",
    "Uniforme de Diretores e Associados",
    "Uniforme do Clube de Líderes"
  ] : [
    "Uniforme de Gala",
    "Lenço e Prendedor",
    "Cobertura (Boné)",
    "Cinto e Calçados",
    "Uniforme de Atividades",
    "Uniforme de Líder"
  ];

  const EMBLEM_TEMPLATES = club === ClubType.PATHFINDER ? [
    "Emblemas",
    "Insígnias e Tiras",
    "Distintivos",
    "Bandeira Oficial",
    "Bandeirim"
  ] : [
    "Emblemas",
    "Insígnias",
    "Bandeira Oficial Aventureiros",
    "Bandeirim de Unidade"
  ];

  const addTemplateItem = (type: 'UNIFORMS' | 'EMBLEMS', title: string) => {
    const listKey = type === 'UNIFORMS' ? 'uniformes_list' : 'emblemas_list';
    const existing = (localCultura as any)[listKey] || [];
    
    if (existing.some((i: any) => i.titulo === title)) {
      alert("Este item já existe na lista.");
      return;
    }

    const item: CulturaItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      titulo: title,
      descricao: `Informações detalhadas sobre ${title.toLowerCase()}...`,
      club: club,
      subitems: []
    };

    setLocalCultura(prev => ({
      ...prev,
      [listKey]: [...(prev as any)[listKey], item]
    }));
  };

  const handleBlockImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      addBlock('image', base64String);
    };
    reader.readAsDataURL(file);
  };

  const addBlock = (type: 'text' | 'image', content: string) => {
    if (!content) return;
    const newBlock = {
      id: Date.now().toString(),
      type,
      content
    };
    setNewItem(prev => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock]
    }));
    if (type === 'text') setCurrentBlockContent('');
  };

  const removeBlock = (id: string) => {
    setNewItem(prev => ({
      ...prev,
      blocks: (prev.blocks || []).filter(b => b.id !== id)
    }));
  };

  const addItem = (type: 'UNIFORMS' | 'EMBLEMS') => {
    if (!newItem.titulo) {
      alert("O título é obrigatório.");
      return;
    }

    const item: CulturaItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      titulo: newItem.titulo!,
      titleAlign: newItem.titleAlign || 'left',
      subtitulo: newItem.subtitulo,
      descricao: newItem.descricao || '',
      imagem: newItem.imagem,
      imagePosition: newItem.imagePosition || 'top',
      imageAlign: newItem.imageAlign || 'center',
      imageSize: newItem.imageSize || 'md',
      blocks: newItem.blocks || [],
      club: newItem.club || club,
      subitems: []
    };

    const listKey = type === 'UNIFORMS' ? 'uniformes_list' : 'emblemas_list';
    
    if (newItem.parentId) {
      // Recursive function to add subitem
      const addSubItemRecursive = (items: CulturaItem[]): CulturaItem[] => {
        return items.map(i => {
          if (i.id === newItem.parentId) {
            return { ...i, subitems: [...(i.subitems || []), item] };
          }
          if (i.subitems && i.subitems.length > 0) {
            return { ...i, subitems: addSubItemRecursive(i.subitems) };
          }
          return i;
        });
      };

      setLocalCultura(prev => ({
        ...prev,
        [listKey]: addSubItemRecursive((prev as any)[listKey])
      }));
    } else {
      setLocalCultura(prev => ({
        ...prev,
        [listKey]: [...(prev as any)[listKey], item]
      }));
    }

    setNewItem({ titulo: '', titleAlign: 'left', subtitulo: '', descricao: '', imagem: '', imagePosition: 'top', imageAlign: 'center', imageSize: 'md', blocks: [], club: club, parentId: undefined });
  };

  const saveItemEdit = (type: 'UNIFORMS' | 'EMBLEMS') => {
    if (!newItem.titulo) {
      alert("O título é obrigatório.");
      return;
    }

    const listKey = type === 'UNIFORMS' ? 'uniformes_list' : 'emblemas_list';

    const updateItemRecursive = (items: CulturaItem[]): CulturaItem[] => {
      return items.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            titulo: newItem.titulo!,
            titleAlign: newItem.titleAlign || 'left',
            subtitulo: newItem.subtitulo,
            descricao: newItem.descricao || '',
            imagem: newItem.imagem,
            imagePosition: newItem.imagePosition || 'top',
            imageAlign: newItem.imageAlign || 'center',
            imageSize: newItem.imageSize || 'md',
            blocks: newItem.blocks || [],
            club: newItem.club || club
          };
        }
        if (item.subitems && item.subitems.length > 0) {
          return {
            ...item,
            subitems: updateItemRecursive(item.subitems)
          };
        }
        return item;
      });
    };

    setLocalCultura(prev => ({
      ...prev,
      [listKey]: updateItemRecursive((prev as any)[listKey] || [])
    }));

    setEditingItemId(null);
    setNewItem({ titulo: '', titleAlign: 'left', subtitulo: '', descricao: '', imagem: '', imagePosition: 'top', imageAlign: 'center', imageSize: 'md', blocks: [], club: club, parentId: undefined });
  };

  const removeItem = (type: 'UNIFORMS' | 'EMBLEMS', id: string) => {
    const listKey = type === 'UNIFORMS' ? 'uniformes_list' : 'emblemas_list';
    
    // Recursive function to remove item
    const removeItemRecursive = (items: CulturaItem[]): CulturaItem[] => {
      return items
        .filter(item => item.id !== id)
        .map(item => ({
          ...item,
          subitems: item.subitems ? removeItemRecursive(item.subitems) : []
        }));
    };

    setLocalCultura(prev => ({
      ...prev,
      [listKey]: removeItemRecursive((prev as any)[listKey])
    }));
  };

  const handleHistoryImageUpload = (file: File, fieldId: string) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLocalCultura(prev => ({ ...prev, [`${fieldId}_img`]: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const clubType = club === ClubType.PATHFINDER ? 'PATHFINDER' : 'ADVENTURER';
    
    const payload: any = {
      club_type: clubType,
      ...localCultura
    };

    // Include ID if we have it to ensure we update the correct row
    if (culturaData?.id && culturaData.id > 0) {
      payload.id = culturaData.id;
    }

    console.log("Saving culture with payload:", payload);

    const { data, error } = await updateCultura(payload);
    
    if (!error) {
      if (data) {
        setCulturaData(data);
      } else {
        setCulturaData(prev => prev ? { ...prev, ...localCultura } : { id: 0, club_type: clubType, ...localCultura } as Cultura);
      }
      alert("Cultura atualizada com sucesso!");
    } else {
      console.error("Erro ao salvar cultura:", error);
      alert(`Erro ao salvar cultura: ${error.message || "Erro desconhecido"}`);
    }
    setIsSaving(false);
  };

  const tabs = [
    { id: 'IDEALS', label: 'Ideais', icon: <Sparkles size={18} /> },
    { id: 'ANTHEM', label: 'Hino', icon: <Music size={18} /> },
    { id: 'HISTORY', label: 'História', icon: <Globe size={18} /> },
    { id: 'UNIFORMS', label: 'Uniformes', icon: <Shirt size={18} /> },
    { id: 'EMBLEMS', label: 'Emblemas', icon: <Shield size={18} /> }
  ];

  return (
    <div className="animate-slide-in space-y-6 pt-4 pb-28">
      {/* Tab Bar */}
      <div className="flex overflow-x-auto scrollbar-hide space-x-2 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl whitespace-nowrap font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-300 border border-slate-100 dark:border-slate-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'IDEALS' && (
            <div className="space-y-6">
              {[
                { id: 'voto', label: 'Voto' },
                { id: 'lei', label: 'Lei' },
                { id: 'alvo', label: 'Alvo' },
                { id: 'lema', label: 'Lema' },
                { id: 'objetivo', label: 'Objetivo' },
                { id: 'voto_biblia', label: 'Voto à Bíblia' }
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                  <textarea 
                    value={(localCultura as any)[field.id] || ''}
                    onChange={(e) => setLocalCultura({...localCultura, [field.id]: e.target.value})}
                    placeholder={`Digite o ${field.label.toLowerCase()}...`}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px]"
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ANTHEM' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Letra do Hino</label>
                <textarea 
                  value={localCultura.hino_letra || ''}
                  onChange={(e) => setLocalCultura({...localCultura, hino_letra: e.target.value})}
                  placeholder="Digite a letra do hino..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[200px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Link do Vídeo (YouTube ou Supabase)</label>
                <input 
                  type="text" 
                  value={localCultura.hino_video || ''}
                  onChange={(e) => setLocalCultura({...localCultura, hino_video: e.target.value})}
                  placeholder="Link do YouTube ou Supabase Storage"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-6">
              {[
                { id: 'historia_mundial', label: 'História Mundial' },
                { id: 'historia_america_sul', label: 'História América do Sul' },
                { id: 'historia_argentina', label: 'História Argentina' },
                { id: 'historia_bolivia', label: 'História Bolívia' },
                { id: 'historia_brasil', label: 'História Brasil' },
                { id: 'historia_chile', label: 'História Chile' },
                { id: 'historia_colombia', label: 'História Colômbia' },
                { id: 'historia_equador', label: 'História Equador' },
                { id: 'historia_peru', label: 'História Peru' },
                { id: 'historia_uruguai', label: 'História Uruguai' }
              ].map((field) => (
                <div key={field.id} className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/60 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                  
                  <textarea 
                    value={(localCultura as any)[field.id] || ''}
                    onChange={(e) => setLocalCultura({...localCultura, [field.id]: e.target.value})}
                    placeholder={`Digite a ${field.label.toLowerCase()}...`}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[150px] shadow-sm"
                  />

                  <div className="flex items-center space-x-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="relative w-24 h-24 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex items-center justify-center group cursor-pointer shrink-0">
                      {(localCultura as any)[`${field.id}_img`] ? (
                        <>
                          <img 
                            src={(localCultura as any)[`${field.id}_img`]} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white" size={24} />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <Plus className="text-slate-300 dark:text-slate-500 group-hover:text-indigo-500 transition-colors mx-auto mb-1" size={24} />
                          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Adicionar<br/>Imagem</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleHistoryImageUpload(file, field.id);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-700 dark:text-white uppercase tracking-tight">Imagem da {field.label}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-400 font-medium leading-tight">Escolha uma imagem representativa para ser exibida nos detalhes da história.</p>
                      {(localCultura as any)[`${field.id}_img`] && (
                        <button 
                          onClick={() => setLocalCultura(prev => ({ ...prev, [`${field.id}_img`]: '' }))}
                          className="text-[9px] text-red-500 hover:text-red-600 font-black uppercase mt-2 active:scale-95 transition-all"
                        >
                          Remover Imagem
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'UNIFORMS' && (
            <div className="space-y-8">
              {/* Templates Suggestions */}
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-3xl p-6 border border-amber-100 dark:border-amber-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest flex items-center space-x-2">
                    <Zap size={14} />
                    <span>Sugestões de Uniformes</span>
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {UNIFORM_TEMPLATES.map((template) => (
                    <button 
                      key={template}
                      onClick={() => addTemplateItem('UNIFORMS', template)}
                      className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/80 px-3 py-2 rounded-xl text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shadow-sm"
                    >
                      + {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form to add/edit item */}
              <div id="admin-item-form" className={`bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border ${editingItemId ? 'border-amber-400 dark:border-amber-600/60 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700/60'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest flex items-center space-x-2">
                    {editingItemId ? (
                      <Edit2 size={16} className="text-amber-500" />
                    ) : (
                      <Plus size={16} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>{editingItemId ? 'Editar Item de Uniforme' : (newItem.parentId ? 'Adicionar Sub-item de Uniforme' : 'Adicionar Novo Item de Uniforme')}</span>
                  </h4>
                  {editingItemId && (
                    <button 
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {newItem.parentId && !editingItemId && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">
                      Pai: {findItemTitle(localCultura.uniformes_list, newItem.parentId) || 'Item selecionado'}
                    </span>
                    <button onClick={() => setNewItem({ ...newItem, parentId: undefined })} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                      <X size={14} />
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Destino do Conteúdo</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                      <button 
                        disabled={!!newItem.parentId}
                        onClick={() => setNewItem({...newItem, club: ClubType.PATHFINDER})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${newItem.club === ClubType.PATHFINDER ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-400 dark:text-slate-400'} ${newItem.parentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Desbravadores
                      </button>
                      <button 
                        disabled={!!newItem.parentId}
                        onClick={() => setNewItem({...newItem, club: ClubType.ADVENTURER})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${newItem.club === ClubType.ADVENTURER ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-400 dark:text-slate-400'} ${newItem.parentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Aventureiros
                      </button>
                    </div>
                    {newItem.parentId && <p className="text-[9px] text-indigo-400 font-bold uppercase ml-1">* Sub-itens herdam o clube do item pai</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Título do Item</label>
                      {/* Orientação do Título (Esquerda, Centro, Direita) */}
                      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, titleAlign: 'left' })}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            (newItem.titleAlign || 'left') === 'left'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                          title="Título à Esquerda"
                        >
                          <AlignLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, titleAlign: 'center' })}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            (newItem.titleAlign || 'left') === 'center'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                          title="Título ao Centro"
                        >
                          <AlignCenter size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, titleAlign: 'right' })}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            (newItem.titleAlign || 'left') === 'right'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                          title="Título à Direita"
                        >
                          <AlignRight size={14} />
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text"
                      value={newItem.titulo || ''}
                      onChange={(e) => setNewItem({...newItem, titulo: e.target.value})}
                      placeholder="Ex: Uniforme de Gala"
                      className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm ${
                        (newItem.titleAlign || 'left') === 'center' ? 'text-center' : (newItem.titleAlign || 'left') === 'right' ? 'text-right' : 'text-left'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Subtítulo ou Contexto (Opcional)</label>
                    <input 
                      type="text"
                      value={newItem.subtitulo || ''}
                      onChange={(e) => setNewItem({...newItem, subtitulo: e.target.value})}
                      placeholder="Ex: Admissão em Lenço"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>

                  {/* Imagem Principal & Alinhamento (Entre o Título e o Texto Principal) */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest ml-1 block">Imagem Principal</label>
                    
                    {newItem.imagem ? (
                      <div className="flex items-center space-x-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <img src={getImageUrl(newItem.imagem)} alt="Preview" className="w-16 h-16 rounded-xl object-contain bg-slate-50 dark:bg-slate-900 p-1 border border-slate-100 dark:border-slate-700" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">Imagem Carregada</p>
                          <p className="text-[10px] text-slate-400">Pronta para exibição</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagem: '' })}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                          title="Remover imagem"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleItemImageUpload(file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-center space-x-2 text-indigo-500 hover:border-indigo-400 transition-all cursor-pointer">
                            <ImageIcon size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Carregar Imagem do Dispositivo</span>
                          </div>
                        </div>
                        <input 
                          type="text"
                          value={newItem.imagem || ''}
                          onChange={(e) => setNewItem({ ...newItem, imagem: e.target.value })}
                          placeholder="Ou cole a URL da imagem (https://...)"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400"
                        />
                      </div>
                    )}

                    {/* Orientação / Posição da Imagem (Topo, Centro, Abaixo) */}
                    <div className="pt-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1 block">
                        Orientação / Posição da Imagem
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagePosition: 'top' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imagePosition || 'top') === 'top'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <ArrowUp size={15} />
                          <span>Topo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagePosition: 'center' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imagePosition || 'top') === 'center'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignCenter size={15} />
                          <span>Centro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagePosition: 'bottom' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imagePosition || 'top') === 'bottom'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <ArrowDown size={15} />
                          <span>Abaixo</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold px-1">
                        {(newItem.imagePosition || 'top') === 'top' && '➔ Imagem posicionada no TOPO (antes do texto explicativo)'}
                        {(newItem.imagePosition || 'top') === 'center' && '➔ Imagem posicionada no CENTRO / LADO A LADO com o texto'}
                        {(newItem.imagePosition || 'top') === 'bottom' && '➔ Imagem posicionada ABAIXO (depois do texto explicativo)'}
                      </p>
                    </div>

                    {/* Alinhamento Horizontal da Imagem */}
                    <div className="pt-2 space-y-2 border-t border-slate-200/60 dark:border-slate-800">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1 block">
                        Alinhamento Horizontal da Imagem
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imageAlign: 'left' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imageAlign || 'center') === 'left'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignLeft size={16} />
                          <span>Esquerda</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imageAlign: 'center' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imageAlign || 'center') === 'center'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignCenter size={16} />
                          <span>Centro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imageAlign: 'right' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imageAlign || 'center') === 'right'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignRight size={16} />
                          <span>Direita</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold px-1">
                        {(newItem.imageAlign || 'center') === 'right' && '➔ Imagem alinhada à direita'}
                        {(newItem.imageAlign || 'center') === 'left' && '➔ Imagem alinhada à esquerda'}
                        {(newItem.imageAlign || 'center') === 'center' && '➔ Imagem centralizada'}
                      </p>
                    </div>

                    {/* Tamanho da Imagem (Aumentar / Diminuir) */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest ml-1 block">
                          Tamanho da Imagem
                        </label>
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];
                              const cur = newItem.imageSize || 'md';
                              const idx = sizes.indexOf(cur as any);
                              if (idx > 0) setNewItem({ ...newItem, imageSize: sizes[idx - 1] });
                            }}
                            disabled={(newItem.imageSize || 'md') === 'sm'}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-all flex items-center justify-center"
                            title="Diminuir Imagem (-)"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 min-w-[72px] text-center uppercase tracking-tight">
                            {(newItem.imageSize || 'md') === 'sm' && 'Pequena'}
                            {(newItem.imageSize || 'md') === 'md' && 'Média'}
                            {(newItem.imageSize || 'md') === 'lg' && 'Grande'}
                            {(newItem.imageSize || 'md') === 'xl' && 'Extra G'}
                            {(newItem.imageSize || 'md') === 'full' && '100% (Max)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];
                              const cur = newItem.imageSize || 'md';
                              const idx = sizes.indexOf(cur as any);
                              if (idx < sizes.length - 1) setNewItem({ ...newItem, imageSize: sizes[idx + 1] });
                            }}
                            disabled={(newItem.imageSize || 'md') === 'full'}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-all flex items-center justify-center"
                            title="Aumentar Imagem (+)"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: 'sm', label: 'Pequena', sub: 'P' },
                          { id: 'md', label: 'Média', sub: 'M' },
                          { id: 'lg', label: 'Grande', sub: 'G' },
                          { id: 'xl', label: 'Extra G', sub: 'GG' },
                          { id: 'full', label: '100%', sub: 'Max' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setNewItem({ ...newItem, imageSize: s.id as any })}
                            className={`py-2 px-1 rounded-xl text-center transition-all border ${
                              (newItem.imageSize || 'md') === s.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="block text-xs font-black leading-tight">{s.sub}</span>
                            <span className="block text-[8px] font-medium opacity-80 mt-0.5">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Texto Principal / Descrição</label>
                    <textarea 
                      value={newItem.descricao || ''}
                      onChange={(e) => setNewItem({...newItem, descricao: e.target.value})}
                      placeholder="Digite o texto principal explicativo deste uniforme..."
                      rows={4}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm resize-y"
                    />
                  </div>

                  <div className="space-y-4 border-2 border-indigo-50 dark:border-indigo-950/60 p-4 rounded-3xl bg-indigo-50/30 dark:bg-indigo-950/20">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Construtor de Blocos Extras (Opcional)</label>
                    
                    {/* Lista de Blocos Atuais */}
                    <div className="space-y-3">
                      {newItem.blocks && newItem.blocks.length > 0 ? (
                        newItem.blocks.map((block, idx) => (
                          <div key={block.id} className="relative group bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <button 
                              onClick={() => removeBlock(block.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X size={12} />
                            </button>
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-300 shrink-0">
                                {idx + 1}
                              </div>
                              {block.type === 'text' ? (
                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{block.content}</p>
                              ) : (
                                <img src={block.content} alt="" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic text-center py-4">Nenhum bloco adicional adicionado.</p>
                      )}
                    </div>

                    {/* Controles para Adicionar */}
                    <div className="space-y-3 pt-4 border-t border-indigo-100 dark:border-indigo-900/50">
                      <div className="flex space-x-2">
                        <textarea 
                          value={currentBlockContent}
                          onChange={(e) => setCurrentBlockContent(e.target.value)}
                          placeholder="Digite um bloco extra de texto..."
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm min-h-[60px]"
                        />
                        <button 
                          onClick={() => addBlock('text', currentBlockContent)}
                          className="px-4 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-2xl font-black text-[10px] uppercase tracking-tighter hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-all shrink-0"
                        >
                          + Texto
                        </button>
                      </div>

                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBlockImageUpload(file);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-center space-x-2 text-indigo-400 group-hover:border-indigo-400 transition-all">
                          <ImageIcon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Imagem Extra</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-indigo-400 font-medium italic">* Adicione blocos complementares caso precise de mais imagens ou parágrafos.</p>
                  </div>
                </div>

                {editingItemId ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => saveItemEdit('UNIFORMS')}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      <Check size={16} />
                      <span>Salvar Alterações no Item</span>
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="px-5 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addItem('UNIFORMS')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md active:scale-95 transition-all"
                  >
                    Adicionar à Lista
                  </button>
                )}
              </div>

              {/* List of added items */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Itens Adicionados</h4>
                {(!Array.isArray(localCultura.uniformes_list) || localCultura.uniformes_list.length === 0) ? (
                  <p className="text-center py-8 text-slate-300 dark:text-slate-600 italic text-xs">Nenhum item adicionado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {renderAdminItemList(localCultura.uniformes_list, 'UNIFORMS')}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'EMBLEMS' && (
            <div className="space-y-8">
              {/* Templates Suggestions */}
              <div className="bg-red-50 dark:bg-red-950/30 rounded-3xl p-6 border border-red-100 dark:border-red-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-red-700 dark:text-red-300 uppercase tracking-widest flex items-center space-x-2">
                    <Zap size={14} />
                    <span>Sugestões de Emblemas</span>
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EMBLEM_TEMPLATES.map((template) => (
                    <button 
                      key={template}
                      onClick={() => addTemplateItem('EMBLEMS', template)}
                      className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/80 px-3 py-2 rounded-xl text-[10px] font-bold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm"
                    >
                      + {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form to add/edit item */}
              <div id="admin-item-form" className={`bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border ${editingItemId ? 'border-amber-400 dark:border-amber-600/60 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700/60'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest flex items-center space-x-2">
                    {editingItemId ? (
                      <Edit2 size={16} className="text-amber-500" />
                    ) : (
                      <Plus size={16} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                    <span>{editingItemId ? 'Editar Item de Emblema' : (newItem.parentId ? 'Adicionar Sub-item de Emblema' : 'Adicionar Novo Item de Emblema')}</span>
                  </h4>
                  {editingItemId && (
                    <button 
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 transition-all"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {newItem.parentId && !editingItemId && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest">
                      Pai: {findItemTitle(localCultura.emblemas_list, newItem.parentId) || findItemTitle(localCultura.uniformes_list, newItem.parentId) || 'Item selecionado'}
                    </span>
                    <button onClick={() => setNewItem({ ...newItem, parentId: undefined })} className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200">
                      <X size={14} />
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Destino do Conteúdo</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                      <button 
                        disabled={!!newItem.parentId}
                        onClick={() => setNewItem({...newItem, club: ClubType.PATHFINDER})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${newItem.club === ClubType.PATHFINDER ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-400 dark:text-slate-400'} ${newItem.parentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Desbravadores
                      </button>
                      <button 
                        disabled={!!newItem.parentId}
                        onClick={() => setNewItem({...newItem, club: ClubType.ADVENTURER})}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${newItem.club === ClubType.ADVENTURER ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-400 dark:text-slate-400'} ${newItem.parentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Aventureiros
                      </button>
                    </div>
                    {newItem.parentId && <p className="text-[9px] text-indigo-400 font-bold uppercase ml-1">* Sub-itens herdam o clube do item pai</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Título do Emblema</label>
                      {/* Orientação do Título (Esquerda, Centro, Direita) */}
                      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, titleAlign: 'left' })}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            (newItem.titleAlign || 'left') === 'left'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                          title="Título à Esquerda"
                        >
                          <AlignLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, titleAlign: 'center' })}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            (newItem.titleAlign || 'left') === 'center'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                          title="Título ao Centro"
                        >
                          <AlignCenter size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, titleAlign: 'right' })}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            (newItem.titleAlign || 'left') === 'right'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                          }`}
                          title="Título à Direita"
                        >
                          <AlignRight size={14} />
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text"
                      value={newItem.titulo || ''}
                      onChange={(e) => setNewItem({...newItem, titulo: e.target.value})}
                      placeholder="Ex: Emblema D1"
                      className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm ${
                        (newItem.titleAlign || 'left') === 'center' ? 'text-center' : (newItem.titleAlign || 'left') === 'right' ? 'text-right' : 'text-left'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Subtítulo ou Significado Curto (Opcional)</label>
                    <input 
                      type="text"
                      value={newItem.subtitulo || ''}
                      onChange={(e) => setNewItem({...newItem, subtitulo: e.target.value})}
                      placeholder="Ex: Representa o triângulo invertido"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                    />
                  </div>

                  {/* Imagem do Emblema & Alinhamento (Entre o Título e o Texto Principal) */}
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest ml-1 block">Imagem do Emblema</label>
                    
                    {newItem.imagem ? (
                      <div className="flex items-center space-x-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <img src={getImageUrl(newItem.imagem)} alt="Preview" className="w-16 h-16 rounded-xl object-contain bg-slate-50 dark:bg-slate-900 p-1 border border-slate-100 dark:border-slate-700" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">Imagem Carregada</p>
                          <p className="text-[10px] text-slate-400">Pronta para exibição</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagem: '' })}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all"
                          title="Remover imagem"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleItemImageUpload(file);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-center space-x-2 text-indigo-500 hover:border-indigo-400 transition-all cursor-pointer">
                            <ImageIcon size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Carregar Imagem do Dispositivo</span>
                          </div>
                        </div>
                        <input 
                          type="text"
                          value={newItem.imagem || ''}
                          onChange={(e) => setNewItem({ ...newItem, imagem: e.target.value })}
                          placeholder="Ou cole a URL da imagem (https://...)"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-white placeholder:text-slate-400"
                        />
                      </div>
                    )}

                    {/* Orientação / Posição da Imagem (Topo, Centro, Abaixo) */}
                    <div className="pt-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1 block">
                        Orientação / Posição da Imagem
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagePosition: 'top' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imagePosition || 'top') === 'top'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <ArrowUp size={15} />
                          <span>Topo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagePosition: 'center' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imagePosition || 'top') === 'center'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignCenter size={15} />
                          <span>Centro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imagePosition: 'bottom' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imagePosition || 'top') === 'bottom'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <ArrowDown size={15} />
                          <span>Abaixo</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold px-1">
                        {(newItem.imagePosition || 'top') === 'top' && '➔ Imagem posicionada no TOPO (antes do texto explicativo)'}
                        {(newItem.imagePosition || 'top') === 'center' && '➔ Imagem posicionada no CENTRO / LADO A LADO com o texto'}
                        {(newItem.imagePosition || 'top') === 'bottom' && '➔ Imagem posicionada ABAIXO (depois do texto explicativo)'}
                      </p>
                    </div>

                    {/* Alinhamento Horizontal da Imagem */}
                    <div className="pt-2 space-y-2 border-t border-slate-200/60 dark:border-slate-800">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1 block">
                        Alinhamento Horizontal da Imagem
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imageAlign: 'left' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imageAlign || 'center') === 'left'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignLeft size={16} />
                          <span>Esquerda</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imageAlign: 'center' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imageAlign || 'center') === 'center'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignCenter size={16} />
                          <span>Centro</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imageAlign: 'right' })}
                          className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all border ${
                            (newItem.imageAlign || 'center') === 'right'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <AlignRight size={16} />
                          <span>Direita</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold px-1">
                        {(newItem.imageAlign || 'center') === 'right' && '➔ Imagem alinhada à direita'}
                        {(newItem.imageAlign || 'center') === 'left' && '➔ Imagem alinhada à esquerda'}
                        {(newItem.imageAlign || 'center') === 'center' && '➔ Imagem centralizada'}
                      </p>
                    </div>

                    {/* Tamanho da Imagem (Aumentar / Diminuir) */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest ml-1 block">
                          Tamanho da Imagem
                        </label>
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];
                              const cur = newItem.imageSize || 'md';
                              const idx = sizes.indexOf(cur as any);
                              if (idx > 0) setNewItem({ ...newItem, imageSize: sizes[idx - 1] });
                            }}
                            disabled={(newItem.imageSize || 'md') === 'sm'}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-all flex items-center justify-center"
                            title="Diminuir Imagem (-)"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 min-w-[72px] text-center uppercase tracking-tight">
                            {(newItem.imageSize || 'md') === 'sm' && 'Pequena'}
                            {(newItem.imageSize || 'md') === 'md' && 'Média'}
                            {(newItem.imageSize || 'md') === 'lg' && 'Grande'}
                            {(newItem.imageSize || 'md') === 'xl' && 'Extra G'}
                            {(newItem.imageSize || 'md') === 'full' && '100% (Max)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];
                              const cur = newItem.imageSize || 'md';
                              const idx = sizes.indexOf(cur as any);
                              if (idx < sizes.length - 1) setNewItem({ ...newItem, imageSize: sizes[idx + 1] });
                            }}
                            disabled={(newItem.imageSize || 'md') === 'full'}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-all flex items-center justify-center"
                            title="Aumentar Imagem (+)"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: 'sm', label: 'Pequena', sub: 'P' },
                          { id: 'md', label: 'Média', sub: 'M' },
                          { id: 'lg', label: 'Grande', sub: 'G' },
                          { id: 'xl', label: 'Extra G', sub: 'GG' },
                          { id: 'full', label: '100%', sub: 'Max' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setNewItem({ ...newItem, imageSize: s.id as any })}
                            className={`py-2 px-1 rounded-xl text-center transition-all border ${
                              (newItem.imageSize || 'md') === s.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="block text-xs font-black leading-tight">{s.sub}</span>
                            <span className="block text-[8px] font-medium opacity-80 mt-0.5">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest ml-1">Texto Principal / Significado Completo</label>
                    <textarea 
                      value={newItem.descricao || ''}
                      onChange={(e) => setNewItem({...newItem, descricao: e.target.value})}
                      placeholder="Digite o significado ou descrição detalhada do emblema..."
                      rows={4}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm resize-y"
                    />
                  </div>

                  <div className="space-y-4 border-2 border-indigo-50 dark:border-indigo-950/60 p-4 rounded-3xl bg-indigo-50/30 dark:bg-indigo-950/20">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Construtor de Blocos Extras (Opcional)</label>
                    
                    {/* Lista de Blocos Atuais */}
                    <div className="space-y-3">
                      {newItem.blocks && newItem.blocks.length > 0 ? (
                        newItem.blocks.map((block, idx) => (
                          <div key={block.id} className="relative group bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <button 
                              onClick={() => removeBlock(block.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X size={12} />
                            </button>
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-300 shrink-0">
                                {idx + 1}
                              </div>
                              {block.type === 'text' ? (
                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{block.content}</p>
                              ) : (
                                <img src={block.content} alt="" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic text-center py-4">Nenhum bloco adicional adicionado.</p>
                      )}
                    </div>

                    {/* Controles para Adicionar */}
                    <div className="space-y-3 pt-4 border-t border-indigo-100 dark:border-indigo-900/50">
                      <div className="flex space-x-2">
                        <textarea 
                          value={currentBlockContent}
                          onChange={(e) => setCurrentBlockContent(e.target.value)}
                          placeholder="Digite o significado ou texto..."
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm min-h-[60px]"
                        />
                        <button 
                          onClick={() => addBlock('text', currentBlockContent)}
                          className="px-4 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-2xl font-black text-[10px] uppercase tracking-tighter hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-all shrink-0"
                        >
                          + Texto
                        </button>
                      </div>

                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBlockImageUpload(file);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-center space-x-2 text-indigo-400 group-hover:border-indigo-400 transition-all">
                          <ImageIcon size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Imagem Extra</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {editingItemId ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => saveItemEdit('EMBLEMS')}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                      <Check size={16} />
                      <span>Salvar Alterações no Item</span>
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="px-5 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addItem('EMBLEMS')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md active:scale-95 transition-all"
                  >
                    Adicionar à Lista
                  </button>
                )}
              </div>

              {/* List of added items */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emblemas Adicionados</h4>
                {(!Array.isArray(localCultura.emblemas_list) || localCultura.emblemas_list.length === 0) ? (
                  <p className="text-center py-8 text-slate-300 dark:text-slate-600 italic text-xs">Nenhum emblema adicionado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {renderAdminItemList(localCultura.emblemas_list, 'EMBLEMS')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
          <span>{isSaving ? 'Salvando...' : `Salvar ${tabs.find(t => t.id === activeTab)?.label}`}</span>
        </button>
      </div>
    </div>
  );
};

export type SubViewType = 
  | 'MAIN' | 'CULTURE' | 'LIBRARY' | 'CLASSES' | 'SPECIALTIES' | 'CLASS_DETAILS' | 'SPECIALTIES_LIST' | 'SPECIALTY_DETAILS' 
  | 'DESBRAVA_PLUS' | 'DESBRAVA_PLUS_DETAILS' | 'DESBRAVA_PLUS_PDF' 
  | 'BIBLE' | 'BIBLE_BOOKS' | 'BIBLE_CHAPTERS' | 'BIBLE_VERSES' | 'BIBLE_MARKED_VERSES' | 'BIBLE_MORE' | 'BIBLE_DICTIONARY' | 'BIBLE_NOTES' | 'BIBLE_SETTINGS' | 'BIBLE_ADMIN' | 'BIBLE_ADMIN_ADD' | 'BIBLE_DEVOTIONAL_LIST' | 'BIBLE_DEVOTIONAL_VIEW' 
  | 'FAIXA' | 'MANAGEMENT' | 'IDEALS_ANTHEM' | 'IDEALS' | 'ANTHEM' | 'CULTURE_ADMIN' | 'CULTURE_ADMIN_MENU' | 'HISTORY_LIST' | 'HISTORY_DETAIL' | 'UNIFORMS' | 'EMBLEMS' | 'CAMPING' | 'FORMULARIOS' | 'MATERIALS' | 'PDF_VIEWER' | 'LIBRARY_BOOKS_MENU' 
  | 'VIDEOS' | 'VIDEO_ADMIN' | 'FORM_ADMIN' | 'VIDEO_PLAYER' | 'LINKS_ADMIN' | 'ACHIEVEMENTS_ADMIN' | 'TRUNFOS' | 'TRUNFOS_ADMIN' | 'WEB_VIEWER';

interface ClubManagementProps {
  club: ClubType;
  onBack: () => void;
  onSwitchClub: (club: ClubType) => void;
  onOpenProfile?: () => void;
  isGuest?: boolean;
  initialSubView?: SubViewType;
  onSubViewChange?: (view: any) => void;
  onClearSubView?: () => void;
}

const ClubManagement: React.FC<ClubManagementProps> = ({ club, onBack, onSwitchClub, onOpenProfile, isGuest, initialSubView, onSubViewChange, onClearSubView }) => {
  const [activeSubView, setActiveSubView] = useState<SubViewType>(initialSubView || 'MAIN');
  const [classes, setClasses] = useState<ClubClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClubClass | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [specialties, setSpecialties] = useState<Especialidade[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Especialidade | null>(null);
  const [specialtyNavStack, setSpecialtyNavStack] = useState<Especialidade[]>([]);
  const [desbravaPlusItems, setDesbravaPlusItems] = useState<DesbravaMais[]>([]);
  const [selectedDesbravaPlusItem, setSelectedDesbravaPlusItem] = useState<DesbravaMais | null>(null);

  // Specialty Search Modal State
  const [isSpecialtySearchOpen, setIsSpecialtySearchOpen] = useState(false);
  const [specialtySearchQuery, setSpecialtySearchQuery] = useState('');
  const [allSpecialtiesList, setAllSpecialtiesList] = useState<Especialidade[]>([]);
  const [isLoadingSearchSpecialties, setIsLoadingSearchSpecialties] = useState(false);
  const [selectedSearchArea, setSelectedSearchArea] = useState<string>('TODAS');

  useEffect(() => {
    setIsHeaderScrolled(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    if (onSubViewChange) {
      onSubViewChange(activeSubView === 'MAIN' ? undefined : activeSubView);
    }
  }, [activeSubView]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [videoCategories, setVideoCategories] = useState<VideoCategory[]>([]);
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [selectedBibleBook, setSelectedBibleBook] = useState<BibleBook | null>(null);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState<number | null>(null);
  const [bibleVerses, setBibleVerses] = useState<BibleVerse[]>([]);
  const [markedVerses, setMarkedVerses] = useState<BibleVerse[]>(() => {
    const saved = localStorage.getItem('markedVerses');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTestament, setSelectedTestament] = useState<'ANTIGO' | 'NOVO' | 'TODOS'>('ANTIGO');
  const [bibleSearch, setBibleSearch] = useState('');
  const [bibleDictionary, setBibleDictionary] = useState<BibleDictionaryEntry[]>([]);
  const [dictionarySearch, setDictionarySearch] = useState('');
  const [bibleNotes, setBibleNotes] = useState<BibleNote[]>(() => {
    const saved = localStorage.getItem('bibleNotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [noteSearch, setNoteSearch] = useState('');
  const [newNote, setNewNote] = useState({ title: '', reference: '', content: '' });
  
  // Library and Materials State
  const [livrosClasses, setLivrosClasses] = useState<LivroClasse[]>([]);
  const [livrosAno, setLivrosAno] = useState<LivroAno[]>([]);
  const [outrosLivros, setOutrosLivros] = useState<OutroLivro[]>([]);
  const [manuaisDBV, setManuaisDBV] = useState<ManualDBV[]>([]);
  const [campingDBV, setCampingDBV] = useState<CampingDBV[]>([]);
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<'CLASSES' | 'ANO' | 'OUTROS' | 'MANUAIS' | 'BOOKS_AVT' | 'MANUAIS_AVT' | 'MATERIALS' | null>(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');

  // Bible Settings State
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [bibleSettings, setBibleSettings] = useState(() => {
    const saved = localStorage.getItem('dbv_tudo_bible_settings');
    return saved ? JSON.parse(saved) : {
      darkMode: false,
      fontSize: 16,
      dailyReminder: false,
      chapterStyle: 'Capítulo N',
      bibleVersion: 'Almeida Revista e Corrigida'
    };
  });

  const [devocionais, setDevocionais] = useState<Devocional[]>([]);
  const [newDevocional, setNewDevocional] = useState<Partial<Devocional>>({
    titulo: 'Devocional Diário',
    link: '',
    texto: '',
    agendado_para: new Date().toISOString().slice(0, 16)
  });
  const [selectedDevocional, setSelectedDevocional] = useState<Devocional | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoType | null>(null);

  const [newVideo, setNewVideo] = useState<Partial<VideoType>>({
    titulo: '',
    canal: '',
    duracao: '',
    visualizacoes: '0',
    link: '',
    categoria_id: 0,
    club: club
  });
  const [newVideoCategory, setNewVideoCategory] = useState<Partial<VideoCategory>>({
    nome: '',
    icone: 'Folder',
    club: club
  });
  const [newForm, setNewForm] = useState<Partial<Formulario>>({
    titulo: '',
    categoria: '',
    link: '',
    descricao: '',
    icone: 'FileText'
  });

  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [completedSpecialties, setCompletedSpecialties] = useState<string[]>([]);
  const [culturaData, setCulturaData] = useState<Cultura | null>(null);
  const [activeAccordions, setActiveAccordions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [classRequirements, setClassRequirements] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastRead, setLastRead] = useState<{ book: BibleBook, chapter: number } | null>(() => {
    const saved = localStorage.getItem('dbv_tudo_bible_last_read');
    return saved ? JSON.parse(saved) : null;
  });
  const [cultureAdminTab, setCultureAdminTab] = useState<'IDEALS' | 'ANTHEM' | 'HISTORY' | 'UNIFORMS' | 'EMBLEMS'>('IDEALS');
  
  const [livrosAVT, setLivrosAVT] = useState<LivroAVT[]>([]);
  const [manuaisAVT, setManuaisAVT] = useState<ManualAVT[]>([]);
  const [appLinks, setAppLinks] = useState<AppLink[]>([]);
  const [allConquistas, setAllConquistas] = useState<Conquista[]>([]);
  const [newConquista, setNewConquista] = useState<Partial<Conquista>>({
    nome: '',
    tipo: 'CLASSE_REGULAR',
    imagem_colorida: '',
    imagem_cinza: '',
    ordem: 0,
    shape: 'CIRCLE'
  });
  const [isSavingConquista, setIsSavingConquista] = useState(false);
  const [conquistaEditId, setConquistaEditId] = useState<number | null>(null);
  const [isDeletingConquista, setIsDeletingConquista] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '' });
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [editingFormId, setEditingFormId] = useState<number | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [selectedWebUrl, setSelectedWebUrl] = useState<string | null>(null);
  const [webTitle, setWebTitle] = useState('');
  const [selectedCultureDetail, setSelectedCultureDetail] = useState<CulturaItem | null>(null);

  const [trunfos, setTrunfos] = useState<Trunfo[]>([]);
  const [selectedTrunfoModal, setSelectedTrunfoModal] = useState<Trunfo | null>(null);
  const [isTrunfoImageZoomed, setIsTrunfoImageZoomed] = useState(false);
  const [editingTrunfoId, setEditingTrunfoId] = useState<number | null>(null);
  const [newTrunfo, setNewTrunfo] = useState<Partial<Trunfo>>({
    titulo: '',
    ano: '',
    imagem: '',
    historia: '',
    club: club
  });
  const [isSavingTrunfo, setIsSavingTrunfo] = useState(false);
  const [trunfoSearchQuery, setTrunfoSearchQuery] = useState('');

  const isPathfinder = club === ClubType.PATHFINDER;
  const themeColor = isPathfinder ? '#dc371b' : '#800000';
  const themeBgLight = isPathfinder ? 'bg-[#dc371b]/5' : 'bg-[#800000]/5';

  useEffect(() => {
    setNewVideo(prev => ({ ...prev, club: club }));
    setNewVideoCategory(prev => ({ ...prev, club: club }));
    setNewTrunfo(prev => ({ ...prev, club: club }));
  }, [club]);

  useEffect(() => {
    if (newVideo.link && (newVideo.link.includes('youtube.com') || newVideo.link.includes('youtu.be'))) {
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`https://noembed.com/embed?url=${newVideo.link}`);
          const data = await response.json();
          if (data && data.title) {
            setNewVideo(prev => ({
              ...prev,
              titulo: prev.titulo || data.title,
              canal: prev.canal || data.author_name
            }));
          }
        } catch (e) {}
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [newVideo.link]);

  // Reset view state when switching clubs
  useEffect(() => {
    // Only reset to MAIN if we are NOT coming from an initialSubView request
    if (!initialSubView) {
      setActiveSubView('MAIN');
    }
    setSelectedClass(null);
    setSelectedCategory(null);
    setSelectedSpecialty(null);
    setClasses([]);
    setCategories([]);
    setSpecialties([]);
    setClassRequirements([]);
    setDesbravaPlusItems([]);
    setSelectedDesbravaPlusItem(null);
    setVideos([]);
    setVideoCategories([]);
  }, [club]);

  useEffect(() => {
    if (initialSubView) {
      if (initialSubView !== activeSubView) {
        setActiveSubView(initialSubView);
      }
      if (onClearSubView) onClearSubView();
    }
  }, [initialSubView]);

  // Reset scroll when view changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeSubView]);

  const loadProfile = useCallback(() => {
    if (isGuest) {
      setUserAvatar(null);
      setUserEmail(null);
      setIsUserAdmin(false);
      return;
    }
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserAvatar(parsed.avatar || null);
        setUserEmail(parsed.email || null);
        setIsUserAdmin(parsed.isAdmin || false);
      } catch { }
    } else {
      setUserAvatar(null);
      setUserEmail(null);
      setIsUserAdmin(false);
    }
  }, [isGuest]);

  useEffect(() => {
    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, [loadProfile]);

  useEffect(() => {
    localStorage.setItem('markedVerses', JSON.stringify(markedVerses));
  }, [markedVerses]);

  useEffect(() => {
    localStorage.setItem('bibleNotes', JSON.stringify(bibleNotes));
  }, [bibleNotes]);

  useEffect(() => {
    localStorage.setItem('dbv_tudo_bible_settings', JSON.stringify(bibleSettings));
  }, [bibleSettings]);

  useEffect(() => {
    if (userEmail) {
      fetchUserSpecialties(userEmail)
        .then(setCompletedSpecialties)
        .catch(err => console.warn("Erro ao buscar especialidades do usuário:", err));
      
      // If isUserAdmin is not set yet, try to fetch from Supabase
      if (!isUserAdmin) {
        const savedState = localStorage.getItem('dbv_tudo_app_state');
        if (savedState) {
          try {
            const { guest } = JSON.parse(savedState);
            if (!guest) {
              // Get current user session to get ID
              supabase.auth.getUser()
                .then(({ data, error }) => {
                  if (!error && data?.user) {
                    fetchUserProfile(data.user.id)
                      .then(profile => {
                        if (profile?.ADM) {
                          setIsUserAdmin(true);
                          // Update local storage for next time
                          const savedProfile = localStorage.getItem(PROFILE_KEY);
                          if (savedProfile) {
                            const parsed = JSON.parse(savedProfile);
                            parsed.isAdmin = true;
                            localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
                          }
                        }
                      })
                      .catch(err => console.warn("Erro ao buscar perfil:", err));
                  }
                })
                .catch(err => console.warn("Erro ao verificar sessão:", err));
            }
          } catch {}
        }
      }
    }
  }, [userEmail, isUserAdmin]);

  useEffect(() => {
    fetchConquistas()
      .then(setAllConquistas)
      .catch(err => console.warn("Erro ao buscar conquistas:", err));
  }, [activeSubView]);

  useEffect(() => {
    const clubType = club === ClubType.PATHFINDER ? 'PATHFINDER' : 'ADVENTURER';
    fetchCultura(clubType)
      .then(data => {
        if (data) setCulturaData(data);
      })
      .catch(err => console.warn("Erro ao buscar dados de cultura:", err));
  }, [club]);

  const toggleSpecialty = async (specialtyId: string) => {
    const sId = specialtyId.toString();
    const isCompleted = completedSpecialties.includes(sId);
    const newCompleted = isCompleted 
      ? completedSpecialties.filter(id => id !== sId)
      : [...completedSpecialties, sId];
    
    // Optimistic update
    setCompletedSpecialties(newCompleted);
    
    // Always save locally for instant feedback and guest support
    localStorage.setItem(`dbv_tudo_completed_specialties_${userEmail || 'guest'}`, JSON.stringify(newCompleted));

    if (userEmail && userEmail !== 'email@exemplo.com' && !isGuest) {
      try {
        const { error } = await updateUserSpecialties(userEmail, newCompleted);
        if (error) {
          console.error("Erro ao sincronizar especialidades com o servidor:", error);
          // Don't alert here to avoid annoying the user if it's a minor sync issue, 
          // the local storage keeps it working for the session.
        }
      } catch (err) {
        console.error("Erro fatal ao atualizar especialidades:", err);
      }
    }
  };

  const availableSearchAreas = React.useMemo(() => {
    const areas = new Set<string>();
    allSpecialtiesList.forEach(esp => {
      if (esp.area) areas.add(esp.area);
    });
    return Array.from(areas).sort();
  }, [allSpecialtiesList]);

  const filteredSearchSpecialties = React.useMemo(() => {
    return allSpecialtiesList.filter(esp => {
      const q = specialtySearchQuery.toLowerCase().trim();
      const matchesText = !q || 
        (esp.nome && esp.nome.toLowerCase().includes(q)) ||
        (esp.area && esp.area.toLowerCase().includes(q)) ||
        (esp.codigo && esp.codigo.toLowerCase().includes(q)) ||
        (esp.sigla && esp.sigla.toLowerCase().includes(q));

      const matchesArea = selectedSearchArea === 'TODAS' || esp.area === selectedSearchArea;

      return matchesText && matchesArea;
    });
  }, [allSpecialtiesList, specialtySearchQuery, selectedSearchArea]);

  const toggleMarkVerse = (verse: BibleVerse) => {
    setMarkedVerses(prev => {
      const isMarked = prev.some(v => v.id === verse.id);
      if (isMarked) {
        return prev.filter(v => v.id !== verse.id);
      } else {
        return [...prev, verse];
      }
    });
  };

  const goToPreviousChapter = () => {
    if (!selectedBibleBook || selectedBibleChapter === null) return;
    
    if (selectedBibleChapter > 1) {
      setSelectedBibleChapter(selectedBibleChapter - 1);
    } else {
      const currentIndex = bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name);
      if (currentIndex > 0) {
        const prevBook = bibleBooks[currentIndex - 1];
        setSelectedBibleBook(prevBook);
        setSelectedBibleChapter(prevBook.total_chapters);
      }
    }
  };

  const goToNextChapter = () => {
    if (!selectedBibleBook || selectedBibleChapter === null) return;
    
    if (selectedBibleChapter < selectedBibleBook.total_chapters) {
      setSelectedBibleChapter(selectedBibleChapter + 1);
    } else {
      const currentIndex = bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name);
      if (currentIndex < bibleBooks.length - 1) {
        const nextBook = bibleBooks[currentIndex + 1];
        setSelectedBibleBook(nextBook);
        setSelectedBibleChapter(1);
      }
    }
  };

  const handleSaveNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;
    
    const note: BibleNote = {
      id: Date.now().toString(),
      title: newNote.title,
      reference: newNote.reference,
      content: newNote.content,
      date: new Date().toLocaleDateString('pt-BR')
    };
    
    setBibleNotes([note, ...bibleNotes]);
    setNewNote({ title: '', reference: '', content: '' });
  };

  const handleDeleteNote = (id: string) => {
    setBibleNotes(bibleNotes.filter(n => n.id !== id));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 400);
    setIsHeaderScrolled(scrollTop > 150);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    setAllSpecialtiesList([]);
  }, [club]);

  const openSpecialtySearch = () => {
    setIsSpecialtySearchOpen(true);
    if (allSpecialtiesList.length === 0) {
      setIsLoadingSearchSpecialties(true);
      fetchEspecialidades(club)
        .then(setAllSpecialtiesList)
        .catch(err => console.warn("Erro ao buscar especialidades:", err))
        .finally(() => setIsLoadingSearchSpecialties(false));
    }
  };

  useEffect(() => {
    if (activeSubView === 'CLASSES') {
      setIsLoading(true);
      fetchClasses(club)
        .then(setClasses)
        .catch(err => console.warn("Erro ao carregar classes:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'SPECIALTIES' || activeSubView === 'SPECIALTIES_LIST' || activeSubView === 'SPECIALTY_DETAILS') {
      if (activeSubView === 'SPECIALTIES') {
        setIsLoading(true);
        fetchCategories(club)
          .then(setCategories)
          .catch(err => console.warn("Erro ao carregar categorias:", err))
          .finally(() => setIsLoading(false));
      }
      if (allSpecialtiesList.length === 0) {
        fetchEspecialidades(club)
          .then(setAllSpecialtiesList)
          .catch(err => console.warn("Erro ao carregar especialidades:", err));
      }
    } else if (activeSubView === 'DESBRAVA_PLUS') {
      setIsLoading(true);
      fetchDesbravaMais()
        .then(setDesbravaPlusItems)
        .catch(err => console.warn("Erro ao carregar Desbrava+:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'LIBRARY') {
      setIsLoading(true);
      if (isPathfinder) {
        Promise.all([
          fetchLivrosClasses(),
          fetchLivrosAno(),
          fetchOutrosLivros(),
          fetchManuaisDBV()
        ]).then(([classes, ano, outros, manuais]) => {
          setLivrosClasses(classes);
          // Ordenar por ano descendente (atual primeiro)
          setLivrosAno([...ano].sort((a, b) => {
            const anoA = parseInt(a.Ano.toString()) || 0;
            const anoB = parseInt(b.Ano.toString()) || 0;
            return anoB - anoA;
          }));
          setOutrosLivros(outros);
          setManuaisDBV(manuais);
        }).catch(err => {
          console.warn("Erro ao carregar biblioteca DBV:", err);
        }).finally(() => setIsLoading(false));
      } else {
        Promise.all([
          fetchLivrosAVT(),
          fetchManuaisAVT()
        ]).then(([livros, manuais]) => {
          setLivrosAVT(livros);
          setManuaisAVT(manuais);
        }).catch(err => {
          console.warn("Erro ao carregar biblioteca AVT:", err);
        }).finally(() => setIsLoading(false));
      }
    } else if (activeSubView === 'MAIN') {
      fetchAppLinks()
        .then(setAppLinks)
        .catch(err => console.warn("Erro ao carregar links:", err));
    } else if (activeSubView === 'LINKS_ADMIN') {
      fetchAppLinks()
        .then(setAppLinks)
        .catch(err => console.warn("Erro ao carregar links admin:", err));
    } else if (activeSubView === 'CAMPING') {
      setIsLoading(true);
      fetchCampingDBV()
        .then(setCampingDBV)
        .catch(err => console.warn("Erro ao carregar camping:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'VIDEOS' || activeSubView === 'VIDEO_ADMIN') {
      setIsLoading(true);
      const promises: [Promise<VideoType[]>, Promise<VideoCategory[]>] = [
        fetchVideos(club),
        fetchVideoCategories(club)
      ];

      if (club === ClubType.PATHFINDER) {
        Promise.all([
          ...promises,
          fetchAtividadesJogosDBV(),
          fetchCerimoniasDBV(),
          fetchVideosDBV()
        ]).then(async ([v, c, aj, cer, vdbv]) => {
          const virtualCategories: VideoCategory[] = [
            { id: -3, nome: 'Tutorial de Especialidades', icone: 'Video', club: ClubType.PATHFINDER },
            { id: -1, nome: 'Atividades e Jogos', icone: 'Zap', club: ClubType.PATHFINDER },
            { id: -2, nome: 'Cerimônias', icone: 'Award', club: ClubType.PATHFINDER }
          ];
          
          const allVideos = [...v, ...aj, ...cer, ...vdbv];
          
          // Fetch YouTube metadata for videos that might need it
          const videosWithMetadata = await Promise.all(allVideos.map(async (video) => {
            if (video.link && (!video.titulo || video.titulo === '' || video.canal === '')) {
              try {
                const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(video.link)}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data && data.title) {
                    return {
                      ...video,
                      titulo: data.title || video.titulo,
                      canal: data.author_name || video.canal
                    };
                  }
                }
              } catch (e) {
                // Silently ignore embed fetch failures
              }
            }
            return video;
          }));

          setVideos(videosWithMetadata);
          setVideoCategories([...virtualCategories, ...c]);
        }).catch(err => {
          console.warn("Erro ao carregar vídeos:", err);
        }).finally(() => setIsLoading(false));
      } else {
        Promise.all(promises).then(([v, c]) => {
          setVideos(v);
          setVideoCategories(c);
        }).catch(err => {
          console.warn("Erro ao carregar vídeos:", err);
        }).finally(() => setIsLoading(false));
      }
    } else if (activeSubView === 'TRUNFOS' || activeSubView === 'TRUNFOS_ADMIN') {
      setIsLoading(true);
      const clubType = club === ClubType.PATHFINDER ? 'PATHFINDER' : 'ADVENTURER';
      fetchTrunfos(clubType)
        .then(setTrunfos)
        .catch(err => console.warn("Erro ao carregar trunfos:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'FORMULARIOS' || activeSubView === 'FORM_ADMIN') {
      setIsLoading(true);
      fetchFormularios()
        .then(setFormularios)
        .catch(err => console.warn("Erro ao carregar formulários:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'BIBLE_BOOKS') {
      setIsLoading(true);
      fetchBibleBooks()
        .then(setBibleBooks)
        .catch(err => console.warn("Erro ao carregar livros da Bíblia:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'BIBLE_VERSES' && selectedBibleBook && selectedBibleChapter !== null) {
      setIsLoading(true);
      fetchBibleVerses(selectedBibleBook.book_name, selectedBibleChapter.toString())
        .then(setBibleVerses)
        .catch(err => console.warn("Erro ao carregar versículos:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'BIBLE_DICTIONARY') {
      setIsLoading(true);
      fetchBibleDictionary(dictionarySearch)
        .then(setBibleDictionary)
        .catch(err => console.warn("Erro ao carregar dicionário bíblico:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView.startsWith('BIBLE')) {
      setIsLoading(true);
      fetchDevocionais()
        .then(setDevocionais)
        .catch(err => console.warn("Erro ao carregar devocionais:", err))
        .finally(() => setIsLoading(false));
    }
  }, [activeSubView, club, selectedBibleBook, selectedBibleChapter, dictionarySearch]);

  useEffect(() => {
    if (activeSubView === 'SPECIALTIES_LIST' && selectedCategory) {
      setIsLoading(true);
      if (selectedCategory.id === -100) {
        // Para favoritas, buscamos todas e filtramos pelas curtidas
        fetchEspecialidades(club).then(all => {
          const liked = all.filter(s => completedSpecialties.includes(s.id.toString()));
          setSpecialties(liked);
        }).catch(err => {
          console.warn("Erro ao carregar favoritas:", err);
        }).finally(() => setIsLoading(false));
      } else {
        // Filtra pelo nome (Mestrado) que é o que aparece no botão
        fetchEspecialidades(club, selectedCategory.nome)
          .then(setSpecialties)
          .catch(err => {
            console.warn("Erro ao carregar especialidades por categoria:", err);
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [activeSubView, club, selectedCategory, completedSpecialties]);

  useEffect(() => {
    if (activeSubView === 'CLASS_DETAILS' && selectedClass) {
      setIsLoading(true);
      
      if (selectedClass.corpo) {
        // Se houver corpo no banco, usamos ele (dividindo por quebras de linha)
        const reqs = selectedClass.corpo.split('\n').filter(r => r.trim().length > 0);
        setClassRequirements(reqs);
        setIsLoading(false);
      } else {
        // Fallback para mock se não houver dados no banco
        const mockReqs = [
          "I. GERAIS: Ter no mínimo 10 anos de idade.",
          "II. DESCOBERTA ESPIRITUAL: Memorizar e explicar o Voto e a Lei do Desbravador.",
          "III. SERVINDO A OUTROS: Participar de um projeto comunitário de sua igreja.",
          "IV. DESENVOLVENDO AMIZADE: Discutir como ser um bom amigo em diversas situações.",
          "V. SAÚDE E APTIDÃO FÍSICA: Completar a especialidade de Natação Principiante I.",
          "VI. ORGANIZAÇÃO E LIDERANÇA: Conhecer a história do Clube de Desbravadores.",
          "VII. ESTUDO DA NATUREZA: Identificar 10 flores silvestres e 10 insetos da sua região.",
          "VIII. ARTE DE ACAMPAR: Aprender a fazer 10 nós básicos.",
          "IX. ENRIQUECIMENTO ESPIRITUAL: Ler o livro do ano."
        ];
        
        setTimeout(() => {
          setClassRequirements(mockReqs);
          setIsLoading(false);
        }, 600);
      }
    }
  }, [activeSubView, selectedClass]);

  const handleClassClick = (cls: ClubClass) => {
    setSelectedClass(cls);
    setActiveSubView('CLASS_DETAILS');
  };

  const getClassColor = (cls: ClubClass) => {
    return cls.cor || themeColor;
  };

  const renderClassesMenu = () => (
    <div className="animate-slide-in space-y-4 pt-4 pb-28">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-800 border-t-slate-300 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <button 
              key={cls.id} 
              onClick={() => handleClassClick(cls)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                {cls.imagem ? (
                  <img src={cls.imagem} className="w-full h-full object-contain filter drop-shadow-sm" alt={cls.titulo} referrerPolicy="no-referrer" />
                ) : (
                  <Layers size={28} className="text-slate-300 dark:text-slate-600" />
                )}
              </div>

              <div className="flex-grow text-left">
                <h4 className="font-black text-[#1e293b] dark:text-slate-200 text-lg leading-tight tracking-tight uppercase">
                  {cls.titulo}
                </h4>
                {cls.subtitulo ? (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {cls.subtitulo}
                  </p>
                ) : (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Requisitos e Atividades
                  </p>
                )}
              </div>
              
              <ChevronRight size={20} className="text-slate-200 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderClassDetails = () => {
    if (!selectedClass) return null;
    const classColor = getClassColor(selectedClass);

    const generateClassPDF = async () => {
      setIsGeneratingPDF(true);
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const innerWidth = pageWidth - (margin * 2);
        let currentY = margin;

        const checkPageBreak = (height: number) => {
          if (currentY + height > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
            return true;
          }
          return false;
        };

        // Imagem da Classe
        if (selectedClass.imagem) {
          try {
            const imgData = await loadImageDataUrl(selectedClass.imagem);
            if (imgData) {
              const imgSize = 28;
              const imgX = (pageWidth - imgSize) / 2;
              pdf.addImage(imgData, 'PNG', imgX, currentY, imgSize, imgSize);
              currentY += imgSize + 6;
            }
          } catch (imgErr) {
            console.warn('Não foi possível carregar a imagem da classe para o PDF:', imgErr);
          }
        }

        // Header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(30, 41, 59); // slate-800
        pdf.text(selectedClass.titulo.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        if (selectedClass.subtitulo) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          pdf.setTextColor(100, 116, 139); // slate-500
          const subtitleLines = pdf.splitTextToSize(selectedClass.subtitulo, innerWidth);
          pdf.text(subtitleLines, pageWidth / 2, currentY, { align: 'center' });
          currentY += (subtitleLines.length * 5) + 6;
        }

        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.line(margin, currentY, margin + innerWidth, currentY);
        currentY += 10;

        // Requisitos
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59);
        pdf.text('REQUISITOS', margin, currentY);
        currentY += 10;

        classRequirements.forEach((req) => {
          const parts = req.split(':');
          const title = parts[0];
          const content = parts.slice(1).join(':').trim();

          // Title of requirement
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(148, 163, 184); // slate-400
          const titleLines = pdf.splitTextToSize(title.toUpperCase(), innerWidth);
          checkPageBreak(titleLines.length * 5 + 10);
          pdf.text(titleLines, margin, currentY);
          currentY += titleLines.length * 5 + 2;

          // Content of requirement
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(51, 65, 85); // slate-700
          const contentLines = pdf.splitTextToSize(content, innerWidth);
          checkPageBreak(contentLines.length * 6 + 15);
          pdf.text(contentLines, margin, currentY);
          currentY += (contentLines.length * 6) + 10;
        });

        pdf.save(`${selectedClass.titulo.replace(/\s+/g, '_')}_Requisitos.pdf`);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    return (
      <div className="animate-slide-in space-y-4 pt-1 pb-28">
        {/* Barra Sticky com Botão Voltar */}
        <div className={`sticky top-0 z-30 flex items-center justify-between py-2 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 transition-all duration-300 ${
          isHeaderScrolled 
            ? 'bg-[#F8FAFC]/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800' 
            : 'bg-transparent -mb-[64px] pointer-events-none'
        }`}>
          <button 
            onClick={() => setActiveSubView('CLASSES')}
            className={`w-11 h-11 rounded-2xl active:scale-90 transition-all flex items-center justify-center pointer-events-auto ${
              isHeaderScrolled
                ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm ml-0'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/25 shadow-sm ml-3 sm:ml-4'
            }`}
            title="Voltar para Classes"
            aria-label="Voltar para Classes"
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
          <div className={`text-center flex-1 px-3 truncate transition-all duration-300 ${isHeaderScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight truncate">
              {selectedClass.titulo}
            </h4>
          </div>
          <div className="w-11 h-11" />
        </div>

        <div id="class-details-content" className="space-y-6">
          {/* Header da Classe */}
          <div id="class-header" className="relative overflow-hidden rounded-[40px] p-8 pt-16 shadow-xl" style={{ backgroundColor: classColor }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-28 h-28 flex items-center justify-center mb-4">
                {selectedClass.imagem ? (
                  <img src={selectedClass.imagem} className="w-full h-full object-contain filter drop-shadow-md" alt={selectedClass.titulo} referrerPolicy="no-referrer" />
                ) : (
                  <Layers size={48} className="text-white" />
                )}
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                {selectedClass.titulo}
              </h3>
              {selectedClass.subtitulo && (
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-2 px-4">
                  {selectedClass.subtitulo}
                </p>
              )}
            </div>
          </div>

          {/* Lista de Requisitos */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-slate-100 dark:border-slate-800 border-t-slate-300 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {classRequirements.map((req, idx) => {
                  const [title, ...rest] = req.split(':');
                  return (
                    <div key={idx} className="class-requirement-card bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-5 shadow-sm flex items-start space-x-4 group transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-2.5 flex-shrink-0"></div>
                      <div className="flex-grow">
                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                          {title}
                        </p>
                        <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 leading-snug">
                          {rest.join(':').trim()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={generateClassPDF}
          disabled={isGeneratingPDF}
          className="w-full py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <Download size={18} />
          <span>{isGeneratingPDF ? 'Gerando...' : 'Gerar PDF da Classe'}</span>
        </button>

        {/* Botão de Ajuda da IA removido */}
      </div>
    );
  };

  const renderSpecialtiesCategories = () => (
    <div className="animate-slide-in space-y-5 pt-4 pb-28">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-100 border-t-slate-300 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Categoria Virtual de Curtidas */}
          <button 
            onClick={() => {
              setSelectedCategory({ id: -100, nome: 'Favoritas', imagem: '', cor: '#ef4444', sigla: 'FAV' } as Category);
              setActiveSubView('SPECIALTIES_LIST');
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[20px] p-5 flex items-center relative shadow-sm active:scale-[0.98] transition-all overflow-hidden group mb-6"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
            <div className="flex items-center flex-grow">
              <div className="mr-4">
                <Heart size={24} className="text-red-500" fill="currentColor" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[15px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Especialidades Curtidas</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{completedSpecialties.length} Guardadas</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 dark:text-slate-500 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2">Mestrados</p>

          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => {
                setSelectedCategory(cat);
                setActiveSubView('SPECIALTIES_LIST');
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[20px] p-5 flex items-center relative shadow-sm active:scale-[0.98] transition-all overflow-hidden group"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5" 
                style={{ backgroundColor: cat.cor || themeColor }}
              ></div>
              
              <div className="flex items-center flex-grow">
                <div className="mr-4">
                  <Folder 
                    size={24} 
                    style={{ color: cat.cor || themeColor }} 
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-[15px] font-black text-slate-800 dark:text-white uppercase tracking-tight text-left">
                  {cat.nome}
                </span>
              </div>
              
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderSpecialtiesList = () => (
    <div className="animate-slide-in space-y-5 pt-4 pb-28">
      <div className="px-2 flex items-center justify-end">
        <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase">{specialties.length} Itens</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-100 border-t-slate-300 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {specialties.map((esp) => {
            const isCompleted = completedSpecialties.includes(esp.id.toString());
            return (
              <div 
                key={esp.id} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-4 flex items-center space-x-4 shadow-sm group relative"
              >
                <button 
                  onClick={() => {
                    setSelectedSpecialty(esp);
                    setActiveSubView('SPECIALTY_DETAILS');
                  }}
                  className="flex items-center space-x-4 flex-grow text-left active:scale-[0.98] transition-all"
                >
                  <div className="w-16 h-16 bg-transparent rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {esp.logo ? (
                      <img src={esp.logo} className="w-14 h-14 object-contain" alt={esp.nome} />
                    ) : (
                      <Award size={24} className="text-slate-200 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-black text-slate-700 dark:text-white text-[13px] uppercase tracking-tight leading-tight">
                      {esp.nome}
                    </h4>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {esp.area}
                      </p>
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                        {esp.codigo || `${esp.sigla}${String(esp.id).padStart(3, '0')}`}
                      </span>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSpecialty(esp.id.toString());
                  }}
                  className={`p-3 rounded-xl transition-all active:scale-90 ${isCompleted ? 'text-red-500 bg-red-50 dark:bg-red-950/40' : 'text-slate-200 dark:text-slate-600 hover:text-red-200'}`}
                >
                  <Heart size={20} fill={isCompleted ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const cleanTextForSpecialtyMatching = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\;\.\:\,\(\)\"\'\–\—\-\[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const KNOWN_SPECIALTY_TYPO_MAP: Record<string, string> = {
    'calaque': 'caiaque',
    'marsupials': 'marsupiais',
    'doencas tropicals': 'doencas tropicais',
    'prevencao de doencas tropicals': 'prevencao de doencas tropicais',
    'pequenos mamiferos': 'pequenos mamiferos de estimacao',
    'animais ameacados': 'animais ameacados de extincao',
    'reciclagem': 'reciclagem e sustentabilidade',
    'nutricao avancado': 'nutricao avancado',
    'primeiros socorros avancado': 'primeiros socorros avancado',
  };

  const findMatchingSpecialty = (reqText: string, allList: Especialidade[]): Especialidade | null => {
    if (!reqText || !allList || allList.length === 0) return null;
    
    let clean = cleanTextForSpecialtyMatching(reqText)
      .replace(/^ter\s+(sete|oito|nove|dez|quatorze|\d+)\s+das\s+seguintes\s+especialidades/g, '')
      .replace(/^ter\s+(sete|oito|nove|dez|quatorze|\d+)\s+especialidades/g, '')
      .replace(/^\d+\s*(ter|\-|\.)*/g, '')
      .replace(/^(a|as)\s+especialidade(s)?\s+(de|da|do)?/g, '')
      .replace(/^especialidade(s)?\s+(de|da|do)?/g, '')
      .trim();

    if (!clean || clean.length < 3) return null;

    if (KNOWN_SPECIALTY_TYPO_MAP[clean]) {
      clean = KNOWN_SPECIALTY_TYPO_MAP[clean];
    }

    const ordinaryList = allList.filter(e => !e.nome.toLowerCase().includes('mestrado'));

    // 1. Match exato
    let match = ordinaryList.find(e => cleanTextForSpecialtyMatching(e.nome) === clean);
    if (match) return match;

    // 2. Prefixo ou Sufixo
    match = ordinaryList.find(e => {
      const n = cleanTextForSpecialtyMatching(e.nome);
      return n === clean || clean.startsWith(n) || n.startsWith(clean);
    });
    if (match) return match;

    // 3. Substring
    match = ordinaryList.find(e => {
      const n = cleanTextForSpecialtyMatching(e.nome);
      if (n.length < 4) return false;
      return clean.includes(n) || n.includes(clean);
    });
    return match || null;
  };

  const getMasteryGlobalSpecialties = (masteryName: string, allList: Especialidade[]): Especialidade[] => {
    if (!masteryName || !allList || allList.length === 0) return [];
    const normalize = (txt: string) => 
      txt.toLowerCase()
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "")
         .replace('mestrado em ', '')
         .replace('mestrado de ', '')
         .replace('campreste', 'campestre')
         .replace('tecinologia', 'tecnologia')
         .trim();

    const mName = normalize(masteryName);
    const rule = MASTERY_RULES.find(r => {
      const rName = normalize(r.name);
      return mName === rName || mName.includes(rName) || rName.includes(mName);
    });

    const ordinary = allList.filter(s => !s.nome.toLowerCase().includes('mestrado'));

    if (!rule) {
      return ordinary.filter(s => {
        const area = s.area ? normalize(s.area) : '';
        return area && (mName.includes(area) || area.includes(mName));
      });
    }

    if (rule.isGlobalArea) {
      return ordinary.filter(s => {
        if (s.area && normalize(s.area).includes(normalize(rule.category))) return true;
        if (s.sigla && rule.siglas?.includes(s.sigla)) return true;
        return false;
      });
    }

    return ordinary.filter(s => {
      const sName = normalize(s.nome);
      return rule.specialties.some(rs => {
        const rsName = normalize(rs);
        return sName === rsName || sName.includes(rsName) || rsName.includes(sName);
      });
    });
  };

  const renderSpecialtyDetails = () => {
    if (!selectedSpecialty) return null;
    const isCompleted = completedSpecialties.includes(selectedSpecialty.id.toString());
    const isMastery = selectedSpecialty.nome.toLowerCase().includes('mestrado') || selectedSpecialty.area === 'Mestrados';
    const globalAreaSpecialties = isMastery ? getMasteryGlobalSpecialties(selectedSpecialty.nome, allSpecialtiesList) : [];

    const generateSpecialtyPDF = async () => {
      setIsGeneratingPDF(true);
      try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const margin = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const innerWidth = pageWidth - (margin * 2);
        let currentY = margin;

        const checkPageBreak = (height: number) => {
          if (currentY + height > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
            return true;
          }
          return false;
        };

        // Imagem da Especialidade
        if (selectedSpecialty.logo) {
          try {
            const imgData = await loadImageDataUrl(selectedSpecialty.logo);
            if (imgData) {
              const imgSize = 28;
              const imgX = (pageWidth - imgSize) / 2;
              pdf.addImage(imgData, 'PNG', imgX, currentY, imgSize, imgSize);
              currentY += imgSize + 6;
            }
          } catch (imgErr) {
            console.warn('Não foi possível carregar a imagem da especialidade para o PDF:', imgErr);
          }
        }

        // Header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);
        pdf.setTextColor(79, 70, 229); // indigo-600
        pdf.text(selectedSpecialty.nome.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
        currentY += 8;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139); // slate-500
        if (selectedSpecialty.area) {
          pdf.text(`ÁREA: ${selectedSpecialty.area.toUpperCase()}`, pageWidth / 2, currentY, { align: 'center' });
          currentY += 5;
        }

        const metaParts = [
          selectedSpecialty.codigo ? `CÓDIGO: ${selectedSpecialty.codigo}` : null,
          selectedSpecialty.nivel ? `NÍVEL: ${selectedSpecialty.nivel}` : null,
          selectedSpecialty.ano ? `ANO: ${selectedSpecialty.ano}` : (selectedSpecialty.origem ? `ORIGEM: ${selectedSpecialty.origem}` : null)
        ].filter(Boolean);

        if (metaParts.length > 0) {
          pdf.text(metaParts.join(' | '), pageWidth / 2, currentY, { align: 'center' });
          currentY += 6;
        }

        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.line(margin, currentY, margin + innerWidth, currentY);
        currentY += 10;

        // Requisitos
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59);
        pdf.text('REQUISITOS', margin, currentY);
        currentY += 10;

        selectedSpecialty.requisitos.forEach((req, idx) => {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(51, 65, 85); // slate-700
          const contentLines = pdf.splitTextToSize(req.trim(), innerWidth);
          checkPageBreak(contentLines.length * 6 + 10);
          pdf.text(contentLines, margin, currentY);
          currentY += (contentLines.length * 6) + 6;
        });

        pdf.save(`${selectedSpecialty.nome.replace(/\s+/g, '_')}_Requisitos.pdf`);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
      } finally {
        setIsGeneratingPDF(false);
      }
    };

    // Contagem de especialidades identificadas na lista de requisitos (somente para Mestrados)
    const matchedCount = isMastery
      ? selectedSpecialty.requisitos.filter(r => !!findMatchingSpecialty(r, allSpecialtiesList)).length
      : 0;

    return (
      <div className="animate-slide-in space-y-4 pt-1 pb-28">
        {/* Barra de Voltar e Favorito Fixa no Topo */}
        <div className={`sticky top-0 z-30 flex items-center justify-between py-2 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 transition-all duration-300 ${
          isHeaderScrolled 
            ? 'bg-[#F8FAFC]/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800' 
            : 'bg-transparent -mb-[64px] pointer-events-none'
        }`}>
          <button 
            onClick={() => {
              if (specialtyNavStack.length > 0) {
                const prev = specialtyNavStack[specialtyNavStack.length - 1];
                setSpecialtyNavStack(prevStack => prevStack.slice(0, prevStack.length - 1));
                setSelectedSpecialty(prev);
                if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
              } else if (selectedCategory) {
                setActiveSubView('SPECIALTIES_LIST');
              } else {
                setActiveSubView('SPECIALTIES');
              }
            }}
            className={`w-11 h-11 rounded-2xl active:scale-90 transition-all flex items-center justify-center pointer-events-auto ${
              isHeaderScrolled
                ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm ml-0'
                : 'bg-slate-100/90 dark:bg-slate-700/90 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-600/60 shadow-sm ml-3 sm:ml-4'
            }`}
            title="Voltar"
            aria-label="Voltar"
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
          <div className={`text-center flex-1 px-3 truncate transition-all duration-300 ${isHeaderScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight truncate">
              {selectedSpecialty.nome}
            </h4>
          </div>
          <button 
            onClick={() => toggleSpecialty(selectedSpecialty.id.toString())}
            className={`w-11 h-11 rounded-2xl transition-all active:scale-90 flex items-center justify-center pointer-events-auto shadow-sm ${
              isCompleted 
                ? 'text-red-500 bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/50' 
                : isHeaderScrolled 
                  ? 'text-slate-400 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700' 
                  : 'text-slate-400 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-700/90 border border-slate-200/60 dark:border-slate-600/60'
            } ${!isHeaderScrolled ? 'mr-3 sm:mr-4' : 'mr-0'}`}
            title={isCompleted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart size={20} fill={isCompleted ? "currentColor" : "none"} />
          </button>
        </div>

        <div id="specialty-details-content" className="space-y-6">
          <div id="specialty-header" className="bg-white dark:bg-slate-800 rounded-[40px] p-8 pt-16 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center relative">
            <div className="w-36 h-36 bg-transparent rounded-[32px] flex items-center justify-center mb-6">
              {selectedSpecialty.logo ? (
                <img src={getImageUrl(selectedSpecialty.logo)} className="w-32 h-32 object-contain filter drop-shadow-sm" alt={selectedSpecialty.nome} referrerPolicy="no-referrer" />
              ) : (
                <Award size={48} className="text-slate-200 dark:text-slate-600" />
              )}
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight mb-2">
              {selectedSpecialty.nome}
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                  {selectedSpecialty.area}
                </span>
              </div>
              <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-full">
                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                  {selectedSpecialty.codigo || `${selectedSpecialty.sigla}${String(selectedSpecialty.id).padStart(3, '0')}`}
                </span>
              </div>
              {selectedSpecialty.nivel && (
                <div className="px-3 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-full border border-slate-100 dark:border-slate-600">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                    Nível {selectedSpecialty.nivel.toUpperCase().replace('NÍVEL', '').replace('NIVEL', '').trim()}
                  </span>
                </div>
              )}
              {selectedSpecialty.ano && (
                <div className="px-3 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-full border border-slate-100 dark:border-slate-600">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                    {selectedSpecialty.ano}
                  </span>
                </div>
              )}
              {selectedSpecialty.origem && (
                <div className="px-3 py-1 bg-slate-50 dark:bg-slate-700/50 rounded-full border border-slate-100 dark:border-slate-600">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                    {selectedSpecialty.origem}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div id="specialty-requirements-title" className="px-2 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {isMastery ? 'Especialidades e Requisitos' : 'Requisitos'}
              </h4>
            </div>
            
            <div className="space-y-3">
              {selectedSpecialty.requisitos.length > 0 ? (
                selectedSpecialty.requisitos.map((req, idx) => {
                  const trimmedReq = req.trim();
                  const matched = isMastery ? findMatchingSpecialty(trimmedReq, allSpecialtiesList) : null;
                  
                  // Se encontrou a especialidade correspondente, renderiza o card com miniatura
                  if (matched) {
                    const isMatchedCompleted = completedSpecialties.includes(matched.id.toString());
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          if (selectedSpecialty) {
                            setSpecialtyNavStack(prev => [...prev, selectedSpecialty]);
                          }
                          setSelectedSpecialty(matched);
                          if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-[24px] p-3.5 sm:p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
                      >
                        <div className="flex items-center space-x-3.5 sm:space-x-4 flex-1 min-w-0">
                          {/* Miniatura da Especialidade */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-center p-2 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                            {matched.logo ? (
                              <img 
                                src={getImageUrl(matched.logo)} 
                                alt={matched.nome} 
                                className="w-full h-full object-contain filter drop-shadow-sm" 
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            ) : (
                              <Award size={24} className="text-amber-500" />
                            )}
                          </div>

                          {/* Informações da Especialidade */}
                          <div className="flex-1 min-w-0 pr-2">
                            <h5 className="font-black text-slate-800 dark:text-white text-xs sm:text-[13px] uppercase tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                              {matched.nome}
                            </h5>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {matched.area && (
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                                  {matched.area}
                                </span>
                              )}
                              {matched.codigo && (
                                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                                  {matched.codigo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Indicadores e Ação */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {isMatchedCompleted && (
                            <div className="p-1.5 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-500" title="Especialidade guardada">
                              <Heart size={14} fill="currentColor" />
                            </div>
                          )}
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Se for uma instrução/cabeçalho de mestrado
                  const isInstruction = isMastery && (
                    trimmedReq.toLowerCase().startsWith('ter ') || 
                    trimmedReq.toLowerCase().startsWith('1 ter ') ||
                    trimmedReq.toLowerCase().startsWith('completar ') ||
                    trimmedReq.toLowerCase().includes('seguintes especialidades')
                  );

                  if (isInstruction) {
                    return (
                      <div key={idx} className="bg-gradient-to-r from-indigo-50/80 to-blue-50/50 dark:from-indigo-950/40 dark:to-slate-800/40 border border-indigo-100/80 dark:border-indigo-900/40 rounded-[22px] p-4 shadow-sm flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
                          <Info size={16} />
                        </div>
                        <p className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-tight leading-snug">
                          {trimmedReq}
                        </p>
                      </div>
                    );
                  }

                  // Requisito padrão
                  return (
                    <div key={idx} className="specialty-requirement-card bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-5 shadow-sm flex items-start space-x-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 flex-shrink-0"></div>
                      <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 leading-snug">
                        {trimmedReq}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-8 text-center">
                  <p className="text-slate-400 font-bold text-sm">Nenhum requisito listado no momento.</p>
                </div>
              )}
            </div>

            {/* Caso seja um Mestrado de área ampla com lista de especialidades válidas */}
            {isMastery && matchedCount < 3 && globalAreaSpecialties.length > 0 && (
              <div className="pt-4 space-y-3">
                <div className="px-2 flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    Especialidades Válidas ({globalAreaSpecialties.length})
                  </h4>
                </div>
                <div className="space-y-2.5">
                  {globalAreaSpecialties.map((esp) => {
                    const isEspCompleted = completedSpecialties.includes(esp.id.toString());
                    return (
                      <div 
                        key={esp.id}
                        onClick={() => {
                          if (selectedSpecialty) {
                            setSpecialtyNavStack(prev => [...prev, selectedSpecialty]);
                          }
                          setSelectedSpecialty(esp);
                          if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-[24px] p-3.5 sm:p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group"
                      >
                        <div className="flex items-center space-x-3.5 sm:space-x-4 flex-1 min-w-0">
                          {/* Miniatura da Especialidade */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-center p-2 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                            {esp.logo ? (
                              <img 
                                src={getImageUrl(esp.logo)} 
                                alt={esp.nome} 
                                className="w-full h-full object-contain filter drop-shadow-sm" 
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            ) : (
                              <Award size={24} className="text-amber-500" />
                            )}
                          </div>

                          {/* Informações da Especialidade */}
                          <div className="flex-1 min-w-0 pr-2">
                            <h5 className="font-black text-slate-800 dark:text-white text-xs sm:text-[13px] uppercase tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                              {esp.nome}
                            </h5>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {esp.area && (
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                                  {esp.area}
                                </span>
                              )}
                              {esp.codigo && (
                                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                                  {esp.codigo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Indicadores e Ação */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {isEspCompleted && (
                            <div className="p-1.5 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-500" title="Especialidade guardada">
                              <Heart size={14} fill="currentColor" />
                            </div>
                          )}
                          <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 transition-colors">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={generateSpecialtyPDF}
          disabled={isGeneratingPDF}
          className="w-full py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <Download size={18} />
          <span>{isGeneratingPDF ? 'Gerando...' : 'Gerar PDF da Especialidade'}</span>
        </button>

        {/* Botão de Ajuda da IA removido */}
      </div>
    );
  };
  const renderCultureMenu = () => (
    <div className="animate-slide-in space-y-4 pt-4 pb-28">
      {[
        { label: 'Ideais e Hino', icon: <Music size={24} />, color: 'bg-blue-500', action: () => setActiveSubView('IDEALS_ANTHEM') },
        { label: 'História', icon: <Globe size={24} />, color: 'bg-amber-500', action: () => setActiveSubView('HISTORY_LIST') },
        { label: 'Uniformes', icon: <Shirt size={24} />, color: 'bg-emerald-500', action: () => { setActiveAccordions([]); setActiveSubView('UNIFORMS'); } },
        { label: 'Emblemas', icon: <Shield size={24} />, color: 'bg-indigo-500', action: () => { setActiveAccordions([]); setActiveSubView('EMBLEMS'); } }
      ].map((item, i) => (
        <button 
          key={i}
          onClick={item.action}
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="flex-grow text-left">
            <h4 className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight">{item.label}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Explorar Conteúdo</p>
          </div>
          <ChevronRight size={20} className="text-slate-200 dark:text-slate-600" />
        </button>
      ))}
    </div>
  );

  const renderIdealsAnthem = () => (
    <div className="animate-slide-in space-y-6 pt-4 pb-28">
      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setActiveSubView('IDEALS')}
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-8 flex flex-col items-center justify-center space-y-4 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/50 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Sparkles size={40} />
          </div>
          <div className="text-center">
            <h4 className="font-black text-slate-800 dark:text-white text-xl uppercase tracking-tight">Ideais</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Voto, Lei, Alvo e mais</p>
          </div>
        </button>

        <button 
          onClick={() => setActiveSubView('ANTHEM')}
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-8 flex flex-col items-center justify-center space-y-4 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/50 rounded-3xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Music size={40} />
          </div>
          <div className="text-center">
            <h4 className="font-black text-slate-800 dark:text-white text-xl uppercase tracking-tight">Hino</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Letra e Áudio</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderIdeals = () => {
    const hasSeparateIdeals = culturaData?.voto || culturaData?.lei || culturaData?.alvo || culturaData?.lema || culturaData?.objetivo || culturaData?.voto_biblia;

    return (
      <div className="animate-slide-in space-y-6 pt-4 pb-28">
        <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
          
          {hasSeparateIdeals ? (
            <div className="space-y-8">
              {[
                { label: 'Voto', content: culturaData.voto },
                { label: 'Lei', content: culturaData.lei },
                { label: 'Alvo', content: culturaData.alvo },
                { label: 'Lema', content: culturaData.lema },
                { label: 'Objetivo', content: culturaData.objetivo },
                { label: 'Voto à Bíblia', content: culturaData.voto_biblia }
              ].filter(item => item.content).map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-px bg-slate-100 dark:bg-slate-700 flex-grow"></div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] whitespace-nowrap">{item.label}</span>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 flex-grow"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-200 font-bold text-base leading-relaxed text-center whitespace-pre-wrap px-4">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          ) : culturaData?.ideais ? (
            <div className="text-left space-y-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-slate-600 dark:text-slate-200 font-medium leading-relaxed">
                  {culturaData.ideais}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold text-sm">Conteúdo dos ideais em desenvolvimento...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnthem = () => {
    const isYouTube = culturaData?.hino_video?.includes('youtube.com') || culturaData?.hino_video?.includes('youtu.be');

    return (
      <div className="animate-slide-in space-y-6 pt-4 pb-28">
        <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          
          {culturaData?.hino_letra ? (
            <div className="text-left mb-8">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 text-center">
                {club === ClubType.PATHFINDER ? 'Hino dos Desbravadores' : 'Hino dos Aventureiros'}
              </h3>
              <div className="whitespace-pre-wrap text-slate-600 dark:text-slate-200 font-medium leading-relaxed text-center italic">
                {culturaData.hino_letra}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 font-bold text-sm mb-8">Conteúdo do hino em desenvolvimento...</p>
          )}

          {culturaData?.hino_video && (
            <div className="rounded-3xl overflow-hidden shadow-lg aspect-video bg-slate-900">
              {isYouTube ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${culturaData.hino_video.split('v=')[1]?.split('&')[0] || culturaData.hino_video.split('/').pop()}`}
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <video controls className="w-full h-full">
                  <source src={culturaData.hino_video} type="video/mp4" />
                  Seu navegador não suporta a reprodução de vídeos.
                </video>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryList = () => {
    const availableHistories = [
      { id: 'historia_mundial', label: 'Mundial' },
      { id: 'historia_america_sul', label: 'América do Sul' },
      { id: 'historia_argentina', label: 'Argentina' },
      { id: 'historia_bolivia', label: 'Bolívia' },
      { id: 'historia_brasil', label: 'Brasil' },
      { id: 'historia_chile', label: 'Chile' },
      { id: 'historia_colombia', label: 'Colômbia' },
      { id: 'historia_equador', label: 'Equador' },
      { id: 'historia_peru', label: 'Peru' },
      { id: 'historia_uruguai', label: 'Uruguai' }
    ].filter(item => {
      const content = (culturaData as any)?.[item.id];
      const image = (culturaData as any)?.[`${item.id}_img`];
      return (content && content.trim().length > 0) || image;
    });

    return (
      <div className="animate-slide-in space-y-4 pt-4 pb-28">
        {availableHistories.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
              <Globe size={40} />
            </div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhuma história disponível no momento.</p>
          </div>
        ) : (
          availableHistories.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                setSelectedHistory(item.id);
                setActiveSubView('HISTORY_DETAIL');
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700 shadow-inner shrink-0">
                  {(culturaData as any)?.[`${item.id}_img`] ? (
                    <img 
                      src={(culturaData as any)?.[`${item.id}_img`]} 
                      alt={item.label} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Globe size={22} className="text-amber-500" />
                  )}
                </div>
                <span className="font-black text-slate-700 dark:text-white uppercase tracking-tight">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-slate-300 dark:text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          ))
        )}
      </div>
    );
  };

  const renderHistoryDetail = () => {
    const historyMap: Record<string, string> = {
      historia_mundial: 'Mundial',
      historia_america_sul: 'América do Sul',
      historia_argentina: 'Argentina',
      historia_bolivia: 'Bolívia',
      historia_brasil: 'Brasil',
      historia_chile: 'Chile',
      historia_colombia: 'Colômbia',
      historia_equador: 'Equador',
      historia_peru: 'Peru',
      historia_uruguai: 'Uruguai'
    };

    const title = selectedHistory ? historyMap[selectedHistory] : '';
    const content = selectedHistory ? (culturaData as any)?.[selectedHistory] : '';
    const historyImage = selectedHistory ? (culturaData as any)?.[`${selectedHistory}_img`] : '';

    return (
      <div className="animate-slide-in space-y-6 pt-4 pb-28">
        <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              {historyImage && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
                  <img src={historyImage} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  {title}
                </h3>
                <div className="w-12 h-1 bg-indigo-500 rounded-full mt-1"></div>
              </div>
            </div>
          </div>

          {content ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-600 dark:text-slate-200 font-medium leading-relaxed">
                {content}
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold text-sm">História em desenvolvimento...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCulturaItem = (item: CulturaItem, depth = 0, index = 0) => {
    const isExpanded = activeAccordions.includes(item.id);

    const toggleAccordion = (id: string) => {
      setActiveAccordions(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };

    const imageBlocks = (item.blocks || []).filter(b => b.type === 'image' && b.content);
    const textBlocks = (item.blocks || []).filter(b => b.type !== 'image' && b.content);
    const hasAnyImages = Boolean(item.imagem) || imageBlocks.length > 0;
    const hasText = Boolean(item.descricao) || textBlocks.length > 0;
    const align = item.imageAlign || 'center';
    const imagePosition = item.imagePosition || 'top';
    const titleAlignClass = item.titleAlign === 'center' ? 'text-center' : item.titleAlign === 'right' ? 'text-right' : 'text-left';

    const renderItemContent = (isSubitem: boolean) => {
      const imagesNode = (
        <div className="flex flex-col items-center gap-3 shrink-0">
          {item.imagem && (
            <div className={`${getItemImageSizeClass(item.imageSize, isSubitem)} flex items-center justify-center`}>
              <img 
                src={getImageUrl(item.imagem)} 
                alt={item.titulo || ''} 
                className="w-full h-full object-contain filter drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          {imageBlocks.map((block) => (
            <div key={block.id} className={`${getItemImageSizeClass(item.imageSize, isSubitem)} flex items-center justify-center`}>
              <img 
                src={getImageUrl(block.content)} 
                alt="" 
                className="w-full h-full object-contain filter drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      );

      const textsNode = (
        <div className={`flex-1 space-y-3 ${titleAlignClass}`}>
          {item.descricao && (
            <div className={`text-slate-600 dark:text-slate-200 ${isSubitem ? 'text-[13px]' : 'text-sm'} leading-relaxed font-medium whitespace-pre-wrap`}>
              {item.descricao}
            </div>
          )}
          {textBlocks.map((block) => (
            <div key={block.id} className={`text-slate-600 dark:text-slate-200 ${isSubitem ? 'text-[13px]' : 'text-sm'} leading-relaxed font-medium whitespace-pre-wrap`}>
              {block.content}
            </div>
          ))}
        </div>
      );

      // Posição 'center' com imagem à esquerda ou à direita (lado a lado):
      if (imagePosition === 'center' && hasAnyImages && hasText) {
        if (align === 'right') {
          return (
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              {textsNode}
              {imagesNode}
            </div>
          );
        }
        if (align === 'left') {
          return (
            <div className="flex flex-row items-center justify-between gap-4 w-full">
              {imagesNode}
              {textsNode}
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            {imagesNode}
            {textsNode}
          </div>
        );
      }

      // Se alinhado lateralmente com texto
      if (hasAnyImages && hasText && align === 'right' && imagePosition !== 'bottom') {
        return (
          <div className="flex flex-row items-center justify-between gap-4 w-full">
            {textsNode}
            {imagesNode}
          </div>
        );
      }

      if (hasAnyImages && hasText && align === 'left' && imagePosition !== 'bottom') {
        return (
          <div className="flex flex-row items-center justify-between gap-4 w-full">
            {imagesNode}
            {textsNode}
          </div>
        );
      }

      // Posição 'bottom': imagem ABAIXO do texto
      if (imagePosition === 'bottom') {
        return (
          <div className="space-y-4">
            {hasText && textsNode}
            {hasAnyImages && (
              <div className={`flex flex-col gap-3 ${align === 'right' ? 'items-end' : align === 'left' ? 'items-start' : 'items-center justify-center'}`}>
                {imagesNode}
              </div>
            )}
          </div>
        );
      }

      // Posição 'top' (padrão)
      return (
        <div className="space-y-4">
          {hasAnyImages && (
            <div className={`flex flex-col gap-3 ${align === 'right' ? 'items-end' : align === 'left' ? 'items-start' : 'items-center justify-center'}`}>
              {imagesNode}
            </div>
          )}
          {hasText && textsNode}
        </div>
      );
    };

    // Se for um sub-item (profundidade > 0)
    if (depth > 0) {
      return (
        <div key={item.id} className="py-6 first:pt-2 last:pb-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 overflow-hidden">
          {/* 1. TÍTULO DO SUB-ITEM */}
          <h5 className={`text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 ${titleAlignClass}`}>
            {item.titulo}
          </h5>

          {item.subtitulo && (
            <span className={`inline-block text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3 block ${titleAlignClass}`}>
              {item.subtitulo}
            </span>
          )}
          
          <div className="space-y-4">
            {renderItemContent(true)}
          </div>

          {item.subitems && item.subitems.length > 0 && (
            <div className="mt-6 pl-4 border-l-2 border-slate-100 dark:border-slate-700 space-y-6">
              {item.subitems.map((sub, i) => renderCulturaItem(sub, depth + 1, i))}
            </div>
          )}
        </div>
      );
    }
    
    // Ícone dinâmico baseado no título para o card principal
    const getHeaderIcon = (title: string) => {
      const t = title.toLowerCase();
      if (t.includes('emblema')) return <Shield size={22} />;
      if (t.includes('uniforme')) return <Shirt size={22} />;
      return <FileText size={22} />;
    };

    return (
      <div key={item.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] shadow-sm overflow-hidden mb-4">
        <button 
          onClick={() => toggleAccordion(item.id)}
          className={`w-full p-6 flex items-center justify-between transition-all text-left ${isExpanded ? 'bg-slate-50/30 dark:bg-slate-700/30' : 'bg-white dark:bg-slate-800'}`}
        >
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              {getHeaderIcon(item.titulo)}
            </div>
            <div className={`flex-1 ${titleAlignClass}`}>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{item.titulo || 'Sem Título'}</h4>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ml-2 ${isExpanded ? 'bg-indigo-600 text-white rotate-180 shadow-md dark:shadow-none' : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-200'}`}>
            <ChevronDown size={18} />
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-6 bg-white dark:bg-slate-800 border-t border-slate-50 dark:border-slate-700/50 animate-slide-down">
            <div className="space-y-6 pt-4">
              {/* 1. SUBTÍTULO CASO EXISTA */}
              {item.subtitulo && (
                <div className={titleAlignClass}>
                  <h5 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {item.subtitulo}
                  </h5>
                  <div className={`w-8 h-1 bg-indigo-500 mt-2 rounded-full opacity-30 ${item.titleAlign === 'center' ? 'mx-auto' : item.titleAlign === 'right' ? 'ml-auto' : ''}`} />
                </div>
              )}

              {/* 2. CONTEÚDO (TEXTO E IMAGEM CONFORME ORIENTAÇÃO E POSIÇÃO) */}
              {renderItemContent(false)}
              
              {item.subitems && item.subitems.length > 0 && (
                <div className="mt-8 divide-y divide-slate-100 dark:divide-slate-700/50 border-t border-slate-100 dark:border-slate-700/50">
                  {item.subitems.map((sub, i) => renderCulturaItem(sub, depth + 1, i))}
                </div>
              )}

              {!item.imagem && !item.descricao && (!item.blocks || item.blocks.length === 0) && (!item.subitems || item.subitems.length === 0) && (
                <p className="text-center py-10 text-slate-300 dark:text-slate-600 italic text-xs">Nenhum conteúdo cadastrado para este item.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUniforms = () => {
    const rawList = normalizeCulturaList(culturaData?.uniformes_list);
    const uniforms = rawList.filter(item => !item.club || item.club === club);
    
    return (
      <div className="animate-slide-in space-y-6 pt-4 pb-28">
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[60vh]">
          {uniforms.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 dark:text-slate-700">
                <Shirt size={40} />
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">Nenhum uniforme cadastrado</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {uniforms.map((item, i) => renderCulturaItem(item, 0, i))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmblems = () => {
    const rawList = normalizeCulturaList(culturaData?.emblemas_list);
    const emblems = rawList.filter(item => !item.club || item.club === club);
    
    return (
      <div className="animate-slide-in space-y-6 pt-4 pb-28">
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 min-h-[60vh]">
          {emblems.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200 dark:text-slate-700">
                <Shield size={40} />
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">Nenhum emblema cadastrado</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {emblems.map((item, i) => renderCulturaItem(item, 0, i))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatDriveUrl = (url: string) => {
    if (!url) return url;
    
    // Google Drive
    if (url.includes('drive.google.com')) {
      // Converte links de visualização/compartilhamento para links de preview incorporáveis
      if (url.includes('/view')) {
        return url.replace('/view', '/preview');
      }
      if (url.includes('/sharing') || url.includes('usp=sharing')) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
          return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
      }
      if (url.includes('id=')) {
        const id = url.split('id=')[1].split('&')[0];
        return `https://drive.google.com/file/d/${id}/preview`;
      }
      if (url.includes('/file/d/')) {
        const parts = url.split('/file/d/');
        if (parts.length > 1) {
          const id = parts[1].split('/')[0];
          return `https://drive.google.com/file/d/${id}/preview`;
        }
      }
    }
    
    // Google Docs/Sheets/Slides
    if (url.includes('docs.google.com')) {
      if (url.includes('/edit')) {
        return url.replace('/edit', '/preview');
      }
      if (!url.includes('/preview') && !url.includes('/pub')) {
        return `${url}${url.includes('?') ? '&' : '?'}embedded=true`;
      }
    }
    
    // Fallback for other PDF links using Google Docs Viewer
    if ((url.toLowerCase().endsWith('.pdf') || url.includes('.pdf?')) && !url.includes('google.com')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    
    return url;
  };

  const renderLibraryMenu = () => {
    const categories = isPathfinder ? [
      { id: 'BOOKS', label: 'Livros', icon: <Book size={24} />, color: 'bg-emerald-500' },
      { id: 'MANUAIS', label: 'Manuais DBV', icon: <FileText size={24} />, color: 'bg-indigo-500' },
      { id: 'MATERIALS', label: 'Materiais', icon: <Folder size={24} />, color: 'bg-purple-500' }
    ] : [
      { id: 'BOOKS_AVT', label: 'Livros', icon: <Book size={24} />, color: 'bg-emerald-500' },
      { id: 'MANUAIS_AVT', label: 'Manuais AVT', icon: <FileText size={24} />, color: 'bg-indigo-500' }
    ];

    if (selectedLibraryCategory && selectedLibraryCategory !== 'MATERIALS') {
      let currentData: any[] = [];
      if (selectedLibraryCategory === 'CLASSES') currentData = livrosClasses;
      if (selectedLibraryCategory === 'ANO') currentData = livrosAno;
      if (selectedLibraryCategory === 'OUTROS') currentData = outrosLivros;
      if (selectedLibraryCategory === 'MANUAIS') currentData = manuaisDBV;
      if (selectedLibraryCategory === 'BOOKS_AVT') currentData = livrosAVT;
      if (selectedLibraryCategory === 'MANUAIS_AVT') currentData = manuaisAVT;

      return (
        <div className="animate-slide-in space-y-4 pt-2 pb-28">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">
            {selectedLibraryCategory === 'CLASSES' ? 'Livro das Classes' : 
             selectedLibraryCategory === 'ANO' ? 'Livros do Ano' : 
             selectedLibraryCategory === 'OUTROS' ? 'Outros Livros' : 
             selectedLibraryCategory === 'MANUAIS' ? 'Manuais DBV' :
             selectedLibraryCategory === 'BOOKS_AVT' ? 'Livros Aventureiros' : 'Manuais Aventureiros'}
          </h3>

          {currentData.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum item disponível.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentData.map((item: any) => (
                <button 
                  key={item.id}
                  onClick={() => {
                    const url = item.Conteudo || item.PDF;
                    if (url && (url.startsWith('http') || url.includes('.pdf'))) {
                      setPdfTitle(item.Nome);
                      setSelectedPdfUrl(formatDriveUrl(url));
                      setActiveSubView('PDF_VIEWER');
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-4 flex items-center space-x-4 shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden"
                >
                  {selectedLibraryCategory === 'CLASSES' && item.ClasseIMG && (
                    <img 
                      src={item.ClasseIMG} 
                      className="absolute -top-1 -right-1 w-14 h-14 object-contain opacity-20 group-hover:opacity-40 transition-opacity translate-x-1 -translate-y-1"
                      alt=""
                    />
                  )}
                  <div className="w-16 h-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                    {item.Capa || item.capa ? (
                      <img src={item.Capa || item.capa} className="w-full h-full object-cover" alt={item.Nome} referrerPolicy="no-referrer" />
                    ) : (
                      <Book size={24} className="text-slate-200 dark:text-slate-600" />
                    )}
                  </div>
                  <div className="flex-grow text-left">
                    <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight line-clamp-1">{item.Nome}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-2">{item.Resumo || item.Descricao || 'Sem descrição'}</p>
                    {item.Ano && <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[8px] font-black rounded-full uppercase">{item.Ano}</span>}
                    {item.Classe && <span className="inline-block mt-2 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[8px] font-black rounded-full uppercase">{item.Classe}</span>}
                  </div>
                  <ChevronRight size={18} className="text-slate-200 dark:text-slate-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="animate-slide-in space-y-4 pt-2 pb-28">
        {categories.map((item) => (
          <button 
            key={item.id}
            onClick={() => {
              if (item.id === 'MATERIALS') {
                setActiveSubView('MATERIALS');
              } else if (item.id === 'BOOKS') {
                setActiveSubView('LIBRARY_BOOKS_MENU');
              } else {
                setSelectedLibraryCategory(item.id as any);
              }
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div className="flex-grow text-left">
              <h4 className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight">{item.label}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Acessar Arquivos</p>
            </div>
            <ChevronRight size={20} className="text-slate-200 dark:text-slate-600" />
          </button>
        ))}
      </div>
    );
  };

  const renderLibraryBooksMenu = () => (
    <div className="animate-slide-in space-y-4 pt-2 pb-28">
      {[
        { id: 'CLASSES', label: 'Livro das Classes', icon: <Layers size={24} />, color: 'bg-amber-500' },
        { id: 'ANO', label: 'Livros do Ano', icon: <Calendar size={24} />, color: 'bg-emerald-500' },
        { id: 'OUTROS', label: 'Outros Livros', icon: <BookOpen size={24} />, color: 'bg-blue-500' }
      ].map((item) => (
        <button 
          key={item.id}
          onClick={() => {
            setSelectedLibraryCategory(item.id as any);
            setActiveSubView('LIBRARY');
          }}
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="flex-grow text-left">
            <h4 className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight">{item.label}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Acessar Livros</p>
          </div>
          <ChevronRight size={20} className="text-slate-200 dark:text-slate-600" />
        </button>
      ))}
    </div>
  );

  const renderPdfViewer = () => (
    <div className="animate-slide-in h-full flex flex-col fixed inset-0 z-[100] bg-slate-200 dark:bg-slate-950">
      <div className="flex-grow relative flex flex-col">
        <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <button 
            onClick={() => setActiveSubView('LIBRARY')}
            className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all active:scale-90"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[200px]">
            {pdfTitle}
          </h3>

          <a 
            href={selectedPdfUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 transition-all active:scale-90"
          >
            <ExternalLink size={20} />
          </a>
        </div>
        {selectedPdfUrl ? (
          <iframe 
            src={selectedPdfUrl} 
            className="w-full h-full border-none flex-grow"
            title={pdfTitle}
            allow="autoplay"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            PDF não disponível
          </div>
        )}
      </div>
    </div>
  );

  const renderMaterialsMenu = () => (
    <div className="animate-slide-in space-y-4 pt-2 pb-28">
      {[
        { id: 'CAMPING', label: 'Camping', icon: <MapPin size={24} />, color: 'bg-orange-500' },
        { id: 'FORMULARIOS', label: 'Formulários', icon: <FileText size={24} />, color: 'bg-red-500' }
      ].map((item) => (
        <button 
          key={item.id}
          onClick={() => setActiveSubView(item.id as any)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="flex-grow text-left">
            <h4 className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight">{item.label}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Acessar Materiais</p>
          </div>
          <ChevronRight size={20} className="text-slate-200 dark:text-slate-600" />
        </button>
      ))}
    </div>
  );

  const renderCamping = () => (
    <div className="animate-slide-in space-y-4 pt-2 pb-28">
      <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">Camping</h3>

      {campingDBV.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum material de camping disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campingDBV.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                const url = item.Conteudo;
                if (url && (url.startsWith('http') || url.includes('.pdf'))) {
                  setPdfTitle(item.Nome);
                  setSelectedPdfUrl(formatDriveUrl(url));
                  setActiveSubView('PDF_VIEWER');
                }
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-4 flex items-center space-x-4 shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                {item.Capa ? (
                  <img src={item.Capa} className="w-full h-full object-cover" alt={item.Nome} referrerPolicy="no-referrer" />
                ) : (
                  <MapPin size={32} className="text-slate-200 dark:text-slate-600" />
                )}
              </div>
              <div className="flex-grow text-left">
                <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">{item.Nome}</h4>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Clique para abrir</p>
              </div>
              <ChevronRight size={18} className="text-slate-200 dark:text-slate-600" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderFormularios = () => {
    const categories = [
      { id: 'fichas', label: 'Fichas de Atividades', icon: <FileText size={18} /> },
      { id: 'forms', label: 'Formulários', icon: <Layers size={18} /> },
      { id: 'certificados', label: 'Certificados', icon: <Award size={18} /> },
      { id: 'graficos', label: 'Materiais Gráficos', icon: <Sparkles size={18} /> }
    ];

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-3">
            <div className="flex items-center space-x-3 pl-1">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                {cat.icon}
              </div>
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{cat.label}</h3>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[24px] p-3 border-l-4 border-red-500 space-y-3 shadow-sm">
              {formularios.filter(f => f.categoria === cat.id).length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-400">
                      <Calendar size={20} />
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-tight">Em Breve Atualizações</span>
                  </div>
                  <div className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-400">
                    <Search size={16} />
                  </div>
                </div>
              ) : (
                formularios.filter(f => f.categoria === cat.id).map((form) => (
                  <button 
                    key={form.id}
                    onClick={() => {
                      if (form.link && (form.link.includes('.pdf') || form.link.includes('drive.google.com'))) {
                        setPdfTitle(form.titulo);
                        setSelectedPdfUrl(formatDriveUrl(form.link));
                        setActiveSubView('PDF_VIEWER');
                      } else {
                        window.open(form.link, '_blank');
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-800 rounded-[18px] p-4 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700 active:scale-[0.98] transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-tight block">{form.titulo}</span>
                        {form.descricao && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{form.descricao}</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(form.link, '_blank');
                        }}
                        className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Download / Abrir Original"
                      >
                        <Download size={16} />
                      </button>
                      <div className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                        <Search size={16} />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}

        {isUserAdmin && (
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center space-x-2">
              <Settings size={16} className="text-red-500" />
              <span>Painel Admin: Formulários</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Adicione novos links para todos os usuários.</p>
            
            <button 
              onClick={() => alert("Funcionalidade de adicionar formulário em desenvolvimento...")}
              className="w-full py-3 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Plus size={16} />
              <span>Novo Formulário</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderDesbravaPlus = () => (
    <div className="animate-slide-in space-y-5 pt-4 pb-28">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-slate-300 dark:border-t-slate-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {desbravaPlusItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => {
                setSelectedDesbravaPlusItem(item);
                // Se o PDF ou o conteúdo for um link, abre o PDF viewer diretamente
                const hasPdfLink = item.PDF && (item.PDF.startsWith('http') || item.PDF.includes('.pdf'));
                const hasConteudoLink = item.Conteudo && (item.Conteudo.startsWith('http') || item.Conteudo.includes('.pdf'));
                
                if (hasPdfLink || hasConteudoLink) {
                  setActiveSubView('DESBRAVA_PLUS_PDF');
                } else {
                  setActiveSubView('DESBRAVA_PLUS_DETAILS');
                }
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] flex flex-col p-5 relative shadow-sm active:scale-[0.98] transition-all overflow-hidden group"
            >
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {item.Capa ? (
                    <img src={item.Capa} className="w-full h-full object-cover" alt={item.Nome} referrerPolicy="no-referrer" />
                  ) : (
                    <Sparkles size={32} className="text-slate-200 dark:text-slate-600" />
                  )}
                </div>

                <div className="flex-grow text-left">
                  <h4 className="font-black text-[#1e293b] dark:text-white text-lg leading-tight tracking-tight uppercase">
                    {item.Nome}
                  </h4>
                  {item.descricao && (
                    <p className="text-[11px] text-slate-400 font-bold mt-1 line-clamp-2">
                      {item.descricao}
                    </p>
                  )}
                </div>
                
                <ChevronRight size={20} className="text-slate-200 dark:text-slate-600 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderDesbravaPlusDetails = () => {
    if (!selectedDesbravaPlusItem) return null;

    return (
      <div className="animate-slide-in space-y-4 pt-1 pb-28">
        {/* Barra Sticky com Botão Voltar */}
        <div className={`sticky top-0 z-30 flex items-center justify-between py-2 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 transition-all duration-300 ${
          isHeaderScrolled 
            ? 'bg-[#F8FAFC]/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800' 
            : 'bg-transparent -mb-[64px] pointer-events-none'
        }`}>
          <button 
            onClick={() => setActiveSubView('DESBRAVA_PLUS')}
            className={`w-11 h-11 rounded-2xl active:scale-90 transition-all flex items-center justify-center pointer-events-auto ${
              isHeaderScrolled
                ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm ml-0'
                : 'bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-sm ml-3 sm:ml-4'
            }`}
            title="Voltar"
            aria-label="Voltar"
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
          <div className={`text-center flex-1 px-3 truncate transition-all duration-300 ${isHeaderScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight truncate">
              {selectedDesbravaPlusItem.Nome}
            </h4>
          </div>
          <div className="w-11 h-11" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[40px] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="h-56 w-full relative">
            {selectedDesbravaPlusItem.Capa ? (
              <img src={selectedDesbravaPlusItem.Capa} className="w-full h-full object-cover" alt={selectedDesbravaPlusItem.Nome} referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center">
                <Sparkles size={64} className="text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                {selectedDesbravaPlusItem.Nome}
              </h3>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em]">Descrição</h4>
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-relaxed">
                {selectedDesbravaPlusItem.descricao}
              </p>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-700 w-full"></div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Conteúdo</h4>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 text-slate-700 dark:text-slate-300 font-medium text-[15px] leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-slate-700">
                {selectedDesbravaPlusItem.Conteudo}
              </div>
            </div>

            {selectedDesbravaPlusItem.PDF && (
              <button 
                onClick={() => setActiveSubView('DESBRAVA_PLUS_PDF')}
                className="w-full bg-indigo-600 text-white p-6 rounded-[32px] shadow-lg flex items-center justify-between group active:scale-[0.98] transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Documento PDF</p>
                    <h4 className="font-black text-sm uppercase tracking-tight">Abrir PDF no App</h4>
                  </div>
                </div>
                <ChevronRight size={20} className="text-white/40 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Botão de Ajuda da IA removido */}
      </div>
    );
  };

  const renderDesbravaPlusPdf = () => {
    if (!selectedDesbravaPlusItem) return null;
    
    // Usa PDF como link se presente, senão tenta Conteudo (se for link)
    let pdfUrl = selectedDesbravaPlusItem.PDF || '';
    
    // Se não tem PDF mas o conteúdo parece um link, usa o conteúdo
    if (!pdfUrl && selectedDesbravaPlusItem.Conteudo?.startsWith('http')) {
      pdfUrl = selectedDesbravaPlusItem.Conteudo;
    }
    
    if (!pdfUrl || !pdfUrl.startsWith('http')) {
      return (
        <div className="animate-slide-in p-8 text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FileText size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-400 font-bold mb-6">Link inválido ou não encontrado para este item.</p>
          <button 
            onClick={() => setActiveSubView('DESBRAVA_PLUS')} 
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
          >
            Voltar
          </button>
        </div>
      );
    }

    const formattedUrl = formatDriveUrl(pdfUrl);

    return (
      <div className="animate-slide-in h-full flex flex-col fixed inset-0 z-[100] bg-slate-200 dark:bg-slate-950">
        <div className="flex-grow flex flex-col relative">
          <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <button 
              onClick={() => setActiveSubView('DESBRAVA_PLUS')}
              className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all active:scale-90"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[200px]">
              {selectedDesbravaPlusItem.Nome}
            </h3>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 transition-all active:scale-90"
            >
              <ExternalLink size={20} />
            </a>
          </div>
          <iframe 
            src={formattedUrl} 
            className="w-full h-full border-none flex-grow"
            title={selectedDesbravaPlusItem.Nome}
            allow="autoplay"
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (selectedBibleBook && selectedBibleChapter !== null) {
      const reading = { book: selectedBibleBook, chapter: selectedBibleChapter };
      setLastRead(reading);
      localStorage.setItem('dbv_tudo_bible_last_read', JSON.stringify(reading));
    }
  }, [selectedBibleBook, selectedBibleChapter]);

  const renderBible = () => {
    const handleShareVerse = () => {
      const text = `"Ó terra, terra, terra! Ouve a palavra do SENHOR!" - Jeremias 22:29`;
      if (navigator.share) {
        navigator.share({
          title: 'Versículo do Dia',
          text: text,
          url: window.location.href,
        }).catch(console.error);
      } else {
        navigator.clipboard.writeText(text);
        alert('Versículo copiado para a área de transferência!');
      }
    };

    return (
      <div className="animate-slide-in space-y-4 pt-1 pb-10">
        {/* Barra de Voltar Fixa no Topo */}
        <div className="sticky top-0 z-30 flex items-center justify-between py-2 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 bg-[#F8FAFC]/90 dark:bg-slate-900/90 backdrop-blur-md transition-all">
          <button 
            onClick={() => setActiveSubView('MAIN')}
            className="w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-200 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center"
            title="Voltar"
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
          <div className={`text-center transition-all duration-300 ${isHeaderScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight">Bíblia Sagrada</h4>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">ARC</p>
          </div>
          <div className="w-11 h-11" />
        </div>

        {/* Header Bíblia Sagrada */}
        <div className="bg-[#0f172a] rounded-[40px] p-8 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          </div>
          
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1 relative z-10 mt-2">Bíblia Sagrada</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8 relative z-10">Versão Almeida Revista e Corrigida</p>
          
          {/* Versículo do Dia */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 text-left shadow-inner relative z-10 border border-white/10 dark:border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Versículo do Dia</h4>
              <button 
                onClick={handleShareVerse}
                className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 active:scale-90 transition-all"
              >
                <Share2 size={14} />
              </button>
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-sm leading-relaxed mb-3 italic">
              "Ó terra, terra, terra! Ouve a palavra do SENHOR!"
            </p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Jeremias 22:29</p>
          </div>
        </div>

        {/* Menu de Ações da Bíblia */}
        <div className="flex justify-center w-full">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-sm sm:max-w-md">
            {[
              { label: 'Bíblia', icon: <Book size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5} />, color: 'text-blue-500 dark:text-blue-400', border: 'border-blue-200 dark:border-slate-700', action: () => setActiveSubView('BIBLE_BOOKS') },
              { label: 'Devocional', icon: <Heart size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5} />, color: 'text-emerald-500 dark:text-emerald-400', border: 'border-emerald-200 dark:border-slate-700', action: () => {
                setSelectedDevocional(null);
                setActiveSubView('BIBLE_DEVOTIONAL_VIEW');
              } },
              { label: 'Mais', icon: <Layers size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5} />, color: 'text-slate-400 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', action: () => setActiveSubView('BIBLE_MORE') }
            ].map((item, i) => (
              <button 
                key={i} 
                onClick={item.action} 
                className={`w-full aspect-square sm:aspect-auto sm:h-28 max-w-[130px] sm:max-w-[140px] mx-auto bg-white dark:bg-slate-800 border-2 ${item.border} rounded-[24px] sm:rounded-[28px] flex flex-col items-center justify-center space-y-2 sm:space-y-2.5 p-3 shadow-sm hover:shadow-md active:scale-95 transition-all group`}
              >
                <div className={`${item.color} group-hover:scale-110 transition-transform flex items-center justify-center`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center leading-tight ${item.color}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Histórico/Leituras Recentes */}
        <div className="pt-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-2">
            {lastRead ? 'Leitura Recente' : 'Nenhuma leitura recente'}
          </h4>
          
          {lastRead ? (
            <button 
              onClick={() => {
                setSelectedBibleBook(lastRead.book);
                setSelectedBibleChapter(lastRead.chapter);
                setActiveSubView('BIBLE_VERSES');
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500"></div>
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                  <BookOpen size={28} />
                </div>
                <div className="text-left">
                  <h5 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                    {lastRead.book.book_name} {lastRead.chapter}
                  </h5>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Continuar lendo</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </button>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-700 p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-500 mb-4 shadow-sm">
                <BookOpen size={32} />
              </div>
              <p className="text-slate-400 font-bold text-xs">Comece sua jornada espiritual hoje</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBibleBooks = () => {
    const filteredBooks = bibleBooks.filter(book => {
      const search = bibleSearch.toLowerCase();
      const matchesSearch = book.book_name.toLowerCase().includes(search) || 
                           book.book_abbrev.toLowerCase().includes(search);
      
      const bookTestament = (book.testament || '').toLowerCase();
      const matchesTestament = selectedTestament === 'TODOS' || 
                              (selectedTestament === 'ANTIGO' && bookTestament.includes('antigo')) ||
                              (selectedTestament === 'NOVO' && bookTestament.includes('novo'));
      
      return matchesSearch && matchesTestament;
    });

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">BÍBLIA SAGRADA</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">ARC - ALMEIDA REVISTA E CORRIGIDA</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <HomeIcon size={20} className="text-blue-200" />
              <Book size={20} className="text-blue-200" />
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros com botões AT e NT no lado direito */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Buscar livro..."
              value={bibleSearch}
              onChange={(e) => setBibleSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 dark:text-white focus:outline-none shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button 
              onClick={() => setSelectedTestament(selectedTestament === 'ANTIGO' ? 'TODOS' : 'ANTIGO')}
              className={`h-12 min-w-[46px] px-3 rounded-2xl text-xs font-black tracking-wider transition-all flex items-center justify-center border active:scale-95 shadow-sm ${
                selectedTestament === 'ANTIGO' 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400/30' 
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'
              }`}
              title="Antigo Testamento"
            >
              AT
            </button>
            <button 
              onClick={() => setSelectedTestament(selectedTestament === 'NOVO' ? 'TODOS' : 'NOVO')}
              className={`h-12 min-w-[46px] px-3 rounded-2xl text-xs font-black tracking-wider transition-all flex items-center justify-center border active:scale-95 shadow-sm ${
                selectedTestament === 'NOVO' 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400/30' 
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'
              }`}
              title="Novo Testamento"
            >
              NT
            </button>
          </div>
        </div>

        {/* Lista de Livros */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {selectedTestament === 'ANTIGO' ? 'Antigo Testamento (39 livros)' : selectedTestament === 'NOVO' ? 'Novo Testamento (27 livros)' : `${filteredBooks.length} livros`}
            </h4>
            {selectedTestament !== 'TODOS' && (
              <button 
                onClick={() => setSelectedTestament('TODOS')}
                className="text-[10px] font-bold text-blue-500 hover:underline"
              >
                Mostrar todos
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredBooks.map((book) => (
                <button 
                  key={book.id}
                  onClick={() => {
                    setSelectedBibleBook(book);
                    setActiveSubView('BIBLE_CHAPTERS');
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
                      {book.book_abbrev}
                    </div>
                    <div className="text-left">
                      <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{book.book_name}</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{book.total_chapters} capítulos</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBibleChapters = () => {
    if (!selectedBibleBook) return null;
    
    const chapters = Array.from({ length: selectedBibleBook.total_chapters }, (_, i) => i + 1);

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE_BOOKS')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">{selectedBibleBook.book_name}</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">CAPÍTULO</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Capítulos */}
        <div className="grid grid-cols-4 gap-3">
          {chapters.map((chapter) => (
            <button 
              key={chapter}
              onClick={() => {
                setSelectedBibleChapter(chapter);
                setActiveSubView('BIBLE_VERSES');
              }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl aspect-square flex items-center justify-center shadow-sm active:scale-90 transition-all group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              <span className="font-black text-slate-700 dark:text-white text-lg">{chapter}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderBibleVerses = () => {
    if (!selectedBibleBook || selectedBibleChapter === null) return null;

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE_CHAPTERS')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  {bibleSettings.chapterStyle === 'Capítulo N' ? 'Capítulo ' : ''}{selectedBibleChapter} - {selectedBibleBook.book_name}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Versículos */}
        <div className={`space-y-4 p-4 rounded-[32px] transition-all ${bibleSettings.darkMode ? 'bg-slate-900 text-white' : ''}`}>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {bibleVerses.map((verse) => {
                const isMarked = markedVerses.some(v => v.id === verse.id);
                return (
                  <div 
                    key={verse.id} 
                    onClick={() => toggleMarkVerse(verse)}
                    className={`flex space-x-4 p-4 rounded-[24px] transition-all cursor-pointer border-l-4 ${
                      isMarked 
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500 shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className={`${bibleSettings.darkMode ? 'text-blue-400' : 'text-blue-500'} font-black text-[10px] pt-1 min-w-[20px]`}>{verse.verse_number}</span>
                    <p 
                      className={`${bibleSettings.darkMode ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'} font-bold leading-relaxed text-justify`}
                      style={{ fontSize: `${bibleSettings.fontSize}px` }}
                    >
                      {verse.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBibleMarkedVerses = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE_MORE')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">MARCADOS</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">{markedVerses.length} VERSÍCULOS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Versículos Marcados */}
        <div className={`space-y-4 p-4 rounded-[32px] transition-all ${bibleSettings.darkMode ? 'bg-slate-900 text-white' : ''}`}>
          {markedVerses.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 mx-auto mb-4">
                <Heart size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhum versículo marcado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {markedVerses.map((verse) => (
                <div 
                  key={verse.id} 
                  className="bg-amber-50/80 dark:bg-amber-950/30 border-l-4 border-amber-400 dark:border-amber-500 rounded-[24px] p-6 shadow-sm relative group"
                >
                  <button 
                    onClick={() => toggleMarkVerse(verse)}
                    className="absolute top-4 right-4 text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                  <div className="mb-3">
                    <span className={`${bibleSettings.darkMode ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'} font-black text-[10px] uppercase tracking-widest`}>
                      {verse.book_name} {verse.chapter}:{verse.verse_number}
                    </span>
                  </div>
                  <p 
                    className={`${bibleSettings.darkMode ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'} font-bold leading-relaxed text-justify`}
                    style={{ fontSize: `${bibleSettings.fontSize}px` }}
                  >
                    {verse.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBibleDictionary = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE_MORE')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">DICIONÁRIO</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">BÍBLICO</p>
              </div>
            </div>
          </div>
        </div>

        {/* Busca no Dicionário */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Pesquisar termo..." 
            value={dictionarySearch}
            onChange={(e) => setDictionarySearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] py-4 pl-12 pr-6 text-sm font-bold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={20} />
        </div>

        {/* Lista de Termos */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : bibleDictionary.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 mx-auto mb-4">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhum termo encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bibleDictionary.map((entry) => (
                <div 
                  key={entry.id} 
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-6 shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-blue-600 dark:text-blue-400 font-black text-lg uppercase tracking-tight">{entry.nome}</h4>
                    {entry.categoria && (
                      <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {entry.categoria}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-relaxed text-justify mb-4">
                    {entry.texto}
                  </p>
                  {entry.referencia && (
                    <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
                      <Book size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{entry.referencia}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isAdmin = userEmail === 'ronaldosonic@gmail.com' || userEmail === 'dbvtudo2024@gmail.com';

  const renderBibleMore = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">MAIS OPÇÕES</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">BÍBLIA SAGRADA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Opções */}
        <div className="grid grid-cols-1 gap-4">
          {[
            { label: 'Versículos Marcados', icon: <Heart size={24} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40', action: () => setActiveSubView('BIBLE_MARKED_VERSES') },
            { label: 'Dicionário Bíblico', icon: <BookOpen size={24} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', action: () => setActiveSubView('BIBLE_DICTIONARY') },
            { label: 'Anotações', icon: <FileText size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', action: () => setActiveSubView('BIBLE_NOTES') },
            { label: 'Configurações', icon: <Settings size={24} />, color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-700', action: () => setActiveSubView('BIBLE_SETTINGS') }
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={item.action}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-[13px] font-black text-slate-700 dark:text-white uppercase tracking-tight">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-200 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCultureAdminMenu = () => (
    <div className="animate-slide-in space-y-6 pt-2 pb-28">
      <div className="grid grid-cols-1 gap-4 px-4">
        {[
          { id: 'IDEALS', label: 'Editar Ideais', icon: <Sparkles size={24} />, color: 'bg-blue-500' },
          { id: 'ANTHEM', label: 'Editar Hino', icon: <Music size={24} />, color: 'bg-emerald-500' },
          { id: 'HISTORY', label: 'Editar História', icon: <Globe size={24} />, color: 'bg-slate-500' },
          { id: 'UNIFORMS', label: 'Editar Uniformes', icon: <Shirt size={24} />, color: 'bg-amber-500' },
          { id: 'EMBLEMS', label: 'Editar Emblemas', icon: <Shield size={24} />, color: 'bg-red-500' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => {
              setCultureAdminTab(item.id as any);
              setActiveSubView('CULTURE_ADMIN');
            }}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-5 shadow-sm active:scale-95 transition-all group"
          >
            <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-white group-hover:opacity-90 transition-opacity shadow-lg shadow-${item.color.split('-')[1]}-500/20`}>
              {item.icon}
            </div>
            <div className="text-left flex-1">
              <h4 className="font-black text-slate-800 dark:text-white text-lg uppercase tracking-tight">{item.label}</h4>
              <p className="text-slate-400 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">Gerenciar conteúdo</p>
            </div>
            <ChevronRight size={20} className="text-slate-200 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );

  const renderAchievementsAdmin = () => {
    const handleSaveConquista = async () => {
      if (!newConquista.nome || !newConquista.imagem_colorida || !newConquista.imagem_cinza) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }
      setIsSavingConquista(true);
      const { error } = await updateConquista(newConquista);
      setIsSavingConquista(false);
      if (error) {
        alert("Erro ao salvar conquista: " + error.message);
      } else {
        setNewConquista({
          nome: '',
          tipo: 'CLASSE_REGULAR',
          imagem_colorida: '',
          imagem_cinza: '',
          ordem: 0,
          shape: 'CIRCLE'
        });
        setConquistaEditId(null);
        fetchConquistas().then(setAllConquistas).catch(err => console.warn("Erro ao recarregar conquistas:", err));
      }
    };

    const handleDeleteConquista = async (id: number) => {
      if (confirm("Tem certeza que deseja excluir esta conquista?")) {
        setIsDeletingConquista(true);
        const { error } = await deleteConquista(id);
        setIsDeletingConquista(false);
        if (error) alert("Erro ao excluir: " + error.message);
        else fetchConquistas().then(setAllConquistas).catch(err => console.warn("Erro ao recarregar conquistas:", err));
      }
    };

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28 px-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {conquistaEditId ? 'Editar Conquista' : 'Nova Conquista'}
          </h3>
          
          <div className="space-y-4">
            <input 
              type="text"
              placeholder="Nome da Conquista"
              value={newConquista.nome}
              onChange={(e) => setNewConquista({...newConquista, nome: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <select 
                value={newConquista.tipo}
                onChange={(e) => setNewConquista({...newConquista, tipo: e.target.value as any})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white"
              >
                <option value="INSIGNIA">Insignia</option>
                <option value="CLASSE_REGULAR">Classe Regular</option>
                <option value="CLASSE_AVANCADA">Classe Avançada</option>
                <option value="LIDERANCA">Liderança</option>
              </select>
              
              <select 
                value={newConquista.shape}
                onChange={(e) => setNewConquista({...newConquista, shape: e.target.value as any})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white"
              >
                <option value="CIRCLE">Circular</option>
                <option value="RECTANGLE">Retangular</option>
                <option value="OVAL">Oval</option>
                <option value="FLAG">Bandeira</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Imagem Colorida</label>
              <input 
                type="text"
                placeholder="https://..."
                value={newConquista.imagem_colorida}
                onChange={(e) => setNewConquista({...newConquista, imagem_colorida: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Imagem Cinza</label>
              <input 
                type="text"
                placeholder="https://..."
                value={newConquista.imagem_cinza}
                onChange={(e) => setNewConquista({...newConquista, imagem_cinza: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-20">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ordem</label>
                <input 
                  type="number"
                  value={newConquista.ordem}
                  onChange={(e) => setNewConquista({...newConquista, ordem: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white"
                />
              </div>
              <button 
                onClick={handleSaveConquista}
                disabled={isSavingConquista}
                className="flex-grow bg-indigo-600 py-4 rounded-[20px] text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                {isSavingConquista ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                <span>{conquistaEditId ? 'Atualizar' : 'Salvar Conquista'}</span>
              </button>
            </div>
            
            {conquistaEditId && (
              <button 
                onClick={() => {
                  setConquistaEditId(null);
                  setNewConquista({ nome: '', tipo: 'CLASSE_REGULAR', imagem_colorida: '', imagem_cinza: '', ordem: 0, shape: 'CIRCLE' });
                }}
                className="w-full py-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 mt-8">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Conquistas Cadastradas</h4>
          {allConquistas.map((con) => (
            <div key={con.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                  <img src={con.imagem_colorida} className="w-10 h-10 object-contain" alt="" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">{con.nome}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{con.tipo} - Ordem: {con.ordem}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => {
                    setNewConquista(con);
                    setConquistaEditId(con.id);
                  }}
                  className="p-2 text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
                >
                  <Settings size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteConquista(con.id)}
                  className="p-2 text-red-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBibleAdmin = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Painel Admin</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => setActiveSubView('BIBLE_ADMIN_ADD')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Plus size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Adicionar Devocional</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Criar novo conteúdo diário</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveSubView('CULTURE_ADMIN_MENU')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Music size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Cultura e Tradição</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Editar Ideais e Hino</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveSubView('VIDEO_ADMIN')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Video size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão de Vídeos</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Adicionar e remover vídeos</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveSubView('FORM_ADMIN')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileText size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão de Formulários</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Links de formulários externos</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveSubView('LINKS_ADMIN')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white group-hover:opacity-90 transition-opacity shadow-lg">
              <ExternalLink size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Links Úteis</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">SGC, Cartão, Clubes</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveSubView('ACHIEVEMENTS_ADMIN')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white group-hover:opacity-90 transition-opacity shadow-lg">
              <Award size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão de Conquistas</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Insignias, Classes e Liderança</p>
            </div>
          </button>

          <button 
            onClick={() => setActiveSubView('TRUNFOS_ADMIN')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Trophy size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão de Trunfos</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Trunfos, Eventos e Histórias</p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  const renderLinksAdmin = () => (
    <div className="animate-slide-in space-y-6 pt-2 pb-28">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gerenciar Links</h3>
      </div>

      <div className={`bg-white dark:bg-slate-800 rounded-[32px] p-6 border ${editingLinkId ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700'} shadow-sm space-y-4`}>
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest flex items-center space-x-2">
            {editingLinkId ? <Edit2 size={16} className="text-amber-500" /> : <Plus size={16} className="text-indigo-600" />}
            <span>{editingLinkId ? 'Editar Link' : 'Adicionar Novo Link'}</span>
          </h4>
          {editingLinkId && (
            <button 
              onClick={() => {
                setEditingLinkId(null);
                setNewLink({ name: '', url: '' });
              }}
              className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          )}
        </div>
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Nome do Link (ex: SGC)"
            value={newLink.name}
            onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <input 
            type="text" 
            placeholder="URL do Link"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          {editingLinkId ? (
            <div className="flex space-x-2">
              <button 
                onClick={async () => {
                  if (!newLink.name || !newLink.url) return;
                  await updateAppLink({ id: editingLinkId, name: newLink.name, url: newLink.url });
                  setNewLink({ name: '', url: '' });
                  setEditingLinkId(null);
                  const links = await fetchAppLinks();
                  setAppLinks(links);
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Check size={16} />
                <span>Salvar Alterações</span>
              </button>
              <button 
                onClick={() => {
                  setEditingLinkId(null);
                  setNewLink({ name: '', url: '' });
                }}
                className="px-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button 
              onClick={async () => {
                if (!newLink.name || !newLink.url) return;
                await updateAppLink({ name: newLink.name, url: newLink.url });
                setNewLink({ name: '', url: '' });
                const links = await fetchAppLinks();
                setAppLinks(links);
              }}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg dark:shadow-none active:scale-95 transition-all"
            >
              Salvar Link
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Links Atuais</h4>
        {appLinks.map((link) => (
          <div key={link.id} className={`bg-white dark:bg-slate-800 border ${editingLinkId === link.id ? 'border-amber-400 dark:border-amber-500' : 'border-slate-100 dark:border-slate-700'} rounded-[28px] p-4 flex items-center justify-between shadow-sm`}>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center text-indigo-500">
                <ExternalLink size={20} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">{link.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{link.url}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => {
                  setNewLink({ name: link.name, url: link.url });
                  setEditingLinkId(link.id);
                }}
                className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors"
                title="Editar Link"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={async () => {
                  if (confirm(`Excluir o link "${link.name}"?`)) {
                    await deleteAppLink(link.id);
                    const links = await fetchAppLinks();
                    setAppLinks(links);
                    if (editingLinkId === link.id) {
                      setEditingLinkId(null);
                      setNewLink({ name: '', url: '' });
                    }
                  }
                }}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                title="Excluir Link"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWebViewer = () => (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col animate-slide-up">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <button 
          onClick={() => setActiveSubView('MAIN')}
          className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-slate-600 dark:text-slate-200" />
        </button>
        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[200px]">
          {webTitle}
        </h3>
        <div className="w-10"></div>
      </div>
      <div className="flex-grow w-full h-full overflow-hidden">
        {selectedWebUrl ? (
          <iframe 
            src={selectedWebUrl} 
            className="w-full h-full border-none"
            title="Web Viewer"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 font-bold uppercase tracking-widest">Carregando...</p>
          </div>
        )}
      </div>
    </div>
  );

  const handleSaveTrunfo = async () => {
    if (!newTrunfo.titulo || !newTrunfo.titulo.trim()) {
      alert("Por favor, informe o título do evento.");
      return;
    }

    setIsSavingTrunfo(true);
    const payload: Partial<Trunfo> = {
      ...newTrunfo,
      id: editingTrunfoId || undefined,
      club: newTrunfo.club || (club === ClubType.PATHFINDER ? 'PATHFINDER' : 'ADVENTURER')
    };

    const { error } = await updateTrunfo(payload);
    if (!error) {
      const clubType = club === ClubType.PATHFINDER ? 'PATHFINDER' : 'ADVENTURER';
      const updatedList = await fetchTrunfos(clubType);
      setTrunfos(updatedList);
      setEditingTrunfoId(null);
      setNewTrunfo({
        titulo: '',
        ano: '',
        imagem: '',
        historia: '',
        club: club
      });
      alert(editingTrunfoId ? "Trunfo atualizado com sucesso!" : "Trunfo adicionado com sucesso!");
    } else {
      alert("Erro ao salvar trunfo.");
    }
    setIsSavingTrunfo(false);
  };

  const handleDeleteTrunfo = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este trunfo?")) {
      const numId = Number(id);
      // Atualização otimista imediata na UI
      setTrunfos(prev => prev.filter(t => Number(t.id) !== numId));
      if (editingTrunfoId === numId) {
        setEditingTrunfoId(null);
        setNewTrunfo({
          titulo: '',
          ano: '',
          imagem: '',
          historia: '',
          club: club
        });
      }
      
      const res = await deleteTrunfo(numId);
      const clubType = club === ClubType.PATHFINDER ? 'PATHFINDER' : 'ADVENTURER';
      const updatedList = await fetchTrunfos(clubType);
      setTrunfos(updatedList);
      
      if (!res || !res.error) {
        // Sucesso silencioso ou feedback
      } else {
        alert("Erro ao remover o trunfo no servidor: " + (res.error?.message || "Tente novamente"));
      }
    }
  };

  const handleTrunfoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawResult = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1000;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setNewTrunfo(prev => ({ ...prev, imagem: compressed }));
          } else {
            setNewTrunfo(prev => ({ ...prev, imagem: rawResult }));
          }
        };
        img.onerror = () => {
          setNewTrunfo(prev => ({ ...prev, imagem: rawResult }));
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTrunfos = () => {
    const filteredTrunfos = trunfos.filter(t => 
      t.titulo.toLowerCase().includes(trunfoSearchQuery.toLowerCase()) ||
      (t.ano && t.ano.includes(trunfoSearchQuery)) ||
      (t.historia && t.historia.toLowerCase().includes(trunfoSearchQuery.toLowerCase()))
    );

    // Ordenar trunfos por ano (mais recente primeiro) e depois por título
    const sortedTrunfos = [...filteredTrunfos].sort((a, b) => {
      const yearA = parseInt(a.ano || '0', 10) || 0;
      const yearB = parseInt(b.ano || '0', 10) || 0;
      if (yearB !== yearA) return yearB - yearA;
      return (a.titulo || '').localeCompare(b.titulo || '');
    });

    return (
      <div className="animate-slide-in space-y-6 pt-1 pb-24">
        {/* Barra de Pesquisa e Ações de Administrador */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Pesquisar trunfo por evento ou ano..."
              value={trunfoSearchQuery}
              onChange={(e) => setTrunfoSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-sm"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            {trunfoSearchQuery && (
              <button 
                onClick={() => setTrunfoSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {(isAdmin || isUserAdmin) && (
            <button
              onClick={() => setActiveSubView('TRUNFOS_ADMIN')}
              className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-5 py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center space-x-2 shadow-md transition-all flex-shrink-0"
            >
              <Plus size={16} />
              <span>Gerenciar / Excluir</span>
            </button>
          )}
        </div>

        {/* Listagem de Trunfos em Grid Unificado */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-teal-500 rounded-full animate-spin"></div>
          </div>
        ) : sortedTrunfos.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
            <Trophy size={48} className="text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
              {trunfoSearchQuery ? 'Nenhum trunfo encontrado para sua busca.' : 'Nenhum trunfo cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedTrunfos.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTrunfoModal(item)}
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-3.5 flex flex-col items-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all group"
              >
                {/* Miniatura */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden p-2 mb-3 border border-slate-100 dark:border-slate-800/60 group-hover:scale-105 transition-transform">
                  {item.imagem ? (
                    <img 
                      src={getImageUrl(item.imagem)} 
                      alt={item.titulo}
                      className="w-full h-full object-contain drop-shadow-sm"
                      loading="lazy"
                    />
                  ) : (
                    <Trophy size={36} className="text-teal-500 opacity-60" />
                  )}
                </div>

                {/* Título do Evento */}
                <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight leading-tight line-clamp-2 w-full px-1">
                  {item.titulo}
                </h4>

                {item.ano && (
                  <span className="mt-1.5 px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {item.ano}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTrunfosAdmin = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão de Trunfos</h3>
        </div>

        {/* Formulário de Adicionar / Editar */}
        <div className={`bg-white dark:bg-slate-800 rounded-[32px] p-6 border ${editingTrunfoId ? 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700'} shadow-sm space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest flex items-center space-x-2">
              {editingTrunfoId ? <Edit2 size={16} className="text-amber-500" /> : <Plus size={16} className="text-teal-600" />}
              <span>{editingTrunfoId ? 'Editar Trunfo' : 'Adicionar Novo Trunfo'}</span>
            </h4>
            {editingTrunfoId && (
              <button 
                onClick={() => {
                  setEditingTrunfoId(null);
                  setNewTrunfo({ titulo: '', ano: '', imagem: '', historia: '', club: club });
                }}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Título do Evento */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento</label>
              <input 
                type="text" 
                placeholder="Ex: V Campori Sul-Americano de Desbravadores"
                value={newTrunfo.titulo}
                onChange={(e) => setNewTrunfo({ ...newTrunfo, titulo: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>

            {/* Ano e Clube */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano do Evento</label>
                <input 
                  type="text" 
                  placeholder="Ex: 2019"
                  value={newTrunfo.ano}
                  onChange={(e) => setNewTrunfo({ ...newTrunfo, ano: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clube</label>
                <select 
                  value={newTrunfo.club || club}
                  onChange={(e) => setNewTrunfo({ ...newTrunfo, club: e.target.value as any })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 transition-all"
                >
                  <option value="PATHFINDER">Desbravadores</option>
                  <option value="ADVENTURER">Aventureiros</option>
                  <option value="ALL">Ambos os Clubes</option>
                </select>
              </div>
            </div>

            {/* Imagem */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagem do Trunfo (URL ou Upload)</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="URL da imagem (ex: https://...)"
                  value={newTrunfo.imagem}
                  onChange={(e) => setNewTrunfo({ ...newTrunfo, imagem: e.target.value })}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 transition-all"
                />
                <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-200 font-black text-xs uppercase tracking-wider transition-all">
                  <ImageIcon size={18} className="mr-1" />
                  <span>Upload</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleTrunfoImageUpload}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Preview da Imagem */}
            {newTrunfo.imagem && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center space-x-3 border border-slate-100 dark:border-slate-700">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                  <img src={getImageUrl(newTrunfo.imagem)} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Pré-visualização da Imagem</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-xs">{newTrunfo.imagem.slice(0, 50)}...</p>
                </div>
                <button 
                  onClick={() => setNewTrunfo({ ...newTrunfo, imagem: '' })}
                  className="text-slate-400 hover:text-red-500 p-2"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Texto Principal / História */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">História / Texto Principal</label>
              <textarea 
                placeholder="Escreva a história e detalhes deste evento/trunfo..."
                value={newTrunfo.historia}
                onChange={(e) => setNewTrunfo({ ...newTrunfo, historia: e.target.value })}
                rows={5}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 transition-all resize-none"
              />
            </div>

            {/* Botões de Ação */}
            {editingTrunfoId ? (
              <div className="flex space-x-2">
                <button 
                  onClick={handleSaveTrunfo}
                  disabled={isSavingTrunfo}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  {isSavingTrunfo ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Check size={16} />}
                  <span>Salvar Alterações</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingTrunfoId(null);
                    setNewTrunfo({ titulo: '', ano: '', imagem: '', historia: '', club: club });
                  }}
                  className="px-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSaveTrunfo}
                disabled={isSavingTrunfo}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                {isSavingTrunfo ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Plus size={16} />}
                <span>Adicionar Trunfo</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Trunfos Cadastrados */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Trunfos Cadastrados ({trunfos.length})</h4>
          {trunfos.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum trunfo cadastrado</p>
          ) : (
            [...trunfos].sort((a, b) => {
              const yearA = parseInt(a.ano || '0', 10) || 0;
              const yearB = parseInt(b.ano || '0', 10) || 0;
              if (yearB !== yearA) return yearB - yearA;
              return (b.id || 0) - (a.id || 0);
            }).map((t) => (
              <div 
                key={t.id} 
                className={`bg-white dark:bg-slate-800 border ${editingTrunfoId === t.id ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700'} rounded-[28px] p-4 flex items-center justify-between shadow-sm`}
              >
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-1 border border-slate-100 dark:border-slate-800 flex-shrink-0 overflow-hidden">
                    {t.imagem ? (
                      <img src={getImageUrl(t.imagem)} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Trophy size={20} className="text-teal-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight truncate">{t.titulo}</h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                      {t.ano && <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase">{t.ano}</span>}
                      <span className="text-[10px] text-slate-400 uppercase">| {t.club === 'ADVENTURER' ? 'Aventureiros' : t.club === 'ALL' ? 'Ambos' : 'Desbravadores'}</span>
                    </div>
                    {t.historia && (
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">{t.historia}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 ml-2">
                  <button 
                    onClick={() => {
                      setNewTrunfo({
                        titulo: t.titulo,
                        ano: t.ano || '',
                        imagem: t.imagem || '',
                        historia: t.historia || '',
                        club: t.club || club
                      });
                      setEditingTrunfoId(t.id);
                      scrollToTop();
                    }}
                    className="p-2.5 text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl transition-all active:scale-95"
                    title="Editar Trunfo"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteTrunfo(t.id)}
                    className="p-2.5 text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-all active:scale-95"
                    title="Excluir Trunfo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderBibleAdminAdd = () => {
    const handleSaveDevocional = async () => {
      if (!newDevocional.titulo || !newDevocional.texto) {
        alert("Preencha o título e o texto do devocional.");
        return;
      }

      setIsLoading(true);
      const { data, error } = await createDevocional({
        titulo: newDevocional.titulo!,
        link: newDevocional.link,
        texto: newDevocional.texto!,
        agendado_para: newDevocional.agendado_para!,
      });

      if (error) {
        alert("Erro ao salvar devocional: " + error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        setDevocionais([data, ...devocionais]);
      }
      
      setNewDevocional({
        titulo: 'Devocional Diário',
        link: '',
        texto: '',
        agendado_para: new Date().toISOString().slice(0, 16)
      });
      setIsLoading(false);
      alert("Devocional agendado com sucesso!");
      setActiveSubView('BIBLE_ADMIN');
    };

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Formulário */}
        <div className="space-y-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">TÍTULO DO DEVOCIONAL</label>
            <input 
              type="text" 
              value={newDevocional.titulo}
              onChange={(e) => setNewDevocional({...newDevocional, titulo: e.target.value})}
              placeholder="Devocional Diário"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">LINK DO VÍDEO OU CONTEÚDO</label>
            <input 
              type="text" 
              value={newDevocional.link}
              onChange={(e) => setNewDevocional({...newDevocional, link: e.target.value})}
              placeholder="Link do YouTube ou site"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">TEXTO DO DEVOCIONAL</label>
            <textarea 
              value={newDevocional.texto}
              onChange={(e) => setNewDevocional({...newDevocional, texto: e.target.value})}
              placeholder="Escreva a mensagem do dia..."
              rows={6}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">AGENDAR PARA</label>
            <div className="relative">
              <input 
                type="datetime-local" 
                value={newDevocional.agendado_para}
                onChange={(e) => setNewDevocional({...newDevocional, agendado_para: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveDevocional}
            className="w-full py-4 bg-[#dc371b] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg dark:shadow-none active:scale-95 transition-all mt-4"
          >
            SALVAR
          </button>
        </div>
      </div>
    );
  };

  const renderBibleDevotionalList = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        <div className="space-y-4">
          {devocionais.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <p className="text-slate-400 font-bold text-sm">Nenhum devocional agendado.</p>
            </div>
          ) : (
            devocionais.map((dev) => (
              <div key={dev.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-black text-slate-800 dark:text-white text-base">{dev.titulo}</h5>
                  <button 
                    onClick={async () => {
                      if (window.confirm("Deseja realmente excluir este devocional?")) {
                        const { error } = await deleteDevocional(dev.id);
                        if (error) {
                          alert("Erro ao excluir: " + error.message);
                        } else {
                          setDevocionais(devocionais.filter(d => d.id !== dev.id));
                        }
                      }
                    }}
                    className="text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">
                  {new Date(dev.agendado_para).toLocaleString('pt-BR')}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-sm font-bold line-clamp-2 mb-4">{dev.texto}</p>
                <button 
                  onClick={() => {
                    setSelectedDevocional(dev);
                    setActiveSubView('BIBLE_DEVOTIONAL_VIEW');
                  }}
                  className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1"
                >
                  <span>Ver Detalhes</span>
                  <ChevronRight size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderBibleDevotionalView = () => {
    // Se não houver devocional selecionado, tenta encontrar o de hoje
    let currentDev = selectedDevocional;
    if (!currentDev) {
      const today = new Date().toISOString().split('T')[0];
      currentDev = devocionais.find(d => d.agendado_para.startsWith(today));
    }

    // Devocionais anteriores (que já passaram da data/hora agendada)
    const now = new Date();
    const previousDevs = devocionais
      .filter(d => {
        const devDate = new Date(d.agendado_para);
        // Só mostra se já passou e não é o que está sendo exibido no topo
        return devDate <= now && d.id !== currentDev?.id;
      })
      .sort((a, b) => new Date(b.agendado_para).getTime() - new Date(a.agendado_para).getTime());

    return (
      <div className="animate-slide-in h-full flex flex-col pt-1 pb-28">
        {/* Cabeçalho Customizado Fixo no Topo */}
        <div className="sticky top-0 z-30 flex items-center justify-between mb-4 py-2 px-3 bg-[#F8FAFC]/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => {
              if (isAdmin && selectedDevocional) {
                setActiveSubView('BIBLE_DEVOTIONAL_LIST');
              } else {
                setActiveSubView('BIBLE');
              }
            }}
            className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-300 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <div className="text-center">
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Meditação</h3>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Devocional</p>
          </div>
          <div className="w-11"></div> {/* Espaçador para centralizar */}
        </div>

        <div className="space-y-6 overflow-y-auto scrollbar-hide px-1 pb-10">
          {/* Devocional do Dia ou Estado Vazio */}
          {currentDev ? (
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{currentDev.titulo}</h2>
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-px bg-blue-100 dark:bg-blue-900 w-8"></div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                    {new Date(currentDev.agendado_para).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="h-px bg-blue-100 dark:bg-blue-900 w-8"></div>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-700 w-full opacity-50"></div>

              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 dark:text-slate-300 font-bold text-[17px] leading-[1.8] text-justify whitespace-pre-wrap selection:bg-blue-100 selection:text-blue-900">
                  {currentDev.texto}
                </p>
              </div>

              {currentDev.link && (
                <a 
                  href={currentDev.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center space-x-3 shadow-xl dark:shadow-none active:scale-[0.98] transition-all group"
                >
                  <Video size={18} className="group-hover:scale-110 transition-transform" />
                  <span>Assistir Conteúdo em Vídeo</span>
                </a>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-[40px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 mx-auto mb-6">
                <Heart size={40} className="animate-pulse" />
              </div>
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-2">Momento de Reflexão</p>
              <p className="text-slate-300 dark:text-slate-500 font-bold text-sm">Nenhum devocional disponível no momento.</p>
            </div>
          )}

        {/* Devocionais Anteriores */}
        {previousDevs.length > 0 && (
          <div className="space-y-4 pt-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Anteriores</h4>
            <div className="grid grid-cols-1 gap-3">
              {previousDevs.map((dev) => (
                <button 
                  key={dev.id}
                  onClick={() => {
                    setSelectedDevocional(dev);
                    scrollToTop();
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center space-x-4 shadow-sm active:scale-[0.98] transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Heart size={20} />
                  </div>
                  <div className="flex-grow">
                    <h5 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight line-clamp-1">{dev.titulo}</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {new Date(dev.agendado_para).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 dark:text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    );
  };

  const renderBibleSettings = () => {
    const handleClearData = () => {
      if (window.confirm("Tem certeza que deseja limpar todos os dados da Bíblia? Isso removerá anotações, versículos marcados e progresso.")) {
        setBibleNotes([]);
        setMarkedVerses([]);
        setLastRead(null);
        localStorage.removeItem('bibleNotes');
        localStorage.removeItem('markedVerses');
        localStorage.removeItem('dbv_tudo_bible_last_read');
        alert("Dados limpos com sucesso!");
      }
    };

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE_MORE')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">CONFIGURAÇÕES</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">BÍBLIA SAGRADA</p>
              </div>
            </div>
            <Settings size={24} className="text-blue-200" />
          </div>
        </div>

        {/* Aparência */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">Aparência</h4>
              <p className="text-slate-400 text-[10px] font-bold">Modo Escuro</p>
              <p className="text-slate-300 dark:text-slate-500 text-[9px]">Alterna entre tema claro e escuro</p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={bibleSettings.darkMode}
                onChange={(e) => setBibleSettings({...bibleSettings, darkMode: e.target.checked})}
                className="w-4 h-4 rounded border-slate-200 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{bibleSettings.darkMode ? 'Ligado' : 'Desligado'}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tamanho da Fonte</p>
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{bibleSettings.fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="32" 
              value={bibleSettings.fontSize}
              onChange={(e) => setBibleSettings({...bibleSettings, fontSize: parseInt(e.target.value)})}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-slate-300 dark:text-slate-500 text-[9px]">Ajuste a leitura da Bíblia</p>
          </div>
        </div>

        {/* Notificações */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">Notificações</h4>
              <p className="text-slate-400 text-[10px] font-bold">Lembrete Diário</p>
              <p className="text-slate-300 dark:text-slate-500 text-[9px]">Receba o versículo do dia</p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={bibleSettings.dailyReminder}
                onChange={(e) => setBibleSettings({...bibleSettings, dailyReminder: e.target.checked})}
                className="w-4 h-4 rounded border-slate-200 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{bibleSettings.dailyReminder ? 'Ligado' : 'Desligado'}</span>
            </div>
          </div>
        </div>

        {/* Estilo de Capítulos */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 shadow-sm space-y-3">
          <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">Estilo de Capítulos</h4>
          <select 
            value={bibleSettings.chapterStyle}
            onChange={(e) => setBibleSettings({...bibleSettings, chapterStyle: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="Capítulo N">Exibir "Capítulo N"</option>
            <option value="Apenas N">Exibir apenas o número</option>
          </select>
        </div>

        {/* Dados */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 shadow-sm space-y-3">
          <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">Dados</h4>
          <button 
            onClick={handleClearData}
            className="px-6 py-3 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg dark:shadow-none active:scale-95 transition-all"
          >
            Limpar Todos os Dados
          </button>
          <p className="text-slate-300 dark:text-slate-500 text-[9px]">Remove anotações, favoritos e progresso</p>
        </div>

        {/* Versão da Bíblia */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 shadow-sm space-y-3">
          <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">Versão da Bíblia</h4>
          <select 
            value={bibleSettings.bibleVersion}
            onChange={(e) => setBibleSettings({...bibleSettings, bibleVersion: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="Almeida Revista e Corrigida">Almeida Revista e Corrigida</option>
            <option value="Nova Versão Internacional">Nova Versão Internacional (NVI)</option>
            <option value="Nova Almeida Atualizada">Nova Almeida Atualizada (NAA)</option>
          </select>
        </div>

        <button 
          onClick={() => setActiveSubView('BIBLE_MORE')}
          className="w-full py-4 bg-[#1e40af] text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 active:scale-95 transition-all"
        >
          Salvar Alterações
        </button>
      </div>
    );
  };

  const renderBibleNotes = () => {
    const filteredNotes = bibleNotes.filter(n => 
      n.title.toLowerCase().includes(noteSearch.toLowerCase()) || 
      n.reference.toLowerCase().includes(noteSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noteSearch.toLowerCase())
    );

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveSubView('BIBLE_MORE')}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all active:scale-90"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">ANOTAÇÕES</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">BÍBLIA SAGRADA</p>
              </div>
            </div>
            <FileText size={24} className="text-blue-200" />
          </div>
        </div>

        {/* Formulário de Nova Anotação */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
              <input 
                type="text" 
                placeholder="Título" 
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência</label>
              <input 
                type="text" 
                placeholder="Ex: Hebreus 11:1" 
                value={newNote.reference}
                onChange={(e) => setNewNote({...newNote, reference: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Anotação</label>
            <textarea 
              placeholder="Escreva sua anotação..." 
              value={newNote.content}
              onChange={(e) => setNewNote({...newNote, content: e.target.value})}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          <button 
            onClick={handleSaveNote}
            className="w-full py-4 bg-[#dc371b] text-white rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 shadow-lg dark:shadow-none active:scale-95 transition-all"
          >
            <Save size={18} />
            <span>Salvar Anotação</span>
          </button>
        </div>

        {/* Busca de Anotações */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar anotações..." 
            value={noteSearch}
            onChange={(e) => setNoteSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] py-4 pl-12 pr-24 text-sm font-bold text-slate-700 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={20} />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Buscar
          </button>
        </div>

        {/* Lista de Anotações */}
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 mx-auto mb-4">
                <FileText size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhuma anotação encontrada.</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div 
                key={note.id} 
                className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-6 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-black text-slate-800 dark:text-white text-base leading-tight">{note.title}</h5>
                    <p className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest mt-1">{note.reference}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-relaxed mb-4">
                  {note.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">{note.date}</span>
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-500">
                      <Plus size={12} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderVideoPlayer = () => {
    if (!selectedVideo) return null;
    const videoId = getYouTubeId(selectedVideo.link);

    return (
      <div className="animate-slide-in space-y-6 pt-4 pb-28">
        <div className="bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="aspect-video bg-black">
            {videoId ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={selectedVideo.titulo}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white flex-col space-y-4">
                <Video size={48} className="opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Link inválido ou não suportado</p>
                <button 
                  onClick={() => window.open(selectedVideo.link, '_blank')}
                  className="bg-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  Abrir no YouTube
                </button>
              </div>
            )}
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{selectedVideo.titulo}</h3>
              <p className="text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest mt-1">{selectedVideo.canal}</p>
            </div>
            <div className="flex items-center space-x-6 pt-2 border-t border-slate-50 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">{selectedVideo.duracao}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visualizações</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">{selectedVideo.visualizacoes}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-slate-800 rounded-[28px] p-6 border border-red-100/50 dark:border-slate-700">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-red-500 shadow-sm flex-shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-red-900 dark:text-white uppercase tracking-tight">Dica de Estudo</h4>
              <p className="text-red-700/70 dark:text-slate-300 text-xs font-medium leading-relaxed mt-1">
                Assista ao vídeo com atenção e faça anotações. Se for um requisito de classe, lembre-se de preencher seu relatório após assistir.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVideos = () => {
    const categories = [...videoCategories.filter(c => c.club === club)].sort((a, b) => {
      if (a.id === -3) return -1;
      if (b.id === -3) return 1;
      return 0;
    });
    const clubVideos = videos.filter(v => v.club === club);

    const getDailyVideos = (videoList: VideoType[], count: number = 4) => {
      if (videoList.length <= count) return videoList;
      const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const startIndex = day % videoList.length;
      const result = [];
      for (let i = 0; i < count; i++) {
        result.push(videoList[(startIndex + i) % videoList.length]);
      }
      return result;
    };

    return (
      <div className="animate-slide-in space-y-8 pt-4 pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
            <Video size={48} className="text-slate-100 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum vídeo disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map(category => {
              const categoryVideos = getDailyVideos(clubVideos.filter(v => v.categoria_id === category.id));
              if (categoryVideos.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center space-x-3 px-2">
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center shadow-sm">
                      <Folder size={20} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{category.nome}</h4>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-[32px] p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
                    {categoryVideos.map(video => (
                      <button 
                        key={video.id}
                        onClick={() => {
                          setSelectedVideo(video);
                          setActiveSubView('VIDEO_PLAYER');
                        }}
                        className="w-full flex items-center space-x-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all active:scale-[0.98] group"
                      >
                        <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Video size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight whitespace-normal break-words">{video.titulo}</h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{video.canal}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{video.duracao}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              {video.visualizacoes.toLowerCase().includes('visualiza') 
                                ? video.visualizacoes 
                                : `${video.visualizacoes} visualizações`}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-200 dark:text-slate-600 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderFaixa = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-4 pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : completedSpecialties.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
            <Award size={48} className="text-slate-100 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 dark:text-slate-400 font-bold text-sm">Você ainda não tem especialidades na sua faixa.</p>
            <button 
              onClick={() => setActiveSubView('SPECIALTIES')}
              className="mt-6 text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] tracking-widest underline underline-offset-4"
            >
              Explorar Especialidades
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {/* Como não temos todas as especialidades carregadas aqui, 
                mostramos apenas os IDs ou carregamos se necessário.
                Para uma melhor experiência, idealmente carregaríamos os detalhes.
            */}
            <p className="col-span-3 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest py-10">
              Acesse seu Perfil para ver os detalhes da sua faixa completa.
            </p>
          </div>
        )}
      </div>
    );
  };

  const handleCreateVideo = async () => {
    if (!newVideo.titulo || !newVideo.link || !newVideo.categoria_id) {
      return;
    }
    setIsLoading(true);
    if (editingVideoId) {
      const { data, error } = await updateVideo({ ...newVideo, id: editingVideoId });
      if (!error) {
        setVideos(videos.map(v => v.id === editingVideoId ? (data as VideoType) : v));
        setEditingVideoId(null);
        setNewVideo({
          titulo: '',
          canal: '',
          duracao: '',
          visualizacoes: '0',
          link: '',
          categoria_id: 0,
          club: club
        });
      } else {
        console.error("Erro ao atualizar vídeo:", error);
      }
    } else {
      const { data, error } = await createVideo(newVideo as Omit<VideoType, 'id' | 'created_at'>);
      if (!error) {
        setVideos([...videos, data as VideoType]);
        setNewVideo({
          titulo: '',
          canal: '',
          duracao: '',
          visualizacoes: '0',
          link: '',
          categoria_id: 0,
          club: club
        });
      } else {
        console.error("Erro ao criar vídeo:", error);
      }
    }
    setIsLoading(false);
  };

  const handleDeleteVideo = async (id: number) => {
    setIsLoading(true);
    const { error } = await deleteVideo(id);
    if (!error) {
      setVideos(videos.filter(v => v.id !== id));
      if (editingVideoId === id) {
        setEditingVideoId(null);
        setNewVideo({
          titulo: '',
          canal: '',
          duracao: '',
          visualizacoes: '0',
          link: '',
          categoria_id: 0,
          club: club
        });
      }
    }
    setIsLoading(false);
  };

  const handleCreateVideoCategory = async () => {
    if (!newVideoCategory.nome) return;
    setIsLoading(true);
    const { data, error } = await createVideoCategory(newVideoCategory as Omit<VideoCategory, 'id'>);
    if (!error) {
      setVideoCategories([...videoCategories, data as VideoCategory]);
      setNewVideoCategory({ nome: '', icone: 'Folder', club: club });
    } else {
      console.error("Erro ao criar categoria de vídeo:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteVideoCategory = async (id: number) => {
    setIsLoading(true);
    const { error } = await deleteVideoCategory(id);
    if (!error) {
      setVideoCategories(videoCategories.filter(c => c.id !== id));
    }
    setIsLoading(false);
  };

  const handleCreateForm = async () => {
    if (!newForm.titulo || !newForm.link) return;
    setIsLoading(true);
    if (editingFormId) {
      const { data, error } = await updateFormulario({ ...(newForm as Partial<Formulario>), id: editingFormId });
      if (!error) {
        setFormularios(formularios.map(f => f.id === editingFormId ? (data as Formulario) : f));
        setEditingFormId(null);
        setNewForm({ titulo: '', categoria: '', link: '', descricao: '', icone: 'FileText' });
      } else {
        console.error("Erro ao atualizar formulário:", error);
      }
    } else {
      const { data, error } = await createFormulario(newForm as Omit<Formulario, 'id' | 'created_at'>);
      if (!error) {
        setFormularios([...formularios, data as Formulario]);
        setNewForm({ titulo: '', categoria: '', link: '', descricao: '', icone: 'FileText' });
      } else {
        console.error("Erro ao criar formulário:", error);
      }
    }
    setIsLoading(false);
  };

  const handleDeleteForm = async (id: number) => {
    setIsLoading(true);
    const { error } = await deleteFormulario(id);
    if (!error) {
      setFormularios(formularios.filter(f => f.id !== id));
      if (editingFormId === id) {
        setEditingFormId(null);
        setNewForm({ titulo: '', categoria: '', link: '', descricao: '', icone: 'FileText' });
      }
    }
    setIsLoading(false);
  };

  const renderVideoAdmin = () => {
    const clubCategories = [...videoCategories.filter(c => c.club === club)].sort((a, b) => {
      if (a.id === -3) return -1;
      if (b.id === -3) return 1;
      return 0;
    });
    const clubVideos = videos.filter(v => v.club === club);

    return (
      <div className="animate-slide-in space-y-8 pt-4 pb-28">
        {/* Nova Categoria */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
          <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-2">
            <Folder size={20} className="text-red-600" />
            <span>Nova Categoria</span>
          </h4>
          <div className="flex space-x-2">
            <input 
              type="text" 
              placeholder="Nome da Categoria"
              value={newVideoCategory.nome}
              onChange={e => setNewVideoCategory({...newVideoCategory, nome: e.target.value})}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-400"
            />
            <button 
              onClick={handleCreateVideoCategory}
              disabled={isLoading}
              className="bg-red-600 text-white px-6 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Novo Vídeo / Editar Vídeo */}
        <div className={`bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border ${editingVideoId ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-2">
              {editingVideoId ? <Edit2 size={20} className="text-amber-500" /> : <Video size={20} className="text-red-600" />}
              <span>{editingVideoId ? 'Editar Vídeo' : 'Novo Vídeo'}</span>
            </h4>
            {editingVideoId && (
              <button 
                onClick={() => {
                  setEditingVideoId(null);
                  setNewVideo({
                    titulo: '',
                    canal: '',
                    duracao: '',
                    visualizacoes: '0',
                    link: '',
                    categoria_id: 0,
                    club: club
                  });
                }}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Título do Vídeo"
              value={newVideo.titulo}
              onChange={e => setNewVideo({...newVideo, titulo: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-400"
            />
            <input 
              type="text" 
              placeholder="Canal"
              value={newVideo.canal}
              onChange={e => setNewVideo({...newVideo, canal: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-400"
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Duração (ex: 10:00)"
                value={newVideo.duracao}
                onChange={e => setNewVideo({...newVideo, duracao: e.target.value})}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-400"
              />
              <select 
                value={newVideo.categoria_id}
                onChange={e => setNewVideo({...newVideo, categoria_id: Number(e.target.value)})}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value={0}>Selecionar Categoria</option>
                {clubCategories.filter(c => c.id > 0).map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <input 
              type="text" 
              placeholder="Link do YouTube"
              value={newVideo.link}
              onChange={e => setNewVideo({...newVideo, link: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-400"
            />
            {editingVideoId ? (
              <div className="flex space-x-2">
                <button 
                  onClick={handleCreateVideo}
                  disabled={isLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md"
                >
                  <Check size={16} />
                  <span>Salvar Alterações</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingVideoId(null);
                    setNewVideo({
                      titulo: '',
                      canal: '',
                      duracao: '',
                      visualizacoes: '0',
                      link: '',
                      categoria_id: 0,
                      club: club
                    });
                  }}
                  className="px-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCreateVideo}
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                Salvar Vídeo
              </button>
            )}
          </div>
        </div>

        {/* Lista de Vídeos por Categoria */}
        {clubCategories.map(category => {
          const categoryVideos = clubVideos.filter(v => v.categoria_id === category.id);
          return (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{category.nome}</h4>
                {category.id > 0 && (
                  <button 
                    onClick={() => handleDeleteVideoCategory(category.id)}
                    className="text-red-500 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-[32px] p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-2">
                {categoryVideos.length === 0 ? (
                  <p className="text-center py-4 text-slate-400 text-xs font-bold uppercase">Nenhum vídeo</p>
                ) : (
                  categoryVideos.map(video => (
                    <div key={video.id} className={`flex items-center justify-between p-3 rounded-2xl ${editingVideoId === video.id ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'} transition-all`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white">
                          <Video size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-800 dark:text-white uppercase whitespace-normal break-words">{video.titulo}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{video.canal}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {video.categoria_id > 0 && (
                          <button 
                            onClick={() => {
                              setNewVideo({
                                titulo: video.titulo,
                                canal: video.canal,
                                duracao: video.duracao,
                                visualizacoes: video.visualizacoes,
                                link: video.link,
                                categoria_id: video.categoria_id,
                                club: video.club
                              });
                              setEditingVideoId(video.id);
                            }}
                            className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 p-2 rounded-xl transition-colors"
                            title="Editar Vídeo"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {video.categoria_id > 0 && (
                          <button 
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 p-2 rounded-xl transition-colors"
                            title="Excluir Vídeo"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFormAdmin = () => {
    return (
      <div className="animate-slide-in space-y-8 pt-4 pb-28">
        {/* Novo Formulário / Editar Formulário */}
        <div className={`bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border ${editingFormId ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-2">
              {editingFormId ? <Edit2 size={20} className="text-amber-500" /> : <FileText size={20} className="text-amber-600" />}
              <span>{editingFormId ? 'Editar Formulário' : 'Novo Formulário'}</span>
            </h4>
            {editingFormId && (
              <button 
                onClick={() => {
                  setEditingFormId(null);
                  setNewForm({ titulo: '', categoria: '', link: '', descricao: '', icone: 'FileText' });
                }}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Título do Formulário"
              value={newForm.titulo}
              onChange={e => setNewForm({...newForm, titulo: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
            />
            <input 
              type="text" 
              placeholder="Categoria (ex: Inscrição, Saúde)"
              value={newForm.categoria}
              onChange={e => setNewForm({...newForm, categoria: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
            />
            <input 
              type="text" 
              placeholder="Link do Google Forms / PDF"
              value={newForm.link}
              onChange={e => setNewForm({...newForm, link: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-400"
            />
            <textarea 
              placeholder="Descrição curta"
              value={newForm.descricao}
              onChange={e => setNewForm({...newForm, descricao: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 transition-all h-24 resize-none placeholder:text-slate-400"
            />
            {editingFormId ? (
              <div className="flex space-x-2">
                <button 
                  onClick={handleCreateForm}
                  disabled={isLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md"
                >
                  <Check size={16} />
                  <span>Salvar Alterações</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingFormId(null);
                    setNewForm({ titulo: '', categoria: '', link: '', descricao: '', icone: 'FileText' });
                  }}
                  className="px-5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCreateForm}
                disabled={isLoading}
                className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                Salvar Formulário
              </button>
            )}
          </div>
        </div>

        {/* Lista de Formulários */}
        <div className="space-y-4">
          <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight px-2">Formulários Ativos</h4>
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-2">
            {formularios.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum formulário cadastrado</p>
            ) : (
              formularios.map(form => (
                <div key={form.id} className={`flex items-center justify-between p-4 rounded-2xl ${editingFormId === form.id ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-50 dark:border-slate-700'} transition-all border`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight whitespace-normal break-words">{form.titulo}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{form.categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => {
                        setNewForm({
                          titulo: form.titulo,
                          categoria: form.categoria,
                          link: form.link,
                          descricao: form.descricao,
                          icone: form.icone || 'FileText'
                        });
                        setEditingFormId(form.id);
                      }}
                      className="text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 p-2 rounded-xl transition-colors"
                      title="Editar Formulário"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={() => handleDeleteForm(form.id)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 p-2 rounded-xl transition-colors"
                      title="Excluir Formulário"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderManagementMenu = () => (
    <div className="animate-slide-in space-y-4 pt-4 pb-28">
      {[
        { label: 'SGC', icon: <Globe size={24} />, color: 'bg-blue-600', url: 'https://sg.sdasystems.org/cms/login.php?lang=pt_br' },
        { label: 'Cartão Virtual', icon: <CreditCard size={24} />, color: 'bg-emerald-600', url: 'https://clubes.adventistas.org/br/personal-card/' },
        { label: 'Clubes', icon: <HomeIcon size={24} />, color: 'bg-amber-600', url: 'https://clubes.adventistas.org' },
        { label: 'Unidade', icon: <Layers size={24} />, color: 'bg-indigo-600', url: 'https://clubes.adventistas.org/br/unit-control/' }
      ].map((item, i) => (
        <button 
          key={i}
          onClick={() => window.open(item.url, '_blank')}
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="text-left">
            <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.label}</h4>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Acessar Sistema</p>
          </div>
        </button>
      ))}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-slide-up pt-2 pb-24">
      <div className="relative w-full px-1">
        <button 
          onClick={() => setActiveSubView('BIBLE')}
          className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full py-4 px-6 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400">
              <Book size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight">Bíblia Sagrada</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Acessar</span>
            <ChevronRight size={16} className="text-slate-400 dark:text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      <div className="space-y-3.5">
        <button 
          onClick={() => setActiveSubView('CLASSES')}
          style={{ backgroundColor: themeColor }}
          className="w-full p-5 rounded-[36px] shadow-lg flex items-center justify-between text-white active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-[22px] flex items-center justify-center">
              <Layers size={28} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-lg uppercase tracking-tight">Classes</h3>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Requisitos e Progresso</p>
            </div>
          </div>
          <ChevronRight size={18} />
        </button>

        <button 
          onClick={() => setActiveSubView('SPECIALTIES')}
          className="w-full p-5 rounded-[36px] shadow-lg flex items-center justify-between text-white active:scale-[0.98] transition-all group bg-amber-600 dark:bg-amber-700"
        >
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-[22px] flex items-center justify-center">
              <Award size={28} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-lg uppercase tracking-tight">Especialidades</h3>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest">Manual, Áreas e Requisitos</p>
            </div>
          </div>
          <ChevronRight size={18} />
        </button>
        {/* Botão Gestão (Apenas se for admin) */}
        {isUserAdmin && (
          <button 
            onClick={() => setActiveSubView('BIBLE_ADMIN')}
            className="w-full bg-slate-900 dark:bg-slate-800 p-5 rounded-[36px] shadow-sm border border-slate-900 dark:border-slate-500/60 flex items-center justify-between active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-slate-800 dark:bg-slate-700 rounded-[22px] flex items-center justify-center text-white">
                <Settings size={28} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-lg text-white uppercase tracking-tight">Painel Administrativo</h3>
                <p className="text-[9px] font-bold text-slate-300 dark:text-slate-300 uppercase tracking-widest">Administração do Clube</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 dark:text-slate-400" />
          </button>
        )}
      </div>

      <div className="pt-4">
        {/* Botões de Acesso Rápido com nomes dentro do container */}
        <div className="w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-2 mb-8">
          {/* Visualização para Tablet e PC: Todos na mesma linha */}
          <div className="hidden sm:flex items-center justify-center gap-3.5 md:gap-4 lg:gap-5 flex-nowrap">
            {[
              { label: 'Cultura', icon: <Info size={28} strokeWidth={2.4} />, bg: 'bg-indigo-500', view: 'CULTURE', show: true },
              { label: 'Biblioteca', icon: <Book size={28} strokeWidth={2.4} />, bg: 'bg-emerald-500', view: 'LIBRARY', show: true },
              { label: 'Gerenciar', icon: <Settings size={28} strokeWidth={2.4} />, bg: 'bg-amber-500', view: 'MANAGEMENT', show: true },
              { label: 'Trunfos', icon: <Trophy size={28} strokeWidth={2.4} />, bg: 'bg-teal-600', view: 'TRUNFOS', show: true },
              { label: 'Desbrava +', icon: <Sparkles size={28} strokeWidth={2.4} />, bg: 'bg-purple-600', view: 'DESBRAVA_PLUS', show: isPathfinder },
              { label: 'Vídeos', icon: <Video size={28} strokeWidth={2.4} />, bg: 'bg-red-600', view: 'VIDEOS', show: true }
            ].filter(b => b.show).map((item, i) => (
              <button 
                key={i} 
                onClick={() => setActiveSubView(item.view as any)} 
                className={`w-24 h-24 md:w-28 md:h-28 lg:w-30 lg:h-30 ${item.bg} rounded-[26px] md:rounded-[30px] flex flex-col items-center justify-center text-white shadow-md hover:shadow-xl active:scale-90 hover:scale-105 transition-all p-2.5 text-center group`}
              >
                <div className="shrink-0 group-hover:scale-110 transition-transform mb-1.5">
                  {item.icon}
                </div>
                <span className="text-[11px] md:text-xs font-black uppercase tracking-tight leading-tight w-full truncate px-1">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Visualização Mobile: 3 na primeira linha e os demais na segunda */}
          <div className="flex sm:hidden flex-col items-center gap-3.5">
            <div className="flex items-center justify-center gap-3 w-full">
              {[
                { label: 'Cultura', icon: <Info size={26} strokeWidth={2.4} />, bg: 'bg-indigo-500', view: 'CULTURE' },
                { label: 'Biblioteca', icon: <Book size={26} strokeWidth={2.4} />, bg: 'bg-emerald-500', view: 'LIBRARY' },
                { label: 'Gerenciar', icon: <Settings size={26} strokeWidth={2.4} />, bg: 'bg-amber-500', view: 'MANAGEMENT' }
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveSubView(item.view as any)} 
                  className={`w-24 h-24 ${item.bg} rounded-[26px] flex flex-col items-center justify-center text-white shadow-md active:scale-90 transition-all p-2 text-center`}
                >
                  <div className="shrink-0 mb-1.5">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight leading-tight w-full truncate px-0.5">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 w-full">
              <button 
                onClick={() => setActiveSubView('TRUNFOS')}
                className="w-24 h-24 bg-teal-600 rounded-[26px] flex flex-col items-center justify-center text-white shadow-md active:scale-90 transition-all p-2 text-center"
              >
                <div className="shrink-0 mb-1.5">
                  <Trophy size={26} strokeWidth={2.4} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight leading-tight w-full truncate px-0.5">
                  Trunfos
                </span>
              </button>
              {isPathfinder && (
                <button 
                  onClick={() => setActiveSubView('DESBRAVA_PLUS')}
                  className="w-24 h-24 bg-purple-600 rounded-[26px] flex flex-col items-center justify-center text-white shadow-md active:scale-90 transition-all p-2 text-center"
                >
                  <div className="shrink-0 mb-1.5">
                    <Sparkles size={26} strokeWidth={2.4} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight leading-tight w-full truncate px-0.5">
                    Desbrava +
                  </span>
                </button>
              )}
              <button 
                onClick={() => setActiveSubView('VIDEOS')}
                className="w-24 h-24 bg-red-600 rounded-[26px] flex flex-col items-center justify-center text-white shadow-md active:scale-90 transition-all p-2 text-center"
              >
                <div className="shrink-0 mb-1.5">
                  <Video size={26} strokeWidth={2.4} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight leading-tight w-full truncate px-0.5">
                  Vídeos
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Links Dinâmicos */}
        <div className="grid grid-cols-2 gap-3 mb-12">
          {appLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => {
                setWebTitle(link.name);
                setSelectedWebUrl(link.url);
                setActiveSubView('WEB_VIEWER');
              }}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] p-4 flex flex-col items-center justify-center space-y-2 shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className={`w-12 h-12 ${themeBgLight} dark:bg-slate-700 rounded-2xl flex items-center justify-center`}>
                <ExternalLink size={24} style={{ color: themeColor }} />
              </div>
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{link.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 animate-slide-in overflow-hidden relative transition-colors duration-500">
      {activeSubView !== 'BIBLE' && activeSubView !== 'BIBLE_BOOKS' && activeSubView !== 'BIBLE_CHAPTERS' && activeSubView !== 'BIBLE_VERSES' && activeSubView !== 'BIBLE_MARKED_VERSES' && activeSubView !== 'BIBLE_MORE' && activeSubView !== 'BIBLE_DICTIONARY' && activeSubView !== 'BIBLE_NOTES' && activeSubView !== 'BIBLE_SETTINGS' && activeSubView !== 'BIBLE_DEVOTIONAL_VIEW' && activeSubView !== 'CLASS_DETAILS' && activeSubView !== 'SPECIALTY_DETAILS' && !selectedTrunfoModal && (
        <div className="px-3.5 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 flex items-center justify-between z-10 bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-500">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            {activeSubView === 'MAIN' ? (
              <img src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" className="w-full h-full object-contain" />
            ) : (
              <button 
                onClick={() => {
                  if (activeSubView === 'SPECIALTIES_LIST') {
                    setActiveSubView('SPECIALTIES');
                  } else if (activeSubView === 'DESBRAVA_PLUS_DETAILS') {
                    setActiveSubView('DESBRAVA_PLUS');
                  } else if (activeSubView === 'DESBRAVA_PLUS_PDF') {
                    setActiveSubView('DESBRAVA_PLUS');
                  } else if (activeSubView === 'IDEALS_ANTHEM') {
                    setActiveSubView('CULTURE');
                  } else if (activeSubView === 'IDEALS') {
                    setActiveSubView('IDEALS_ANTHEM');
                  } else if (activeSubView === 'ANTHEM') {
                    setActiveSubView('IDEALS_ANTHEM');
                  } else if (activeSubView === 'CULTURE_ADMIN') {
                    setActiveSubView('CULTURE_ADMIN_MENU');
                  } else if (activeSubView === 'CULTURE_ADMIN_MENU') {
                    setActiveSubView('BIBLE_ADMIN');
                  } else if (activeSubView === 'HISTORY_LIST') {
                    setActiveSubView('CULTURE');
                  } else if (activeSubView === 'HISTORY_DETAIL') {
                    setActiveSubView('HISTORY_LIST');
                  } else if (activeSubView === 'UNIFORMS') {
                    setActiveAccordions([]);
                    setActiveSubView('CULTURE');
                  } else if (activeSubView === 'EMBLEMS') {
                    setActiveAccordions([]);
                    setActiveSubView('CULTURE');
                  } else if (activeSubView === 'LIBRARY') {
                    if (selectedLibraryCategory) {
                      const prevCat = selectedLibraryCategory;
                      setSelectedLibraryCategory(null);
                      if (isPathfinder && (prevCat === 'CLASSES' || prevCat === 'ANO' || prevCat === 'OUTROS')) {
                        setActiveSubView('LIBRARY_BOOKS_MENU');
                      }
                    } else {
                      setActiveSubView('MAIN');
                    }
                  } else if (activeSubView === 'LIBRARY_BOOKS_MENU') {
                    setActiveSubView('LIBRARY');
                  } else if (activeSubView === 'PDF_VIEWER') {
                    setActiveSubView('LIBRARY');
                  } else if (activeSubView === 'MATERIALS') {
                    setActiveSubView('LIBRARY');
                  } else if (activeSubView === 'CAMPING') {
                    setActiveSubView('MATERIALS');
                  } else if (activeSubView === 'FORMULARIOS') {
                    setActiveSubView('MATERIALS');
                  } else if (activeSubView === 'BIBLE_ADMIN') {
                    setActiveSubView('MAIN');
                  } else if (activeSubView === 'BIBLE_ADMIN_ADD') {
                    setActiveSubView('BIBLE_ADMIN');
                  } else if (activeSubView === 'BIBLE_DEVOTIONAL_LIST') {
                    setActiveSubView('BIBLE_ADMIN');
                  } else if (activeSubView === 'VIDEO_ADMIN' || activeSubView === 'FORM_ADMIN' || activeSubView === 'LINKS_ADMIN' || activeSubView === 'ACHIEVEMENTS_ADMIN' || activeSubView === 'TRUNFOS_ADMIN') {
                    setActiveSubView('BIBLE_ADMIN');
                  } else if (activeSubView === 'VIDEOS') {
                    setActiveSubView('MAIN');
                  } else if (activeSubView === 'VIDEO_PLAYER') {
                    setActiveSubView('VIDEOS');
                  } else if (activeSubView === 'TRUNFOS') {
                    setActiveSubView('MAIN');
                  } else {
                    setActiveSubView('MAIN');
                  }
                }} 
                className="w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-400 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center"
              >
                <ChevronLeft size={22} strokeWidth={3} />
              </button>
            )}
          </div>
          <div className="text-center">
            <h2 className="font-black text-slate-800 dark:text-white text-base sm:text-lg tracking-tight uppercase leading-none">
              {isPathfinder ? 'Desbravadores' : 'Aventureiros'}
            </h2>
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1">
              {activeSubView === 'MAIN' ? 'Área de Gestão' : 
               activeSubView === 'CLASSES' ? 'Classes Progressivas' :
               activeSubView === 'SPECIALTIES' ? 'Especialidades' :
               activeSubView === 'SPECIALTIES_LIST' ? selectedCategory?.nome :
               activeSubView === 'CULTURE' ? 'Cultura e Tradição' :
               activeSubView === 'IDEALS_ANTHEM' ? 'Ideais e Hino' :
               activeSubView === 'IDEALS' ? 'Ideais' :
               activeSubView === 'ANTHEM' ? 'Hino Oficial' :
               activeSubView === 'CULTURE_ADMIN' ? 'Gestão de Cultura' :
               activeSubView === 'CULTURE_ADMIN_MENU' ? 'Gestão de Cultura' :
               activeSubView === 'HISTORY_LIST' ? 'Nossa História' :
               activeSubView === 'HISTORY_DETAIL' ? (
                 selectedHistory === 'historia_mundial' ? 'História Mundial' :
                 selectedHistory === 'historia_america_sul' ? 'América do Sul' :
                 selectedHistory === 'historia_argentina' ? 'Argentina' :
                 selectedHistory === 'historia_bolivia' ? 'Bolívia' :
                 selectedHistory === 'historia_brasil' ? 'Brasil' :
                 selectedHistory === 'historia_chile' ? 'Chile' :
                 selectedHistory === 'historia_colombia' ? 'Colômbia' :
                 selectedHistory === 'historia_equador' ? 'Equador' :
                 selectedHistory === 'historia_peru' ? 'Peru' :
                 selectedHistory === 'historia_uruguai' ? 'Uruguai' : 'História Detalhada'
               ) :
               activeSubView === 'UNIFORMS' ? 'Uniformes' :
               activeSubView === 'EMBLEMS' ? 'Emblemas' :
               activeSubView === 'FAIXA' ? 'Faixa de Especialidades' :
               activeSubView === 'MANAGEMENT' ? 'Gerenciar Clube' :
               activeSubView === 'LIBRARY' ? 'Biblioteca Digital' :
               activeSubView === 'LIBRARY_BOOKS_MENU' ? 'Categorias de Livros' :
               activeSubView === 'MATERIALS' ? 'Materiais' :
               activeSubView === 'CAMPING' ? 'Camping' :
               activeSubView === 'FORMULARIOS' ? 'Formulários' :
               activeSubView === 'PDF_VIEWER' ? pdfTitle :
               activeSubView === 'DESBRAVA_PLUS' ? 'Desbrava +' :
               activeSubView === 'DESBRAVA_PLUS_DETAILS' ? selectedDesbravaPlusItem?.Nome :
               activeSubView === 'DESBRAVA_PLUS_PDF' ? selectedDesbravaPlusItem?.Nome :
               activeSubView === 'BIBLE_ADMIN' ? 'Painel Administrativo' :
               activeSubView === 'ACHIEVEMENTS_ADMIN' ? 'Gestão de Conquistas' :
               activeSubView === 'TRUNFOS' ? 'Trunfos' :
               activeSubView === 'TRUNFOS_ADMIN' ? 'Gestão de Trunfos' :
               activeSubView === 'BIBLE_ADMIN_ADD' ? 'Novo Devocional' :
               activeSubView === 'BIBLE_DEVOTIONAL_LIST' ? 'Agendados' :
               activeSubView === 'VIDEOS' ? 'Vídeos' :
               activeSubView === 'VIDEO_PLAYER' ? 'Assistir Vídeo' :
               activeSubView === 'VIDEO_ADMIN' ? 'Gestão de Vídeos' :
               activeSubView === 'FORM_ADMIN' ? 'Gestão de Formulários' :
               activeSubView}
            </p>
          </div>
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            {activeSubView === 'MAIN' && (
              <button onClick={onOpenProfile} className="w-11 h-11 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 overflow-hidden active:scale-90 transition-all">
                {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User size={22} />}
              </button>
            )}
            {(activeSubView === 'SPECIALTIES' || activeSubView === 'SPECIALTIES_LIST') && (
              <button 
                onClick={openSpecialtySearch}
                className="w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-500 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800"
                title="Pesquisar Especialidades"
                aria-label="Pesquisar Especialidades"
              >
                <Search size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-grow overflow-y-auto scrollbar-hide ${activeSubView === 'DESBRAVA_PLUS_PDF' ? 'p-1.5' : activeSubView === 'BIBLE' ? 'p-3' : (activeSubView === 'CLASS_DETAILS' || activeSubView === 'SPECIALTY_DETAILS') ? 'px-3.5 pt-4 pb-4' : 'px-3.5 sm:px-5 py-1'}`}
      >
        {activeSubView === 'MAIN' && renderDashboard()}
        {activeSubView === 'CLASSES' && renderClassesMenu()}
        {activeSubView === 'CLASS_DETAILS' && renderClassDetails()}
        {activeSubView === 'SPECIALTIES' && renderSpecialtiesCategories()}
        {activeSubView === 'SPECIALTIES_LIST' && renderSpecialtiesList()}
        {activeSubView === 'SPECIALTY_DETAILS' && renderSpecialtyDetails()}
        {activeSubView === 'FAIXA' && renderFaixa()}
        {activeSubView === 'MANAGEMENT' && renderManagementMenu()}
        {activeSubView === 'CULTURE' && renderCultureMenu()}
        {activeSubView === 'IDEALS_ANTHEM' && renderIdealsAnthem()}
        {activeSubView === 'IDEALS' && renderIdeals()}
        {activeSubView === 'ANTHEM' && renderAnthem()}
        {activeSubView === 'CULTURE_ADMIN_MENU' && renderCultureAdminMenu()}
        {activeSubView === 'CULTURE_ADMIN' && (
          <CultureAdmin 
            culturaData={culturaData}
            club={club}
            updateCultura={updateCultura}
            setCulturaData={setCulturaData}
            setActiveSubView={setActiveSubView}
            initialTab={cultureAdminTab}
          />
        )}
        {activeSubView === 'HISTORY_LIST' && renderHistoryList()}
        {activeSubView === 'HISTORY_DETAIL' && renderHistoryDetail()}
        {activeSubView === 'UNIFORMS' && renderUniforms()}
        {activeSubView === 'EMBLEMS' && renderEmblems()}
        {activeSubView === 'LIBRARY' && renderLibraryMenu()}
        {activeSubView === 'LIBRARY_BOOKS_MENU' && renderLibraryBooksMenu()}
        {activeSubView === 'PDF_VIEWER' && renderPdfViewer()}
        {activeSubView === 'MATERIALS' && renderMaterialsMenu()}
        {activeSubView === 'CAMPING' && renderCamping()}
        {activeSubView === 'FORMULARIOS' && renderFormularios()}
        {activeSubView === 'DESBRAVA_PLUS' && renderDesbravaPlus()}
        {activeSubView === 'DESBRAVA_PLUS_DETAILS' && renderDesbravaPlusDetails()}
        {activeSubView === 'DESBRAVA_PLUS_PDF' && renderDesbravaPlusPdf()}
        {activeSubView === 'VIDEOS' && renderVideos()}
        {activeSubView === 'VIDEO_PLAYER' && renderVideoPlayer()}
        {activeSubView === 'VIDEO_ADMIN' && renderVideoAdmin()}
        {activeSubView === 'FORM_ADMIN' && renderFormAdmin()}
        {activeSubView === 'BIBLE' && renderBible()}
        {activeSubView === 'BIBLE_BOOKS' && renderBibleBooks()}
        {activeSubView === 'BIBLE_CHAPTERS' && renderBibleChapters()}
        {activeSubView === 'BIBLE_VERSES' && renderBibleVerses()}
        {activeSubView === 'BIBLE_MORE' && renderBibleMore()}
        {activeSubView === 'BIBLE_MARKED_VERSES' && renderBibleMarkedVerses()}
        {activeSubView === 'BIBLE_DICTIONARY' && renderBibleDictionary()}
        {activeSubView === 'BIBLE_NOTES' && renderBibleNotes()}
        {activeSubView === 'BIBLE_SETTINGS' && renderBibleSettings()}
        {activeSubView === 'BIBLE_ADMIN' && renderBibleAdmin()}
        {activeSubView === 'BIBLE_ADMIN_ADD' && renderBibleAdminAdd()}
        {activeSubView === 'BIBLE_DEVOTIONAL_LIST' && renderBibleDevotionalList()}
        {activeSubView === 'BIBLE_DEVOTIONAL_VIEW' && renderBibleDevotionalView()}
        {activeSubView === 'LINKS_ADMIN' && renderLinksAdmin()}
        {activeSubView === 'ACHIEVEMENTS_ADMIN' && renderAchievementsAdmin()}
        {activeSubView === 'TRUNFOS' && renderTrunfos()}
        {activeSubView === 'TRUNFOS_ADMIN' && renderTrunfosAdmin()}
        {activeSubView === 'WEB_VIEWER' && renderWebViewer()}
      </div>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 active:scale-90 transition-all z-[60] animate-bounce-in"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}

      {/* Barra de Navegação Fixa da Bíblia */}
      {activeSubView === 'BIBLE_VERSES' && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-slide-up border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <button 
              onClick={goToPreviousChapter}
              className={`flex-1 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all ${
                selectedBibleBook && selectedBibleChapter === 1 && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === 0
                  ? 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200'
              }`}
            >
              <ChevronLeft size={18} />
              <span>Anterior</span>
            </button>
            <button 
              onClick={goToNextChapter}
              className={`flex-1 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all ${
                selectedBibleBook && selectedBibleChapter === selectedBibleBook.total_chapters && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === bibleBooks.length - 1
                  ? 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 shadow-none'
                  : 'bg-blue-600 text-white shadow-blue-200 dark:shadow-none'
              }`}
            >
              <span>Próximo</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {activeSubView !== 'DESBRAVA_PLUS_PDF' && activeSubView !== 'PDF_VIEWER' && activeSubView !== 'BIBLE' && activeSubView !== 'BIBLE_BOOKS' && activeSubView !== 'BIBLE_CHAPTERS' && activeSubView !== 'BIBLE_VERSES' && activeSubView !== 'BIBLE_MARKED_VERSES' && activeSubView !== 'BIBLE_MORE' && activeSubView !== 'BIBLE_DICTIONARY' && activeSubView !== 'BIBLE_NOTES' && activeSubView !== 'BIBLE_SETTINGS' && activeSubView !== 'BIBLE_DEVOTIONAL_VIEW' && !selectedTrunfoModal && (
        <div className="absolute bottom-2 sm:bottom-3 left-0 right-0 px-8 flex justify-center z-50 pointer-events-none">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md h-16 w-full max-w-[320px] rounded-full shadow-2xl flex p-2 items-center border border-white dark:border-slate-700 space-x-2 pointer-events-auto">
            <button 
              onClick={() => onSwitchClub(ClubType.PATHFINDER)} 
              className={`flex-1 h-full rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isPathfinder ? 'bg-[#dc371b] text-white shadow-lg' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
            >
              DBV
            </button>
            <button onClick={onBack} className="w-12 h-12 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
              <HomeIcon size={20} />
            </button>
            <button 
              onClick={() => onSwitchClub(ClubType.ADVENTURER)} 
              className={`flex-1 h-full rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${!isPathfinder ? 'bg-[#800000] text-white shadow-lg' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
            >
              AVT
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Cultura */}
      {selectedCultureDetail && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in pointer-events-auto"
          onClick={() => setSelectedCultureDetail(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-[40px] w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up border border-transparent dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Detalhes do Item</h4>
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                  {selectedCultureDetail.titulo}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCultureDetail(null)}
                className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 active:scale-90 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto scrollbar-hide flex-grow">
              <div className="space-y-8">
                {/* Blocos do item principal */}
                {selectedCultureDetail.blocks && selectedCultureDetail.blocks.length > 0 ? (
                  <div className="flex flex-col items-center space-y-8">
                    {/* Imagens Centradas no Topo */}
                    {selectedCultureDetail.blocks.filter(b => b.type === 'image').map((block) => (
                      <div key={block.id} className="relative group w-32 h-32 sm:w-48 sm:h-48 overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900 rounded-[40px] p-4">
                        <img 
                          src={getImageUrl(block.content)} 
                          alt="" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                    
                    {/* Textos Informativos */}
                    <div className="w-full space-y-6">
                      {selectedCultureDetail.blocks.filter(b => b.type === 'text').map((block) => (
                        <div key={block.id} className="text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                          {block.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-6">
                    {selectedCultureDetail.imagem && (
                      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-50 dark:bg-slate-900 rounded-[40px] p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <img 
                          src={getImageUrl(selectedCultureDetail.imagem)} 
                          className="w-full h-full object-contain" 
                          alt="" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    
                    <div className="text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed whitespace-pre-wrap w-full">
                      {selectedCultureDetail.descricao}
                    </div>
                  </div>
                )}

                {/* Subitens no Modal: Renderização Completa com Títulos e Blocos */}
                {selectedCultureDetail.subitems && selectedCultureDetail.subitems.length > 0 && (
                  <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-700 space-y-12">
                    {selectedCultureDetail.subitems.map((sub: any) => (
                      <div key={sub.id} className="space-y-5">
                        <h5 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center">
                          <span className="w-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mr-3" />
                          {sub.titulo}
                        </h5>
                        
                        {sub.blocks && sub.blocks.length > 0 ? (
                          <div className="space-y-6 pl-5 border-l-2 border-indigo-50/50 dark:border-indigo-900/40">
                            {/* Imagens do Subitem Primeiro */}
                            {sub.blocks.filter((b: any) => b.type === 'image').map((block: any) => (
                              <div key={block.id} className="relative group w-24 h-24 sm:w-32 sm:h-32 my-6 overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900 rounded-[24px] p-3">
                                <img 
                                  src={getImageUrl(block.content)} 
                                  alt="" 
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ))}
                            
                            {/* Texto do Subitem Depois */}
                            <div className="space-y-4">
                              {sub.blocks.filter((b: any) => b.type === 'text').map((block: any) => (
                                <div key={block.id} className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                  {block.content}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 dark:text-slate-400 text-center text-sm leading-relaxed px-4 italic border-l-2 border-indigo-50/50 dark:border-indigo-900/40">
                            {sub.descricao || 'Sem conteúdo adicional.'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualização do Trunfo em Tela Cheia (Ocupa 100% da tela real, sem cabeçalho e sem menu) */}
      {selectedTrunfoModal && (
        <div className="fixed inset-0 z-[999] bg-[#F8FAFC] dark:bg-slate-900 flex flex-col h-full w-full overflow-hidden animate-fade-in">
          {/* Barra Superior Fixa do Trunfo */}
          <div className="flex-shrink-0 px-6 sm:px-8 pt-10 sm:pt-6 pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-20 shadow-sm">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                  {selectedTrunfoModal.ano ? `Trunfo • Ano ${selectedTrunfoModal.ano}` : 'Trunfo do Evento'}
                </span>
                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">•</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                  {selectedTrunfoModal.club === 'ADVENTURER' ? 'Aventureiros' : selectedTrunfoModal.club === 'ALL' ? 'Desbravadores & Aventureiros' : 'Desbravadores'}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                {selectedTrunfoModal.titulo}
              </h3>
            </div>
            <button 
              onClick={() => {
                setSelectedTrunfoModal(null);
                setIsTrunfoImageZoomed(false);
              }}
              className="w-12 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 shadow-sm"
              title="Fechar visualização"
            >
              <X size={22} />
            </button>
          </div>

          {/* Área de Conteúdo que Rola por Toda a Tela */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-8 space-y-6 pb-28">
              {/* Card com Imagem alinhada apenas ao Título, e abaixo Clube e Ano */}
              <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 sm:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-4">
                {/* Linha do Título com a Imagem ao lado */}
                <div className="flex items-center space-x-4 sm:space-x-5">
                  {selectedTrunfoModal.imagem && (
                    <div className="flex flex-col items-center flex-shrink-0">
                      <button 
                        onClick={() => setIsTrunfoImageZoomed(true)}
                        className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 dark:bg-slate-900/90 rounded-2xl p-1.5 flex items-center justify-center border-2 border-teal-500/40 hover:border-teal-500 relative group hover:scale-[1.03] active:scale-95 transition-all shadow-md cursor-zoom-in overflow-hidden"
                        title="Toque para ampliar a imagem"
                      >
                        <img 
                          src={getImageUrl(selectedTrunfoModal.imagem)} 
                          alt={selectedTrunfoModal.titulo} 
                          className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                        />
                        {/* Ícone Indicador de Zoom */}
                        <div className="absolute bottom-1 right-1 bg-teal-600 dark:bg-teal-500 text-white rounded-md p-1 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ZoomIn size={12} className="stroke-[2.5]" />
                        </div>
                        {/* Overlay ao passar o mouse */}
                        <div className="absolute inset-0 bg-teal-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white rounded-2xl">
                          <span className="bg-black/70 backdrop-blur-xs text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ZoomIn size={10} /> Zoom
                          </span>
                        </div>
                      </button>
                      <span className="text-[8px] sm:text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mt-1 flex items-center gap-0.5 select-none whitespace-nowrap">
                        <ZoomIn size={9} className="stroke-[2.5]" /> Toque p/ ampliar
                      </span>
                    </div>
                  )}

                  <h2 className="flex-1 min-w-0 text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-snug">
                    {selectedTrunfoModal.titulo}
                  </h2>
                </div>

                {/* Clube e Ano na sequência abaixo */}
                <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest">
                    {selectedTrunfoModal.club === 'ADVENTURER' ? 'Clube de Aventureiros' : selectedTrunfoModal.club === 'ALL' ? 'Desbravadores e Aventureiros' : 'Clube de Desbravadores'}
                  </span>
                  {selectedTrunfoModal.ano && (
                    <span className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-black uppercase tracking-widest border border-teal-500/20">
                      Ano {selectedTrunfoModal.ano}
                    </span>
                  )}
                </div>
              </div>

              {/* História / Texto Principal formatado com destaque para seções */}
              <div className="bg-[#182335] dark:bg-[#111c2d] rounded-[32px] p-6 sm:p-8 border border-[#22354e] shadow-lg space-y-6">
                <div className="flex items-center space-x-2.5 text-xs font-black text-teal-400 uppercase tracking-widest pb-1 border-b border-white/5">
                  <BookOpen size={18} className="text-teal-400 stroke-[2.5]" />
                  <span>HISTÓRIA DO EVENTO</span>
                </div>
                <div className="space-y-4 text-slate-100 text-sm sm:text-base leading-relaxed font-normal">
                  {selectedTrunfoModal.historia ? (
                    selectedTrunfoModal.historia.split('\n\n').map((paragraph, idx) => {
                      const trimmed = paragraph.trim();
                      if (!trimmed) return null;
                      
                      // Destaque de rótulos como Local:, Participantes:, Tema central:, Atividades:
                      const match = trimmed.match(/^(Local|Participantes|Tema central|Atividades|Público|Edição|Data):\s*(.*)$/i);
                      if (match) {
                        return (
                          <p key={idx} className="leading-relaxed">
                            <strong className="font-bold text-white tracking-wide">{match[1]}: </strong>
                            <span className="text-slate-200">{match[2]}</span>
                          </p>
                        );
                      }
                      return (
                        <p key={idx} className="leading-relaxed text-slate-100 font-medium">
                          {trimmed}
                        </p>
                      );
                    })
                  ) : (
                    <p className="text-slate-400">Nenhuma história cadastrada para este trunfo.</p>
                  )}
                </div>
              </div>

              {/* Botões de Ação para Administradores */}
              {(isAdmin || isUserAdmin) && (
                <div className="pt-2 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      const trunfoToEdit = selectedTrunfoModal;
                      setSelectedTrunfoModal(null);
                      setNewTrunfo({
                        titulo: trunfoToEdit.titulo,
                        ano: trunfoToEdit.ano || '',
                        imagem: trunfoToEdit.imagem || '',
                        historia: trunfoToEdit.historia || '',
                        club: trunfoToEdit.club || club
                      });
                      setEditingTrunfoId(trunfoToEdit.id);
                      setActiveSubView('TRUNFOS_ADMIN');
                      scrollToTop();
                    }}
                    className="flex items-center space-x-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    <Edit2 size={16} />
                    <span>Editar Trunfo</span>
                  </button>

                  <button
                    onClick={async () => {
                      const idToDelete = selectedTrunfoModal.id;
                      if (confirm(`Tem certeza que deseja excluir o trunfo "${selectedTrunfoModal.titulo}"?`)) {
                        setSelectedTrunfoModal(null);
                        await handleDeleteTrunfo(idToDelete);
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    <Trash2 size={16} />
                    <span>Excluir Trunfo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Zoom da Imagem em Tela Cheia */}
      {isTrunfoImageZoomed && selectedTrunfoModal?.imagem && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in cursor-zoom-out"
          onClick={() => setIsTrunfoImageZoomed(false)}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsTrunfoImageZoomed(false);
            }}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-90 z-20"
            title="Fechar imagem ampliada"
          >
            <X size={24} />
          </button>
          <div 
            className="max-w-5xl max-h-[88vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={getImageUrl(selectedTrunfoModal.imagem)} 
              alt={selectedTrunfoModal.titulo} 
              className="max-h-[85vh] max-w-[90vw] object-contain drop-shadow-2xl rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Modal de Pesquisa de Especialidades */}
      {isSpecialtySearchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsSpecialtySearchOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-[#F8FAFC] dark:bg-slate-900 rounded-t-[36px] sm:rounded-[36px] shadow-2xl flex flex-col h-[90vh] sm:h-[82vh] overflow-hidden border border-slate-100 dark:border-slate-800 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="px-6 pt-5 pb-4 bg-white dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Search size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tight leading-tight">
                    Pesquisar Especialidades
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    {allSpecialtiesList.length > 0 
                      ? `${allSpecialtiesList.length} especialidades cadastradas` 
                      : (isPathfinder ? 'Desbravadores' : 'Aventureiros')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSpecialtySearchOpen(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700/80 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-all active:scale-90"
                title="Fechar pesquisa"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Barra de Pesquisa e Filtros */}
            <div className="p-4 bg-white dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 space-y-3">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input 
                  type="text"
                  autoFocus
                  value={specialtySearchQuery}
                  onChange={(e) => setSpecialtySearchQuery(e.target.value)}
                  placeholder="Digite nome, código (ex: HM001) ou área..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-10 py-3 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {specialtySearchQuery && (
                  <button 
                    onClick={() => setSpecialtySearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Categorias / Áreas para filtro rápido em chips horizontais */}
              {availableSearchAreas.length > 0 && (
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
                  <button 
                    onClick={() => setSelectedSearchArea('TODAS')}
                    className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all ${
                      selectedSearchArea === 'TODAS'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Todas ({allSpecialtiesList.length})
                  </button>
                  {availableSearchAreas.map(area => (
                    <button 
                      key={area}
                      onClick={() => setSelectedSearchArea(area)}
                      className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider whitespace-nowrap transition-all ${
                        selectedSearchArea === area
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Resultados */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-hide">
              {isLoadingSearchSpecialties ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carregando especialidades...</p>
                </div>
              ) : filteredSearchSpecialties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <Search size={28} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                      Nenhuma especialidade encontrada
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {specialtySearchQuery 
                        ? `Não encontramos resultados para "${specialtySearchQuery}". Tente outro termo ou código.`
                        : 'Nenhuma especialidade disponível nesta categoria.'}
                    </p>
                  </div>
                  {specialtySearchQuery && (
                    <button 
                      onClick={() => {
                        setSpecialtySearchQuery('');
                        setSelectedSearchArea('TODAS');
                      }}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="px-1 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {filteredSearchSpecialties.length} {filteredSearchSpecialties.length === 1 ? 'Especialidade encontrada' : 'Especialidades encontradas'}
                    </span>
                  </div>
                  {filteredSearchSpecialties.map((esp) => {
                    const isCompleted = completedSpecialties.includes(esp.id.toString());
                    return (
                      <div 
                        key={esp.id}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-[22px] p-3.5 flex items-center space-x-3.5 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedSpecialty(esp);
                          setIsSpecialtySearchOpen(false);
                          setActiveSubView('SPECIALTY_DETAILS');
                        }}
                      >
                        <div className="w-13 h-13 sm:w-14 sm:h-14 bg-slate-50 dark:bg-slate-900/60 rounded-2xl flex items-center justify-center p-1.5 flex-shrink-0 border border-slate-100 dark:border-slate-800">
                          {esp.logo ? (
                            <img 
                              src={getImageUrl(esp.logo)} 
                              alt={esp.nome} 
                              className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Award size={24} className="text-slate-300 dark:text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {esp.nome}
                          </h4>
                          <div className="flex items-center flex-wrap gap-1.5 mt-1">
                            {esp.area && (
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300 rounded-md text-[9px] font-black uppercase tracking-wider truncate max-w-[150px]">
                                {esp.area}
                              </span>
                            )}
                            {(esp.codigo || esp.sigla) && (
                              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                                {esp.codigo || `${esp.sigla}${String(esp.id).padStart(3, '0')}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSpecialty(esp.id.toString());
                          }}
                          className={`p-2.5 rounded-xl transition-all active:scale-90 flex-shrink-0 ${
                            isCompleted 
                              ? 'text-red-500 bg-red-50 dark:bg-red-950/40' 
                              : 'text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                          title={isCompleted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                        >
                          <Heart size={18} fill={isCompleted ? "currentColor" : "none"} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubManagement;

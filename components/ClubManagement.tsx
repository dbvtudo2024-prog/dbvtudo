
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import { ClubType, Category, Especialidade, ClubClass, DesbravaMais, BibleBook, BibleVerse, BibleDictionaryEntry, BibleNote, Devocional, Cultura, UserProfile, CulturaItem, LivroClasse, LivroAno, OutroLivro, ManualDBV, CampingDBV, Formulario, Video as VideoType, VideoCategory, LivroAVT, ManualAVT, AppLink, Conquista, Trunfo } from '../types';
import { 
  fetchCategories, fetchEspecialidades, fetchEspecialidadeRequisitos, fetchClasses, fetchDesbravaMais, 
  fetchBibleBooks, fetchBibleVerses, fetchBibleDictionary, fetchDevocionais, 
  CANONICAL_BIBLE_BOOKS,
  createDevocional, updateDevocional, deleteDevocional, fetchUserSpecialties, updateUserSpecialties, 
  getLocalUserSpecialties, saveLocalUserSpecialties,
  getLocalCatalogFavorites, saveLocalCatalogFavorites,
  fetchCultura, updateCultura, fetchUserProfile, supabase,
  fetchLivrosClasses, fetchLivrosAno, fetchOutrosLivros, fetchManuaisDBV,
  fetchCampingDBV, fetchFormularios, DEFAULT_FORMULARIOS, createFormulario, updateFormulario, deleteFormulario,
  fetchVideos, fetchVideoCategories,
  fetchAtividadesJogosDBV, fetchCerimoniasDBV, fetchVideosDBV,
  fetchAtividadesJogosAVT, fetchCerimoniasAVT, fetchVideosAVT,
  createVideo, updateVideo, deleteVideo, createVideoCategory, updateVideoCategory, deleteVideoCategory,
  fetchLivrosAVT, fetchManuaisAVT, fetchAppLinks, updateAppLink, deleteAppLink,
  fetchConquistas, updateConquista, deleteConquista,
  fetchTrunfos, updateTrunfo, deleteTrunfo,
  fetchFaixaConfig, updateFaixaConfig, uploadFaixaImage, FaixaConfig, DEFAULT_FAIXA_CONFIG,
  getOfficialRudUniforms, getOfficialRudEmblems, uploadCultureAsset, RUD_CREDITS
} from '../services/supabaseService';
import { PROFILE_KEY } from '../constants';
import {
  OFFICIAL_COREL_EMBLEMS,
  downloadEmblemForCorelDraw,
  downloadCustomizedCertificatePdf,
  downloadCustomizedCertificatePng,
  CustomCertificateConfig
} from '../services/materialsService';
import { calculateAge } from './Profile';
import { MASTERY_RULES } from '../masteryRules';
import { APP_VERSION, APP_BUILD_DATE, VERSION_HISTORY } from '../versionConfig';
import { generateSpecialtyPowerPoint, parseAndNormalizeRequirements, isRequirementSubItem } from '../services/presentationService';
import { generateSpecialtyExamPdf, generateSpecialtyExamQuestions, ExamFormatMode, ExamQuestion } from '../services/examService';
import ClubQuiz from './ClubQuiz';
import LiveSpecialtyExam from './LiveSpecialtyExam';
import UnitCornerCamping from './UnitCornerCamping';
import FieldManualTools from './FieldManualTools';
import { DESBRAVA_MAIS_OFFICIAL_MATERIALS, DESBRAVA_MAIS_CHECKLIST } from '../services/desbravaMaisOfficialData';
import { 
  Shield, Award, User, Layers, Sparkles, Home as HomeIcon, Search,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, ListChecks, Info, Book, Settings, Zap, Music, Flag, Shirt, Globe, Key, FileText, Library, CreditCard, MapPin, Video, Folder, BookOpen, Heart, ArrowUp, ArrowDown,
  Trash2, Plus, Save, Share2, Calendar, X, Image as ImageIcon, Download, ArrowLeft, ExternalLink, Filter, Edit2, Edit3, Check,
  AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, Minus, Trophy, PanelLeftClose, PanelLeftOpen, Menu, Presentation, RefreshCw, ClipboardCheck, Tent, Compass, Radio, HeartPulse, CheckCircle2, History, Palette, Play, QrCode
} from 'lucide-react';


const getImageUrl = (url: string | undefined | null) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (
    trimmed.startsWith('/trunfos/') ||
    trimmed.startsWith('/libras/') ||
    trimmed.startsWith('/knots/') ||
    trimmed.startsWith('/knots3d/')
  ) {
    return trimmed;
  }
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
      historia_mundial_img: culturaData?.historia_mundial_img || '',
      historia_america_sul_img: culturaData?.historia_america_sul_img || '',
      historia_argentina_img: culturaData?.historia_argentina_img || '',
      historia_bolivia_img: culturaData?.historia_bolivia_img || '',
      historia_brasil_img: culturaData?.historia_brasil_img || '',
      historia_chile_img: culturaData?.historia_chile_img || '',
      historia_colombia_img: culturaData?.historia_colombia_img || '',
      historia_equador_img: culturaData?.historia_equador_img || '',
      historia_peru_img: culturaData?.historia_peru_img || '',
      historia_uruguai_img: culturaData?.historia_uruguai_img || '',
      uniformes_list: normalizeCulturaList(culturaData?.uniformes_list),
      emblemas_list: normalizeCulturaList(culturaData?.emblemas_list)
    });
  }, [culturaData]);

  const handleItemImageUpload = async (file: File) => {
    const publicUrl = await uploadCultureAsset(file, 'Emblemas');
    if (publicUrl) {
      setNewItem(prev => ({ ...prev, imagem: publicUrl }));
    }
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

  const handleBlockImageUpload = async (file: File) => {
    const publicUrl = await uploadCultureAsset(file, 'Emblemas');
    if (publicUrl) {
      addBlock('image', publicUrl);
    }
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

  const handleHistoryImageUpload = async (file: File, fieldId: string) => {
    const publicUrl = await uploadCultureAsset(file, 'Paises');
    if (publicUrl) {
      setLocalCultura(prev => ({ ...prev, [`${fieldId}_img`]: publicUrl }));
    }
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
  | 'VIDEOS' | 'VIDEO_ADMIN' | 'FORM_ADMIN' | 'VIDEO_PLAYER' | 'LINKS_ADMIN' | 'ACHIEVEMENTS_ADMIN' | 'TRUNFOS' | 'TRUNFOS_ADMIN' | 'WEB_VIEWER' | 'FAIXA_ADMIN' | 'FIELD_TRAINING' | 'QUIZ' | 'LIVE_EXAM' | 'UNIT_CORNER' | 'FIELD_MANUAL' | 'ORDEM_UNIDA' | 'VERSION_HISTORY';

interface ClubManagementProps {
  club: ClubType;
  pinSidebar?: boolean;
  onTogglePinSidebar?: () => void;
  onBack: () => void;
  onSwitchClub: (club: ClubType) => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  isGuest?: boolean;
  initialSubView?: SubViewType;
  onSubViewChange?: (view: any) => void;
  onClearSubView?: () => void;
}

const ClubManagement: React.FC<ClubManagementProps> = ({ 
  club, 
  pinSidebar, 
  onTogglePinSidebar, 
  onBack, 
  onSwitchClub, 
  onOpenProfile, 
  onOpenSettings, 
  isGuest, 
  initialSubView, 
  onSubViewChange, 
  onClearSubView 
}) => {
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
  const [visibleSearchCount, setVisibleSearchCount] = useState<number>(40);
  const quizBackHandlerRef = useRef<(() => boolean) | null>(null);
  const liveExamBackHandlerRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    setVisibleSearchCount(40);
  }, [specialtySearchQuery, selectedSearchArea, isSpecialtySearchOpen, club]);

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
  const [selectedVideoCategoryFilter, setSelectedVideoCategoryFilter] = useState<number | 'ALL'>('ALL');
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem('dbv_cached_bible_books');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 66) return parsed;
        }
      }
    } catch {}
    return CANONICAL_BIBLE_BOOKS;
  });
  const [selectedBibleBook, setSelectedBibleBook] = useState<BibleBook | null>(null);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState<number | null>(null);
  const [bibleVerses, setBibleVerses] = useState<BibleVerse[]>([]);
  const [bibleVersesRetryTrigger, setBibleVersesRetryTrigger] = useState(0);
  const [markedVerses, setMarkedVerses] = useState<BibleVerse[]>(() => {
    const saved = localStorage.getItem('markedVerses');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTestament, setSelectedTestament] = useState<'ANTIGO' | 'NOVO' | 'TODOS'>('TODOS');
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
  const [formularios, setFormularios] = useState<Formulario[]>(DEFAULT_FORMULARIOS);
  const [formularioMinistryFilter, setFormularioMinistryFilter] = useState<'TODOS' | 'DBV' | 'AVT'>('TODOS');
  const [formularioSearchQuery, setFormularioSearchQuery] = useState<string>('');
  const [pdfReturnSubView, setPdfReturnSubView] = useState<'LIBRARY' | 'FORMULARIOS' | 'CAMPING'>('LIBRARY');
  const [isCertCustomizerOpen, setIsCertCustomizerOpen] = useState<boolean>(true);
  const [isDownloadingCustomCert, setIsDownloadingCustomCert] = useState<boolean>(false);
  const [customCertConfig, setCustomCertConfig] = useState<CustomCertificateConfig>({
    ministry: club === ClubType.ADVENTURER ? 'AVT' : 'DBV',
    clubName: '',
    associationName: '',
    certificateTitle: 'CERTIFICADO OFICIAL DE INVESTIDURA',
    achievementName: club === ClubType.ADVENTURER ? 'Classes e Especialidades de Aventureiros' : 'Classes e Especialidades de Desbravadores',
    recipientName: '',
    locationAndDate: `Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    directorName: '',
    regionalName: '',
    pastorName: ''
  });
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<'CLASSES' | 'ANO' | 'OUTROS' | 'MANUAIS' | 'BOOKS_AVT' | 'MANUAIS_AVT' | 'MATERIALS' | null>(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfThumbnail, setSelectedPdfThumbnail] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');

  // Bible Settings State
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [fieldManualTab, setFieldManualTab] = useState<'NOS_AMARRAS' | 'CODIGOS' | 'PRIMEIROS_SOCORROS' | 'ORDEM_UNIDA'>('NOS_AMARRAS');
  const [versionSearchQuery, setVersionSearchQuery] = useState<string>('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string | null>(null);
  const [isFloatingMenuOpenInNewArea, setIsFloatingMenuOpenInNewArea] = useState<boolean>(false);

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckMessage(null);
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const serverVersion = Number(data?.version || data?.timestamp);
        const storedTime = Number(sessionStorage.getItem('dbv_current_build_time') || 0);

        if (serverVersion && storedTime && serverVersion > storedTime) {
          setUpdateCheckMessage(`Nova versão v${data?.versionName || ''} encontrada! Recarregando...`);
          setTimeout(() => {
            window.location.reload();
          }, 1200);
          return;
        }
      }
      setUpdateCheckMessage(`Você já está na versão mais recente (v${APP_VERSION})!`);
    } catch {
      setUpdateCheckMessage(`Versão instalada: v${APP_VERSION}. Aplicativo atualizado.`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };
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
  const [completedSpecialties, setCompletedSpecialties] = useState<string[]>(() => {
    return getLocalCatalogFavorites(null, club);
  });
  const [culturaData, setCulturaData] = useState<Cultura | null>(null);
  const [activeAccordions, setActiveAccordions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);
  const [isPptxModalOpen, setIsPptxModalOpen] = useState(false);
  const [pptxInstructorName, setPptxInstructorName] = useState('');
  const [pptxClubName, setPptxClubName] = useState('');
  const [pptxUnitName, setPptxUnitName] = useState('');
  const [showPptxItemsList, setShowPptxItemsList] = useState(true);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [pptxProgressMsg, setPptxProgressMsg] = useState('');
  const [pptxProgressPercent, setPptxProgressPercent] = useState(0);
  const [pptxError, setPptxError] = useState<string | null>(null);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examFormatMode, setExamFormatMode] = useState<ExamFormatMode>('MISTA');
  const [examQuestionCount, setExamQuestionCount] = useState<number | 'ALL'>(10);
  const [examIncludeAnswerKey, setExamIncludeAnswerKey] = useState(true);
  const [examIncludePracticalChecklist, setExamIncludePracticalChecklist] = useState(true);
  const [examInstructorName, setExamInstructorName] = useState('');
  const [examClubName, setExamClubName] = useState('');
  const [examUnitName, setExamUnitName] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toLocaleDateString('pt-BR'));
  const [examMinGrade, setExamMinGrade] = useState('7,0 (70%)');
  const [examProgressMsg, setExamProgressMsg] = useState('');
  const [examProgressPercent, setExamProgressPercent] = useState(0);
  const [examError, setExamError] = useState<string | null>(null);
  const [examPreviewQuestions, setExamPreviewQuestions] = useState<ExamQuestion[]>([]);
  const [showExamPreviewGabarito, setShowExamPreviewGabarito] = useState(true);
  const [classRequirements, setClassRequirements] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return pinSidebar || false;
  });
  const [hasActiveLiveExamRoom, setHasActiveLiveExamRoom] = useState<boolean>(false);
  const [isLogoWobbling, setIsLogoWobbling] = useState<boolean>(false);

  const triggerLogoWobble = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {}
    setIsLogoWobbling(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsLogoWobbling(true);
      });
    });
  };

  // Manter sincronizado caso a configuração de fixação mude ou quando abrir sala de prova ao vivo
  useEffect(() => {
    if (pinSidebar || (activeSubView === 'LIVE_EXAM' && hasActiveLiveExamRoom)) {
      setIsSidebarOpen(true);
    }
  }, [pinSidebar, activeSubView, hasActiveLiveExamRoom]);

  const sidebarRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fecha o menu lateral do PC ao clicar fora da área do menu (apenas se não estiver fixado e não estiver com sala de prova ao vivo aberta)
  useEffect(() => {
    if (!isSidebarOpen || pinSidebar || (activeSubView === 'LIVE_EXAM' && hasActiveLiveExamRoom)) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSidebarOpen, pinSidebar, activeSubView, hasActiveLiveExamRoom]);
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

  // Estados e controle da Gestão da Faixa
  const [faixaAdminConfig, setFaixaAdminConfig] = useState<FaixaConfig>(DEFAULT_FAIXA_CONFIG);
  const [isSavingFaixaConfig, setIsSavingFaixaConfig] = useState(false);
  const [faixaConfigSavedSuccess, setFaixaConfigSavedSuccess] = useState(false);
  const [faixaSimulationMode, setFaixaSimulationMode] = useState<'DESBRAVADOR' | 'LIDERANCA' | 'LIDER'>('DESBRAVADOR');
  const [isUploadingFaixaImg, setIsUploadingFaixaImg] = useState<string | null>(null);
  const fileInputDesbravadorRef = useRef<HTMLInputElement>(null);
  const fileInputLiderancaRef = useRef<HTMLInputElement>(null);
  const fileInputLiderRef = useRef<HTMLInputElement>(null);

  const isPathfinder = club === ClubType.PATHFINDER;
  const themeColor = isPathfinder ? '#dc371b' : '#800000';
  const themeBgLight = isPathfinder ? 'bg-[#dc371b]/5' : 'bg-[#800000]/5';

  useEffect(() => {
    setNewVideo(prev => ({ ...prev, club: club }));
    setNewVideoCategory(prev => ({ ...prev, club: club }));
    setNewTrunfo(prev => ({ ...prev, club: club }));
  }, [club]);

  // Carregar configurações de imagens dos globos da faixa
  useEffect(() => {
    fetchFaixaConfig().then(cfg => {
      if (cfg) setFaixaAdminConfig(cfg);
    }).catch(err => console.warn("Erro ao carregar faixaConfig no admin:", err));
  }, []);

  const handleSaveFaixaAdmin = async () => {
    setIsSavingFaixaConfig(true);
    const { error } = await updateFaixaConfig(faixaAdminConfig);
    setIsSavingFaixaConfig(false);
    if (error) {
      alert("Erro ao salvar configurações da faixa: " + (error.message || error));
    } else {
      setFaixaConfigSavedSuccess(true);
      setTimeout(() => setFaixaConfigSavedSuccess(false), 3000);
    }
  };

  const handleUploadFaixaFile = async (key: 'globo_desbravador' | 'globo_lideranca' | 'globo_lider', file: File) => {
    setIsUploadingFaixaImg(key);
    try {
      const { url, error } = await uploadFaixaImage(file, key);
      if (url) {
        setFaixaAdminConfig(prev => ({ ...prev, [key]: url }));
      } else if (error) {
        alert("Erro no upload da imagem: " + (error.message || error));
      }
    } catch (e: any) {
      alert("Erro ao processar imagem: " + e.message);
    } finally {
      setIsUploadingFaixaImg(null);
    }
  };

  const handleResetSingleFaixaGlobe = (key: 'globo_desbravador' | 'globo_lideranca' | 'globo_lider') => {
    setFaixaAdminConfig(prev => ({ ...prev, [key]: DEFAULT_FAIXA_CONFIG[key] }));
  };

  const handleResetAllFaixaGlobes = () => {
    if (confirm("Deseja restaurar as 3 imagens dos globos para os padrões oficiais da DSA?")) {
      setFaixaAdminConfig({ ...DEFAULT_FAIXA_CONFIG });
    }
  };

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

  // Preserve current page when switching clubs (only step back from item-specific details)
  useEffect(() => {
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
    setIsFloatingMenuOpenInNewArea(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeSubView]);

  // Ao abrir um tópico em Emblemas ou Uniformes (fechando o anterior), rolar automaticamente para posicionar o início do novo tópico no topo da tela
  useEffect(() => {
    if (activeAccordions.length === 1 && (activeSubView === 'EMBLEMS' || activeSubView === 'UNIFORMS')) {
      const openedId = activeAccordions[0];
      const scrollToTopicStart = (smooth: boolean) => {
        const container = scrollContainerRef.current;
        const topicEl = document.getElementById(`cultura-topic-${openedId}`);
        if (container && topicEl) {
          const containerRect = container.getBoundingClientRect();
          const topicRect = topicEl.getBoundingClientRect();
          const targetTop = Math.max(0, container.scrollTop + (topicRect.top - containerRect.top) - 10);
          if (smooth) {
            container.scrollTo({
              top: targetTop,
              behavior: 'smooth'
            });
          } else {
            container.scrollTop = targetTop;
          }
        } else if (topicEl) {
          topicEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        }
      };

      const rafId = requestAnimationFrame(() => {
        scrollToTopicStart(false);
      });
      const timer1 = setTimeout(() => {
        scrollToTopicStart(true);
      }, 60);
      const timer2 = setTimeout(() => {
        scrollToTopicStart(true);
      }, 180);

      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [activeAccordions, activeSubView]);

  const loadProfile = useCallback(() => {
    let isGuestStored = false;
    try {
      isGuestStored = localStorage.getItem('dbv_is_guest') === 'true';
    } catch {}
    if (isGuest || isGuestStored) {
      setUserAvatar(null);
      setUserEmail(null);
      setIsUserAdmin(false);
      setUserProfile(null);
      return;
    }
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserAvatar(parsed.avatar || null);
        setUserEmail(parsed.email || null);
        setIsUserAdmin(parsed.isAdmin || false);
        setUserProfile(prev => ({
          ...prev,
          user_id: prev?.user_id || '',
          nome: parsed.name || prev?.nome || '',
          email: parsed.email || prev?.email || '',
          funçao: parsed.cargo || parsed.funçao || prev?.funçao || '',
          clube: parsed.clube || prev?.clube || '',
          clubes: parsed.tipo || prev?.clubes || '',
          foto: parsed.avatar || prev?.foto || '',
          data_nascimento: parsed.data_nascimento || prev?.data_nascimento || '',
          ADM: Boolean(parsed.isAdmin ?? prev?.ADM)
        }));
      } catch { }
    } else {
      setUserAvatar(null);
      setUserEmail(null);
      setIsUserAdmin(false);
      setUserProfile(null);
    }
  }, [isGuest]);

  // Verifica se o usuário entrou com login válido (não está no modo "Entrar sem login")
  const isUserLoggedIn = React.useMemo(() => {
    if (isGuest) return false;
    if (userEmail && userEmail !== 'email@exemplo.com') return true;
    if (userProfile?.user_id || (userProfile?.email && userProfile.email !== 'email@exemplo.com') || userProfile?.nome) return true;
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean((parsed?.email && parsed.email !== 'email@exemplo.com') || parsed?.name);
      }
    } catch {}
    return false;
  }, [isGuest, userEmail, userProfile]);

  // Calcula a idade do usuário logado a partir da data de nascimento
  const userAge = React.useMemo(() => {
    let birthDate = userProfile?.data_nascimento || '';
    if (!birthDate && userProfile?.fundo) {
      try {
        const pf = JSON.parse(userProfile.fundo);
        if (pf?.data_nascimento) birthDate = pf.data_nascimento;
      } catch {
        if (/^\d{4}-\d{2}-\d{2}$/.test(userProfile.fundo)) birthDate = userProfile.fundo;
      }
    }
    if (!birthDate) {
      try {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.data_nascimento) birthDate = parsed.data_nascimento;
        }
      } catch {}
    }
    return calculateAge(birthDate);
  }, [userProfile]);

  // Cargo normalizado do usuário
  const normalizedUserRole = React.useMemo(() => {
    let rawRole = userProfile?.funçao || (userProfile as any)?.cargo || (userProfile as any)?.funcao || '';
    if (!rawRole) {
      try {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          rawRole = parsed?.cargo || parsed?.funçao || parsed?.funcao || '';
        }
      } catch {}
    }
    return String(rawRole || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }, [userProfile]);

  // Verifica se o usuário tem 16 anos ou mais (limite de idade para PDF de especialidade e PowerPoint)
  const isAgeAllowedForSpecialtyDocs = React.useMemo(() => {
    if (userAge !== null) {
      return userAge >= 16;
    }
    // Caso ainda não tenha data de nascimento preenchida, bloqueia se o cargo for juvenil (Desbravador/Aspirante)
    if (normalizedUserRole.includes('desbravador') || normalizedUserRole.includes('aspirante')) {
      return false;
    }
    return true;
  }, [userAge, normalizedUserRole]);

  // Gerador de PDF das Especialidades: oculto para quem entrar sem login e para menores de 16 anos
  const canGenerateSpecialtyPdf = React.useMemo(() => {
    return isUserLoggedIn && isAgeAllowedForSpecialtyDocs;
  }, [isUserLoggedIn, isAgeAllowedForSpecialtyDocs]);

  // Apresentação PowerPoint e Criar Sala de Prova Ao Vivo: liberado apenas de Conselheiro para cima (oculto para sem login, menores de 16 anos e cargos Aspirante, Desbravador(a), Aventureiro(a) e Capitão(ã))
  const canGenerateSpecialtyPptx = React.useMemo(() => {
    if (isUserAdmin) return true;
    if (!isUserLoggedIn || !isAgeAllowedForSpecialtyDocs) return false;

    if (!normalizedUserRole) return true;

    const isRestrictedRole =
      normalizedUserRole.includes('aspirante') ||
      normalizedUserRole.includes('desbravador') ||
      normalizedUserRole.includes('aventureiro') ||
      normalizedUserRole.includes('capitao') ||
      normalizedUserRole.includes('capita') ||
      normalizedUserRole.includes('secretario de unidade');

    return !isRestrictedRole;
  }, [isUserAdmin, isUserLoggedIn, isAgeAllowedForSpecialtyDocs, normalizedUserRole]);

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
    // Carregar especialidades favoritas do catálogo para o clube atual
    const local = getLocalCatalogFavorites(userEmail, club);
    setCompletedSpecialties(local);

    // Ouvinte para manter sincronizado quando o catálogo deste clube mudar
    const handleCatalogSync = (e: any) => {
      const clubKey = club === ClubType.ADVENTURER ? 'ADVENTURER' : 'PATHFINDER';
      if (e?.detail?.club === clubKey && Array.isArray(e?.detail?.favorites)) {
        setCompletedSpecialties(e.detail.favorites);
      }
    };
    window.addEventListener('dbv_catalog_favs_changed', handleCatalogSync);

    // Sincronizar perfil completo do usuário logado com o Supabase
    const hasLocalProfile = Boolean(localStorage.getItem(PROFILE_KEY));
    const isGuestStored = localStorage.getItem('dbv_is_guest') === 'true';
    if (!isGuest && !isGuestStored && hasLocalProfile) {
      supabase.auth.getUser()
        .then(({ data, error }) => {
          if (!error && data?.user) {
            fetchUserProfile(data.user.id)
              .then(profile => {
                if (profile) {
                  let localParsed: any = null;
                  try {
                    const savedProfile = localStorage.getItem(PROFILE_KEY);
                    if (savedProfile) localParsed = JSON.parse(savedProfile);
                  } catch {}

                  let fundoCargo = '';
                  let fundoBirthDate = '';
                  if (profile.fundo) {
                    try {
                      const pf = JSON.parse(profile.fundo);
                      if (pf?.cargo) fundoCargo = pf.cargo;
                      if (pf?.data_nascimento) fundoBirthDate = pf.data_nascimento;
                    } catch {
                      if (/^\d{4}-\d{2}-\d{2}$/.test(profile.fundo)) fundoBirthDate = profile.fundo;
                    }
                  }

                  const effectiveCargo = localParsed?.cargo || profile.funçao || (profile as any).cargo || fundoCargo || data.user.user_metadata?.cargo || '';
                  const effectiveBirthDate = localParsed?.data_nascimento || profile.data_nascimento || (profile as any)['data de nascimento'] || (profile as any)['nascimento'] || fundoBirthDate || data.user.user_metadata?.data_nascimento || '';
                  const effectiveName = localParsed?.name || profile.nome || '';
                  const effectiveClube = localParsed?.clube || profile.clube || profile.clube_de || '';
                  const effectiveAvatar = localParsed?.avatar || profile.foto || '';
                  const effectiveAdmin = Boolean(profile.ADM || localParsed?.isAdmin);

                  setUserProfile({
                    ...profile,
                    nome: effectiveName,
                    funçao: effectiveCargo,
                    clube: effectiveClube,
                    foto: effectiveAvatar,
                    data_nascimento: effectiveBirthDate,
                    email: data.user.email || localParsed?.email || profile.email,
                    ADM: effectiveAdmin
                  });

                  if (effectiveAdmin) {
                    setIsUserAdmin(true);
                  }
                  if (!userEmail && data.user.email) {
                    setUserEmail(data.user.email);
                  }
                  if (localParsed) {
                    localParsed.isAdmin = effectiveAdmin;
                    if (!localParsed.cargo && effectiveCargo) localParsed.cargo = effectiveCargo;
                    if (!localParsed.data_nascimento && effectiveBirthDate) localParsed.data_nascimento = effectiveBirthDate;
                    if (!localParsed.name && effectiveName) localParsed.name = effectiveName;
                    if (!localParsed.clube && effectiveClube) localParsed.clube = effectiveClube;
                    try {
                      localStorage.setItem(PROFILE_KEY, JSON.stringify(localParsed));
                    } catch {}
                  }
                }
              })
              .catch(err => console.warn("Erro ao buscar perfil:", err));
          }
        })
        .catch(err => console.warn("Erro ao verificar sessão:", err));
    }

    return () => {
      window.removeEventListener('dbv_catalog_favs_changed', handleCatalogSync);
    };
  }, [userEmail, isUserAdmin, club]);

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
    
    // Atualização otimista
    setCompletedSpecialties(newCompleted);
    
    // Salva exclusivamente nas favoritas de catálogo deste clube (não mistura com Minha Faixa)
    saveLocalCatalogFavorites(newCompleted, userEmail, club);
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

  const handleMinistryButtonClick = (targetClub: ClubType) => {
    if (club === targetClub) {
      if (activeSubView !== 'MAIN') {
        setActiveSubView('MAIN');
      }
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      onSwitchClub(targetClub);
    }
  };

  useEffect(() => {
    setAllSpecialtiesList([]);
    setSelectedVideoCategoryFilter('ALL');
    setCustomCertConfig((prev) => ({
      ...prev,
      ministry: club === ClubType.ADVENTURER ? 'AVT' : 'DBV',
      achievementName:
        club === ClubType.ADVENTURER
          ? 'Classes e Especialidades de Aventureiros'
          : 'Classes e Especialidades de Desbravadores'
    }));

    // Ao trocar de ministério, mantém a seção atual (ex: VIDEOS, CLASSES, SPECIALTIES, FORMULARIOS, LIBRARY, etc.)
    // e apenas retorna para a lista principal da seção caso estivesse em um item específico do ministério anterior
    if (activeSubView === 'VIDEO_PLAYER') {
      setActiveSubView('VIDEOS');
    } else if (activeSubView === 'SPECIALTY_DETAILS' || activeSubView === 'SPECIALTIES_LIST') {
      setActiveSubView('SPECIALTIES');
    } else if (activeSubView === 'CLASS_DETAILS') {
      setActiveSubView('CLASSES');
    } else if (activeSubView === 'PDF_VIEWER') {
      setActiveSubView(pdfReturnSubView || 'LIBRARY');
    }
  }, [club]);

  const openSpecialtySearch = () => {
    setIsSpecialtySearchOpen(true);
    if (allSpecialtiesList.length === 0) {
      setIsLoadingSearchSpecialties(true);
      fetchEspecialidades(club, undefined, { excludeQuestions: true })
        .then(setAllSpecialtiesList)
        .catch(err => console.warn("Erro ao buscar especialidades:", err))
        .finally(() => setIsLoadingSearchSpecialties(false));
    }
  };

  const reloadSpecialtyRequirements = async (specialty?: Especialidade | null) => {
    const target = specialty || selectedSpecialty;
    if (!target) return;
    setIsLoadingRequirements(true);
    try {
      const targetClub = target.club || club;
      if (target.id) {
        const directReqs = await fetchEspecialidadeRequisitos(targetClub, Number(target.id));
        if (directReqs.length > 0) {
          setSelectedSpecialty(prev => prev ? {
            ...prev,
            requisitos: directReqs
          } : null);
          return;
        }
      }

      const table = (targetClub === ClubType.ADVENTURER)
        ? 'EspecialidadesAVT'
        : 'EspecialidadesDBV';
      
      let query = supabase.from(table).select('Questoes, ID, Nome, Imagem, Categoria');
      if (target.id) {
        query = query.eq('id', target.id);
      } else if (target.codigo) {
        query = query.eq('ID', target.codigo);
      } else if (target.nome) {
        query = query.ilike('Nome', target.nome);
      }
      const { data, error } = await query.limit(1);
      if (!error && data && data.length > 0 && data[0].Questoes) {
        const freshReqs = data[0].Questoes
          .split(/\r?\n/)
          .map((r: string) => r.trim())
          .filter((r: string) => r.length > 0);
        if (freshReqs.length > 0) {
          setSelectedSpecialty(prev => prev ? {
            ...prev,
            requisitos: freshReqs,
            logo: prev.logo || data[0].Imagem,
            area: prev.area || data[0].Categoria
          } : null);
          return;
        }
      }
    } catch (err) {
      console.warn("Erro ao recarregar requisitos do banco:", err);
    } finally {
      setIsLoadingRequirements(false);
    }
  };

  // Garante que a especialidade selecionada sempre possua os requisitos oficiais do banco de dados carregados
  useEffect(() => {
    setExamPreviewQuestions([]);
    setExamError(null);
    if (selectedSpecialty && (!selectedSpecialty.requisitos || selectedSpecialty.requisitos.length === 0)) {
      reloadSpecialtyRequirements(selectedSpecialty);
    }
  }, [selectedSpecialty?.id, selectedSpecialty?.nome, selectedSpecialty?.requisitos?.length, club]);

  useEffect(() => {
    if (activeSubView === 'CLASSES') {
      setIsLoading(true);
      fetchClasses(club)
        .then(setClasses)
        .catch(err => console.warn("Erro ao carregar classes:", err))
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'SPECIALTIES' || activeSubView === 'SPECIALTIES_LIST' || activeSubView === 'SPECIALTY_DETAILS' || activeSubView === 'LIVE_EXAM' || activeSubView === 'QUIZ') {
      if (activeSubView === 'SPECIALTIES') {
        setIsLoading(true);
        fetchCategories(club)
          .then(setCategories)
          .catch(err => console.warn("Erro ao carregar categorias:", err))
          .finally(() => setIsLoading(false));
      }
      if (allSpecialtiesList.length === 0) {
        fetchEspecialidades(club, undefined, { excludeQuestions: true })
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
        Promise.all([
          ...promises,
          fetchAtividadesJogosAVT(),
          fetchCerimoniasAVT(),
          fetchVideosAVT()
        ]).then(([v, c, ajAvt, cerAvt, vAvt]) => {
          const virtualCategoriesAvt: VideoCategory[] = [
            { id: -3, nome: 'Tutorial de Especialidades', icone: 'Video', club: ClubType.ADVENTURER },
            { id: -1, nome: 'Atividades e Jogos', icone: 'Zap', club: ClubType.ADVENTURER },
            { id: -2, nome: 'Cerimônias', icone: 'Award', club: ClubType.ADVENTURER }
          ];
          setVideos([...v, ...ajAvt, ...cerAvt, ...vAvt]);
          setVideoCategories([...virtualCategoriesAvt, ...c]);
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
  }, [activeSubView, club, selectedBibleBook, selectedBibleChapter, dictionarySearch, bibleVersesRetryTrigger]);

  useEffect(() => {
    if (activeSubView === 'SPECIALTIES_LIST' && selectedCategory) {
      setIsLoading(true);
      if (selectedCategory.id === -100) {
        // Para favoritas, buscamos todas (modo leve sem Questoes) e filtramos pelas curtidas
        fetchEspecialidades(club, undefined, { excludeQuestions: true }).then(all => {
          const liked = all.filter(s => completedSpecialties.includes(s.id.toString()));
          setSpecialties(liked);
        }).catch(err => {
          console.warn("Erro ao carregar favoritas:", err);
        }).finally(() => setIsLoading(false));
      } else {
        // Filtra pelo nome da categoria
        const isMasteryCategory = selectedCategory.nome.toLowerCase().includes('mestrado');
        fetchEspecialidades(club, selectedCategory.nome, { excludeQuestions: !isMasteryCategory })
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
          <p className="text-xs font-bold text-slate-400">Carregando classes...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-[28px] p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
          <Layers size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma classe encontrada no momento.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              fetchClasses(club).then(setClasses).finally(() => setIsLoading(false));
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Recarregar Classes do Banco</span>
          </button>
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
        <div id="class-details-content" className="space-y-6">
          {/* Header da Classe Compacto */}
          <div id="class-header" className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 shadow-xl" style={{ backgroundColor: classColor }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mb-2">
                {selectedClass.imagem ? (
                  <img src={selectedClass.imagem} className="w-full h-full object-contain filter drop-shadow-md" alt={selectedClass.titulo} referrerPolicy="no-referrer" />
                ) : (
                  <Layers size={36} className="text-white" />
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                {selectedClass.titulo}
              </h3>
              {selectedClass.subtitulo && (
                <p className="text-white/85 text-[11px] sm:text-xs font-bold uppercase tracking-widest mt-1 px-4">
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

          <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.2em] ml-2 mb-2">Mestrados e Áreas</p>

          {categories.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[28px] p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <Folder size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhuma área de especialidade encontrada.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  fetchCategories(club).then(setCategories).finally(() => setIsLoading(false));
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm inline-flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Recarregar Áreas do Banco</span>
              </button>
            </div>
          ) : (
            categories.map((cat) => (
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
            ))
          )}
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
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-3 border-slate-100 border-t-slate-300 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400">Carregando especialidades...</p>
        </div>
      ) : specialties.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-[28px] p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
          <Award size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma especialidade carregada nesta categoria.
          </p>
          <button
            type="button"
            onClick={() => {
              if (selectedCategory) {
                setIsLoading(true);
                if (selectedCategory.id === -100) {
                  setSpecialties(allSpecialtiesList.filter(s => completedSpecialties.includes(s.id.toString())));
                  setIsLoading(false);
                } else {
                  fetchEspecialidades(club, selectedCategory.nome)
                    .then(setSpecialties)
                    .finally(() => setIsLoading(false));
                }
              }
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Recarregar Especialidades</span>
          </button>
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
                      <img src={esp.logo} loading="lazy" decoding="async" className="w-14 h-14 object-contain" alt={esp.nome} />
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
                  className={`w-11 h-11 min-w-[44px] max-w-[44px] min-h-[44px] max-h-[44px] shrink-0 flex-shrink-0 aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isCompleted ? 'text-red-500 bg-red-50 dark:bg-red-950/40' : 'text-slate-200 dark:text-slate-600 hover:text-red-200'}`}
                >
                  <Heart size={20} className="shrink-0" fill={isCompleted ? "currentColor" : "none"} />
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
      const sSigla = s.sigla || '';
      
      const isInList = rule.specialties.some(rs => {
        const rsName = normalize(rs);
        if (sName === rsName) return true;
        if ((rsName === "bacterias" && sName === "bacteria") || (rsName === "bacteria" && sName === "bacterias")) return true;
        return false;
      });

      if (!isInList) return false;

      // Proteções por sigla
      if (rule.name === "Mestrado em Atividades Profissionais") {
        return sSigla === "AP";
      }
      if (rule.name === "Mestrado em Testificação") {
        return sSigla === "AM" || sSigla === "MA";
      }
      if (rule.name === "Mestrado em Zoologia") {
        return sSigla === "EN" || sName === "zoonoses";
      }
      if (rule.name === "Mestrado em Botânica" || rule.name === "Mestrado em Ecologia") {
        return sSigla === "EN" || sSigla === "AG";
      }

      return true;
    });
  };

  // Fechar modal do PowerPoint ou Gerador de Provas com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPptxModalOpen && !isGeneratingPptx) {
        setIsPptxModalOpen(false);
      }
      if (e.key === 'Escape' && isExamModalOpen && !isGeneratingExam) {
        setIsExamModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPptxModalOpen, isGeneratingPptx, isExamModalOpen, isGeneratingExam]);

  const handleGeneratePptx = async () => {
    if (!selectedSpecialty || isGeneratingPptx) return;
    setIsGeneratingPptx(true);
    setPptxError(null);
    setPptxProgressMsg('Iniciando...');
    setPptxProgressPercent(5);

    try {
      await generateSpecialtyPowerPoint(selectedSpecialty, {
        instructorName: pptxInstructorName.trim() || userProfile?.nome || '',
        clubName: pptxClubName.trim() || '',
        unitName: pptxUnitName.trim() || '',
        includeAiAnswers: true,
        onProgress: (status, percent) => {
          setPptxProgressMsg(status);
          setPptxProgressPercent(percent);
        }
      });
      setIsPptxModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao gerar apresentação PowerPoint:', error);
      setPptxError(error?.message || 'Ocorreu um erro ao gerar a apresentação em PowerPoint. Tente novamente.');
    } finally {
      setIsGeneratingPptx(false);
      setPptxProgressMsg('');
      setPptxProgressPercent(0);
    }
  };

  const renderPptxModal = () => {
    if (!isPptxModalOpen || !selectedSpecialty || !canGenerateSpecialtyPptx) return null;

    // Calcula os requisitos reais usando parseAndNormalizeRequirements para não contar sub-itens como novos requisitos
    const parsedSpecialty = parseAndNormalizeRequirements(selectedSpecialty.requisitos || []);
    const totalRealReqs = parsedSpecialty.items.length;

    const modalContent = (
      <div 
        className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-2.5 sm:p-4 overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isGeneratingPptx) {
            setIsPptxModalOpen(false);
          }
        }}
      >
        <div 
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 dark:border-slate-700/80 m-auto max-h-[92vh] overflow-y-auto flex flex-col space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Topo do Modal */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                <Presentation size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight leading-snug">
                  Apresentação PowerPoint
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Gerar slides didáticos e instrutivos (.pptx)
                </p>
              </div>
            </div>
            <button 
              onClick={() => !isGeneratingPptx && setIsPptxModalOpen(false)}
              disabled={isGeneratingPptx}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors shrink-0 disabled:opacity-40"
              title="Fechar"
            >
              <X size={15} />
            </button>
          </div>

          {/* Card Resumo da Especialidade */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center space-x-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shrink-0">
              {selectedSpecialty.logo ? (
                <img src={getImageUrl(selectedSpecialty.logo)} alt={selectedSpecialty.nome} className="w-full h-full object-contain" />
              ) : (
                <Award size={18} className="text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight truncate">
                {selectedSpecialty.nome}
              </h4>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                  {selectedSpecialty.area}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  {totalRealReqs} Requisitos Oficiais
                </span>
              </div>
            </div>
          </div>

          {/* Informações da Geração Didática Unificada */}
          <div className="p-3 bg-gradient-to-r from-orange-50/90 to-amber-50/80 dark:from-orange-950/40 dark:to-slate-900/60 rounded-2xl border border-orange-200/70 dark:border-orange-900/50 space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={13} />
              </div>
              <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Geração Didática Completa (.pptx)
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-300">
              Todas as <strong>{totalRealReqs} questões oficiais</strong> com respostas explicativas completas, pontos fundamentais de fixação, dinâmicas práticas na unidade, conselhos pedagógicos ao instrutor e slides dedicados para cada sub-item.
            </p>
          </div>

          {/* Visualizador dos Itens Oficiais do Banco de Dados no Modal */}
          <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-slate-50/60 dark:bg-slate-900/50 shadow-xs transition-all">
            <button
              type="button"
              onClick={() => setShowPptxItemsList(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ListChecks size={13} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-white">
                    Visualizador de Itens do Banco ({parsedSpecialty.items.length} Requisitos)
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Itens Oficiais Conectados
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{showPptxItemsList ? 'Ocultar' : 'Expandir'}</span>
                {showPptxItemsList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>
            
            {showPptxItemsList && (
              <div className="p-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                {isLoadingRequirements ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-2">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Sincronizando itens oficiais do banco...
                    </span>
                  </div>
                ) : parsedSpecialty.items.length === 0 ? (
                  <div className="py-4 text-center space-y-2">
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Nenhum item detectado no banco de dados para esta especialidade.
                    </p>
                    <button
                      type="button"
                      onClick={() => reloadSpecialtyRequirements(selectedSpecialty)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 transition-colors"
                    >
                      <RefreshCw size={11} />
                      <span>Buscar Itens no Banco</span>
                    </button>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {parsedSpecialty.items.map((it, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/80 shadow-xs text-[10px]">
                        <div className="flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-black text-[9px] shrink-0 mt-0.5">
                            Item {it.itemNumber}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">
                              {it.cleanQuestion}
                            </p>
                            {it.subItems.length > 0 && (
                              <div className="mt-1.5 pl-2 border-l-2 border-indigo-200 dark:border-indigo-800 space-y-1 text-slate-600 dark:text-slate-300 text-[9.5px]">
                                {it.subItems.map((sub, sIdx) => (
                                  <div key={sIdx} className="leading-tight flex items-start gap-1">
                                    <span className="text-indigo-500 font-bold shrink-0">•</span>
                                    <span>{sub}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Campos de Personalização da Apresentação */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Personalização dos Slides:
            </label>
            <div className="space-y-1.5">
              <input 
                type="text"
                placeholder="Nome do Instrutor(a) / Conselheiro(a)"
                value={pptxInstructorName}
                onChange={(e) => setPptxInstructorName(e.target.value)}
                disabled={isGeneratingPptx}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  placeholder="Nome do Clube"
                  value={pptxClubName}
                  onChange={(e) => setPptxClubName(e.target.value)}
                  disabled={isGeneratingPptx}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
                <input 
                  type="text"
                  placeholder="Nome da Unidade"
                  value={pptxUnitName}
                  onChange={(e) => setPptxUnitName(e.target.value)}
                  disabled={isGeneratingPptx}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>
            </div>
          </div>

          {/* Barra de Progresso durante a Geração */}
          {isGeneratingPptx && (
            <div className="p-2.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-orange-900 dark:text-orange-200">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                  <span className="truncate">{pptxProgressMsg || 'Processando apresentação...'}</span>
                </span>
                <span className="shrink-0 ml-2">{pptxProgressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-orange-200/80 dark:bg-orange-900/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, pptxProgressPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Mensagem de Erro (se houver) */}
          {pptxError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
              {pptxError}
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsPptxModalOpen(false)}
              disabled={isGeneratingPptx}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGeneratePptx}
              disabled={isGeneratingPptx}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Presentation size={15} />
              <span>{isGeneratingPptx ? 'Gerando...' : 'Baixar (.pptx)'}</span>
            </button>
          </div>

        </div>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
  };

  const handlePreviewExamQuestions = async () => {
    if (!selectedSpecialty || isGeneratingExam) return;
    setIsGeneratingExam(true);
    setExamError(null);
    setExamProgressMsg('Elaborando questões e gabarito oficial...');
    setExamProgressPercent(15);

    try {
      const generated = await generateSpecialtyExamQuestions(selectedSpecialty, {
        instructorName: examInstructorName.trim() || userProfile?.nome || '',
        clubName: examClubName.trim() || userProfile?.clube || '',
        unitName: examUnitName.trim() || '',
        examDate: examDate.trim() || new Date().toLocaleDateString('pt-BR'),
        minPassingGrade: examMinGrade,
        questionCount: examQuestionCount,
        formatMode: examFormatMode,
        includeAnswerKey: examIncludeAnswerKey,
        includePracticalChecklist: examIncludePracticalChecklist,
        clubType: club,
        onProgress: (status, percent) => {
          setExamProgressMsg(status);
          setExamProgressPercent(percent);
        }
      });
      setExamPreviewQuestions(generated);
    } catch (err: any) {
      console.error('Erro ao pré-visualizar questões da prova:', err);
      setExamError(err?.message || 'Não foi possível elaborar a prévia das questões. Tente novamente.');
    } finally {
      setIsGeneratingExam(false);
      setExamProgressMsg('');
      setExamProgressPercent(0);
    }
  };

  const handleGenerateExamPdf = async () => {
    if (!selectedSpecialty || isGeneratingExam) return;
    setIsGeneratingExam(true);
    setExamError(null);
    setExamProgressMsg('Iniciando elaboração da prova...');
    setExamProgressPercent(10);

    try {
      const generated = await generateSpecialtyExamPdf(selectedSpecialty, {
        instructorName: examInstructorName.trim() || userProfile?.nome || '',
        clubName: examClubName.trim() || userProfile?.clube || '',
        unitName: examUnitName.trim() || '',
        examDate: examDate.trim() || new Date().toLocaleDateString('pt-BR'),
        minPassingGrade: examMinGrade,
        questionCount: examQuestionCount,
        formatMode: examFormatMode,
        includeAnswerKey: examIncludeAnswerKey,
        includePracticalChecklist: examIncludePracticalChecklist,
        clubType: club,
        preGeneratedQuestions: examPreviewQuestions.length > 0 ? examPreviewQuestions : undefined,
        onProgress: (status, percent) => {
          setExamProgressMsg(status);
          setExamProgressPercent(percent);
        }
      });
      setExamPreviewQuestions(generated);
      setIsExamModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao gerar PDF da prova:', err);
      setExamError(err?.message || 'Ocorreu um erro ao gerar o PDF da prova. Tente novamente.');
    } finally {
      setIsGeneratingExam(false);
      setExamProgressMsg('');
      setExamProgressPercent(0);
    }
  };

  const renderExamModal = () => {
    if (!isExamModalOpen || !selectedSpecialty || !canGenerateSpecialtyPptx) return null;

    const parsedSpecialty = parseAndNormalizeRequirements(selectedSpecialty.requisitos || []);
    const totalRealReqs = parsedSpecialty.items.length;

    const modalContent = (
      <div
        className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-2.5 sm:p-4 overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isGeneratingExam) {
            setIsExamModalOpen(false);
          }
        }}
      >
        <div
          className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-100 dark:border-slate-700/80 m-auto max-h-[92vh] overflow-y-auto flex flex-col space-y-3.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Topo do Modal */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight leading-snug">
                  Gerador de Prova Oficial
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Avaliação impressa em A4 + Folha de Gabarito do Instrutor (.pdf)
                </p>
              </div>
            </div>
            <button
              onClick={() => !isGeneratingExam && setIsExamModalOpen(false)}
              disabled={isGeneratingExam}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors shrink-0 disabled:opacity-40"
              title="Fechar"
            >
              <X size={15} />
            </button>
          </div>

          {/* Card Resumo da Especialidade */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center space-x-3">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shrink-0">
              {selectedSpecialty.logo ? (
                <img src={getImageUrl(selectedSpecialty.logo)} alt={selectedSpecialty.nome} className="w-full h-full object-contain" />
              ) : (
                <Award size={18} className="text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight truncate">
                {selectedSpecialty.nome}
              </h4>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                  {selectedSpecialty.area}
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {totalRealReqs} Requisitos Oficiais
                </span>
              </div>
            </div>
          </div>

          {/* 1. Estilo / Formato da Prova */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              1. Formato das Questões:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'MISTA' as ExamFormatMode,
                  title: 'Mista (Recomendada)',
                  desc: 'Múltipla escolha, V/F e abertas'
                },
                {
                  id: 'MULTIPLA_ESCOLHA' as ExamFormatMode,
                  title: '100% Objetiva',
                  desc: 'Apenas alternativas (A, B, C, D)'
                },
                {
                  id: 'DISCURSIVA_PRATICA' as ExamFormatMode,
                  title: 'Discursiva + Prática',
                  desc: 'Linhas pautadas e parecer prático'
                }
              ].map((mode) => {
                const active = examFormatMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    disabled={isGeneratingExam}
                    onClick={() => {
                      setExamFormatMode(mode.id);
                      setExamPreviewQuestions([]);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/40'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-[11px] font-black uppercase tracking-tight leading-tight">
                      {mode.title}
                    </div>
                    <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {mode.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Quantidade de Questões e Nota Mínima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                2. Quantidade de Questões:
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700">
                {([5, 8, 10, 'ALL'] as const).map((cnt) => {
                  const active = examQuestionCount === cnt;
                  return (
                    <button
                      key={String(cnt)}
                      type="button"
                      disabled={isGeneratingExam}
                      onClick={() => {
                        setExamQuestionCount(cnt);
                        setExamPreviewQuestions([]);
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                        active
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cnt === 'ALL' ? `Todas (${totalRealReqs || 'Auto'})` : `${cnt} Q`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Nota Mínima de Aprovação:
              </label>
              <select
                value={examMinGrade}
                onChange={(e) => setExamMinGrade(e.target.value)}
                disabled={isGeneratingExam}
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="7,0 (70%)">Nota 7,0 (70% de acerto)</option>
                <option value="8,0 (80%)">Nota 8,0 (80% de acerto)</option>
                <option value="6,0 (60%)">Nota 6,0 (60% de acerto)</option>
                <option value="100% dos requisitos">100% de aproveitamento</option>
              </select>
            </div>
          </div>

          {/* 3. Recursos do Avaliador */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="pr-2">
                <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight block">
                  Incluir Folha de Gabarito Oficial do Instrutor
                </span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block">
                  Gera uma página separada no final do PDF com respostas exatas e critérios de correção
                </span>
              </div>
              <input
                type="checkbox"
                checked={examIncludeAnswerKey}
                onChange={(e) => setExamIncludeAnswerKey(e.target.checked)}
                disabled={isGeneratingExam}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
              />
            </label>

            <div className="h-px bg-slate-200/70 dark:bg-slate-800" />

            <label className="flex items-center justify-between cursor-pointer select-none">
              <div className="pr-2">
                <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight block">
                  Quadro de Parecer Prático nos Requisitos Demonstrativos
                </span>
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block">
                  Adiciona campos de homologação prática (100% / Parcial / Refazer) para itens práticos
                </span>
              </div>
              <input
                type="checkbox"
                checked={examIncludePracticalChecklist}
                onChange={(e) => setExamIncludePracticalChecklist(e.target.checked)}
                disabled={isGeneratingExam}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer shrink-0"
              />
            </label>
          </div>

          {/* 4. Cabeçalho Personalizado da Prova */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              3. Identificação no Cabeçalho da Folha:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nome do Instrutor(a) / Avaliador(a)"
                value={examInstructorName}
                onChange={(e) => setExamInstructorName(e.target.value)}
                disabled={isGeneratingExam}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <input
                type="text"
                placeholder="Data da Prova (ex: 04/10/2026)"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                disabled={isGeneratingExam}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <input
                type="text"
                placeholder="Nome do Clube"
                value={examClubName}
                onChange={(e) => setExamClubName(e.target.value)}
                disabled={isGeneratingExam}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <input
                type="text"
                placeholder="Unidade / Classe (Opcional)"
                value={examUnitName}
                onChange={(e) => setExamUnitName(e.target.value)}
                disabled={isGeneratingExam}
                className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          {/* 5. Pré-visualização Interativa das Questões e Gabarito no App */}
          <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-slate-50/70 dark:bg-slate-900/50">
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-slate-100/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <ListChecks size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-tight text-slate-800 dark:text-white truncate">
                  {examPreviewQuestions.length > 0
                    ? `Prévia da Prova (${examPreviewQuestions.length} Questões Prontas)`
                    : 'Prévia Interativa das Questões (Opcional)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {examPreviewQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowExamPreviewGabarito(prev => !prev)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[9.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    {showExamPreviewGabarito ? 'Ocultar Gabarito' : 'Ver Gabarito'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={isGeneratingExam}
                  onClick={handlePreviewExamQuestions}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 transition-colors disabled:opacity-40"
                >
                  <RefreshCw size={11} className={isGeneratingExam ? 'animate-spin' : ''} />
                  <span>{examPreviewQuestions.length > 0 ? 'Gerar Novas' : 'Gerar Prévia'}</span>
                </button>
              </div>
            </div>

            {examPreviewQuestions.length > 0 && (
              <div className="p-3 max-h-60 overflow-y-auto space-y-2.5 scrollbar-thin">
                {examPreviewQuestions.map((q) => (
                  <div
                    key={q.number}
                    className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 text-[11px] space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black text-[9.5px] uppercase">
                        Questão {String(q.number).padStart(2, '0')} • {q.requirementRef}
                      </span>
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase">
                        {q.weight.toFixed(1).replace('.', ',')} pt
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      {q.stem}
                    </p>
                    {q.type === 'MULTIPLA_ESCOLHA' && q.options && (
                      <div className="space-y-1 pt-1">
                        {q.options.map((opt) => {
                          const isCorrect = showExamPreviewGabarito && q.correctOption === opt.letter;
                          return (
                            <div
                              key={opt.letter}
                              className={`px-2 py-1 rounded-lg text-[10px] flex items-start gap-1.5 ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <span className="font-black shrink-0">{opt.letter})</span>
                              <span>{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.type === 'VERDADEIRO_FALSO' && q.vfStatements && (
                      <div className="space-y-1 pt-1">
                        {q.vfStatements.map((st, sIdx) => (
                          <div key={sIdx} className="text-[10px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                            <span className="font-black text-emerald-700 dark:text-emerald-400 shrink-0">
                              ({showExamPreviewGabarito ? (st.isTrue ? 'V' : 'F') : ' '})
                            </span>
                            <span>{st.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {showExamPreviewGabarito && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/70 text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-lg">
                        <span className="font-black uppercase tracking-wider block text-[9px] text-emerald-600 dark:text-emerald-400">
                          Gabarito Oficial do Instrutor:
                        </span>
                        <span className="font-medium leading-relaxed">{q.expectedAnswer}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barra de Progresso */}
          {isGeneratingExam && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="truncate">{examProgressMsg || 'Elaborando avaliação...'}</span>
                </span>
                <span className="shrink-0 ml-2">{examProgressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-emerald-200/80 dark:bg-emerald-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, examProgressPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Mensagem de Erro */}
          {examError && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium">
              {examError}
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              disabled={isGeneratingExam}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerateExamPdf}
              disabled={isGeneratingExam}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <ClipboardCheck size={15} />
              <span>{isGeneratingExam ? 'Gerando Prova...' : 'Baixar Prova + Gabarito (.pdf)'}</span>
            </button>
          </div>
        </div>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
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
        <div id="specialty-details-content" className="space-y-6">
          {/* Header da Especialidade: No Celular (Imagem no Topo e Textos Abaixo) / No PC (Imagem à Esquerda e Textos à Direita) */}
          <div id="specialty-header" className="bg-white dark:bg-slate-800 rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative">
            <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4 md:gap-6 text-center md:text-left w-full">
              {/* Imagem da Especialidade (Centralizada no topo no celular, à esquerda no PC) */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-28 md:h-28 shrink-0 flex items-center justify-center mb-1 md:mb-0">
                {selectedSpecialty.logo ? (
                  <img src={getImageUrl(selectedSpecialty.logo)} className="w-full h-full object-contain filter drop-shadow-sm" alt={selectedSpecialty.nome} referrerPolicy="no-referrer" />
                ) : (
                  <Award size={40} className="text-slate-200 dark:text-slate-600" />
                )}
              </div>

              {/* Textos (Centralizados abaixo da imagem no celular, à direita no PC) */}
              <div className="flex-1 min-w-0 flex flex-col justify-center items-center md:items-start text-center md:text-left w-full">
                <h3 className="text-xl sm:text-2xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight mb-2.5">
                  {selectedSpecialty.nome}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
                  <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                      {selectedSpecialty.area}
                    </span>
                  </div>
                  <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-indigo-50 dark:bg-indigo-950/50 rounded-full">
                    <span className="text-[9px] sm:text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                      {selectedSpecialty.codigo || `${selectedSpecialty.sigla}${String(selectedSpecialty.id).padStart(3, '0')}`}
                    </span>
                  </div>
                  {selectedSpecialty.nivel && (
                    <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-50 dark:bg-slate-700/50 rounded-full border border-slate-100 dark:border-slate-600">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                        Nível {selectedSpecialty.nivel.toUpperCase().replace('NÍVEL', '').replace('NIVEL', '').trim()}
                      </span>
                    </div>
                  )}
                  {selectedSpecialty.ano && (
                    <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-50 dark:bg-slate-700/50 rounded-full border border-slate-100 dark:border-slate-600">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                        {selectedSpecialty.ano}
                      </span>
                    </div>
                  )}
                  {selectedSpecialty.origem && (
                    <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-slate-50 dark:bg-slate-700/50 rounded-full border border-slate-100 dark:border-slate-600">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                        {selectedSpecialty.origem}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div id="specialty-requirements-title" className="px-2 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {isMastery ? 'Especialidades e Requisitos' : 'Requisitos'}
              </h4>
              <div className="flex items-center gap-1.5">
                {isLoadingRequirements && (
                  <span className="flex items-center gap-1 text-[9.5px] font-bold text-amber-600 dark:text-amber-400 animate-pulse bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Sincronizando...
                  </span>
                )}
                <span className="text-[9.5px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                  {selectedSpecialty.requisitos?.length || 0} Itens do Banco de Dados
                </span>
              </div>
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

                  // Se for uma nota/aviso geral oficial da especialidade
                  const isGeneralNote = /^(?:nota|obs|observa[çc][aã]o|aten[çc][aã]o|importante|aviso|pr[eé]-requisito|instru[çc][aã]o|recomend[aã]o|dica)(?:\s*do\s*instrutor)?\s*[\:\-]/i.test(trimmedReq);
                  if (isGeneralNote) {
                    return (
                      <div key={idx} className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-[22px] p-4 shadow-sm flex items-start space-x-3.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20 mt-0.5">
                          <Info size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                            Orientação Oficial da Especialidade
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 leading-snug">
                            {trimmedReq}
                          </p>
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

                  // Se for um sub-item marcado por letras, numeração romana ou traço
                  if (isRequirementSubItem(trimmedReq)) {
                    const letterMatch = trimmedReq.match(/^(?:\(([a-z0-9])\)|([a-z0-9])[\.\-\)\:])\s*(.*)/i);
                    const letter = letterMatch ? (letterMatch[1] || letterMatch[2]).toUpperCase() : '•';
                    const subText = letterMatch ? letterMatch[3] : trimmedReq.replace(/^[\-\•\*\–\—]\s*/, '');

                    return (
                      <div key={idx} className="ml-3 sm:ml-7 pl-3 sm:pl-4 border-l-2 border-indigo-200 dark:border-indigo-800/80 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-3.5 flex items-start space-x-3 transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/60 shadow-xs">
                        <div className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {letter}
                        </div>
                        <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 leading-snug">
                          {subText}
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
              ) : isLoadingRequirements ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-8 text-center space-y-3 shadow-xs">
                  <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                    Sincronizando itens oficiais do banco de dados...
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[24px] p-8 text-center space-y-3 shadow-xs">
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Nenhum requisito carregado no momento.</p>
                  <button
                    type="button"
                    onClick={() => reloadSpecialtyRequirements(selectedSpecialty)}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800 transition-colors inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <RefreshCw size={13} />
                    <span>Recarregar Itens do Banco</span>
                  </button>
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

        {/* Ações de Exportação: PDF (apenas usuários logados com 16+ anos), Apresentação PowerPoint Didática, Gerador de Prova Oficial e Prova Ao Vivo com QR Code */}
        {(canGenerateSpecialtyPdf || canGenerateSpecialtyPptx) && (
          <div className={`grid grid-cols-1 ${canGenerateSpecialtyPdf && canGenerateSpecialtyPptx ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'} gap-3 pt-2`}>
            {canGenerateSpecialtyPdf && (
              <button 
                onClick={generateSpecialtyPDF}
                disabled={isGeneratingPDF || isGeneratingPptx || isGeneratingExam}
                className="w-full py-4 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Download size={18} className="shrink-0" />
                <span>{isGeneratingPDF ? 'Gerando PDF...' : 'PDF de Requisitos'}</span>
              </button>
            )}

            {canGenerateSpecialtyPptx && (
              <button 
                onClick={() => {
                  setExamError(null);
                  if (!examInstructorName && userProfile?.nome) {
                    setExamInstructorName(userProfile.nome);
                  }
                  if (!examClubName && userProfile?.clube) {
                    setExamClubName(userProfile.clube);
                  }
                  setIsExamModalOpen(true);
                }}
                disabled={isGeneratingPDF || isGeneratingPptx || isGeneratingExam}
                className="w-full py-4 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <ClipboardCheck size={18} className="shrink-0" />
                <span>{isGeneratingExam ? 'Gerando Prova...' : 'Gerador de Prova (.pdf)'}</span>
              </button>
            )}

            {canGenerateSpecialtyPptx && (
              <button
                onClick={() => {
                  setActiveSubView('LIVE_EXAM');
                }}
                disabled={isGeneratingPDF || isGeneratingPptx || isGeneratingExam}
                className="w-full py-4 px-3 bg-gradient-to-r from-rose-600 via-red-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <QrCode size={18} className="shrink-0" />
                <span>Prova Ao Vivo (QR Code)</span>
              </button>
            )}

            {canGenerateSpecialtyPptx && (
              <button 
                onClick={() => {
                  setPptxError(null);
                  if (!pptxInstructorName && userProfile?.nome) {
                    setPptxInstructorName(userProfile.nome);
                  }
                  setIsPptxModalOpen(true);
                }}
                disabled={isGeneratingPDF || isGeneratingPptx || isGeneratingExam}
                className="w-full py-4 px-3 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Presentation size={18} className="shrink-0" />
                <span>{isGeneratingPptx ? 'Gerando Slides...' : 'Slides PowerPoint (.pptx)'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  const renderCultureMenu = () => {
    const cultureItems = [
      { label: 'Ideais e Hino', subtitle: 'Voto, Lei e Música', icon: Music, gradient: 'from-[#0052D4] via-[#4364F7] to-[#6FB1FC]', action: () => setActiveSubView('IDEALS_ANTHEM') },
      { 
        label: 'História', 
        subtitle: 'Origem e Pioneiros', 
        icon: Globe, 
        gradient: 'from-[#fd7e14] via-[#f59e0b] to-[#fbbf24]', 
        action: () => {
          if (club === ClubType.ADVENTURER) {
            setSelectedHistory('historia_mundial');
            setActiveSubView('HISTORY_DETAIL');
          } else {
            setActiveSubView('HISTORY_LIST');
          }
        }
      },
      { label: 'Uniformes', subtitle: 'Oficial e de Atividades', icon: Shirt, gradient: 'from-[#059669] via-[#10b981] to-[#34d399]', action: () => { setActiveAccordions([]); setActiveSubView('UNIFORMS'); } },
      { label: 'Emblemas', subtitle: 'Insígnias e Significados', icon: Shield, gradient: 'from-[#6a11cb] via-[#7F00FF] to-[#9d4edd]', action: () => { setActiveAccordions([]); setActiveSubView('EMBLEMS'); } }
    ];

    return (
      <div className="animate-slide-in grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 pb-28">
        {cultureItems.map((item, i) => {
          const IconComp = item.icon;
          return (
            <button 
              key={i}
              onClick={item.action}
              className={`w-full relative overflow-hidden bg-gradient-to-br ${item.gradient} rounded-[28px] p-5 flex flex-col justify-between text-left text-white shadow-md hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all group min-h-[125px] border border-white/20`}
            >
              <div className="absolute -bottom-3 -right-3 text-white/15 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <IconComp className="w-28 h-28 stroke-[1.4]" />
              </div>
              <div className="relative z-10 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <IconComp size={22} strokeWidth={2.4} />
              </div>
              <div className="relative z-10 mt-3">
                <h4 className="text-base font-black text-white uppercase tracking-tight leading-tight drop-shadow-xs">{item.label}</h4>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-0.5">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

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
    if (club === ClubType.ADVENTURER) {
      return renderHistoryDetail();
    }

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

    const effectiveHistoryKey = selectedHistory || (club === ClubType.ADVENTURER ? 'historia_mundial' : '');
    const title = effectiveHistoryKey ? historyMap[effectiveHistoryKey] : '';
    const content = effectiveHistoryKey ? (culturaData as any)?.[effectiveHistoryKey] : '';
    const historyImage = effectiveHistoryKey ? (culturaData as any)?.[`${effectiveHistoryKey}_img`] : '';

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
        prev.includes(id) ? [] : [id]
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
    
    // Ícone dinâmico baseado no título e na aba atual para o card principal
    const getHeaderIcon = (title: string) => {
      const t = title.toLowerCase();
      if (activeSubView === 'UNIFORMS') {
        if (t.includes('posição') || t.includes('emblema') || t.includes('platina') || t.includes('galão')) return <Shield size={22} />;
        if (t.includes('faixa')) return <Award size={22} />;
        return <Shirt size={22} />;
      }
      if (activeSubView === 'EMBLEMS' || t.includes('emblema') || t.includes('insígnia') || t.includes('distintivo') || t.includes('bandeira') || t.includes('bandeirim')) {
        return <Shield size={22} />;
      }
      if (t.includes('uniforme')) return <Shirt size={22} />;
      return <FileText size={22} />;
    };

    return (
      <div key={item.id} id={`cultura-topic-${item.id}`} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] shadow-sm overflow-hidden mb-4 scroll-mt-4">
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
    const uniforms = getOfficialRudUniforms(club);
    
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

          {/* Créditos e Fonte Oficial das Informações dos Uniformes */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/70">
            <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900/60">
                  <Shield size={18} />
                </div>
                <div className="space-y-1 text-left">
                  <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    {RUD_CREDITS.titulo}
                  </h5>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                    {club === ClubType.ADVENTURER
                      ? 'Regulamento de Uniformes do Ministério de Aventureiros — Divisão Sul-Americana (DSA / IASD)'
                      : 'Regulamento de Uniformes do Ministério de Desbravadores — Divisão Sul-Americana (DSA / IASD)'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {RUD_CREDITS.acervo}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                <a
                  href={RUD_CREDITS.urlWikiUniforme}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                >
                  <ExternalLink size={12} />
                  <span>Wiki MDA (RUD)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmblems = () => {
    const rawList = normalizeCulturaList(culturaData?.emblemas_list);
    const filtered = rawList.filter(item => item.club === club);
    const emblems = filtered.length > 0 ? filtered : getOfficialRudEmblems(club);
    const wikiUrl = club === ClubType.ADVENTURER ? RUD_CREDITS.urlWikiEmblemasAvt : RUD_CREDITS.urlWikiEmblemasDbv;
    
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

          {/* Créditos e Fonte Oficial das Informações dos Emblemas */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/70">
            <div className="bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100 dark:border-indigo-900/60">
                  <Shield size={18} />
                </div>
                <div className="space-y-1 text-left">
                  <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    {RUD_CREDITS.titulo}
                  </h5>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                    {club === ClubType.ADVENTURER
                      ? 'Regulamento de Uniformes do Ministério de Aventureiros — Divisão Sul-Americana (DSA / IASD)'
                      : 'Regulamento de Uniformes do Ministério de Desbravadores — Divisão Sul-Americana (DSA / IASD)'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {RUD_CREDITS.acervo}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                >
                  <ExternalLink size={12} />
                  <span>Wiki MDA (RUD)</span>
                </a>
              </div>
            </div>
          </div>
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
      { id: 'MANUAIS_AVT', label: 'Manuais AVT', icon: <FileText size={24} />, color: 'bg-indigo-500' },
      { id: 'MATERIALS', label: 'Materiais', icon: <Folder size={24} />, color: 'bg-purple-500' }
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
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <Book size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                Nenhum livro ou manual carregado nesta seção.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  if (isPathfinder) {
                    Promise.all([
                      fetchLivrosClasses(),
                      fetchLivrosAno(),
                      fetchOutrosLivros(),
                      fetchManuaisDBV()
                    ]).then(([c, a, o, m]) => {
                      setLivrosClasses(c);
                      setLivrosAno([...a].sort((x, y) => (Number(y.Ano) || 0) - (Number(x.Ano) || 0)));
                      setOutrosLivros(o);
                      setManuaisDBV(m);
                    }).finally(() => setIsLoading(false));
                  } else {
                    Promise.all([
                      fetchLivrosAVT(),
                      fetchManuaisAVT()
                    ]).then(([livros, manuais]) => {
                      setLivrosAVT(livros);
                      setManuaisAVT(manuais);
                    }).finally(() => setIsLoading(false));
                  }
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm inline-flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Recarregar do Banco de Dados</span>
              </button>
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
                      const thumb = item.Capa || item.capa || item.Imagem || item.imagem || item.ClasseIMG || '';
                      setSelectedPdfThumbnail(thumb ? getImageUrl(thumb) : null);
                      setPdfReturnSubView('LIBRARY');
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
    <div className="animate-slide-in h-full flex flex-col flex-grow w-full bg-slate-100 dark:bg-slate-950 md:rounded-3xl overflow-hidden md:border md:border-slate-200/80 md:dark:border-slate-800 md:shadow-md">
      <div className="flex-grow flex flex-col relative h-full min-h-[500px]">
        {selectedPdfUrl ? (
          <>
            {/* Bloqueia e oculta o botão flutuante de abrir em outra janela do Google Drive no canto superior direito */}
            <div 
              className="absolute top-2 right-2 w-12 h-12 z-20 bg-slate-900/95 dark:bg-slate-900 rounded-xl flex items-center justify-center text-white/80 shadow-md select-none pointer-events-auto"
              title={pdfTitle || 'Leitura no App'}
            >
              <BookOpen size={18} />
            </div>
            <iframe 
              src={selectedPdfUrl} 
              className="w-full h-full border-none flex-grow bg-slate-50 dark:bg-slate-900"
              title={pdfTitle}
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 font-bold text-sm p-6 text-center space-y-2">
            <BookOpen size={36} className="text-slate-300 dark:text-slate-600" />
            <p>Documento não disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMaterialsMenu = () => {
    const materialsItems = [
      ...(club === ClubType.PATHFINDER
        ? [{ id: 'CAMPING', label: 'Camping', subtitle: 'Atividades e Nós', icon: MapPin, gradient: 'from-[#f12711] via-[#f5576c] to-[#f0932b]' }]
        : []),
      { id: 'FORMULARIOS', label: 'Formulários', subtitle: 'Fichas e Documentos', icon: FileText, gradient: 'from-[#e11d48] via-[#f43f5e] to-[#fb7185]' }
    ];

    return (
      <div className="animate-slide-in grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 pb-28">
        {materialsItems.map((item) => {
          const IconComp = item.icon;
          return (
            <button 
              key={item.id}
              onClick={() => setActiveSubView(item.id as any)}
              className={`w-full relative overflow-hidden bg-gradient-to-br ${item.gradient} rounded-[28px] p-5 flex flex-col justify-between text-left text-white shadow-md hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all group min-h-[125px] border border-white/20`}
            >
              <div className="absolute -bottom-3 -right-3 text-white/15 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <IconComp className="w-28 h-28 stroke-[1.4]" />
              </div>
              <div className="relative z-10 w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <IconComp size={22} strokeWidth={2.4} />
              </div>
              <div className="relative z-10 mt-3">
                <h4 className="text-base font-black text-white uppercase tracking-tight leading-tight drop-shadow-xs">{item.label}</h4>
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-0.5">{item.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

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
                  const thumb = item.Capa || '';
                  setSelectedPdfThumbnail(thumb ? getImageUrl(thumb) : null);
                  setPdfReturnSubView('CAMPING');
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
    const activeMinistry: 'DBV' | 'AVT' = club === ClubType.ADVENTURER ? 'AVT' : 'DBV';
    const isAvtArea = activeMinistry === 'AVT';

    const categories = [
      {
        id: 'fichas',
        label: 'Fichas de Atividades',
        subtitle: isAvtArea
          ? 'Cadernos das Classes (Abelhinhas a Mãos Ajudadoras), Líder e Rede Familiar (RFA)'
          : 'Cadernos de Classes Regulares, Avançadas, Líder e Controle do Instrutor',
        icon: <FileText size={18} />
      },
      {
        id: 'forms',
        label: 'Formulários',
        subtitle: isAvtArea
          ? 'Secretaria, Matrícula Infantil, Ficha Médica, Autorizações ECA/LGPD e Rede Familiar'
          : 'Secretaria, Matrícula, Ficha Médica, Autorizações ECA/LGPD e Cantinho da Unidade',
        icon: <Layers size={18} />
      },
      {
        id: 'certificados',
        label: 'Certificados',
        subtitle: isAvtArea
          ? 'Investidura das Classes de Aventureiros, Especialidades Infantis e Ano Bíblico'
          : 'Investidura de Classes Regulares/Avançadas, Especialidades, Mestrados e Ano Bíblico',
        icon: <Award size={18} />
      },
      {
        id: 'graficos',
        label: 'Materiais Gráficos',
        subtitle: isAvtArea
          ? 'Emblemas Oficiais de Aventureiros (A1 a A5 e L A1) em CorelDRAW'
          : 'Emblemas Oficiais de Desbravadores (D1 a D5 e L1 a L3) em CorelDRAW',
        icon: <Sparkles size={18} />
      }
    ];

    const resolveFormMinistry = (f: Formulario): 'DBV' | 'AVT' => {
      const linkLower = (f.link || '').toLowerCase();
      const text = `${f.titulo || ''} ${f.descricao || ''} ${linkLower}`.toLowerCase();
      if (
        linkLower.includes('ministerioaventureiros') ||
        linkLower.includes('/aventureiros/') ||
        text.includes('aventureir') ||
        text.includes('abelhinha') ||
        text.includes('luminar') ||
        text.includes('edificador') ||
        text.includes('mãos ajudadoras') ||
        text.includes('maos ajudadoras')
      ) {
        return 'AVT';
      }
      if (
        linkLower.includes('/desbravadores/') ||
        text.includes('desbravador') ||
        text.includes('pioneiro') ||
        text.includes('excursionista') ||
        text.includes('pesquisador')
      ) {
        return 'DBV';
      }
      const raw = (f.icone || '').toUpperCase().trim();
      if (raw === 'AVT') return 'AVT';
      return 'DBV';
    };

    const filteredAll = formularios.filter((f) => {
      if (f.categoria === 'graficos') return false;
      const itemMinistry = resolveFormMinistry(f);
      const matchesMinistry = itemMinistry === activeMinistry;
      const q = formularioSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (f.titulo || '').toLowerCase().includes(q) ||
        (f.descricao || '').toLowerCase().includes(q);
      return matchesMinistry && matchesSearch;
    });

    const filteredCorelEmblemsAll = OFFICIAL_COREL_EMBLEMS.filter((emb) => {
      if (emb.ministry !== activeMinistry) return false;
      const q = formularioSearchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        emb.title.toLowerCase().includes(q) ||
        emb.code.toLowerCase().includes(q) ||
        emb.subtitle.toLowerCase().includes(q)
      );
    });

    const totalItemsCount = filteredAll.length + filteredCorelEmblemsAll.length;

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Cabeçalho Oficial do Ministério Atual (Desbravadores ou Aventureiros) e Busca */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest">
                Acervo Oficial • {isAvtArea ? 'Ministério de Aventureiros (DSA)' : 'Ministério de Desbravadores (DSA)'}
              </span>
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm sm:text-base mt-1">
                Central de Fichas, Formulários, Certificados e Emblemas — {isAvtArea ? 'Aventureiros' : 'Desbravadores'} ({totalItemsCount})
              </h3>
            </div>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={formularioSearchQuery}
              onChange={(e) => setFormularioSearchQuery(e.target.value)}
              placeholder={
                isAvtArea
                  ? 'Buscar caderno de classe de aventureiros, ficha médica, autorização, certificado, emblema A1...'
                  : 'Buscar caderno de classe de desbravadores, ficha médica, autorização, certificado, emblema D1...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-red-500"
            />
          </div>
        </div>

        {categories.map((cat) => {
          const catItems = filteredAll.filter((f) => f.categoria === cat.id);
          const filteredCorelEmblems = filteredCorelEmblemsAll;
          const displayCount = cat.id === 'graficos' ? filteredCorelEmblems.length : catItems.length;

          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between pl-1 pr-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm leading-tight">
                      {cat.label}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider shrink-0">
                  {displayCount} {displayCount === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-[24px] p-3 border-l-4 border-red-500 space-y-3 shadow-sm">
                {/* =========================================================================
                    SEÇÃO ESPECIAL DE CERTIFICADOS: PADRÃO OFICIAL + PERSONALIZAÇÃO NO DOWNLOAD
                   ========================================================================= */}
                {cat.id === 'certificados' && (
                  <div id="cert-customizer-anchor" className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[9px] font-black uppercase tracking-widest">
                          Padrão Oficial {isAvtArea ? 'Aventureiros' : 'Desbravadores'} • Personalizável na Hora de Baixar
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mt-1">
                          Modelo Padrão de Certificado & Personalização ({isAvtArea ? 'Clube de Aventureiros' : 'Clube de Desbravadores'})
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                          Visualize o modelo padrão abaixo e personalize com o nome do seu Clube e Associação/Missão antes de baixar em PDF A4 ou PNG.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCertCustomizerOpen(!isCertCustomizerOpen)}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                      >
                        {isCertCustomizerOpen ? 'Ocultar Personalizador' : 'Personalizar Certificado'}
                      </button>
                    </div>

                    {/* PRÉ-VISUALIZAÇÃO DO CERTIFICADO PADRÃO (ATUALIZA AO VIVO COM CLUBE E ASSOCIAÇÃO) */}
                    <div className="relative rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-[#fffdf9] via-white to-[#fef9ee] border-4 border-double border-red-700 shadow-inner text-center space-y-2 overflow-hidden">
                      <div className="border border-amber-500/60 rounded-xl p-3 sm:p-5 space-y-2">
                        <div className="flex justify-center">
                          <img
                            src={
                              isAvtArea
                                ? 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png'
                                : 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png'
                            }
                            alt="Emblema Oficial"
                            className="w-11 h-11 sm:w-14 sm:h-14 object-contain mx-auto"
                          />
                        </div>
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                          Igreja Adventista do Sétimo Dia • Divisão Sul-Americana
                        </p>
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-900">
                          {customCertConfig.associationName.trim() || 'ASSOCIAÇÃO / MISSÃO DA IASD (PADRÃO)'}
                        </p>
                        <div className="inline-block px-4 py-1 rounded-full bg-amber-100 border border-amber-400 text-red-800 text-[11px] sm:text-xs font-black uppercase tracking-wider">
                          {customCertConfig.clubName.trim() ||
                            (isAvtArea
                              ? 'CLUBE DE AVENTUREIROS (NOME DO CLUBE)'
                              : 'CLUBE DE DESBRAVADORES (NOME DO CLUBE)')}
                        </div>
                        <h5 className="text-sm sm:text-lg font-black text-slate-900 uppercase tracking-tight pt-1 font-serif">
                          {customCertConfig.certificateTitle || 'CERTIFICADO OFICIAL DE INVESTIDURA'}
                        </h5>
                        <p className="text-[10px] sm:text-xs italic text-slate-600 font-serif">
                          Certificamos para os devidos fins de registro e mérito que
                        </p>
                        <div className="max-w-md mx-auto border-b border-slate-400 pb-0.5 text-xs sm:text-sm font-black text-red-800 uppercase">
                          {customCertConfig.recipientName.trim() || '____________________________________________________'}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-slate-600">
                          cumpriu todos os requisitos oficiais exigidos pelo Ministério de{' '}
                          {isAvtArea ? 'Aventureiros' : 'Desbravadores'} da DSA para:
                        </p>
                        <p className="text-xs sm:text-sm font-black text-blue-950 uppercase tracking-wide">
                          {customCertConfig.achievementName || 'CLASSE / ESPECIALIDADE OFICIAL DSA'}
                        </p>
                        <div className="grid grid-cols-3 gap-2 pt-4 max-w-lg mx-auto text-[8px] sm:text-[9px] text-slate-600 font-bold">
                          <div className="border-t border-slate-400 pt-1 truncate">
                            {customCertConfig.directorName.trim() || 'Diretor(a) do Clube'}
                          </div>
                          <div className="border-t border-slate-400 pt-1 truncate">
                            {customCertConfig.regionalName.trim() || 'Regional / Coordenador(a)'}
                          </div>
                          <div className="border-t border-slate-400 pt-1 truncate">
                            {customCertConfig.pastorName.trim() || 'Pastor / Departamental'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FORMULÁRIO DE PERSONALIZAÇÃO DO CERTIFICADO NA HORA DE BAIXAR */}
                    {isCertCustomizerOpen && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                              Nome do Clube (Personalizar) *
                            </label>
                            <input
                              type="text"
                              value={customCertConfig.clubName}
                              onChange={(e) =>
                                setCustomCertConfig((prev) => ({ ...prev, clubName: e.target.value }))
                              }
                              placeholder={
                                isAvtArea
                                  ? 'Ex: Clube de Aventureiros Pequenos Brilhantes'
                                  : 'Ex: Clube de Desbravadores Estrela de Davi'
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                              Associação / Missão (Campo) *
                            </label>
                            <input
                              type="text"
                              value={customCertConfig.associationName}
                              onChange={(e) =>
                                setCustomCertConfig((prev) => ({ ...prev, associationName: e.target.value }))
                              }
                              placeholder="Ex: Associação Paulistana — AP / UCB"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                              Classe / Especialidade / Mérito
                            </label>
                            <input
                              type="text"
                              value={customCertConfig.achievementName}
                              onChange={(e) =>
                                setCustomCertConfig((prev) => ({ ...prev, achievementName: e.target.value }))
                              }
                              placeholder={
                                isAvtArea
                                  ? 'Ex: Classe de Abelhinhas Laboriosas / Especialidade'
                                  : 'Ex: Classe de Amigo / Especialidade'
                              }
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                              Nome do Investido (Opcional)
                            </label>
                            <input
                              type="text"
                              value={customCertConfig.recipientName}
                              onChange={(e) =>
                                setCustomCertConfig((prev) => ({ ...prev, recipientName: e.target.value }))
                              }
                              placeholder="Deixe vazio p/ preencher à mão"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                              Cidade e Data (Opcional)
                            </label>
                            <input
                              type="text"
                              value={customCertConfig.locationAndDate}
                              onChange={(e) =>
                                setCustomCertConfig((prev) => ({ ...prev, locationAndDate: e.target.value }))
                              }
                              placeholder="Ex: São Paulo, 04 de Outubro de 2026"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
                              Nome do Diretor(a) do Clube (Opcional)
                            </label>
                            <input
                              type="text"
                              value={customCertConfig.directorName}
                              onChange={(e) =>
                                setCustomCertConfig((prev) => ({ ...prev, directorName: e.target.value }))
                              }
                              placeholder="Ex: Diretor(a) do Clube"
                              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <button
                            type="button"
                            disabled={isDownloadingCustomCert}
                            onClick={async () => {
                              setIsDownloadingCustomCert(true);
                              try {
                                await downloadCustomizedCertificatePdf({
                                  ...customCertConfig,
                                  ministry: activeMinistry
                                });
                              } finally {
                                setIsDownloadingCustomCert(false);
                              }
                            }}
                            className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Download size={15} />
                            <span>
                              {isDownloadingCustomCert
                                ? 'Gerando Certificado...'
                                : 'Baixar Certificado Personalizado (PDF A4)'}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={isDownloadingCustomCert}
                            onClick={async () => {
                              setIsDownloadingCustomCert(true);
                              try {
                                await downloadCustomizedCertificatePng({
                                  ...customCertConfig,
                                  ministry: activeMinistry
                                });
                              } finally {
                                setIsDownloadingCustomCert(false);
                              }
                            }}
                            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Download size={15} />
                            <span>Baixar em PNG (Alta Resolução)</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================================
                    SEÇÃO ESPECIAL DE MATERIAIS GRÁFICOS: EMBLEMAS NO FORMATO CORELDRAW (IASD)
                   ========================================================================= */}
                {cat.id === 'graficos' && (
                  <div className="bg-white dark:bg-slate-800 rounded-[20px] p-4 sm:p-5 border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[9px] font-black uppercase tracking-widest">
                          Vetores em Curvas • CorelDRAW (.CDR / .SVG / .EPS) • Portal IASD
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight mt-1">
                          Emblemas Oficiais de {isAvtArea ? 'Aventureiros (A1 a A5)' : 'Desbravadores (D1 a D5)'} em Formato CorelDRAW
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                          Baixe o pacote oficial aberto (.CDR / .EPS / .AI) do Portal Adventistas.org ou baixe cada emblema individualmente pronto para abrir no CorelDRAW.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {isAvtArea ? (
                          <a
                            href="https://downloads.adventistas.org/pt/aventureiros/logomarcas/logos-aberto-aventureiros/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Download size={13} />
                            <span>Pacote .CDR Aventureiros (IASD)</span>
                          </a>
                        ) : (
                          <a
                            href="https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Download size={13} />
                            <span>Pacote .CDR Desbravadores (IASD)</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {filteredCorelEmblems.length === 0 ? (
                        <div className="col-span-full bg-slate-50 dark:bg-slate-900 rounded-[18px] p-4 flex items-center space-x-3 border border-slate-100 dark:border-slate-700">
                          <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-400">
                            <Calendar size={20} />
                          </div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-tight">
                            Nenhum emblema encontrado para este filtro
                          </span>
                        </div>
                      ) : (
                        filteredCorelEmblems.map((emb) => (
                          <div
                            key={emb.id}
                            className="rounded-2xl p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shrink-0">
                                <img
                                  src={emb.imageUrl}
                                  alt={emb.title}
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      emb.ministry === 'DBV'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                    }`}
                                  >
                                    {emb.ministry} • {emb.code}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[8px] font-black uppercase">
                                    CorelDRAW
                                  </span>
                                </div>
                                <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate mt-0.5">
                                  {emb.title}
                                </p>
                                <p className="text-[9.5px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                  {emb.dimensions}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {emb.directCdrUrl && (
                                <a
                                  href={emb.directCdrUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors"
                                  title="Baixar Arquivo Nativo .CDR CorelDRAW"
                                >
                                  <Download size={12} />
                                  <span>.CDR</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => downloadEmblemForCorelDraw(emb)}
                                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                title="Baixar Vetor em Curvas para abrir no CorelDRAW"
                              >
                                <Download size={12} />
                                <span>Baixar Corel</span>
                              </button>
                              <a
                                href={emb.corelPortalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors"
                                title="Abrir Pacote Oficial .CDR no Portal Adventistas.org (IASD)"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {cat.id !== 'graficos' && (catItems.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-[18px] p-4 flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-400">
                        <Calendar size={20} />
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-tight">
                        Nenhum documento encontrado para este filtro
                      </span>
                    </div>
                  </div>
                ) : (
                  catItems.map((form) => {
                    const ministryLabel = isAvtArea
                      ? 'Oficial DSA • Aventureiros'
                      : 'Oficial DSA • Desbravadores';
                    const ministryBadgeColor = isAvtArea
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                    const displayTitle = (form.titulo || '').replace(
                      /Desbravadores e Aventureiros/gi,
                      isAvtArea ? 'Clube de Aventureiros' : 'Clube de Desbravadores'
                    );
                    const isExternalPortalOrCdr =
                      form.link.includes('downloads.adventistas.org') ||
                      form.link.includes('.cdr') ||
                      form.link.endsWith('.svg');

                    return (
                      <div
                        key={form.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (!form.link) return;
                          if (isExternalPortalOrCdr) {
                            window.open(form.link, '_blank', 'noopener,noreferrer');
                          } else {
                            setPdfTitle(displayTitle);
                            setSelectedPdfUrl(formatDriveUrl(form.link));
                            setSelectedPdfThumbnail(null);
                            setPdfReturnSubView('FORMULARIOS');
                            setActiveSubView('PDF_VIEWER');
                          }
                        }}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && form.link) {
                            e.preventDefault();
                            if (isExternalPortalOrCdr) {
                              window.open(form.link, '_blank', 'noopener,noreferrer');
                            } else {
                              setPdfTitle(displayTitle);
                              setSelectedPdfUrl(formatDriveUrl(form.link));
                              setSelectedPdfThumbnail(null);
                              setPdfReturnSubView('FORMULARIOS');
                              setActiveSubView('PDF_VIEWER');
                            }
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-800 rounded-[18px] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 active:scale-[0.99] transition-all group cursor-pointer"
                      >
                        <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="text-left min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${ministryBadgeColor}`}>
                                {ministryLabel}
                              </span>
                            </div>
                            <span className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-tight block leading-snug">
                              {displayTitle}
                            </span>
                            {form.descricao && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-snug">
                                {form.descricao}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {cat.id === 'certificados' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomCertConfig((prev) => ({
                                  ...prev,
                                  ministry: activeMinistry,
                                  certificateTitle: displayTitle.replace(/\s*\(DSA\)\s*/gi, '').toUpperCase(),
                                  achievementName: displayTitle
                                    .replace(/Certificado (Oficial|Individual)\s*[—-]?\s*/i, '')
                                    .replace(/\s*\(DSA\)\s*/gi, '')
                                }));
                                setIsCertCustomizerOpen(true);
                                const el = document.getElementById('cert-customizer-anchor');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                              title="Personalizar este Certificado com Nome do Clube e Associação para Baixar"
                            >
                              <Edit2 size={12} />
                              <span className="hidden sm:inline">Personalizar</span>
                            </button>
                          )}
                          <a
                            href={form.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-red-500 hover:text-white transition-colors"
                            title="Baixar / Abrir Arquivo Oficial"
                          >
                            <Download size={16} />
                          </a>
                          <div
                            className="w-9 h-9 bg-red-50 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors"
                            title="Visualizar Padrão"
                          >
                            <BookOpen size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          );
        })}

        {isUserAdmin && (
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center space-x-2">
              <Settings size={16} className="text-red-500" />
              <span>Painel Admin: Formulários</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
              Gerencie ou adicione novos formulários oficiais para todos os usuários.
            </p>

            <button
              onClick={() => setActiveSubView('FORM_ADMIN')}
              className="w-full py-3 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Gerenciar Formulários</span>
            </button>
          </div>
        )}

        {/* Rodapé de Créditos e Fontes Oficiais dos Formulários e Materiais */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200/60 dark:border-red-800/50 flex items-center justify-center text-red-500 shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block">
                Créditos e Fontes Oficiais dos Documentos
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {isAvtArea ? (
                  <>
                    Todos os cadernos de atividades das classes (Abelhinhas Laboriosas a Mãos Ajudadoras), fichas médicas infantis, termos de autorização, certificados de investidura e manuais de identidade visual disponibilizados nesta seção são documentos oficiais do <strong>Ministério de Aventureiros da Divisão Sul-Americana da IASD (DSA — adventistas.org/pt/aventureiros)</strong>, <strong>Sistema de Gerenciamento de Clubes (SGC / ACMS)</strong>, <strong>Acervo Oficial Arquivos Adventistas (arquivosadventistas.org)</strong>, <strong>Ministério de Aventureiros ASES</strong> e <strong>MDA Wiki (mda.wiki.br)</strong>.
                  </>
                ) : (
                  <>
                    Todos os cadernos de atividades das classes (Amigo a Guia), fichas médicas, termos de autorização, certificados de investidura e manuais de identidade visual disponibilizados nesta seção são documentos oficiais do <strong>Ministério de Desbravadores da Divisão Sul-Americana da IASD (DSA — adventistas.org/pt/desbravadores)</strong>, <strong>Sistema de Gerenciamento de Clubes (SGC / ACMS)</strong>, <strong>Acervo Oficial Arquivos Adventistas (arquivosadventistas.org)</strong> e <strong>MDA Wiki (mda.wiki.br)</strong>.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [desbravaPlusTab, setDesbravaPlusTab] = useState<'MATERIAIS' | 'CHECKLIST_N1' | 'CHECKLIST_N2'>('MATERIAIS');
  const [desbravaPlusCategoryFilter, setDesbravaPlusCategoryFilter] = useState<string>('TODOS');
  const [desbravaPlusCheckedIds, setDesbravaPlusCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dbv_tudo_desbrava_plus_checklist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleDesbravaPlusCheckItem = (id: string) => {
    setDesbravaPlusCheckedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('dbv_tudo_desbrava_plus_checklist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const renderDesbravaPlus = () => {
    // Mescla materiais oficiais do Programa Desbrava+ (DSA) com os itens cadastrados no Supabase
    const supabaseNames = new Set(desbravaPlusItems.map((i) => (i.Nome || '').toLowerCase().trim()));
    const mergedMaterials = [
      ...DESBRAVA_MAIS_OFFICIAL_MATERIALS.filter((m) => !supabaseNames.has(m.Nome.toLowerCase().trim())),
      ...desbravaPlusItems.map((item) => ({
        ...item,
        categoriaBadge: (item as any).categoriaBadge || 'Acervo Extra',
        publicoAlvo: (item as any).publicoAlvo || 'Clube de Desbravadores',
        destaqueCor: (item as any).destaqueCor || 'from-fuchsia-600 to-purple-700'
      }))
    ];

    const availableBadges = ['TODOS', ...Array.from(new Set(mergedMaterials.map((m) => m.categoriaBadge)))];
    const filteredMaterials =
      desbravaPlusCategoryFilter === 'TODOS'
        ? mergedMaterials
        : mergedMaterials.filter((m) => m.categoriaBadge === desbravaPlusCategoryFilter);

    const n1Items = DESBRAVA_MAIS_CHECKLIST.filter((c) => c.nivel === 'NIVEL_1');
    const n2Items = DESBRAVA_MAIS_CHECKLIST.filter((c) => c.nivel === 'NIVEL_2');
    const n1Done = n1Items.filter((c) => desbravaPlusCheckedIds.includes(c.id)).length;
    const n2Done = n2Items.filter((c) => desbravaPlusCheckedIds.includes(c.id)).length;

    return (
      <div className="animate-slide-in space-y-5 pt-2 pb-28">
        {/* Banner Oficial do Programa Desbrava+ (DSA) */}
        <div className="bg-gradient-to-br from-[#831843] via-[#a21caf] to-[#6b21a8] rounded-[28px] p-5 sm:p-6 text-white shadow-lg border border-white/15 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none">
            <Sparkles size={130} />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-black uppercase tracking-widest border border-white/25">
                Divisão Sul-Americana • 16 e 17 Anos
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-black uppercase tracking-wider">
                Nível 1: {n1Done}/{n1Items.length} • Nível 2: {n2Done}/{n2Items.length}
              </span>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
                Programa Desbrava+ & Liderança Aplicada
              </h3>
              <p className="text-xs sm:text-sm text-white/85 font-medium mt-1 leading-relaxed">
                Guia oficial da DSA para retenção e capacitação prática de adolescentes de <strong>16 e 17 anos</strong> (Trilha do Saber, Capacitação Aplicada em Unidades e Comissão Especial) rumo à Classe de Líder aos 18 anos.
              </p>
            </div>

            {/* Abas Internas: Materiais & Guias | Checklist Ano 1 (16 anos) | Checklist Ano 2 (17 anos) */}
            <div className="grid grid-cols-3 gap-1.5 bg-black/25 p-1.5 rounded-2xl border border-white/10 pt-1.5">
              {[
                { id: 'MATERIAIS', label: 'Guias & Materiais' },
                { id: 'CHECKLIST_N1', label: `Nível 1 • 16 Anos (${n1Done}/${n1Items.length})` },
                { id: 'CHECKLIST_N2', label: `Nível 2 • 17 Anos (${n2Done}/${n2Items.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDesbravaPlusTab(tab.id as any)}
                  className={`py-2 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    desbravaPlusTab === tab.id
                      ? 'bg-white text-fuchsia-900 shadow-sm'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {desbravaPlusTab === 'MATERIAIS' ? (
          <>
            {/* Filtro por Categoria */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 cursor-grab active:cursor-grabbing select-none">
              {availableBadges.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setDesbravaPlusCategoryFilter(badge)}
                  className={`px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
                    desbravaPlusCategoryFilter === badge
                      ? 'bg-fuchsia-700 text-white border-fuchsia-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-fuchsia-400'
                  }`}
                >
                  {badge === 'TODOS' ? `Todos (${mergedMaterials.length})` : badge}
                </button>
              ))}
            </div>

            {isLoading && desbravaPlusItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="w-7 h-7 border-3 border-slate-200 dark:border-slate-700 border-t-fuchsia-600 rounded-full animate-spin" />
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedDesbravaPlusItem(item);
                    const thumb = item.Capa || (item as any).Imagem || (item as any).capa || '';
                    setSelectedPdfThumbnail(thumb ? getImageUrl(thumb) : null);
                    const hasPdfLink = item.PDF && (item.PDF.startsWith('http') || item.PDF.includes('.pdf'));
                    const hasConteudoLink = item.Conteudo && (item.Conteudo.startsWith('http') || item.Conteudo.includes('.pdf'));

                    if (hasPdfLink || hasConteudoLink) {
                      setActiveSubView('DESBRAVA_PLUS_PDF');
                    } else {
                      setActiveSubView('DESBRAVA_PLUS_DETAILS');
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[28px] flex flex-col justify-between p-5 relative shadow-xs hover:shadow-md active:scale-[0.99] transition-all overflow-hidden group text-left cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${
                        (item as any).destaqueCor || 'from-fuchsia-600 to-purple-700'
                      } rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm text-white group-hover:scale-105 transition-transform duration-300`}
                    >
                      {item.Capa ? (
                        <img src={item.Capa} className="w-full h-full object-cover" alt={item.Nome} referrerPolicy="no-referrer" />
                      ) : (
                        <Sparkles size={26} />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200/60 dark:border-fuchsia-800/60 text-[9px] font-black uppercase tracking-wider">
                          {(item as any).categoriaBadge || 'Desbrava+'}
                        </span>
                        {(item as any).publicoAlvo && (
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate">
                            • {(item as any).publicoAlvo}
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base leading-snug tracking-tight uppercase">
                        {item.Nome}
                      </h4>
                      {item.descricao && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                          {item.descricao}
                        </p>
                      )}
                    </div>

                    <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ABA DE CHECKLIST DO GUIA DO PROGRAMA DESBRAVA+ (NÍVEL 1 OU NÍVEL 2) */
          <div className="space-y-3.5">
            {(() => {
              const activeLevel = desbravaPlusTab === 'CHECKLIST_N1' ? 'NIVEL_1' : 'NIVEL_2';
              const items = DESBRAVA_MAIS_CHECKLIST.filter((c) => c.nivel === activeLevel);
              const doneCount = items.filter((c) => desbravaPlusCheckedIds.includes(c.id)).length;
              const pct = Math.round((doneCount / Math.max(1, items.length)) * 100);

              return (
                <>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400 block">
                          {activeLevel === 'NIVEL_1'
                            ? 'Guia Desbrava+ • Ano 1 (16 Anos)'
                            : 'Guia Desbrava+ • Ano 2 (17 Anos)'}
                        </span>
                        <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase">
                          {activeLevel === 'NIVEL_1'
                            ? 'Capacitação Aplicada em Unidade & Instrução'
                            : 'Gestão do Clube, Eventos & Preparação para Líder'}
                        </h4>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/70 text-fuchsia-800 dark:text-fuchsia-300 font-black text-xs">
                        {pct}% ({doneCount}/{items.length})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-fuchsia-600 to-purple-600 transition-all duration-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {items.map((req) => {
                      const isDone = desbravaPlusCheckedIds.includes(req.id);
                      return (
                        <button
                          key={req.id}
                          type="button"
                          onClick={() => toggleDesbravaPlusCheckItem(req.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/70'
                              : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-fuchsia-300'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-transparent'
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-wider">
                                Req. {req.codigo} • {req.secao}
                              </span>
                            </div>
                            <p
                              className={`text-xs sm:text-sm font-black leading-snug ${
                                isDone
                                  ? 'line-through text-emerald-900 dark:text-emerald-200'
                                  : 'text-slate-800 dark:text-white'
                              }`}
                            >
                              {req.titulo}
                            </p>
                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                              {req.detalhe}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Rodapé de Créditos e Fontes Oficiais do Programa Desbrava+ */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200/60 dark:border-fuchsia-800/50 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400 block">
                Créditos e Fontes Oficiais — Programa Desbrava+
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Diretrizes, requisitos de Nível 1 (16 anos) e Nível 2 (17 anos), Curso de Treinamento de Diretoria (10 horas) e orientações técnicas extraídos oficialmente do <strong>Programa Desbrava+ da Divisão Sul-Americana da IASD (DSA — Ministério de Desbravadores • adventistas.org/pt/desbravadores)</strong>, <strong>Manual Administrativo do Clube de Desbravadores (DSA)</strong>, <strong>Guia do Aspirante a Líder (DSA)</strong> e <strong>MDA Wiki (mda.wiki.br)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDesbravaPlusDetails = () => {
    if (!selectedDesbravaPlusItem) return null;

    return (
      <div className="animate-slide-in space-y-4 pt-1 pb-28">
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
                onClick={() => {
                  const thumb = selectedDesbravaPlusItem.Capa || (selectedDesbravaPlusItem as any).Imagem || '';
                  setSelectedPdfThumbnail(thumb ? getImageUrl(thumb) : null);
                  setActiveSubView('DESBRAVA_PLUS_PDF');
                }}
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

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                <strong>Fonte Oficial:</strong> Divisão Sul-Americana da Igreja Adventista do Sétimo Dia (DSA) — Ministério de Desbravadores e Aventureiros (adventistas.org/pt/desbravadores • Manual Administrativo DBV & MDA Wiki).
              </p>
            </div>
          </div>
        </div>
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
      <div className="animate-slide-in h-full flex flex-col flex-grow w-full bg-slate-100 dark:bg-slate-950 md:rounded-3xl overflow-hidden md:border md:border-slate-200/80 md:dark:border-slate-800 md:shadow-md">
        <div className="flex-grow flex flex-col relative h-full min-h-[500px]">
          {/* Bloqueia e oculta o botão flutuante de abrir em outra janela do Google Drive no canto superior direito */}
          <div 
            className="absolute top-2 right-2 w-12 h-12 z-20 bg-slate-900/95 dark:bg-slate-900 rounded-xl flex items-center justify-center text-white/80 shadow-md select-none pointer-events-auto"
            title={selectedDesbravaPlusItem.Nome || 'Leitura no App'}
          >
            <BookOpen size={18} />
          </div>
          <iframe 
            src={formattedUrl} 
            className="w-full h-full border-none flex-grow bg-slate-50 dark:bg-slate-900"
            title={selectedDesbravaPlusItem.Nome}
            allow="autoplay"
            sandbox="allow-scripts allow-same-origin"
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

  // Suporte global a rolagem horizontal pelo mouse (roda do mouse + clique e arraste) em todos os menus horizontais no PC
  useEffect(() => {
    const findHorizontalScrollable = (target: EventTarget | null): HTMLElement | null => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.classList && el.classList.contains('overflow-x-auto') && el.scrollWidth > el.clientWidth + 2) {
          return el;
        }
        el = el.parentElement;
      }
      return null;
    };

    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.defaultPrevented) return;
      const el = findHorizontalScrollable(e.target);
      if (!el) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    let activeEl: HTMLElement | null = null;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragged = false;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const el = findHorizontalScrollable(e.target);
      if (!el) return;
      activeEl = el;
      isDown = true;
      dragged = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown || !activeEl) return;
      const x = e.pageX - activeEl.offsetLeft;
      const walk = (x - startX) * 1.4;
      if (Math.abs(walk) > 6) {
        dragged = true;
        activeEl.scrollLeft = scrollLeft - walk;
      }
    };

    const handleMouseUp = () => {
      isDown = false;
      activeEl = null;
    };

    const handleClickCapture = (e: MouseEvent) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClickCapture, true);

    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClickCapture, true);
    };
  }, []);

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
        {/* Header Bíblia Sagrada */}
        <div className="bg-[#0f172a] rounded-[28px] sm:rounded-[36px] p-5 sm:p-6 shadow-xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-0.5">Bíblia Sagrada</h3>
            <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Versão Almeida Revista e Corrigida</p>
            <button
              onClick={() => setActiveSubView('BIBLE_BOOKS')}
              className="mb-4 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-95 transition-all inline-flex items-center gap-2 border border-white/20"
            >
              <BookOpen size={16} />
              <span>Ler a Bíblia Completa (66 Livros)</span>
            </button>
          </div>
          
          {/* Versículo do Dia */}
          <div 
            onClick={() => {
              const jeremias = bibleBooks.find(b => b.book_name.toLowerCase().includes('jeremias')) || CANONICAL_BIBLE_BOOKS.find(b => b.book_name === 'Jeremias');
              if (jeremias) {
                setSelectedBibleBook(jeremias);
                setSelectedBibleChapter(22);
                setActiveSubView('BIBLE_VERSES');
              }
            }}
            className="bg-white dark:bg-slate-800 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 text-left shadow-inner relative z-10 border border-white/10 dark:border-slate-700 cursor-pointer hover:border-amber-400/50 transition-all group"
            title="Clique para ler este capítulo na Bíblia"
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span>Versículo do Dia</span>
                <span className="text-[9px] lowercase font-medium text-slate-400 group-hover:text-amber-500 transition-colors">(toque para ler)</span>
              </h4>
              <button 
                onClick={(e) => { e.stopPropagation(); handleShareVerse(); }}
                className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 active:scale-90 transition-all"
              >
                <Share2 size={14} />
              </button>
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-sm leading-relaxed mb-3 italic">
              "Ó terra, terra, terra! Ouve a palavra do SENHOR!"
            </p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-tight flex items-center justify-between">
              <span>Jeremias 22:29</span>
              <span className="text-blue-500 dark:text-blue-400 font-bold text-[9px] uppercase tracking-wider group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                Ler Capítulo <ChevronRight size={12} />
              </span>
            </p>
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
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
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
              {selectedTestament === 'ANTIGO' 
                ? 'Antigo Testamento (39 livros)' 
                : selectedTestament === 'NOVO' 
                ? 'Novo Testamento (27 livros)' 
                : `Todos os Livros (${filteredBooks.length} de 66)`}
            </h4>
            {selectedTestament !== 'TODOS' && (
              <button 
                onClick={() => setSelectedTestament('TODOS')}
                className="text-[10px] font-bold text-blue-500 hover:underline"
              >
                Mostrar todos (AT + NT)
              </button>
            )}
          </div>

          {isLoading && bibleBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400">Carregando livros da Bíblia...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[28px] p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
              <BookOpen size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhum livro encontrado{bibleSearch ? ` para "${bibleSearch}"` : ''} no filtro atual.
              </p>
              <button
                type="button"
                onClick={() => {
                  setBibleSearch('');
                  setSelectedTestament('TODOS');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm"
              >
                Limpar Busca e Mostrar Todos os 66 Livros
              </button>
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{book.total_chapters} capítulos • {book.testament}</p>
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
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">{selectedBibleBook.book_name}</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">CAPÍTULO</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Capítulos Compacto */}
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 sm:gap-3">
          {chapters.map((chapter) => (
            <button 
              key={chapter}
              onClick={() => {
                setSelectedBibleChapter(chapter);
                setActiveSubView('BIBLE_VERSES');
              }}
              className="h-12 sm:h-13 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-blue-50/40 dark:hover:bg-slate-700/60 rounded-2xl flex items-center justify-center shadow-xs active:scale-90 transition-all group"
            >
              <span className="font-black text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-sm sm:text-base">{chapter}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderBibleVerses = () => {
    if (!selectedBibleBook || selectedBibleChapter === null) return null;

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-32">
        {/* Header Bíblia Sagrada Compacto Fixo no Topo com Controle de Fonte */}
        <div className="sticky top-0 z-30 bg-[#1e40af] rounded-[32px] p-4 sm:p-5 shadow-lg text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10 gap-2">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <button 
                onClick={() => setActiveSubView('BIBLE_CHAPTERS')}
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15 shrink-0"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-xl font-black uppercase tracking-tight truncate">
                  {bibleSettings.chapterStyle === 'Capítulo N' ? 'Capítulo ' : ''}{selectedBibleChapter} - {selectedBibleBook.book_name}
                </h3>
              </div>
            </div>

            {/* Controles de Aumentar / Diminuir Letra */}
            <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-2xl border border-white/15 shrink-0">
              <button
                type="button"
                onClick={() => setBibleSettings(prev => ({ ...prev, fontSize: Math.max(12, prev.fontSize - 2) }))}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs hover:bg-white/20 active:scale-90 transition-all text-white"
                title="Diminuir tamanho da letra (A-)"
                aria-label="Diminuir tamanho da letra"
              >
                A-
              </button>
              <span className="text-[10px] font-black text-blue-100 px-1 select-none min-w-[28px] text-center">
                {bibleSettings.fontSize}
              </span>
              <button
                type="button"
                onClick={() => setBibleSettings(prev => ({ ...prev, fontSize: Math.min(32, prev.fontSize + 2) }))}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm hover:bg-white/20 active:scale-90 transition-all text-white"
                title="Aumentar tamanho da letra (A+)"
                aria-label="Aumentar tamanho da letra"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Versículos */}
        <div className={`space-y-4 p-4 rounded-[32px] transition-all ${bibleSettings.darkMode ? 'bg-slate-900 text-white' : ''}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-9 h-9 border-3 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Carregando versículos de {selectedBibleBook.book_name} {selectedBibleChapter}...
              </p>
            </div>
          ) : bibleVerses.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[28px] p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <BookOpen size={28} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white text-base">
                  Nenhum versículo exibido
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Não foi possível obter os versículos de <strong>{selectedBibleBook.book_name} {selectedBibleChapter}</strong> no momento.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBibleVersesRetryTrigger(prev => prev + 1)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  <span>Recarregar Versículos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubView('BIBLE_CHAPTERS')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all"
                >
                  Voltar aos Capítulos
                </button>
              </div>
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
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
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
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
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
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
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
        {/* Banner de atalho para configuração dos Globos da Faixa */}
        <div className="bg-[#0c3c31] text-white p-5 rounded-[28px] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#092d25] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
              <Shield size={24} className="text-emerald-300" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">Globos da Ponta da Faixa</h4>
              <p className="text-emerald-200/80 text-[11px] font-medium">Configure as imagens oficiais dos globos da faixa (Desbravador, Liderança e Líder).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveSubView('FAIXA_ADMIN')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap relative z-10"
          >
            Configurar Globos
          </button>
        </div>

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

          <button 
            onClick={() => setActiveSubView('FAIXA_ADMIN')}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-[#0c3c31] rounded-2xl flex items-center justify-center text-white group-hover:opacity-90 transition-opacity shadow-lg shadow-emerald-950/20">
              <Shield size={28} className="text-emerald-300" />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão da Faixa</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Globos e Imagens da Ponta da Faixa</p>
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
          className="w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-200 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"
          title="Voltar"
          aria-label="Voltar"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
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
              <div
                key={item.id}
                onClick={() => {
                  setSelectedTrunfoModal(item);
                  setIsTrunfoImageZoomed(false);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTrunfoModal(item);
                    setIsTrunfoImageZoomed(false);
                  }
                }}
                className="relative bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-3.5 flex flex-col items-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all group cursor-pointer"
              >
                {/* Miniatura com botão de ampliar imagem */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden p-2 mb-3 border border-slate-100 dark:border-slate-800/60 group-hover:scale-105 transition-transform">
                  {item.imagem ? (
                    <>
                      <img 
                        src={getImageUrl(item.imagem)} 
                        alt={item.titulo}
                        className="w-full h-full object-contain drop-shadow-sm"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrunfoModal(item);
                          setIsTrunfoImageZoomed(true);
                        }}
                        title="Ampliar imagem do trunfo"
                        aria-label="Ampliar imagem do trunfo"
                        className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-xl bg-slate-900/75 hover:bg-teal-600 text-white flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer z-10"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </>
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
              </div>
            ))}
          </div>
        )}

        {/* Rodapé de Créditos e Fontes Oficiais dos Trunfos */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 block">
                Créditos e Fontes Históricas do Acervo de Trunfos
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Imagens de trunfos bordados e registros históricos catalogados a partir do <strong>Acervo Oficial de Camporis e Eventos da Divisão Sul-Americana (DSA — adventistas.org)</strong>, <strong>MDA Wiki (mda.wiki.br)</strong>, <strong>Uniões e Associações da IASD (UCB, UNeB, UNB, USB, UCOB, ULB, USEB, UNOB)</strong> e coleções históricas oficiais do Ministério de Desbravadores e Aventureiros.
              </p>
            </div>
          </div>
        </div>
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

  const renderFaixaAdmin = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28 px-4 max-w-3xl mx-auto">
        {/* Cabeçalho da Seção */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-[#0c3c31] rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Shield size={28} className="text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Gestão dos Globos da Faixa
              </h3>
              <p className="text-slate-400 text-xs font-medium">
                Configure as imagens dos emblemas que aparecem na extremidade inferior da faixa
              </p>
            </div>
          </div>

          {/* Regras Oficiais do Manual da DSA */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Regras do Manual de Uniformes da DSA
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-amber-800 dark:text-amber-300 block">🏕️ Até 15 anos</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Fundo cáqui ("Globo Desbravador")</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">👔 16 anos acima</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Fundo branco ("Globo Liderança")</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60">
                <span className="font-bold text-amber-900 dark:text-amber-200 block">🌟 Pins de Líder</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Globo de Líder (L1 com estrela dourada)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulador em Tempo Real da Ponta da Faixa */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">
                Pré-visualização da Ponta da Faixa
              </h4>
              <p className="text-slate-400 text-xs">
                Veja em tempo real como o emblema aparece no corte diagonal oficial da faixa
              </p>
            </div>

            {/* Alternador de Simulação */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setFaixaSimulationMode('DESBRAVADOR')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${faixaSimulationMode === 'DESBRAVADOR' ? 'bg-[#bba882] text-white shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                Até 15 anos
              </button>
              <button
                type="button"
                onClick={() => setFaixaSimulationMode('LIDERANCA')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${faixaSimulationMode === 'LIDERANCA' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                16+ anos
              </button>
              <button
                type="button"
                onClick={() => setFaixaSimulationMode('LIDER')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${faixaSimulationMode === 'LIDER' ? 'bg-amber-400 text-slate-900 shadow' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
              >
                Líder Ativo
              </button>
            </div>
          </div>

          {/* Maquete da Ponta da Faixa Verde Fiel à Faixa Real */}
          <div className="w-full flex justify-center py-4">
            <div className="w-64 filter drop-shadow-[0_16px_20px_rgba(0,0,0,0.4)]">
              <div 
                className="w-full bg-[#0c3c31] border-2 border-[#092d25] pt-6 pb-4 px-4 flex flex-col items-center relative overflow-hidden text-white"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 256px), 0 100%)'
                }}
              >
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
                <div className="absolute top-2 bottom-2 left-2 w-px border-l border-dashed border-emerald-300/25 pointer-events-none" />
                <div 
                  className="absolute top-2 right-2 w-px border-r border-dashed border-emerald-300/25 pointer-events-none"
                  style={{ bottom: '260px' }}
                />
                {/* Costura pespontada acompanhando o corte diagonal a 45° estritamente na ponta inferior da maquete */}
                <div className="absolute bottom-0 left-0 right-0 h-[256px] pointer-events-none z-10 overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line 
                      x1="3" 
                      y1="97" 
                      x2="97" 
                      y2="3" 
                      stroke="rgba(110, 231, 183, 0.28)" 
                      strokeWidth="1.5" 
                      strokeDasharray="4,4" 
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                {/* Imagem do Globo Simulado cortado na ponta a 45° com linha reta alinhada ao corte */}
                <div className="w-48 h-48 relative flex items-center justify-center mt-2 mb-2 translate-x-1 -translate-y-2 rotate-[45deg]">
                  <img 
                    src={
                      faixaSimulationMode === 'LIDER' ? (faixaAdminConfig.globo_lider || DEFAULT_FAIXA_CONFIG.globo_lider) :
                      faixaSimulationMode === 'LIDERANCA' ? (faixaAdminConfig.globo_lideranca || DEFAULT_FAIXA_CONFIG.globo_lideranca) :
                      (faixaAdminConfig.globo_desbravador || DEFAULT_FAIXA_CONFIG.globo_desbravador)
                    } 
                    alt="Globo Simulado"
                    className="w-full h-full object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.65)]" 
                  />
                </div>

                <div className="mt-1 px-2.5 py-0.5 bg-black/60 rounded-full border border-emerald-400/30 text-[9px] font-black uppercase tracking-wider text-emerald-100 z-20">
                  {
                    faixaSimulationMode === 'LIDER' ? 'Globo de Líder (L1)' :
                    faixaSimulationMode === 'LIDERANCA' ? 'Globo Liderança (16+)' :
                    'Globo Desbravador (Até 15)'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulários de Configuração dos 3 Globos */}
        <div className="space-y-4">
          {/* Inputs ocultos de upload */}
          <input 
            type="file" 
            ref={fileInputDesbravadorRef} 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFaixaFile('globo_desbravador', file);
            }} 
          />
          <input 
            type="file" 
            ref={fileInputLiderancaRef} 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFaixaFile('globo_lideranca', file);
            }} 
          />
          <input 
            type="file" 
            ref={fileInputLiderRef} 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFaixaFile('globo_lider', file);
            }} 
          />

          {[
            {
              key: 'globo_desbravador' as const,
              title: '1. Globo Desbravador',
              badge: 'Até 15 anos • Fundo Cáqui',
              badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
              desc: 'Emblema D4 bordado em tecido cáqui. Exibido na ponta da faixa para desbravadores de 10 a 15 anos.',
              fileRef: fileInputDesbravadorRef
            },
            {
              key: 'globo_lideranca' as const,
              title: '2. Globo Liderança',
              badge: '16 anos acima • Fundo Branco',
              badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
              desc: 'Emblema D4 bordado em tecido branco da liderança. Exibido na ponta da faixa para membros com 16 anos ou mais.',
              fileRef: fileInputLiderancaRef
            },
            {
              key: 'globo_lider' as const,
              title: '3. Globo de Líder',
              badge: 'Pins Líder / Master / Avançado',
              badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-300 dark:border-amber-700',
              desc: 'Emblema L1 com a estrela de ouro ao centro. Exibido para quem ativar qualquer pin de Líder investido (Líder, Master ou Master Avançado).',
              fileRef: fileInputLiderRef
            }
          ].map((item) => (
            <div 
              key={item.key} 
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-[32px] shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-base">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {item.desc}
                  </p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider self-start sm:self-auto ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
                {/* Visualização da Imagem sobre Tecido Verde */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#0c3c31] rounded-2xl p-2 flex items-center justify-center flex-shrink-0 border-2 border-[#092d25] shadow-md relative overflow-hidden">
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px]" />
                  {isUploadingFaixaImg === item.key ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin relative z-10" />
                  ) : (
                    <img 
                      src={faixaAdminConfig[item.key] || DEFAULT_FAIXA_CONFIG[item.key]} 
                      alt={item.title}
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] relative z-10" 
                    />
                  )}
                </div>

                {/* Campos de URL e Upload */}
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">
                      URL da Imagem
                    </label>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      value={faixaAdminConfig[item.key] || ''}
                      onChange={(e) => setFaixaAdminConfig({ ...faixaAdminConfig, [item.key]: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingFaixaImg === item.key}
                      onClick={() => item.fileRef.current?.click()}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <ImageIcon size={15} />
                      <span>{isUploadingFaixaImg === item.key ? 'Enviando...' : 'Fazer Upload de Imagem'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetSingleFaixaGlobe(item.key)}
                      className="px-3.5 py-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl text-xs font-bold transition-all"
                      title="Restaurar padrão oficial"
                    >
                      Restaurar Padrão
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra de Ações: Salvar e Restaurar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isSavingFaixaConfig}
            onClick={handleSaveFaixaAdmin}
            className="w-full sm:flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSavingFaixaConfig ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : faixaConfigSavedSuccess ? (
              <>
                <Check size={18} />
                <span>Configurações Salvas com Sucesso!</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Salvar Configurações da Faixa</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetAllFaixaGlobes}
            className="w-full sm:w-auto px-5 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
          >
            Restaurar Todos Padrões
          </button>
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
            className="w-11 h-11 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-200 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"
            title="Voltar"
            aria-label="Voltar"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
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
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
              </button>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">CONFIGURAÇÕES</h3>
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">BÍBLIA SAGRADA</p>
              </div>
            </div>
            <Settings size={24} className="text-blue-200" />
          </div>
        </div>

        {/* Aparência (Modo Escuro + Cores de Realce) */}
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

          {/* Cores de Realce dentro do container do Modo Escuro */}
          {(() => {
            const currentAccentId = (typeof window !== 'undefined' && localStorage.getItem('dbv_tudo_accent_color')) || 'gold';
            const accentOptions = [
              { id: 'gold', label: 'Âmbar Dourado', hex: '#dca048', rgb: '220, 160, 72' },
              { id: 'coral', label: 'Coral Terracota', hex: '#dc8253', rgb: '220, 130, 83' },
              { id: 'teal', label: 'Turquesa Real', hex: '#49b3a8', rgb: '73, 179, 168' },
              { id: 'green', label: 'Verde Sálvia', hex: '#6bb07b', rgb: '107, 176, 123' }
            ];
            const activeOpt = accentOptions.find((o) => o.id === currentAccentId) || accentOptions[0];
            const isDark = bibleSettings.darkMode;
            return (
              <div
                className="rounded-2xl py-2.5 px-3 border transition-all relative overflow-hidden"
                style={{
                  backgroundColor: isDark ? '#14161d' : '#ffffff',
                  backgroundImage: isDark
                    ? `radial-gradient(circle at 18% 50%, rgba(${activeOpt.rgb}, 0.20) 0%, rgba(${activeOpt.rgb}, 0.05) 48%, transparent 80%)`
                    : `radial-gradient(circle at 18% 50%, rgba(${activeOpt.rgb}, 0.16) 0%, rgba(${activeOpt.rgb}, 0.04) 50%, transparent 85%)`,
                  borderColor: isDark
                    ? `rgba(${activeOpt.rgb}, 0.28)`
                    : `rgba(${activeOpt.rgb}, 0.32)`
                }}
              >
                <div className="flex items-center space-x-1.5 mb-2">
                  <Palette size={14} style={{ color: activeOpt.hex }} className="shrink-0 transition-colors duration-300" />
                  <span className={`text-[11px] sm:text-xs font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Cores de Realce
                  </span>
                </div>
                <div className="flex items-center justify-around px-3 py-0.5">
                  {accentOptions.map((option) => {
                    const isSelected = currentAccentId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          try {
                            localStorage.setItem('dbv_tudo_accent_color', option.id);
                            window.dispatchEvent(new CustomEvent('dbv_accent_color_changed', { detail: option.id }));
                          } catch {}
                          setBibleSettings({ ...bibleSettings });
                        }}
                        title={option.label}
                        aria-label={`Cor de realce ${option.label}`}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer relative shrink-0 ${
                          isSelected ? 'scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100 active:scale-95'
                        }`}
                        style={{
                          width: '24px',
                          height: '24px',
                          minWidth: '24px',
                          minHeight: '24px',
                          backgroundColor: option.hex,
                          boxShadow: isSelected
                            ? isDark
                              ? `0 0 0 2px rgba(255, 255, 255, 0.95), 0 0 10px 2px rgba(${option.rgb}, 0.65)`
                              : `0 0 0 2px #ffffff, 0 0 0 3.5px rgba(${option.rgb}, 0.75), 0 2px 6px rgba(${option.rgb}, 0.35)`
                            : '0 1px 3px rgba(0, 0, 0, 0.25)'
                        }}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} className="text-white drop-shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                className="w-11 h-11 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 border border-white/15"
                title="Voltar"
                aria-label="Voltar"
              >
                <ChevronLeft size={22} strokeWidth={2.5} />
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
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const id = getYouTubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  };

  const getChannelInitials = (channelName: string) => {
    const clean = (channelName || 'DBV').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const renderVideoPlayer = () => {
    if (!selectedVideo) return null;
    const videoId = getYouTubeId(selectedVideo.link);
    const relatedVideos = videos
      .filter(v => v.club === club && (v.id !== selectedVideo.id || v.categoria_id !== selectedVideo.categoria_id))
      .sort((a, b) => (a.categoria_id === selectedVideo.categoria_id ? -1 : b.categoria_id === selectedVideo.categoria_id ? 1 : 0));

    return (
      <div className="animate-slide-in space-y-6 pt-3 pb-28">
        <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
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
          <div className="p-4 sm:p-5 space-y-3.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
              {selectedVideo.titulo}
            </h3>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                  {getChannelInitials(selectedVideo.canal)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                    {selectedVideo.canal || 'Canal Oficial'}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {selectedVideo.visualizacoes?.toLowerCase().includes('visualiza')
                      ? selectedVideo.visualizacoes
                      : `${selectedVideo.visualizacoes || '0'} visualizações`}
                    {selectedVideo.duracao ? ` • ${selectedVideo.duracao}` : ''}
                  </p>
                </div>
              </div>

              <a
                href={selectedVideo.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                <Play size={12} fill="currentColor" />
                <span>YouTube</span>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-slate-800/90 rounded-2xl p-4 border border-red-100/60 dark:border-slate-700">
          <div className="flex items-start space-x-3.5">
            <div className="w-9 h-9 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-red-500 shadow-sm flex-shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-red-900 dark:text-white uppercase tracking-tight">Dica de Estudo</h4>
              <p className="text-red-700/80 dark:text-slate-300 text-xs font-medium leading-relaxed mt-0.5">
                Assista ao vídeo com atenção e faça anotações. Se for um requisito de classe ou especialidade, lembre-se de registrar seu resumo após assistir.
              </p>
            </div>
          </div>
        </div>

        {relatedVideos.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
              Próximos Vídeos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {relatedVideos.map((rel) => {
                const relThumb = getYouTubeThumbnail(rel.link);
                return (
                  <button
                    key={`${rel.categoria_id}-${rel.id}`}
                    onClick={() => {
                      setSelectedVideo(rel);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full flex items-start gap-3 p-2 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/80 hover:border-red-300 dark:hover:border-red-800 transition-all text-left group"
                  >
                    <div className="w-28 sm:w-32 aspect-video rounded-xl overflow-hidden bg-slate-900 relative shrink-0">
                      {relThumb ? (
                        <img
                          src={relThumb}
                          alt={rel.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src.includes('hqdefault.jpg')) {
                              target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-red-500">
                          <Video size={18} />
                        </div>
                      )}
                      {rel.duracao && (
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/85 text-white text-[9px] font-bold leading-none">
                          {rel.duracao}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {rel.titulo}
                      </h5>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {rel.canal}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                        {rel.visualizacoes?.toLowerCase().includes('visualiza')
                          ? rel.visualizacoes
                          : `${rel.visualizacoes || '0'} visualizações`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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

    const categoriesWithVideos = categories.filter(cat =>
      clubVideos.some(v => v.categoria_id === cat.id)
    );

    const visibleCategories =
      selectedVideoCategoryFilter === 'ALL'
        ? categoriesWithVideos
        : categoriesWithVideos.filter(c => c.id === selectedVideoCategoryFilter);

    return (
      <div className="animate-slide-in space-y-5 pt-2 pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        ) : categoriesWithVideos.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
            <Video size={48} className="text-slate-100 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum vídeo disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Barra de Categorias Estilo YouTube (Chips Horizontais) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
              <button
                type="button"
                onClick={() => setSelectedVideoCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  selectedVideoCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos ({clubVideos.length})
              </button>
              {categoriesWithVideos.map((cat) => {
                const count = clubVideos.filter(v => v.categoria_id === cat.id).length;
                const isActive = selectedVideoCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setSelectedVideoCategoryFilter(isActive ? 'ALL' : cat.id)
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat.nome} ({count})
                  </button>
                );
              })}
            </div>

            {/* Seções por Categoria com Lista Compacta Estilo YouTube e Miniaturas Reais */}
            <div className="space-y-6">
              {visibleCategories.map(category => {
                const allCatVideos = clubVideos.filter(v => v.categoria_id === category.id);
                const categoryVideos = allCatVideos;
                if (categoryVideos.length === 0) return null;

                return (
                  <div key={category.id} className="space-y-3">
                    {/* Cabeçalho da Categoria */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-xs">
                          <Play size={14} fill="currentColor" />
                        </div>
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                            {category.nome}
                          </h4>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {allCatVideos.length} {allCatVideos.length === 1 ? 'vídeo' : 'vídeos'}
                          </p>
                        </div>
                      </div>
                      {allCatVideos.length > 4 && selectedVideoCategoryFilter === 'ALL' && (
                        <button
                          type="button"
                          onClick={() => setSelectedVideoCategoryFilter(category.id)}
                          className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          Ver todos
                        </button>
                      )}
                    </div>

                    {/* Container da Categoria com Miniaturas Compactas 16:9 (1 coluna no celular, 2 colunas no PC) */}
                    <div className="bg-white dark:bg-slate-800/90 rounded-[26px] p-2.5 sm:p-3 shadow-xs border border-slate-100 dark:border-slate-700/80 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {categoryVideos.map(video => {
                        const thumbUrl = getYouTubeThumbnail(video.link);
                        const viewsText = video.visualizacoes?.toLowerCase().includes('visualiza')
                          ? video.visualizacoes
                          : `${video.visualizacoes || '0'} visualizações`;

                        return (
                          <button
                            key={`${video.categoria_id}-${video.id}`}
                            type="button"
                            onClick={() => {
                              setSelectedVideo(video);
                              setActiveSubView('VIDEO_PLAYER');
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all active:scale-[0.99] text-left group cursor-pointer"
                          >
                            {/* Miniatura Compacta 16:9 Estilo YouTube */}
                            <div className="w-28 sm:w-32 aspect-video rounded-xl bg-slate-900 relative overflow-hidden shrink-0 shadow-xs">
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={video.titulo}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (target.src.includes('hqdefault.jpg')) {
                                      target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-red-500">
                                  <Video size={20} />
                                </div>
                              )}

                              {/* Botão Play discreto e Badge de Duração no canto inferior direito */}
                              <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                <div className="w-7 h-5 rounded-md bg-red-600/90 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  <Play size={10} fill="currentColor" className="ml-0.5" />
                                </div>
                              </div>

                              {video.duracao && (
                                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-white text-[9px] font-bold tracking-tight leading-none">
                                  {video.duracao}
                                </span>
                              )}
                            </div>

                            {/* Informações à direita da miniatura */}
                            <div className="flex-1 min-w-0 py-0.5">
                              <h5 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                {video.titulo}
                              </h5>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-black shrink-0">
                                  {getChannelInitials(video.canal)}
                                </span>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                  {video.canal || 'Canal Oficial'}
                                </span>
                              </div>
                              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                {viewsText}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
    const defaultMinistry: 'DBV' | 'AVT' = club === ClubType.ADVENTURER ? 'AVT' : 'DBV';
    const payload = {
      ...newForm,
      icone: newForm.icone === 'AVT' || newForm.icone === 'DBV' ? newForm.icone : defaultMinistry
    };
    setIsLoading(true);
    if (editingFormId) {
      const { data, error } = await updateFormulario({ ...(payload as Partial<Formulario>), id: editingFormId });
      if (!error) {
        setFormularios(formularios.map(f => f.id === editingFormId ? (data as Formulario) : f));
        setEditingFormId(null);
        setNewForm({ titulo: '', categoria: 'forms', link: '', descricao: '', icone: defaultMinistry });
      } else {
        console.error("Erro ao atualizar formulário:", error);
      }
    } else {
      const { data, error } = await createFormulario(payload as Omit<Formulario, 'id' | 'created_at'>);
      if (!error) {
        setFormularios([...formularios, data as Formulario]);
        setNewForm({ titulo: '', categoria: 'forms', link: '', descricao: '', icone: defaultMinistry });
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
                  categoryVideos.map(video => {
                    const adminThumb = getYouTubeThumbnail(video.link);
                    return (
                    <div key={`${video.categoria_id}-${video.id}`} className={`flex items-center justify-between p-3 rounded-2xl ${editingVideoId === video.id ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'} transition-all`}>
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-20 aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center text-white shrink-0 relative">
                          {adminThumb ? (
                            <img src={adminThumb} alt={video.titulo} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                          ) : (
                            <Video size={16} />
                          )}
                          {video.duracao && (
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/85 text-white text-[8px] font-bold">
                              {video.duracao}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-800 dark:text-white whitespace-normal break-words line-clamp-2">{video.titulo}</p>
                          <p className="text-[10px] font-bold text-slate-400">{video.canal}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
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
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFormAdmin = () => {
    const activeMinistry: 'DBV' | 'AVT' = club === ClubType.ADVENTURER ? 'AVT' : 'DBV';
    const filteredAdminForms = formularios.filter((f) => {
      const linkLower = (f.link || '').toLowerCase();
      if (linkLower.includes('ministerioaventureiros') || linkLower.includes('/aventureiros/')) {
        return activeMinistry === 'AVT';
      }
      if (linkLower.includes('/desbravadores/')) {
        return activeMinistry === 'DBV';
      }
      const tag = (f.icone || '').toUpperCase().trim();
      if (tag === 'AVT') return activeMinistry === 'AVT';
      return activeMinistry === 'DBV';
    });

    return (
      <div className="animate-slide-in space-y-8 pt-4 pb-28">
        {/* Novo Formulário / Editar Formulário */}
        <div className={`bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border ${editingFormId ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/20' : 'border-slate-100 dark:border-slate-700'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center space-x-2">
              {editingFormId ? <Edit2 size={20} className="text-amber-500" /> : <FileText size={20} className="text-amber-600" />}
              <span>
                {editingFormId
                  ? 'Editar Formulário'
                  : `Novo Formulário (${activeMinistry === 'AVT' ? 'Aventureiros' : 'Desbravadores'})`}
              </span>
            </h4>
            {editingFormId && (
              <button 
                onClick={() => {
                  setEditingFormId(null);
                  setNewForm({ titulo: '', categoria: 'forms', link: '', descricao: '', icone: activeMinistry });
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={newForm.categoria || 'forms'}
                onChange={e => setNewForm({...newForm, categoria: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
              >
                <option value="fichas">Fichas de Atividades</option>
                <option value="forms">Formulários</option>
                <option value="certificados">Certificados</option>
                <option value="graficos">Materiais Gráficos</option>
              </select>
              <select
                value={
                  newForm.icone === 'DBV' || newForm.icone === 'AVT'
                    ? newForm.icone
                    : activeMinistry
                }
                onChange={e => setNewForm({...newForm, icone: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 dark:text-white rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
              >
                <option value="DBV">Exclusivo Desbravadores (DBV)</option>
                <option value="AVT">Exclusivo Aventureiros (AVT)</option>
              </select>
            </div>
            <input 
              type="text" 
              placeholder="Link do Google Drive / PDF"
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
                    setNewForm({ titulo: '', categoria: 'forms', link: '', descricao: '', icone: activeMinistry });
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

        {/* Lista de Formulários do Clube Atual */}
        <div className="space-y-4">
          <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight px-2">
            Formulários Ativos ({activeMinistry === 'AVT' ? 'Aventureiros' : 'Desbravadores'})
          </h4>
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-4 shadow-sm border border-slate-100 dark:border-slate-700 space-y-2">
            {filteredAdminForms.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum formulário cadastrado</p>
            ) : (
              filteredAdminForms.map(form => (
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

  // Navegação centralizada de "Voltar" (botão de voltar do cabeçalho + botões laterais do mouse + botão voltar do sistema)
  const handleClubBackNavigation = useCallback((): boolean => {
    // 1. Fechar modais/zoom abertos primeiro
    if (isTrunfoImageZoomed) {
      setIsTrunfoImageZoomed(false);
      return true;
    }
    if (selectedTrunfoModal) {
      setSelectedTrunfoModal(null);
      setIsTrunfoImageZoomed(false);
      return true;
    }
    if (selectedCultureDetail) {
      setSelectedCultureDetail(null);
      return true;
    }
    if (isSpecialtySearchOpen) {
      setIsSpecialtySearchOpen(false);
      return true;
    }
    if (isPptxModalOpen && !isGeneratingPptx) {
      setIsPptxModalOpen(false);
      return true;
    }
    if (isExamModalOpen && !isGeneratingExam) {
      setIsExamModalOpen(false);
      return true;
    }

    // 2. Permitir que subcomponentes ativos (Prova Ao Vivo, Manual de Campo, etc.) fechem modais internos ou recuem etapas
    const subBackEvent = new CustomEvent('dbv_subcomponent_back_request', { cancelable: true });
    if (!window.dispatchEvent(subBackEvent)) {
      return true;
    }

    // 3. Se já estiver na página principal do clube, retorna false para que o App volte à HOME
    if (activeSubView === 'MAIN') {
      return false;
    }

    // 4. Recuar entre as sub-páginas do clube (incluindo Bíblia, Especialidades, Classes, Cultura, Biblioteca, etc.)
    if (activeSubView === 'CLASS_DETAILS') {
      setActiveSubView('CLASSES');
    } else if (activeSubView === 'SPECIALTY_DETAILS') {
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
    } else if (activeSubView === 'BIBLE_VERSES') {
      setActiveSubView('BIBLE_CHAPTERS');
    } else if (activeSubView === 'BIBLE_CHAPTERS') {
      setActiveSubView('BIBLE_BOOKS');
    } else if (activeSubView === 'BIBLE_BOOKS') {
      setActiveSubView('BIBLE');
    } else if (
      activeSubView === 'BIBLE_MARKED_VERSES' ||
      activeSubView === 'BIBLE_DICTIONARY' ||
      activeSubView === 'BIBLE_NOTES' ||
      activeSubView === 'BIBLE_SETTINGS'
    ) {
      setActiveSubView('BIBLE_MORE');
    } else if (activeSubView === 'BIBLE_MORE') {
      setActiveSubView('BIBLE');
    } else if (activeSubView === 'BIBLE_DEVOTIONAL_VIEW') {
      if (isAdmin && selectedDevocional) {
        setActiveSubView('BIBLE_DEVOTIONAL_LIST');
      } else {
        setActiveSubView('BIBLE');
      }
    } else if (activeSubView === 'BIBLE') {
      setActiveSubView('MAIN');
    } else if (activeSubView === 'SPECIALTIES_LIST') {
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
      setActiveSubView(club === ClubType.ADVENTURER ? 'CULTURE' : 'HISTORY_LIST');
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
      setActiveSubView(pdfReturnSubView);
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
    } else if (
      activeSubView === 'VIDEO_ADMIN' ||
      activeSubView === 'FORM_ADMIN' ||
      activeSubView === 'LINKS_ADMIN' ||
      activeSubView === 'ACHIEVEMENTS_ADMIN' ||
      activeSubView === 'TRUNFOS_ADMIN' ||
      activeSubView === 'FAIXA_ADMIN'
    ) {
      setActiveSubView('BIBLE_ADMIN');
    } else if (activeSubView === 'VIDEOS') {
      setActiveSubView('MAIN');
    } else if (activeSubView === 'VIDEO_PLAYER') {
      setActiveSubView('VIDEOS');
    } else if (activeSubView === 'TRUNFOS') {
      setActiveSubView('MAIN');
    } else if (activeSubView === 'FIELD_TRAINING') {
      setActiveSubView('MAIN');
    } else if (activeSubView === 'QUIZ') {
      if (quizBackHandlerRef.current && quizBackHandlerRef.current()) {
        return true;
      }
      setActiveSubView('FIELD_TRAINING');
    } else if (activeSubView === 'LIVE_EXAM') {
      setActiveSubView('FIELD_TRAINING');
    } else if (activeSubView === 'UNIT_CORNER') {
      setActiveSubView('FIELD_TRAINING');
    } else if (activeSubView === 'FIELD_MANUAL') {
      setActiveSubView('FIELD_TRAINING');
    } else if (activeSubView === 'ORDEM_UNIDA') {
      setActiveSubView('FIELD_TRAINING');
    } else if (activeSubView === 'VERSION_HISTORY') {
      setActiveSubView('MAIN');
    } else {
      setActiveSubView('MAIN');
    }

    return true;
  }, [
    isTrunfoImageZoomed,
    selectedTrunfoModal,
    selectedCultureDetail,
    isSpecialtySearchOpen,
    isPptxModalOpen,
    isGeneratingPptx,
    isExamModalOpen,
    isGeneratingExam,
    activeSubView,
    specialtyNavStack,
    selectedCategory,
    isAdmin,
    selectedDevocional,
    club,
    selectedLibraryCategory,
    isPathfinder,
    pdfReturnSubView
  ]);

  useEffect(() => {
    const onAppBackRequest = (e: Event) => {
      if (handleClubBackNavigation()) {
        e.preventDefault();
      }
    };
    window.addEventListener('dbv_app_back_request', onAppBackRequest);
    return () => window.removeEventListener('dbv_app_back_request', onAppBackRequest);
  }, [handleClubBackNavigation]);

  const fieldAndPracticeButtons = [
    { 
      label: 'Prova Ao Vivo (QR Code)', 
      subtitle: canGenerateSpecialtyPptx ? 'Conselheiro+ (Criar Sala) • Anti-Cola' : 'Área da Prova • PIN / QR Code no Celular',
      description: canGenerateSpecialtyPptx
        ? 'Crie uma prova de especialidade com QR Code, tempo limite e anti-cola (liberado de Conselheiro para cima) ou escaneie o QR Code pelo celular.'
        : 'Escaneie o QR Code da sala pelo celular ou digite o PIN de 6 dígitos para fazer sua prova (criação exclusiva de Conselheiro acima).',
      badge: 'Anti-Cola',
      icon: QrCode, 
      gradient: 'from-[#be123c] via-[#e11d48] to-[#f43f5e]', 
      view: 'LIVE_EXAM', 
      show: true 
    },
    { 
      label: 'Quiz e Simulado', 
      subtitle: isPathfinder ? 'Bom de Bíblia, Classes e Desafios' : 'Desafios, Bíblia e Concursos',
      description: 'Treine para o Bom de Bíblia, classes regulares/progressivas, especialidades e história do clube.',
      badge: 'Interativo',
      icon: Zap, 
      gradient: 'from-[#4f46e5] via-[#6366f1] to-[#818cf8]', 
      view: 'QUIZ', 
      show: true 
    },
    { 
      label: 'Cantinho & Acamp.', 
      subtitle: 'Unidade, Escala e Mochila',
      description: 'Checklist inteligente de acampamento, escala de cozinha/limpeza, cardápio e ata do cantinho da unidade.',
      badge: 'Unidade',
      icon: Tent, 
      gradient: 'from-[#0f766e] via-[#0d9488] to-[#14b8a6]', 
      view: 'UNIT_CORNER', 
      show: true 
    },
    { 
      label: 'Guia de Campo', 
      subtitle: 'Nós 3D, Códigos, Libras e Socorros',
      description: 'Passo a passo de nós e amarras, tradutor de Morse, Semáforo, Libras Brasileira, pistas e primeiros socorros.',
      badge: 'Manual Prático',
      icon: Compass, 
      gradient: 'from-[#9a3412] via-[#c2410c] to-[#ea580c]', 
      view: 'FIELD_MANUAL',
      manualTab: 'NOS_AMARRAS' as const,
      show: true 
    },
    { 
      label: 'Ordem Unida', 
      subtitle: 'Vozes, Marcha, Posições e Evoluções',
      description: 'Simulador das 3 partes da voz de comando, metrônomo 116 BPM, posições ilustradas e comandos de apito DSA.',
      badge: 'Padrão DSA',
      icon: Flag, 
      gradient: 'from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb]', 
      view: 'ORDEM_UNIDA',
      show: true 
    }
  ].filter(b => b.show);

  const renderFieldTraining = () => {
    return (
      <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-2 sm:px-4 space-y-4 animate-slide-in pt-1 pb-24">
        {/* Banner Compacto da Central de Treinamento em Campo */}
        <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] rounded-[24px] p-4 sm:p-5 text-white shadow-md border border-white/10 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none">
            <Compass size={96} />
          </div>
          <div className="relative z-10 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[9px] font-black uppercase tracking-widest">
                Central Prática • {isPathfinder ? 'Desbravadores' : 'Aventureiros'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[9px] font-black uppercase tracking-wider">
                4 Módulos
              </span>
            </div>
            <h3 className="text-base sm:text-xl font-black uppercase tracking-tight leading-tight">
              Treinamento em Campo
            </h3>
            <p className="text-[11px] sm:text-xs text-white/80 font-medium max-w-2xl leading-snug">
              Escolha a área prática para instrução da unidade, acampamento, simulados ou Ordem Unida:
            </p>
          </div>
        </div>

        {/* Grid Horizontal Compacto com as 4 áreas dentro de Treinamento em Campo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fieldAndPracticeButtons.map((item, i) => {
            const IconComp = item.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if ((item as any).manualTab) {
                    setFieldManualTab((item as any).manualTab);
                  }
                  if (item.view === 'LIVE_EXAM') {
                    setSelectedSpecialty(null);
                  }
                  setActiveSubView(item.view as any);
                }}
                className={`w-full relative overflow-hidden bg-gradient-to-br ${item.gradient} rounded-[22px] sm:rounded-[24px] px-4 py-3.5 sm:p-4 flex items-center justify-between gap-3.5 text-left text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all group border border-white/20 cursor-pointer`}
              >
                <div className="absolute -bottom-3 -right-3 text-white/15 pointer-events-none group-hover:scale-110 transition-transform duration-300">
                  <IconComp className="w-20 h-20 stroke-[1.4]" />
                </div>

                <div className="relative z-10 flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <IconComp className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-tight truncate drop-shadow-xs">
                      {item.label}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] font-bold text-white/85 uppercase tracking-wider truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  <ChevronRight size={16} strokeWidth={2.6} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Rodapé de Créditos e Fontes Oficiais da Central de Treinamento em Campo */}
        <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <BookOpen size={18} />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                Créditos e Fontes Oficiais — Treinamento em Campo
              </span>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Todos os módulos de instrução prática (Quiz e Simulado, Cantinho da Unidade & Acampamento, Guia de Campo e Ordem Unida) seguem as diretrizes oficiais da <strong>Divisão Sul-Americana da IASD (DSA — Ministério de Desbravadores e Aventureiros)</strong>, <strong>Manual Administrativo DBV e AVT</strong>, <strong>Manual de Ordem Unida DSA</strong>, <strong>Regulamento de Uniformes (RUD)</strong>, <strong>MDA Wiki (mda.wiki.br)</strong>, <strong>Escoteiros do Brasil (UEB)</strong>, <strong>Desbrava7</strong> e <strong>INES (Libras)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const quickAccessButtons = [
      { 
        label: 'Cultura', 
        subtitle: 'História e Ideais', 
        icon: Info, 
        gradient: 'from-[#0052D4] via-[#4364F7] to-[#6FB1FC]', 
        view: 'CULTURE', 
        show: true 
      },
      { 
        label: 'Biblioteca', 
        subtitle: 'Manuais e Livros', 
        icon: Book, 
        gradient: 'from-[#6a11cb] via-[#7F00FF] to-[#9d4edd]', 
        view: 'LIBRARY', 
        show: true 
      },
      { 
        label: 'Gerenciar', 
        subtitle: 'Administração', 
        icon: Settings, 
        gradient: 'from-[#fd7e14] via-[#f59e0b] to-[#fbbf24]', 
        view: 'MANAGEMENT', 
        show: true 
      },
      { 
        label: 'Trunfos', 
        subtitle: 'Coleção de Bordados', 
        icon: Trophy, 
        gradient: 'from-[#e11d48] via-[#f43f5e] to-[#fb7185]', 
        view: 'TRUNFOS', 
        show: true 
      },
      { 
        label: 'Desbrava +', 
        subtitle: 'Materiais Extras', 
        icon: Sparkles, 
        gradient: 'from-[#b5179e] via-[#c026d3] to-[#e879f9]', 
        view: 'DESBRAVA_PLUS', 
        show: isPathfinder 
      },
      { 
        label: 'Vídeos', 
        subtitle: 'Canal e Tutoriais', 
        icon: Video, 
        gradient: 'from-[#059669] via-[#10b981] to-[#34d399]', 
        view: 'VIDEOS', 
        show: true 
      }
    ].filter(b => b.show);

    return (
      <div className="space-y-5 md:space-y-4 lg:space-y-5 animate-slide-up pt-2 md:pt-1 pb-24 md:pb-6 landscape:pb-16">
        {/* Visualização para Mobile: Botões na horizontal compactos (sem a palavra Acessar) */}
        <div className="md:hidden space-y-2.5 px-1">
          {/* Cartão Mobile Horizontal: Bíblia Sagrada */}
          <button 
            onClick={() => setActiveSubView('BIBLE')}
            className="w-full relative overflow-hidden bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#3b82f6] rounded-[22px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left text-white shadow-md active:scale-[0.98] transition-all group border border-white/20"
          >
            <div className="absolute -bottom-3 -right-3 text-white/15 pointer-events-none group-hover:scale-110 transition-transform">
              <Book className="w-20 h-20 stroke-[1.4]" />
            </div>
            <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs shrink-0">
                <Book size={21} strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight truncate">Bíblia Sagrada</h3>
                <p className="text-[10px] font-bold text-white/85 uppercase tracking-wider mt-0.5 truncate">Almeida Revista e Corrigida</p>
              </div>
            </div>
            <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ChevronRight size={16} strokeWidth={2.6} />
            </div>
          </button>

          {/* Cartão Mobile Horizontal: Classes */}
          <button 
            onClick={() => setActiveSubView('CLASSES')}
            className={`w-full relative overflow-hidden ${
              isPathfinder 
                ? 'bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#ef4444]' 
                : 'bg-gradient-to-br from-[#800000] via-[#660000] to-[#991b1b]'
            } rounded-[22px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left text-white shadow-md active:scale-[0.98] transition-all group border border-white/20`}
          >
            <div className="absolute -bottom-3 -right-3 text-white/15 pointer-events-none group-hover:scale-110 transition-transform">
              <Layers className="w-20 h-20 stroke-[1.4]" />
            </div>
            <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs shrink-0">
                <Layers size={21} strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight truncate">Classes</h3>
                <p className="text-[10px] font-bold text-white/85 uppercase tracking-wider mt-0.5 truncate">Requisitos e Progresso</p>
              </div>
            </div>
            <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ChevronRight size={16} strokeWidth={2.6} />
            </div>
          </button>

          {/* Cartão Mobile Horizontal: Especialidades */}
          <button 
            onClick={() => setActiveSubView('SPECIALTIES')}
            className="w-full relative overflow-hidden bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#f59e0b] rounded-[22px] px-4 py-3.5 flex items-center justify-between gap-3.5 text-left text-white shadow-md active:scale-[0.98] transition-all group border border-white/20"
          >
            <div className="absolute -bottom-3 -right-3 text-white/15 pointer-events-none group-hover:scale-110 transition-transform">
              <Award className="w-20 h-20 stroke-[1.4]" />
            </div>
            <div className="flex items-center gap-3.5 min-w-0 flex-1 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs shrink-0">
                <Award size={21} strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight truncate">Especialidades</h3>
                <p className="text-[10px] font-bold text-white/85 uppercase tracking-wider mt-0.5 truncate">Manual, Áreas e Requisitos</p>
              </div>
            </div>
            <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ChevronRight size={16} strokeWidth={2.6} />
            </div>
          </button>
        </div>

        {/* Visualização para PC / Desktop: Lado a lado horizontalmente com retângulos estilizados */}
        <div className="hidden md:block w-full max-w-5xl lg:max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-4 lg:gap-5">
            {/* Retângulo Grande: Bíblia Sagrada */}
            <button 
              onClick={() => setActiveSubView('BIBLE')}
              className="w-full md:h-[clamp(116px,16.5vh,158px)] bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#3b82f6] rounded-[24px] lg:rounded-[28px] p-4 lg:p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all group flex flex-col justify-between text-white text-left relative overflow-hidden border border-white/20"
            >
              <div className="absolute -bottom-4 -right-4 text-white/15 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Book className="w-32 h-32 lg:w-36 lg:h-36 stroke-[1.4]" />
              </div>
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-white/20 backdrop-blur-xs rounded-2xl border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform shrink-0">
                  <Book className="w-5 h-5 lg:w-5.5 lg:h-5.5" strokeWidth={2.4} />
                </div>
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-1.5">
                <h3 className="font-black text-base lg:text-xl uppercase tracking-tight leading-tight">
                  Bíblia Sagrada
                </h3>
                <p className="text-[9px] lg:text-[10.5px] font-bold text-white/80 uppercase tracking-wider mt-0.5">
                  Almeida Revista e Corrigida
                </p>
              </div>
            </button>

            {/* Retângulo Grande: Classes */}
            <button 
              onClick={() => setActiveSubView('CLASSES')}
              className={`w-full md:h-[clamp(116px,16.5vh,158px)] ${
                isPathfinder 
                  ? 'bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#ef4444]' 
                  : 'bg-gradient-to-br from-[#800000] via-[#660000] to-[#991b1b]'
              } rounded-[24px] lg:rounded-[28px] p-4 lg:p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all group flex flex-col justify-between text-white text-left relative overflow-hidden border border-white/20`}
            >
              <div className="absolute -bottom-4 -right-4 text-white/15 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Layers className="w-32 h-32 lg:w-36 lg:h-36 stroke-[1.4]" />
              </div>
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-white/20 backdrop-blur-xs rounded-2xl border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform shrink-0">
                  <Layers className="w-5 h-5 lg:w-5.5 lg:h-5.5" strokeWidth={2.4} />
                </div>
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-1.5">
                <h3 className="font-black text-base lg:text-xl uppercase tracking-tight leading-tight">
                  Classes
                </h3>
                <p className="text-[9px] lg:text-[10.5px] font-bold text-white/80 uppercase tracking-wider mt-0.5">
                  Requisitos e Progresso
                </p>
              </div>
            </button>

            {/* Retângulo Grande: Especialidades */}
            <button 
              onClick={() => setActiveSubView('SPECIALTIES')}
              className="w-full md:h-[clamp(116px,16.5vh,158px)] bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#f59e0b] rounded-[24px] lg:rounded-[28px] p-4 lg:p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all group flex flex-col justify-between text-white text-left relative overflow-hidden border border-white/20"
            >
              <div className="absolute -bottom-4 -right-4 text-white/15 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Award className="w-32 h-32 lg:w-36 lg:h-36 stroke-[1.4]" />
              </div>
              <div className="flex items-center justify-between w-full relative z-10">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-white/20 backdrop-blur-xs rounded-2xl border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform shrink-0">
                  <Award className="w-5 h-5 lg:w-5.5 lg:h-5.5" strokeWidth={2.4} />
                </div>
                <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4" strokeWidth={2.8} />
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-1.5">
                <h3 className="font-black text-base lg:text-xl uppercase tracking-tight leading-tight">
                  Especialidades
                </h3>
                <p className="text-[9px] lg:text-[10.5px] font-bold text-white/80 uppercase tracking-wider mt-0.5">
                  Manual, Áreas e Requisitos
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================
            SEÇÃO DE ACESSO RÁPIDO (EXATAMENTE COMO NA IMAGEM DE REFERÊNCIA)
           ======================================================== */}
        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4">
          <div className="flex items-center space-x-2 px-1 mb-2.5 sm:mb-3 md:mb-2.5">
            <span className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-slate-400 dark:text-slate-400 uppercase">
              ACESSO RÁPIDO
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-3.5 md:gap-4">
            {quickAccessButtons.map((item, i) => {
              const IconComp = item.icon;
              return (
                <button 
                  key={i} 
                  onClick={() => {
                    if ((item as any).manualTab) {
                      setFieldManualTab((item as any).manualTab);
                    }
                    setActiveSubView(item.view as any);
                  }} 
                  className={`w-full relative overflow-hidden bg-gradient-to-br ${item.gradient} rounded-[24px] sm:rounded-[26px] md:rounded-[26px] p-3.5 sm:p-4 flex flex-col justify-between text-left text-white shadow-md hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all group min-h-[108px] sm:min-h-[118px] md:min-h-0 md:h-[clamp(96px,13.5vh,124px)] border border-white/20`}
                >
                  {/* Marca d'água grande vazada no fundo direito */}
                  <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 text-white/15 dark:text-white/10 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    <IconComp className="w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 stroke-[1.4]" />
                  </div>

                  {/* Caixinha quadrada translúcida no topo esquerdo */}
                  <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                    <IconComp className="w-4.5 h-4.5 sm:w-5 sm:h-5" strokeWidth={2.4} />
                  </div>

                  {/* Título e Subtítulo no canto inferior esquerdo */}
                  <div className="relative z-10 mt-auto pt-1.5">
                    <h4 className="text-sm sm:text-base md:text-[17px] font-black text-white uppercase tracking-tight leading-tight drop-shadow-xs">
                      {item.label}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-wider mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            BOTÃO ÚNICO COMPACTO: TREINAMENTO EM CAMPO (AGRUPA AS NOVAS ÁREAS)
           ======================================================== */}
        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4">
          <button
            type="button"
            onClick={() => setActiveSubView('FIELD_TRAINING')}
            className="w-full relative overflow-hidden bg-gradient-to-br from-[#0f766e] via-[#0284c7] to-[#1e40af] rounded-[22px] sm:rounded-[26px] px-4 py-3.5 sm:p-4 flex items-center justify-between gap-3.5 text-left text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] transition-all group border border-white/20 cursor-pointer"
          >
            {/* Marca d'água grande vazada no fundo direito */}
            <div className="absolute -bottom-3 -right-3 text-white/15 pointer-events-none group-hover:scale-110 transition-transform duration-300">
              <Compass className="w-24 h-24 stroke-[1.3]" />
            </div>

            <div className="relative z-10 flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight leading-tight truncate drop-shadow-xs">
                  Treinamento em Campo
                </h4>
                <p className="text-[10px] sm:text-xs font-bold text-white/85 uppercase tracking-wider mt-0.5 truncate">
                  Quiz & Simulado • Cantinho & Acamp. • Guia de Campo • Ordem Unida
                </p>
              </div>
            </div>

            <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs border border-white/25 flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-slate-900 transition-colors">
              <ChevronRight size={16} strokeWidth={2.6} />
            </div>
          </button>
        </div>

        {/* Links Dinâmicos */}
        {appLinks.length > 0 && (
          <div className="w-full max-w-5xl lg:max-w-6xl mx-auto px-4 mb-12">
            <div className="flex items-center space-x-2 px-1 mb-3.5 sm:mb-4">
              <span className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-slate-400 dark:text-slate-400 uppercase">
                LINKS ÚTEIS
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {appLinks.map((link) => (
                <button 
                  key={link.id}
                  onClick={() => {
                    setWebTitle(link.name);
                    setSelectedWebUrl(link.url);
                    setActiveSubView('WEB_VIEWER');
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 flex flex-col justify-between text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all group relative overflow-hidden min-h-[105px] sm:min-h-[115px]"
                >
                  <div className="absolute -bottom-3 -right-3 text-slate-100 dark:text-slate-700/50 pointer-events-none group-hover:scale-110 transition-transform">
                    <ExternalLink size={72} className="stroke-[1.3]" />
                  </div>
                  <div className="relative z-10 w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs group-hover:scale-105 transition-transform">
                    <ExternalLink size={18} strokeWidth={2.4} />
                  </div>
                  <div className="relative z-10 mt-auto pt-2">
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight line-clamp-1">
                      {link.name}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
                      Abrir Conteúdo
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-row h-full w-full bg-transparent animate-slide-in overflow-hidden relative transition-colors duration-500">
      {/* MENU LATERAL ESQUERDO PARA PC (MD+) */}
      <aside 
        ref={sidebarRef}
        onClick={() => {
          if (!isSidebarOpen) {
            setIsSidebarOpen(true);
          }
        }}
        className={`hidden md:flex flex-col h-full bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 shrink-0 z-30 select-none shadow-sm transition-all duration-300 ease-in-out justify-between overflow-y-auto scrollbar-hide relative ${
          isSidebarOpen 
            ? activeSubView === 'LIVE_EXAM' && hasActiveLiveExamRoom
              ? 'w-72 lg:w-80 p-5 lg:p-6 cursor-default'
              : 'w-64 lg:w-72 p-5 lg:p-6 cursor-default' 
            : 'w-[78px] lg:w-[84px] px-2.5 py-4 cursor-pointer'
        }`}
        title={!isSidebarOpen ? "Clique em qualquer lugar para expandir o menu" : undefined}
      >
        {isSidebarOpen ? (
          /* ========================================================
             MENU EXPANDIDO (ABERTO)
             ======================================================== */
          <div className="flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
            {/* 1. Topo do Menu: Logo do App Limpa e Direta (sem container em volta) */}
            <div 
              onClick={() => {
                triggerLogoWobble();
                onBack();
              }}
              className="w-full flex flex-col items-center text-center cursor-pointer group transition-transform duration-300 py-1 select-none"
              title="DBV Tudo - Ir para Início"
            >
              <div 
                onAnimationEnd={() => setIsLogoWobbling(false)}
                className={`relative w-20 h-20 lg:w-22 lg:h-22 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 animate-float-sm ${
                  isLogoWobbling ? 'animate-logo-wobble' : ''
                }`}
              >
                <div
                  className={`absolute inset-1 rounded-full app-logo-click-glow blur-xl pointer-events-none transition-all duration-500 ${
                    isLogoWobbling ? 'opacity-100 scale-115' : 'opacity-0 scale-90 group-hover:opacity-55 group-hover:scale-105'
                  }`}
                />
                <img 
                  src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
                  alt="Logo DBV Tudo" 
                  draggable={false}
                  className="relative w-full h-full object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all select-none"
                />
                <div className="app-logo-sheen-mask app-logo-sheen-mask-sm" aria-hidden="true" />
              </div>
              <h1 className="mt-2 font-black text-slate-800 dark:text-white text-lg lg:text-xl tracking-tight uppercase leading-none">
                DBV Tudo
              </h1>
              <span className="text-[9px] lg:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.25em] mt-1">
                Gestão Digital
              </span>
            </div>

            {/* 2. Logo Abaixo: Foto de Perfil */}
            <div className="mt-4 w-full">
              <button
                onClick={onOpenProfile}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center space-x-3.5 transition-all group active:scale-[0.98] shadow-sm hover:shadow text-left"
                title="Acessar Perfil"
              >
                <div className="relative shrink-0">
                  <div className="w-13 h-13 lg:w-14 lg:h-14 rounded-full overflow-hidden ring-2 ring-indigo-500/30 dark:ring-indigo-400/30 shadow-sm flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400 group-hover:ring-indigo-500 transition-all">
                    {userAvatar ? (
                      <img src={userAvatar} alt="Foto de Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <User size={26} className="text-slate-400 dark:text-slate-300" />
                    )}
                  </div>
                  {isUserLoggedIn && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-xs" title="Conectado">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="block font-black text-xs lg:text-sm text-slate-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {userProfile?.nome || (!isUserLoggedIn ? 'Visitante' : 'Meu Perfil')}
                  </span>
                  <span className="block text-[9px] lg:text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate mt-0.5">
                    {userProfile?.funçao || (isPathfinder ? 'Desbravador' : 'Aventureiro')}
                  </span>
                  <span className="inline-flex items-center text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">
                    {isUserLoggedIn ? 'Ver Perfil →' : 'Fazer Login →'}
                  </span>
                </div>
              </button>
            </div>

            <div className="my-5 h-[1px] w-full bg-slate-200/70 dark:bg-slate-800/80" />

            {/* 3. Navegação: Início, Desbravadores e Aventureiros com Destaque apenas por cor */}
            <nav className="w-full space-y-2.5">
              <div className="px-1 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
                Menu Principal
              </div>

              {/* Botão Início (Ação de navegação para a Home geral) */}
              <button
                onClick={() => onBack()}
                className="w-full relative overflow-hidden flex items-center px-5 py-4 rounded-2xl font-black text-xs lg:text-sm uppercase tracking-wider transition-all text-left group active:scale-[0.98] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                title="Voltar para a página inicial"
              >
                {/* Ícone sombreado de fundo à direita (estilo tela inicial) */}
                <div className="absolute -right-2 -bottom-2 opacity-15 dark:opacity-15 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                  <HomeIcon className="w-16 h-16 stroke-[1.75]" />
                </div>

                <span className="relative z-10 truncate">Início</span>
              </button>

              {/* Botão Desbravadores (sem imagem à esquerda, com emblema sombreado à direita estilo tela inicial) */}
              <button
                onClick={() => {
                  handleMinistryButtonClick(ClubType.PATHFINDER);
                }}
                className={`w-full relative overflow-hidden flex items-center px-5 py-4 rounded-2xl font-black text-xs lg:text-sm uppercase tracking-wider transition-all text-left group active:scale-[0.98] ${
                  isPathfinder
                    ? 'bg-[#dc371b] text-white shadow-lg shadow-red-600/35 border border-red-400/35 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                }`}
                title="Área de Desbravadores"
              >
                {isPathfinder && (
                  <span className="ministry-orbit-ring" aria-hidden="true">
                    <span className="ministry-orbit-spinner ministry-orbit-dbv-active" />
                  </span>
                )}
                {/* Emblema sombreado à direita (estilo tela inicial) */}
                <div className={`absolute -right-2 -bottom-2 grayscale pointer-events-none group-hover:scale-125 transition-transform duration-700 ${
                  isPathfinder ? 'opacity-25' : 'opacity-15 dark:opacity-15'
                }`}>
                  <img 
                    src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png" 
                    alt="" 
                    className="w-16 h-16 object-contain"
                  />
                </div>

                <span className="relative z-10 truncate">Desbravadores</span>
              </button>

              {/* Botão Aventureiros (sem imagem à esquerda, com emblema sombreado à direita estilo tela inicial) */}
              <button
                onClick={() => {
                  handleMinistryButtonClick(ClubType.ADVENTURER);
                }}
                className={`w-full relative overflow-hidden flex items-center px-5 py-4 rounded-2xl font-black text-xs lg:text-sm uppercase tracking-wider transition-all text-left group active:scale-[0.98] ${
                  !isPathfinder
                    ? 'bg-[#800000] text-white shadow-lg shadow-red-950/45 border border-amber-400/30 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                }`}
                title="Área de Aventureiros"
              >
                {!isPathfinder && (
                  <span className="ministry-orbit-ring" aria-hidden="true">
                    <span className="ministry-orbit-spinner ministry-orbit-avt-active" />
                  </span>
                )}
                {/* Emblema sombreado à direita (estilo tela inicial) */}
                <div className={`absolute -right-2 -bottom-2 grayscale pointer-events-none group-hover:scale-125 transition-transform duration-700 ${
                  !isPathfinder ? 'opacity-25' : 'opacity-15 dark:opacity-15'
                }`}>
                  <img 
                    src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
                    alt="" 
                    className="w-16 h-16 object-contain"
                  />
                </div>

                <span className="relative z-10 truncate">Aventureiros</span>
              </button>
            </nav>
          </div>
        ) : (
          /* ========================================================
             MENU COMPACTO (FECHADO - APENAS ÍCONES)
             ======================================================== */
          <div className="flex flex-col items-center w-full animate-fade-in">
            {/* 1. Topo do Menu: Logo do App Limpa e Direta (sem container em volta) */}
            <div 
              onClick={() => {
                triggerLogoWobble();
                setIsSidebarOpen(true);
              }}
              onAnimationEnd={() => setIsLogoWobbling(false)}
              className={`relative w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center cursor-pointer group transition-transform duration-300 hover:scale-110 select-none animate-float-sm ${
                isLogoWobbling ? 'animate-logo-wobble' : ''
              }`}
              title="Clique para expandir o menu"
              aria-label="Expandir menu lateral"
            >
              <div
                className={`absolute inset-1 rounded-full app-logo-click-glow blur-xl pointer-events-none transition-all duration-500 ${
                  isLogoWobbling ? 'opacity-100 scale-115' : 'opacity-0 scale-90 group-hover:opacity-55 group-hover:scale-105'
                }`}
              />
              <img 
                src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
                alt="Logo DBV Tudo" 
                draggable={false}
                className="relative w-full h-full object-contain drop-shadow-md group-hover:drop-shadow-lg transition-all select-none"
              />
              <div className="app-logo-sheen-mask app-logo-sheen-mask-sm" aria-hidden="true" />
            </div>

            {/* 2. Logo Abaixo: Foto de Perfil Compacta (com bolinha de status sem cortes) */}
            <div className="mt-3.5 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProfile?.();
                }}
                className="w-12 h-12 lg:w-13 lg:h-13 rounded-full overflow-hidden ring-2 ring-indigo-500/20 hover:ring-indigo-500/70 shadow-sm flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400 active:scale-95 transition-all group"
                title={`Perfil: ${userProfile?.nome || 'Meu Perfil'}`}
                aria-label="Acessar Perfil"
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="Foto de Perfil" className="w-full h-full object-cover" />
                ) : (
                  <User size={22} className="text-slate-400 dark:text-slate-300" />
                )}
              </button>
              {/* Bolinha de status posicionada fora do overflow-hidden para não ser cortada */}
              {isUserLoggedIn && (
                <div 
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 pointer-events-none z-10 shadow-xs" 
                  title="Conectado"
                />
              )}
            </div>

            <div className="my-3.5 h-[1px] w-8 bg-slate-200/70 dark:bg-slate-800/80" />

            {/* 3. Navegação Compacta: Início, Desbravadores e Aventureiros com Destaque */}
            <nav className="w-full flex flex-col items-center space-y-3">
              {/* Botão Início (Modo Ícone com escrita) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                className="w-12 h-12 lg:w-13 lg:h-13 rounded-2xl flex flex-col items-center justify-center transition-all relative group active:scale-90 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 shadow-xs"
                title="Voltar ao Início"
                aria-label="Ir para Início"
              >
                <HomeIcon size={18} strokeWidth={2.4} />
                <span className="text-[8px] font-black uppercase leading-none mt-1 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white">
                  Início
                </span>
              </button>

              {/* Botão Desbravadores (Modo Ícone com Brasão) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMinistryButtonClick(ClubType.PATHFINDER);
                }}
                className={`w-12 h-12 lg:w-13 lg:h-13 overflow-hidden rounded-2xl flex flex-col items-center justify-center transition-all relative group active:scale-90 ${
                  isPathfinder
                    ? 'bg-[#dc371b] text-white shadow-lg shadow-red-600/40 border border-red-400/35 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800/70 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 hover:text-[#dc371b] dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50'
                }`}
                title="Desbravadores (DBV)"
                aria-label="Selecionar Desbravadores"
              >
                {isPathfinder && (
                  <span className="ministry-orbit-ring" aria-hidden="true">
                    <span className="ministry-orbit-spinner ministry-orbit-dbv-active" />
                  </span>
                )}
                <img 
                  src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png" 
                  alt="Brasão Desbravadores" 
                  className="w-5 h-5 lg:w-6 lg:h-6 object-contain drop-shadow-xs"
                />
                <span className={`text-[8px] font-black uppercase leading-none mt-1 ${
                  isPathfinder ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-[#dc371b]'
                }`}>
                  DBV
                </span>
              </button>

              {/* Botão Aventureiros (Modo Ícone com Brasão) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMinistryButtonClick(ClubType.ADVENTURER);
                }}
                className={`w-12 h-12 lg:w-13 lg:h-13 overflow-hidden rounded-2xl flex flex-col items-center justify-center transition-all relative group active:scale-90 ${
                  !isPathfinder
                    ? 'bg-[#800000] text-white shadow-lg shadow-red-950/50 border border-amber-400/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800/70 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-500 hover:text-[#800000] dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50'
                }`}
                title="Aventureiros (AVT)"
                aria-label="Selecionar Aventureiros"
              >
                {!isPathfinder && (
                  <span className="ministry-orbit-ring" aria-hidden="true">
                    <span className="ministry-orbit-spinner ministry-orbit-avt-active" />
                  </span>
                )}
                <img 
                  src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
                  alt="Brasão Aventureiros" 
                  className="w-5 h-5 lg:w-6 lg:h-6 object-contain drop-shadow-xs"
                />
                <span className={`text-[8px] font-black uppercase leading-none mt-1 ${
                  !isPathfinder ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-[#800000]'
                }`}>
                  AVT
                </span>
              </button>
            </nav>
          </div>
        )}

        {/* Rodapé da Barra Lateral: Botão de Ajustes + Versão e Ano */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center w-full">
          {isSidebarOpen ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings?.();
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 flex items-center gap-2.5 text-xs font-bold shadow-xs group"
                title="Ajustes"
                aria-label="Ajustes"
              >
                <Settings size={18} className="text-slate-500 dark:text-slate-400 group-hover:rotate-45 transition-transform duration-300" />
                <span>Ajustes</span>
              </button>
              <div className="flex flex-col items-center text-center mt-3 select-none text-slate-400 dark:text-slate-500 leading-tight">
                <span className="text-[10px] font-black tracking-wider text-slate-600 dark:text-slate-300">
                  v{APP_VERSION}
                </span>
                <span className="text-[8.5px] font-extrabold uppercase tracking-widest mt-0.5">
                  DBV TUDO • 2024 - 2026
                </span>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings?.();
                }}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 group"
                title="Ajustes"
                aria-label="Ajustes"
              >
                <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
              </button>
              <div className="flex flex-col items-center text-center mt-2 select-none text-slate-400 dark:text-slate-500 leading-tight">
                <span className="text-[9px] font-black tracking-wider text-slate-500 dark:text-slate-400">
                  v{APP_VERSION}
                </span>
                <span className="text-[7.5px] font-extrabold uppercase tracking-wider">
                  2024-2026
                </span>
              </div>
            </>
          )}
        </div>

        {/* MINIATURA DO PDF POR CIMA DO MENU LATERAL COM FUNDO ESFUMAÇADO */}
        {(activeSubView === 'PDF_VIEWER' || activeSubView === 'DESBRAVA_PLUS_PDF') && (
          <div 
            className="absolute inset-0 z-40 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-between p-4 lg:p-5 animate-fade-in text-white text-center cursor-default select-none shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do overlay da miniatura */}
            <div className="w-full flex items-center justify-between pt-1">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/10 border border-white/20 rounded-full shadow-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                  {isSidebarOpen ? 'Lendo Agora' : 'PDF'}
                </span>
              </div>
              {isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95"
                  title="Recolher Menu Lateral"
                >
                  <PanelLeftClose size={15} />
                </button>
              )}
            </div>

            {/* Centro: Imagem de Miniatura do PDF com Fundo Esfumaçado */}
            <div className="my-auto flex flex-col items-center justify-center w-full px-1">
              <div className={`relative transition-all duration-300 ${
                isSidebarOpen 
                  ? 'w-36 h-48 lg:w-44 lg:h-56' 
                  : 'w-12 h-16'
              } rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/30 dark:ring-white/20 bg-slate-900 flex items-center justify-center group`}>
                {selectedPdfThumbnail ? (
                  <img 
                    src={selectedPdfThumbnail} 
                    alt={pdfTitle || 'Capa do Documento'} 
                    className="w-full h-full object-cover shadow-inner group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-white/80">
                    <BookOpen size={isSidebarOpen ? 38 : 20} className="text-white/70 mb-2" />
                    {isSidebarOpen && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
                        Documento
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isSidebarOpen && (
                <div className="mt-4 px-1 max-w-full">
                  <h4 className="text-xs lg:text-sm font-black text-white uppercase tracking-tight line-clamp-2 drop-shadow-md">
                    {activeSubView === 'PDF_VIEWER' ? pdfTitle : selectedDesbravaPlusItem?.Nome}
                  </h4>
                  <p className="text-[9px] lg:text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">
                    Capa do Documento
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé da miniatura */}
            {!isSidebarOpen && (
              <div 
                onClick={() => setIsSidebarOpen(true)}
                className="cursor-pointer text-[9px] font-black text-white/80 uppercase hover:text-white py-1"
                title="Expandir menu"
              >
                Abrir
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (À DIREITA DO MENU NO PC) */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
        {activeSubView !== 'BIBLE_BOOKS' && activeSubView !== 'BIBLE_CHAPTERS' && activeSubView !== 'BIBLE_VERSES' && activeSubView !== 'BIBLE_MARKED_VERSES' && activeSubView !== 'BIBLE_MORE' && activeSubView !== 'BIBLE_DICTIONARY' && activeSubView !== 'BIBLE_NOTES' && activeSubView !== 'BIBLE_SETTINGS' && activeSubView !== 'BIBLE_DEVOTIONAL_VIEW' && (
          <div className={`px-3.5 sm:px-6 md:px-10 lg:px-12 ${activeSubView === 'MAIN' ? 'pt-2 sm:pt-3 md:pt-3.5 lg:pt-4 pb-1.5 sm:pb-2 md:pb-2' : 'pt-2 sm:pt-4 md:pt-6 lg:pt-7 pb-2 sm:pb-3 md:pb-4'} landscape:py-1.5 landscape:px-4 flex items-center justify-between z-10 bg-transparent transition-colors duration-500`}>
            <div className="w-11 h-11 md:w-12 md:h-12 landscape:w-9 landscape:h-9 flex items-center justify-center flex-shrink-0">
              {activeSubView === 'MAIN' ? (
                /* No PC, o logo já está em destaque na barra lateral esquerda */
                <button
                  type="button"
                  onClick={() => {
                    triggerLogoWobble();
                    onBack();
                  }}
                  onAnimationEnd={() => setIsLogoWobbling(false)}
                  title="Voltar ao Início"
                  aria-label="Voltar ao Início"
                  className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none md:hidden active:scale-90 transition-transform group animate-float-sm ${
                    isLogoWobbling ? 'animate-logo-wobble' : ''
                  }`}
                >
                  <div
                    className={`absolute inset-0.5 rounded-full app-logo-click-glow blur-md pointer-events-none transition-all duration-500 ${
                      isLogoWobbling ? 'opacity-100 scale-115' : 'opacity-0 scale-90 group-hover:opacity-60 group-hover:scale-105'
                    }`}
                  />
                  <img 
                    src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
                    alt="Logo DBV Tudo"
                    draggable={false}
                    className="relative w-full h-full object-contain drop-shadow-md select-none" 
                  />
                  <div className="app-logo-sheen-mask app-logo-sheen-mask-sm" aria-hidden="true" />
                </button>
              ) : (
              <button 
                onClick={() => {
                  if (activeSubView === 'CLASS_DETAILS') {
                    setActiveSubView('CLASSES');
                  } else if (activeSubView === 'SPECIALTY_DETAILS') {
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
                  } else if (activeSubView === 'BIBLE') {
                    setActiveSubView('MAIN');
                  } else if (activeSubView === 'SPECIALTIES_LIST') {
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
                    setActiveSubView(club === ClubType.ADVENTURER ? 'CULTURE' : 'HISTORY_LIST');
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
                    setActiveSubView(pdfReturnSubView);
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
                  } else if (activeSubView === 'VIDEO_ADMIN' || activeSubView === 'FORM_ADMIN' || activeSubView === 'LINKS_ADMIN' || activeSubView === 'ACHIEVEMENTS_ADMIN' || activeSubView === 'TRUNFOS_ADMIN' || activeSubView === 'FAIXA_ADMIN') {
                    setActiveSubView('BIBLE_ADMIN');
                  } else if (activeSubView === 'VIDEOS') {
                    setActiveSubView('MAIN');
                  } else if (activeSubView === 'VIDEO_PLAYER') {
                    setActiveSubView('VIDEOS');
                  } else if (activeSubView === 'TRUNFOS') {
                    setActiveSubView('MAIN');
                  } else if (activeSubView === 'FIELD_TRAINING') {
                    setActiveSubView('MAIN');
                  } else if (activeSubView === 'QUIZ') {
                    if (quizBackHandlerRef.current && quizBackHandlerRef.current()) {
                      return;
                    }
                    setActiveSubView('FIELD_TRAINING');
                  } else if (activeSubView === 'LIVE_EXAM') {
                    if (liveExamBackHandlerRef.current && liveExamBackHandlerRef.current()) {
                      return;
                    }
                    setActiveSubView('FIELD_TRAINING');
                  } else if (activeSubView === 'UNIT_CORNER') {
                    setActiveSubView('FIELD_TRAINING');
                  } else if (activeSubView === 'FIELD_MANUAL') {
                    setActiveSubView('FIELD_TRAINING');
                  } else if (activeSubView === 'ORDEM_UNIDA') {
                    setActiveSubView('FIELD_TRAINING');
                  } else if (activeSubView === 'VERSION_HISTORY') {
                    setActiveSubView('MAIN');
                  } else {
                    setActiveSubView('MAIN');
                  }
                }} 
                className="w-11 h-11 md:w-12 md:h-12 landscape:w-9 landscape:h-9 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-600 dark:text-slate-200 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700"
                title={activeSubView === 'PDF_VIEWER' || activeSubView === 'DESBRAVA_PLUS_PDF' ? "Fechar PDF" : "Voltar"}
                aria-label={activeSubView === 'PDF_VIEWER' || activeSubView === 'DESBRAVA_PLUS_PDF' ? "Fechar PDF" : "Voltar"}
              >
                {activeSubView === 'PDF_VIEWER' || activeSubView === 'DESBRAVA_PLUS_PDF' ? (
                  <X size={22} strokeWidth={2.5} className="landscape:w-4 landscape:h-4 text-slate-700 dark:text-slate-200" />
                ) : (
                  <ChevronLeft size={22} strokeWidth={2.5} className="landscape:w-4 landscape:h-4" />
                )}
              </button>
            )}
          </div>
          <div className="text-center min-w-0 flex-1 px-2">
            <h2 className="font-black text-slate-800 dark:text-white text-base sm:text-lg md:text-xl landscape:text-sm tracking-tight uppercase leading-none truncate">
              {activeSubView === 'PDF_VIEWER'
                ? (pdfTitle || 'Visualizador de Documento')
                : activeSubView === 'DESBRAVA_PLUS_PDF'
                ? (selectedDesbravaPlusItem?.Nome || 'Visualizador de Documento')
                : activeSubView === 'VERSION_HISTORY'
                ? 'Atualizações'
                : (isPathfinder ? 'Desbravadores' : 'Aventureiros')}
            </h2>
            <p className="text-[10px] sm:text-[11px] landscape:text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1.5 landscape:mt-0.5 truncate">
              {activeSubView === 'MAIN' ? 'Área de Gestão' : 
               activeSubView === 'CLASSES' ? (isPathfinder ? 'Classes Progressivas' : 'Classes Regulares') :
               activeSubView === 'CLASS_DETAILS' ? (isPathfinder ? 'Classes Progressivas' : 'Classes Regulares') :
               activeSubView === 'SPECIALTIES' ? 'Especialidades' :
               activeSubView === 'SPECIALTIES_LIST' ? (selectedCategory?.nome || 'Especialidades') :
               activeSubView === 'SPECIALTY_DETAILS' ? (selectedSpecialty?.area === 'Mestrados' || selectedSpecialty?.nome?.toLowerCase().includes('mestrado') ? 'Mestrados' : (selectedCategory?.nome || 'Especialidades')) :
               activeSubView === 'BIBLE' ? 'Bíblia Sagrada' :
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
               activeSubView === 'PDF_VIEWER' ? 'Visualizador de Documento' :
               activeSubView === 'DESBRAVA_PLUS' ? 'Desbrava +' :
               activeSubView === 'DESBRAVA_PLUS_DETAILS' ? selectedDesbravaPlusItem?.Nome :
               activeSubView === 'DESBRAVA_PLUS_PDF' ? 'Desbrava + • Material Digital' :
               activeSubView === 'BIBLE_ADMIN' ? 'Painel Administrativo' :
               activeSubView === 'ACHIEVEMENTS_ADMIN' ? 'Gestão de Conquistas' :
               activeSubView === 'TRUNFOS' ? 'Trunfos' :
               activeSubView === 'TRUNFOS_ADMIN' ? 'Gestão de Trunfos' :
               activeSubView === 'FAIXA_ADMIN' ? 'Gestão da Faixa' :
               activeSubView === 'BIBLE_ADMIN_ADD' ? 'Novo Devocional' :
               activeSubView === 'BIBLE_DEVOTIONAL_LIST' ? 'Agendados' :
               activeSubView === 'VIDEOS' ? 'Vídeos' :
               activeSubView === 'VIDEO_PLAYER' ? 'Assistir Vídeo' :
               activeSubView === 'VIDEO_ADMIN' ? 'Gestão de Vídeos' :
               activeSubView === 'FORM_ADMIN' ? 'Gestão de Formulários' :
               activeSubView === 'FIELD_TRAINING' ? 'Treinamento em Campo' :
               activeSubView === 'QUIZ' ? 'Quiz & Bom de Bíblia' :
               activeSubView === 'LIVE_EXAM' ? 'Prova Ao Vivo' :
               activeSubView === 'UNIT_CORNER' ? 'Cantinho da Unidade & Acampamento' :
               activeSubView === 'FIELD_MANUAL' ? 'Nós • Códigos • Primeiros Socorros' :
               activeSubView === 'ORDEM_UNIDA' ? 'Guia de Ordem Unida & Vozes de Comando (DSA)' :
               activeSubView === 'VERSION_HISTORY' ? `Versão v${APP_VERSION}` :
               activeSubView}
            </p>
          </div>
          <div className="w-11 h-11 md:w-12 md:h-12 landscape:w-9 landscape:h-9 flex items-center justify-center flex-shrink-0">
            {activeSubView === 'MAIN' && (
              <button onClick={onOpenProfile} className="w-11 h-11 md:w-12 md:h-12 landscape:w-9 landscape:h-9 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 overflow-hidden active:scale-90 transition-all md:hidden">
                {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User size={22} className="landscape:w-4 landscape:h-4" />}
              </button>
            )}
            {activeSubView === 'VERSION_HISTORY' && (
              <button
                type="button"
                onClick={handleManualCheckUpdate}
                disabled={isCheckingUpdate}
                className="w-11 h-11 md:w-12 md:h-12 landscape:w-9 landscape:h-9 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-60"
                title="Buscar Atualização"
                aria-label="Buscar Atualização"
              >
                <RefreshCw size={19} strokeWidth={2.5} className={`landscape:w-4 landscape:h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              </button>
            )}
            {(activeSubView === 'SPECIALTIES' || activeSubView === 'SPECIALTIES_LIST') && (
              <button 
                onClick={openSpecialtySearch}
                className="w-11 h-11 md:w-12 md:h-12 landscape:w-9 landscape:h-9 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-500 dark:text-slate-300 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800"
                title="Pesquisar Especialidades"
                aria-label="Pesquisar Especialidades"
              >
                <Search size={20} strokeWidth={2.5} className="landscape:w-4 landscape:h-4" />
              </button>
            )}
            {activeSubView === 'SPECIALTY_DETAILS' && selectedSpecialty && (
              <button 
                onClick={() => toggleSpecialty(selectedSpecialty.id.toString())}
                className={`w-11 h-11 md:w-12 md:h-12 landscape:w-9 landscape:h-9 rounded-2xl transition-all active:scale-90 flex items-center justify-center shadow-sm border ${
                  completedSpecialties.includes(selectedSpecialty.id.toString())
                    ? 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200/50 dark:border-red-900/50' 
                    : 'text-slate-400 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                }`}
                title={completedSpecialties.includes(selectedSpecialty.id.toString()) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-label="Favoritar Especialidade"
              >
                <Heart size={20} fill={completedSpecialties.includes(selectedSpecialty.id.toString()) ? "currentColor" : "none"} />
              </button>
            )}
          </div>
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ overflowAnchor: 'none' }}
        className={`flex-grow ${
          activeSubView === 'QUIZ'
            ? 'overflow-hidden px-2.5 sm:px-5 md:px-8 lg:px-10 py-1 md:py-2 flex flex-col h-full min-h-0'
            : activeSubView === 'DESBRAVA_PLUS_PDF' || activeSubView === 'PDF_VIEWER' 
            ? 'overflow-y-auto scrollbar-hide p-0 md:px-6 md:pb-6 lg:px-10 lg:pb-8 flex flex-col h-full min-h-0' 
            : 'overflow-y-auto scrollbar-hide px-3.5 sm:px-5 md:px-8 lg:px-10 py-1.5 md:py-2'
        }`}
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
        {activeSubView === 'MATERIALS' && renderMaterialsMenu()}
        {activeSubView === 'CAMPING' && renderCamping()}
        {activeSubView === 'FORMULARIOS' && renderFormularios()}
        {activeSubView === 'PDF_VIEWER' && renderPdfViewer()}
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
        {activeSubView === 'FAIXA_ADMIN' && renderFaixaAdmin()}
        {activeSubView === 'WEB_VIEWER' && renderWebViewer()}
        {activeSubView === 'FIELD_TRAINING' && renderFieldTraining()}
        {activeSubView === 'QUIZ' && (
          <ClubQuiz
            key={club}
            club={club}
            specialties={allSpecialtiesList}
            getImageUrl={getImageUrl}
            onBack={() => setActiveSubView('FIELD_TRAINING')}
            onOpenLiveExam={() => {
              setSelectedSpecialty(null);
              setActiveSubView('LIVE_EXAM');
            }}
            onRegisterBackHandler={(fn) => {
              quizBackHandlerRef.current = fn;
            }}
          />
        )}
        {activeSubView === 'LIVE_EXAM' && (
          <LiveSpecialtyExam
            key={club}
            club={club}
            specialties={allSpecialtiesList}
            preselectedSpecialty={selectedSpecialty}
            sidebarOverlayTarget={sidebarRef.current}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={setIsSidebarOpen}
            onActiveRoomChange={setHasActiveLiveExamRoom}
            currentUserEmail={userEmail || userProfile?.email || ''}
            currentUserName={userProfile?.nome || ''}
            currentUserRole={userProfile?.funçao || (userProfile as any)?.cargo || normalizedUserRole || ''}
            canHostLiveExam={canGenerateSpecialtyPptx}
            onBack={() => setActiveSubView('FIELD_TRAINING')}
            onRegisterBackHandler={(fn) => {
              liveExamBackHandlerRef.current = fn;
            }}
          />
        )}
        {activeSubView === 'UNIT_CORNER' && (
          <UnitCornerCamping
            key={club}
            club={club}
            onBack={() => setActiveSubView('FIELD_TRAINING')}
          />
        )}
        {activeSubView === 'FIELD_MANUAL' && (
          <FieldManualTools
            key={club}
            club={club}
            initialTab={fieldManualTab}
            onBack={() => setActiveSubView('FIELD_TRAINING')}
          />
        )}
        {activeSubView === 'ORDEM_UNIDA' && (
          <FieldManualTools
            key={club}
            club={club}
            initialTab="ORDEM_UNIDA"
            standaloneDrill={true}
            onBack={() => setActiveSubView('FIELD_TRAINING')}
          />
        )}
        {activeSubView === 'VERSION_HISTORY' && (
          <div className="max-w-5xl mx-auto space-y-4 pb-28 animate-fade-in">
            {updateCheckMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{updateCheckMessage}</span>
              </div>
            )}

            {/* Resumo Geral dos Dados das Atualizações */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Versão Atual
                </span>
                <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  v{APP_VERSION}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Publicação
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mt-1 block truncate">
                  {VERSION_HISTORY[0]?.date || APP_BUILD_DATE}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Versões Lançadas
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {VERSION_HISTORY.length}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Total de Melhorias
                </span>
                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {VERSION_HISTORY.reduce((acc, item) => acc + item.changes.length, 0)}
                </span>
              </div>
            </div>

            {/* Barra de Pesquisa de Versões e Botão de Atualizar no PC */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 bg-white dark:bg-slate-800/90 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/80 shadow-2xs flex items-center gap-2.5">
                <Search size={16} className="text-slate-400 ml-1 shrink-0" />
                <input
                  type="text"
                  value={versionSearchQuery}
                  onChange={(e) => setVersionSearchQuery(e.target.value)}
                  placeholder="Pesquisar por versão (ex: 3.0.65), data ou recurso..."
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-white outline-none placeholder:text-slate-400"
                />
                {versionSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setVersionSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleManualCheckUpdate}
                disabled={isCheckingUpdate}
                className="hidden sm:flex px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-70 cursor-pointer shrink-0"
              >
                <RefreshCw size={15} className={isCheckingUpdate ? 'animate-spin' : ''} />
                <span>{isCheckingUpdate ? 'Verificando...' : 'Buscar Atualização'}</span>
              </button>
            </div>

            {/* Lista Completa de Versões */}
            <div className="space-y-3.5">
              {VERSION_HISTORY.filter((rel) => {
                if (!versionSearchQuery.trim()) return true;
                const q = versionSearchQuery.toLowerCase();
                return (
                  rel.version.toLowerCase().includes(q) ||
                  rel.date.toLowerCase().includes(q) ||
                  rel.title.toLowerCase().includes(q) ||
                  rel.changes.some((c) => c.toLowerCase().includes(q))
                );
              }).map((rel, i) => (
                <div
                  key={rel.version}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    i === 0
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/40 shadow-sm'
                      : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm bg-indigo-600 text-white shadow-2xs">
                        v{rel.version}
                      </span>
                      {rel.tag && (
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            rel.tag === 'NOVO'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                          }`}
                        >
                          {rel.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      📅 {rel.date}
                    </span>
                  </div>

                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-2.5">
                    {rel.title}
                  </h3>

                  <ul className="space-y-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300">
                    {rel.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2
                          size={15}
                          className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5"
                        />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && activeSubView !== 'QUIZ' && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 active:scale-90 transition-all z-[60] animate-bounce-in"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}

      {/* Botões Flutuantes de Navegação de Capítulos no Rodapé */}
      {activeSubView === 'BIBLE_VERSES' && !isLoading && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-full px-2.5 py-1.5 shadow-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center space-x-2">
            <button 
              onClick={goToPreviousChapter}
              disabled={selectedBibleBook && selectedBibleChapter === 1 && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === 0}
              className={`px-3.5 py-2 rounded-full font-black uppercase tracking-wider text-[11px] flex items-center space-x-1.5 active:scale-90 transition-all ${
                selectedBibleBook && selectedBibleChapter === 1 && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-500'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title="Capítulo Anterior"
              aria-label="Capítulo Anterior"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
              <span>Anterior</span>
            </button>

            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 select-none whitespace-nowrap">
              Cap. {selectedBibleChapter}
            </span>

            <button 
              onClick={goToNextChapter}
              disabled={selectedBibleBook && selectedBibleChapter === selectedBibleBook.total_chapters && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === bibleBooks.length - 1}
              className={`px-4 py-2 rounded-full font-black uppercase tracking-wider text-[11px] flex items-center space-x-1.5 active:scale-90 transition-all shadow-md ${
                selectedBibleBook && selectedBibleChapter === selectedBibleBook.total_chapters && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === bibleBooks.length - 1
                  ? 'opacity-30 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
              title="Próximo Capítulo"
              aria-label="Próximo Capítulo"
            >
              <span>Próximo</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {activeSubView !== 'VERSION_HISTORY' && activeSubView !== 'DESBRAVA_PLUS_PDF' && activeSubView !== 'PDF_VIEWER' && activeSubView !== 'BIBLE' && activeSubView !== 'BIBLE_BOOKS' && activeSubView !== 'BIBLE_CHAPTERS' && activeSubView !== 'BIBLE_VERSES' && activeSubView !== 'BIBLE_MARKED_VERSES' && activeSubView !== 'BIBLE_MORE' && activeSubView !== 'BIBLE_DICTIONARY' && activeSubView !== 'BIBLE_NOTES' && activeSubView !== 'BIBLE_SETTINGS' && activeSubView !== 'BIBLE_DEVOTIONAL_VIEW' && (
        (() => {
          const isNewAreaWithHiddenFloatingMenu =
            activeSubView === 'FIELD_TRAINING' ||
            activeSubView === 'QUIZ' ||
            activeSubView === 'LIVE_EXAM' ||
            activeSubView === 'UNIT_CORNER' ||
            activeSubView === 'FIELD_MANUAL' ||
            activeSubView === 'ORDEM_UNIDA';

          if (isNewAreaWithHiddenFloatingMenu && !isFloatingMenuOpenInNewArea) {
            return (
              <div className="absolute bottom-1.5 left-0 right-0 flex justify-center z-50 pointer-events-none md:hidden">
                <button
                  type="button"
                  onClick={() => setIsFloatingMenuOpenInNewArea(true)}
                  className="pointer-events-auto w-7 h-7 rounded-full bg-white/75 dark:bg-slate-800/75 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  title="Ativar menu flutuante"
                  aria-label="Ativar menu flutuante"
                >
                  <ChevronUp size={15} strokeWidth={2.5} />
                </button>
              </div>
            );
          }

          return (
            <div className="absolute bottom-2 sm:bottom-3 landscape:bottom-1 left-0 right-0 px-8 landscape:px-4 flex flex-col items-center z-50 pointer-events-none md:hidden">
              {isNewAreaWithHiddenFloatingMenu && (
                <button
                  type="button"
                  onClick={() => setIsFloatingMenuOpenInNewArea(false)}
                  className="pointer-events-auto mb-1 w-7 h-7 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                  title="Ocultar menu flutuante"
                  aria-label="Ocultar menu flutuante"
                >
                  <ChevronDown size={15} strokeWidth={2.5} />
                </button>
              )}
              <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md h-16 landscape:h-11 w-full max-w-[320px] landscape:max-w-[270px] rounded-full shadow-2xl flex p-2 landscape:p-1.5 items-center border border-white dark:border-slate-700 space-x-2 pointer-events-auto">
                <button 
                  onClick={() => handleMinistryButtonClick(ClubType.PATHFINDER)} 
                  className={`relative overflow-hidden flex-1 h-full rounded-full text-[11px] landscape:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center group ${isPathfinder ? 'bg-[#dc371b] text-white shadow-lg' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  <div className={`absolute -left-1 -bottom-1.5 pointer-events-none select-none grayscale transition-transform duration-500 group-hover:scale-110 ${isPathfinder ? 'opacity-25' : 'opacity-15 dark:opacity-15'}`}>
                    <img 
                      src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png" 
                      alt="" 
                      className="w-11 h-11 landscape:w-8 landscape:h-8 object-contain"
                    />
                  </div>
                  <span className="relative z-10">DBV</span>
                </button>
                <button onClick={onBack} className="w-12 h-12 landscape:w-8 landscape:h-8 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 active:scale-90 transition-all">
                  <HomeIcon size={20} className="landscape:w-4 landscape:h-4" />
                </button>
                <button 
                  onClick={() => handleMinistryButtonClick(ClubType.ADVENTURER)} 
                  className={`relative overflow-hidden flex-1 h-full rounded-full text-[11px] landscape:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center group ${!isPathfinder ? 'bg-[#800000] text-white shadow-lg' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'}`}
                >
                  <div className={`absolute -right-1 -bottom-1.5 pointer-events-none select-none grayscale transition-transform duration-500 group-hover:scale-110 ${!isPathfinder ? 'opacity-25' : 'opacity-15 dark:opacity-15'}`}>
                    <img 
                      src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
                      alt="" 
                      className="w-11 h-11 landscape:w-8 landscape:h-8 object-contain"
                    />
                  </div>
                  <span className="relative z-10">AVT</span>
                </button>
              </div>
            </div>
          );
        })()
      )}

      {/* Modal de Detalhes do Trunfo: No PC abre sobre a área útil do app (md:absolute md:inset-0); no celular abre uma modal única (fixed inset-0) */}
      {selectedTrunfoModal && (
        <div
          className="fixed inset-0 md:absolute md:inset-0 z-[200] bg-slate-900/60 dark:bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in pointer-events-auto"
          onClick={() => {
            if (isTrunfoImageZoomed) {
              setIsTrunfoImageZoomed(false);
            } else {
              setSelectedTrunfoModal(null);
              setIsTrunfoImageZoomed(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-[32px] w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[86vh] md:max-h-[88%] overflow-hidden flex flex-col shadow-2xl border border-slate-200/80 dark:border-slate-700 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal do Trunfo */}
            <div className="flex-shrink-0 px-5 sm:px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                  <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                    {selectedTrunfoModal.ano ? `Trunfo • Ano ${selectedTrunfoModal.ano}` : 'Trunfo do Evento'}
                  </span>
                  <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">•</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                    {selectedTrunfoModal.club === 'ADVENTURER'
                      ? 'Aventureiros'
                      : selectedTrunfoModal.club === 'ALL'
                      ? 'Desbravadores & Aventureiros'
                      : 'Desbravadores'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                  {selectedTrunfoModal.titulo}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {selectedTrunfoModal.imagem && (
                  <button
                    type="button"
                    onClick={() => setIsTrunfoImageZoomed((prev) => !prev)}
                    className={`h-10 px-3 rounded-full flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer ${
                      isTrunfoImageZoomed
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/70 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/70'
                    }`}
                    title={isTrunfoImageZoomed ? 'Reduzir imagem' : 'Ampliar imagem do trunfo'}
                  >
                    {isTrunfoImageZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                    <span className="hidden sm:inline">{isTrunfoImageZoomed ? 'Reduzir' : 'Ampliar'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrunfoModal(null);
                    setIsTrunfoImageZoomed(false);
                  }}
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 cursor-pointer"
                  title="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo Rolável do Modal do Trunfo */}
            {isTrunfoImageZoomed && selectedTrunfoModal.imagem ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/80 dark:bg-slate-900/70 scrollbar-hide animate-fade-in">
                <div
                  onClick={() => setIsTrunfoImageZoomed(false)}
                  title="Clique para voltar aos detalhes"
                  className="w-full flex-1 min-h-[260px] sm:min-h-[340px] bg-white dark:bg-slate-800 rounded-[28px] p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700 shadow-inner flex items-center justify-center cursor-zoom-out"
                >
                  <img
                    src={getImageUrl(selectedTrunfoModal.imagem)}
                    alt={selectedTrunfoModal.titulo}
                    className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 max-w-full max-h-[56vh] object-contain drop-shadow-xl transition-transform duration-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrunfoImageZoomed(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <ZoomOut size={16} />
                  <span>Voltar aos Detalhes do Trunfo</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-hide">
                {/* Destaque da Imagem e Identificação do Trunfo */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-[26px] p-4 sm:p-5 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  {selectedTrunfoModal.imagem && (
                    <button
                      type="button"
                      onClick={() => setIsTrunfoImageZoomed(true)}
                      title="Ampliar imagem do trunfo"
                      className="relative group w-28 h-28 sm:w-32 sm:h-32 bg-white dark:bg-slate-800 rounded-2xl p-2.5 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0 overflow-hidden cursor-zoom-in hover:border-teal-500/60 transition-all active:scale-95"
                    >
                      <img
                        src={getImageUrl(selectedTrunfoModal.imagem)}
                        alt={selectedTrunfoModal.titulo}
                        className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-xl bg-slate-900/75 group-hover:bg-teal-600 text-white flex items-center justify-center shadow-md transition-colors">
                        <ZoomIn size={14} />
                      </span>
                    </button>
                  )}

                  <div className="flex-1 min-w-0 space-y-2.5">
                    <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-snug">
                      {selectedTrunfoModal.titulo}
                    </h2>

                    <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {selectedTrunfoModal.club === 'ADVENTURER'
                          ? 'Clube de Aventureiros'
                          : selectedTrunfoModal.club === 'ALL'
                          ? 'Desbravadores e Aventureiros'
                          : 'Clube de Desbravadores'}
                      </span>
                      {selectedTrunfoModal.ano && (
                        <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-teal-500/20">
                          Ano {selectedTrunfoModal.ano}
                        </span>
                      )}
                      {selectedTrunfoModal.imagem && (
                        <button
                          type="button"
                          onClick={() => setIsTrunfoImageZoomed(true)}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="Ampliar imagem do trunfo"
                        >
                          <ZoomIn size={13} />
                          <span>Ampliar Imagem</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* História / Texto Principal */}
                <div className="bg-slate-50 dark:bg-slate-900/70 rounded-[26px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/70 space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
                    <BookOpen size={16} className="text-teal-600 dark:text-teal-400 stroke-[2.5]" />
                    <span>HISTÓRIA DO EVENTO</span>
                  </div>
                  <div className="space-y-3.5 text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
                    {selectedTrunfoModal.historia ? (
                      selectedTrunfoModal.historia.split('\n\n').map((paragraph, idx) => {
                        const trimmed = paragraph.trim();
                        if (!trimmed) return null;

                        const match = trimmed.match(/^(Local|Participantes|Tema central|Atividades|Público|Edição|Data):\s*(.*)$/i);
                        if (match) {
                          return (
                            <p key={idx} className="leading-relaxed">
                              <strong className="font-black text-slate-900 dark:text-white tracking-wide">
                                {match[1]}:{' '}
                              </strong>
                              <span className="text-slate-700 dark:text-slate-200">{match[2]}</span>
                            </p>
                          );
                        }
                        return (
                          <p key={idx} className="leading-relaxed text-slate-700 dark:text-slate-200">
                            {trimmed}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-slate-400">Nenhuma história cadastrada para este trunfo.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fim da Área de Conteúdo Principal */}
      </div>

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
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-hide"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 250 && visibleSearchCount < filteredSearchSpecialties.length) {
                  setVisibleSearchCount(prev => Math.min(prev + 40, filteredSearchSpecialties.length));
                }
              }}
            >
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
                  {filteredSearchSpecialties.slice(0, visibleSearchCount).map((esp) => {
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
                              loading="lazy"
                              decoding="async"
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
                  {visibleSearchCount < filteredSearchSpecialties.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleSearchCount(prev => Math.min(prev + 40, filteredSearchSpecialties.length))}
                      className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                      Mostrar mais ({filteredSearchSpecialties.length - visibleSearchCount} restantes)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração e Geração da Apresentação PowerPoint Didática */}
      {renderPptxModal()}

      {/* Modal do Gerador de Provas das Especialidades */}
      {renderExamModal()}
    </div>
  );
};

export default ClubManagement;

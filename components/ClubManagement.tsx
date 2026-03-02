
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClubType, Category, Especialidade, ClubClass, DesbravaMais, BibleBook, BibleVerse, BibleDictionaryEntry, BibleNote, Devocional } from '../types';
import { fetchCategories, fetchEspecialidades, fetchClasses, fetchDesbravaMais, fetchBibleBooks, fetchBibleVerses, fetchBibleDictionary, fetchDevocionais, createDevocional, deleteDevocional } from '../services/supabaseService';
import { 
  Shield, Award, User, Layers, Sparkles, Home as HomeIcon, Search,
  ChevronRight, ChevronLeft, Info, Book, Settings, Zap, Music, Flag, Shirt, Globe, Key, FileText, Library, CreditCard, MapPin, Video, Folder, BookOpen, Heart, ArrowUp,
  Trash2, Plus, Save, Share2, Calendar
} from 'lucide-react';

const PROFILE_KEY = `dbv_tudo_global_user_profile`;

const ClubManagement: React.FC<{ 
  club: ClubType; 
  onBack: () => void; 
  onSwitchClub: (club: ClubType) => void; 
  onOpenProfile?: () => void; 
  onOpenAdvisor?: (prompt: string) => void;
  isGuest?: boolean; 
  initialSubView?: 'MAIN' | 'CULTURE' | 'LIBRARY' | 'MANAGEMENT' | 'CLASSES' | 'SPECIALTIES' | 'CLASS_DETAILS' | 'SPECIALTIES_LIST' | 'SPECIALTY_DETAILS' | 'DESBRAVA_PLUS' | 'DESBRAVA_PLUS_DETAILS' | 'DESBRAVA_PLUS_PDF' | 'BIBLE' | 'BIBLE_BOOKS' | 'BIBLE_CHAPTERS' | 'BIBLE_VERSES' | 'BIBLE_MARKED_VERSES' | 'BIBLE_MORE' | 'BIBLE_DICTIONARY' | 'BIBLE_NOTES' | 'BIBLE_SETTINGS' | 'BIBLE_ADMIN' | 'BIBLE_ADMIN_ADD' | 'BIBLE_DEVOTIONAL_LIST' | 'BIBLE_DEVOTIONAL_VIEW';
  onClearSubView?: () => void;
}> = ({ club, onBack, onSwitchClub, onOpenProfile, onOpenAdvisor, isGuest, initialSubView, onClearSubView }) => {
  const [activeSubView, setActiveSubView] = useState<'MAIN' | 'CULTURE' | 'LIBRARY' | 'MANAGEMENT' | 'CLASSES' | 'SPECIALTIES' | 'CLASS_DETAILS' | 'SPECIALTIES_LIST' | 'SPECIALTY_DETAILS' | 'DESBRAVA_PLUS' | 'DESBRAVA_PLUS_DETAILS' | 'DESBRAVA_PLUS_PDF' | 'BIBLE' | 'BIBLE_BOOKS' | 'BIBLE_CHAPTERS' | 'BIBLE_VERSES' | 'BIBLE_MARKED_VERSES' | 'BIBLE_MORE' | 'BIBLE_DICTIONARY' | 'BIBLE_NOTES' | 'BIBLE_SETTINGS' | 'BIBLE_ADMIN' | 'BIBLE_ADMIN_ADD' | 'BIBLE_DEVOTIONAL_LIST' | 'BIBLE_DEVOTIONAL_VIEW'>(initialSubView || 'MAIN');
  const [classes, setClasses] = useState<ClubClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClubClass | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [specialties, setSpecialties] = useState<Especialidade[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Especialidade | null>(null);
  const [desbravaPlusItems, setDesbravaPlusItems] = useState<DesbravaMais[]>([]);
  const [selectedDesbravaPlusItem, setSelectedDesbravaPlusItem] = useState<DesbravaMais | null>(null);
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [selectedBibleBook, setSelectedBibleBook] = useState<BibleBook | null>(null);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState<number | null>(null);
  const [bibleVerses, setBibleVerses] = useState<BibleVerse[]>([]);
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
  
  // Bible Settings State
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

  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [classRequirements, setClassRequirements] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastRead, setLastRead] = useState<{ book: BibleBook, chapter: number } | null>(() => {
    const saved = localStorage.getItem('dbv_tudo_bible_last_read');
    return saved ? JSON.parse(saved) : null;
  });
  
  const isPathfinder = club === ClubType.PATHFINDER;
  const themeColor = isPathfinder ? '#dc371b' : '#800000';
  const themeBgLight = isPathfinder ? 'bg-[#dc371b]/5' : 'bg-[#800000]/5';

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
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserAvatar(parsed.avatar || null);
        setUserEmail(parsed.email || null);
      } catch { }
    }
  }, []);

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
    if (activeSubView === 'CLASSES') {
      setIsLoading(true);
      fetchClasses(club).then(setClasses).finally(() => setIsLoading(false));
    } else if (activeSubView === 'SPECIALTIES') {
      setIsLoading(true);
      fetchCategories(club).then(setCategories).finally(() => setIsLoading(false));
    } else if (activeSubView === 'DESBRAVA_PLUS') {
      setIsLoading(true);
      fetchDesbravaMais().then(setDesbravaPlusItems).finally(() => setIsLoading(false));
    } else if (activeSubView === 'BIBLE_BOOKS') {
      setIsLoading(true);
      fetchBibleBooks().then(setBibleBooks).finally(() => setIsLoading(false));
    } else if (activeSubView === 'BIBLE_VERSES' && selectedBibleBook && selectedBibleChapter !== null) {
      setIsLoading(true);
      fetchBibleVerses(selectedBibleBook.book_name, selectedBibleChapter.toString())
        .then(setBibleVerses)
        .finally(() => setIsLoading(false));
    } else if (activeSubView === 'BIBLE_DICTIONARY') {
      setIsLoading(true);
      fetchBibleDictionary(dictionarySearch).then(setBibleDictionary).finally(() => setIsLoading(false));
    } else if (activeSubView.startsWith('BIBLE')) {
      setIsLoading(true);
      fetchDevocionais().then(setDevocionais).finally(() => setIsLoading(false));
    }
  }, [activeSubView, club, selectedBibleBook, selectedBibleChapter, dictionarySearch]);

  useEffect(() => {
    if (activeSubView === 'SPECIALTIES_LIST' && selectedCategory) {
      setIsLoading(true);
      // Filtra pelo nome (Mestrado) que é o que aparece no botão
      fetchEspecialidades(club, selectedCategory.nome).then(setSpecialties).finally(() => setIsLoading(false));
    }
  }, [activeSubView, club, selectedCategory]);

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
    <div className="animate-slide-in space-y-5 pt-4 pb-28">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-8 h-8 border-3 border-slate-100 border-t-slate-300 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {classes.map((cls) => (
            <button 
              key={cls.id} 
              onClick={() => handleClassClick(cls)}
              className="w-full bg-white border border-slate-100 rounded-[32px] flex flex-col p-6 relative shadow-sm active:scale-[0.98] transition-all overflow-hidden group"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5" 
                style={{ backgroundColor: getClassColor(cls) }}
              ></div>
              
              <div className="flex items-center space-x-5 pl-2">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  {cls.imagem ? (
                    <img src={cls.imagem} className="w-12 h-12 object-contain" alt={cls.titulo} />
                  ) : (
                    <Layers size={28} className="text-slate-200" />
                  )}
                </div>

                <div className="flex-grow text-left">
                  <h4 className="font-black text-[#1e293b] text-lg leading-tight tracking-tight uppercase">
                    {cls.titulo}
                  </h4>
                  {cls.subtitulo && (
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {cls.subtitulo}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderClassDetails = () => {
    if (!selectedClass) return null;
    const classColor = getClassColor(selectedClass);

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        {/* Header da Classe */}
        <div className="relative overflow-hidden rounded-[40px] p-8 shadow-xl" style={{ backgroundColor: classColor }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-6 p-4">
              {selectedClass.imagem ? (
                <img src={selectedClass.imagem} className="w-full h-full object-contain" alt={selectedClass.titulo} />
              ) : (
                <Layers size={40} style={{ color: classColor }} />
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
              <div className="w-6 h-6 border-2 border-slate-100 border-t-slate-300 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {classRequirements.map((req, idx) => {
                const [title, ...rest] = req.split(':');
                return (
                  <div key={idx} className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex items-start space-x-4 group transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-2.5 flex-shrink-0"></div>
                    <div className="flex-grow">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        {title}
                      </p>
                      <p className="text-[14px] font-bold text-slate-700 leading-snug">
                        {rest.join(':').trim()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botão de Ajuda da IA */}
        <button 
          onClick={() => onOpenAdvisor?.(`Como completar os requisitos da classe ${selectedClass.titulo} de ${isPathfinder ? 'Desbravadores' : 'Aventureiros'}?`)}
          className="w-full bg-slate-900 text-white p-6 rounded-[32px] shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Desbravinho</p>
              <h4 className="font-black text-sm uppercase tracking-tight">Como completar?</h4>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </button>
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
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => {
                setSelectedCategory(cat);
                setActiveSubView('SPECIALTIES_LIST');
              }}
              className="w-full bg-white border border-slate-100 rounded-[20px] p-5 flex items-center relative shadow-sm active:scale-[0.98] transition-all overflow-hidden group"
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
                <span className="text-[15px] font-black text-slate-800 uppercase tracking-tight text-left">
                  {cat.nome}
                </span>
              </div>
              
              <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderSpecialtiesList = () => (
    <div className="animate-slide-in space-y-5 pt-4 pb-28">
      <div className="px-2 flex items-center justify-end">
        <span className="text-[10px] font-black text-slate-300 uppercase">{specialties.length} Itens</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-100 border-t-slate-300 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {specialties.map((esp) => (
            <button 
              key={esp.id} 
              onClick={() => {
                setSelectedSpecialty(esp);
                setActiveSubView('SPECIALTY_DETAILS');
              }}
              className="w-full bg-white border border-slate-100 rounded-[24px] p-4 flex items-center space-x-4 shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-50">
                {esp.logo ? (
                  <img src={esp.logo} className="w-12 h-12 object-contain" alt={esp.nome} />
                ) : (
                  <Award size={24} className="text-slate-200" />
                )}
              </div>
              <div className="flex-grow text-left">
                <h4 className="font-black text-slate-700 text-[13px] uppercase tracking-tight leading-tight">
                  {esp.nome}
                </h4>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {esp.area}
                  </p>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                    {esp.codigo || `${esp.sigla}${String(esp.id).padStart(3, '0')}`}
                  </span>
                  {esp.nivel && (
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      • Nível {esp.nivel.toUpperCase().replace('NÍVEL', '').replace('NIVEL', '').trim()}
                    </span>
                  )}
                  {esp.ano && (
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      • {esp.ano}
                    </span>
                  )}
                  {esp.origem && (
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      • {esp.origem}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-200" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderSpecialtyDetails = () => {
    if (!selectedSpecialty) return null;

    return (
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-32 h-32 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6 shadow-inner border border-slate-50">
            {selectedSpecialty.logo ? (
              <img src={selectedSpecialty.logo} className="w-24 h-24 object-contain" alt={selectedSpecialty.nome} />
            ) : (
              <Award size={48} className="text-slate-200" />
            )}
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-tight mb-2">
            {selectedSpecialty.nome}
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            <div className="px-3 py-1 bg-slate-100 rounded-full">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {selectedSpecialty.area}
              </span>
            </div>
            <div className="px-3 py-1 bg-indigo-50 rounded-full">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                {selectedSpecialty.codigo || `${selectedSpecialty.sigla}${String(selectedSpecialty.id).padStart(3, '0')}`}
              </span>
            </div>
            {selectedSpecialty.nivel && (
              <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Nível {selectedSpecialty.nivel.toUpperCase().replace('NÍVEL', '').replace('NIVEL', '').trim()}
                </span>
              </div>
            )}
            {selectedSpecialty.ano && (
              <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedSpecialty.ano}
                </span>
              </div>
            )}
            {selectedSpecialty.origem && (
              <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedSpecialty.origem}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Requisitos</h4>
          </div>
          
          <div className="space-y-3">
            {selectedSpecialty.requisitos.length > 0 ? (
              selectedSpecialty.requisitos.map((req, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex items-start space-x-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 flex-shrink-0"></div>
                  <p className="text-[14px] font-bold text-slate-700 leading-snug">
                    {req.trim()}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white border border-slate-100 rounded-[24px] p-8 text-center">
                <p className="text-slate-400 font-bold text-sm">Nenhum requisito listado no momento.</p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => onOpenAdvisor?.(`Explique como completar a especialidade de ${selectedSpecialty.nome} de ${isPathfinder ? 'Desbravadores' : 'Aventureiros'}?`)}
          className="w-full bg-slate-900 text-white p-6 rounded-[32px] shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Desbravinho</p>
              <h4 className="font-black text-sm uppercase tracking-tight">Dicas de Estudo</h4>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  };
  const renderCultureMenu = () => (
    <div className="animate-slide-in space-y-4 pt-4 pb-28">
      {[
        { label: 'Ideais e Hino', icon: <Music size={24} />, color: 'bg-blue-500' },
        { label: 'História', icon: <Globe size={24} />, color: 'bg-amber-500' },
        { label: 'Uniformes', icon: <Shirt size={24} />, color: 'bg-emerald-500' },
        { label: 'Emblemas', icon: <Shield size={24} />, color: 'bg-indigo-500' }
      ].map((item, i) => (
        <button 
          key={i}
          className="w-full bg-white border border-slate-100 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="flex-grow text-left">
            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{item.label}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Explorar Conteúdo</p>
          </div>
          <ChevronRight size={20} className="text-slate-200" />
        </button>
      ))}
    </div>
  );

  const renderLibraryMenu = () => (
    <div className="animate-slide-in space-y-4 pt-4 pb-28">
      {[
        { label: 'Livros', icon: <Book size={24} />, color: 'bg-emerald-500' },
        { label: 'Manuais', icon: <FileText size={24} />, color: 'bg-blue-500' },
        { label: 'Materiais', icon: <Folder size={24} />, color: 'bg-purple-500' }
      ].map((item, i) => (
        <button 
          key={i}
          className="w-full bg-white border border-slate-100 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="flex-grow text-left">
            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{item.label}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Acessar Arquivos</p>
          </div>
          <ChevronRight size={20} className="text-slate-200" />
        </button>
      ))}
    </div>
  );

  const renderManagementMenu = () => (
    <div className="animate-slide-in space-y-4 pt-4 pb-28">
      {[
        { label: 'SGC', icon: <Key size={24} />, color: 'bg-slate-800' },
        { label: 'Cartão Virtual', icon: <CreditCard size={24} />, color: 'bg-blue-600' },
        { label: 'Clubes', icon: <MapPin size={24} />, color: 'bg-red-500' },
        { label: 'Unidade', icon: <Shield size={24} />, color: 'bg-emerald-600' }
      ].map((item, i) => (
        <button 
          key={i}
          className="w-full bg-white border border-slate-100 rounded-[28px] p-5 flex items-center space-x-5 shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="flex-grow text-left">
            <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{item.label}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sistema de Gestão</p>
          </div>
          <ChevronRight size={20} className="text-slate-200" />
        </button>
      ))}
    </div>
  );

  const renderDesbravaPlus = () => (
    <div className="animate-slide-in space-y-5 pt-4 pb-28">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-slate-100 border-t-slate-300 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {desbravaPlusItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => {
                setSelectedDesbravaPlusItem(item);
                // Se o conteúdo for um link, abre o PDF viewer diretamente
                if (item.Conteudo && (item.Conteudo.startsWith('http') || item.Conteudo.includes('.pdf'))) {
                  setActiveSubView('DESBRAVA_PLUS_PDF');
                } else {
                  setActiveSubView('DESBRAVA_PLUS_DETAILS');
                }
              }}
              className="w-full bg-white border border-slate-100 rounded-[32px] flex flex-col p-5 relative shadow-sm active:scale-[0.98] transition-all overflow-hidden group"
            >
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {item.Capa ? (
                    <img src={item.Capa} className="w-full h-full object-cover" alt={item.Nome} />
                  ) : (
                    <Sparkles size={32} className="text-slate-200" />
                  )}
                </div>

                <div className="flex-grow text-left">
                  <h4 className="font-black text-[#1e293b] text-lg leading-tight tracking-tight uppercase">
                    {item.Nome}
                  </h4>
                  {item.descricao && (
                    <p className="text-[11px] text-slate-400 font-bold mt-1 line-clamp-2">
                      {item.descricao}
                    </p>
                  )}
                </div>
                
                <ChevronRight size={20} className="text-slate-200 flex-shrink-0" />
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
      <div className="animate-slide-in space-y-6 pt-2 pb-28">
        <div className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100">
          <div className="h-56 w-full relative">
            {selectedDesbravaPlusItem.Capa ? (
              <img src={selectedDesbravaPlusItem.Capa} className="w-full h-full object-cover" alt={selectedDesbravaPlusItem.Nome} />
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
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Descrição</h4>
              <p className="text-slate-600 font-bold text-sm leading-relaxed">
                {selectedDesbravaPlusItem.descricao}
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full"></div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Conteúdo</h4>
              <div className="bg-slate-50 rounded-3xl p-6 text-slate-700 font-medium text-[15px] leading-relaxed whitespace-pre-wrap border border-slate-100">
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

        <button 
          onClick={() => onOpenAdvisor?.(`Me conte mais sobre ${selectedDesbravaPlusItem.Nome} do Desbrava +?`)}
          className="w-full bg-slate-900 text-white p-6 rounded-[32px] shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Desbravinho</p>
              <h4 className="font-black text-sm uppercase tracking-tight">Perguntar à IA</h4>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  };

  const renderDesbravaPlusPdf = () => {
    if (!selectedDesbravaPlusItem) return null;
    
    // Usa Conteudo como link se PDF não estiver presente ou se Conteudo for um link
    const pdfUrl = selectedDesbravaPlusItem.PDF || selectedDesbravaPlusItem.Conteudo;
    
    if (!pdfUrl || !pdfUrl.startsWith('http')) {
      return (
        <div className="animate-slide-in p-8 text-center">
          <p className="text-slate-400 font-bold">Link inválido ou não encontrado.</p>
          <button onClick={() => setActiveSubView('DESBRAVA_PLUS')} className="mt-4 text-indigo-600 font-black uppercase text-xs">Voltar</button>
        </div>
      );
    }

    return (
      <div className="animate-slide-in h-full flex flex-col">
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 flex-grow flex flex-col h-[calc(100vh-180px)]">
          <div className="p-4 border-bottom border-slate-50 flex items-center justify-end bg-slate-50/50">
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-indigo-100 shadow-sm active:scale-95 transition-all"
            >
              Abrir Externo
            </a>
          </div>
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
            className="w-full flex-grow border-none"
            title="PDF Viewer"
          ></iframe>
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
      <div className="animate-slide-in space-y-6 pt-6 pb-10">
        {/* Header Bíblia Sagrada */}
        <div className="bg-[#0f172a] rounded-[40px] p-8 shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          </div>

          {/* Botão Voltar Interno */}
          <button 
            onClick={() => setActiveSubView('MAIN')}
            className="absolute top-6 left-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-90 z-20"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1 relative z-10 mt-4">Bíblia Sagrada</h3>
          <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-8 relative z-10">Versão Almeida Revista e Corrigida</p>
          
          {/* Versículo do Dia */}
          <div className="bg-white rounded-[32px] p-6 text-left shadow-inner relative z-10 border border-white/10">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Versículo do Dia</h4>
              <button 
                onClick={handleShareVerse}
                className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"
              >
                <Share2 size={14} />
              </button>
            </div>
            <p className="text-slate-700 font-bold text-sm leading-relaxed mb-3 italic">
              "Ó terra, terra, terra! Ouve a palavra do SENHOR!"
            </p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-tight">Jeremias 22:29</p>
          </div>
        </div>

        {/* Menu de Ações da Bíblia */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Bíblia', icon: <Book size={24} />, color: 'text-blue-500', border: 'border-blue-200', bg: 'bg-blue-50', action: () => setActiveSubView('BIBLE_BOOKS') },
            { label: 'Devocional', icon: <Heart size={24} />, color: 'text-emerald-500', border: 'border-emerald-200', bg: 'bg-emerald-50', action: () => {
              setSelectedDevocional(null);
              setActiveSubView('BIBLE_DEVOTIONAL_VIEW');
            } },
            { label: 'Mais', icon: <Layers size={24} />, color: 'text-slate-400', border: 'border-slate-200', bg: 'bg-slate-50', action: () => setActiveSubView('BIBLE_MORE') }
          ].map((item, i) => (
            <button key={i} onClick={item.action} className="flex flex-col items-center space-y-3">
              <div className={`w-full aspect-square bg-white border-2 ${item.border} rounded-2xl flex items-center justify-center ${item.color} shadow-sm active:scale-90 transition-all`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tight text-center leading-tight ${item.color}`}>{item.label}</span>
            </button>
          ))}
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
              className="w-full bg-white border border-slate-100 rounded-[32px] p-6 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500"></div>
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                  <BookOpen size={28} />
                </div>
                <div className="text-left">
                  <h5 className="text-lg font-black text-slate-800 leading-tight">
                    {lastRead.book.book_name} {lastRead.chapter}
                  </h5>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Continuar lendo</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </button>
          ) : (
            <div className="bg-slate-50 rounded-[32px] border border-dashed border-slate-200 p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 mb-4 shadow-sm">
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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

        {/* Barra de Busca e Filtros */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Buscar livro..."
              value={bibleSearch}
              onChange={(e) => setBibleSearch(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-24 text-sm font-bold text-slate-700 focus:outline-none shadow-sm placeholder:text-slate-300"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all">
              Buscar
            </button>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={() => setSelectedTestament(selectedTestament === 'ANTIGO' ? 'TODOS' : 'ANTIGO')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center space-x-2 ${selectedTestament === 'ANTIGO' ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-blue-50 border-blue-100 text-blue-500'}`}
            >
              <Zap size={14} className="rotate-180" />
              <span>Antigo Testamento</span>
            </button>
            <button 
              onClick={() => setSelectedTestament(selectedTestament === 'NOVO' ? 'TODOS' : 'NOVO')}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center space-x-2 ${selectedTestament === 'NOVO' ? 'bg-blue-500 border-blue-500 text-white shadow-md' : 'bg-blue-50 border-blue-100 text-blue-500'}`}
            >
              <ChevronRight size={14} />
              <span>Novo Testamento</span>
            </button>
          </div>
        </div>

        {/* Lista de Livros */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              {selectedTestament === 'ANTIGO' ? '39 livros' : selectedTestament === 'NOVO' ? '27 livros' : `${filteredBooks.length} livros`}
            </h4>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
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
                  className="bg-white border border-slate-100 rounded-[24px] p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm">
                      {book.book_abbrev}
                    </div>
                    <div className="text-left">
                      <h5 className="font-black text-slate-800 uppercase tracking-tight">{book.book_name}</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{book.total_chapters} capítulos</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-200 group-hover:translate-x-1 transition-transform" />
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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
              className="bg-white border border-slate-100 rounded-2xl aspect-square flex items-center justify-center shadow-sm active:scale-90 transition-all group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
              <span className="font-black text-slate-700 text-lg">{chapter}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderBibleVerses = () => {
    if (!selectedBibleBook || selectedBibleChapter === null) return null;

    return (
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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
              <div className="w-8 h-8 border-3 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
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
                        ? 'bg-amber-50/80 border-amber-400 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <span className={`${bibleSettings.darkMode ? 'text-blue-400' : 'text-blue-500'} font-black text-[10px] pt-1 min-w-[20px]`}>{verse.verse_number}</span>
                    <p 
                      className={`${bibleSettings.darkMode ? 'text-slate-200' : 'text-slate-700'} font-bold leading-relaxed text-justify`}
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                <Heart size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhum versículo marcado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {markedVerses.map((verse) => (
                <div 
                  key={verse.id} 
                  className="bg-amber-50/80 border-l-4 border-amber-400 rounded-[24px] p-6 shadow-sm relative group"
                >
                  <button 
                    onClick={() => toggleMarkVerse(verse)}
                    className="absolute top-4 right-4 text-amber-400 hover:text-amber-600 transition-colors"
                  >
                    <Heart size={18} fill="currentColor" />
                  </button>
                  <div className="mb-3">
                    <span className={`${bibleSettings.darkMode ? 'text-blue-400' : 'text-blue-600'} font-black text-[10px] uppercase tracking-widest`}>
                      {verse.book_name} {verse.chapter}:{verse.verse_number}
                    </span>
                  </div>
                  <p 
                    className={`${bibleSettings.darkMode ? 'text-slate-200' : 'text-slate-700'} font-bold leading-relaxed text-justify`}
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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
            className="w-full bg-white border border-slate-100 rounded-[24px] py-4 pl-12 pr-6 text-sm font-bold text-slate-700 placeholder:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        </div>

        {/* Lista de Termos */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-3 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : bibleDictionary.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                <Search size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhum termo encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bibleDictionary.map((entry) => (
                <div 
                  key={entry.id} 
                  className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-blue-600 font-black text-lg uppercase tracking-tight">{entry.nome}</h4>
                    {entry.categoria && (
                      <span className="bg-blue-50 text-blue-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {entry.categoria}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 font-bold text-sm leading-relaxed text-justify mb-4">
                    {entry.texto}
                  </p>
                  {entry.referencia && (
                    <div className="flex items-center space-x-2 text-slate-400">
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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
            { label: 'Versículos Marcados', icon: <Heart size={24} />, color: 'text-amber-500', bg: 'bg-amber-50', action: () => setActiveSubView('BIBLE_MARKED_VERSES') },
            { label: 'Dicionário Bíblico', icon: <BookOpen size={24} />, color: 'text-blue-500', bg: 'bg-blue-50', action: () => setActiveSubView('BIBLE_DICTIONARY') },
            { label: 'Anotações', icon: <FileText size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-50', action: () => setActiveSubView('BIBLE_NOTES') },
            { label: 'Configurações', icon: <Settings size={24} />, color: 'text-slate-400', bg: 'bg-slate-50', action: () => setActiveSubView('BIBLE_SETTINGS') }
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={item.action}
              className="bg-white border border-slate-100 rounded-[28px] p-5 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-[13px] font-black text-slate-700 uppercase tracking-tight">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-200 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderBibleAdmin = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Banner with Back Button */}
        <div className="bg-[#1e293b] rounded-[32px] p-8 shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10 flex items-center space-x-5">
            <button 
              onClick={() => setActiveSubView('MAIN')}
              className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none">GESTÃO</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">CONTEÚDO DO CLUBE</p>
            </div>
          </div>
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Settings size={120} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => setActiveSubView('BIBLE_ADMIN_ADD')}
            className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center space-x-4 shadow-sm active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Plus size={28} />
            </div>
            <div className="text-left">
              <h4 className="font-black text-slate-800 uppercase tracking-tight">Adicionar Devocional</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Criar novo conteúdo diário</p>
            </div>
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Admin */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveSubView('BIBLE_ADMIN')}
              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 active:scale-90 transition-all"
            >
              <ChevronLeft size={20} strokeWidth={3} />
            </button>
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">NOVO</h3>
              <p className="text-lg font-black text-slate-800 uppercase tracking-tight mt-1">DEVOCIONAL</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveSubView('BIBLE_DEVOTIONAL_LIST')}
            className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm flex items-center space-x-2"
          >
            <Calendar size={14} />
            <span>AGENDADOS</span>
          </button>
        </div>

        {/* Formulário */}
        <div className="space-y-5 bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">TÍTULO DO DEVOCIONAL</label>
            <input 
              type="text" 
              value={newDevocional.titulo}
              onChange={(e) => setNewDevocional({...newDevocional, titulo: e.target.value})}
              placeholder="Devocional Diário"
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">LINK DO VÍDEO OU CONTEÚDO</label>
            <input 
              type="text" 
              value={newDevocional.link}
              onChange={(e) => setNewDevocional({...newDevocional, link: e.target.value})}
              placeholder="Link do YouTube ou site"
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">TEXTO DO DEVOCIONAL</label>
            <textarea 
              value={newDevocional.texto}
              onChange={(e) => setNewDevocional({...newDevocional, texto: e.target.value})}
              placeholder="Escreva a mensagem do dia..."
              rows={6}
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">AGENDAR PARA</label>
            <div className="relative">
              <input 
                type="datetime-local" 
                value={newDevocional.agendado_para}
                onChange={(e) => setNewDevocional({...newDevocional, agendado_para: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 px-6 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleSaveDevocional}
            className="w-full py-4 bg-[#dc371b] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-100 active:scale-95 transition-all mt-4"
          >
            SALVAR
          </button>
        </div>
      </div>
    );
  };

  const renderBibleDevotionalList = () => {
    return (
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        <div className="flex items-center space-x-4 mb-2">
          <button 
            onClick={() => setActiveSubView('BIBLE_ADMIN')}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">DEVOCIONAIS AGENDADOS</h3>
        </div>

        <div className="space-y-4">
          {devocionais.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
              <p className="text-slate-400 font-bold text-sm">Nenhum devocional agendado.</p>
            </div>
          ) : (
            devocionais.map((dev) => (
              <div key={dev.id} className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-black text-slate-800 text-base">{dev.titulo}</h5>
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
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">
                  {new Date(dev.agendado_para).toLocaleString('pt-BR')}
                </p>
                <p className="text-slate-600 text-sm font-bold line-clamp-2 mb-4">{dev.texto}</p>
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        <div className="flex items-center space-x-4 mb-2">
          <button 
            onClick={() => setActiveSubView('BIBLE')}
            className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">DEVOCIONAL</h3>
        </div>

        {/* Devocional do Dia ou Estado Vazio */}
        {currentDev ? (
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{currentDev.titulo}</h2>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                {new Date(currentDev.agendado_para).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full"></div>

            <p className="text-slate-600 font-bold text-base leading-relaxed text-justify whitespace-pre-wrap">
              {currentDev.texto}
            </p>

            {currentDev.link && (
              <a 
                href={currentDev.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                <Video size={18} />
                <span>Ver Conteúdo</span>
              </a>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
              <Heart size={32} />
            </div>
            <p className="text-slate-400 font-bold text-sm">Nenhum devocional disponível para hoje.</p>
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
                  className="bg-white border border-slate-100 rounded-[28px] p-5 flex items-center space-x-4 shadow-sm active:scale-[0.98] transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Heart size={20} />
                  </div>
                  <div className="flex-grow">
                    <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight line-clamp-1">{dev.titulo}</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {new Date(dev.agendado_para).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-200" />
                </button>
              ))}
            </div>
          </div>
        )}
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Aparência</h4>
              <p className="text-slate-400 text-[10px] font-bold">Modo Escuro</p>
              <p className="text-slate-300 text-[9px]">Alterna entre tema claro e escuro</p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={bibleSettings.darkMode}
                onChange={(e) => setBibleSettings({...bibleSettings, darkMode: e.target.checked})}
                className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[10px] font-bold text-slate-500">{bibleSettings.darkMode ? 'Ligado' : 'Desligado'}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tamanho da Fonte</p>
              <span className="text-[10px] font-black text-blue-600">{bibleSettings.fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" 
              max="32" 
              value={bibleSettings.fontSize}
              onChange={(e) => setBibleSettings({...bibleSettings, fontSize: parseInt(e.target.value)})}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-slate-300 text-[9px]">Ajuste a leitura da Bíblia</p>
          </div>
        </div>

        {/* Notificações */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Notificações</h4>
              <p className="text-slate-400 text-[10px] font-bold">Lembrete Diário</p>
              <p className="text-slate-300 text-[9px]">Receba o versículo do dia</p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={bibleSettings.dailyReminder}
                onChange={(e) => setBibleSettings({...bibleSettings, dailyReminder: e.target.checked})}
                className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[10px] font-bold text-slate-500">{bibleSettings.dailyReminder ? 'Ligado' : 'Desligado'}</span>
            </div>
          </div>
        </div>

        {/* Estilo de Capítulos */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-3">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Estilo de Capítulos</h4>
          <select 
            value={bibleSettings.chapterStyle}
            onChange={(e) => setBibleSettings({...bibleSettings, chapterStyle: e.target.value})}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="Capítulo N">Exibir "Capítulo N"</option>
            <option value="Apenas N">Exibir apenas o número</option>
          </select>
        </div>

        {/* Dados */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-3">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Dados</h4>
          <button 
            onClick={handleClearData}
            className="px-6 py-3 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-100 active:scale-95 transition-all"
          >
            Limpar Todos os Dados
          </button>
          <p className="text-slate-300 text-[9px]">Remove anotações, favoritos e progresso</p>
        </div>

        {/* Versão da Bíblia */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-3">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Versão da Bíblia</h4>
          <select 
            value={bibleSettings.bibleVersion}
            onChange={(e) => setBibleSettings({...bibleSettings, bibleVersion: e.target.value})}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
      <div className="animate-slide-in space-y-6 pt-6 pb-28">
        {/* Header Bíblia Sagrada Compacto */}
        <div className="bg-[#1e40af] rounded-[32px] p-6 shadow-lg text-white relative overflow-hidden">
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
        <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
              <input 
                type="text" 
                placeholder="Título" 
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Referência</label>
              <input 
                type="text" 
                placeholder="Ex: Hebreus 11:1" 
                value={newNote.reference}
                onChange={(e) => setNewNote({...newNote, reference: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
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
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
            />
          </div>

          <button 
            onClick={handleSaveNote}
            className="w-full py-4 bg-[#dc371b] text-white rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-100 active:scale-95 transition-all"
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
            className="w-full bg-white border border-slate-100 rounded-[24px] py-4 pl-12 pr-24 text-sm font-bold text-slate-700 placeholder:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
            Buscar
          </button>
        </div>

        {/* Lista de Anotações */}
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                <FileText size={32} />
              </div>
              <p className="text-slate-400 font-bold text-sm">Nenhuma anotação encontrada.</p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div 
                key={note.id} 
                className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-black text-slate-800 text-base leading-tight">{note.title}</h5>
                    <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mt-1">{note.reference}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-slate-600 font-bold text-sm leading-relaxed mb-4">
                  {note.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{note.date}</span>
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300">
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

  const renderDashboard = () => (
    <div className="space-y-8 animate-slide-up pt-2 pb-24">
      <div className="relative w-full px-1">
        <button 
          onClick={() => setActiveSubView('BIBLE')}
          className="w-full bg-white border border-slate-100 rounded-full py-4 px-6 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
              <Book size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-black text-slate-700 uppercase tracking-tight">Bíblia Sagrada</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Acessar</span>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
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
          className="w-full bg-white p-5 rounded-[36px] shadow-sm border border-slate-50 flex items-center justify-between active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 ${themeBgLight} rounded-[22px] flex items-center justify-center`}>
              <Award size={28} strokeWidth={2.5} style={{ color: themeColor }} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Especialidades</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Manual e Instruções</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-200" />
        </button>
      </div>

      <div className="pt-4 flex flex-col items-center">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-7">Explorar Categorias</h3>
        <div className="grid grid-cols-3 gap-5 w-full px-2 mb-8">
          {[
            { label: 'Cultura', icon: <Info size={28} />, bg: 'bg-indigo-500', view: 'CULTURE' },
            { label: 'Biblioteca', icon: <Book size={28} />, bg: 'bg-emerald-500', view: 'LIBRARY' },
            { label: 'Gestão', icon: <Settings size={28} />, bg: 'bg-red-500', view: 'MANAGEMENT' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center space-y-3">
              <button onClick={() => setActiveSubView(item.view as any)} className={`w-full aspect-square ${item.bg} rounded-[30px] flex items-center justify-center text-white shadow-lg active:scale-90 transition-all`}>
                {item.icon}
              </button>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Botão Desbrava + (POSICIONADO ABAIXO DAS CATEGORIAS) */}
        {isPathfinder && (
          <button 
            onClick={() => setActiveSubView('DESBRAVA_PLUS')}
            className="w-full max-w-[180px] bg-indigo-600 h-11 rounded-full shadow-lg shadow-indigo-100 flex items-center justify-center text-white active:scale-[0.98] transition-all px-6 mt-4"
          >
            <div className="flex items-center space-x-2">
              <Sparkles size={14} strokeWidth={2.5} />
              <span className="font-black text-[11px] uppercase tracking-[0.15em]">Desbrava +</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-slide-in overflow-hidden relative">
      {activeSubView !== 'BIBLE' && activeSubView !== 'BIBLE_BOOKS' && activeSubView !== 'BIBLE_CHAPTERS' && activeSubView !== 'BIBLE_VERSES' && activeSubView !== 'BIBLE_MARKED_VERSES' && activeSubView !== 'BIBLE_MORE' && activeSubView !== 'BIBLE_DICTIONARY' && activeSubView !== 'BIBLE_NOTES' && activeSubView !== 'BIBLE_SETTINGS' && activeSubView !== 'BIBLE_ADMIN' && activeSubView !== 'BIBLE_ADMIN_ADD' && activeSubView !== 'BIBLE_DEVOTIONAL_LIST' && activeSubView !== 'BIBLE_DEVOTIONAL_VIEW' && (
        <div className="px-8 pt-12 pb-6 flex items-center justify-between z-10 bg-[#F8FAFC]">
          <div className="w-14 h-14 flex items-center justify-center">
            {activeSubView === 'MAIN' ? (
              <img src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" className="w-full h-full object-contain" />
            ) : (
              <button 
                onClick={() => {
                  if (activeSubView === 'CLASS_DETAILS') {
                    setActiveSubView('CLASSES');
                  } else if (activeSubView === 'SPECIALTY_DETAILS') {
                    setActiveSubView('SPECIALTIES_LIST');
                  } else if (activeSubView === 'SPECIALTIES_LIST') {
                    setActiveSubView('SPECIALTIES');
                  } else if (activeSubView === 'DESBRAVA_PLUS_DETAILS') {
                    setActiveSubView('DESBRAVA_PLUS');
                  } else if (activeSubView === 'DESBRAVA_PLUS_PDF') {
                    setActiveSubView('DESBRAVA_PLUS');
                  } else if (activeSubView === 'BIBLE_BOOKS') {
                    setActiveSubView('BIBLE');
                  } else if (activeSubView === 'BIBLE_CHAPTERS') {
                    setActiveSubView('BIBLE_BOOKS');
                  } else if (activeSubView === 'BIBLE_VERSES') {
                    setActiveSubView('BIBLE_CHAPTERS');
                  } else if (activeSubView === 'BIBLE_MORE') {
                    setActiveSubView('BIBLE');
                  } else if (activeSubView === 'BIBLE_MARKED_VERSES') {
                    setActiveSubView('BIBLE_MORE');
                  } else if (activeSubView === 'BIBLE_DICTIONARY') {
                    setActiveSubView('BIBLE_MORE');
                  } else if (activeSubView === 'BIBLE_NOTES') {
                    setActiveSubView('BIBLE_MORE');
                  } else if (activeSubView === 'BIBLE_SETTINGS') {
                    setActiveSubView('BIBLE_MORE');
                  } else if (activeSubView === 'BIBLE_ADMIN') {
                    setActiveSubView('MAIN');
                  } else if (activeSubView === 'BIBLE_ADMIN_ADD') {
                    setActiveSubView('BIBLE_ADMIN');
                  } else if (activeSubView === 'BIBLE_DEVOTIONAL_LIST') {
                    setActiveSubView('BIBLE_ADMIN');
                  } else if (activeSubView === 'BIBLE_DEVOTIONAL_VIEW') {
                    setActiveSubView(isAdmin ? 'BIBLE_DEVOTIONAL_LIST' : 'BIBLE');
                  } else {
                    setActiveSubView('MAIN');
                  }
                }} 
                className="w-12 h-12 bg-white rounded-2xl shadow-sm text-slate-400 active:scale-90 transition-all border border-slate-100 flex items-center justify-center"
              >
                <ChevronLeft size={24} strokeWidth={3} />
              </button>
            )}
          </div>
          <div className="text-center">
            <h2 className="font-black text-slate-800 text-lg tracking-tight uppercase leading-none">
              {isPathfinder ? 'Desbravadores' : 'Aventureiros'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
              {activeSubView === 'MAIN' ? 'Área de Gestão' : 
               activeSubView === 'CLASSES' ? 'Classes Progressivas' :
               activeSubView === 'CLASS_DETAILS' ? selectedClass?.titulo :
               activeSubView === 'SPECIALTIES' ? 'Especialidades' :
               activeSubView === 'SPECIALTIES_LIST' ? selectedCategory?.nome :
               activeSubView === 'SPECIALTY_DETAILS' ? selectedSpecialty?.nome :
               activeSubView === 'CULTURE' ? 'Cultura e Tradição' :
               activeSubView === 'LIBRARY' ? 'Biblioteca Digital' :
               activeSubView === 'MANAGEMENT' ? 'Gestão Administrativa' :
               activeSubView === 'DESBRAVA_PLUS' ? 'Desbrava +' :
               activeSubView === 'DESBRAVA_PLUS_DETAILS' ? selectedDesbravaPlusItem?.Nome :
               activeSubView === 'DESBRAVA_PLUS_PDF' ? selectedDesbravaPlusItem?.Nome :
               activeSubView === 'BIBLE' ? 'Bíblia Sagrada' :
               activeSubView === 'BIBLE_BOOKS' ? 'Livros da Bíblia' :
               activeSubView === 'BIBLE_CHAPTERS' ? `Capítulos - ${selectedBibleBook?.book_name}` :
               activeSubView === 'BIBLE_VERSES' ? `${selectedBibleBook?.book_name} ${selectedBibleChapter}` :
               activeSubView === 'BIBLE_MORE' ? 'Mais Opções' :
               activeSubView === 'BIBLE_MARKED_VERSES' ? 'Versículos Marcados' :
               activeSubView === 'BIBLE_DICTIONARY' ? 'Dicionário Bíblico' :
               activeSubView === 'BIBLE_NOTES' ? 'Anotações' :
               activeSubView === 'BIBLE_SETTINGS' ? 'Configurações' :
               activeSubView === 'BIBLE_ADMIN' ? 'Painel Administrativo' :
               activeSubView === 'BIBLE_ADMIN_ADD' ? 'Novo Devocional' :
               activeSubView === 'BIBLE_DEVOTIONAL_LIST' ? 'Agendados' :
               activeSubView === 'BIBLE_DEVOTIONAL_VIEW' ? 'Devocional' :
               activeSubView}
            </p>
          </div>
          <div className="w-14 h-14 flex items-center justify-center">
            {activeSubView !== 'DESBRAVA_PLUS_PDF' && (
              <button onClick={onOpenProfile} className="w-14 h-14 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden active:scale-90 transition-all">
                {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User size={24} />}
              </button>
            )}
          </div>
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-grow overflow-y-auto scrollbar-hide ${activeSubView === 'DESBRAVA_PLUS_PDF' ? 'p-2' : activeSubView === 'BIBLE' ? 'p-4' : 'p-7'}`}
      >
        {activeSubView === 'MAIN' && renderDashboard()}
        {activeSubView === 'CLASSES' && renderClassesMenu()}
        {activeSubView === 'CLASS_DETAILS' && renderClassDetails()}
        {activeSubView === 'SPECIALTIES' && renderSpecialtiesCategories()}
        {activeSubView === 'SPECIALTIES_LIST' && renderSpecialtiesList()}
        {activeSubView === 'SPECIALTY_DETAILS' && renderSpecialtyDetails()}
        {activeSubView === 'CULTURE' && renderCultureMenu()}
        {activeSubView === 'LIBRARY' && renderLibraryMenu()}
        {activeSubView === 'MANAGEMENT' && renderManagementMenu()}
        {activeSubView === 'DESBRAVA_PLUS' && renderDesbravaPlus()}
        {activeSubView === 'DESBRAVA_PLUS_DETAILS' && renderDesbravaPlusDetails()}
        {activeSubView === 'DESBRAVA_PLUS_PDF' && renderDesbravaPlusPdf()}
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
      </div>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 w-12 h-12 bg-white rounded-full shadow-2xl border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all z-[60] animate-bounce-in"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}

      {/* Barra de Navegação Fixa da Bíblia */}
      {activeSubView === 'BIBLE_VERSES' && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-slide-up">
          <div className="flex items-center space-x-4">
            <button 
              onClick={goToPreviousChapter}
              className={`flex-1 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all ${
                selectedBibleBook && selectedBibleChapter === 1 && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === 0
                  ? 'bg-slate-50 text-slate-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <ChevronLeft size={18} />
              <span>Anterior</span>
            </button>
            <button 
              onClick={goToNextChapter}
              className={`flex-1 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-all ${
                selectedBibleBook && selectedBibleChapter === selectedBibleBook.total_chapters && bibleBooks.findIndex(b => b.book_name === selectedBibleBook.book_name) === bibleBooks.length - 1
                  ? 'bg-slate-50 text-slate-300 shadow-none'
                  : 'bg-blue-600 text-white shadow-blue-200'
              }`}
            >
              <span>Próximo</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {activeSubView !== 'DESBRAVA_PLUS_PDF' && activeSubView !== 'BIBLE' && activeSubView !== 'BIBLE_BOOKS' && activeSubView !== 'BIBLE_CHAPTERS' && activeSubView !== 'BIBLE_VERSES' && activeSubView !== 'BIBLE_MARKED_VERSES' && activeSubView !== 'BIBLE_MORE' && activeSubView !== 'BIBLE_DICTIONARY' && activeSubView !== 'BIBLE_NOTES' && activeSubView !== 'BIBLE_SETTINGS' && activeSubView !== 'BIBLE_ADMIN' && activeSubView !== 'BIBLE_ADMIN_ADD' && activeSubView !== 'BIBLE_DEVOTIONAL_LIST' && activeSubView !== 'BIBLE_DEVOTIONAL_VIEW' && (
        <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-center z-50 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md h-16 w-full max-w-[320px] rounded-full shadow-2xl flex p-2 items-center border border-white space-x-2 pointer-events-auto">
            <button 
              onClick={() => onSwitchClub(ClubType.PATHFINDER)} 
              className={`flex-1 h-full rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${isPathfinder ? 'bg-[#dc371b] text-white shadow-lg' : 'text-slate-300'}`}
            >
              DBV
            </button>
            <button onClick={onBack} className="w-12 h-12 flex-shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
              <HomeIcon size={20} />
            </button>
            <button 
              onClick={() => onSwitchClub(ClubType.ADVENTURER)} 
              className={`flex-1 h-full rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${!isPathfinder ? 'bg-[#800000] text-white shadow-lg' : 'text-slate-300'}`}
            >
              AVT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubManagement;

'use client';

import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  fetchViaCep,
  saveUserProfile,
  getSavedChurches,
  registerNewChurch,
  ChurchRecord,
  calculateDistanceKm,
  reverseGeocodeGps,
  searchLiveOsmChurches,
  searchAllNearbyEvangelicalChurches,
  categorizeChurch
} from '@/data/db';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Church,
  Shield,
  Camera,
  CheckCircle2,
  Sparkles,
  Search,
  Upload,
  ExternalLink,
  Navigation,
  Compass,
  PlusCircle,
  Building2,
  Check,
  LocateFixed,
  Radio
} from 'lucide-react';

import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import { AvatarState } from '@/data/avatarConfig';
import { getSupabase } from '@/lib/supabase';

interface Props {
  onRegistered: (profile: UserProfile) => void;
  onClose?: () => void;
  initialProfile?: UserProfile | null;
  avatar?: AvatarState;
  onOpenAvatarCustomizer?: () => void;
}

export default function RegistrationModal({
  onRegistered,
  onClose,
  initialProfile,
  avatar,
  onOpenAvatarCustomizer
}: Props) {
  const [name, setName] = useState(initialProfile?.name || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [gender, setGender] = useState<'male' | 'female'>(initialProfile?.gender || 'male');
  const [birthDate, setBirthDate] = useState(initialProfile?.birthDate || '1985-06-20');
  const [photoUrl, setPhotoUrl] = useState(
    initialProfile?.photoUrl || (gender === 'male' ? '/avatar_masculino.jpg' : '/avatar_feminino.jpg')
  );

  // Endereço / ViaCEP
  const [cep, setCep] = useState(initialProfile?.cep || '');
  const [street, setStreet] = useState(initialProfile?.street || '');
  const [neighborhood, setNeighborhood] = useState(initialProfile?.neighborhood || '');
  const [city, setCity] = useState(initialProfile?.city || '');
  const [state, setState] = useState(initialProfile?.state || '');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepMessage, setCepMessage] = useState('');

  // Congregação e Ministério - O Usuário Escreve Livremente a sua Congregação
  const [churches, setChurches] = useState<ChurchRecord[]>([]);
  const [churchInput, setChurchInput] = useState(
    initialProfile?.churchName || 'Assembleia de Deus Ministério Santo André'
  );
  const [isChurchDropdownOpen, setIsChurchDropdownOpen] = useState(false);
  const [selectedChurchObj, setSelectedChurchObj] = useState<ChurchRecord | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [denominationCategory, setDenominationCategory] = useState<string>('TODAS');
  const [showAllChurchesDrawer, setShowAllChurchesDrawer] = useState<boolean>(false);

  // Geolocalização Real por GPS / Coordenadas
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState('');
  const [isSearchingLiveChurches, setIsSearchingLiveChurches] = useState(false);
  const [mappedCount, setMappedCount] = useState<number>(0);

  const [ministry, setMinistry] = useState(initialProfile?.ministry || 'Membro em Comunhão');

  // Modo de Cadastro de Nova Congregação
  const [isRegisteringNewChurch, setIsRegisteringNewChurch] = useState(false);
  const [newChurchLeader, setNewChurchLeader] = useState('');
  const [newChurchAddress, setNewChurchAddress] = useState('');
  const [newChurchSuccess, setNewChurchSuccess] = useState('');

  // Busca abrangente de todas as igrejas evangélicas por geolocalização e raio geográfico
  const triggerLiveChurchSearch = async (
    cCity: string,
    cState: string,
    cLat?: number,
    cLng?: number,
    customTerm?: string
  ) => {
    setIsSearchingLiveChurches(true);
    const liveResults = await searchAllNearbyEvangelicalChurches(cCity, cState, cLat, cLng, customTerm);
    setIsSearchingLiveChurches(false);

    if (liveResults.length > 0) {
      setMappedCount(liveResults.length);
      setChurches((prev) => {
        const combined = [...prev];
        liveResults.forEach((lr) => {
          const idx = combined.findIndex((c) => c.name.toLowerCase() === lr.name.toLowerCase());
          if (idx === -1) {
            combined.push(lr);
          } else {
            combined[idx] = { ...combined[idx], ...lr };
          }
        });
        return combined;
      });
    }
  };

  // Carregar igrejas salvas e sincronizar dados do perfil (caso esteja editando)
  useEffect(() => {
    const list = getSavedChurches();
    setChurches(list);
    if (initialProfile) {
      if (initialProfile.name) setName(initialProfile.name);
      if (initialProfile.email) setEmail(initialProfile.email);
      if (initialProfile.gender) setGender(initialProfile.gender);
      if (initialProfile.birthDate) setBirthDate(initialProfile.birthDate);
      if (initialProfile.photoUrl) setPhotoUrl(initialProfile.photoUrl);
      if (initialProfile.cep) setCep(initialProfile.cep);
      if (initialProfile.street) setStreet(initialProfile.street);
      if (initialProfile.neighborhood) setNeighborhood(initialProfile.neighborhood);
      if (initialProfile.city) setCity(initialProfile.city);
      if (initialProfile.state) setState(initialProfile.state);
      if (initialProfile.churchName) {
        setChurchInput(initialProfile.churchName);
        const found = list.find((c) => c.name.toLowerCase() === initialProfile.churchName.toLowerCase());
        if (found) setSelectedChurchObj(found);
      }
      if (initialProfile.ministry) setMinistry(initialProfile.ministry);
    }
    const initialCity = initialProfile?.city || 'Santo André';
    const initialState = initialProfile?.state || 'SP';
    triggerLiveChurchSearch(initialCity, initialState, -23.6595, -46.5298);
  }, [initialProfile]);

  // Ativação do GPS do Dispositivo (Geolocalização Nativa do Navegador/Celular)
  const handleRequestGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocalização não é suportada ou permitida neste dispositivo.');
      return;
    }

    setIsLocatingGps(true);
    setGpsStatusMessage('Acessando sinal de GPS do dispositivo...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });

        // Converte coordenadas em endereço real (Rua, Bairro, Cidade, Estado, CEP)
        const geoInfo = await reverseGeocodeGps(lat, lng);
        setIsLocatingGps(false);

        const detectedCity = geoInfo.city || 'Santo André';
        const detectedState = geoInfo.state || 'SP';

        setCity(detectedCity);
        setState(detectedState);
        if (geoInfo.neighborhood) setNeighborhood(geoInfo.neighborhood);
        if (geoInfo.street) setStreet(geoInfo.street);
        if (geoInfo.cep && !cep) setCep(geoInfo.cep);

        setGpsStatusMessage(`✓ GPS Fixado: ${geoInfo.neighborhood || geoInfo.street || 'Região'}, ${detectedCity}-${detectedState}`);

        // Mapeia todas as igrejas evangélicas nas proximidades exatas do GPS
        triggerLiveChurchSearch(detectedCity, detectedState, lat, lng);
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsStatusMessage('GPS indisponível ou permissão não concedida.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Cálculo preciso da Idade sem distorção de fuso horário UTC
  const calculateAge = (bDate: string): number | null => {
    if (!bDate) return null;
    const parts = bDate.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day) || year < 1900 || year > new Date().getFullYear()) {
      return null;
    }

    const today = new Date();
    let a = today.getFullYear() - year;
    const m = today.getMonth() - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) a--;
    return a >= 0 && a <= 130 ? a : null;
  };
  const calculatedAge = calculateAge(birthDate);

  // Busca CEP via ViaCEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setCep(rawVal);
    const clean = rawVal.replace(/\D/g, '');

    if (clean.length === 8) {
      setIsLoadingCep(true);
      setCepMessage('Consultando ViaCEP e mapeando região...');
      const res = await fetchViaCep(clean);
      setIsLoadingCep(false);

      if (res.error) {
        setCepMessage('CEP não localizado.');
      } else {
        setStreet(res.street);
        setNeighborhood(res.neighborhood);
        setCity(res.city);
        setState(res.state);
        setCepMessage(`✓ Localizado: ${res.neighborhood || res.street}, ${res.city} - ${res.state}`);

        // Atualiza endereço sugerido para nova congregação se estiver aberto
        if (!newChurchAddress && (res.street || res.neighborhood)) {
          setNewChurchAddress(`${res.street ? res.street + ', ' : ''}${res.neighborhood}`);
        }

        // Tenta selecionar automaticamente uma igreja da mesma cidade
        const currentChurches = getSavedChurches();
        const nearby = currentChurches.find(
          (c) => c.city.toLowerCase() === res.city.toLowerCase() || c.state.toUpperCase() === res.state.toUpperCase()
        );
        if (nearby) {
          setChurchInput(nearby.name);
          setSelectedChurchObj(nearby);
        }
      }
    } else {
      setCepMessage('');
    }
  };

  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  // Escuta retorno ou sessão ativa do Google Auth (Supabase)
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const meta = user.user_metadata || {};
        const googleName = meta.full_name || meta.name || user.email?.split('@')[0] || '';
        const googleEmail = user.email || '';
        const googleAvatar = meta.avatar_url || meta.picture || '';

        if (googleName) setName((prev) => prev || googleName);
        if (googleEmail) setEmail((prev) => prev || googleEmail);
        if (googleAvatar) setPhotoUrl((prev) => (prev.startsWith('/avatar') ? googleAvatar : prev));
      }
    });

    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user;
        const meta = user.user_metadata || {};
        const googleName = meta.full_name || meta.name || user.email?.split('@')[0] || '';
        const googleEmail = user.email || '';
        const googleAvatar = meta.avatar_url || meta.picture || '';

        if (googleName) setName((prev) => prev || googleName);
        if (googleEmail) setEmail((prev) => prev || googleEmail);
        if (googleAvatar) setPhotoUrl((prev) => (prev.startsWith('/avatar') ? googleAvatar : prev));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Autenticação Real com o Google via Supabase OAuth
  const handleGoogleAuth = async () => {
    const sb = getSupabase();
    if (!sb) {
      alert('Configuração do Supabase pendente. Adicione as chaves NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no painel.');
      return;
    }

    try {
      setIsLoggingInGoogle(true);
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectOrigin ? `${redirectOrigin}/` : undefined
        }
      });

      if (error) {
        alert(`Erro na autenticação com o Google: ${error.message}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com o Google: ${err?.message || String(err)}`);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  // Upload de Foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Salvar Nova Congregação digitada pelo usuário
  const handleSaveCustomChurch = (customName?: string) => {
    const targetName = (customName || churchInput).trim();
    if (!targetName) {
      alert('Por favor, informe o nome da nova Congregação.');
      return;
    }

    const created: ChurchRecord = {
      id: `church_${Date.now()}`,
      name: targetName,
      city: city || 'São Paulo',
      state: state || 'SP',
      pastorLeader: newChurchLeader.trim() || (ministry.includes('Pastor') ? name : 'Pr. Responsável Local'),
      address: newChurchAddress.trim() || `${street ? street + ', ' : ''}${neighborhood || 'Centro'}`,
      ministriesCount: { pastores: 1, presbiteros: 3, diaconos: 5, diaconisas: 4, louvor: 8, membros: 60 }
    };

    registerNewChurch(created);
    const updated = getSavedChurches();
    setChurches(updated);
    setChurchInput(created.name);
    setSelectedChurchObj(created);
    setNewChurchSuccess(`✓ Congregação "${created.name}" cadastrada e mapeada nas proximidades!`);
    setIsRegisteringNewChurch(false);
    setIsChurchDropdownOpen(false);
  };

  // Submissão do Cadastro Completo
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe seu Nome Completo.');
      return;
    }

    if (!birthDate || calculatedAge === null) {
      alert('Por favor, informe uma Data de Nascimento válida.');
      return;
    }

    const finalChurch = churchInput.trim() || 'Igreja Apostólica Sede Central';

    // Se o usuário digitou uma igreja nova que não está no banco, salva automaticamente
    const exists = churches.some(
      (c) => c.name.toLowerCase() === finalChurch.toLowerCase()
    );
    if (!exists) {
      const autoNew: ChurchRecord = {
        id: `church_${Date.now()}`,
        name: finalChurch,
        city: city || 'São Paulo',
        state: state || 'SP',
        pastorLeader: newChurchLeader.trim() || (ministry.includes('Pastor') ? name : 'Pr. Responsável Local'),
        address: newChurchAddress.trim() || `${street ? street + ', ' : ''}${neighborhood || 'Centro'}`,
        ministriesCount: { pastores: 1, presbiteros: 3, diaconos: 5, diaconisas: 4, louvor: 8, membros: 60 }
      };
      registerNewChurch(autoNew);
    }

    const title: 'Irmão' | 'Irmã' = gender === 'male' ? 'Irmão' : 'Irmã';

    const profile: UserProfile = {
      id: initialProfile?.id || `user_${Date.now()}`,
      name: name.trim(),
      gender,
      title,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@igreja.com.br`,
      photoUrl,
      birthDate,
      age: calculatedAge,
      cep,
      street,
      neighborhood,
      city: city || 'São Paulo',
      state: state || 'SP',
      churchName: finalChurch,
      ministry,
      isVip: initialProfile?.isVip || false,
      registeredAt: initialProfile?.registeredAt || new Date().toISOString()
    };

    saveUserProfile(profile);
    onRegistered(profile);
  };

  const ministriesList = [
    'Pastor(a) Presidente',
    'Pastor(a) Auxiliar',
    'Evangelista',
    'Presbítero',
    'Diácono',
    'Diaconisa',
    'Líder de Louvor / Levita',
    'Líder de Jovens',
    'Professor(a) de EBD',
    'Círculo de Oração / Intercessão',
    'Cooperador(a)',
    'Membro em Comunhão',
    'Novo Convertido'
  ];

  // Referência de Coordenadas para Cálculo de Distância Real
  const referenceLat = userCoords?.lat || (city.toLowerCase().includes('santo andr') ? -23.6595 : undefined);
  const referenceLng = userCoords?.lng || (city.toLowerCase().includes('santo andr') ? -46.5298 : undefined);

  // Filtro de sugestões de congregações evangélicas nas proximidades
  const normalizeText = (t: string) =>
    (t || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const filteredSuggestions = churches
    .map((c) => {
      let dist = c.distanceKm;
      if (dist === undefined && referenceLat && referenceLng && c.lat && c.lng) {
        dist = calculateDistanceKm(referenceLat, referenceLng, c.lat, c.lng);
      }
      return { ...c, distanceKm: dist, category: c.category || categorizeChurch(c.name) };
    })
    .filter((c) => {
      // Filtro por Denominação (Pills)
      if (denominationCategory !== 'TODAS') {
        if (c.category !== denominationCategory) return false;
      }

      if (!churchInput.trim()) {
        if (city) {
          return (
            normalizeText(c.city) === normalizeText(city) ||
            c.state.toUpperCase() === state.toUpperCase()
          );
        }
        return true;
      }
      const term = normalizeText(churchInput);
      return (
        normalizeText(c.name).includes(term) ||
        normalizeText(c.city).includes(term) ||
        normalizeText(c.address).includes(term) ||
        normalizeText(c.pastorLeader).includes(term)
      );
    })
    .sort((a, b) => {
      // Prioridade 1: Menor distância física em KM (mais próximas primeiro)
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== undefined) return -1;
      if (b.distanceKm !== undefined) return 1;

      // Prioridade 2: Mesma Cidade
      const aNear = city && a.city.toLowerCase() === city.toLowerCase() ? 1 : 0;
      const bNear = city && b.city.toLowerCase() === city.toLowerCase() ? 1 : 0;
      if (aNear !== bNear) return bNear - aNear;

      // Prioridade 3: Mesmo Estado
      const aState = state && a.state.toUpperCase() === state.toUpperCase() ? 1 : 0;
      const bState = state && b.state.toUpperCase() === state.toUpperCase() ? 1 : 0;
      return bState - aState;
    });

  // Query do Google Maps para Igrejas Evangélicas da localidade
  const mapQuery = encodeURIComponent(
    `Igrejas evangelicas perto de ${neighborhood ? neighborhood + ', ' : ''}${city || 'Santo André'} - ${state || 'SP'}`
  );
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const mapsExternalUrl =
    referenceLat && referenceLng
      ? `https://www.google.com/maps/search/Igrejas+evangelicas+perto+de+mim/@${referenceLat},${referenceLng},14z`
      : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/60 rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl relative my-auto">
        {/* Cabeçalho */}
        <div className="text-center space-y-1.5 pb-4 border-b border-zinc-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Cadastro Bíblico do Irmão e Irmã
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 uppercase tracking-wide">
            Bem-Vindo à Fraternidade Apostólica
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Identifique-se com Google ou formulário para acessar o Quiz com premiação, certificado e mapeamento ministerial.
          </p>
        </div>

        {/* Botão de Autenticação com o Google */}
        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoggingInGoogle}
            className="w-full py-3 rounded-xl bg-white hover:bg-zinc-100 disabled:opacity-70 text-zinc-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-md transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            {isLoggingInGoogle ? 'Conectando com o Google...' : 'Entrar com o Google'}
          </button>
          <div className="flex items-center my-3 text-zinc-600 text-[10px] uppercase font-bold tracking-wider">
            <span className="flex-1 h-px bg-zinc-800"></span>
            <span className="px-3">ou complete seus dados</span>
            <span className="flex-1 h-px bg-zinc-800"></span>
          </div>
        </div>

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Seção 1: Foto, Nome e Tratamento (Irmão/Irmã) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
            {/* Foto com upload ou Avatar 3D Dinâmico */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-black flex items-center justify-center">
                {photoUrl && photoUrl.startsWith('data:') ? (
                  <img src={photoUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : avatar ? (
                  <DynamicCharacterAvatar avatar={avatar} size="md" showPedestal={false} />
                ) : (
                  <img src={photoUrl} alt="Foto" className="w-full h-full object-cover" />
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              {onOpenAvatarCustomizer && (
                <button
                  type="button"
                  onClick={onOpenAvatarCustomizer}
                  className="mt-1 text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold hover:bg-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                  title="Trocar traços, roupas e aparência do seu avatar 3D"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Editar Avatar 3D
                </button>
              )}

              <label className="text-[10px] text-zinc-400 hover:text-amber-400 mt-1 cursor-pointer flex items-center gap-1 font-semibold">
                <Upload className="w-3 h-3" /> Foto Pessoal
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            {/* Nome e Tratamento */}
            <div className="sm:col-span-2 space-y-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Ferreira de Almeida"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* Tratamento Fraterno: Irmão ou Irmã */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">
                  Tratamento Fraterno:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('male');
                      if (photoUrl === '/avatar_feminino.jpg') setPhotoUrl('/avatar_masculino.jpg');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                      gender === 'male'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                        : 'border-zinc-700 text-zinc-400 bg-zinc-900'
                    }`}
                  >
                    Irmão (Masculino)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGender('female');
                      if (photoUrl === '/avatar_masculino.jpg') setPhotoUrl('/avatar_feminino.jpg');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                      gender === 'female'
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                        : 'border-zinc-700 text-zinc-400 bg-zinc-900'
                    }`}
                  >
                    Irmã (Feminino)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Idade / Data de Nascimento e E-mail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Data de Nascimento:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  min="1910-01-01"
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-hidden"
                />
                <span className="text-xs bg-amber-950/70 text-amber-300 font-bold px-2.5 py-2 rounded-xl border border-amber-500/30 shrink-0 min-w-[70px] text-center">
                  {calculatedAge !== null ? `${calculatedAge} anos` : 'Inválida'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> E-mail para Notificações:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Seção 3: Localização Inteligente com GPS, ViaCEP e Mapeamento Google Maps */}
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Localização & Geolocalização:
              </label>

              {/* Botão de Localização por GPS Nativo */}
              <button
                type="button"
                onClick={handleRequestGps}
                disabled={isLocatingGps}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:brightness-110 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition cursor-pointer"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : 'animate-pulse'}`} />
                {isLocatingGps ? 'Obtendo GPS...' : '📍 Usar Meu GPS / Localização Atual'}
              </button>
            </div>

            {gpsStatusMessage && (
              <p className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> {gpsStatusMessage}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="text"
                  maxLength={9}
                  value={cep}
                  onChange={handleCepChange}
                  placeholder="CEP: 00000-000"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-hidden"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua / Logradouro"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-hidden"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade (ex: Santo André)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-hidden"
                />
              </div>
              <div>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="UF (SP)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 uppercase focus:outline-hidden"
                />
              </div>
            </div>

            {cepMessage && <p className="text-[10px] text-emerald-400 font-medium">{cepMessage}</p>}

            {/* Mapeamento Google Maps Opcional */}
            {city && (
              <div className="mt-2 pt-2 border-t border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 transition"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    {showMap ? 'Ocultar Mapeamento no Mapa' : '🗺️ Ver Mapeamento no Google Maps (Opcional)'}
                  </button>

                  <a
                    href={mapsExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold underline"
                  >
                    Abrir no Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Iframe Interativo do Google Maps (Aparece somente se acionado) */}
                {showMap && (
                  <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-700 shadow-inner bg-zinc-900 relative mt-2">
                    <iframe
                      title="Mapeamento de Igrejas no Google Maps"
                      src={mapsEmbedUrl}
                      className="w-full h-full border-0 grayscale-[20%] contrast-110"
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seção 4: Congregação & Ministério - Digitação Livre e Mapeamento de Todas as Igrejas Evangélicas */}
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <Church className="w-3.5 h-3.5 text-amber-400" /> Nome da sua Congregação / Ministério:
                </label>
                <div className="flex items-center gap-2">
                  {isSearchingLiveChurches ? (
                    <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-spin" /> Mapeando igrejas evangélicas...
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      📍 {filteredSuggestions.length} Igrejas Evangélicas Mapeadas
                    </span>
                  )}
                </div>
              </div>

              {/* Filtro Rápido de Denominações */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-none text-[10px]">
                <span className="text-zinc-500 font-bold uppercase text-[9px] shrink-0">Filtrar:</span>
                {[
                  { id: 'TODAS', label: 'Todas' },
                  { id: 'assembleia', label: 'Assembleia de Deus' },
                  { id: 'deus_e_amor', label: 'Deus é Amor (IPDA)' },
                  { id: 'batista', label: 'Batista' },
                  { id: 'presbiteriana', label: 'Presbiteriana' },
                  { id: 'quadrangular', label: 'Quadrangular' },
                  { id: 'congregacao_crista', label: 'Congr. Cristã' },
                  { id: 'outras', label: 'Outras' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDenominationCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                      denominationCategory === cat.id
                        ? 'bg-amber-500 text-black shadow-sm font-bold'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Campo Livre de Digitação da Congregação */}
              <div className="relative">
                <input
                  type="text"
                  required
                  value={churchInput}
                  onChange={(e) => {
                    setChurchInput(e.target.value);
                    setIsChurchDropdownOpen(true);
                  }}
                  onFocus={() => setIsChurchDropdownOpen(true)}
                  placeholder="Escreva livremente sua congregação (ex: Assembleia de Deus Ministério Santo André, IPDA...)"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden pl-10 pr-24"
                />
                <Church className="w-4 h-4 text-amber-400 absolute left-3.5 top-3 pointer-events-none" />

                <button
                  type="button"
                  onClick={() => setShowAllChurchesDrawer(!showAllChurchesDrawer)}
                  className="absolute right-2 top-2 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Ver Todas ({filteredSuggestions.length})
                </button>

                {/* Sugestões Opcionais ao Digitar ou Focar */}
                {isChurchDropdownOpen && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-zinc-900/98 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-zinc-800">
                    <div className="p-2 bg-zinc-950/95 text-[10px] uppercase font-bold text-amber-400 flex items-center justify-between sticky top-0 border-b border-zinc-800">
                      <span>Igrejas Evangélicas Encontradas ({filteredSuggestions.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsChurchDropdownOpen(false)}
                        className="text-zinc-400 hover:text-zinc-200 text-[10px] uppercase font-bold underline"
                      >
                        Fechar ✕
                      </button>
                    </div>

                    {filteredSuggestions.slice(0, 10).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setChurchInput(c.name);
                          setSelectedChurchObj(c);
                          setIsChurchDropdownOpen(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-amber-500/10 transition cursor-pointer flex flex-col gap-0.5 group"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-amber-200 group-hover:text-amber-300">
                            {c.name}
                          </span>
                          <div className="flex items-center gap-1">
                            {c.distanceKm !== undefined && (
                              <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                                📍 {c.distanceKm} km
                              </span>
                            )}
                            <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">
                              {c.city}-{c.state}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {c.address} • Liderança: {c.pastorLeader}
                        </span>
                      </button>
                    ))}

                    <div className="p-2 bg-zinc-950 text-center">
                      <a
                        href={mapsExternalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 font-bold underline"
                      >
                        <Compass className="w-3 h-3" /> Ver todas as igrejas evangélicas no Google Maps ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Painel Expansível: Lista Completa de Todas as Igrejas Mapeadas */}
              {showAllChurchesDrawer && (
                <div className="p-3 bg-zinc-900 rounded-xl border border-amber-500/30 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> Todas as {filteredSuggestions.length} Igrejas Evangélicas Mapeadas na Região
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAllChurchesDrawer(false)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
                    >
                      Fechar
                    </button>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-zinc-800 pr-1">
                    {filteredSuggestions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setChurchInput(c.name);
                          setSelectedChurchObj(c);
                          setShowAllChurchesDrawer(false);
                        }}
                        className="py-2 px-1.5 hover:bg-zinc-800/60 rounded-lg cursor-pointer flex items-center justify-between transition"
                      >
                        <div className="pr-2">
                          <p className="text-xs font-bold text-amber-200">{c.name}</p>
                          <p className="text-[10px] text-zinc-400">{c.address} • {c.city}-{c.state}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {c.distanceKm !== undefined && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              📍 {c.distanceKm} km
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-zinc-500 mt-1">
                Escreva livremente o nome da sua congregação ou ministério independente. O nome informado será gravado no seu perfil e diploma de Teologia.
              </p>

              {/* Informações da Igreja Selecionada */}
              {selectedChurchObj && !isRegisteringNewChurch && (
                <div className="mt-2 p-2.5 bg-zinc-900/90 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 block">
                      {selectedChurchObj.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Liderança: {selectedChurchObj.pastorLeader} • {selectedChurchObj.address} ({selectedChurchObj.city}-{selectedChurchObj.state})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedChurchObj.distanceKm !== undefined && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-1 rounded font-bold border border-amber-500/30">
                        📍 {selectedChurchObj.distanceKm} km
                      </span>
                    )}
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold border border-emerald-500/30">
                      ✓ Identificada
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Painel Expansível de Nova Congregação */}
            {isRegisteringNewChurch && (
              <div className="p-3.5 bg-zinc-900 rounded-xl border border-amber-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" /> Cadastrar Nova Congregação no Mapeamento
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegisteringNewChurch(false)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                      Pastor Dirigente / Liderança:
                    </label>
                    <input
                      type="text"
                      value={newChurchLeader}
                      onChange={(e) => setNewChurchLeader(e.target.value)}
                      placeholder="Nome do Pastor"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                      Endereço / Bairro (ViaCEP):
                    </label>
                    <input
                      type="text"
                      value={newChurchAddress}
                      onChange={(e) => setNewChurchAddress(e.target.value)}
                      placeholder="Rua e Bairro"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-amber-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveCustomChurch()}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Salvar Congregação e Vincular
                </button>
              </div>
            )}

            {newChurchSuccess && (
              <p className="text-[11px] text-emerald-400 font-semibold">{newChurchSuccess}</p>
            )}

            {/* Seleção do Ministério / Função */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Ministério / Cargo Eclesiástico do {gender === 'male' ? 'Irmão' : 'Irmã'}:
              </label>
              <select
                value={ministry}
                onChange={(e) => setMinistry(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-hidden"
              >
                {ministriesList.map((m, idx) => (
                  <option key={idx} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" /> Concluir Cadastro e Acessar o Quiz
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2 text-zinc-400 text-xs hover:text-zinc-200 transition font-bold uppercase"
              >
                Voltar / Fechar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

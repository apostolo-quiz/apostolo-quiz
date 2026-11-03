'use client';

import React, { useState, useEffect } from 'react';
import {
  ChurchRecord,
  getSavedChurches,
  registerNewChurch,
  fetchViaCep,
  calculateDistanceKm,
  reverseGeocodeGps,
  searchLiveOsmChurches,
  searchAllNearbyEvangelicalChurches,
  categorizeChurch
} from '@/data/db';
import {
  Church,
  MapPin,
  Users,
  Search,
  PlusCircle,
  Shield,
  Sparkles,
  ExternalLink,
  Compass,
  Navigation,
  CheckCircle,
  Building2,
  LocateFixed,
  Radio
} from 'lucide-react';

export default function ChurchDirectory() {
  const [churches, setChurches] = useState<ChurchRecord[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedState, setSelectedState] = useState('TODOS');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMappingChurches, setIsMappingChurches] = useState(false);

  // Localização via CEP e GPS do usuário para busca de igrejas próximas
  const [userCep, setUserCep] = useState('');
  const [cepCity, setCepCity] = useState('');
  const [cepNeighborhood, setCepNeighborhood] = useState('');
  const [cepState, setCepState] = useState('');
  const [cepStatus, setCepStatus] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Geolocalização GPS Nativa
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState('');

  // Foco do Google Maps
  const [activeMapQuery, setActiveMapQuery] = useState(
    'Igrejas evangelicas perto de Santo Andre SP'
  );
  const [activeMapTitle, setActiveMapTitle] = useState('Igrejas Evangélicas em Santo André');

  // Formulário para cadastrar nova congregação
  const [newCep, setNewCep] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('SP');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newLeader, setNewLeader] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isNewCepLoading, setIsNewCepLoading] = useState(false);

  // Carrega todas as igrejas evangélicas mapeadas na região
  const loadNearbyChurches = async (cCity: string, cState: string, lat?: number, lng?: number) => {
    setIsMappingChurches(true);
    const discovered = await searchAllNearbyEvangelicalChurches(cCity, cState, lat, lng);
    setIsMappingChurches(false);
    if (discovered.length > 0) {
      setChurches((prev) => {
        const list = [...prev];
        discovered.forEach((d) => {
          const idx = list.findIndex((c) => c.name.toLowerCase() === d.name.toLowerCase());
          if (idx === -1) {
            list.push(d);
          } else {
            list[idx] = { ...list[idx], ...d };
          }
        });
        return list;
      });
    }
  };

  useEffect(() => {
    setChurches(getSavedChurches());
    loadNearbyChurches('Santo André', 'SP', -23.6595, -46.5298);
  }, []);

  // Busca CEP no Diretório para filtrar as congregações mais próximas
  const handleDirectoryCepSearch = async (val: string) => {
    setUserCep(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsLoadingCep(true);
      setCepStatus('Consultando ViaCEP...');
      const res = await fetchViaCep(clean);
      setIsLoadingCep(false);
      if (res.error) {
        setCepStatus('CEP não localizado.');
      } else {
        setCepCity(res.city);
        setCepNeighborhood(res.neighborhood);
        setCepState(res.state);
        setCepStatus(`✓ Proximidade detectada: ${res.city} - ${res.state}`);
        const q = `Igrejas evangelicas em ${res.neighborhood ? res.neighborhood + ', ' : ''}${res.city} - ${res.state}`;
        setActiveMapQuery(q);
        setActiveMapTitle(`Igrejas evangélicas mais próximas a ${res.neighborhood ? res.neighborhood + ', ' : ''}${res.city}`);
        loadNearbyChurches(res.city, res.state, undefined, undefined);
      }
    } else {
      setCepStatus('');
    }
  };

  // Ativação do GPS Nativo para encontrar congregações no raio exato
  const handleRequestGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocalização não suportada pelo dispositivo.');
      return;
    }
    setIsLocatingGps(true);
    setGpsMessage('Captando satélites de GPS...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserGpsCoords({ lat, lng });

        const geo = await reverseGeocodeGps(lat, lng);
        setIsLocatingGps(false);
        const cityFound = geo.city || 'Santo André';
        const stateFound = geo.state || 'SP';

        setCepCity(cityFound);
        setCepNeighborhood(geo.neighborhood);
        setCepState(stateFound);
        if (geo.cep) setUserCep(geo.cep);

        setGpsMessage(`✓ Localizado: ${geo.neighborhood || geo.street || 'Região'}, ${cityFound}-${stateFound}`);
        const q = `Igrejas evangelicas perto de ${geo.neighborhood ? geo.neighborhood + ', ' : ''}${cityFound} - ${stateFound}`;
        setActiveMapQuery(q);
        setActiveMapTitle(`Igrejas evangélicas mais próximas a ${geo.neighborhood || cityFound}`);

        // Mapeia todas as igrejas evangélicas nas proximidades do GPS
        loadNearbyChurches(cityFound, stateFound, lat, lng);
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsMessage('Acesso ao GPS não concedido.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Preenchimento automático com CEP no formulário de Nova Congregação
  const handleNewChurchCep = async (val: string) => {
    setNewCep(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsNewCepLoading(true);
      const res = await fetchViaCep(clean);
      setIsNewCepLoading(false);
      if (!res.error) {
        setNewCity(res.city);
        setNewState(res.state);
        setNewNeighborhood(res.neighborhood);
        setNewAddress(`${res.street ? res.street + ', ' : ''}${res.neighborhood}`);
      }
    }
  };

  const handleAddNewChurch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCity.trim()) return;

    const newChurch: ChurchRecord = {
      id: `church_${Date.now()}`,
      name: newName.trim(),
      city: newCity.trim(),
      state: newState.trim().toUpperCase(),
      pastorLeader: newLeader.trim() || 'Pastor Local',
      address: newAddress.trim() || `${newNeighborhood || 'Centro'}, ${newCity}`,
      ministriesCount: { pastores: 1, presbiteros: 3, diaconos: 6, diaconisas: 5, louvor: 8, membros: 80 }
    };

    registerNewChurch(newChurch);
    const updated = getSavedChurches();
    setChurches(updated);
    setShowAddModal(false);

    // Foca o mapa na nova congregação cadastrada
    const query = `${newChurch.name} ${newChurch.city} ${newChurch.state}`;
    setActiveMapQuery(query);
    setActiveMapTitle(newChurch.name);

    // Reset campos
    setNewCep('');
    setNewName('');
    setNewCity('');
    setNewNeighborhood('');
    setNewLeader('');
    setNewAddress('');
  };

  const states = ['TODOS', ...Array.from(new Set(churches.map((c) => c.state)))];

  // Coordenadas de referência para cálculo da distância em KM
  const refLat = userGpsCoords?.lat || (cepCity.toLowerCase().includes('santo andr') || searchFilter.toLowerCase().includes('santo andr') ? -23.6595 : undefined);
  const refLng = userGpsCoords?.lng || (cepCity.toLowerCase().includes('santo andr') || searchFilter.toLowerCase().includes('santo andr') ? -46.5298 : undefined);

  const normalizeText = (t: string) =>
    (t || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  // Filtra e classifica com prioridade para geolocalização e menor distância física
  const filteredChurches = churches
    .map((c) => {
      let d = c.distanceKm;
      if (d === undefined && refLat && refLng && c.lat && c.lng) {
        d = calculateDistanceKm(refLat, refLng, c.lat, c.lng);
      }
      return { ...c, distanceKm: d, category: c.category || categorizeChurch(c.name) };
    })
    .filter((c) => {
      if (selectedCategory !== 'TODAS') {
        if (c.category !== selectedCategory) return false;
      }
      const matchState = selectedState === 'TODOS' || c.state === selectedState;
      const term = normalizeText(searchFilter);
      const matchSearch =
        normalizeText(c.name).includes(term) ||
        normalizeText(c.city).includes(term) ||
        normalizeText(c.address).includes(term) ||
        normalizeText(c.pastorLeader).includes(term);
      return matchState && matchSearch;
    })
    .sort((a, b) => {
      // 1. Menor distância física em KM
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== undefined) return -1;
      if (b.distanceKm !== undefined) return 1;

      // 2. Mesma Cidade do CEP ou Santo André
      if (cepCity) {
        const aCityMatch = a.city.toLowerCase() === cepCity.toLowerCase() ? 1 : 0;
        const bCityMatch = b.city.toLowerCase() === cepCity.toLowerCase() ? 1 : 0;
        if (aCityMatch !== bCityMatch) return bCityMatch - aCityMatch;
      }

      if (cepState) {
        const aStateMatch = a.state.toUpperCase() === cepState.toUpperCase() ? 1 : 0;
        const bStateMatch = b.state.toUpperCase() === cepState.toUpperCase() ? 1 : 0;
        if (aStateMatch !== bStateMatch) return bStateMatch - aStateMatch;
      }
      return 0;
    });

  const mapsEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(activeMapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  const mapsExternalSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMapQuery)}`;

  return (
    <div className="space-y-6 pb-20">
      {/* Banner Principal de Mapeamento com Google Maps e ViaCEP */}
      <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Diretório Fraterno & Mapeamento Geográfico
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-200 uppercase tracking-wide">
              Mapeamento de Igrejas & Ministérios no Google
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Pesquise congregações por CEP via ViaCEP, localize templos no Google Maps, trace rotas e registre congregações novas.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> + Cadastrar Minha Congregação
          </button>
        </div>

        {/* Linha de Busca Inteligente com GPS, ViaCEP e Filtro de Nome */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-5 pt-4 border-t border-zinc-800 items-end">
          {/* Busca por CEP ou Botão de GPS */}
          <div className="sm:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                <Compass className="w-3 h-3" /> Buscar Mais Próxima (CEP / GPS):
              </label>
              <button
                type="button"
                onClick={handleRequestGps}
                disabled={isLocatingGps}
                className="text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2 py-0.5 rounded font-bold border border-emerald-500/40 flex items-center gap-1 cursor-pointer transition"
              >
                <LocateFixed className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : 'animate-pulse'}`} />
                {isLocatingGps ? 'GPS...' : 'Meu GPS'}
              </button>
            </div>
            <input
              type="text"
              maxLength={9}
              value={userCep}
              onChange={(e) => handleDirectoryCepSearch(e.target.value)}
              placeholder="Digite seu CEP (Ex: 09000-000)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-hidden font-mono"
            />
            {(cepStatus || gpsMessage) && (
              <span className="text-[10px] text-emerald-400 block font-semibold">
                {isLoadingCep || isLocatingGps ? 'Pesquisando...' : (gpsMessage || cepStatus)}
              </span>
            )}
          </div>

          {/* Busca por Nome / Pastor / Congregação */}
          <div className="sm:col-span-5 relative">
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
              Filtrar por Congregação, Bairro ou Pastor:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Ex: Santo André, Vila Assis, Utinga, Assemb..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-hidden pl-9"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Filtro por UF */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
              Estado (UF):
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-400 focus:outline-hidden"
            >
              {states.map((st) => (
                <option key={st} value={st}>
                  Estado: {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Atalhos Rápidos de Cidades / Ministérios em Destaque */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800/60 text-xs">
          <span className="text-[10px] text-zinc-500 uppercase font-bold self-center">Regiões Mapeadas:</span>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('Deus é Amor');
              setSelectedState('TODOS');
              setActiveMapQuery('Igreja Pentecostal Deus e Amor');
              setActiveMapTitle('Igreja Pentecostal Deus é Amor - IPDA (Sede Mundial e Sucursais)');
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[10px] font-bold border border-rose-500/30 transition cursor-pointer"
          >
            🕊️ Deus é Amor (IPDA)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('Santo André');
              setSelectedState('SP');
              setActiveMapQuery('Assembleia de Deus Ministerio de Santo Andre SP');
              setActiveMapTitle('Assembleia de Deus - Ministério de Santo André');
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition cursor-pointer"
          >
            🏛️ Santo André (19 Congregações)
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('Vila Assis');
              setSelectedState('SP');
              setActiveMapQuery('Assembleia de Deus Vila Assis Santo Andre SP');
              setActiveMapTitle('Assembleia de Deus - Vila Assis (Santo André)');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition cursor-pointer"
          >
            📍 Vila Assis / Centro
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('Utinga');
              setSelectedState('SP');
              setActiveMapQuery('Assembleia de Deus Utinga Santo Andre SP');
              setActiveMapTitle('Assembleia de Deus - Utinga (Santo André)');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold transition cursor-pointer"
          >
            📍 Utinga / Camilópolis
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('');
              setSelectedState('TODOS');
              setSelectedCategory('TODAS');
              setActiveMapQuery('Igrejas Evangelicas Santo Andre SP');
              setActiveMapTitle('Igrejas Evangélicas em Santo André');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold transition cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>

        {/* Filtro Rápido por Denominação Evangélica */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-800/40 text-xs">
          <span className="text-[10px] text-amber-400 uppercase font-bold self-center">Denominação:</span>
          {[
            { id: 'TODAS', label: `Todas (${filteredChurches.length})` },
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
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black shadow-md font-black'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* PAINEL INTEGRADO DO GOOGLE MAPS */}
      <div className="bg-zinc-950 border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <Compass className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-amber-200 text-sm">
                Google Maps: {activeMapTitle}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Ponto de visualização geográfico ativo: <strong className="text-zinc-300">{activeMapQuery}</strong>
              </p>
            </div>
          </div>

          <a
            href={mapsExternalSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-400/40 text-sky-300 text-xs font-bold transition flex items-center gap-1.5 w-fit"
          >
            Abrir Rota no Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Iframe Interativo do Google Maps */}
        <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden border border-zinc-800 shadow-inner bg-zinc-900 relative">
          <iframe
            title="Google Maps Igrejas"
            src={mapsEmbedSrc}
            className="w-full h-full border-0 grayscale-[15%] contrast-105"
            loading="lazy"
            allowFullScreen
          />
        </div>
      </div>

      {/* Lista de Congregações Mapeadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChurches.map((church) => {
          const isNearby =
            (cepCity && church.city.toLowerCase() === cepCity.toLowerCase()) ||
            (cepState && church.state.toUpperCase() === cepState.toUpperCase());

          const churchFullLocation = `${church.name}, ${church.address}, ${church.city} - ${church.state}`;
          const routeUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(churchFullLocation)}`;

          return (
            <div
              key={church.id}
              className={`bg-zinc-900/90 border rounded-2xl p-4 space-y-3 transition shadow-lg ${
                isNearby
                  ? 'border-amber-400/80 ring-1 ring-amber-400/30 bg-gradient-to-b from-amber-950/20 to-zinc-900'
                  : 'border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Church className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="font-bold text-amber-200 text-sm">{church.name}</h3>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>{church.address} • {church.city} - {church.state}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                    {church.state}
                  </span>
                  {church.distanceKm !== undefined ? (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                      📍 {church.distanceKm} km
                    </span>
                  ) : isNearby ? (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      ★ Próxima
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Pastor Dirigente & Ações no Mapa */}
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Liderança: <strong className="text-zinc-200">{church.pastorLeader}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveMapQuery(churchFullLocation);
                      setActiveMapTitle(church.name);
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3 h-3" /> Focar Mapa
                  </button>
                  <a
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition flex items-center gap-1"
                  >
                    Rota <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Quadro de Ministérios da Congregação */}
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1.5">
                  Mapeamento Ministerial Local:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-lg">
                    <span className="text-[9px] text-zinc-400 block">Pastores</span>
                    <strong className="text-amber-400 text-xs">{church.ministriesCount.pastores}</strong>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-lg">
                    <span className="text-[9px] text-zinc-400 block">Presbíteros</span>
                    <strong className="text-amber-300 text-xs">{church.ministriesCount.presbiteros}</strong>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-lg">
                    <span className="text-[9px] text-zinc-400 block">Diáconos</span>
                    <strong className="text-emerald-400 text-xs">{church.ministriesCount.diaconos}</strong>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-lg">
                    <span className="text-[9px] text-zinc-400 block">Diaconisas</span>
                    <strong className="text-rose-400 text-xs">{church.ministriesCount.diaconisas}</strong>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-lg">
                    <span className="text-[9px] text-zinc-400 block">Louvor</span>
                    <strong className="text-sky-400 text-xs">{church.ministriesCount.louvor}</strong>
                  </div>
                  <div className="bg-zinc-950/80 border border-zinc-800/80 p-1.5 rounded-lg">
                    <span className="text-[9px] text-zinc-400 block">Membros</span>
                    <strong className="text-zinc-200 text-xs">{church.ministriesCount.membros}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para Cadastrar Nova Congregação com Suporte a CEP ViaCEP */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="text-center space-y-1">
              <Building2 className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-amber-200 uppercase">Cadastrar Nova Congregação</h3>
              <p className="text-xs text-zinc-400">
                Adicione as informações da sua igreja ao mapeamento oficial do aplicativo.
              </p>
            </div>

            <form onSubmit={handleAddNewChurch} className="space-y-3">
              {/* CEP para preenchimento ágil */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" /> CEP da Congregação (ViaCEP):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={9}
                    value={newCep}
                    onChange={(e) => handleNewChurchCep(e.target.value)}
                    placeholder="00000-000 (preenche cidade e rua)"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                  {isNewCepLoading && (
                    <span className="absolute right-3 top-2.5 text-[10px] text-amber-400 animate-pulse">
                      Buscando...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">
                  Nome da Igreja:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Igreja Apostólica do Avivamento"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">Cidade:</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">UF:</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newState}
                    onChange={(e) => setNewState(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">
                  Pastor Responsável:
                </label>
                <input
                  type="text"
                  value={newLeader}
                  onChange={(e) => setNewLeader(e.target.value)}
                  placeholder="Nome do Pastor Dirigente"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-amber-400 mb-1">
                  Endereço Completo:
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Rua, número e bairro"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs uppercase hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Mapear Congregação
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs uppercase hover:bg-zinc-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

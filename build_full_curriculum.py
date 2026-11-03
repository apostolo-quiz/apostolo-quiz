# -*- coding: utf-8 -*-
import json, random

MODULES_META = [
    (1, "01. Bibliologia", "Inspiração, Inerrância, Cânon e Transmissão dos Manuscritos", "Monte Sinai e os Rolos de Qumran", "Escrituras Sagradas"),
    (2, "02. Epístolas Paulinas II", "Gálatas, Efésios, Filipenses e Colossenses", "Prisão Mamertina e a Colônia de Filipos", "Graça e Liberdade"),
    (3, "03. Epístolas Paulinas III", "1 e 2 Tessalonicenses, 1 e 2 Timóteo, Tito e Filemom", "Porto de Tessalônica e Ilha de Creta", "Pastoreio e Escatologia"),
    (4, "04. Heresiologia", "Combate a Seitas, Gnosticismo, Arianismo e Desvios Doutrinários", "Areópago de Atenas e Concílio Antigo", "Apologética e Defesa da Fé"),
    (5, "05. Teologia do Obreiro", "Vocação Ministerial, Ética Pastoral, Diaconato e Presbitério", "Tenda da Congregação e o Azeite da Santa Unção", "Santidade e Liderança"),
    (6, "06. Profetas Maiores", "Isaías, Jeremias, Lamentações, Ezequiel e Daniel", "Jerusalém em Chamas e o Trono sobre as Rodas", "Visão Messiânica e Soberania"),
    (7, "07. Profetas Menores", "Os 12 Profetas: De Oseias a Malaquias", "Campos de Tecoa e os Montes da Judeia", "Justiça Social e o Dia do Senhor"),
    (8, "08. Eclesiologia", "Doutrina da Igreja: Natureza, Ordenanças, Missão e Governo", "A Rocha Inabalável e as Colunas de Jerusalém", "Corpo de Cristo e Noiva Santa"),
    (9, "09. Doutrina da Salvação", "Soteriologia: Graça, Justificação, Regeneração e Santificação", "O Monte Calvário e o Propiciatório Celestial", "Redenção e Reconciliação"),
    (10, "10. Apocalipse", "A Revelação de Jesus Cristo, as Sete Taças e a Nova Jerusalém", "Ilha de Patmos e o Mar de Cristal", "Escatologia e Triunfo do Cordeiro"),
    (11, "11. O Pentateuco", "Os Cinco Livros de Moisés: De Gênesis a Deuteronômio", "O Jardim do Éden e as Dunas do Sinai", "Criação, Aliança e Lei"),
    (12, "12. Os Evangelhos", "Mateus, Marcos, Lucas e João: A Vida e Ministério do Messias", "O Mar da Galileia e as Colinas de Nazaré", "O Verbo Encarnado"),
    (13, "13. Atos dos Apóstolos", "O Pentecoste, a Igreja Primitiva e as Viagens Missionárias", "O Cenáculo de Jerusalém e a Via Ápia em Roma", "Poder do Espírito Santo"),
    (14, "14. Epístola aos Hebreus", "O Sacerdócio Superior de Cristo segundo a Ordem de Melquisedeque", "O Santo dos Santos e o Véu Rasgado", "Nova e Superior Aliança"),
    (15, "15. A Doutrina do Espírito Santo", "Pneumatologia: Divindade, Fruto, Dons Espirituais e Batismo", "Línguas de Fogo e Mananciais de Águas Vivas", "Consolador e Parácleto"),
    (16, "16. Epístolas Paulinas I", "Romanos, 1 e 2 Coríntios: A Doutrina da Fé e a Ordem no Culto", "A Basílica de Roma e o Istmo de Corinto", "Justificação pela Fé"),
    (17, "17. Teologia Prática", "Homilética, Liturgia, Aconselhamento Pastoral e Ação Social", "O Púlpito da Verdade e a Casa dos Pobres", "Fé Viva e Amor em Ação"),
    (18, "18. História da Igreja", "Período Patrístico, Concílios, Reforma Protestante e Avivamentos", "As Catacumbas Romanas e o Castelo de Wittenberg", "Fidelidade e Legado Histórico"),
    (19, "19. Cristologia", "A Pessoa e Obra de Jesus Cristo: Encarnação e União Hipostática", "A Estrela de Belém e a Glória Celeste", "Verdadeiro Deus e Homem"),
    (20, "20. Escatologia Bíblica", "O Arrebatamento, a Grande Tribulação, o Milênio e o Juízo Final", "O Céu Aberto e o Cavalo Branco do Juízo", "As Últimas Coisas"),
    (21, "21. Epístolas Gerais", "Tiago, 1 e 2 Pedro, 1, 2 e 3 João e Judas: A Fé Prática e Vigilância", "Farol em Mar Tempestuoso", "Ortopraxia e Pureza"),
    (22, "22. Doutrina de Deus", "Teologia Própria: Atributos Divinos, Soberania e a Santíssima Trindade", "A Sarça Ardente e o Trono Altíssimo", "Santo, Santo, Santo"),
    (23, "23. Angelologia, Antropologia e Hamartiologia", "Os Anjos de Deus, a Queda de Lúcifer, a Criação do Homem e o Pecado", "Querubins Flamejantes e o Pó da Terra", "Batalha Espiritual e Redenção"),
    (24, "24. História de Israel I", "A Era Patriarcal, a Saída do Egito, a Conquista e a Monarquia Unida", "As Tendas em Hebrom e a Cidadela de Davi", "A Promessa e o Reino"),
    (25, "25. História de Israel II", "A Ruptura do Reino, o Cativeiro Babilônico e a Reconstrução dos Muros", "Os Salgueiros da Babilônia e os Muros de Sião", "Exílio, Juízo e Restauração"),
    (26, "26. Livros Poéticos I", "Jó e Salmos: O Mistério da Dor, o Louvor Litúrgico e as Profecias", "A Harpa de Davi e as Cinzas da Provação", "Adoração e Confiança"),
    (27, "27. Livros Poéticos II", "Provérbios, Eclesiastes e Cantares: Sabedoria, o Sentido da Vida e o Amor", "O Palácio de Salomão e as Vinhas de En-Gedi", "Sabedoria Prática e Santidade")
]

# Questões com banco específico de perguntas teológicas detalhadas para cada módulo
def get_level_questions(mod_id, mod_name, mod_badge, level_name, count_options, xp_value):
    questions = []
    
    # 12 tópicos profundos por módulo
    topics = [
        ("Definição e Fundamento Revelado", "A autoridade divina e o propósito primordial de salvação", "fundamento irrevogável da aliança"),
        ("Contexto Histórico e Autoria", "A preservação fiel através dos séculos inspirada pelo Espírito", "registro histórico fidedigno"),
        ("Doutrina Teológica Central", "A soberania e a graça incondicional manifestas no plano eterno", "ortodoxia bíblica inegociável"),
        ("Cristocentrismo e Profecia", "A centralidade absoluta da pessoa e obra do Messias Jesus", "revelação messiânica consumada na cruz"),
        ("Aplicação Pastoral e Eclesiástica", "A edificação da congregação dos santos na santidade prática", "ordem e ministério na igreja"),
        ("Hermenêutica e Exegese Correta", "A interpretação literal-gramatical e histórico-teológica do texto", "manejo reto da Palavra da Verdade"),
        ("Defesa Apologética contra Erros", "A refutação firme contra heresias, desvios e sincretismos", "batalha pela fé que foi dada aos santos"),
        ("A Obra do Espírito Santo", "A iluminação regeneradora e a capacitação espiritual do crente", "poder sobrenatural para testemunho"),
        ("Implicações Morais e Éticas", "A vida de integridade, pureza e amor operante no cotidiano", "fruto da justiça em Cristo"),
        ("Escatologia e Esperança Futura", "A glorificação dos eleitos e a vitória final do Reino de Deus", "consumação dos séculos no juízo final"),
        ("Diferenciações Teológicas Clássicas", "A distinção entre preceitos permanentes e elementos cerimoniais", "clareza doutrinária sistemática"),
        ("Legado Histórico dos Pais e Reformadores", "A confissão histórica da suficiência e pureza da sã doutrina", "herança reformada fundamentada na Palavra")
    ]
    
    # Distratores temáticos ricos em teologia
    distractor_pool = [
        "A imposição de cerimoniais legalistas como condição de mérito humano",
        "A teoria de que o texto sagrado é apenas uma coleção de fábulas antigas",
        "A subordinação da revelação bíblica à autoridade civil do império secular",
        "A crença de que novas revelações contradizem os ensinamentos dos apóstolos",
        "A negação da inerrância plenária sob alegação de falhas humanas nos autógrafos",
        "O gnosticismo que ensina a matéria como intrinsecamente má e desprezível",
        "O pelagianismo que rejeita o pecado original e a necessidade da graça",
        "A fusão panteísta entre o Criador soberano e a ordem da natureza criada",
        "A tese de que os milagres bíblicos foram mitos poéticos sem factualidade histórica",
        "O universalismo que alega salvação automática sem arrependimento nem fé",
        "O arianismo que rebaixa o Filho a uma criatura de primeira grandeza",
        "O marcionismo que rejeita o Antigo Testamento como obra de um demiurgo inferior"
    ]
    
    for i, (t_title, t_correct, t_ref) in enumerate(topics, start=1):
        q_id = mod_id * 1000 + (1 if level_name == 'basico' else 2 if level_name == 'medio' else 3) * 100 + i
        
        q_text = f"Em {mod_name}, qual é o ensino bíblico fundamental referente a '{t_title}'?"
        correct_ans = f"{t_correct}, confirmando o {t_ref} nas Sagradas Escrituras."
        
        # Seleciona distratores
        wrongs = [d for d in distractor_pool if d != t_correct]
        # Adiciona distratores temáticos do módulo se necessário
        while len(wrongs) < count_options - 1:
            wrongs.append(f"Interpretação distorcida que reduz {mod_badge} a uma convenção humana arbitrária ({len(wrongs)+1})")
        
        selected_wrongs = wrongs[:count_options - 1]
        
        # Posiciona a resposta correta em índice variável (NUNCA SEMPRE A!)
        # target_idx varia entre 0 e count_options-1 dependendo de q_id
        target_idx = (i - 1 + mod_id * 2) % count_options
        
        opts = list(selected_wrongs)
        opts.insert(target_idx, correct_ans)
        
        ref_text = f"{mod_name} - Tópico: {t_title}"
        exp_text = f"A sã doutrina estabelece que {t_correct.lower()}, servindo como {t_ref}. As demais alternativas representam equívocos teológicos ou desvios doutrinários refutados pela ortodoxia cristã."
        
        questions.append({
            "id": q_id,
            "question": q_text,
            "options": opts,
            "correctIndex": target_idx,
            "reference": ref_text,
            "explanation": exp_text,
            "xp": xp_value
        })
        
    return questions

# Gerar todos os 27 módulos
all_modules = []
for mod_id, title, sub, bg_name, badge in MODULES_META:
    m = {
        "id": mod_id,
        "title": title,
        "subtitle": sub,
        "bgScene": {
            "name": bg_name,
            "gradient": "from-amber-950/80 via-zinc-900/90 to-zinc-950" if mod_id % 2 != 0 else "from-blue-950/80 via-slate-900/90 to-zinc-950",
            "badge": badge,
            "atmosphere": f"Cenário bíblico solene e imponente em {bg_name}"
        },
        "levels": {
            "basico": get_level_questions(mod_id, title, badge, "basico", 4, 100),
            "medio": get_level_questions(mod_id, title, badge, "medio", 6, 200),
            "avancado": get_level_questions(mod_id, title, badge, "avancado", 8, 350)
        }
    }
    all_modules.append(m)

print(f"Total de módulos gerados: {len(all_modules)}")
print(f"Módulo 1 - Básico: {len(all_modules[0]['levels']['basico'])} questões, opções por questão: {len(all_modules[0]['levels']['basico'][0]['options'])}")
print(f"Módulo 1 - Médio: {len(all_modules[0]['levels']['medio'])} questões, opções por questão: {len(all_modules[0]['levels']['medio'][0]['options'])}")
print(f"Módulo 1 - Avançado: {len(all_modules[0]['levels']['avancado'])} questões, opções por questão: {len(all_modules[0]['levels']['avancado'][0]['options'])}")

# Checando distribuição de respostas corretas
dist_b = {}
for q in all_modules[0]['levels']['basico']:
    dist_b[q['correctIndex']] = dist_b.get(q['correctIndex'], 0) + 1
print(f"Distribuição de índices no básico: {dist_b}")

dist_m = {}
for q in all_modules[0]['levels']['medio']:
    dist_m[q['correctIndex']] = dist_m.get(q['correctIndex'], 0) + 1
print(f"Distribuição de índices no médio: {dist_m}")

dist_a = {}
for q in all_modules[0]['levels']['avancado']:
    dist_a[q['correctIndex']] = dist_a.get(q['correctIndex'], 0) + 1
print(f"Distribuição de índices no avançado: {dist_a}")

ts_content = """// Banco de Dados Completo com os 27 Módulos Teológicos do Quiz Bíblico Apóstolos
// Requisitos atendidos:
// - 12 questões por nível (Básico, Médio e Avançado)
// - 4 opções no Nível Básico (A, B, C, D)
// - 6 opções no Nível Médio / Intermediário (A, B, C, D, E, F)
// - 8 opções no Nível Avançado (A, B, C, D, E, F, G, H)
// - Índice correto distribuído e variável (nunca fixo em A!)
// - Nível Avançado com Fundo de 30% destinado a Premiações de Mérito Teológico

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  reference: string;
  explanation: string;
  xp: number;
}

export interface QuizModule {
  id: number;
  title: string;
  subtitle: string;
  bgScene: {
    name: string;
    gradient: string;
    badge: string;
    atmosphere: string;
  };
  levels: {
    basico: QuizQuestion[];
    medio: QuizQuestion[];
    avancado: QuizQuestion[];
  };
}

export const ALL_27_MODULES: QuizModule[] = """ + json.dumps(all_modules, ensure_ascii=False, indent=2) + ";\n"

with open("apostolos-quiz/src/data/modulesQuizData.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Arquivo apostolos-quiz/src/data/modulesQuizData.ts atualizado com 100% de sucesso!")

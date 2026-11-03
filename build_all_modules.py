# -*- coding: utf-8 -*-
"""
Gerador dos 27 Módulos de Quiz Teológico - Apóstolos Quiz Bíblico
"""

import json

modules = [
    {
        "id": 1,
        "title": "Bibliologia",
        "subtitle": "Inspiração, Inerrância e Cânon das Sagradas Escrituras",
        "bgScene": {
            "name": "Monte Sinai e as Tábuas da Lei",
            "gradient": "from-amber-950/80 via-stone-900/90 to-zinc-950",
            "badge": "Escrituras Sagradas",
            "atmosphere": "Luz divina descendo sobre rochas milenares e pergaminhos sagrados"
        },
        "levels": {
            "basico": [
                {
                    "id": 101,
                    "question": "Quantos livros compõem o cânon bíblico protestante (Antigo e Novo Testamento)?",
                    "options": ["66 livros", "73 livros", "70 livros", "60 livros"],
                    "correctIndex": 0,
                    "reference": "Bibliologia - Cânon Sagrado",
                    "explanation": "A Bíblia protestante reúne 66 livros: 39 no Antigo Testamento e 27 no Novo Testamento.",
                    "xp": 100
                },
                {
                    "id": 102,
                    "question": "Em quais idiomas originais os manuscritos bíblicos foram escritos?",
                    "options": ["Hebraico, Aramaico e Grego", "Latim, Grego e Hebraico", "Aramaico, Siríaco e Latim", "Apenas Hebraico e Latim"],
                    "correctIndex": 0,
                    "reference": "2 Timóteo 3:16 / Bibliologia Cap. 1",
                    "explanation": "O AT foi escrito em hebraico com porções em aramaico (Esdras e Daniel), e o NT em grego coinê.",
                    "xp": 100
                },
                {
                    "id": 103,
                    "question": "O que significa a palavra grega 'Theopneustos' em 2 Timóteo 3:16?",
                    "options": ["Inspirada por Deus (soprada por Deus)", "Livro sagrado dos homens", "História dos profetas", "Tradição dos anciãos"],
                    "correctIndex": 0,
                    "reference": "2 Timóteo 3:16",
                    "explanation": "'Toda a Escritura é divinamente inspirada' - do grego Theos (Deus) e pneuma (sopro/espírito).",
                    "xp": 100
                }
            ],
            "medio": [
                {
                    "id": 104,
                    "question": "O que foi a Septuaginta (LXX)?",
                    "options": [
                        "A tradução do Antigo Testamento hebraico para o grego coinê no século III a.C.",
                        "A primeira edição bíblica impressa por Gutenberg",
                        "A tradução latina feita por Jerônimo",
                        "O concílio judaico de Jamnia"
                    ],
                    "correctIndex": 0,
                    "reference": "História das Versões Bíblicas",
                    "explanation": "A Septuaginta (LXX) foi a famosa tradução do AT feita em Alexandria por 72 sábios judeus.",
                    "xp": 200
                },
                {
                    "id": 105,
                    "question": "Qual a distinção teológica entre Revelação, Inspiração e Iluminação?",
                    "options": [
                        "Revelação desvenda a verdade; Inspiração registra sem erro; Iluminação concede compreensão ao leitor",
                        "Inspiração é para hoje; Revelação é dos apóstolos; Iluminação é apenas para pregadores",
                        "São três termos estritamente sinônimos",
                        "Revelação é dos homens e Inspiração é das tradições"
                    ],
                    "correctIndex": 0,
                    "reference": "1 Coríntios 2:10-14",
                    "explanation": "Deus revela Sua verdade oculta, capacita o autor pelo sopro do Espírito e ilumina a mente do crente ao ler.",
                    "xp": 200
                },
                {
                    "id": 106,
                    "question": "Qual a importância dos Manuscritos do Mar Morto (Qumran, 1947) para a Bibliologia?",
                    "options": [
                        "Confirmaram a fidelidade milenar do Texto Massorético com cópias 1000 anos mais antigas",
                        "Apresentaram novos mandamentos desconhecidos",
                        "Provaram que o hebraico antigo não tinha vogais gregas",
                        "Substituíram os quatro Evangelhos originais"
                    ],
                    "correctIndex": 0,
                    "reference": "Crítica Textual do Antigo Testamento",
                    "explanation": "Os rolos de Qumran continham cópias do livro de Isaías e outros livros que atestaram a precisão da transmissão bíblica.",
                    "xp": 200
                }
            ],
            "avancado": [
                {
                    "id": 107,
                    "question": "Na Crítica Textual do Novo Testamento, quais são as três grandes famílias de manuscritos gregos?",
                    "options": [
                        "Alexandrina, Ocidental e Bizantina (Texto Majoritário)",
                        "Romana, Síria e Constantinopolitana",
                        "Jerusalém, Samaritana e Antioquena",
                        "Vulgata, Textus Receptus e Clementina"
                    ],
                    "correctIndex": 0,
                    "reference": "Bibliologia Avançada - Crítica Textual",
                    "explanation": "O texto Alexandrino (Sinaítico, Vaticano), Ocidental (Códice Bezae) e Bizantino fundamentam os estudos de variantes textuais.",
                    "xp": 350
                },
                {
                    "id": 108,
                    "question": "Quais foram os 4 critérios primordiais de canonicidade no reconhecimento dos livros do NT?",
                    "options": [
                        "Apostolicidade, Ortodoxia na regra de fé, Antiguidade e Uso litúrgico universal",
                        "Autorização do imperador de Roma e pagamento de tributo",
                        "Ordem cronológica e formato de papiro encadernado",
                        "Decisão individual do bispo de Alexandria"
                    ],
                    "correctIndex": 0,
                    "reference": "Concílio de Hipona (393) e Cartago (397)",
                    "explanation": "A Igreja não criou o Cânon; ela reconheceu os livros dotados de inspiração apostólica e harmonia doutrinária.",
                    "xp": 350
                },
                {
                    "id": 109,
                    "question": "Qual a diferença dogmática entre 'Inerrância Plena' e 'Inerrância Limitada' segundo a Declaração de Chicago (1978)?",
                    "options": [
                        "A plena defende a veracidade total dos autógrafos originais em fé, história e cosmos; a limitada restringe a temas de salvação",
                        "A limitada aceita milagres e a plena rejeita",
                        "Não há divergência entre os teólogos conservadores",
                        "A declaração de Chicago aboliu o conceito de inerrância"
                    ],
                    "correctIndex": 0,
                    "reference": "Pacto de Chicago sobre Inerrância Bíblica",
                    "explanation": "A ortodoxia confessa que a Escritura é totalmente verdadeira e sem erro em tudo quanto declara em seus autógrafos.",
                    "xp": 350
                }
            ]
        }
    },
    {
        "id": 2,
        "title": "Epístolas Paulinas II",
        "subtitle": "Gálatas, Efésios, Filipenses e Colossenses",
        "bgScene": {
            "name": "Prisão em Roma e Templo de Éfeso",
            "gradient": "from-indigo-950/80 via-slate-900/90 to-zinc-950",
            "badge": "Epístolas da Prisão",
            "atmosphere": "Cadeias romanas iluminadas por archotes e cartas seladas com o brasão da graça"
        },
        "levels": {
            "basico": [
                {
                    "id": 201,
                    "question": "Qual epístola de Paulo é universalmente conhecida como a 'Carta Magna da Liberdade Cristã'?",
                    "options": ["Gálatas", "Filêmon", "Tito", "Colossenses"],
                    "correctIndex": 0,
                    "reference": "Gálatas 5:1",
                    "explanation": "'Para a liberdade foi que Cristo nos libertou; permanecei firmes e não vos submetais de novo ao jugo da escravidão.'",
                    "xp": 100
                },
                {
                    "id": 202,
                    "question": "Conforme Efésios 2:8-9, qual o fundamento da salvação do crente?",
                    "options": [
                        "A graça mediante a fé, como dom gratuito de Deus, não por obras",
                        "A observância dos mandamentos cerimoniais judaicos",
                        "O mérito pessoal das caridades humanas",
                        "A filiação a um império ou nação poderosa"
                    ],
                    "correctIndex": 0,
                    "reference": "Efésios 2:8-9",
                    "explanation": "A salvação é presente imerecido de Deus para que ninguém se glorie em suas próprias forças.",
                    "xp": 100
                },
                {
                    "id": 203,
                    "question": "Em qual epístola Paulo declara com alegria jubilosa: 'Tudo posso naquele que me fortalece'?",
                    "options": ["Filipenses", "Gálatas", "Efésios", "Romanos"],
                    "correctIndex": 0,
                    "reference": "Filipenses 4:13",
                    "explanation": "Mesmo acorrentado na prisão em Roma, Paulo ensina sobre o contentamento e o poder sustentador de Cristo.",
                    "xp": 100
                }
            ],
            "medio": [
                {
                    "id": 204,
                    "question": "Quais quatro cartas formam o grupo das chamadas 'Epístolas da Prisão' de Paulo?",
                    "options": [
                        "Efésios, Filipenses, Colossenses e Filemom",
                        "Romanos, 1 Coríntios, Gálatas e Tito",
                        "1 e 2 Timóteo, Hebreus e Tiago",
                        "1 e 2 Tessalonicenses, 2 Coríntios e Judas"
                    ],
                    "correctIndex": 0,
                    "reference": "Introdução às Epístolas Paulinas",
                    "explanation": "Paulo redigiu estas 4 cartas sob prisão domiciliar em Roma por volta de 60-62 d.C.",
                    "xp": 200
                },
                {
                    "id": 205,
                    "question": "O cântico da Kénosis (auto-esvaziamento do Filho de Deus) encontra-se em qual passagem?",
                    "options": ["Filipenses 2:5-11", "Efésios 1:3-14", "Gálatas 3:10-14", "Colossenses 3:1-4"],
                    "correctIndex": 0,
                    "reference": "Filipenses 2:6-7",
                    "explanation": "Cristo, subsistindo em forma de Deus, não julgou como usurpação o ser igual a Deus, mas esvaziou-se a Si mesmo.",
                    "xp": 200
                },
                {
                    "id": 206,
                    "question": "Em Colossenses 1:15-18, contra quem Paulo direciona a proclamação da supremacia absoluta de Cristo?",
                    "options": [
                        "Contra heresias sincretistas que reduziam Cristo a uma emanação ou anjo intermediário",
                        "Contra os fariseus de Jerusalém que exigiam o dízimo da hortelã",
                        "Contra o imperador César Nero diretamente",
                        "Contra os pescadores da Galileia"
                    ],
                    "correctIndex": 0,
                    "reference": "Colossenses 1:15; 2:8",
                    "explanation": "Paulo exalta que nEle foram criadas todas as coisas, visíveis e invisíveis, tronos e soberanias.",
                    "xp": 200
                }
            ],
            "avancado": [
                {
                    "id": 207,
                    "question": "No texto grego original de Efésios 1:3-14, que peculiaridade sintática impressiona os exegetas?",
                    "options": [
                        "Consiste em uma única sentença gramatical contínua de louvor à Trindade (202 palavras sem ponto final)",
                        "Foi escrita em versos rimados de métrica alexandrina",
                        "Utiliza aramaico transliterado em caracteres fenícios",
                        "É um diálogo socrático entre Paulo e Timóteo"
                    ],
                    "correctIndex": 0,
                    "reference": "Efésios 1:3-14 - Exegese Grega",
                    "explanation": "É a grande 'Eulogia' paulina louvando a eleição pelo Pai, a redenção pelo Filho e o selo do Espírito Santo.",
                    "xp": 350
                },
                {
                    "id": 208,
                    "question": "Em Gálatas 4:21-31, o que Paulo simboliza alegoricamente por meio de Agar e Sara?",
                    "options": [
                        "A Antiga Aliança legalista da carne (escravidão) versus a Nova Aliança da graça celestial (liberdade)",
                        "A disputa política entre Roma e Alexandria",
                        "A sucessão do sacerdócio levítico para os zelotes",
                        "A profecia sobre a destruição de Babilônia"
                    ],
                    "correctIndex": 0,
                    "reference": "Gálatas 4:24-26",
                    "explanation": "Ismael gerado segundo a carne figura a escravidão da lei; Isaque gerado pela promessa figura os filhos da liberdade.",
                    "xp": 350
                },
                {
                    "id": 209,
                    "question": "O termo 'Stoicheia tou kosmou' em Colossenses 2:8,20 refere-se comumente a quê?",
                    "options": [
                        "Aos rudimentos ou poderes espirituais e cósmicos elementares aos quais os legalistas se curvavam",
                        "Aos quatro elementos da física aristotélica (terra, ar, fogo e água)",
                        "Às moedas de prata emitidas pelo tesouro romano",
                        "Aos códigos de estradas militares da província da Ásia"
                    ],
                    "correctIndex": 0,
                    "reference": "Colossenses 2:8,20 - Teologia Paulina",
                    "explanation": "Paulo adverte os crentes a não se submeterem a ordenanças de espíritos elementares, pois em Cristo habita corporalmente toda a plenitude da Divindade.",
                    "xp": 350
                }
            ]
        }
    },
    {
        "id": 3,
        "title": "Epístolas Paulinas III",
        "subtitle": "1 e 2 Tessalonicenses, 1 e 2 Timóteo, Tito e Filemom",
        "bgScene": {
            "name": "Tessalônica e Porto de Creta",
            "gradient": "from-teal-950/80 via-cyan-950/90 to-zinc-950",
            "badge": "Escatologia e Governo Eclesiástico",
            "atmosphere": "Ventos marítimos no mar Egeu com farol antigo iluminando as cartas apostólicas"
        },
        "levels": {
            "basico": [
                {
                    "id": 301,
                    "question": "Quais epístolas são comumente chamadas de 'Epístolas Pastorais'?",
                    "options": ["1 e 2 Timóteo e Tito", "Romanos e Gálatas", "Filipenses e Colossenses", "Tiago e Judas"],
                    "correctIndex": 0,
                    "reference": "Introdução às Epístolas Pastorais",
                    "explanation": "Foram escritas para instruir pastores e ministros sobre a sã doutrina e o governo da igreja local.",
                    "xp": 100
                },
                {
                    "id": 302,
                    "question": "Em 1 Tessalonicenses 4:16-17, o que Paulo promete que acontecerá aos mortos em Cristo?",
                    "options": [
                        "Ressuscitarão primeiro, antes de os vivos serem arrebatados",
                        "Ficarão esquecidos no sono perpétuo",
                        "Serão reencarnados em novas gerações",
                        "Não participarão das bodas celestiais"
                    ],
                    "correctIndex": 0,
                    "reference": "1 Tessalonicenses 4:16-17",
                    "explanation": "'Os que morreram em Cristo ressuscitarão primeiro; depois nós, os que ficarmos vivos, seremos arrebatados juntamente com eles nas nuvens.'",
                    "xp": 100
                },
                {
                    "id": 303,
                    "question": "Quem era Onésimo na comovente carta pessoal de Paulo a Filemom?",
                    "options": [
                        "Um escravo fugitivo que se converteu a Cristo e foi devolvido como irmão amado",
                        "O bispo de Corinto",
                        "Um soldado romano que guardava a prisão Mamertina",
                        "Um comerciante de púrpura em Filipos"
                    ],
                    "correctIndex": 0,
                    "reference": "Filemom 1:10-16",
                    "explanation": "Paulo pede a Filemom que acolha Onésimo como acolheria ao próprio apóstolo.",
                    "xp": 100
                }
            ],
            "medio": [
                {
                    "id": 304,
                    "question": "Em 2 Tessalonicenses 2:3, que dois acontecimentos devem preceder o Dia do Senhor?",
                    "options": [
                        "A apostasia geral e a revelação do homem do pecado (filho da perdição)",
                        "A reconstrução do palácio de Babilônia e a queima de Roma",
                        "O retorno de Elias em carne e o eclipse total de um ano",
                        "A coroação de um novo César na Galácia"
                    ],
                    "correctIndex": 0,
                    "reference": "2 Tessalonicenses 2:3-4",
                    "explanation": "Paulo desfaz o engano de que o Dia do Senhor já havia chegado, expondo os marcos proféticos.",
                    "xp": 200
                },
                {
                    "id": 305,
                    "question": "Em 1 Timóteo 3, qual virtude moral encabeça a lista de exigências para os bispos/presbíteros?",
                    "options": [
                        "Ser irrepreensível, esposo de uma só mulher e moderado",
                        "Ser muito rico e proprietário de terras",
                        "Ter formação filosófica em Atenas",
                        "Ser celibatário e viver em caverna"
                    ],
                    "correctIndex": 0,
                    "reference": "1 Timóteo 3:1-7",
                    "explanation": "O caráter moral, testemunho familiar e maturidade espiritual são a base bíblica da liderança.",
                    "xp": 200
                },
                {
                    "id": 306,
                    "question": "Qual foi a última carta inspirada escrita por Paulo momentos antes do seu martírio?",
                    "options": ["2 Timóteo", "Tito", "Gálatas", "Filêmon"],
                    "correctIndex": 0,
                    "reference": "2 Timóteo 4:6-8",
                    "explanation": "'Combati o bom combate, completei a carreira, guardei a fé. Já agora a coroa da justiça me está guardada.'",
                    "xp": 200
                }
            ],
            "avancado": [
                {
                    "id": 307,
                    "question": "Qual a interpretação teológica do 'Detentor' (ho katechōn) em 2 Tessalonicenses 2:6-7?",
                    "options": [
                        "O Espírito Santo operando através da Igreja na Terra contendo o mistério da injustiça",
                        "O Senado Romano e o imperador Cláudio",
                        "O anjo Miguel guardando a porta do Hades",
                        "A filosofia grega de Platão"
                    ],
                    "correctIndex": 0,
                    "reference": "2 Tessalonicenses 2:6-7 - Teologia Escatológica",
                    "explanation": "A pneumatologia clássica vê no Espírito Santo a força divina que detém o avanço total do anticristo até o arrebatamento.",
                    "xp": 350
                },
                {
                    "id": 308,
                    "question": "A regra de Granville Sharp aplicada a Tito 2:13 ('nosso grande Deus e Salvador Cristo Jesus') comprova o quê?",
                    "options": [
                        "A divindade absoluta de Jesus Cristo compartilhando o mesmo artigo grego com o termo Deus",
                        "A existência de dois deuses distintos na teologia paulina",
                        "A dependência de Tito em relação às leis romanas",
                        "A negação da ressurreição corporal de Cristo"
                    ],
                    "correctIndex": 0,
                    "reference": "Tito 2:13 - Sintaxe Grega Neotestamentária",
                    "explanation": "Dois substantivos pessoais unidos por 'kai' com artigo apenas antes do primeiro referem-se à mesma pessoa: Jesus é nosso grande Deus e Salvador.",
                    "xp": 350
                },
                {
                    "id": 309,
                    "question": "Em Tito 1:5, por que Paulo deixou Tito especificamente na ilha de Creta?",
                    "options": [
                        "Para pôr em boa ordem as coisas que restavam e constituir presbíteros de cidade em cidade",
                        "Para construir o primeiro mosteiro cristão no Mediterrâneo",
                        "Para arrecadar ouro para a campanha missionária na Espanha",
                        "Para confrontar o imperador romano em tribunal aberto"
                    ],
                    "correctIndex": 0,
                    "reference": "Tito 1:5",
                    "explanation": "A ordem eclesial e a escolha de líderes fiéis eram indispensáveis contra os mestres judaizantes insubordinados.",
                    "xp": 350
                }
            ]
        }
    }
]

print("Script template ready")

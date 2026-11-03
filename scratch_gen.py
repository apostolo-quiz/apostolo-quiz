# -*- coding: utf-8 -*-
import json

modules_data = [
    {
        "id": 1,
        "title": "Bibliologia",
        "subtitle": "Inspiração, Inerrância e Cânon das Sagradas Escrituras",
        "bgScene": {
            "name": "Monte Sinai e as Tábuas da Lei",
            "gradient": "from-amber-950/80 via-stone-900/90 to-zinc-950",
            "themeColor": "#eab308",
            "atmosphere": "Luz celestial descendo sobre rochas milenares e pergaminhos sagrados"
        },
        "levels": {
            "basico": [
                {
                    "id": 101,
                    "question": "Quantos livros compõem o cânon bíblico protestante (Antigo e Novo Testamento)?",
                    "options": ["66 livros", "73 livros", "70 livros", "60 livros"],
                    "correctIndex": 0,
                    "reference": "Bibliologia - Cânon Bíblico (39 AT + 27 NT)",
                    "explanation": "A Bíblia protestante contém 66 livros: 39 no Antigo Testamento e 27 no Novo Testamento.",
                    "xp": 100
                },
                {
                    "id": 102,
                    "question": "Em quais idiomas originais os manuscritos bíblicos foram redigidos?",
                    "options": ["Hebraico, Aramaico e Grego", "Latim, Grego e Hebraico", "Aramaico, Siríaco e Latim", "Apenas Hebraico e Latim"],
                    "correctIndex": 0,
                    "reference": "2 Timóteo 3:16 / Bibliologia Cap. 1",
                    "explanation": "O Antigo Testamento foi escrito em hebraico e porções em aramaico; o Novo Testamento em grego coinê.",
                    "xp": 100
                },
                {
                    "id": 103,
                    "question": "Qual o significado da palavra grega 'Theopneustos' presente em 2 Timóteo 3:16?",
                    "options": ["Inspirada por Deus (soprada por Deus)", "Livro sagrado dos homens", "História dos profetas", "Tradição dos anciãos"],
                    "correctIndex": 0,
                    "reference": "2 Timóteo 3:16",
                    "explanation": "'Toda a Escritura é divinamente inspirada' - do grego theos (Deus) e pneuma (sopro/espírito).",
                    "xp": 100
                }
            ],
            "medio": [
                {
                    "id": 104,
                    "question": "O que foi a Septuaginta (LXX)?",
                    "options": [
                        "A tradução do Antigo Testamento hebraico para o grego em Alexandria",
                        "A primeira edição impressa por Gutenberg",
                        "A tradução latina feita por Jerônimo",
                        "O concílio que definiu as 70 leis judaicas"
                    ],
                    "correctIndex": 0,
                    "reference": "Bibliologia - História das Versões",
                    "explanation": "A Septuaginta foi a tradução do AT do hebraico para o grego coinê por 72 sábios judeus no séc. III a.C.",
                    "xp": 200
                },
                {
                    "id": 105,
                    "question": "Qual a diferença teológica entre revelação, inspiração e iluminação?",
                    "options": [
                        "Revelação comunica a verdade; inspiração registra com autoridade; iluminação concede compreensão ao leitor",
                        "Inspiração é para hoje; revelação é dos apóstolos; iluminação é apenas para pastores",
                        "Não há diferença, são termos sinônimos",
                        "Revelação é para o leitor; iluminação é para os profetas"
                    ],
                    "correctIndex": 0,
                    "reference": "1 Coríntios 2:10-14",
                    "explanation": "A revelação desvenda o que estava oculto; a inspiração garante a integridade escrita; a iluminação pelo Espírito capacita a compreensão.",
                    "xp": 200
                },
                {
                    "id": 106,
                    "question": "O que caracteriza os chamados 'Manuscritos do Mar Morto' descobertos em Qumran (1947)?",
                    "options": [
                        "Manuscritos bíblicos do séc. III a.C. a I d.C. que confirmaram a extraordinária precisão do texto massorético",
                        "Evangelhos apócrifos gnósticos do século IV",
                        "Textos legislativos romanos sobre a crucificação",
                        "Traduções latinas medievais"
                    ],
                    "correctIndex": 0,
                    "reference": "Bibliologia - Crítica Textual",
                    "explanation": "Os rolos de Qumran continham cópias de quase todo o AT mil anos mais antigas que os códices existentes, comprovando sua fidelidade.",
                    "xp": 200
                }
            ],
            "avancado": [
                {
                    "id": 107,
                    "question": "Na Crítica Textual do Novo Testamento, quais são as três principais famílias de manuscritos gregos?",
                    "options": [
                        "Alexandrina, Ocidental e Bizantina (Majoritária)",
                        "Romana, Constantinopolitana e Antioquena",
                        "Hierosolimitana, Síria e Samaritana",
                        "Vulgata, Textus Receptus e Sinaítico"
                    ],
                    "correctIndex": 0,
                    "reference": "Bibliologia Avançada - Crítica Textual",
                    "explanation": "O Texto Alexandrino (Códice Sinaítico e Vaticano), o Ocidental (Códice Bezae) e o Bizantino/Majoritário formam a base dos estudos textuais modernos.",
                    "xp": 350
                },
                {
                    "id": 108,
                    "question": "Qual o critério teológico e eclesiástico fundamental adotado pelos concílios de Hipona (393) e Cartago (397) para o Cânon do NT?",
                    "options": [
                        "Apostolicidade, ortodoxia doutrinária, antiguidade e aceitação universal pelas igrejas",
                        "Imposição do imperador romano Constantino",
                        "Número de cópias vendidas na Ásia Menor",
                        "Decisão unilateral do bispo de Roma"
                    ],
                    "correctIndex": 0,
                    "reference": "História do Cânon Neotestamentário",
                    "explanation": "O Cânon reconheceu apenas livros com conexão apostólica direta, harmonia com a 'regula fidei' e recepção unânime nas congregações.",
                    "xp": 350
                },
                {
                    "id": 109,
                    "question": "Qual a distinção dogmática entre 'Inerrância Bíblica Estrita' e 'Inerrância Limitada' segundo o Pacto de Chicago (1978)?",
                    "options": [
                        "A inerrância plena defende a veracidade total dos autógrafos originais em fé, prática, dados históricos e geográficos",
                        "A inerrância limita-se a fábulas morais sem valor factual",
                        "A inerrância diz respeito apenas ao Novo Testamento",
                        "O Pacto de Chicago rejeitou a doutrina da inspiração plenária verbal"
                    ],
                    "correctIndex": 0,
                    "reference": "Declaração de Chicago sobre a Inerrância Bíblica",
                    "explanation": "A ortodoxia histórica sustenta a inerrância verbal e plenária em tudo o que os autógrafos originais ensinam e afirmam.",
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
            "name": "Prisão Romana e Éfeso Antiga",
            "gradient": "from-indigo-950/80 via-slate-900/90 to-zinc-950",
            "themeColor": "#6366f1",
            "atmosphere": "Salão romano com tochas, grades de prisão e cartas com selo de cera imperial"
        },
        "levels": {
            "basico": [
                {
                    "id": 201,
                    "question": "Qual das seguintes epístolas paulinas é chamada de 'A Carta da Liberdade Cristã'?",
                    "options": ["Gálatas", "Filêmon", "Tito", "1 Tessalonicenses"],
                    "correctIndex": 0,
                    "reference": "Gálatas 5:1",
                    "explanation": "Gálatas defende vigorosamente a justificação pela fé somente, sem o jugo da lei cerimonial mosaica.",
                    "xp": 100
                },
                {
                    "id": 202,
                    "question": "Segundo Efésios 2:8-9, como somos salvos?",
                    "options": ["Pela graça, por meio da fé, e isto não vem de nós, é dom de Deus", "Pelas boas obras e penitências", "Pela guarda estrita da lei mosaica", "Pelo mérito de nossa linhagem familiar"],
                    "correctIndex": 0,
                    "reference": "Efésios 2:8-9",
                    "explanation": "A salvação é inteiramente um presente imerecido (graça) recebido mediante a fé em Jesus Cristo.",
                    "xp": 100
                },
                {
                    "id": 203,
                    "question": "Em qual epístola Paulo escreve: 'Alegrai-vos sempre no Senhor; outra vez digo, alegrai-vos'?",
                    "options": ["Filipenses", "Gálatas", "Colossenses", "Romanos"],
                    "correctIndex": 0,
                    "reference": "Filipenses 4:4",
                    "explanation": "Filipenses é conhecida como a 'Epístola da Alegria', escrita mesmo enquanto Paulo estava preso em Roma.",
                    "xp": 100
                }
            ],
            "medio": [
                {
                    "id": 204,
                    "question": "Quais são as quatro epístolas paulinas conhecidas conjuntamente como 'Epístolas da Prisão'?",
                    "options": ["Efésios, Filipenses, Colossenses e Filemom", "Romanos, 1 Coríntios, Gálatas e Tito", "1 e 2 Timóteo, Hebreus e Tiago", "1 e 2 Tessalonicenses, 2 Coríntios e Judas"],
                    "correctIndex": 0,
                    "reference": "Epístolas Paulinas II - Introdução",
                    "explanation": "Paulo redigiu estas quatro cartas durante sua primeira prisão em Roma sob custódia militar (c. 60-62 d.C.).",
                    "xp": 200
                },
                {
                    "id": 205,
                    "question": "O famoso hino da 'Kénosis' (esvaziamento de Cristo) encontra-se em qual passagem bíblica?",
                    "options": ["Filipenses 2:5-11", "Efésios 1:3-14", "Gálatas 3:10-14", "Colossenses 3:1-4"],
                    "correctIndex": 0,
                    "reference": "Filipenses 2:7",
                    "explanation": "O termo grego 'ekénosen' descreve que Jesus, subsistindo em forma de Deus, esvaziou a Si mesmo assumindo a forma de servo.",
                    "xp": 200
                },
                {
                    "id": 206,
                    "question": "Em Colossenses 1:15-18, Paulo refuta a heresia colossense afirmando que Cristo é:",
                    "options": [
                        "A imagem do Deus invisível, o primogênito de toda a criação e a cabeça da Igreja",
                        "Um anjo superior ou emanação divina intermediária",
                        "Apenas um mestre moral perfeito",
                        "Uma segunda divindade subordinada"
                    ],
                    "correctIndex": 0,
                    "reference": "Colossenses 1:15-18",
                    "explanation": "Paulo rebate o pré-gnosticismo reafirmando a supremacia absoluta e divindade plena do Filho Criador e Redentor.",
                    "xp": 200
                }
            ],
            "avancado": [
                {
                    "id": 207,
                    "question": "Em Efésios 1:3-14, a estrutura gramatical no grego original apresenta uma característica ímpar:",
                    "options": [
                        "Trata-se de uma única e grandiosa oração contínua de louvor à Trindade (Eulogia) do versículo 3 ao 14",
                        "Um poema hebraico com acróstico alfabético",
                        "Um diálogo dialético no estilo socrático",
                        "Uma série de decretos jurídicos romanos"
                    ],
                    "correctIndex": 0,
                    "reference": "Efésios 1:3-14 - Exegese Grega",
                    "explanation": "No texto grego, Efésios 1:3-14 é uma única sentença magistral de 202 palavras exaltando o Pai, o Filho e o Espírito Santo.",
                    "xp": 350
                },
                {
                    "id": 208,
                    "question": "Qual era a natureza exata da 'Heresia Colossense' combatida por Paulo em Colossenses 2:8-23?",
                    "options": [
                        "Um sincretismo religioso combinando misticismo judaico legalista, adoração de anjos e especulações filosóficas pré-gnósticas",
                        "O arianismo que negava a divindade do Logos",
                        "O pelagianismo que rejeitava o pecado original",
                        "O docetismo radical que negava a ressurreição corporal"
                    ],
                    "correctIndex": 0,
                    "reference": "Colossenses 2:8; 2:18",
                    "explanation": "A ameaça em Colossos envolvia ascetismo rigoroso, culto aos anjos (elementos cósmicos 'stoicheia') e ritos judaizantes.",
                    "xp": 350
                },
                {
                    "id": 209,
                    "question": "Em Gálatas 4:21-31, Paulo utiliza a alegoria de Agar e Sara para contrastar:",
                    "options": [
                        "A Antiga Aliança (escravidão da Lei no Sinai) versus a Nova Aliança (liberdade da Graça na Jerusalém celestial)",
                        "A igreja gentílica contra a igreja de Roma",
                        "O ministério de Pedro contra o de Tiago",
                        "O sacerdócio levítico contra a linhagem de Melquisedeque"
                    ],
                    "correctIndex": 0,
                    "reference": "Gálatas 4:24-26",
                    "explanation": "Paulo contrasta a descendência segundo a carne (escravos da lei) com os filhos da promessa nascidos segundo o Espírito.",
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
            "name": "Tróade e a Macedônia ao Entardecer",
            "gradient": "from-teal-950/80 via-cyan-950/90 to-zinc-950",
            "themeColor": "#14b8a6",
            "atmosphere": "Porto marítimo mediterrâneo ao pôr do sol com navios mercantes e lanternas a óleo"
        },
        "levels": {
            "basico": [
                {
                    "id": 301,
                    "question": "Quais cartas são tradicionalmente classificadas como 'Epístolas Pastorais'?",
                    "options": ["1 Timóteo, 2 Timóteo e Tito", "1 e 2 Coríntios e Gálatas", "Filipenses, Filemom e Colossenses", "Romanos e Hebreus"],
                    "correctIndex": 0,
                    "reference": "Introdução às Pastorais",
                    "explanation": "São chamadas pastorais por orientarem obreiros (Timóteo e Tito) na liderança, disciplina e ordem eclesial.",
                    "xp": 100
                },
                {
                    "id": 302,
                    "question": "Em 1 Tessalonicenses 4:16-17, que grande evento escatológico é anunciado por Paulo?",
                    "options": ["O arrebatamento da Igreja com a descida do Senhor e a ressurreição dos mortos em Cristo", "A destruição final do templo de Herodes", "A queda do Império Babilônico", "O julgamento das nações pagãs em Roma"],
                    "correctIndex": 0,
                    "reference": "1 Tessalonicenses 4:16-17",
                    "explanation": "Paulo ensina que o próprio Senhor descerá com alarido, voz de arcanjo e trombeta de Deus.",
                    "xp": 100
                },
                {
                    "id": 303,
                    "question": "Quem era Onésimo na epístola a Filemom?",
                    "options": ["Um escravo fugitivo que se converteu a Cristo através do ministério de Paulo na prisão", "O pastor da congregação em Roma", "Um soldado romano que guardava Paulo", "Um apóstolo enviado à Espanha"],
                    "correctIndex": 0,
                    "reference": "Filemom 1:10-16",
                    "explanation": "Paulo intercede por Onésimo, pedindo que Filemom o receba não mais como escravo, mas como irmão amado.",
                    "xp": 100
                }
            ],
            "medio": [
                {
                    "id": 304,
                    "question": "Em 2 Tessalonicenses 2:3-8, que figura escatológica se manifestará antes do Dia do Senhor?",
                    "options": ["O homem do pecado, o filho da perdição (o iníquo)", "O profeta Elias ressuscitado", "O imperador Ciro da Pérsia", "Um anjo celestial de ouro"],
                    "correctIndex": 0,
                    "reference": "2 Tessalonicenses 2:3",
                    "explanation": "A apostasia precederá a revelação do anticristo, o qual o Senhor Jesus desfará pelo assopro de Sua boca.",
                    "xp": 200
                },
                {
                    "id": 305,
                    "question": "Quais são as qualificações essenciais para o ministério pastoral destacadas em 1 Timóteo 3 e Tito 1?",
                    "options": [
                        "Irrepreensível, marido de uma só mulher, temperante, sóbrio, hospitaleiro e apto para ensinar",
                        "Eloquência oratória, alta riqueza material e prestígio político",
                        "Ascetismo extremo, voto de pobreza e isolamento monástico",
                        "Nenhuma qualificação moral é exigida além de ser membro batizado"
                    ],
                    "correctIndex": 0,
                    "reference": "1 Timóteo 3:1-7 / Tito 1:5-9",
                    "explanation": "A Bíblia enfatiza prioritariamente o caráter moral ilibado, fidelidade conjugal e testemunho na família e na sociedade.",
                    "xp": 200
                },
                {
                    "id": 306,
                    "question": "Qual foi a última carta redigida pelo apóstolo Paulo antes do seu martírio em Roma?",
                    "options": ["2 Timóteo", "Tito", "Gálatas", "Filêmon"],
                    "correctIndex": 0,
                    "reference": "2 Timóteo 4:6-8",
                    "explanation": "Em 2 Timóteo 4:7 Paulo pronuncia seu memorável testamento espiritual: 'Combati o bom combate, acabei a carreira, guardei a fé'.",
                    "xp": 200
                }
            ],
            "avancado": [
                {
                    "id": 307,
                    "question": "O que representa o misterioso 'detentor' (ho katechōn / to katechon) mencionado em 2 Tessalonicenses 2:6-7?",
                    "options": [
                        "O poder restritor e a presença operante do Espírito Santo na Igreja na terra contendo o avanço da iniquidade",
                        "O exército do imperador Nero",
                        "A filosofia grega estóica",
                        "A lei oral farisaica de Jerusalém"
                    ],
                    "correctIndex": 0,
                    "reference": "2 Tessalonicenses 2:6-7 - Exegese Teológica",
                    "explanation": "A interpretação pneumatológica majoritária identifica a ação do Espírito Santo através da Igreja como a força que restringe a manifestação total do iníquo.",
                    "xp": 350
                },
                {
                    "id": 308,
                    "question": "Na teologia de Tito 2:13, a regra gramatical de Granville Sharp confirma qual verdade cristológica?",
                    "options": [
                        "Que 'nosso grande Deus e Salvador' se refere exclusivamente a uma única pessoa divina: Jesus Cristo",
                        "Que Deus Pai e Jesus são divindades distintas de graus diferentes",
                        "Que a salvação futura dependerá de novas revelações angelicais",
                        "Que a graça divina é anulada pelos mandamentos humanos"
                    ],
                    "correctIndex": 0,
                    "reference": "Tito 2:13 - Teologia Bíblica",
                    "explanation": "A construção com um único artigo no grego (tou megalou theou kai sōtēros hēmōn) afirma explicitamente a plena divindade de Cristo.",
                    "xp": 350
                },
                {
                    "id": 309,
                    "question": "Em 1 Timóteo 2:5, a unicidade da mediação de Cristo ('há um só Mediador entre Deus e os homens') refuta qual concepção eclesiológica?",
                    "options": [
                        "A necessidade de mediadores humanos, santos intercessores ou castas sacerdotais para acesso ao Pai",
                        "A existência de oração de intercessão fraterna na igreja",
                        "O ministério dos diáconos e presbíteros locais",
                        "A disciplina bíblica congregacional"
                    ],
                    "correctIndex": 0,
                    "reference": "1 Timóteo 2:5",
                    "explanation": "Cristo Jesus homem é o único pontífice absoluto cuja obra na cruz abriu o véu para todos os remidos.",
                    "xp": 350
                }
            ]
        }
    }
]

print(f"Base modules initialized: {len(modules_data)}")

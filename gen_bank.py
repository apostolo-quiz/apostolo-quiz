# -*- coding: utf-8 -*-
"""
Gerador Completo de Questões para os 27 Módulos Teológicos
- 12 questões por nível (Básico, Médio, Avançado) = 36 questões por módulo
- 4 opções no Básico (A-D)
- 6 opções no Médio (A-F)
- 8 opções no Avançado (A-H)
- correctIndex distribuído entre todas as opções (NUNCA fixo em A!)
- Fundo de 30% para premiações no nível avançado
"""

import json, random

random.seed(42)

MODULE_TITLES = [
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

def make_question(q_id, question_text, correct_opt, wrong_opts, target_count, reference, explanation, xp):
    # Pega alternativas incorretas suficientes
    needed_wrongs = target_count - 1
    selected_wrongs = wrong_opts[:needed_wrongs]
    while len(selected_wrongs) < needed_wrongs:
        selected_wrongs.append(f"Concepção secundária alternativa {len(selected_wrongs)+1}")
    
    # Monta lista de opções e embaralha de forma determinística mas variando o índice correto
    all_opts = [correct_opt] + selected_wrongs
    # Escolhe um índice alvo variado baseado no ID da questão
    target_idx = (q_id * 7 + 3) % target_count
    
    # Move a correta para target_idx
    options = all_opts[1:]
    options.insert(target_idx, correct_opt)
    
    return {
        "id": q_id,
        "question": question_text,
        "options": options,
        "correctIndex": target_idx,
        "reference": reference,
        "explanation": explanation,
        "xp": xp
    }

print("Iniciando gerador massivo...")

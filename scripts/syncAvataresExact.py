import os
import shutil

AVATARES_DIR = r'avatares'
PUB_DIR = r'apostolos-quiz\public'

os.makedirs(PUB_DIR, exist_ok=True)

# Mapeamento estrito 1-para-1 dos arquivos do usuário na pasta Avatares
USER_FILES_MAP = {
    # PARDO
    'avatar_pardo_masc_crianca.jpg': ['criança parda.jpeg', 'criana parda.jpeg'],
    'avatar_pardo_fem_crianca.jpg':   ['menina parda.jpeg'],
    'avatar_pardo_masc_adulto.jpg':  ['Pardo.jpeg'],
    'avatar_pardo_fem_adulto.jpg':   ['Parda.jpg'],
    'avatar_pardo_masc_idoso.jpg':   ['idoso pardo.jpeg'],
    'avatar_pardo_fem_idoso.jpg':    ['idosa parda.jpeg'],
    
    # BRANCO
    'avatar_branco_masc_crianca.jpg': ['menino branco.jpg'],
    'avatar_branco_fem_crianca.jpg':   ['menina branca.jpg'],
    'avatar_branco_masc_adulto.jpg':  ['branco.jpeg'],
    'avatar_branco_fem_adulto.jpg':   ['branca.jpeg'],
    'avatar_branco_masc_idoso.jpg':   ['idoso branco.jpg'],
    'avatar_branco_fem_idoso.jpg':    ['idosa branca.jpg'],
    
    # PRETO
    'avatar_preto_masc_crianca.jpg':  ['menino preto.jpg'],
    'avatar_preto_fem_crianca.jpg':   ['menina preta.jpeg'],
    'avatar_preto_masc_adulto.jpg':   ['Preto.jpeg'],
    'avatar_preto_fem_adulto.jpg':    ['Preta.jpeg'],
    'avatar_preto_masc_idoso.jpg':    ['idoso preto.jpeg'],
    'avatar_preto_fem_idoso.jpg':     ['idosa preta.jpeg'],
    
    # INDÍGENA
    'avatar_indigena_masc_crianca.jpg': ['menino indigena.jpeg'],
    'avatar_indigena_fem_crianca.jpg':   ['menina indigena.jpeg'],
    'avatar_indigena_masc_adulto.jpg':  ['indigena homem.jpeg'],
    'avatar_indigena_fem_adulto.jpg':   ['indigena.jpg'],
    'avatar_indigena_masc_idoso.jpg':   ['idoso indigena.jpeg'],
    'avatar_indigena_fem_idoso.jpg':    ['idosa indigena.jpeg'],
    
    # AMARELO / ASIÁTICO
    'avatar_amarelo_masc_crianca.jpg':  ['menino asiatico.jpeg'],
    'avatar_amarelo_fem_crianca.jpg':   ['menina asiatica.jpeg'],
    'avatar_amarelo_masc_adulto.jpg':   ['asiatico.jpg'],
    'avatar_amarelo_fem_adulto.jpg':    ['mulher asiatica.jpeg', 'asiatica.jpg'],
    'avatar_amarelo_fem_idoso.jpg':     ['idosa asiatica.jpeg'],
}

all_files = os.listdir(AVATARES_DIR)

print("=== COPIANDO EXATAMENTE OS AVATARES DA PASTA AVATARES ===")
for target_name, candidates in USER_FILES_MAP.items():
    found = False
    for cand in candidates:
        for f in all_files:
            if f.lower() == cand.lower():
                src = os.path.join(AVATARES_DIR, f)
                dst = os.path.join(PUB_DIR, target_name)
                shutil.copy2(src, dst)
                print(f'[OK] {f} -> {target_name} ({os.path.getsize(dst)} bytes)')
                found = True
                break
        if found:
            break
    if not found:
        print(f'[AVISO] Não encontrado: {candidates}')

# Idoso Asiático Masculino
idoso_asiatico_src = os.path.join(PUB_DIR, 'avatar_amarelo_masc_idoso.jpg')
if os.path.exists(idoso_asiatico_src):
    shutil.copy2(idoso_asiatico_src, os.path.join(AVATARES_DIR, 'idoso asiatico.jpeg'))
    print('[OK] idoso asiatico.jpeg sincronizado na pasta avatares')

# JOVENS (Criados especificamente para suprir os jovens faltantes com o mesmo padrão e traços)
jovens_map = {
    'jovem pardo.jpg':            'avatar_pardo_masc_jovem.jpg',
    'jovem parda.jpg':            'avatar_pardo_fem_jovem.jpg',
    'jovem branco.jpg':           'avatar_branco_masc_jovem.jpg',
    'jovem branca.jpg':           'avatar_branco_fem_jovem.jpg',
    'jovem preto.jpg':            'avatar_preto_masc_jovem.jpg',
    'jovem preta.jpg':            'avatar_preto_fem_jovem.jpg',
    'jovem indigena homem.jpg':   'avatar_indigena_masc_jovem.jpg',
    'jovem indigena mulher.jpg':  'avatar_indigena_fem_jovem.jpg',
    'jovem asiatico.jpg':         'avatar_amarelo_masc_jovem.jpg',
    'jovem asiatica.jpg':         'avatar_amarelo_fem_jovem.jpg'
}

for ava_name, pub_name in jovens_map.items():
    pub_path = os.path.join(PUB_DIR, pub_name)
    ava_path = os.path.join(AVATARES_DIR, ava_name)
    if os.path.exists(pub_path):
        shutil.copy2(pub_path, ava_path)
        print(f'[JOVEM] {ava_name} sincronizado em avatares e public ({os.path.getsize(pub_path)} bytes)')

# Avatares genéricos padrão
pardo_masc = os.path.join(AVATARES_DIR, 'Pardo.jpeg')
parda_fem = os.path.join(AVATARES_DIR, 'Parda.jpg')
if os.path.exists(pardo_masc):
    shutil.copy2(pardo_masc, os.path.join(PUB_DIR, 'avatar_masculino.jpg'))
    shutil.copy2(pardo_masc, os.path.join(PUB_DIR, 'avatar_irmao_casual.jpg'))
if os.path.exists(parda_fem):
    shutil.copy2(parda_fem, os.path.join(PUB_DIR, 'avatar_feminino.jpg'))
    shutil.copy2(parda_fem, os.path.join(PUB_DIR, 'avatar_irma_casual.jpg'))

print("=== SINCRONIZAÇÃO COMPLETA COM SUCESSO! ===")

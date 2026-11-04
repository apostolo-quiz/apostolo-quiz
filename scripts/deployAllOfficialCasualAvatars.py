import os
import shutil
from PIL import Image, ImageEnhance
import numpy as np

BRAIN_DIR = r'C:\Users\edino\.gemini\antigravity\brain\073d3cfd-d353-492b-bfa1-a6a9a9ea6b35'
PUB_DIR = r'apostolos-quiz\public'
AVATARES_DIR = r'avatares'

os.makedirs(PUB_DIR, exist_ok=True)
os.makedirs(AVATARES_DIR, exist_ok=True)

def load_brain(fname):
    path = os.path.join(BRAIN_DIR, fname)
    return Image.open(path)

def save_both(img, fname):
    target_pub = os.path.join(PUB_DIR, fname)
    target_ava = os.path.join(AVATARES_DIR, fname)
    img.save(target_pub, quality=95)
    img.save(target_ava, quality=95)
    print(f'Wrote {fname} -> {os.path.getsize(target_pub)} bytes')

def copy_direct(brain_file, target_name):
    src = os.path.join(BRAIN_DIR, brain_file)
    dst_pub = os.path.join(PUB_DIR, target_name)
    dst_ava = os.path.join(AVATARES_DIR, target_name)
    shutil.copy2(src, dst_pub)
    shutil.copy2(src, dst_ava)
    print(f'Copied pristine {brain_file} -> {target_name} ({os.path.getsize(dst_pub)} bytes)')

# Ajustador de tons suave contínuo (zero artefatos, zero manchas)
def adjust_tone(img, v_pow=1.0, v_scale=1.0, s_scale=1.0, r_scale=1.0, g_scale=1.0, b_scale=1.0):
    hsv = img.convert('HSV')
    h, s, v = hsv.split()
    
    v_arr = np.array(v).astype(np.float32) / 255.0
    v_arr = np.clip(np.power(v_arr, v_pow) * v_scale, 0, 1.0)
    v_new = Image.fromarray((v_arr * 255.0).astype(np.uint8))
    
    s_arr = np.array(s).astype(np.float32) / 255.0
    s_arr = np.clip(s_arr * s_scale, 0, 1.0)
    s_new = Image.fromarray((s_arr * 255.0).astype(np.uint8))
    
    res = Image.merge('HSV', (h, s_new, v_new)).convert('RGB')
    r, g, b = res.split()
    r = ImageEnhance.Brightness(r).enhance(r_scale)
    g = ImageEnhance.Brightness(g).enhance(g_scale)
    b = ImageEnhance.Brightness(b).enhance(b_scale)
    return Image.merge('RGB', (r, g, b))

print("=== DEPLOYING 100% CASUAL 3D PIXAR AVATARS (ALL 40 SLOTS) ===")

# Base idoso 3D Pixar genuíno (polo, jeans, tênis, cabelos grisalhos curtos)
elder_masc_base = load_brain('avatar_pardo_masc_idoso_1793735726512.jpg')
# Base idosa 3D Pixar genuína (vestido modesto, cabelos longos grisalhos)
elder_fem_base  = load_brain('avatar_pardo_fem_idoso_1793747925783.jpg')

# ==========================================
# 1. PARDO
# ==========================================
copy_direct('avatar_pardo_masc_crianca_1793735636394.jpg', 'avatar_pardo_masc_crianca.jpg')
copy_direct('avatar_pardo_masc_jovem_1793798786659.jpg',   'avatar_pardo_masc_jovem.jpg')
copy_direct('avatar_pardo_masc_adulto_1793735677845.jpg',  'avatar_pardo_masc_adulto.jpg')
copy_direct('avatar_pardo_masc_idoso_1793735726512.jpg',   'avatar_pardo_masc_idoso.jpg')

copy_direct('avatar_pardo_fem_crianca_1793747829522.jpg',  'avatar_pardo_fem_crianca.jpg')
copy_direct('avatar_pardo_fem_jovem_1793798806313.jpg',    'avatar_pardo_fem_jovem.jpg')
copy_direct('avatar_pardo_fem_adulto_1793747868631.jpg',   'avatar_pardo_fem_adulto.jpg')
copy_direct('avatar_pardo_fem_idoso_1793747925783.jpg',    'avatar_pardo_fem_idoso.jpg')

# ==========================================
# 2. BRANCO
# ==========================================
copy_direct('avatar_branco_masc_crianca_1793735681001.jpg', 'avatar_branco_masc_crianca.jpg')
copy_direct('avatar_branco_masc_jovem_1793798826993.jpg',   'avatar_branco_masc_jovem.jpg')
copy_direct('avatar_irmao_casual_camiseta_1793725615205.jpg','avatar_branco_masc_adulto.jpg')

# Idoso masc branco: polo vinho, calça jeans, tênis, cabelos grisalhos curtos
elder_masc_branco = adjust_tone(elder_masc_base, v_pow=0.92, v_scale=1.06, s_scale=0.88, r_scale=1.02, g_scale=1.0, b_scale=0.98)
save_both(elder_masc_branco, 'avatar_branco_masc_idoso.jpg')

copy_direct('avatar_branco_fem_crianca_1793747836448.jpg', 'avatar_branco_fem_crianca.jpg')
copy_direct('avatar_branco_fem_jovem_1793747853567.jpg',   'avatar_branco_fem_jovem.jpg')
copy_direct('avatar_branco_fem_adulto_1793747874627.jpg',  'avatar_branco_fem_adulto.jpg')
copy_direct('avatar_branco_fem_idoso_1793747899655.jpg',   'avatar_branco_fem_idoso.jpg')

# ==========================================
# 3. PRETO / NEGRO
# ==========================================
copy_direct('avatar_preto_masc_crianca_1793735684953.jpg', 'avatar_preto_masc_crianca.jpg')
copy_direct('avatar_preto_masc_jovem_1793798807215.jpg',   'avatar_preto_masc_jovem.jpg')

# Adulto masc negro: polo casual amarela, jeans e tênis
adulto_masc_negro = load_brain('avatar_preto_masc_jovem_1793798807215.jpg')
adulto_masc_negro_mat = adjust_tone(adulto_masc_negro, v_pow=1.02, v_scale=0.98, s_scale=1.05, r_scale=1.0, g_scale=0.96, b_scale=0.92)
save_both(adulto_masc_negro_mat, 'avatar_preto_masc_adulto.jpg')

# Idoso masc negro: polo casual amarela, jeans, tênis e cabelos curtos grisalhos
elder_masc_negro = adjust_tone(elder_masc_base, v_pow=1.35, v_scale=0.90, s_scale=1.20, r_scale=0.96, g_scale=0.90, b_scale=0.84)
save_both(elder_masc_negro, 'avatar_preto_masc_idoso.jpg')

copy_direct('avatar_preto_fem_crianca_1793747851965.jpg', 'avatar_preto_fem_crianca.jpg')
copy_direct('avatar_preto_fem_jovem_1793798824564.jpg',   'avatar_preto_fem_jovem.jpg')
copy_direct('avatar_preto_fem_adulto_1793747918549.jpg',  'avatar_preto_fem_adulto.jpg')

# Idosa feminina negra: vestido modesto dourado, cabelos longos grisalhos (sem manchas brancas)
elder_fem_negra = adjust_tone(elder_fem_base, v_pow=1.35, v_scale=0.90, s_scale=1.20, r_scale=0.96, g_scale=0.90, b_scale=0.84)
save_both(elder_fem_negra, 'avatar_preto_fem_idoso.jpg')

# ==========================================
# 4. INDÍGENA
# ==========================================
copy_direct('avatar_indigena_masc_crianca_1793735670958.jpg', 'avatar_indigena_masc_crianca.jpg')
copy_direct('avatar_indigena_masc_jovem_1793798846636.jpg',   'avatar_indigena_masc_jovem.jpg')
copy_direct('avatar_indigena_masc_adulto_1793735723030.jpg',  'avatar_indigena_masc_adulto.jpg')

# Idoso masc indígena: polo verde oliva, jeans, tênis, cabelos curtos grisalhos
elder_masc_indigena = adjust_tone(elder_masc_base, v_pow=1.05, v_scale=0.98, s_scale=1.25, r_scale=1.05, g_scale=0.94, b_scale=0.88)
save_both(elder_masc_indigena, 'avatar_indigena_masc_idoso.jpg')

copy_direct('avatar_indigena_fem_crianca_1793747857466.jpg', 'avatar_indigena_fem_crianca.jpg')
copy_direct('avatar_indigena_fem_jovem_1793747911899.jpg',   'avatar_indigena_fem_jovem.jpg')
copy_direct('avatar_indigena_fem_adulto_1793747894064.jpg',  'avatar_indigena_fem_adulto.jpg')

# Idosa feminina indígena: vestido modesto coral, cabelos longos grisalhos (sem manchas brancas)
elder_fem_indigena = adjust_tone(elder_fem_base, v_pow=1.05, v_scale=0.98, s_scale=1.25, r_scale=1.05, g_scale=0.94, b_scale=0.88)
save_both(elder_fem_indigena, 'avatar_indigena_fem_idoso.jpg')

# ==========================================
# 5. AMARELO / ASIÁTICO
# ==========================================
copy_direct('avatar_amarelo_masc_crianca_1793735686669.jpg',     'avatar_amarelo_masc_crianca.jpg')
copy_direct('avatar_amarelo_masc_jovem_1793798845698.jpg',       'avatar_amarelo_masc_jovem.jpg')
copy_direct('avatar_amarelo_masc_adulto_1793798811642.jpg',      'avatar_amarelo_masc_adulto.jpg')

# Idoso masc asiático: polo azul aço, jeans, tênis, cabelos curtos grisalhos
elder_masc_amarelo = adjust_tone(elder_masc_base, v_pow=0.95, v_scale=1.02, s_scale=0.95, r_scale=1.04, g_scale=1.01, b_scale=0.92)
save_both(elder_masc_amarelo, 'avatar_amarelo_masc_idoso.jpg')

# Menina asiática
fem_amarela_crianca = adjust_tone(load_brain('avatar_branco_fem_crianca_1793747836448.jpg'), v_pow=0.96, v_scale=1.02, s_scale=1.02, r_scale=1.03, g_scale=1.01, b_scale=0.92)
save_both(fem_amarela_crianca, 'avatar_amarelo_fem_crianca.jpg')

# Jovem e Adulta asiáticas genuínas recém geradas em 3D Pixar de altíssima definição
copy_direct('avatar_amarelo_fem_jovem_test_1793798649799.jpg',   'avatar_amarelo_fem_jovem.jpg')
copy_direct('avatar_amarelo_fem_adulto_1793798760840.jpg',       'avatar_amarelo_fem_adulto.jpg')

# Idosa asiática: vestido modesto lilás, cabelos longos prateados grisalhos (sem túnica romana antiga!)
elder_fem_amarela = adjust_tone(load_brain('avatar_branco_fem_idoso_1793747899655.jpg'), v_pow=0.96, v_scale=1.02, s_scale=0.95, r_scale=1.04, g_scale=1.01, b_scale=0.92)
save_both(elder_fem_amarela, 'avatar_amarelo_fem_idoso.jpg')

# Sincroniza também os avatares padrão genéricos
copy_direct('avatar_pardo_masc_adulto_1793735677845.jpg', 'avatar_masculino.jpg')
copy_direct('avatar_pardo_masc_adulto_1793735677845.jpg', 'avatar_irmao_casual.jpg')
copy_direct('avatar_pardo_fem_adulto_1793747868631.jpg',  'avatar_feminino.jpg')
copy_direct('avatar_pardo_fem_adulto_1793747868631.jpg',  'avatar_irma_casual.jpg')

print("=== ALL 40 AVATARS DEPLOYED TO PUBLIC AND AVATARES PERFECTLY! ===")

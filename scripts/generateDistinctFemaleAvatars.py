import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import numpy as np

PUBLIC_DIR = 'public' if os.path.exists('public') else 'apostolos-quiz/public'
BRAIN_DIR = 'C:/Users/edino/.gemini/antigravity/brain/073d3cfd-d353-492b-bfa1-a6a9a9ea6b35'

def make_square(img, target_size=(1024, 1024)):
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = 0
    right = left + min_dim
    bottom = min_dim
    return img.crop((left, top, right, bottom)).resize(target_size, Image.Resampling.LANCZOS)

# =========================================================================
# 1. MULHER NEGRA IDOSA (avatar_preto_fem_idoso.jpg)
# =========================================================================
print("1. Gerando Mulher Negra Idosa...")
src_black = os.path.join(BRAIN_DIR, 'avatar_preto_fem_adulto_1793747918549.jpg')
img_black = Image.open(src_black)
sq_black = make_square(img_black)
arr_black = np.array(sq_black).astype(np.float32)

# Identifica cabelos (y: 50 a 460, x: 160 a 860) e converte para grisalho prateado refinado
for y in range(50, 470):
    for x in range(150, 870):
        r, g, b = arr_black[y, x]
        brightness = (r + g + b) / 3.0
        is_skin = (r > g + 22) and (g > b + 10) and (brightness > 60)
        is_bg = (brightness > 195)
        
        if not is_skin and not is_bg and brightness < 115:
            # Transforma em grisalho prateado natural (tons 170 a 220)
            silver = 175.0 + (brightness / 115.0) * 50.0
            arr_black[y, x] = [silver * 0.96, silver * 0.97, silver * 1.03]

arr_black = np.clip(arr_black, 0, 255).astype(np.uint8)
elder_black = Image.fromarray(arr_black)

# Rugas suaves de sabedoria e acolhimento de avó cristã
draw_b = ImageDraw.Draw(elder_black, 'RGBA')
for offset in [-5, 0, 5]:
    draw_b.arc([355 + offset, 375, 395 + offset, 395], start=135, end=225, fill=(40, 22, 18, 70), width=2)
    draw_b.arc([630 + offset, 375, 670 + offset, 395], start=315, end=45, fill=(40, 22, 18, 70), width=2)
draw_b.arc([400, 420, 445, 485], start=95, end=190, fill=(40, 22, 18, 65), width=2)
draw_b.arc([580, 420, 625, 485], start=350, end=85, fill=(40, 22, 18, 65), width=2)

elder_black = elder_black.filter(ImageFilter.SMOOTH_MORE)
elder_black.save(os.path.join(PUBLIC_DIR, 'avatar_preto_fem_idoso.jpg'), quality=95)
print("-> avatar_preto_fem_idoso.jpg salvo com sucesso!")

# =========================================================================
# 2. MULHER INDÍGENA IDOSA (avatar_indigena_fem_idoso.jpg)
# =========================================================================
print("2. Gerando Mulher Indígena Idosa...")
src_indigena = os.path.join(BRAIN_DIR, 'avatar_indigena_fem_adulto_1793747894064.jpg')
img_indigena = Image.open(src_indigena)
sq_indigena = make_square(img_indigena)
arr_ind = np.array(sq_indigena).astype(np.float32)

# Cabelos longos e tranças indígenas (y: 80 a 650, x: 200 a 820)
for y in range(80, 650):
    for x in range(200, 820):
        r, g, b = arr_ind[y, x]
        brightness = (r + g + b) / 3.0
        is_skin = (r > g + 20) and (r > 120) and (brightness > 95)
        is_bg = (brightness > 200)
        
        if not is_skin and not is_bg and brightness < 130:
            silver = 170.0 + (brightness / 130.0) * 55.0
            arr_ind[y, x] = [silver * 0.98, silver * 0.98, silver * 1.02]

arr_ind = np.clip(arr_ind, 0, 255).astype(np.uint8)
elder_ind = Image.fromarray(arr_ind)

draw_i = ImageDraw.Draw(elder_ind, 'RGBA')
for offset in [-4, 0, 4]:
    draw_i.arc([350 + offset, 365, 395 + offset, 385], start=135, end=225, fill=(60, 30, 20, 65), width=2)
    draw_i.arc([630 + offset, 365, 675 + offset, 385], start=315, end=45, fill=(60, 30, 20, 65), width=2)
draw_i.arc([405, 410, 450, 475], start=95, end=190, fill=(60, 30, 20, 60), width=2)
draw_i.arc([575, 410, 620, 475], start=350, end=85, fill=(60, 30, 20, 60), width=2)

elder_ind = elder_ind.filter(ImageFilter.SMOOTH_MORE)
elder_ind.save(os.path.join(PUBLIC_DIR, 'avatar_indigena_fem_idoso.jpg'), quality=95)
print("-> avatar_indigena_fem_idoso.jpg salvo com sucesso!")

# =========================================================================
# 3. MULHERES AMARELAS / ASIÁTICAS (4 FASES TOTALMENTE DISTINTAS)
# =========================================================================
src_asia = os.path.join(BRAIN_DIR, 'avatar_pixar_asiatica_1793680497741.jpg')
img_asia_base = Image.open(src_asia)
sq_asia = make_square(img_asia_base)

# --- 3A. CRIANÇA (avatar_amarelo_fem_crianca.jpg) ---
print("3A. Gerando Menina Asiática Criança...")
w, h = sq_asia.size
crop_pad = int(w * 0.09)
child_asia = sq_asia.crop((crop_pad, crop_pad, w - crop_pad, h - crop_pad)).resize((1024, 1024), Image.Resampling.LANCZOS)

enhancer_color = ImageEnhance.Color(child_asia)
child_asia = enhancer_color.enhance(1.22)
enhancer_bright = ImageEnhance.Brightness(child_asia)
child_asia = enhancer_bright.enhance(1.05)

draw_c = ImageDraw.Draw(child_asia, 'RGBA')
draw_c.ellipse([360, 420, 440, 470], fill=(255, 130, 160, 45))
draw_c.ellipse([585, 420, 665, 470], fill=(255, 130, 160, 45))
# Lacinho infantil rosa alegre
draw_c.polygon([(340, 240), (370, 220), (370, 260)], fill=(255, 140, 180, 230))
draw_c.polygon([(400, 240), (370, 220), (370, 260)], fill=(255, 140, 180, 230))
draw_c.ellipse([365, 235, 375, 245], fill=(255, 255, 255, 255))

child_asia.save(os.path.join(PUBLIC_DIR, 'avatar_amarelo_fem_crianca.jpg'), quality=95)
print("-> avatar_amarelo_fem_crianca.jpg salvo com sucesso!")

# --- 3B. JOVEM (avatar_amarelo_fem_jovem.jpg) ---
print("3B. Gerando Moça Asiática Jovem...")
young_asia = sq_asia.copy()
arr_y = np.array(young_asia).astype(np.float32)

for y in range(180, 450):
    for x in range(300, 724):
        r, g, b = arr_y[y, x]
        brightness = (r + g + b) / 3.0
        is_skin = (r > g + 15) and (r > 130) and (brightness > 110)
        if not is_skin and brightness < 100:
            arr_y[y, x] = [min(255, r * 1.35 + 25), min(255, g * 1.25 + 15), min(255, b * 1.35 + 20)]

arr_y = np.clip(arr_y, 0, 255).astype(np.uint8)
young_asia = Image.fromarray(arr_y)
young_asia = ImageEnhance.Color(young_asia).enhance(1.15)
young_asia.save(os.path.join(PUBLIC_DIR, 'avatar_amarelo_fem_jovem.jpg'), quality=95)
print("-> avatar_amarelo_fem_jovem.jpg salvo com sucesso!")

# --- 3C. ADULTO (avatar_amarelo_fem_adulto.jpg) ---
print("3C. Gerando Mulher Asiática Adulta...")
adult_asia = sq_asia.copy()
adult_asia = ImageEnhance.Contrast(adult_asia).enhance(1.08)
adult_asia.save(os.path.join(PUBLIC_DIR, 'avatar_amarelo_fem_adulto.jpg'), quality=95)
print("-> avatar_amarelo_fem_adulto.jpg salvo com sucesso!")

# --- 3D. IDOSO (avatar_amarelo_fem_idoso.jpg) ---
print("3D. Gerando Senhora Asiática Idosa...")
arr_elder_asia = np.array(sq_asia).astype(np.float32)

for y in range(80, 430):
    for x in range(280, 744):
        r, g, b = arr_elder_asia[y, x]
        brightness = (r + g + b) / 3.0
        is_skin = (r > g + 15) and (r > 130) and (brightness > 110)
        is_bg = (brightness > 210)
        
        if not is_skin and not is_bg and brightness < 125:
            silver = 175.0 + (brightness / 125.0) * 55.0
            arr_elder_asia[y, x] = [silver * 0.97, silver * 0.97, silver * 1.02]

arr_elder_asia = np.clip(arr_elder_asia, 0, 255).astype(np.uint8)
elder_asia = Image.fromarray(arr_elder_asia)

draw_ea = ImageDraw.Draw(elder_asia, 'RGBA')
for offset in [-4, 0, 4]:
    draw_ea.arc([360 + offset, 365, 400 + offset, 385], start=135, end=225, fill=(80, 50, 40, 65), width=2)
    draw_ea.arc([620 + offset, 365, 660 + offset, 385], start=315, end=45, fill=(80, 50, 40, 65), width=2)

draw_ea.arc([410, 415, 450, 475], start=95, end=190, fill=(80, 50, 40, 60), width=2)
draw_ea.arc([570, 415, 610, 475], start=350, end=85, fill=(80, 50, 40, 60), width=2)

# Óculos dourados de leitura de vovó
draw_ea.ellipse([395, 360, 475, 415], outline=(218, 165, 32, 210), width=3)
draw_ea.ellipse([545, 360, 625, 415], outline=(218, 165, 32, 210), width=3)
draw_ea.line([(475, 385), (545, 385)], fill=(218, 165, 32, 210), width=3)
draw_ea.line([(395, 385), (370, 375)], fill=(218, 165, 32, 190), width=3)
draw_ea.line([(625, 385), (650, 375)], fill=(218, 165, 32, 190), width=3)

elder_asia = elder_asia.filter(ImageFilter.SMOOTH_MORE)
elder_asia.save(os.path.join(PUBLIC_DIR, 'avatar_amarelo_fem_idoso.jpg'), quality=95)
print("-> avatar_amarelo_fem_idoso.jpg salvo com sucesso!")

print("\nTODOS OS 6 AVATARES FEMININOS FORAM PROCESSADOS E SALVOS COM SUCESSO!")

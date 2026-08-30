import shutil
import os

brain_dir = r"C:\Users\DELL\.gemini\antigravity\brain\d89fbf5c-0c2a-450b-8c8f-15b7367f3441"
assets_dir = r"d:\subjects\ai\pel134\assets"

os.makedirs(assets_dir, exist_ok=True)

mapping = {
    "comic_panel_1_1787988324617.png": "comic_1.png",
    "comic_panel_2_1787989413412.png": "comic_2.png",
    "comic_panel_3_1788005342120.png": "comic_3.png",
    "comic_panel_4_1788005501790.png": "comic_4.png",
    "comic_panel_5_1788006460801.png": "comic_5.png",
    "comic_panel_6_1788006651836.png": "comic_6.png",
    "comic_panel_7_1788006719279.png": "comic_7.png",
    "comic_panel_8_1788006804445.png": "comic_8.png",
    "air_quality_project_1787958743188.png": "air_quality.png",
    "bharat_jago_project_1787958757659.png": "bharat_jago.png",
    "roomie_match_project_1787958770630.png": "roomie_match.png",
    "media__1788009303847.jpg": "vansh_suit.jpg",
    "media__1788011174827.png": "vansh_cv.png",
    "media__1788007847457.jpg": "cert_lpu_german.jpg",
    "media__1788009143693.png": "cert_iamneo_c.png",
    "media__1788008655051.jpg": "cert_infosys_ai.jpg",
    "media__1788008606045.jpg": "cert_saylor_cpp.jpg",
    "media__1788008621021.jpg": "cert_udemy_dsa.jpg",
    "media__1788008636940.jpg": "cert_infosys_py1.jpg",
    "media__1788008649015.jpg": "cert_infosys_py2.jpg"
}

for src_name, dst_name in mapping.items():
    src_path = os.path.join(brain_dir, src_name)
    dst_path = os.path.join(assets_dir, dst_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src_name} -> {dst_name} ({os.path.getsize(dst_path)} bytes)")
    else:
        print(f"MISSING: {src_path}")

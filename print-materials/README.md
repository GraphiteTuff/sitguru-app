# SitGuru Booth Print Materials

Generate letter-size (8.5×11) booth and kiosk print assets:

1. Pet-owner signup / sitter lookup table sign
2. Sitter recruitment table sign
3. Kiosk privacy notice cards (2-up)
4. Pocket handout grid (8 cards, promo `BOOTH25`)
5. Core services summary flyer

## Generate

```bash
pip install reportlab
python3 print-materials/generate_booth_print_kit.py
```

Output: `print-materials/SitGuru_Booth_Print_Materials.pdf`

QR blocks in the PDF are geometric mock placeholders — replace with live SitGuru deep-link / app-store QR codes before final print.

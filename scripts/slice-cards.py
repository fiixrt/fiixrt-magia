#!/usr/bin/env python3
"""Recorta las 52 cartas de public/poker-v2.png y genera public/cards/<VALOR>-<PALO>.png

El sprite es una rejilla de 13x4 (valores x palos). Cada celda mide 66x102 px,
la carta ocupa 65x101 px y el fondo negro que la rodea se hace transparente.
Filas del sprite: picas, corazones, tréboles, diamantes.
Palos del protocolo: 1=picas, 2=corazones, 3=diamantes, 4=tréboles.

Uso:  python3 scripts/slice-cards.py
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SPRITE = ROOT / "public" / "poker-v2.png"
OUT = ROOT / "public" / "cards"

CELL_W, CELL_H = 66, 102      # paso de la rejilla
CARD_W, CARD_H = 65, 101      # tamaño de la carta dentro de la celda
SCALE = 6                     # 390x606 px de salida

VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
# palo del protocolo -> fila del sprite
SUIT_ROW = {1: 0, 2: 1, 4: 2, 3: 3}


def clear_background(card: Image.Image) -> Image.Image:
    """Hace transparente el negro que queda fuera del marco redondeado."""
    card = card.convert("RGBA")
    px = card.load()
    width, height = card.size
    seen = [[False] * width for _ in range(height)]
    queue = deque()

    def is_bg(x: int, y: int) -> bool:
        r, g, b, _ = px[x, y]
        return r < 45 and g < 45 and b < 45

    for x in range(width):
        for y in (0, height - 1):
            if is_bg(x, y) and not seen[y][x]:
                seen[y][x] = True
                queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            if is_bg(x, y) and not seen[y][x]:
                seen[y][x] = True
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not seen[ny][nx] and is_bg(nx, ny):
                seen[ny][nx] = True
                queue.append((nx, ny))
    return card


def restore_bottom_index(card: Image.Image) -> Image.Image:
    """La fila de picas del sprite trae el índice de la esquina inferior derecha
    recortado por el borde de la carta. Se reconstruye girando 180° el índice
    superior izquierdo, que es idéntico."""
    width, height = card.size
    px = card.load()
    min_x, min_y, max_x, max_y = width, height, -1, -1
    for y in range(1, 27):
        for x in range(1, 19):
            r, g, b, a = px[x, y]
            if a > 0 and (r < 245 or g < 245 or b < 245):
                min_x, min_y = min(min_x, x), min(min_y, y)
                max_x, max_y = max(max_x, x), max(max_y, y)
    if max_x < 0:
        return card

    index = card.crop((min_x, min_y, max_x + 1, max_y + 1)).rotate(180)
    dest_x, dest_y = width - 1 - max_x, height - 1 - max_y
    draw = ImageDraw.Draw(card)
    draw.rectangle(
        [dest_x, dest_y, dest_x + index.width - 1, dest_y + index.height - 1],
        fill=(255, 255, 255, 255),
    )
    card.paste(index, (dest_x, dest_y))
    return card


def main() -> None:
    sprite = Image.open(SPRITE).convert("RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    count = 0
    for suit, row in SUIT_ROW.items():
        for index, value in enumerate(VALUES):
            box = (CELL_W * index, CELL_H * row,
                   CELL_W * index + CARD_W, CELL_H * row + CARD_H)
            card = clear_background(sprite.crop(box))
            if row == 0:  # picas: el sprite trae la esquina inferior cortada
                card = restore_bottom_index(card)
            card = card.resize((CARD_W * SCALE, CARD_H * SCALE), Image.LANCZOS)
            card = card.filter(ImageFilter.UnsharpMask(radius=1.4, percent=45, threshold=2))
            card.save(OUT / f"{value}-{suit}.png", optimize=True)
            count += 1
    print(f"{count} cartas generadas en {OUT}")


if __name__ == "__main__":
    main()

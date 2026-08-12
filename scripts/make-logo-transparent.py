from collections import deque
from pathlib import Path

from PIL import Image

IMAGES = Path(r"c:\Users\jason\projects\pawnecto\public\images")
SRC = IMAGES / "sitguru-logo-cropped.png"
BACKUP = IMAGES / "sitguru-logo-cropped-opaque-backup.png"
OUT_CROPPED = IMAGES / "sitguru-logo-cropped.png"
OUT_LIGHT = IMAGES / "sitguru-logo-light.png"
FINAL_SRC = IMAGES / "sitguru-logo-final.png"
FINAL_OUT = IMAGES / "sitguru-logo-final-transparent.png"


def is_near_white(r: int, g: int, b: int, a: int, thresh: int = 248) -> bool:
    if a < 8:
        return True
    return r >= thresh and g >= thresh and b >= thresh


def make_transparent(path: Path, out: Path, thresh: int = 248) -> None:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    visited = [[False] * h for _ in range(w)]
    q: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            r, g, b, a = px[x, y]
            if is_near_white(r, g, b, a, thresh):
                q.append((x, y))
                visited[x][y] = True
    for y in range(h):
        for x in (0, w - 1):
            if visited[x][y]:
                continue
            r, g, b, a = px[x, y]
            if is_near_white(r, g, b, a, thresh):
                q.append((x, y))
                visited[x][y] = True

    while q:
        x, y = q.popleft()
        r, g, b, a = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                nr, ng, nb, na = px[nx, ny]
                if is_near_white(nr, ng, nb, na, thresh):
                    visited[nx][ny] = True
                    q.append((nx, ny))

    for x in range(w):
        for y in range(h):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r >= 252 and g >= 252 and b >= 252:
                dark_neighbors = 0
                for nx, ny in (
                    (x - 1, y),
                    (x + 1, y),
                    (x, y - 1),
                    (x, y + 1),
                    (x - 1, y - 1),
                    (x + 1, y + 1),
                    (x - 1, y + 1),
                    (x + 1, y - 1),
                ):
                    if 0 <= nx < w and 0 <= ny < h:
                        rr, gg, bb, aa = px[nx, ny]
                        if aa > 0 and (rr + gg + bb) < 600:
                            dark_neighbors += 1
                if dark_neighbors == 0:
                    px[x, y] = (r, g, b, 0)

    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)

    im.save(out, optimize=True)
    print(f"{path.name} -> {out.name}: {im.size} mode={im.mode}")
    px2 = im.load()
    ww, hh = im.size
    for c in ((0, 0), (ww - 1, 0), (0, hh - 1), (ww - 1, hh - 1)):
        print("  corner", c, px2[c])


def main() -> None:
    if not BACKUP.exists():
        Image.open(SRC).save(BACKUP)
        print("backed up opaque cropped logo")

    make_transparent(BACKUP, OUT_LIGHT, thresh=248)
    make_transparent(BACKUP, OUT_CROPPED, thresh=248)
    if FINAL_SRC.exists():
        make_transparent(FINAL_SRC, FINAL_OUT, thresh=248)
    print("done")


if __name__ == "__main__":
    main()

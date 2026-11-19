"""Render the profile's original request-flow animation. Requires Pillow."""

from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "GIF" / "observability-banner.gif"
WIDTH, HEIGHT, FRAMES = 1200, 340, 60
PANEL, EDGE = "#101c2a", "#263a4e"
FG, MUTED, CYAN, AMBER = "#edf5fc", "#a8bdd0", "#77d5ed", "#ffbd7a"


def font(size, bold=False, mono=False):
    candidates = (
        ["C:/Windows/Fonts/consola.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
        if mono else
        [f"C:/Windows/Fonts/segoeui{'b' if bold else ''}.ttf",
         f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf"]
    )
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size=size)


def build_frame(index):
    image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    for x in range(520, WIDTH, 32):
        for y in range(28, HEIGHT, 32):
            draw.point((x, y), fill="#1d2b3b")
    draw.rounded_rectangle((1, 1, WIDTH - 2, HEIGHT - 2), radius=20, outline=EDGE)
    draw.text((38, 30), "HARSHIT KUSHWAHA", font=font(22, bold=True), fill=MUTED)
    draw.text((36, 84), "Make systems", font=font(45, bold=True), fill=FG)
    draw.text((36, 139), "observable.", font=font(45, bold=True), fill=CYAN)
    draw.text((39, 230), "BACKEND / OBSERVABILITY / OPEN SOURCE", font=font(15, mono=True), fill=MUTED)
    draw.text((39, 267), "Go  /  Dart  /  OpenTelemetry", font=font(18, mono=True), fill=AMBER)

    draw.text((570, 34), "ONE REQUEST. A CONNECTED TRACE.", font=font(16, mono=True), fill=MUTED)
    centers = [630, 850, 1070]
    draw.line((630, 130, 1070, 130), fill=EDGE, width=3)
    for center, title, subtitle in zip(centers, ["API", "SERVICE", "STORE"], ["receive", "process", "persist"]):
        draw.rounded_rectangle((center - 76, 91, center + 76, 166), radius=12, fill=PANEL, outline=EDGE, width=2)
        draw.text((center, 103), title, font=font(21, bold=True), fill=FG, anchor="mt")
        draw.text((center, 136), subtitle, font=font(14, mono=True), fill=MUTED, anchor="mt")
    progress = index / FRAMES
    # A packet traverses the links; span bars reveal the corresponding trace.
    for left, right, offset in [(708, 772, 0), (928, 992, 0.5)]:
        local = (progress - offset) % 1
        x = left + (right - left) * local
        draw.ellipse((x - 5, 125, x + 5, 135), fill=CYAN)
    for row, (label, start, end, color) in enumerate([
        ("request", 702, 1124, CYAN),
        ("process", 770, 1066, AMBER),
        ("persist", 904, 1024, CYAN),
    ]):
        y = 215 + row * 28
        draw.text((568, y - 3), label, font=font(14, mono=True), fill=MUTED)
        draw.rounded_rectangle((start, y, end, y + 10), radius=5, fill=EDGE)
        fraction = 0.72 + 0.28 * math.sin(math.pi * progress) ** 2
        draw.rounded_rectangle((start, y, start + int((end - start) * fraction), y + 10), radius=5, fill=color)
    return image


def main():
    frames = [build_frame(index) for index in range(FRAMES)]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    palette = frames[FRAMES // 2].convert("RGB").quantize(colors=96)
    transparent = palette.getpixel((0, 0))
    indexed_frames = []
    for frame in frames:
        indexed = frame.convert("RGB").quantize(palette=palette, dither=Image.Dither.NONE)
        # GIF supports binary transparency. Keep the palette index stable across frames.
        mask = frame.getchannel("A").point(lambda alpha: 255 if alpha < 128 else 0)
        indexed.paste(transparent, mask=mask)
        indexed_frames.append(indexed)
    indexed_frames[0].save(
        OUTPUT, save_all=True, append_images=indexed_frames[1:], duration=80,
        loop=0, transparency=transparent, background=transparent,
        optimize=False, disposal=2,
    )
    print(f"Created {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()

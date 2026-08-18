from pathlib import Path
from PIL import Image
import numpy as np

src_dir = Path(r"C:\Users\35552\Desktop\trae projects\microengine\8.16\8.17-问卷")
out_dir = Path(r"C:\Users\35552\Desktop\trae projects\microengine\micro-enging\public\personas")

name_map = {
    "明星.png": "star.png",
    "老板.png": "boss.png",
    "孤独的狼.png": "lone-wolf.png",
    "演讲者.png": "speaker.png",
    "观察者.png": "observer.png",
    "思考者.png": "thinker.png",
    "追梦者.png": "dreamer.png",
    "老好人.png": "people-pleaser.png",
    "宝剑哥.png": "sword.png",
    "小戏精.png": "drama.png",
    "纠结者.png": "overthinker.png",
    "蘑菇.png": "mushroom.png",
}


def content_mask(arr: np.ndarray) -> np.ndarray:
    rgb = arr[:, :, :3].astype(np.int16)
    alpha = arr[:, :, 3].astype(np.int16)
    brightness = rgb.sum(axis=2)
    return (alpha >= 12) & ((brightness > 45) | (rgb.max(axis=2) > 28))


for src_name, out_name in name_map.items():
    src = src_dir / src_name
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]
    mask = content_mask(arr)
    ys, xs = np.where(mask)
    if len(xs) == 0:
        print("EMPTY", src_name)
        continue
    left, right = int(xs.min()), int(xs.max())
    top, bottom = int(ys.min()), int(ys.max())
    pad = max(12, int(0.08 * max(right - left + 1, bottom - top + 1)))
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w - 1, right + pad)
    bottom = min(h - 1, bottom + pad)
    crop = img.crop((left, top, right + 1, bottom + 1))
    cw, ch = crop.size
    side = int(max(cw, ch) * 1.1)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 255))
    ox = (side - cw) // 2
    oy = (side - ch) // 2
    canvas.paste(crop, (ox, oy), crop)
    out_path = out_dir / out_name
    canvas.convert("RGB").save(out_path, "PNG", optimize=True)
    print(f"{out_name}: {w}x{h} -> crop {cw}x{ch} -> {side}x{side}")

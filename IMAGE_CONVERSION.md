# Image Conversion Guide

The original game uses IFF ILBM format images (Amiga format) which are not natively supported by web browsers. These images need to be converted to PNG or WebP format.

## Image Location

- **Source**: `gamedata/PICTURES/` (IFF ILBM format)
- **Target**: `gamedata/PICTURES_PNG/` (PNG format)
- **List**: `gamedata/TEXTS/COLL.LST` (collection metadata)

## Conversion Methods

### Method 1: Using C Version with SDL_image

The C version can load ILBM files using SDL_image. You can modify it to export PNG:

```bash
# Build C version
./build-pc.sh

# Run with export flag (if implemented)
# Or modify src/gfx/loadimage.c to save as PNG
```

### Method 2: Using Python with Pillow

```bash
pip install pillow

python3 << 'EOF'
from PIL import Image
import os

src_dir = 'gamedata/PICTURES'
dst_dir = 'gamedata/PICTURES_PNG'
os.makedirs(dst_dir, exist_ok=True)

for filename in os.listdir(src_dir):
    src_path = os.path.join(src_dir, filename)
    if os.path.isfile(src_path):
        try:
            img = Image.open(src_path)
            dst_path = os.path.join(dst_dir, f'{filename}.png')
            img.save(dst_path, 'PNG')
            print(f'Converted: {filename}')
        except Exception as e:
            print(f'Failed: {filename} - {e}')
EOF
```

### Method 3: Using ImageMagick (if ILBM support is compiled in)

```bash
cd gamedata/PICTURES
for file in *; do
    convert "$file" "../PICTURES_PNG/${file}.png"
done
```

### Method 4: Online Converters

1. Upload ILBM files to online converter
2. Download as PNG
3. Place in `gamedata/PICTURES_PNG/`

### Method 5: Manual Extraction

Use tools like:
- XnView (Windows/Mac/Linux)
- GIMP with IFF plugin
- IrfanView (Windows)

## File Naming

The TypeScript code expects PNG files with the same base name:

- `BUBBLE` → `BUBBLE.png`
- `SKY1.ANI` → `SKY1.png`
- `ABBEY.OBJ` → `ABBEY.png`
- `BENTLEY.CAR` → `BENTLEY.png`

Extensions (.ANI, .OBJ, .CAR, .FNT) are stripped automatically.

## Collection Metadata

The `COLL.LST` file contains metadata for each image:

```
CollId, Filename, Width, Height, ColorsBegin, ColorsEnd[, fromDisk]
1,sky1,320,140,0,191,0
```

This metadata is loaded by `ImageService.ts` and used for rendering.

## Verification

After conversion, verify:

1. All files from `COLL.LST` are converted
2. Images have correct dimensions
3. Colors are preserved (8-bit palette)
4. Transparency is handled correctly

## Status

- ❌ Images not yet converted
- ⚠️ ImageService ready but needs PNG files
- 📝 ~180 images to convert

## Next Steps

1. Choose conversion method
2. Convert all images
3. Test with ImageService
4. Verify in-game rendering

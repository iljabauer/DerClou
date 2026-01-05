#!/bin/bash
# Convert IFF ILBM images to PNG format for web use

set -e

PICTURES_DIR="gamedata/PICTURES"
OUTPUT_DIR="gamedata/PICTURES_PNG"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Converting ILBM images to PNG..."
echo "Source: $PICTURES_DIR"
echo "Output: $OUTPUT_DIR"
echo ""

converted=0
failed=0

# Convert all files in PICTURES directory
for file in "$PICTURES_DIR"/*; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        output="$OUTPUT_DIR/${filename}.png"
        
        # Skip if already converted
        if [ -f "$output" ]; then
            echo "  [SKIP] $filename (already exists)"
            continue
        fi
        
        # Try to convert
        if convert "$file" "$output" 2>/dev/null; then
            echo "  [OK] $filename -> ${filename}.png"
            ((converted++))
        else
            echo "  [FAIL] $filename (not an image or unsupported format)"
            ((failed++))
        fi
    fi
done

echo ""
echo "Conversion complete!"
echo "  Converted: $converted"
echo "  Failed: $failed"
echo "  Output directory: $OUTPUT_DIR"

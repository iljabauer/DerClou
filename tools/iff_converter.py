import struct
import sys
import os
from PIL import Image

def read_be_long(data, offset):
    return struct.unpack_from(">I", data, offset)[0]

def read_be_word(data, offset):
    return struct.unpack_from(">H", data, offset)[0]

def get_chunk(data, offset, chunk_id):
    while offset + 8 <= len(data):
        cid = data[offset:offset+4]
        size = read_be_long(data, offset+4)
        if cid == chunk_id:
            return offset + 8, size
        offset += 8 + size
        if size % 2 != 0: offset += 1
    return None, None

def decompress_byterun1(data, width_bytes):
    # ByteRun1 decompression
    output = bytearray()
    i = 0
    while i < len(data):
        n = data[i]
        i += 1
        if n > 128:
            # Repeat
            count = 257 - n
            if i >= len(data): break
            val = data[i]
            i += 1
            output.extend([val] * count)
        elif n < 128:
            # Copy
            count = n + 1
            if i + count > len(data): break
            output.extend(data[i:i+count])
            i += count
        else:
            # No operation (n == 128)
            pass
    return output

def planar_to_chunky(planes_data, width, height, num_planes):
    # This is a bit slow in pure Python, but fine for offline conversion
    # ILBM is usually interleaved by row:
    # Row 0 Plane 0
    # Row 0 Plane 1
    # ...
    # Row 1 Plane 0

    row_bytes = (width + 15) // 16 * 2 # Standard IFF padding to word

    chunky = bytearray(width * height)

    offset = 0
    for y in range(height):
        for p in range(num_planes):
            # Extract bits for plane p
            # The data for this row/plane is at planes_data[offset : offset+row_bytes]
            row_data = planes_data[offset : offset + row_bytes]
            offset += row_bytes

            for x in range(width):
                byte_idx = x // 8
                bit_idx = 7 - (x % 8)
                if byte_idx < len(row_data):
                    bit = (row_data[byte_idx] >> bit_idx) & 1
                    if bit:
                        chunky[y * width + x] |= (1 << p)
    return chunky

def convert_iff(filepath, output_path):
    with open(filepath, 'rb') as f:
        data = f.read()

    if data[:4] != b'FORM':
        print(f"Not a FORM file: {filepath}")
        return False

    if data[8:12] != b'ILBM':
        print(f"Not an ILBM file: {filepath}")
        return False

    bmhd_offset, bmhd_size = get_chunk(data, 12, b'BMHD')
    if bmhd_offset is None:
        print("No BMHD chunk")
        return False

    w = read_be_word(data, bmhd_offset)
    h = read_be_word(data, bmhd_offset + 2)
    planes = data[bmhd_offset + 8]
    masking = data[bmhd_offset + 9]
    compression = data[bmhd_offset + 10]

    print(f"Converting {filepath}: {w}x{h}, {planes} planes, compression {compression}")

    body_offset, body_size = get_chunk(data, 12, b'BODY')
    if body_offset is None:
        print("No BODY chunk")
        return False

    body_data = data[body_offset : body_offset + body_size]

    # Decompress if needed
    if compression == 1:
        # ByteRun1
        # Note: The C code handles decompression per scanline/plane interleaved.
        # But typically ByteRun1 compresses the whole body stream which contains interleaved scanlines.
        # Let's try decompressing the whole stream first.
        # Actually, standard ILBM compression is per row per plane.
        # Let's look at the C code again.
        # ILBMUncompressToSurface loops y, then planes.
        # It reads comands and outputs to pPlane.
        pass

    # Let's implement the loop structure from C to be safe

    row_bytes = (w + 15) // 16 * 2
    raw_planes = bytearray()

    if compression == 0:
        raw_planes = body_data
    elif compression == 1:
        # We need to simulate the decompression loop
        # The C code writes directly to the surface in chunky format (MCGA).
        # We will write to a planar buffer and then convert.

        # Or even better, let's write to chunky directly like the C code does.
        # MakeMCGA(o, pPlane, (1 << plane), breite)

        # pSurface->pixels is chunky (8-bit palette indices)

        chunky = bytearray(w * h)
        # stride is w (assuming no padding for now, C uses pSurface->pitch)

        src_ptr = 0

        for y in range(h):
            row_start = y * w
            for p in range(planes):
                # Decompress one row for one plane
                # width in bytes for this row
                # The C code uses `breite = (hdr->width + 15) & 0xFFF0;` which seems to be in pixels?
                # No, MakeMCGA takes `breite` and decrements by 8. And `pPlane += 8`.
                # So `breite` is number of pixels to process?
                # `(hdr->width + 15) & 0xFFF0` aligns to 16.

                # Wait, MakeMCGA(ubyte b, ubyte *pic, ubyte PlSt, int c)
                # `pic` is pointer to chunky pixels.
                # It iterates 8 times (bits in b).

                pixels_to_do = (w + 15) & ~15 # Round up to 16

                current_pixel_idx = row_start

                while pixels_to_do > 0:
                    if src_ptr >= len(body_data): break

                    n = body_data[src_ptr]
                    src_ptr += 1

                    if n > 128:
                        count = 257 - n
                        val = body_data[src_ptr]
                        src_ptr += 1
                        for _ in range(count):
                            # MakeMCGA(val, ...)
                            for bit in range(8):
                                if (val >> (7-bit)) & 1:
                                    if current_pixel_idx + bit < len(chunky):
                                        chunky[current_pixel_idx + bit] |= (1 << p)
                            current_pixel_idx += 8
                            pixels_to_do -= 8
                    else: # n <= 128
                        count = n + 1
                        for _ in range(count):
                            val = body_data[src_ptr]
                            src_ptr += 1
                            for bit in range(8):
                                if (val >> (7-bit)) & 1:
                                    if current_pixel_idx + bit < len(chunky):
                                        chunky[current_pixel_idx + bit] |= (1 << p)
                            current_pixel_idx += 8
                            pixels_to_do -= 8


    # Palette (CMAP)
    cmap_offset, cmap_size = get_chunk(data, 12, b'CMAP')
    palette = []
    if cmap_offset:
        cmap_data = data[cmap_offset : cmap_offset + cmap_size]
        for i in range(0, len(cmap_data), 3):
            if i+3 <= len(cmap_data):
                palette.extend([cmap_data[i], cmap_data[i+1], cmap_data[i+2]])

    # Pad palette to 256 colors
    while len(palette) < 768:
        palette.append(0)

    img = Image.frombytes('P', (w, h), bytes(chunky))
    img.putpalette(palette)
    img.save(output_path)
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python iff_converter.py <input> <output>")
        sys.exit(1)

    convert_iff(sys.argv[1], sys.argv[2])

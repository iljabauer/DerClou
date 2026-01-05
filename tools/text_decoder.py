import sys

def decode_text(filepath):
    try:
        with open(filepath, 'rb') as f:
            data = bytearray(f.read())

        decoded = bytearray()
        for b in data:
            decoded.append(b ^ 0x75)

        # Replace nulls with newlines for display
        text = decoded.decode('latin-1') # specific encoding might be needed
        return text
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python text_decoder.py <input>")
        sys.exit(1)

    print(decode_text(sys.argv[1]))

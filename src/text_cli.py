#!/usr/bin/env python3
"""
Der Clou Text File Encoder/Decoder

This script can encode and decode text files used in the game Der Clou.
The encoding is a simple XOR with the value 0x75, and newlines are handled specially.

Usage:
    python derclou_text.py encode <input_file> <output_file>
    python derclou_text.py decode <input_file> <output_file>
"""

import sys
import os

# XOR value used for encryption/decryption
XOR_VALUE = 0x75

def encode_file(input_file, output_file):
    """
    Encode a text file for use in Der Clou.
    
    Args:
        input_file: Path to the input text file
        output_file: Path where the encoded file will be saved
    """
    try:
        with open(input_file, 'rb') as f_in:
            content = f_in.read()
        
        # Convert content to bytes if it's not already
        if isinstance(content, str):
            content = content.encode('latin-1')
        
        # Encode the content (XOR each byte with 0x75)
        encoded = bytearray()
        for byte in content:
            # In the game, newlines are converted to null terminators when decoding,
            # so we need to convert null terminators to newlines when encoding
            if byte == 0:
                # Convert null terminators to newlines (CR or LF)
                encoded.append(13 ^ XOR_VALUE)  # CR (carriage return)
            else:
                encoded.append(byte ^ XOR_VALUE)
        
        with open(output_file, 'wb') as f_out:
            f_out.write(encoded)
        
        print(f"File encoded successfully: {output_file}")
    
    except Exception as e:
        print(f"Error encoding file: {e}")
        return False
    
    return True

def decode_file(input_file, output_file):
    """
    Decode a Der Clou text file.
    
    Args:
        input_file: Path to the encoded input file
        output_file: Path where the decoded file will be saved
    """
    try:
        with open(input_file, 'rb') as f_in:
            content = f_in.read()
        
        # Decode the content (XOR each byte with 0x75)
        decoded = bytearray()
        for byte in content:
            decrypted_byte = byte ^ XOR_VALUE
            
            # In the game, CR and LF (10 and 13) are converted to null terminators
            # when decoding, so we'll do the same
            if decrypted_byte == 10 or decrypted_byte == 13:
                decoded.append(0)  # Null terminator
            else:
                decoded.append(decrypted_byte)
        
        with open(output_file, 'wb') as f_out:
            f_out.write(decoded)
        
        print(f"File decoded successfully: {output_file}")
    
    except Exception as e:
        print(f"Error decoding file: {e}")
        return False
    
    return True

def print_usage():
    """Print usage instructions."""
    print("Usage:")
    print("  python derclou_text.py encode <input_file> <output_file>")
    print("  python derclou_text.py decode <input_file> <output_file>")

def main():
    """Main function to parse arguments and call the appropriate function."""
    if len(sys.argv) != 4:
        print_usage()
        return 1
    
    action = sys.argv[1].lower()
    input_file = sys.argv[2]
    output_file = sys.argv[3]
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' does not exist.")
        return 1
    
    if action == "encode":
        return 0 if encode_file(input_file, output_file) else 1
    elif action == "decode":
        return 0 if decode_file(input_file, output_file) else 1
    else:
        print(f"Error: Unknown action '{action}'. Use 'encode' or 'decode'.")
        print_usage()
        return 1

if __name__ == "__main__":
    sys.exit(main())
from PIL import Image
import sys
import os

try:
    img = Image.open("gamedata/PICTURES/MENU")
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    img.save("menu_test.png")
    print("Saved menu_test.png")
except Exception as e:
    print(f"Error: {e}")

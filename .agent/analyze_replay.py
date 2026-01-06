#!/usr/bin/env python3
import struct
import sys

# Read replay file
with open('gamedata/test_go.rec', 'rb') as f:
    data = f.read()

# Parse header
magic = data[0:4].decode('ascii')
version = struct.unpack('<I', data[4:8])[0]
seed = struct.unpack('<I', data[8:12])[0]

print(f'Magic: {magic}')
print(f'Version: {version}')
print(f'RNG Seed: {seed}')
print(f'\nRecords:')

# Parse records (16 bytes each: 8 tick + 4 action + 4 checksum)
offset = 12
record_num = 0
while offset + 16 <= len(data):
    tick = struct.unpack('<Q', data[offset:offset+8])[0]
    action = struct.unpack('<i', data[offset+8:offset+12])[0]
    checksum = struct.unpack('<I', data[offset+12:offset+16])[0]
    
    # Decode action bits
    action_names = []
    if action & (1 << 0): action_names.append('UP')
    if action & (1 << 1): action_names.append('DOWN')
    if action & (1 << 2): action_names.append('LEFT')
    if action & (1 << 3): action_names.append('RIGHT')
    if action & (1 << 4): action_names.append('ESC')
    if action & (1 << 5): action_names.append('LBUTTONP')
    if action & (1 << 11): action_names.append('TIME')
    if action & (1 << 14): action_names.append('SPACE')
    
    action_str = '|'.join(action_names) if action_names else 'NONE'
    
    # Show first 30 or non-TIME actions
    if record_num < 30 or (action & ~(1<<11)):
        print(f'{record_num:4d}: Tick {tick:6d} Action 0x{action:08x} ({action_str}) Checksum {checksum}')
    
    offset += 16
    record_num += 1

print(f'\nTotal records: {record_num}')

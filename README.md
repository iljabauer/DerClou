# Der Clou! Open Source Project
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/W7W8M9SU8)

Based on V0.8 (2019-11-26) of http://sourceforge.net/projects/cosp

## Roadmap
The overall goal is to make the game accessible for more people either for gaming or for modding.

1. Prebuilt Releases
    - [ ] MacOSX
    - [ ] Linux
    - [ ] Windows
    - [ ] Web (WASM): [theclue.netlify.app](https://theclue.netlify.app)
        - [x] Saving should work
        - [ ] Plans should work
        - [ ] Audio should work on start
    - [ ] Steam?
    - [ ] iOS?
2. Improve Graphic System
    - [ ] Allow pictures with 640x200 px and change base resolution to 640x240
    - [x] Use SDL Image for Image loading, to allow PNG images
    - [ ] Increase color depth from 8bit to 16bit or 32bit
3. Improve Audio / Music system
    - [ ] Change Music files to ogg or similiar
    - [ ] Full voice output (all dialogs, all characters) in German, English
4. Ongoing Changes
    - [ ] Find better names for functions and variables
    - [ ] Make code readable
    - [ ] Rewrite (parts like story code) in python

## CREDITS
```
Idea & concept:  ...and avoid panic by
Programming:     Helmut Gaberschek, Kaweh Kazemi
Graphics:        Markus Hudolin
Story:           Karam Nada
Sound & music:   Hannes Seifert

SDL conversion:  Oliver Gantert (LucyG)
Contributions:   Baris Elmas (devkid82)
Ronny Thiemann (templer)
Thomas Trummer (LordSkaven)
Playtesting:     Baris Elmas (devkid82) - first to finish German version
Martin Banas (srandista) - first to finish Czech version
Neno - bug reporter
MvGulik - Linux+Wine bug reporter

IFF ANIM decoder C++ class by Markus Wolf (murkymind.de)
Ported to C by Oliver Gantert.

HSC music player by Thomas Trummer
The fmopl YM3812 emulator from MAME is under a no distribution for profit
license contained in the included 'mame.txt' file.
```

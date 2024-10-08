#!/bin/bash
rm -rf build-emscripten
conan install . -pr:b ./conan-mac.profile -pr:h ./conan-emscripten.profile --output-folder=build-emscripten --build=missing -o verbosity=1
cd build-emscripten
emcmake cmake .. -G "Unix Makefiles" -DCMAKE_TOOLCHAIN_FILE=conan_toolchain.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build . -v
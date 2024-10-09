#!/bin/bash
rm -rf build
conan install . -pr:b ./conan-mac.profile -pr:h ./conan-mac.profile --output-folder=build --build=missing
cd build
cmake .. -G "Unix Makefiles" -DCMAKE_TOOLCHAIN_FILE=conan_toolchain.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build . -v
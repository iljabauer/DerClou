cmake_minimum_required(VERSION 3.12)
include(CMakePrintHelpers)

project(
  DerClou
  VERSION 0.9
  LANGUAGES C)

cmake_print_variables(CMAKE_C_COMPILER)
cmake_print_variables(CMAKE_SYSTEM_NAME)
if( ${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
  set(CMAKE_C_COMPILER "emcc")
  set(CMAKE_C_FLAGS "-Wno-unknown-warning-option")
  set(USE_FLAGS "-g -sASYNCIFY -s USE_SDL=2 -s USE_SDL_IMAGE=2 -s SDL2_IMAGE_FORMATS='[\"lbm\", \"png\"]' --pre-js ./pre.js --preload-file ../gamedata")
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${USE_FLAGS}")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${USE_FLAGS}")
  set(CMAKE_EXECUTABLE_SUFFIX .html)
  set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/build/web)
else()
  find_package(SDL2 REQUIRED CONFIG)
  find_package(SDL2_image REQUIRED)
  set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/build/x64)
endif()

subdirs(src)

if(NOT DEFINED INSTALL_PATH_DATA)
  set(INSTALL_PATH_DATA share/DerClou)
endif()
message(STATUS "Install path data is ${INSTALL_PATH_DATA}")
install(DIRECTORY gamedata/ DESTINATION ${INSTALL_PATH_DATA})

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
  set(USE_FLAGS "-g -sASYNCIFY -s USE_SDL=2 --pre-js ./pre.js --preload-file ../gamedata")
  set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${USE_FLAGS}")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${USE_FLAGS}")
  set(CMAKE_EXECUTABLE_SUFFIX .html)
else()
  find_package(SDL2 REQUIRED CONFIG)
endif()

subdirs(src)

if(NOT DEFINED INSTALL_PATH_DATA)
  set(INSTALL_PATH_DATA share/DerClou)
endif()
message(STATUS "Install path data is ${INSTALL_PATH_DATA}")
install(DIRECTORY gamedata/ DESTINATION ${INSTALL_PATH_DATA})

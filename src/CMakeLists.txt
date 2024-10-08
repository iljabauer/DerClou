set(SOURCE_FILES
    sound/mxr.c
    sound/mxr_voc.c
    sound/mxr_wav.c
    sound/mxr_hsc.c
    sound/fx.c
    sound/newsound.c
    sound/fmopl.c
    anim/sysanim.c
    base/base.c
    data/dataappl.c
    data/database.c
    data/datacalc.c
    data/relation.c
    dialog/dialog.c
    dialog/talkappl.c
    disk/disk.c
    error/error.c
    gameplay/gp.c
    gameplay/gp_app.c
    gameplay/loadsave.c
    gameplay/tcreques.c
    gfx/gfx.c
    gfx/gfxmcga.c
    gfx/gfxnch4.c
    inphdl/inphdl.c
    landscap/access.c
    landscap/hardware.c
    landscap/init.c
    landscap/landscap.c
    landscap/raster.c
    landscap/scroll.c
    landscap/spot.c
    list/list.c
    living/bob.c
    living/living.c
    memory/memory.c
    organisa/organisa.c
    planing/graphics.c
    planing/guards.c
    planing/io.c
    planing/main.c
    planing/planer.c
    planing/player.c
    planing/prepare.c
    planing/support.c
    planing/sync.c
    planing/system.c
    present/interac.c
    present/present.c
    random/random.c
    scenes/cars.c
    scenes/dealer.c
    scenes/done.c
    scenes/evidence.c
    scenes/inside.c
    scenes/invest.c
    scenes/scenes.c
    scenes/tools.c
    story/story.c
    text/text.c
    port/port.c
    intro/intro.c
    intro/iffanim.c
    gfx/filter.c
    gfx/loadimage.c
    theclou.c)

add_executable(DerClou ${SOURCE_FILES})

target_include_directories(DerClou PUBLIC ${CMAKE_CURRENT_LIST_DIR}
                                          ${SDL2_INCLUDE_DIRS} ${SDL2_image_INCLUDE_DIRS})
target_compile_options(DerClou PUBLIC ${SDL2_CFLAGS_OTHER} -Wall
                                      -Wno-format-overflow)

add_compile_options("$<$<CONFIG:DEBUG>:-g3 -ggdb>")
add_compile_options("$<$<CONFIG:RELEASE>:-O2>")
add_link_options("$<$<CONFIG:RELEASE>:-s>")
add_compile_definitions(CMAKE_INSTALL_PREFIX="${CMAKE_INSTALL_PREFIX}"
                        INSTALL_PATH_BIN="${INSTALL_PATH_BIN}")

if(NOT ${CMAKE_SYSTEM_NAME} MATCHES "Emscripten")
  target_link_libraries(DerClou PRIVATE SDL2::SDL2 SDL2_image::SDL2_image)
endif()

if(NOT DEFINED INSTALL_PATH_BIN)
  set(INSTALL_PATH_BIN ${CMAKE_INSTALL_BINDIR})
endif()

install(TARGETS DerClou DESTINATION ${INSTALL_PATH_BIN})

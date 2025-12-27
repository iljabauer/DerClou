#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Replay File Format definitions matching replay.c */
#define REPLAY_MAGIC "DREC"
#define REPLAY_VERSION 1

typedef struct
{
    char magic[4];
    uint32_t version;
    uint32_t rngSeed;
} ReplayHeader;

typedef struct
{
    uint64_t tick;
    int32_t action;
    uint32_t rngChecksum;
} ReplayRecord;

/* Input constants from input/input.h or similar, added here for stringification */
#define INP_UP 1
#define INP_DOWN 2
#define INP_LEFT 4
#define INP_RIGHT 8
#define INP_ESC 16
#define INP_LBUTTONP 32
#define INP_LBUTTONR 64
#define INP_RBUTTONP 128
#define INP_RBUTTONR 256
#define INP_NO_ESC 512
#define INP_TIME 1024
#define INP_KEYBOARD 2048
#define INP_FUNCTION_KEY 4096
#define INP_SPACE 8192
#define INP_MOUSE 16384
#define INP_MOUSEWHEEL 32768
#define INP_QUIT 65536

static void getActionString(int32_t action, char *buffer)
{
    buffer[0] = '\0';
    if (action == 0)
    {
        strcpy(buffer, "NONE");
        return;
    }

    if (action & INP_UP) strcat(buffer, "UP ");
    if (action & INP_DOWN) strcat(buffer, "DOWN ");
    if (action & INP_LEFT) strcat(buffer, "LEFT ");
    if (action & INP_RIGHT) strcat(buffer, "RIGHT ");
    if (action & INP_ESC) strcat(buffer, "ESC ");
    if (action & INP_LBUTTONP) strcat(buffer, "LBTN_P ");
    if (action & INP_LBUTTONR) strcat(buffer, "LBTN_R ");
    if (action & INP_RBUTTONP) strcat(buffer, "RBTN_P ");
    if (action & INP_RBUTTONR) strcat(buffer, "RBTN_R ");
    if (action & INP_NO_ESC) strcat(buffer, "NO_ESC ");
    if (action & INP_TIME) strcat(buffer, "TIME ");
    if (action & INP_KEYBOARD) strcat(buffer, "KEY ");
    if (action & INP_FUNCTION_KEY) strcat(buffer, "FKEY ");
    if (action & INP_SPACE) strcat(buffer, "SPACE ");
    if (action & INP_MOUSE) strcat(buffer, "MOUSE ");
    if (action & INP_MOUSEWHEEL) strcat(buffer, "WHEEL ");
    if (action & INP_QUIT) strcat(buffer, "QUIT ");
}

int main(int argc, char **argv)
{
    if (argc < 2)
    {
        printf("Usage: %s <replay_file>\n", argv[0]);
        return 1;
    }

    FILE *f = fopen(argv[1], "rb");
    if (!f)
    {
        perror("Failed to open file");
        return 1;
    }

    ReplayHeader header;
    if (fread(&header, sizeof(ReplayHeader), 1, f) != 1)
    {
        fprintf(stderr, "Failed to read header\n");
        fclose(f);
        return 1;
    }

    if (memcmp(header.magic, REPLAY_MAGIC, 4) != 0)
    {
        fprintf(stderr, "Invalid magic bytes\n");
        fclose(f);
        return 1;
    }

    printf("Header: Version=%u, Seed=%u\n", header.version, header.rngSeed);

    ReplayRecord rec;
    char actionStr[256];
    while (fread(&rec, sizeof(ReplayRecord), 1, f) == 1)
    {
        getActionString(rec.action, actionStr);
        printf("%llu: %s (Checksum: 0x%08X)\n", (unsigned long long)rec.tick, actionStr, rec.rngChecksum);
    }

    fclose(f);
    return 0;
}

/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "landscap/spot.h"

#include "port/port.h"

enum
{
    LS_SPOT_BITMAP_WIDTH = (96)
};
#define LS_SPOT_BITMAP_HEIGHT (LS_SPOT_LARGE_SIZE)

#define LS_SPOT_BITMAP_SIZE (LS_SPOT_BITMAP_WIDTH * LS_SPOT_BITMAP_HEIGHT)

#define LS_SPOT_FILENAME ((const char *)"Spot")

struct SpotControl
{
    LIST *p_spots;
    struct RastPort *p_SpotRP; /* Zielrastport */
    SDL_Surface *pSurface;
};

static void lsShowSpot(struct Spot *s, uint32_t time);
static void lsLoadSpotBitMap(struct SpotControl *spc);
static void lsHideSpot(struct Spot *s);
static void lsBlitSpot(uword us_Size, uword us_XPos, uword us_YPos, ubyte visible);

static struct SpotControl *sc = NULL;

void lsInitSpots(struct RastPort *rp)
{
    if (sc)
    {
        lsDoneSpots();
    }

    sc = (struct SpotControl *)MemAlloc(sizeof(struct SpotControl));

    sc->p_spots = (LIST *)CreateList(0);
    sc->p_SpotRP = rp;
    sc->pSurface = NULL;

    lsLoadSpotBitMap(sc);
}

static void lsFreeAllSpots(void)
{
    struct Spot *spot = NULL;

    for (spot = (struct Spot *)LIST_HEAD(sc->p_spots); NODE_SUCC(spot); spot = (struct Spot *)NODE_SUCC(spot))
    {
        RemoveList(spot->p_positions);
        spot->p_positions = NULL;
    }
}

void lsDoneSpots(void)
{
    if (sc)
    {
        lsFreeAllSpots();

        RemoveList(sc->p_spots);

        if (sc->pSurface)
        {
            SDL_FreeSurface(sc->pSurface);
        }

        MemFree(sc, sizeof(struct SpotControl));
        sc = NULL;
    }
}

static int32_t lsIsSpotVisible(struct Spot *spot) { return 1; }

/* zeigt alle Spots, die sich bewegen */
void lsMoveAllSpots(uint32_t time)
{
    struct Spot *spot = NULL;

    for (spot = (struct Spot *)LIST_HEAD(sc->p_spots); NODE_SUCC(spot); spot = (struct Spot *)NODE_SUCC(spot))
    {
        if (spot->us_PosCount > 1)
        {
            if (lsIsSpotVisible(spot))
            {
                if (lsIsLSObjectInActivArea((LSObject)dbGetObject(spot->ul_CtrlObjId)))
                { /* wenn der Steuerkasten in dieser Area -> */
                    if (spot->uch_Status & LS_SPOT_ON)
                    {
                        lsShowSpot(spot, time); /* Spot darstellen (auch in der aktiven Area */
                    }
                }
            }
        }
    }
}

void lsShowAllSpots(uint32_t time, uint32_t mode)
{
    struct Spot *spot = NULL;

    for (spot = (struct Spot *)LIST_HEAD(sc->p_spots); NODE_SUCC(spot); spot = (struct Spot *)NODE_SUCC(spot))
    {
        if (lsIsLSObjectInActivArea((LSObject)dbGetObject(spot->ul_CtrlObjId)))
        { /* wenn der Steuerkasten in dieser Area -> */
            if (mode & LS_ALL_VISIBLE_SPOTS)
            {
                if (spot->uch_Status & LS_SPOT_ON)
                {
                    lsShowSpot(spot, time); /* Spot darstellen */
                }
            }

            if (mode & LS_ALL_INVISIBLE_SPOTS)
            {
                if (spot->uch_Status & LS_SPOT_OFF)
                {
                    lsHideSpot(spot); /* Spot (alte Position) löschen */
                }
            }
        }
    }
}

static void lsShowSpot(struct Spot *s, uint32_t time) /* zum Abspielen! */
{
    struct SpotPosition *pos = NULL;
    uint32_t count = 0;

    if (!(time % s->us_Speed))
    { /* nur alle x Sekunden Bewegung */
        count = (time / s->us_Speed);

        /* wegen Ping-Pong dauert ein Zyklus doppelt so lang -> * 2 */
        /* abzüglich 2 (letztes und erstes kommen nur einmal        */

        if (s->us_PosCount > 1)
        {
            count = count % (s->us_PosCount * 2 - 2);

            if (count >= s->us_PosCount)
            { /* Sonderfall Rückwärts! (in Ping Pong) */
                count = (s->us_PosCount * 2 - 2) - count;
            }
        }
        else
        {
            count = 0;
        }

        /* LucyG 2017-10-30 : Planning the Natural Museum crashed with pos=NULL */
        if (s->us_PosCount > count)
        {
            pos = (struct SpotPosition *)GetNthNode(s->p_positions, count);
            s->p_CurrPos = pos;

            /* alte Position löschen */
            lsHideSpot(s);

            /* Spot setzen */
            lsBlitSpot(s->us_Size, pos->us_XPos, pos->us_YPos, 1);

            s->us_OldXPos = pos->us_XPos;
            s->us_OldYPos = pos->us_YPos;
        }
        else
        {
            s->p_CurrPos = NULL;

            Log("%s|%s: Spot \"%s\" has no positions", __FILE__, __func__, s->Link.Name);
        }
    }
}

static void lsHideSpot(struct Spot *s)
{
    /* den alten Spot löschen! */
    if ((s->us_OldXPos != (uword)-1) && (s->us_OldYPos != (uword)-1))
    {
        lsBlitSpot(s->us_Size, s->us_OldXPos, s->us_OldYPos, 0);
    }
}

static void lsGetAreaForSpot(struct Spot *spot)
{
    uint32_t area = (spot->ul_CtrlObjId / 1000) * 1000;

    switch (area)
    {
        case 170000:
            spot->ul_AreaId = 508016;
            break;
        case 320000:
            spot->ul_AreaId = 508031;
            break;
        case 330000:
            spot->ul_AreaId = 508032;
            break;
        case 340000:
            spot->ul_AreaId = 508033;
            break;
        case 360000:
            spot->ul_AreaId = 508035;
            break;
        case 380000:
            spot->ul_AreaId = 508037;
            break;
        case 400000:
            spot->ul_AreaId = 508039;
            break;
        case 420000:
            spot->ul_AreaId = 508041;
            break;
        case 430000:
            spot->ul_AreaId = 508042;
            break;
        case 450000:
            spot->ul_AreaId = 508043;
            break;
        case 440000:
            spot->ul_AreaId = 508044;
            break;
        case 460000:
            spot->ul_AreaId = 508045;
            break;
        case 470000:
            spot->ul_AreaId = 508046;
            break;
        default:
            spot->ul_AreaId = 0;
            break;
    }
    if (bProfidisk)
    {
        switch (area)
        {
            case 520000:
                spot->ul_AreaId = 508101;
                break;
            case 530000:
                spot->ul_AreaId = 508102;
                break;
            case 540000:
                spot->ul_AreaId = 508103;
                break;
            case 560000:
                spot->ul_AreaId = 508105;
                break;
            case 580000:
                spot->ul_AreaId = 508107;
                break;
            case 600000:
                spot->ul_AreaId = 508109;
                break;
            case 610000:
                spot->ul_AreaId = 508110;
                break;
            case 620000:
                spot->ul_AreaId = 508111;
                break;
            case 640000:
                spot->ul_AreaId = 508113;
                break;
            case 650000:
                spot->ul_AreaId = 508114;
                break;
            case 660000:
                spot->ul_AreaId = 508115;
                break;
            case 670000:
                spot->ul_AreaId = 508116;
                break;
            default:
                spot->ul_AreaId = 0;
                break;
        }
    }
}

static struct Spot *lsAddSpot(uword us_Size, uword us_Speed, uint32_t ul_CtrlObjId)
{
    struct Spot *spot = NULL;
    uint32_t SpotNr = 0;
    char line[TXT_KEY_LENGTH];

    SpotNr = GetNrOfNodes(sc->p_spots);

    sprintf(line, "*%s%u", LS_SPOT_NAME, SpotNr);

    spot = (struct Spot *)CreateNode(sc->p_spots, sizeof(struct Spot), line);

    spot->us_Size = us_Size;
    spot->us_Speed = us_Speed;
    spot->p_positions = (LIST *)CreateList(0);

    spot->us_OldXPos = (uword)-1;
    spot->us_OldYPos = (uword)-1;

    spot->uch_Status = LS_SPOT_ON;
    spot->us_PosCount = 0;

    spot->p_CurrPos = NULL;

    spot->ul_CtrlObjId = ul_CtrlObjId;

    lsGetAreaForSpot(spot);

    return spot;
}

void lsSetSpotStatus(uint32_t CtrlObjId, ubyte uch_Status)
{
    struct Spot *s = NULL;

    for (s = (struct Spot *)LIST_HEAD(sc->p_spots); NODE_SUCC(s); s = (struct Spot *)NODE_SUCC(s))
    {
        if (s->ul_CtrlObjId == CtrlObjId)
        {
            s->uch_Status = uch_Status;
        }
    }
}

static void lsAddSpotPosition(struct Spot *spot, uword us_XPos, uword us_YPos)
{
    struct SpotPosition *pos = NULL;

    pos = (struct SpotPosition *)CreateNode(spot->p_positions, (int32_t)sizeof(struct SpotPosition), NULL);

    pos->us_XPos = (word)us_XPos + (word)LS_PC_CORRECT_X;
    pos->us_YPos = (word)us_YPos + (word)LS_PC_CORRECT_Y;

    spot->us_PosCount++;
}

static void lsLoadSpotBitMap(struct SpotControl *spc)
{
    char Result[TXT_KEY_LENGTH];
    int32_t i = 0;
    int32_t j = 0;
    ubyte *d = NULL;

    // Dateiname erstellen
    dskBuildPathName(PICTURE_DIRECTORY, LS_SPOT_FILENAME, Result);

    spc->pSurface = gfxLoadImage(Result);
    if (!spc->pSurface)
    {
        Log("lsLoadSpotBitMap: pSurface=NULL");
        return;
    }

    /* what the hack? */
    d = (ubyte *)spc->pSurface->pixels;
    for (j = 0; j < LS_SPOT_BITMAP_HEIGHT; j++)
    {
        for (i = 0; i < LS_SPOT_BITMAP_WIDTH; i++)
        {
            if (*d == 63)
            {
                *d = 64;
            }
            if (*d == 255)
            {
                *d = 0;
            }
            d++;
        }
        d += spc->pSurface->pitch - LS_SPOT_BITMAP_WIDTH;
    }
}

void lsLoadSpots(uint32_t bldId, char *uch_FileName)
{
    FILE *file = NULL;
    char filename[TXT_KEY_LENGTH];
    char buffer[TXT_KEY_LENGTH];
    uword SpotCount = 0;
    uword i = 0;
    uword j = 0;
    uint32_t CtrlObjId = 0;
    struct Spot *spot = NULL;
    uword Size = 0;
    uword Speed = 0;
    uword Count = 0;
    uword XPos = 0;
    uword YPos = 0;

    dskBuildPathName(DATA_DIRECTORY, uch_FileName, filename);

    file = dskOpen(filename, "r", 0);

    dskGets(buffer, TXT_KEY_LENGTH - 1, file);
    SpotCount = (uword)atol(buffer);

    for (i = 0; i < SpotCount; i++)
    {
        dskGets(buffer, TXT_KEY_LENGTH - 1, file);
        Size = (uword)atol(buffer);

        dskGets(buffer, TXT_KEY_LENGTH - 1, file);
        Speed = (uword)atol(buffer);

        dskGets(buffer, TXT_KEY_LENGTH - 1, file);
        CtrlObjId = atol(buffer);

        dskGets(buffer, TXT_KEY_LENGTH - 1, file);
        Count = (uword)atol(buffer);

        spot = lsAddSpot(Size, Speed, CtrlObjId);

        for (j = 0; j < Count; j++)
        {
            dskGets(buffer, TXT_KEY_LENGTH - 1, file);
            XPos = (uword)atol(buffer);

            dskGets(buffer, TXT_KEY_LENGTH - 1, file);
            YPos = (uword)atol(buffer);

            lsAddSpotPosition(spot, XPos, YPos);
        }

        if (!(LIST_EMPTY(sc->p_spots))) spot->p_CurrPos = (struct SpotPosition *)LIST_HEAD(sc->p_spots);
    }

    dskClose(file);
}

LIST *lsGetSpotList(void) { return (sc->p_spots); }

static void lsBlitSpot(uword us_Size, uword us_XPos, uword us_YPos, ubyte visible)
{
    uint32_t sourceX = 0;
    void *Src = NULL;
    void *Dest = NULL;

    switch (us_Size)
    {
        case LS_SPOT_SMALL_SIZE:
            sourceX = LS_SPOT_LARGE_SIZE + LS_SPOT_MEDIUM_SIZE;
            break;
        case LS_SPOT_MEDIUM_SIZE:
            sourceX = LS_SPOT_LARGE_SIZE;
            break;
        case LS_SPOT_LARGE_SIZE:
            break;
    }

    Src = sc->pSurface->pixels;
    Dest = l_wrp->p_BitMap;

    if (visible)
        gfxNCH4OrMCGAToNCH4(Src, Dest, sourceX, 0, us_XPos, us_YPos, us_Size, us_Size, 96, 160);
    else
        gfxNCH4AndMCGAToNCH4(Src, Dest, sourceX, 0, us_XPos, us_YPos, us_Size, us_Size, 96, 160);
}

/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "landscap/landscap.h"
#include "landscap/landscap_p.h"

static void lsPrepareFromXMSBySize(ubyte uch_Size);
static void lsBlitOneObject(uword offsetFact, word destx, word desty, uword size);

void lsShowEscapeCar(void)
{
    Building b = (Building)dbGetObject(ls->ul_BuildingID);

    livPrepareAnims();  // copy sprite anim to StdBuffer1

    BobSet(ls->us_EscapeCarBobId, b->CarXPos, b->CarYPos, LS_ESCAPE_CAR_X_OFFSET, LS_ESCAPE_CAR_Y_OFFSET);
    BobVis(ls->us_EscapeCarBobId);
}

static void lsSetAlarmPict(LSObject lso)
{
    uword x0, x1, y0, y1, destx, desty;

    lsCalcExactSize(lso, &x0, &y0, &x1, &y1);

    if (lso->uch_Chained & Const_tcCHAINED_TO_ALARM)
    {
        lsPrepareFromXMSBySize(16);

        destx = ((word)x1 - (word)x0 - 6) / 2 + x0 - 1;
        desty = ((word)y1 - (word)y0 - 7) / 2 + y0 + 2;

        lsBlitOneObject(24, destx, desty, 16);
    }
}

// zeichnet alle sichtbaren Türen in einem bestimmten Bereich neu
static void lsRefreshClosedDoors(uword us_X0, uword us_Y0, uword us_X1, uword us_Y1)
{
    NODE *node;

    ls->uch_ShowObjectMask = 0x40;

    for (node = (NODE *)LIST_HEAD(ls->p_ObjectRetrieval); NODE_SUCC(node); node = (NODE *)NODE_SUCC(node))
    {
        LSObject lso = (LSObject)OL_DATA(node);

        if (lsIsInside(lso, us_X0, us_Y0, us_X1, us_Y1))
            if (lsIsObjectADoor(lso))
                if (lso->uch_Visible == LS_OBJECT_VISIBLE)
                    lsShowOneObject(lso, LS_STD_COORDS, LS_STD_COORDS, LS_SHOW_DOOR | LS_SHOW_PREPARE_FROM_XMS);
    }

    ls->uch_ShowObjectMask = 0x0;
}

// dirty, dirty, verstoesst gegen so ziemlich alle Richtlinien von DerClou!
// und man glaubt es ja fast nicht - es sollte trotzdem funktionieren
// dieses lso entspricht der Statue, sie wird nicht dargestellt!, sondern
// es wird nur an lso->us_DestX, lso->us_DestY ein Sockel gesetzt
// die Src Koordinaten werden nicht (pfuii) aus den Daten genommen, sondern
// direkt aus der Grafik; Um die richtige Src-Grafik zu erhalten, wird mittels
// eines dummy Objektes die Funktion lsPrepareFromXMS aufgerufen
void lsRefreshStatue(LSObject lso)
{
    uword srcX, srcY, destX, destY, size;

    ls->uch_ShowObjectMask = 0x40;

    size = 16;  // stimmt die Größe ??

    lsPrepareFromXMSBySize(size);

    srcX = 16;  // aus der Grafik entnehmen und hier eintragen!
    srcY = 0;

    destX = lso->us_DestX + 7;
    destY = lso->us_DestY + 10;

    gfxNCH4OLMCGAToNCH4Mask(LS_PREPARE_BUFFER, l_wrp->p_BitMap, srcX, srcY, destX, destY, size, size, 320, 160);

    ls->uch_ShowObjectMask = 0x0;
}

void lsFastRefresh(LSObject lso)
{
    uword x0, x1, y0, y1;

    ls->uch_ShowObjectMask = 0x40;  // Bit 6 ignorieren

    switch (lso->Type)
    {
        case Item_Holztuer:
        case Item_Stahltuer:
        case Item_Tresorraum:
        case Item_Mauertor:
            if (lso->ul_Status & (1 << Const_tcOPEN_CLOSE_BIT))
            {
                word x0, y0;

                lsDoDoorRefresh(lso);

                x0 = max((word)lso->us_DestX - 32, 0);
                y0 = max((word)lso->us_DestY - 32, 0);

                lsRefreshClosedDoors(x0, y0, lso->us_DestX + 32, lso->us_DestY + 32);
            }
            else
                lsShowOneObject(lso, LS_STD_COORDS, LS_STD_COORDS, LS_SHOW_ALL | LS_SHOW_PREPARE_FROM_XMS);
            break;

        case Item_Gemaelde:
        case Item_Bild:
            // Gemaelde und Bilder werden, wenn sie genommen werden einfach
            // durch ein graues RectFill übermalt (Schattenfarbe)

            if (lso->uch_Visible == LS_OBJECT_VISIBLE)
                lsShowOneObject(lso, LS_STD_COORDS, LS_STD_COORDS, LS_SHOW_ALL | LS_SHOW_PREPARE_FROM_XMS);
            else
            {
                LSArea area = (LSArea)dbGetObject(lsGetActivAreaID());
                ubyte color = LS_REFRESH_SHADOW_COLOR1;

                lsCalcExactSize(lso, &x0, &y0, &x1, &y1);

                if (area->uch_Darkness == LS_DARKNESS) color = LS_REFRESH_SHADOW_COLOR0;

                gfxSetPens(l_wrp, color, color, color);

                gfxNCH4RectFill(l_wrp, x0, y0, x1, y1);

                lsSetAlarmPict(lso);
            }
            break;
        case Item_Statue:
            if (lso->uch_Visible == LS_OBJECT_VISIBLE)
                lsShowOneObject(lso, LS_STD_COORDS, LS_STD_COORDS, LS_SHOW_ALL | LS_SHOW_PREPARE_FROM_XMS);
            else
                lsRefreshStatue(lso);
            break;
        default:
            if (bProfidisk)
            {
                switch (lso->Type)
                {
                    case Item_Heiligenstatue:
                    case Item_Hottentotten_Figur:
                    case Item_Batman_Figur:
                    case Item_Dicker_Man:
                    case Item_Unbekannter:
                    case Item_Jack_the_Ripper_Figur:
                    case Item_Koenigs_Figur:
                    case Item_Wache_Figur:
                    case Item_Miss_World_1952:
                        if (lso->uch_Visible == LS_OBJECT_VISIBLE)
                            lsShowOneObject(lso, LS_STD_COORDS, LS_STD_COORDS, LS_SHOW_ALL | LS_SHOW_PREPARE_FROM_XMS);
                        else
                            lsDoDoorRefresh(lso);
                        break;
                    case Item_Postsack:
                        break;
                    default:
                        lsShowOneObject(lso, LS_STD_COORDS, LS_STD_COORDS, LS_SHOW_ALL | LS_SHOW_PREPARE_FROM_XMS);
                        break;
                }
            }

            else
            {
                lsShowOneObject(lso, LS_STD_COORDS, LS_STD_COORDS, LS_SHOW_ALL | LS_SHOW_PREPARE_FROM_XMS);
            }

            break;
    }

    switch (lso->Type)
    {
        case Item_Fenster:
            lsSetAlarmPict(lso);
            break;

        default:
            break;
    }

    ls->uch_ShowObjectMask = 0;  // alle Bits kopieren
}

// 2019-11-25
void lsPrepareFromXMSRastPort(struct XMSRastPort *rp)
{
    if (rp)
    {
        uint32_t buffer_size = rp->pSurface->w * rp->pSurface->h; /* temporary solution */
        if (LS_PREPARE_BUFFER_SIZE > buffer_size)
        {
            memset(LS_PREPARE_BUFFER, 0, LS_PREPARE_BUFFER_SIZE);
        }

        SDL_LockSurface(rp->pSurface);
        memcpy(LS_PREPARE_BUFFER, rp->pSurface->pixels, buffer_size);
        SDL_UnlockSurface(rp->pSurface);
    }
}

// 2019-11-25
void lsPrepareToXMSRastPort(struct XMSRastPort *rp)
{
    if (rp)
    {
        uint32_t buffer_size = rp->pSurface->w * rp->pSurface->h; /* temporary solution */
        if (LS_PREPARE_BUFFER_SIZE < buffer_size)
        {
            buffer_size = LS_PREPARE_BUFFER_SIZE;
        }

        SDL_LockSurface(rp->pSurface);
        memcpy(rp->pSurface->pixels, LS_PREPARE_BUFFER, buffer_size);
        SDL_UnlockSurface(rp->pSurface);
    }
}

// bringt die Collection, in der sich ein Bild eines lso befindet in den
// LS_PREPARE_BUFFER
static void lsPrepareFromXMSBySize(ubyte uch_Size)
{
    struct XMSRastPort *rp = NULL;

    switch (uch_Size)
    {
        case 16:
            rp = &LS_COLL16_XMS_RP;
            break;
        case 32:
            rp = &LS_COLL32_XMS_RP;
            break;
        case 48:
            rp = &LS_COLL48_XMS_RP;
            break;
    }

    lsPrepareFromXMSRastPort(rp);
}

static void lsBlitOneObject(uword offsetFact, word destx, word desty, uword size)
{
    uword srcWidth = 288;  // Quellbildschirm ist für gewöhnlich 288 breit
    uword srcX, srcY, perRow;

    // die 32er Objekte befinden sich auf einem Bildschirm, der
    // 320 Pixel breit ist
    if (size == 32) srcWidth = 320;

    perRow = srcWidth / size;

    srcY = (offsetFact / perRow) * size;
    srcX = (offsetFact % perRow) * size;

    if (ls->uch_ShowObjectMask)
        gfxNCH4OLMCGAToNCH4Mask(LS_PREPARE_BUFFER, l_wrp->p_BitMap, srcX, srcY, destx, desty, size, size, 320, 160);
    else
        gfxNCH4OLMCGAToNCH4(LS_PREPARE_BUFFER, l_wrp->p_BitMap, srcX, srcY, destx, desty, size, size, 320, 160);
}

int32_t lsShowOneObject(LSObject lso, word destx, word desty, uint32_t ul_Mode)
{
    Item item = (Item)dbGetObject(lso->Type);
    int32_t show = 0;
    uword offsetFact;

    switch (lso->Type)
    {
        case Item_Sockel:  // Sockel soll nicht dargestellt werden
            break;

        default:
            if (ul_Mode & LS_SHOW_ALL) show = 1;

            if ((!show) && (ul_Mode & LS_SHOW_WALL))
                if (lsIsObjectAWall(lso)) show = 1;

            // Türen nur darstellen, wenn sie sichtbar sind

            if ((!show) && (ul_Mode & LS_SHOW_DOOR))
                if (lsIsObjectADoor(lso) && lso->uch_Visible == LS_OBJECT_VISIBLE) show = 1;

            if ((!show) && (ul_Mode & LS_SHOW_SPECIAL))
                if (lsIsObjectSpecial(lso) && lso->uch_Visible == LS_OBJECT_VISIBLE) show = 1;

            if ((!show) && (ul_Mode & LS_SHOW_OTHER_0))
                if (lsIsObjectAStdObj(lso) && lso->uch_Visible == LS_OBJECT_VISIBLE) show = 1;

            if ((!show) && (ul_Mode & LS_SHOW_OTHER_1))
                if (lsIsObjectAnAddOn(lso) && lso->uch_Visible == LS_OBJECT_VISIBLE) show = 1;

            if (show)
            {
                if (ul_Mode & LS_SHOW_PREPARE_FROM_XMS)
                {
                    lsPrepareFromXMSBySize(lso->uch_Size);
                }

                offsetFact = item->OffsetFact + (lso->ul_Status & 3);

                if (destx == LS_STD_COORDS) destx = lso->us_DestX;

                if (desty == LS_STD_COORDS) desty = lso->us_DestY;

                lsBlitOneObject(offsetFact, destx, desty, item->Size);
            }
            break;
    }

    if (show) lsSetAlarmPict(lso);

    return show;
}

void lsBlitFloor(uword floorIndex, uword destx, uword desty)
{
    uword srcX;

    lsPrepareFromXMSRastPort(&LS_FLOOR_XMS_RP);

    srcX = ((ls->p_CurrFloor[floorIndex].uch_FloorType) & 0xf) * LS_FLOOR_X_SIZE;

    gfxNCH4PutMCGAToNCH4(LS_PREPARE_BUFFER, l_wrp->p_BitMap, srcX, 0, destx, desty, LS_FLOOR_X_SIZE, LS_FLOOR_Y_SIZE,
                         320, 160);
}

void lsSetViewPort(uword x, uword y) { gfxNCH4SetViewPort(x, y); }

void lsInitGfx(void)
{
    gfxSetVideoMode(GFX_VIDEO_NCH4);

    lsSetViewPort(0, 0);
    gfxNCH4SetSplit(256);
}

void lsCloseGfx(void)
{
    gfxSetVideoMode(GFX_VIDEO_MCGA);

    tcSetPermanentColors();  // mod 31-06-94 nach divereses Beschwerden (hg)
}

void lsScrollCorrectData(int32_t dx, int32_t dy)
{
    ls->us_WindowXPos += dx;
    ls->us_WindowYPos += dy;

    ls->us_RasInfoScrollX = (word)dx;
    ls->us_RasInfoScrollY = (word)dy;

    livSetVisLScape(ls->us_WindowXPos, ls->us_WindowYPos);
}

void lsDoScroll(void)
{
    gfxNCH4Scroll(ls->us_RasInfoScrollX, ls->us_RasInfoScrollY);

    ls->us_RasInfoScrollX = 0;
    ls->us_RasInfoScrollY = 0;
}

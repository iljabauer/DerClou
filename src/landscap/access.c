/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "landscap/landscap.h"
#include "landscap/landscap_p.h"

int32_t lsIsLSObjectInActivArea(LSObject lso)
{
    if (AskP(dbGetObject(ls->ul_AreaID), ConsistOfRelationID, lso, NO_PARAMETER, CMP_NO)) return 1;

    return 0;
}

void lsSetObjectRetrievalList(uint32_t ul_AreaId)
{
    int32_t i = 0;

    for (i = 0; i < 3; i++)
        if (ul_AreaId == ls->ul_ObjectRetrievalAreaId[i]) ls->p_ObjectRetrieval = ls->p_ObjectRetrievalLists[i];
}

uint32_t lsGetCurrObjectRetrieval(void)
{
    int32_t i = 0;

    for (i = 0; i < 3; i++)
        if (ls->p_ObjectRetrieval == ls->p_ObjectRetrievalLists[i]) return ls->ul_ObjectRetrievalAreaId[i];

    return 0;
}

int32_t lsIsObjectAStdObj(LSObject lso)
{
    if (lsIsObjectADoor(lso)) return 0;

    if (lsIsObjectAWall(lso)) return 0;

    if (lsIsObjectAnAddOn(lso)) return 0;

    if (lsIsObjectSpecial(lso)) return 0;

    return 1;
}

int32_t lsIsObjectADoor(LSObject lso)
{
    switch (lso->Type)
    {
        case Item_Holztuer:
        case Item_Stahltuer:
        case Item_Mauertor:
        case Item_Tresorraum:
            return 1;
    }

    return 0;
}

int32_t lsIsObjectAWall(LSObject lso)
{
    switch (lso->Type)
    {
        case Item_Mauer:
        case Item_Mauerecke:
        case Item_Steinmauer:
        case Item_Sockel:
            return 1;
    }
    if (bProfidisk)
    {
        switch (lso->Type)
        {
            case Item_verzierte_Saeule:
            case Item_Gelaender:
            case Item_Absperrung:
            case Item_Postsack:
            case Item_Lokomotive_vorne_rechts:
            case Item_Lokomotive_vorne_links:
            case Item_Lokomotive_oben:
            case Item_Lokomotive_seitlich:
            case Item_Lokomotive_Kabine:
            case Item_Lokomotive_Tuer:
                return 1;
        }
    }

    return 0;
}

// Objekte die den gleichen Refresh wie Tueren benoetigen
int32_t lsIsObjectSpecial(LSObject lso)
{
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
                return 1;
        }
    }

    return 0;
}

int32_t lsIsObjectAnAddOn(LSObject lso)
{
    switch (lso->Type)
    {
        case Item_Kasse:
        case Item_Vase:
        case Item_Statue:
        case Item_Kreuz:
        case Item_Kranz:
            return 1;
    }

    return 0;
}

uword lsGetObjectCount(void) { return ((uword)GetNrOfNodes(ls->p_ObjectRetrieval)); }

ubyte lsGetLoudness(uword x, uword y)
{
    word floorIndex = lsGetFloorIndex(x, y);
    word i = 0;
    word j = 0;
    word k = 0;

    /* Ursprünglich wurde loudness hier mit MaxVolume initialisiert    */
    /* dadurch waren in der Anzeige der Loudness auch die Nachbarn     */
    /* inbegriffen waren. Nebenwirkung: Es gab aber plötzlich, sobald  */
    /* man die Lautstärke überschritt Alarm durch Mikrophone ->        */
    /* tcAlarmByMicro, bei einer Änderung der Initialiserung, muß auch */
    /* TcAlarmByMicro geändert werden.   (hg, 14-02-94)                */
    ubyte loudness = 255;

    if ((!LS_NO_FLOOR(ls->p_CurrFloor[floorIndex].uch_FloorType)) &&
        LS_IS_MICRO_ON_FLOOR(ls->p_CurrFloor[floorIndex].uch_FloorType))
        loudness = 15;
    else
    {
        for (i = -1; (i < 2) && (loudness == 255); i++)
        {
            for (j = -1; (j < 2) && (loudness == 255); j++)
            {
                k = floorIndex + i * LS_FLOORS_PER_LINE + j;

                if ((k >= 0) && (k < LS_FLOORS_PER_LINE * LS_FLOORS_PER_COLUMN))
                {
                    if ((!LS_NO_FLOOR(ls->p_CurrFloor[k].uch_FloorType)) &&
                        LS_IS_MICRO_ON_FLOOR(ls->p_CurrFloor[k].uch_FloorType))
                        loudness = 50;
                }
            }
        }
    }

    return loudness;
}

uint32_t lsGetObjectState(uint32_t objID)
{
    LSObject obj = (LSObject)dbGetObject(objID);

    return (lsGetNewState(obj));
}

uint32_t lsGetStartArea(void)
{
    uint32_t areaID = 0; /* attention, planing has to be changed to! */

    startsWithAll(ls->ul_BuildingID, OLF_NORMAL, Object_LSArea);

    areaID = OL_NR(LIST_HEAD(ObjectList));

    return areaID;
}

uword lsGetFloorIndex(uword x, uword y)
{
    uword fpl = 0;
    uword row = 0;
    uword line = 0;

    fpl = LS_FLOORS_PER_LINE;

    row = x / LS_FLOOR_X_SIZE;
    line = y / LS_FLOOR_Y_SIZE;

    return (uword)(line * fpl + row);
}

static void lsExtendGetList(LIST *list, uint32_t nr, uint32_t type, void *data)
{
    struct ObjectNode *newNode = dbAddObjectNode(list, type, OLF_INCLUDE_NAME | OLF_INSERT_STAR);

    newNode->nr = nr;
    newNode->type = type;
    newNode->data = data;
}

LIST *lsGetObjectsByList(uword x, uword y, uword width, uword height, ubyte showInvisible, ubyte addLootBags)
{
    struct ObjectNode *node = NULL;
    LIST *list = (LIST *)CreateList(0);
    uint32_t i = 0;

    /* diverse Objekte eintragen */
    for (node = (struct ObjectNode *)LIST_HEAD(ls->p_ObjectRetrieval); NODE_SUCC((NODE *)node);
         node = (struct ObjectNode *)NODE_SUCC((NODE *)node))
    {
        LSObject lso = (LSObject)OL_DATA(node);

        if ((lso->ul_Status & (1L << Const_tcACCESS_BIT)) || (GamePlayMode & GP_LEVEL_DESIGN))
            if (showInvisible || lso->uch_Visible)
                if (lsIsInside(lso, x, y, x + width, y + height)) lsExtendGetList(list, OL_NR(node), lso->Type, lso);
    }

    /* Ausnahme: Beutesack eintragen! */
    if (addLootBags)
    {
        for (i = 9701; i <= 9708; i++)
        {
            LSObject lso = (LSObject)dbGetObject(i);

            if (lso->uch_Visible == LS_OBJECT_VISIBLE)
                if (lsIsInside(lso, x, y, x + width, y + height)) lsExtendGetList(list, i, Item_Beutesack, lso);
        }
    }

    return list;
}

void lsSetCollMode(ubyte collMode) { ls->uch_CollMode = collMode; }

uint32_t lsGetCurrBuildingID(void) { return ls->ul_BuildingID; }

uint32_t lsGetActivAreaID(void) { return (ls->ul_AreaID); }

LIST *lsGetRoomsOfArea(uint32_t ul_AreaId)
{
    LSArea area = (LSArea)dbGetObject(ul_AreaId);
    uint32_t roomRelId = area->ul_ObjectBaseNr + REL_HAS_ROOM_OFFSET;
    NODE *room = NULL;

    SetObjectListAttr(OLF_PRIVATE_LIST, Object_LSRoom);
    AskAll(area, roomRelId, BuildObjectList);

    for (room = LIST_HEAD(ObjectListPrivate); NODE_SUCC(room); room = NODE_SUCC(room))
    {
        LSRoom myroom = (LSRoom)OL_DATA(room);

        if ((word)myroom->us_LeftEdge < 0) myroom->us_LeftEdge = 0;

        if ((word)myroom->us_TopEdge < 0) myroom->us_TopEdge = 0;
    }

    return ObjectListPrivate;
}

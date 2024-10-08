/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
void InitEvidencePresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    Evidence e = (Evidence)dbGetObject(nr);
    char data[TXT_KEY_LENGTH] = {0};

    dbGetObjectName(e->pers, &data[0]);

    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 0);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->Recognition, 255L, texts, 1);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->WalkTrail, 255L, texts, 2);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->WaitTrail, 255L, texts, 3);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->WorkTrail, 255L, texts, 4);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->KillTrail, 255L, texts, 5);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->CallTrail, 255L, texts, 6);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->FotoTrail, 255L, texts, 8);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)e->PaperTrail, 255L, texts, 7);
}

void InitLootPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    CompleteLoot comp = (CompleteLoot)dbGetObject(CompleteLoot_LastLoot);
    uint32_t total;

    RemoveList(tcMakeLootList(Person_Matt_Stuvysunt, Relation_has));

    total = comp->Bild + comp->Gold + comp->Geld + comp->Juwelen + comp->Statue + comp->Kuriositaet + comp->HistKunst +
            comp->GebrauchsArt + comp->Vase + comp->Delikates;

    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Bild, 0L, texts, 0);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Gold, 0L, texts, 1);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Geld, 0L, texts, 2);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Juwelen, 0L, texts, 3);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Delikates, 0L, texts, 4);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Statue, 0L, texts, 5);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Kuriositaet, 0L, texts, 6);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->HistKunst, 0L, texts, 7);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->GebrauchsArt, 0L, texts, 8);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, comp->Vase, 0L, texts, 9);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, total, 0L, texts, 10);
}

void InitOneLootPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    Loot loot = (Loot)dbGetObject(nr);
    char data[TXT_KEY_LENGTH] = {0};
    uint32_t value;

    if (loot->Name == Kein_Name)
        dbGetObjectName(nr, &data[0]);
    else
        txtGetNthString(OBJECTS_ENUM_TXT, "enum_LootNameE", loot->Name, &data[0]);

    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 4);

    /* some nice guy put the value in this relation */
    /* (... and because he is really nice, he will kill this one after usage) */
    value = GetP(loot, hasLootRelationID, loot);

    AddPresentLine(presentationData, PRESENT_AS_NUMBER, value, 0L, texts, 5);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, loot->Weight, 0L, texts, 6);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, loot->Volume, 0L, texts, 7);
}

void InitObjectPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    LSObject lso = (LSObject)dbGetObject(nr);
    char data[TXT_KEY_LENGTH] = {0};
    LIST *l;

    dbGetObjectName(lso->Type, &data[0]);

    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 0);

    if (lso->uch_Chained & Const_tcCHAINED_TO_ALARM)
        AddPresentLine(presentationData, PRESENT_AS_TEXT, 0L, 0L, texts, 2);

    if (lso->uch_Chained & Const_tcCHAINED_TO_POWER)
        AddPresentLine(presentationData, PRESENT_AS_TEXT, 0L, 0L, texts, 1);

    if (lso->Type == Item_Stechuhr)
        AddPresentLine(presentationData, PRESENT_AS_NUMBER, ClockTimerGet(nr, nr), 0L, texts, 8);

    l = tcMakeLootList(nr, hasLootRelationID);

    if (LIST_EMPTY(l)) AddPresentLine(presentationData, PRESENT_AS_TEXT, 0L, 0L, texts, 3);

    RemoveList(l);
}

void InitToolPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    char data[TXT_KEY_LENGTH] = {0}, i;
    Tool obj;
    NODE *n;
    LIST *tools = txtGoKey(OBJECTS_ENUM_TXT, "enum_ItemE");
    LIST *abilities = txtGoKey(OBJECTS_ENUM_TXT, "enum_AbilityE");

    obj = (Tool)dbGetObject(nr);

    dbGetObjectName(nr, &data[0]);

    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 0);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)tcGetToolTraderOffer(obj), 0L, texts, 1);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)tcRGetDanger(obj), 255L, texts, 3);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)tcRGetVolume(obj), 255L, texts, 4);

    /*** Werkzeuge ***/

    toolRequiresAll(nr, OLF_INCLUDE_NAME | OLF_NORMAL, Object_Tool);

    for (n = (NODE *)LIST_HEAD(ObjectList), i = 5; NODE_SUCC(n); n = (NODE *)NODE_SUCC(n), i = 6)
        AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)(NODE_NAME(n)), 0L, texts, i);

    /*** Eigenschaften ***/

    toolRequiresAll(nr, OLF_INCLUDE_NAME | OLF_NORMAL, Object_Ability);

    if (!LIST_EMPTY(ObjectList))
    {
        AddPresentLine(presentationData, PRESENT_AS_TEXT, 0L, 0L, texts, 8L); /* "benötigt Wissen über..." */

        for (n = (NODE *)LIST_HEAD(ObjectList); NODE_SUCC(n); n = (NODE *)NODE_SUCC(n))
        {
            Ability ability = (Ability)OL_DATA(n);

            AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)toolRequiresGet(nr, OL_NR(n)), 255L, abilities,
                           (uword)ability->Name);
        }
    }

    /*** Verwendung ***/

    breakAll(nr, OLF_INCLUDE_NAME | OLF_NORMAL, Object_Item);

    if (!(LIST_EMPTY(ObjectList))) AddPresentLine(presentationData, PRESENT_AS_TEXT, 0L, 0L, texts, 7);

    for (n = (NODE *)LIST_HEAD(ObjectList); NODE_SUCC(n); n = (NODE *)NODE_SUCC(n))
    {
        uint32_t itemNr = OL_NR(n);
        uint32_t time = breakGet(nr, itemNr);
        Item item = (Item)OL_DATA(n);

        sprintf(&data[0], "%02u:%02u", time / 60, time % 60);

        AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, tools, (uword)item->Type);
    }

    RemoveList(tools);
    RemoveList(abilities);
}

void InitBuildingPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    char data[TXT_KEY_LENGTH] = {0};
    Building obj;

    obj = (Building)dbGetObject(nr);

    dbGetObjectName(nr, &data[0]);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 0);

    BuildTime((uint32_t)tcGetBuildPoliceT(obj), txtGetLanguage(), &data[0]);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 1);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)tcGetBuildValues(obj), 255L, texts, 2);

    txtGetNthString(OBJECTS_ENUM_TXT, "enum_RouteE", (uint32_t)obj->EscapeRoute, &data[0]);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 3);

    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Exactlyness, 255L, texts, 4);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)tcGetBuildGRate(obj), 255L, texts, 5);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)tcRGetBuildStrike(obj), 255L, texts, 6);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->RadioGuarding, 255L, texts, 7);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->GuardStrength, 255L, texts, 8);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->MaxVolume, 255L, texts, 9);
}

void InitPlayerPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    Player player = (Player)dbGetObject(nr);

    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)player->Money, 0L, texts, 0);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)player->StolenMoney, 0L, texts, 1);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)player->MyStolenMoney, 0L, texts, 2);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)player->MattsPart, 0L, texts, 3);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)player->NrOfBurglaries, 0L, texts, 4);
}

void InitPersonPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    char data[TXT_KEY_LENGTH] = {0}, i;
    LIST *abilities = NULL;
    NODE *node;
    uint32_t abiNr;
    Person obj;
    Ability abi;

    obj = (Person)dbGetObject(nr);

    dbGetObjectName(nr, &data[0]);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 0);

    txtGetNthString(OBJECTS_ENUM_TXT, "enum_JobE", (uint32_t)obj->Job, &data[0]);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 1);

    txtGetNthString(OBJECTS_ENUM_TXT, "enum_SexE", (uint32_t)obj->Sex, &data[0]);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 2);

    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)obj->Age, 0L, texts, 3);

    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Health, 255L, texts, 4);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Mood, 255L, texts, 5);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Intelligence, 255L, texts, 6);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Strength, 255L, texts, 7);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Stamina, 255L, texts, 8);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Loyality, 255L, texts, 9);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Skill, 255L, texts, 10);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Known, 255L, texts, 11);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Popularity, 255L, texts, 12);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Avarice, 255L, texts, 13);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)(255 - obj->Panic), 255L, texts, 14);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)(obj->KnownToPolice), 255L, texts, 15);

    hasAll(nr, OLF_PRIVATE_LIST | OLF_INCLUDE_NAME | OLF_INSERT_STAR, Object_Ability);
    abilities = ObjectListPrivate;

    if (!(LIST_EMPTY(abilities)))
    {
        AddPresentLine(presentationData, PRESENT_AS_TEXT, 0L, 0L, texts, 16);

        for (node = (NODE *)LIST_HEAD(abilities), i = 0; NODE_SUCC(node); node = (NODE *)NODE_SUCC(node), i++)
        {
            abiNr = ((struct ObjectNode *)GetNthNode(abilities, (uint32_t)i))->nr;
            abi = (Ability)dbGetObject(abiNr);

            txtGetNthString(OBJECTS_ENUM_TXT, "enum_AbilityE", (uint32_t)abi->Name, &data[0]);
            CreateNode(texts, 0L, data);

            AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)hasGet(nr, abiNr), 255L, texts, 17 + i);
        }
    }

    RemoveList(abilities);
}

void InitCarPresent(uint32_t nr, LIST *presentationData, LIST *texts)
{
    char data[TXT_KEY_LENGTH] = {0};
    Car obj;

    obj = (Car)dbGetObject(nr);

    dbGetObjectName(nr, data);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 0);

    txtGetNthString(OBJECTS_ENUM_TXT, "enum_LandE", (uint32_t)obj->Land, data);
    AddPresentLine(presentationData, PRESENT_AS_TEXT, (intptr_t)data, 0L, texts, 1);

    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)tcRGetCarAge(obj), 0L, texts, 2);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)tcGetCarPrice(obj), 0L, texts, 3);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)tcGetCarPS(obj), 0L, texts, 4);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)tcGetCarSpeed(obj), 0L, texts, 5);
    AddPresentLine(presentationData, PRESENT_AS_NUMBER, (intptr_t)obj->PlacesInCar, 0L, texts, 6);

    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->State, 255L, texts, 7);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->BodyWorkState, 255L, texts, 8);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->TyreState, 255L, texts, 9);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->MotorState, 255L, texts, 10);
    if (!bProfidisk)
        AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Capacity, 7000000L, texts, 11);
    else
        AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)obj->Capacity, 9000000L, texts, 11);
    AddPresentLine(presentationData, PRESENT_AS_BAR, (intptr_t)tcGetCarStrike(obj), 255L, texts, 12);
}

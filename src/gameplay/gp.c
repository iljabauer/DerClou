/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "gameplay/gp.h"

#include "gameplay/gamefunc.h"
#include "port/port.h"

void InitLocations(void);
void FreeLocations(void);

void InitSceneInfo(void);
void FreeSceneInfo(void);

void PrepareStory(char *filename);
void LoadSceneforStory(struct NewScene *dest, FILE *file);
void LoadStory(ubyte *filename);

void InitConditions(struct Scene *scene, struct NewScene *ns);
void FreeConditions(struct Scene *scene);
int32_t GetEventCount(uint32_t EventNr);
int32_t CheckConditions(struct Scene *scene);
void EventDidHappen(uint32_t EventNr);

struct Scene *GetStoryScene(struct Scene *scene);

uint32_t GamePlayMode = 0;
ubyte RefreshMode = 0;

struct Film *film = 0L;
struct SceneArgs SceneArgs;

void InitStory(char *story_filename)
{
    if (film) CloseStory();

    film = (struct Film *)MemAlloc(sizeof(struct Film));

    film->EnabledChoices = 0xffffffffL;

    PrepareStory(story_filename);
    InitLocations();
    LinkScenes();
    PatchStory();
}

void CloseStory(void)
{
    int32_t i = 0;

    if (film)
    {
        if (film->loc_names) RemoveList(film->loc_names);

        for (i = 0; i < film->AmountOfScenes; i++)
        {
            if (film->gameplay[i].bed) FreeConditions(&film->gameplay[i]);
            if (film->gameplay[i].std_succ) RemoveList(film->gameplay[i].std_succ);
        }

        if (film->gameplay) MemFree(film->gameplay, sizeof(struct Scene) * film->AmountOfScenes);

        MemFree(film, sizeof(struct Film));

        film = 0L;
    }
}

void SetEnabledChoices(uint32_t ChoiceMask) { film->EnabledChoices = ChoiceMask; }

void RefreshCurrScene(void)
{
    NODE *node = (NODE *)GetNthNode(film->loc_names, GetLocation);

    tcRefreshLocationInTitle(GetLocation);
    PlayAnim(NODE_NAME(node), (word)30000, GFX_NO_REFRESH | GFX_ONE_STEP | GFX_BLEND_UP);

    RefreshMenu();
}

void InitLocations(void)
{
    LIST *l = (LIST *)CreateList(0);
    char pathname[TXT_KEY_LENGTH];

    dskBuildPathName(TEXT_DIRECTORY, LOCATIONS_TXT, pathname);

    if (ReadList(l, (uint32_t)(sizeof(struct TCEventNode)), pathname, 0))
        film->loc_names = l;
    else
        NewErrorMsg(Disk_Defect, __FILE__, __func__, 1);
}

void PatchStory(void)
{
    struct TCEventNode *node = NULL;

    if (!(GamePlayMode & GP_DEMO))
    {
        GetScene(26214400L)->bed->Ort = 3; /* 4th Burglary, Hotelzimmer */
        GetScene(26738688L)->bed->Ort = 7; /* Arrest, Polizei!          */

        GetScene(SCENE_KASERNE_OUTSIDE)->Moeglichkeiten = 15;
        GetScene(SCENE_KASERNE_INSIDE)->Moeglichkeiten = 265;

        GetScene(SCENE_KASERNE_OUTSIDE)->LocationNr = 66;
        GetScene(SCENE_KASERNE_INSIDE)->LocationNr = 65;

        GetScene(SCENE_KASERNE_OUTSIDE)->Dauer = 17;
        GetScene(SCENE_KASERNE_INSIDE)->Dauer = 57;

        GetScene(SCENE_STATION)->Moeglichkeiten |= WAIT;

        if (bProfidisk) GetScene(SCENE_PROFI_26)->LocationNr = 75;

        /* change possibilites in story_9 too! */

        /* für die Kaserne hier einen Successor eingetragen! */
        GetLocScene(65)->std_succ = (LIST *)CreateList(0);
        node = (struct TCEventNode *)CreateNode(GetLocScene(65)->std_succ, sizeof(struct TCEventNode), 0L);
        node->EventNr = SCENE_KASERNE_OUTSIDE; /* wurscht... */

        GetLocScene(66)->std_succ = (LIST *)CreateList(0);
        node = (struct TCEventNode *)CreateNode(GetLocScene(66)->std_succ, sizeof(struct TCEventNode), 0L);
        node->EventNr = SCENE_KASERNE_INSIDE; /* wurscht... */

        film->StartScene = SCENE_STATION;
    }
}

uint32_t PlayStory(void)
{
    struct Scene *curr = NULL;
    struct Scene *next = NULL;
    struct Scene *story_scene = 0;
    ubyte interr_allowed = 1;
    ubyte first = 1;

    if (GamePlayMode & GP_STORY_OFF)
    {
        if (GamePlayMode & GP_DEMO)
        {
            curr = GetScene(SCENE_CARS_VANS);
        }
        else
        {
            tcAddPlayerMoney(5000);
            curr = GetScene(SCENE_HOTEL_ROOM);
        }
    }
    else
    {
        curr = GetScene(film->StartScene);
    }

    SetCurrentScene(curr);
    film->alter_Ort = curr->LocationNr;
    SetLocation(-2);

    while ((curr->EventNr != SCENE_THE_END) && (curr->EventNr != SCENE_NEW_GAME))
    {
        if (!CheckConditions(curr))
        {
            NewErrorMsg(Internal_Error, __FILE__, __func__, 2);
        }

        /* Entscheidung für eine Szene getroffen ! */

        SceneArgs.ReturnValue = 0L;
        SceneArgs.Ueberschrieben = 0;

        /* wenn Szene Storyszene ist, dann Musik beibehalten */
        /* (Storyszenen ändern sie selbst in Done */
        /* ansonsten wird die Musi hier verändert */

        if (!story_scene)
        {
            tcPlaySound();
        }

        /* ab jetzt soll nach einem Diskettenwechsel refresht werden */
        /* -> GP_STORY_TOWN Flag setzen */
        /* Achtung: dieses Flag nur nach der 1.Szene setzen -> "first" */

        if (first)
        {
            film->StoryIsRunning = GP_STORY_TOWN;
            first = 0;
        }

        /* die neue Szene initialisieren ! ( Bühnenbild aufbauen )*/
        if (curr->Init)
        {
            curr->Init();
        }

        /* gibt es irgendein Ereignis das jetzt geschehen kann, und */
        /* den Standardablauf unterbricht ? */

        /* if (GamePlayMode & GP_DEMO)
        DemoDialog(); */

        story_scene = 0;

        if (interr_allowed && (!(GamePlayMode & GP_STORY_OFF)))
        {
            if ((story_scene = GetStoryScene(curr)))
            {
                interr_allowed = 0;
            }
        }
        else
        {
            story_scene = 0;
        }

        if (!story_scene)
        {
            SceneArgs.Ueberschrieben = 0;

            if (curr->Done)
            {
                SceneArgs.Moeglichkeiten = curr->Moeglichkeiten & film->EnabledChoices;
                curr->Done(); /* Funktionalität */
            }
            else
            {
                NewErrorMsg(Internal_Error, __FILE__, __func__, 3);
            }

            EventDidHappen(curr->EventNr);
            AddVTime(curr->Dauer);

            /* jetzt kann wieder unterbrochen werden ! */
            interr_allowed = 1;

            /* der Spieler ist fertig mit dieser Szene - aber wie geht es weiter ? */
            if (SceneArgs.ReturnValue)
            {
                next = GetScene(SceneArgs.ReturnValue); /* Nachfolger festlegen */
            }
            else
            {
                NewErrorMsg(Internal_Error, __FILE__, __func__, 4);
            }
        }
        else
        {
            next = story_scene; /* Unterbrechung durch die Storyszene ! */
        }

        curr = next;
        SetCurrentScene(curr);
    } /* While Schleife */

    film->StoryIsRunning = GP_STORY_BEFORE;

    StopAnim();

    return curr->EventNr;
}

struct Scene *GetStoryScene(struct Scene *curr)
{
    uint32_t i = 0;
    uint32_t j = 0;

    for (i = 0; i < film->AmountOfScenes; i++)
    {
        if (film->gameplay[i].LocationNr == -1)
        {
            struct Scene *sc = &film->gameplay[i];

            if (sc != curr)
            {
                j = CalcRandomNr(0L, 255L);

                if (j <= (uint32_t)(sc->Probability))
                    if (CheckConditions(sc)) return (sc);
            }
        }
    }

    return 0;
}

struct Scene *GetScene(uint32_t EventNr)
{
    int32_t i = 0;
    struct Scene *sc = NULL;

    for (i = 0; i < film->AmountOfScenes; i++)
        if (EventNr == film->gameplay[i].EventNr) sc = &(film->gameplay[i]);

    return sc;
}

int32_t GetEventCount(uint32_t EventNr)
{
    struct Scene *sc = NULL;

    if ((sc = GetScene(EventNr)))
        return ((int32_t)(sc->Geschehen));
    else
        return 0;
}

void EventDidHappen(uint32_t EventNr)
{
    struct Scene *sc = NULL;
    uint32_t max = CAN_ALWAYS_HAPPEN;

    if ((sc = GetScene(EventNr)))
        if (sc->Geschehen < max) sc->Geschehen += 1;
}

int32_t CheckConditions(struct Scene *scene)
{
    struct Bedingungen *bed = NULL;
    NODE *node = NULL;

    if (scene->LocationNr != -1L) return (1L);

    /* es handelt sich um keine Std Szene -> ueberprüfen ! */
    /* überprüfen, ob Szene nicht schon zu oft geschehen ist ! */
    if ((scene->Anzahl != ((uword)(CAN_ALWAYS_HAPPEN))) && (scene->Geschehen) >= (scene->Anzahl)) return (0L);

    /* Jetzt die einzelnen Bedingungen überprüfen */
    if (!(bed = (scene->bed))) return (1L);

    if (bed->Ort != -1L)                            /* spielt der Ort eine Rolle ? */
        if (GetLocation != (bed->Ort)) return (0L); /* spielt eine Rolle und ist nicht erfüllt */

    /*
     * Überprüfen, ob ein Event eingetreten ist,
     * das nicht geschehen darf !
     */

    if (bed->n_events)
    {
        for (node = LIST_HEAD(bed->n_events); NODE_SUCC(node); node = (NODE *)NODE_SUCC(node))
        {
            if (GetEventCount(((struct TCEventNode *)node)->EventNr)) return (0L);
        }
    }

    /*
     * sind alle Events eingetreten, die Bedingung sind ?
     *
     */

    if (bed->events)
    {
        for (node = LIST_HEAD(bed->events); NODE_SUCC(node); node = (NODE *)NODE_SUCC(node))
        {
            if (!GetEventCount(((struct TCEventNode *)node)->EventNr)) return (0L);
        }
    }

    return 1L;
}

void PrepareStory(char *filename)
/*
 * completely revised 02-02-93
 * tested : 26-03-93
 * revised : 2014-07-01 - templer
 */
{
    int32_t i = 0;
    int32_t j = 0;
    struct Scene *scene = NULL;
    struct StoryHeader SH = {0};
    struct NewScene NS = {0};
    struct TCEventNode *node = NULL;
    FILE *file = NULL;
    char pathname[TXT_KEY_LENGTH] = {0};

    dskBuildPathName(DATA_DIRECTORY, filename, pathname);

    /* StoryHeader laden ! */

    file = dskOpen(pathname, "rb", 0);

    dskRead(file, SH.StoryName, sizeof(SH.StoryName));
    dskRead(file, &SH.EventCount, sizeof(uint32_t));
    dskRead(file, &SH.SceneCount, sizeof(uint32_t));

    dskRead(file, &SH.AmountOfScenes, sizeof(uint32_t));
    dskRead(file, &SH.AmountOfEvents, sizeof(uint32_t));

    dskRead(file, &SH.StartZeit, sizeof(uint32_t));
    dskRead(file, &SH.StartOrt, sizeof(uint32_t));
    dskRead(file, &SH.StartSzene, sizeof(uint32_t));

    EndianL(&SH.EventCount);
    EndianL(&SH.SceneCount);
    EndianL(&SH.AmountOfScenes);
    EndianL(&SH.AmountOfEvents);
    EndianL(&SH.StartZeit);
    EndianL(&SH.StartOrt);
    EndianL(&SH.StartSzene);

    film->AmountOfScenes = SH.AmountOfScenes;

    film->StartZeit = SH.StartZeit;

    film->akt_Minute = 543; /* 09:03 */
    film->akt_Tag = film->StartZeit;
    film->akt_Ort = film->StartOrt = SH.StartOrt;
    film->StartScene = SH.StartSzene;

    if (film->AmountOfScenes)
    {
        film->gameplay = (struct Scene *)MemAlloc(sizeof(struct Scene) * film->AmountOfScenes);
        if (!film->gameplay) NewErrorMsg(No_Mem, __FILE__, __func__, 6);
    }
    else
    {
        NewErrorMsg(Disk_Defect, __FILE__, __func__, 7);
    }

    for (i = 0; i < film->AmountOfScenes; i++)
    {
        LoadSceneforStory(&NS, file);

        scene = &(film->gameplay[i]);

        scene->EventNr = NS.EventNr;

        if (NS.NewOrt == -1 || NS.AnzahlderEvents || NS.AnzahlderN_Events) /* Storyszene ? */
            InitConditions(scene, &NS);                                    /* ja ! -> Bedingungen eintragen */
        else
            film->gameplay[i].bed = NULL; /* Spielablaufszene : keine Bedingungen ! */

        /* Scene Struktur füllen : */
        scene->Done = StdDone;
        scene->Init = StdInit;
        scene->Moeglichkeiten = NS.Moeglichkeiten;
        scene->Dauer = NS.Dauer;
        scene->Anzahl = NS.Anzahl;
        scene->Geschehen = (NS.Geschehen);
        scene->Probability = NS.Possibility;
        scene->LocationNr = NS.NewOrt;

        /* Nachfolgerliste aufbauen !  */
        /* Achtung! auch Patch ändern! */

        if (NS.AnzahlderNachfolger)
        {
            scene->std_succ = (LIST *)CreateList(0);

            for (j = 0; j < NS.AnzahlderNachfolger; j++)
            {
                node = (struct TCEventNode *)CreateNode(scene->std_succ, (uint32_t)(sizeof(struct TCEventNode)), 0L);

                node->EventNr = NS.nachfolger[j];
            }

            if (NS.nachfolger) MemFree(NS.nachfolger, sizeof(uint32_t) * NS.AnzahlderNachfolger);
        }
        else
            scene->std_succ = NULL;
    }

    /* von den Events muß nichts geladen werden ! */
    dskClose(file);
}

void InitConditions(struct Scene *scene, struct NewScene *ns)
{
    struct Bedingungen *bed = NULL;
    struct TCEventNode *node = NULL;
    int32_t i = 0;

    bed = (struct Bedingungen *)MemAlloc(sizeof(struct Bedingungen));

    bed->Ort = ns->Ort;

    if (ns->AnzahlderEvents)
    {
        bed->events = (LIST *)CreateList(0);

        for (i = 0; i < ns->AnzahlderEvents; i++)
        {
            node = (struct TCEventNode *)CreateNode(bed->events, (uint32_t)(sizeof(struct TCEventNode)), 0);

            node->EventNr = ns->events[i];
        }

        if (ns->events) MemFree(ns->events, sizeof(uint32_t) * ns->AnzahlderEvents);
    }
    else
        bed->events = NULL;

    if (ns->AnzahlderN_Events)
    {
        bed->n_events = (LIST *)CreateList(0);

        for (i = 0; i < ns->AnzahlderN_Events; i++)
        {
            node = (struct TCEventNode *)CreateNode(bed->n_events, (uint32_t)(sizeof(struct TCEventNode)), 0);

            node->EventNr = ns->n_events[i];
        }

        if (ns->n_events) MemFree(ns->n_events, sizeof(uint32_t) * ns->AnzahlderN_Events);
    }
    else
        bed->n_events = NULL;

    scene->bed = bed;
}

void FreeConditions(struct Scene *scene)
{
    if (scene->bed)
    {
        if (scene->bed->events) RemoveList(scene->bed->events);
        if (scene->bed->n_events) RemoveList(scene->bed->n_events);

        MemFree(scene->bed, sizeof(struct Bedingungen));

        scene->bed = NULL;
    }
}

void LoadSceneforStory(struct NewScene *dest, FILE *file)
{
    uint32_t *event_nrs = NULL;
    uint32_t i = 0;
    uint32_t tmp = 0;

    /* struct NewScene is byte-aligned
  and needs some padding... */
    dskRead(file, &dest->EventNr, sizeof(uint32_t));
    dskRead(file, dest->SceneName, sizeof(dest->SceneName));
    dskRead(file, &dest->Tag, sizeof(int32_t));
    dskRead(file, &dest->MinZeitPunkt, sizeof(int32_t));
    dskRead(file, &dest->MaxZeitPunkt, sizeof(int32_t));
    dskRead(file, &dest->Ort, sizeof(int32_t));
    dskRead(file, &dest->AnzahlderEvents, sizeof(uint32_t));
    dskRead(file, &dest->AnzahlderN_Events, sizeof(uint32_t));
    dskRead(file, &tmp, sizeof(uint32_t));
    dskRead(file, &tmp, sizeof(uint32_t));
    dskRead(file, &dest->AnzahlderNachfolger, sizeof(uint32_t));
    dskRead(file, &tmp, sizeof(uint32_t));
    dskRead(file, &dest->Moeglichkeiten, sizeof(uint32_t));
    dskRead(file, &dest->Dauer, sizeof(uint32_t));
    dskRead(file, &dest->Anzahl, sizeof(uword));
    dskRead(file, &dest->Geschehen, sizeof(uword));
    dskRead(file, &dest->Possibility, sizeof(ubyte));
    dskRead(file, &dest->Sample, sizeof(uint32_t));
    dskRead(file, &dest->Anim, sizeof(uint32_t));
    dskRead(file, &dest->NewOrt, sizeof(int32_t));

    EndianL(&dest->EventNr);
    EndianL((uint32_t *)&dest->Tag);
    EndianL((uint32_t *)&dest->MinZeitPunkt);
    EndianL((uint32_t *)&dest->MaxZeitPunkt);
    EndianL((uint32_t *)&dest->Ort);
    EndianL(&dest->AnzahlderEvents);
    EndianL(&dest->AnzahlderN_Events);
    EndianL(&dest->AnzahlderNachfolger);
    EndianL(&dest->Moeglichkeiten);
    EndianL(&dest->Dauer);
    EndianW(&dest->Anzahl);
    EndianW(&dest->Geschehen);
    EndianL(&dest->Sample);
    EndianL(&dest->Anim);
    EndianL((uint32_t *)&dest->NewOrt);

    /* allocate mem for events and read them */
    if (dest->AnzahlderEvents)
    {
        event_nrs = (uint32_t *)MemAlloc(sizeof(uint32_t) * dest->AnzahlderEvents);
        if (!event_nrs) NewErrorMsg(No_Mem, __FILE__, __func__, 8);

        for (i = 0; i < dest->AnzahlderEvents; i++)
        {
            dskRead(file, &event_nrs[i], sizeof(uint32_t));
            EndianL(&event_nrs[i]);
        }
    }
    else
        event_nrs = NULL;

    dest->events = event_nrs;

    /* allocate mem for n_events and read them */
    if (dest->AnzahlderN_Events)
    {
        event_nrs = (uint32_t *)MemAlloc(sizeof(uint32_t) * dest->AnzahlderN_Events);
        if (!event_nrs) NewErrorMsg(No_Mem, __FILE__, __func__, 9);

        for (i = 0; i < dest->AnzahlderN_Events; i++)
        {
            dskRead(file, &event_nrs[i], sizeof(uint32_t));
            EndianL(&event_nrs[i]);
        }
    }
    else
        event_nrs = NULL;

    dest->n_events = event_nrs;

    /* allocate mem for successors and read them */
    if (dest->AnzahlderNachfolger)
    {
        event_nrs = (uint32_t *)MemAlloc(sizeof(uint32_t) * dest->AnzahlderNachfolger);
        if (!event_nrs) NewErrorMsg(No_Mem, __FILE__, __func__, 10);

        for (i = 0; i < dest->AnzahlderNachfolger; i++)
        {
            dskRead(file, &event_nrs[i], sizeof(uint32_t));
            EndianL(&event_nrs[i]);
        }
    }
    else
        event_nrs = NULL;

    dest->nachfolger = event_nrs;
}

void AddVTime(uint32_t add)
{
    uint32_t time = 0;
    uint32_t tag = 0;

    time = GetMinute + add;

    if (time >= MINUTES_PER_DAY)
    {
        tag = GetDay + time / MINUTES_PER_DAY;

        SetDay(tag);
        time = time % MINUTES_PER_DAY;
    }

    SetMinute(time);
    tcTheAlmighty(time);
}

uint32_t GetAmountOfScenes(void) /* for extern modules */
{
    if (film)
        return film->AmountOfScenes;
    else
        return 0L;
}

void SetCurrentScene(struct Scene *scene) { film->act_scene = scene; }

struct Scene *GetCurrentScene(void)
{
    struct Scene *sc = NULL;

    if (film) sc = film->act_scene;

    return sc;
}

struct Scene *GetLocScene(uint32_t locNr)
{
    int32_t i = 0;
    struct Scene *sc = NULL;

    for (i = 0; i < film->AmountOfScenes; i++)
        if (((sc = &film->gameplay[i])->LocationNr) == locNr) return (sc);

    NewErrorMsg(Internal_Error, __FILE__, __func__, 12);
    return NULL;
}

void FormatDigit(uint32_t digit, char *s)
{
    if (digit < 10)
        sprintf(s, "0%u", digit);
    else
        sprintf(s, "%u", digit);
}

char *BuildTime(uint32_t min, char language, char *time)
{
    uint32_t h = (min / 60) % 24;
    char s[TXT_KEY_LENGTH];

    min = min % 60;

    FormatDigit(h, s);
    sprintf(time, "%s:", s);
    FormatDigit(min, s);
    strcat(time, s);

    return time;
}

char *BuildDate(uint32_t days, char language, char *date)
{
    ubyte days_per_month[12] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    uint32_t i = 0;
    uint32_t p_year = 0;
    uint32_t year = 0;
    uint32_t month = 0;
    uint32_t day = 0;
    char s[TXT_KEY_LENGTH];

    for (i = 0, p_year = 0; i < 12; i++) p_year += days_per_month[i];

    year = days / p_year; /* welches Jahr ? */

    days = days % p_year; /* wieviele Tage noch in diesem Jahr */

    for (i = 0, p_year = 0; i < 12; i++)
    {
        p_year += days_per_month[i];

        if (days < p_year)
        {
            month = i;
            i = 13;
        }
    }

    day = days - (p_year - days_per_month[month]);

    switch (language)
    {
        case TXT_LANG_ENGLISH:
        case TXT_LANG_FRENCH:
        case TXT_LANG_SPANISH:
        case TXT_LANG_GERMAN:
            FormatDigit(day + 1, s);
            strcpy(date, s);
            strcat(date, ".");
            FormatDigit(month + 1, s);
            strcat(date, s);
            strcat(date, ".");
            FormatDigit(year, s);
            strcat(date, s);
            break;
        default:
            break;
    }

    return date;
}

char *GetCurrLocName(void)
{
    int32_t index = 0;

    index = GetCurrentScene()->LocationNr;

    return (NODE_NAME(GetNthNode(film->loc_names, index)));
}

/**
 * Scene management types
 */

export enum SceneId {
    Intro = 0,
    MainMenu = 1,
    London = 2,
    Planning = 3,
    Burglary = 4,
    // Add more as needed
}

export interface SceneArgs {
    returnValue: SceneId | null;
    data?: any;
}

export interface GameScene {
    id: SceneId;
    init?: () => void;
    done?: () => void;
    update?: (delta: number) => SceneArgs;
}

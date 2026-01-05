import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load the Preloader assets
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}

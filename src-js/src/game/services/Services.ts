
import { InputHandler } from './InputHandler';
import { ReplayService } from './ReplayService';
import { TextService } from './TextService';
import { StoryService } from './StoryService';
import { IffService } from './IffService';
import { AnimService } from './AnimService';
import { FontService } from './FontService';

class ServiceContainer {
    public input: InputHandler;
    public replay: ReplayService;
    public text: TextService;
    public story: StoryService;
    public iff: IffService;
    public anim: AnimService;
    public font: FontService;

    constructor() {
        this.replay = new ReplayService();
        this.input = new InputHandler();
        this.text = new TextService();
        this.story = new StoryService();
        this.iff = new IffService();
        this.anim = new AnimService();
        this.font = new FontService();

        // Connect Input to Replay
        this.input.setReplayService(this.replay);
    }
}

export const Services = new ServiceContainer();

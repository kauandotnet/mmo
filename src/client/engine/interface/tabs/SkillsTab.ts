import Rectangle from '../../../../common/Rectangle';
import Panel from '../components/Panel';
import SpriteAtlas from '../components/SpriteAtlas';
import SpriteAtlasImage from '../components/SpriteAtlasImage';
import TabContainer from '../TabContainer';
import BaseTab, { setUpTabPanel } from '../BaseTab';
import Label from '../components/Label';
import {
    SkillDef, Skill, expToLevel, skillName,
} from '../../../../common/CharacterDef';
import Tooltip from '../components/Tooltip';
import UIParent from '../components/UIParent';
import { Point } from '../../../../common/Point';
import Input from '../../Input';

const atlasIconSize = 25;
const atlas = new SpriteAtlas('assets/icons/skills.png');

export class SkillIcon extends Panel {
    public icon: SpriteAtlasImage;
    private lblLevel: Label;
    private _current: number;
    public get current(): number { return this._current; }
    public set current(val: number) { this._current = val; this.updateLabel(); }
    private _level: number;
    public get level(): number { return this._level; }
    public set level(val: number) { this._level = val; this.updateLabel(); }

    public name: string;
    public experience: number;

    public constructor(parent: SkillsTab, margin: number, iconSize: number, width: number, height: number) {
        super(parent);
        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.backgroundColor = 'rgba(255,255,255,0.1)';
        this.style.margin = `${margin / 2}px ${margin}px`;
        this.style.borderRadius = '2px';
        this.width = width;
        this.height = height;

        this.addEventListener('mouseenter', (self: SkillIcon, ev: MouseEvent) => {
            Input.openTooltip(new Point(ev.clientX, ev.clientY), [
                this.name,
                `Lvl: ${this.current} / ${this.level}`,
                `Exp: ${this.experience.toFixed(0)}`,
            ]);
        });
        this.addEventListener('mousemove', (self: SkillIcon, ev: MouseEvent) => {
            Input.positionTooltip(new Point(ev.clientX, ev.clientY));
        });
        this.addEventListener('mouseleave', (self: SkillIcon, ev: MouseEvent) => {
            Input.closeTooltip();
        });

        this.icon = new SpriteAtlasImage(this, atlas, new Rectangle(0, 0, atlasIconSize, atlasIconSize));
        this.icon.style.position = 'initial';
        this.icon.style.display = 'inline-block';
        this.icon.width = iconSize;
        this.icon.height = iconSize;

        this.lblLevel = new Label(this, 'x/x');
        this.lblLevel.style.position = 'initial';
        this.lblLevel.style.display = 'inline-block';
    }

    private updateLabel(): void {
        this.lblLevel.text = `${this.current} / ${this.level}`;
    }
}

export default class SkillsTab extends BaseTab {
    public get name(): string { return 'Skills'; }
    private readonly skillCount: number = 23;
    private readonly skillsPerRow: number = 3;
    private readonly margin: number = 5;
    private readonly skillWidth: number = 83;
    private readonly skillHeight: number = 32;
    private readonly skillIconSize: number = 28;
    private skillIcons: Map<number, SkillIcon> = new Map();

    public constructor(parent: TabContainer) {
        super(parent);
        setUpTabPanel(this);
        this.width = this.skillsPerRow * (this.skillWidth + 2 * this.margin);
        this.height = parent.height;

        for (let i = 0; i < this.skillCount; i++) {
            this.skillIcons.set(i, new SkillIcon(this, this.margin, this.skillIconSize, this.skillWidth, this.skillHeight));
        }
    }

    private getIconRect(id: Skill): Rectangle {
        const x = id % 3;
        const y = Math.floor(id / 3);
        return new Rectangle(x * atlasIconSize, y * atlasIconSize, atlasIconSize, atlasIconSize);
    }

    public setSkills(skills: SkillDef[]): void {
        for (const skill of skills) {
            const icon = this.skillIcons.get(skill.id);
            icon.level = expToLevel(skill.experience);
            icon.current = skill.current;
            icon.experience = skill.experience;
            icon.name = skillName(skill.id);
            icon.icon.src = this.getIconRect(skill.id);
        }
    }
}

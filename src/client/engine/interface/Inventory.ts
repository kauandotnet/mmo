import Rectangle from '../../../common/Rectangle';
import Panel from './components/Panel';
import UIParent from './components/UIParent';
import Item from '../LocalItem';
import ItemDef from '../../../common/ItemDef';
import SpriteAtlas from './components/SpriteAtlas';
import SpriteAtlasImage from './components/SpriteAtlasImage';

const slotSize = 32;
const atlas = new SpriteAtlas('assets/icons/atlas.png');

const slotBg = 'rgba(255,255,255,0.0)';
const slotBgOver = 'rgba(255,255,255,0.2)';

class InventorySlot extends Panel {
    public icon: SpriteAtlasImage;
    public item: Item;
    public slot: number;
    public inventory: Inventory;

    public constructor(item: Item, slot: number, parent: Inventory, margin: number) {
        super(parent);
        this.inventory = parent;
        this.element.draggable = true;
        this.item = item;
        this.slot = slot;

        this.updateIcon();

        this.style.position = 'initial';
        this.style.display = 'inline-block';
        this.style.margin = `${margin}px`;
        this.style.backgroundColor = slotBg;

        this.element.addEventListener('dragstart', (ev: DragEvent) => {
            ev.dataTransfer.setData('text/plain', slot.toString());
        });
        this.element.addEventListener('drop', (ev: DragEvent) => {
            const data = ev.dataTransfer.getData('text');
            this.inventory.swapSlots(this.slot, Number(data));
            // @ts-ignore
            ev.target.style.backgroundColor = slotBg;
            ev.dataTransfer.clearData();
            ev.preventDefault();
        });
        this.element.addEventListener('dragenter', (ev) => {
            // @ts-ignore
            ev.target.style.backgroundColor = slotBgOver;
            ev.preventDefault();
        });
        this.element.addEventListener('dragleave', (ev) => {
            // @ts-ignore
            ev.target.style.backgroundColor = slotBg;
            ev.preventDefault();
        });
        this.element.addEventListener('dragover', (ev) => ev.preventDefault());
    }

    private getIconOffset(id: number): [number, number] {
        const stride = 16;
        const x = id % stride;
        const y = Math.floor(id / stride);
        return [x, y];
    }

    public updateIcon(): void {
        if (this.icon) this.icon.dispose();
        const [x, y] = this.getIconOffset(this.item.data.icon);
        this.icon = new SpriteAtlasImage(this, atlas, new Rectangle(x * 32, y * 32, 32, 32));
        this.icon.style.position = 'initial';
        this.icon.width = slotSize;
        this.icon.height = slotSize;
    }
}

export default class Inventory extends Panel {
    private readonly slotCount: number = 28;
    private readonly slotsPerRow: number = 4;
    private readonly margin: number = 5;
    private readonly slotSize: number = 32;
    private readonly slotsPerCol: number = this.slotCount / this.slotsPerRow;
    private slots: Map<number, InventorySlot> = new Map();

    public constructor() {
        super(UIParent.get());

        this.width = (this.slotSize + (this.margin * 2)) * this.slotsPerRow;
        this.height = (this.slotSize + (this.margin * 2)) * (this.slotCount / this.slotsPerRow);

        this.style.bottom = '0';
        this.style.right = '0';

        this.style.backgroundColor = 'rgba(0,0,0,0.2)';

        for (let i = 0; i < 28; i++) {
            this.setSlot(i, new Item(<ItemDef>{
                id: 0,
                icon: 85,
            }));
        }
    }

    public swapSlots(a: number, b: number): void {

    }

    public setSlot(slot: number, item: Item): void {
        const old = this.slots.get(slot);
        if (old) old.dispose();
        this.slots.set(slot, new InventorySlot(item, slot, this, this.margin));
    }
}

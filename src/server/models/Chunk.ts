import ChunkDef from '../../common/ChunkDef';
import { Point, PointDef } from '../../common/Point';
import Rectangle from '../../common/Rectangle';
import Unit from './Unit';
import Player from './Player';
import { GroundItemDef } from '../../common/ItemDef';

export const WALKABLE = 0;
export const NOT_WALKABLE = 1;

export default class Chunk {
    public def: ChunkDef;
    public navmap: number[][];
    public allUnits: Map<string, Unit> = new Map();
    public units: Map<string, Unit> = new Map();
    public players: Map<string, Player> = new Map();
    public groundItems: Map<string, GroundItemDef> = new Map();
    public size: number;

    public constructor(def: ChunkDef, size: number) {
        this.def = def;
        this.size = size;
        this.generateNavmap();
    }

    private generateNavmap(): void {
        // init all to walkable
        this.navmap = [];
        for (let i = 0; i < this.size; i++) {
            this.navmap[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.navmap[i][j] = WALKABLE;
            }
        }
        // make doodads not walkable
        for (const doodad of this.def.doodads) {
            if (!doodad.walkable) {
                // set the doodads hitboxes as not walkable
                for (const nb of doodad.navblocks) {
                    const i = doodad.y + nb.y;
                    const j = doodad.x + nb.x;
                    if (i >= this.size || i < 0) continue; // TODO: this ignores navblocks off the side of the chunk
                    if (j >= this.size || j < 0) continue;
                    this.navmap[i][j] = NOT_WALKABLE;
                }
            }
        }
    }

    public get worldOffset(): Point {
        return new Point(
            (this.def.x * this.size) - this.size / 2,
            (this.def.y * this.size) - this.size / 2,
        );
    }

    public containsPoint(point: PointDef): boolean {
        const offset = this.worldOffset;
        const bounds = new Rectangle(offset.x, offset.y, this.size, this.size);
        return bounds.contains(Point.fromDef(point));
    }
}
import * as THREE from 'three';
import NetClient from '../engine/NetClient';
import {
    PacketHeader, PointPacket, TargetPacket, InteractPacket, IDPacket,
} from '../../common/Packet';
import Unit from './Unit';
import Input, { MouseButton } from '../engine/Input';
import { WorldPoint, TilePoint } from '../../common/Point';
import CharacterDef from '../../common/definitions/CharacterDef';
import GroundItem from './GroundItem';
import Graphics from '../engine/graphics/Graphics';
import World from './World';
import Doodad from './Doodad';
import { ContextOptionDef } from '../engine/interface/components/ContextMenu';
import Chunk from './Chunk';

declare interface Player extends Unit {
    emit(event: 'loaded', self: Player): boolean;
    emit(event: 'death', self: Player): boolean;
    emit(event: 'disposed', self: Player): boolean;
    emit(event: 'moveTargetUpdated', self: Player, pos: TilePoint): boolean;

    on(event: 'loaded', listener: (self: Player) => void): this;
    on(event: 'death', listener: (self: Player) => void): this;
    on(event: 'disposed', listener: (self: Player) => void): this;
    on(event: 'moveTargetUpdated', listener: (self: Player, pos: TilePoint) => void): this;
}

class Player extends Unit {
    public data: CharacterDef;

    public constructor(world: World, data: CharacterDef) {
        super(world, data);

        this._isPlayer = true;
    }

    private tryInteract(intersects: THREE.Intersection[]): boolean {
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            for (const int of intersects) {
                if (int.object.userData.interactable) {
                    const clickedDoodad = <Doodad>int.object.userData.doodad;
                    Input.playClickMark(Input.mousePos(), 'red');
                    NetClient.send(PacketHeader.PLAYER_INTERACT, <InteractPacket>{
                        uuid: clickedDoodad.def.interact.uuid,
                        ccx: clickedDoodad.chunk.def.x,
                        ccy: clickedDoodad.chunk.def.y,
                    });
                    return true;
                }
            }
        }
        return false;
    }

    private tryPickUp(intersects: THREE.Intersection[]): boolean {
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            for (const int of intersects) {
                if ('groundItem' in int.object.userData) {
                    const clickedItem = <GroundItem>int.object.userData.groundItem;
                    Graphics.setOutlines([clickedItem.model.obj], new THREE.Color(0xFF0000));
                    Input.playClickMark(Input.mousePos(), 'red');
                    NetClient.send(PacketHeader.PLAYER_LOOT, <IDPacket>{ uuid: clickedItem.def.item.uuid });
                    return true;
                }
            }
        }
        return false;
    }

    private tryTarget(intersects: THREE.Intersection[]): boolean {
        // select a target if the mosue is clicked
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            for (const int of intersects) {
                if ('unit' in int.object.userData) {
                    const clickedUnit = <Unit>int.object.userData.unit;
                    // but dont target ourselves
                    if (clickedUnit.data.uuid !== this.world.player.data.uuid) {
                        this.world.player.data.target = clickedUnit.data.uuid;
                        // Graphics.setOutlines([clickedUnit.model.obj], new THREE.Color(0xFF0000));
                        Input.playClickMark(Input.mousePos(), 'red');
                        NetClient.send(PacketHeader.PLAYER_TARGET, <TargetPacket>{ target: this.world.player.data.target });
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public moveTo(pos: TilePoint): void {
        NetClient.send(PacketHeader.PLAYER_MOVETO, <PointPacket>{ x: pos.x, y: pos.y });
        this.emit('moveTargetUpdated', this, pos);
    }

    private tryMove(mousePoint: THREE.Vector3): boolean {
        if (Input.mouseStartDown(MouseButton.LEFT)) {
            if (mousePoint) {
                const tilePoint = new WorldPoint(mousePoint, this.world.chunkWorld).toTile();
                this.moveTo(tilePoint);
                Input.playClickMark(Input.mousePos(), 'yellow');
                return true;
            }
        }
        return false;
    }

    private showContextMenu(mousePoint: WorldPoint, intersects: THREE.Intersection[]): void {
        const ids: Set<string> = new Set(); // sometimes we can intersect a complex mesh more than once
        const options: ContextOptionDef[] = [];
        for (const int of intersects) {
            const data = int.object.userData;
            if (data.chunk) {
                const chunk = <Chunk>data.chunk;
                if (ids.has(chunk.def.id)) continue; // only add one set of options per chunk intersect
                ids.add(chunk.def.id);
                options.push(<ContextOptionDef>{
                    text: 'Walk here',
                    listener: () => {
                        if (mousePoint) {
                            const tilePoint = new WorldPoint(mousePoint, this.world.chunkWorld).toTile();
                            this.moveTo(tilePoint);
                            Input.playClickMark(Input.mousePos(), 'yellow');
                        }
                    },
                });
            } else if (data.unit) {
                const unit = <Unit>data.unit;
                if (unit.data.uuid !== this.world.player.data.uuid) { // dont target ourselves
                    if (ids.has(unit.data.uuid)) continue; // only add one set of options per unit intersect
                    ids.add(unit.data.uuid);
                    options.push(<ContextOptionDef>{
                        text: `Attack ${unit.data.name} (level-${unit.data.level})`,
                        listener: () => {
                            this.world.player.data.target = unit.data.uuid;
                            Input.playClickMark(Input.mousePos(), 'red');
                            NetClient.send(PacketHeader.PLAYER_TARGET, <TargetPacket>{ target: this.world.player.data.target });
                        },
                    });
                    if (unit.isPlayer) {
                        options.push(<ContextOptionDef>{
                            text: `Follow ${unit.data.name} (level-${unit.data.level})`,
                            listener: () => { console.log('Following NYI'); },
                        });
                        options.push(<ContextOptionDef>{
                            text: `Trade with ${unit.data.name} (level-${unit.data.level})`,
                            listener: () => { console.log('Trading NYI'); },
                        });
                    }
                }
            } else if (data.doodad && data.doodad.def.interact) {
                const doodad = <Doodad>data.doodad;
                const verb = doodad.def.interact.nodeType;
                if (ids.has(doodad.def.interact.uuid)) continue; // only add one set of options per doodad intersect
                ids.add(doodad.def.interact.uuid);
                options.push(<ContextOptionDef>{
                    text: `${verb} ${doodad.def.uuid}`,
                    listener: () => {
                        Input.playClickMark(Input.mousePos(), 'red');
                        NetClient.send(PacketHeader.PLAYER_INTERACT, <InteractPacket>{
                            uuid: doodad.def.interact.uuid,
                            ccx: doodad.chunk.def.x,
                            ccy: doodad.chunk.def.y,
                        });
                    },
                });
            } else if (data.groundItem) {
                const groundItem = <GroundItem>data.groundItem;
                if (ids.has(groundItem.def.item.uuid)) continue; // only add one set of options per item intersect
                ids.add(groundItem.def.item.uuid);
                options.push(<ContextOptionDef>{
                    text: `Pick up ${groundItem.def.item.name}`,
                    listener: () => {
                        Input.playClickMark(Input.mousePos(), 'red');
                        NetClient.send(PacketHeader.PLAYER_LOOT, <IDPacket>{
                            uuid: groundItem.def.item.uuid,
                        });
                    },
                });
            }
        }
        options.push(<ContextOptionDef>{
            text: 'Cancel',
            listener: () => {},
        });
        Input.openContextMenu(Input.mousePos(), options);
    }

    public tick(): void {
        super.tick();
        if (this.movesThisTick <= 0) {
            this.emit('moveTargetUpdated', this, null);
        }
    }

    public updateClientPlayer(mousePoint: WorldPoint, intersects: THREE.Intersection[]): void {
        if (this.data) {
            if (this.tryTarget(intersects)) return;
            if (this.tryPickUp(intersects)) return;
            if (this.tryInteract(intersects)) return;
            if (this.tryMove(mousePoint)) return;

            if (Input.wasMousePressed(MouseButton.RIGHT)) {
                this.showContextMenu(mousePoint, intersects);
            }
        }
    }
}

export default Player;

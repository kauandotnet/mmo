import * as THREE from 'three';
import { EventEmitter } from 'events';
import Scene from './graphics/Scene';
import LocalPlayer from './LocalPlayer';
import NetClient from './NetClient';
import {
    PacketHeader, TickPacket, ChunkListPacket, WorldInfoPacket, DamagePacket,
} from '../../common/Packet';
import LocalUnit from './LocalUnit';
import UnitDef from '../../common/UnitDef';
import ChunkWorld from './ChunkWorld';
import Chunk from './Chunk';
import { TilePoint, WorldPoint } from '../../common/Point';
import CharacterDef from '../../common/CharacterDef';

type WorldEvent = 'unit_added' | 'unit_removed' |
                   'player_added' | 'player_removed' |
                   'chunk_loaded' | 'chunk_unloaded' |
                   'tick' | 'unit_damaged';

export default class World {
    public scene: Scene;
    public chunkWorld: ChunkWorld;
    public units: Map<string, LocalUnit> = new Map();
    public players: Map<number, LocalPlayer> = new Map();
    private _player: LocalPlayer;
    private _tickTimer: number;
    private _tickRate: number;
    private currentTick: number;
    private chunkViewDist: number;
    private eventEmitter: EventEmitter = new EventEmitter();

    public constructor(scene: Scene, info: WorldInfoPacket) {
        this.scene = scene;
        this._player = new LocalPlayer(this, null);
        this._tickRate = info.tickRate;
        this.chunkViewDist = info.chunkViewDist;
        this.chunkWorld = new ChunkWorld(this.scene, info.chunkSize, info.chunkViewDist);

        NetClient.on(PacketHeader.WORLD_TICK, (p: TickPacket) => {
            this.onTick(p);
        });
        NetClient.on(PacketHeader.CHUNK_LOAD, (p: ChunkListPacket) => {
            const chunkLoads: Promise<Chunk>[] = [];
            for (const def of p.chunks) {
                chunkLoads.push(this.chunkWorld.loadChunk(def));
            }
            Promise.all(chunkLoads).then(() => {
                this.chunkWorld.pruneChunks(new TilePoint(p.center.x, p.center.y, this.chunkWorld));
                this.chunkWorld.stitchChunks();
            });
        });
        NetClient.send(PacketHeader.CHUNK_LOAD);

        NetClient.on(PacketHeader.UNIT_DAMAGE, (packet: DamagePacket) => {
            this.emit('unit_damaged', packet);
        });
    }

    public get player(): LocalPlayer { return this._player; }
    public get tickTimer(): number { return this._tickTimer; }
    public get tickRate(): number { return this._tickRate; }
    public get tickProgression(): number { return this._tickTimer / this._tickRate; }

    public on(event: WorldEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.on(event, listener);
    }

    public off(event: WorldEvent, listener: (...args: any[]) => void): void {
        this.eventEmitter.off(event, listener);
    }

    private emit(event: WorldEvent, ...args: any[]): void {
        this.eventEmitter.emit(event, ...args);
    }

    private tickUnits(tick: number, unitDefs: UnitDef[]): void {
        for (const def of unitDefs) {
            let unit = this.units.get(def.id);
            if (!unit) {
                unit = new LocalUnit(this, def);
                this.units.set(def.id, unit);
                this.emit('unit_added', unit);
            }
            unit.onTick(def);
            unit.lastTickUpdated = tick;
        }
    }

    private tickPlayers(tick: number, playerDefs: CharacterDef[]): void {
        for (const def of playerDefs) {
            let player = this.players.get(def.charID);
            if (!player) {
                player = new LocalPlayer(this, def);
                this.players.set(def.charID, player);
                this.emit('player_added', player);
            }
            player.onTick(def);
            player.lastTickUpdated = tick;
        }
    }

    private removeStaleUnits(): void {
        for (const [id, u] of this.units) {
            if (u.lastTickUpdated !== this.currentTick) {
                this.emit('unit_removed', u);
                u.dispose();
                this.units.delete(id);
            }
        }
    }

    private removeStalePlayers(): void {
        for (const [id, p] of this.players) {
            if (p.lastTickUpdated !== this.currentTick) {
                this.emit('player_removed', p);
                p.dispose();
                this.players.delete(id);
            }
        }
    }

    public onTick(packet: TickPacket): void {
        this._tickTimer = 0; // reset tick timer
        this.currentTick = packet.tick; // update the current tick

        this.player.onTick(packet.self);
        this.tickUnits(packet.tick, packet.units);
        this.tickPlayers(packet.tick, packet.players);
        this.removeStaleUnits();
        this.removeStalePlayers();

        this.emit('tick');
    }

    private updateUnits(delta: number): void {
        for (const [_, u] of this.units) {
            u.update(delta);
        }
    }

    private updatePlayers(delta: number): void {
        for (const [_, p] of this.players) {
            p.update(delta);
        }
    }

    public update(delta: number, mousePoint: WorldPoint, intersects: THREE.Intersection[]): void {
        this.player.update(delta);
        this.player.updateClientPlayer(mousePoint, intersects);
        this.updateUnits(delta);
        this.updatePlayers(delta);

        // increment tick timer
        this._tickTimer += delta;
    }
}

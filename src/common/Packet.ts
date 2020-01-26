import AccountDef from './AccountDef';
import CharacterDef from './CharacterDef';
import { PointDef } from './Point';
import ChunkDef from './ChunkDef';
import UnitDef from './UnitDef';
import ItemDef from './ItemDef';
import InventoryDef, { InventoryType } from './InventoryDef';

export enum PacketHeader {
    AUTH_LOGIN = 'AUTH_LOGIN',
    AUTH_LOGOUT = 'AUTH_LOGOUT',

    CHAR_MYLIST = 'CHAR_MYLIST',
    CHAR_CREATE = 'CHAR_CREATE',
    CHAR_GET = 'CHAR_GET',

    PLAYER_ENTERWORLD = 'PLAYER_ENTERWORLD',
    PLAYER_LEAVEWORLD = 'PLAYER_LEAVEWORLD',
    PLAYER_MOVETO = 'PLAYER_MOVETO',
    PLAYER_UPDATE_SELF = 'PLAYER_UPDATE_SELF',
    PLAYER_UPDATE = 'PLAYER_UPDATE',
    PLAYER_TARGET = 'PLAYER_TARGET',

    INVENTORY_SWAP = 'INVENTORY_SWAP',
    INVENTORY_FULL = 'INVENTORY_FULL',
    INVENTORY_ITEM = 'INVENTORY_ITEM',

    UNIT_UPDATE = 'UNIT_UPDATE',
    UNIT_DAMAGE = 'UNIT_DAMAGE',

    CHAT_EVENT = 'CHAT_EVENT',

    CHUNK_LOAD = 'CHUNK_LOAD',

    WORLD_INFO = 'WORLD_INFO',
    WORLD_TICK = 'WORLD_TICK',
}

export enum Channel {
    AUTH,
    CHARACTER,
    WORLD,
    PLAYER
}

export interface Packet { }

export interface ResponsePacket extends Packet {
    success: boolean;
    message: string;
}

export interface AuthLoginPacket extends Packet {
    username: string;
    password: string;
}

export interface AccountPacket extends Packet, ResponsePacket, AccountDef { }

export interface WorldInfoPacket extends Packet {
    tickRate: number;
    chunkSize: number;
    chunkViewDist: number;
}

export interface CharacterPacket extends Packet, CharacterDef { }
export interface CharacterListPacket extends Packet, ResponsePacket {
    characters: CharacterDef[];
}

export interface UnitPacket extends Packet, UnitDef { }

export interface TickPacket extends Packet {
    self: CharacterDef;
    units: UnitDef[];
    players: CharacterDef[];
    tick: number;
}

export interface PointPacket extends Packet, PointDef { }

export interface ChunkPacket extends Packet, ChunkDef { }
export interface ChunkListPacket extends Packet {
    center: PointDef;
    chunks: ChunkDef[];
}

export interface ChatMsgPacket extends Packet {
    authorId: string,
    authorName: string,
    timestamp: number,
    message: string
}

export interface TargetPacket extends Packet {
    target: string
}

export interface DamagePacket extends Packet {
    attacker: string;
    defender: string;
    damage: number; // could add type here for poision etc
}

export interface InventorySwapPacket extends Packet {
    slotA: number;
    slotB: number;
}

export interface ItemPacket extends Packet, ItemDef {
    invType: InventoryType;
}

export interface InventoryPacket extends Packet, InventoryDef { }

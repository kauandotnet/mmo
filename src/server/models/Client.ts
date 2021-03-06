import io from 'socket.io';
import Player from './Player';
import { PacketHeader, AuthLoginPacket, CharacterPacket } from '../../common/Packet';
import {
    handleLogout, handleLogin, handleSignup, handleMyList, handleCreate,
} from '../Authentication';
import WorldManager from '../managers/WorldManager';
import CharacterEntity from '../entities/Character.entity';

/*
Client connects to socketio
    Client authenticates
        Client can fetchchar list, create char, delete char
            Client enters world with a valid character
                Client can now play the game
*/

export default class Client {
    private world: WorldManager;
    public socket: io.Socket;
    public player: Player;
    public get id(): string { return this.socket.id; }

    public constructor(socket: io.Socket, world: WorldManager) {
        this.socket = socket;
        this.world = world;

        this.registerBase();
    }

    private registerBase(): void {
        this.socket.on(PacketHeader.AUTH_SIGNUP, (packet) => this.handleAuthSignup(packet));
        this.socket.on(PacketHeader.AUTH_LOGIN, (packet) => this.handleAuthLogin(packet));
        this.socket.on(PacketHeader.AUTH_LOGOUT, () => this.handleAuthLogout());
        this.socket.on('disconnect', () => this.handleAuthLogout());
    }

    private registerAuthenticated(): void {
        this.socket.on(PacketHeader.CHAR_MYLIST, () => this.handleCharMyList());
        this.socket.on(PacketHeader.CHAR_CREATE, (packet) => this.handleCharCreate(packet));
        this.socket.on(PacketHeader.PLAYER_ENTERWORLD, (packet) => this.handlePlayerEnterWorld(packet));
        this.socket.on(PacketHeader.PLAYER_LEAVEWORLD, () => this.handlePlayerLeaveWorld());
    }

    private async handleAuthSignup(packet: AuthLoginPacket): Promise<void> {
        const resp = await handleSignup(this.socket, packet);
        this.socket.emit(PacketHeader.AUTH_SIGNUP, resp);
    }

    private async handleAuthLogin(packet: AuthLoginPacket): Promise<void> {
        const resp = await handleLogin(this.socket, packet);
        if (resp.success) this.registerAuthenticated();
        this.socket.emit(PacketHeader.AUTH_LOGIN, resp);
    }

    private async handleAuthLogout(): Promise<void> {
        this.socket.removeAllListeners();
        this.registerBase();
        this.world.leaveWorld(this);
        await handleLogout(this.socket);
    }

    private handlePlayerEnterWorld(packet: CharacterPacket): void {
        if (packet) {
            CharacterEntity.findOneSorted({ id: Number(packet.id) }).then((ce) => {
                this.player = new Player(this.world, ce, this);
                this.world.enterWorld(this);
            });
        }
    }

    private handlePlayerLeaveWorld(): void {
        this.socket.removeAllListeners();
        this.registerAuthenticated(); // we are still authenticated
        this.registerBase();
        this.world.leaveWorld(this);
    }

    private async handleCharMyList(): Promise<void> {
        const resp = await handleMyList(this.socket);
        this.socket.emit(PacketHeader.CHAR_MYLIST, resp);
    }

    private async handleCharCreate(packet: CharacterPacket): Promise<void> {
        const resp = await handleCreate(this.id, packet);
        this.socket.emit(PacketHeader.CHAR_CREATE, resp);
    }
}

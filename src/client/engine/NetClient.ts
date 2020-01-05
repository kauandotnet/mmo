import * as io from 'socket.io-client';
import { IndexOptions } from 'typeorm';
import {
    Packet, PacketHeader, ResponsePacket, AuthLoginPacket, AuthLoginRespPacket,
} from '../../common/Packet';
import Engine from './Engine';
import SceneManager from './scene/SceneManager';

export default class NetClient {
    private static _client: SocketIOClient.Socket;
    private static accountRecvCallback: (resp: AuthLoginRespPacket) => void;

    public static init(url: string = 'http://localhost:3000') {
        this._client = io.connect(url);
        this.initEvents();
    }

    private static initEvents() {
        this.client.on('disconnect', () => {
            this.accountRecvCallback = null;
            Engine.account = null;
            SceneManager.changeScene('login');
        });
        this.client.on(PacketHeader.AUTH_LOGIN, (resp: AuthLoginRespPacket) => {
            Engine.account = resp.account;
            this.accountRecvCallback(resp);
        });
    }

    public static login(username: string, password: string, cb: (resp: AuthLoginRespPacket) => void) {
        NetClient.send(PacketHeader.AUTH_LOGIN, <AuthLoginPacket>{
            username,
            password,
        });
        this.accountRecvCallback = cb;
    }

    public static logout() {
        this.accountRecvCallback = null;
        Engine.account = null;
        this.send(PacketHeader.AUTH_LOGOUT, null);
    }

    public static send(header: PacketHeader, packet?: Packet) {
        this.client.emit(header.toString(), packet);
    }

    public static get client(): SocketIOClient.Socket {
        return this._client;
    }

    public static on(header: PacketHeader, cb: (p: ResponsePacket) => void) {
        this.client.on(header, cb);
    }

    public static onNext(header: PacketHeader, cb: (p: ResponsePacket) => void) {
        const fn = (p: ResponsePacket) => {
            cb(p);
            this.client.off(header, fn);
        };
        this.client.on(header, fn);
    }
}
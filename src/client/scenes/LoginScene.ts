import { AmbientLight } from 'three';
import { AccountPacket, PacketHeader, AuthLoginPacket } from '../../common/Packet';
import GameScene from '../engine/scene/GameScene';
import Button from '../engine/interface/components/Button';
import UIParent from '../engine/interface/components/UIParent';
import SceneManager from '../engine/scene/SceneManager';
import Panel from '../engine/interface/components/Panel';
import Label from '../engine/interface/components/Label';
import TextBox from '../engine/interface/components/TextBox';
import NetClient from '../engine/NetClient';
import Dialog from '../engine/interface/components/Dialog';
import Graphics from '../engine/graphics/Graphics';
import Camera from '../engine/graphics/Camera';
import Model from '../engine/graphics/Model';
import Scene from '../engine/graphics/Scene';

export default class LoginScene extends GameScene {
    private background: Model;

    public constructor() {
        super('login');
    }

    public initGUI(): void {
        const panel = new Panel(UIParent.get());
        panel.style.border = '1px solid white';
        panel.style.width = '300px';
        panel.style.height = '200px';
        panel.style.padding = '20px';
        panel.style.backgroundColor = 'rgba(10, 10, 10, 0.5)';
        panel.centreHorizontal();
        panel.centreVertical();
        this.addGUI(panel);

        const lblUsername = new Label(panel, 'Account Name');
        lblUsername.style.position = 'initial';
        lblUsername.style.width = '100%';
        lblUsername.style.color = '#e6cc80';
        lblUsername.style.fontSize = '130%';
        this.addGUI(lblUsername);

        const txtUsername = new TextBox(panel);
        txtUsername.style.position = 'initial';
        txtUsername.style.width = '100%';
        txtUsername.style.backgroundColor = 'rgba(10,10,10,0.8)';
        txtUsername.text = 'arwic';
        this.addGUI(txtUsername);

        const lblPassword = new Label(panel, 'Account Password');
        lblPassword.style.position = 'initial';
        lblPassword.style.width = '100%';
        lblPassword.style.color = '#e6cc80';
        lblPassword.style.fontSize = '130%';
        this.addGUI(lblPassword);

        const txtPassword = new TextBox(panel, 'password');
        txtPassword.style.position = 'initial';
        txtPassword.style.width = '100%';
        txtPassword.style.backgroundColor = 'rgba(10,10,10,0.8)';
        txtPassword.text = 'asd';
        this.addGUI(txtPassword);

        const dialog = new Dialog(UIParent.get(), '', false);
        this.addGUI(dialog);

        const btnLogin = new Button(panel, 'Login');
        btnLogin.style.width = '150px';
        btnLogin.centreHorizontal();
        btnLogin.style.marginTop = '30px';
        btnLogin.addEventListener('click', (self: Button, ev: MouseEvent) => {
            NetClient.sendRecv(PacketHeader.AUTH_LOGIN, <AuthLoginPacket>{
                username: txtUsername.text,
                password: txtPassword.text,
            }).then((resp: AccountPacket) => {
                if (resp.success) {
                    SceneManager.changeScene('char-select');
                } else {
                    dialog.setText(resp.message);
                    dialog.show();
                }
            });
        });
        this.addGUI(btnLogin);
    }

    public async init(): Promise<void> {
        this.initGUI();

        this.scene = new Scene();
        this.camera = new Camera(45, Graphics.viewportWidth / Graphics.viewportHeight, 0.1, 2000);

        const light = new AmbientLight(0xffffff, 3);
        light.position.set(0, 0, 1).normalize();
        this.scene.add(light);

        this.background = await Model.loadDef('assets/models/ui/mainmenu/mainmenu.model.json');
        this.background.getAnim('Stand').then((a) => a.play());
        this.scene.add(this.background.obj);

        this.camera.position.set(5.095108853409366, -1.049448850028543, -2.400366781879153);
        this.camera.rotation.set(2.2974621772131085, 1.1874227779871385, -2.335010669610211);

        super.init();
    }

    public final(): void {
        super.final();
    }

    public update(delta: number): void {

    }

    public draw(): void {
        super.draw();
    }
}

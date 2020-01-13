import { Key } from 'ts-key-enum';
import Point from '../../common/Point';

export enum MouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2,
}

export default class Input {
    private static keyStates: Map<string, boolean> = new Map();
    private static lastKeyStates: Map<string, boolean> = new Map();
    private static mouseButtonStates: Map<MouseButton, boolean> = new Map();
    private static lastMouseButtonStates: Map<MouseButton, boolean> = new Map();
    private static mousePosition: Point;
    private static clickMarker: HTMLImageElement;
    private static clickMarkerDim: number = 16;

    public static init(canvas: HTMLCanvasElement) {
        this.mousePosition = new Point(0, 0);

        window.addEventListener('keydown', (ev: KeyboardEvent) => {
            this.setKeyState(ev, true);
        });
        window.addEventListener('keyup', (ev: KeyboardEvent) => {
            this.setKeyState(ev, false);
        });
        canvas.addEventListener('mousedown', (ev: MouseEvent) => {
            this.setMouseState(ev, true);
            ev.preventDefault();
        });
        canvas.addEventListener('mouseup', (ev: MouseEvent) => {
            this.setMouseState(ev, false);
        });
        canvas.addEventListener('mousemove', (ev: MouseEvent) => {
            this.mousePosition.x = ev.clientX;
            this.mousePosition.y = ev.clientY;
        });

        this.clickMarker = document.createElement('img');
        document.body.appendChild(this.clickMarker);
        this.clickMarker.src = 'assets/imgs/click.gif';
        this.clickMarker.style.position = 'fixed';
        this.clickMarker.style.display = 'none';
        this.clickMarker.style.pointerEvents = 'none';
    }

    public static playClickMark(p: Point, color: string) {
        this.clickMarker.style.left = `${p.x - this.clickMarkerDim / 2}px`;
        this.clickMarker.style.top = `${p.y - this.clickMarkerDim / 2}px`;
        this.clickMarker.style.width = `${this.clickMarkerDim}px`;
        this.clickMarker.style.height = `${this.clickMarkerDim}px`;
        this.clickMarker.style.color = 'red';
        this.clickMarker.style.display = 'initial';
        this.clickMarker.style.filter = `opacity(.5) drop-shadow(0 0 0 ${color})`;
        this.clickMarker.style.webkitFilter = `opacity(.5) drop-shadow(0 0 0 ${color})`;
        // eslint-disable-next-line no-self-assign
        this.clickMarker.src = this.clickMarker.src;
    }

    public static afterUpdate() {
        this.lastKeyStates = new Map(this.keyStates);
        this.lastMouseButtonStates = new Map(this.mouseButtonStates);
    }

    private static setKeyState(ev: KeyboardEvent, down: boolean) {
        this.keyStates.set(<Key>ev.key, down);
    }

    private static setMouseState(ev: MouseEvent, down: boolean) {
        this.mouseButtonStates.set(ev.button, down);
    }

    public static isKeyDown(key: Key | string): boolean {
        return this.keyStates.get(key);
    }

    public static wasKeyDown(key: Key | string): boolean {
        return this.lastKeyStates.get(key);
    }

    public static wasKeyPressed(key: Key | string): boolean { // check if the key was just released this frame
        return this.wasKeyDown(key) && !this.isKeyDown(key);
    }

    public static isMouseDown(btn: MouseButton): boolean {
        return this.mouseButtonStates.get(btn);
    }

    public static wasMouseDown(btn: MouseButton): boolean {
        return this.lastMouseButtonStates.get(btn);
    }

    public static wasMousePressed(btn: MouseButton): boolean { // check if the button was just released this frame
        return this.wasMouseDown(btn) && !this.isMouseDown(btn);
    }

    public static mouseStartDown(btn: MouseButton): boolean {
        return !this.wasMouseDown(btn) && this.isMouseDown(btn);
    }

    public static mousePos(): Point {
        return Point.clone(this.mousePosition);
    }
}

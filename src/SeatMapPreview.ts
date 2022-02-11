
import {Overlay} from "./overlay";
import Framebus from "framebus";

import {FramebusReplyHandler, FramebusSubscriberArg} from "framebus/dist/lib/types";
const FRAMEBUS_CHANNEL = 'seatMapPreview';
export interface SeatMapPreviewOptions {
    url: string
    container: string
    width?: number,
    height?: number,
    defaultSeatStyle?: {color: string}
    selectedSeatStyle?: {color: string}
    seatStyles?: {name: string, color: string}[]
}

export class SeatMapPreview {

    private container: HTMLElement | null = null;
    private iframe: HTMLIFrameElement | null = null;
    private readonly options: SeatMapPreviewOptions
    private areaId: string | null = null;
    private overlay: Overlay | null = null;
    private bus : Framebus | null = null;
    private selectedSeats : any = [];

    constructor(options: SeatMapPreviewOptions) {
        this.options = options;
    }

    private static createBus = (): Framebus => {
        return new Framebus({
            channel: FRAMEBUS_CHANNEL
        });
    }
    private initializeBusFrame() {
        if (this.bus) {
            throw new Error('could not initialize Framebus.')
        }

        this.bus = SeatMapPreview.createBus();

        this.bus.on('loaded',this.onLoaded )


        // event handler when content finish loading
        this.bus.on('loaded', () => {
            if (this.overlay) {
                this.overlay.hide();
            }
        })
    }


    private destroyBusFrame () {
        if (this.bus) {
            this.bus.off('loaded',this.onLoaded )
            this.bus.teardown();
        }
    }

    get url() {
        if (!this.areaId) {
            throw new Error('areaId is not defined');
        }
        // remove trailing slash from url
        const baseUrl = this.options.url.replace(/\/$/, '');
        const qs = [];
        qs.push(`areaId=${this.areaId}`);


        if (this.options.defaultSeatStyle) {
            qs.push(`defaultSeatStyle=${encodeURIComponent(JSON.stringify(this.options.defaultSeatStyle))}`);
        }
        if (this.options.selectedSeatStyle) {
            qs.push(`selectedSeatStyle=${encodeURIComponent(JSON.stringify(this.options.selectedSeatStyle))}`);
        }

        return `${baseUrl}/seatMapPreview?${qs.join('&')}`;
    }

    private createIframe(url: string): void {
        if (window == undefined) {
            throw new Error('error related to browser compatibility');
        }

        //destroy previous iframe if exists
        if (this.iframe) {
            this.destroy();
        }

        // get container element
        this.container = document.querySelector(this.options.container);


        if (!this.container) {
            throw new Error(`Could not find element with selector : ${this.options.container}`);
        }

        this.container.style.width = `${this.options.width}px`;
        this.container.style.height = `${this.options.height}px`;

        // create iframe element
        this.iframe = window.document.createElement("iframe");
        if (this.options.width) {
            this.iframe.setAttribute('width', this.options.width.toString());
        }else {
            this.iframe.setAttribute('width', '100%');
        }

        if (this.options.height) {
            this.iframe.setAttribute('height', this.options.height.toString());
        }

        this.iframe.setAttribute('scrolling', 'no')
        this.iframe.setAttribute('src', url)


        this.overlay = new Overlay(this.container);

        // append iframe inside container
        this.container.appendChild(this.iframe);

    }


    public onLoaded = (data: FramebusSubscriberArg, reply: FramebusReplyHandler) => {}

    public load(areaId: string): void {
        this.areaId = areaId;
        this.createIframe(this.url);
        this.initializeBusFrame();
    }

    public destroy(): void {
        this.destroyBusFrame();
        if (this.iframe) {
            this.iframe.remove();
            this.iframe = null;
        }

        if (this.overlay) {
            this.overlay.destroy();
        }

    }



}
import Framebus from "framebus";
import {Overlay} from "./overlay";
import { SelectionMode } from "./Types";
import {FramebusReplyHandler, FramebusSubscriberArg} from "framebus/dist/lib/types";

export const BUS_CHANNEL_NAME = 'seatMap';

export interface SeatMapConstructorInput {
    serviceUrl: string,
    containerSelector: string
}

export interface SeatMapLoaderInput {
    areaId: string,
    productId?: string,
    salesChannelId?: string,
    options?: AreaOptions
}

export interface AreaOptions {
    defaultSeatStyle?: SeatStyle
    customSeatStyles?: CustomSeatStyle[]
}

export interface Seat {
    seatId: string;
    seatCol: string;
    seatRow: string;
    seatNumber: string;
}


export interface CustomSeatStyle {
    name: string,
    style: SeatStyle
}

export interface SeatStyle {
    color?: string;
    overColor?: string;
    selectedColor?: string;
    reservedColor?: string;
}

export class SeatMap {

    private readonly serviceUrl: string
    private readonly containerSelector: string

    private container: HTMLElement | null = null;
    private iframe: HTMLIFrameElement | null = null;
    private options?: AreaOptions;


    private areaId: string | null = null;
    private productId: string | null = null;
    private salesChannelId: string | null = null;
    private bus: Framebus | null = null;
    private overlay: Overlay | null = null;


    constructor(input: SeatMapConstructorInput) {
        this.serviceUrl = input.serviceUrl;
        this.containerSelector = input.containerSelector;
    }

    get url() {
        // remove trailing slash from url if exists
        const baseUrl = this.serviceUrl.replace(/\/$/, '');
        if(this.productId) {
          return `${baseUrl}/area/${this.areaId}/product/${this.productId}/salesChannel/${this.salesChannelId}`;
        } else {
          return `${baseUrl}/area/${this.areaId}`;
        }

    }

    private static createBus = (): Framebus => {
        return new Framebus({
            channel: BUS_CHANNEL_NAME
        });
    }

    public onError = (data: FramebusSubscriberArg) => {
    }

    public onLoaded = (data: FramebusSubscriberArg, reply: FramebusReplyHandler) => {
    }

    public onSeatClick = (data: FramebusSubscriberArg, reply: FramebusReplyHandler) => {
    }

    public onSeatMouseOver = (data: FramebusSubscriberArg, reply: FramebusReplyHandler) => {
    }

    public onSeatMouseOut = (data: FramebusSubscriberArg, reply: FramebusReplyHandler) => {
    }

    public onSeatSelectionUpdate = (data: FramebusSubscriberArg, reply: FramebusReplyHandler) => {
    }

    public load(input: SeatMapLoaderInput): void {

        if (!input.areaId) {
            throw new Error('areaId is required')
        }

        this.areaId = input.areaId;

        if (input.productId) {
            this.productId = input.productId;
            if(!input.salesChannelId) {
              throw new Error("salesChannelId is required when using productId")
            } else {
              this.salesChannelId = input.salesChannelId;
            }
        }

        if (input.options) {
            this.options = input.options;
        }

        this.createIframe(this.url);
        this.initializeBusFrame();
    }

    public setSeatsStyle(seatIds: string[], styleName = 'default'): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('setSeatsStyle', {styleName, seatIds})
    }

    public resetSelectedSeats(): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('resetSelectedSeats', {})
    }

    public setSelectedSeats(seatIds: string[]): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('setSelectedSeats', {data: seatIds})
    }

    public unsetSelectedSeats(seatIds: string[]): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('unsetSelectedSeats', {data: seatIds})
    }


    public resetReservedSeats(): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('resetReservedSeats', {})
    }

    public setReservedSeats(seatIds: string[]): void {
        if (!this.bus) {
            return;
        }

        this.bus.emit('setReservedSeats', {data: seatIds})
    }

    public unsetReservedSeats(seatIds: string[]): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('unsetReservedSeats', {data: seatIds})
    }

    // count=-1 : no limit
    public setSeatSelectionCountLimit(count: number = -1): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('setSeatSelectionCountLimit', {count})
    }

    public setSelectionMode(mode: SelectionMode = SelectionMode.SINGLE): void {
        if (!this.bus) {
            return;
        }
        this.bus.emit('setSelectionMode', {mode})
    }

    public destroy = (): void => {
        this.destroyBusFrame();
        if (this.iframe) {
            this.iframe.remove();
            this.iframe = null;
        }
        if (this.overlay) {
            this.overlay.destroy();
        }
    }

    private initializeBusFrame() {
        if (this.bus) {
            throw new Error('could not initialize Framebus.')
        }

        this.bus = SeatMap.createBus();

        // // bind events to local methods
        this.bus.on('seat:mouseover', this.onSeatMouseOver)
        this.bus.on('seat:mouseout', this.onSeatMouseOut)
        this.bus.on('seat:click', this.onSeatClick)
        this.bus.on('seatSelection:update', this.onSeatSelectionUpdate)
        this.bus.on('loaded', this.onLoaded)
        this.bus.on('error', this.onError)


        // event handler when venue map finish loading
        this.bus.on('loaded', () => {
            if (this.overlay) {
                this.overlay.hide();
                if (this.options && "defaultSeatStyle" in this.options && this.options.defaultSeatStyle) {
                    this.bus?.emit('setDefaultSeatStyle', {...this.options.defaultSeatStyle})
                }
                if (this.options && "customSeatStyles" in this.options && this.options.customSeatStyles) {
                    this.bus?.emit('setCustomSeatStyles', {data: this.options.customSeatStyles})
                }
            }
        })

    }

    private destroyBusFrame() {
        if (this.bus) {
            // this.bus.teardown() is buggy: doesn't turn off all events
            this.bus.off('setFullScreenState', this.onLoaded)
            this.bus.off('seat:mouseover', this.onSeatMouseOver)
            this.bus.off('seat:mouseout', this.onSeatMouseOut)
            this.bus.off('seat:click', this.onSeatClick)
            this.bus.off('seatSelection:update', this.onSeatSelectionUpdate)
            this.bus.off('loaded', this.onLoaded)
            this.bus.off('error', this.onError)

            this.bus.teardown();
            this.bus = null;
        }
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
        this.container = document.querySelector(this.containerSelector);


        if (!this.container) {
            throw new Error(`Could not find element with selector : ${this.containerSelector}`);
        }

        // create iframe element
        this.iframe = window.document.createElement("iframe");

        this.iframe.setAttribute('allowfullscreen', '')
        this.iframe.setAttribute('scrolling', 'no')
        this.iframe.setAttribute('src', url)

        this.iframe.style.position = 'absolute';
        this.iframe.style.border = '0';
        this.iframe.style.top = '0';
        this.iframe.style.left = '0';
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.overlay = new Overlay(this.container);

        // append iframe inside container
        this.container.appendChild(this.iframe);

    }

}

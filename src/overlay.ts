const overlayHtml =
    `
<div class="vmap__overlay">
    <div class="vmap__overlay__inner">
        <div class="vmap__overlay__content"><span class="vmap__spinner"></span></div>
    </div>
</div>`

const overlayCss =
    `
.vmap__overlay {
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    background: #bbb;
}

.vmap__overlay__inner {
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    position: absolute;
}

.vmap__overlay__content {
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
}

.vmap__spinner {
    width: 75px;
    height: 75px;
    display: inline-block;
    border-width: 2px;
    border-color: rgba(255, 255, 255, 0.05);
    border-top-color: #fff;
    animation: spin 1s infinite linear;
    border-radius: 100%;
    border-style: solid;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
}`


export class Overlay {
    _elt: HTMLElement
    doc: Document
    head: HTMLHeadElement
    style: HTMLStyleElement
    overlay: HTMLElement

    constructor(element: HTMLElement) {
        this._elt = element;
        this._elt.style.position = 'relative';
        this.doc = this._elt.ownerDocument;
        this.head = this.doc.head || this.doc.getElementsByTagName('head')[0];
        this.style = this.doc.createElement('style');
        this.head.appendChild(this.style)
        this.style.innerText = overlayCss;
        this._elt.innerHTML = overlayHtml;
        this.overlay = element.querySelector('.vmap__overlay')! as HTMLElement;
    }

    show() {
        this.overlay.style.display = 'block';
    }

    hide() {
        this.overlay.style.display = 'none';
    }

    destroy() {
        this.style.remove();
        this.overlay.remove();
    }
}

export interface VenueTopViewConstructorInput {
    apiUrl: string,
    containerSelector: string,
    venueId: string,
    productId?: string,
    salesChannelId?: string,
}

export interface VenueTopViewOptions {
    disableInteraction: boolean,
}
export interface VenueTopViewLoaderInput {
    name: string, // default, express ...
    options?: VenueTopViewOptions
}


export interface AreaStyle {
    areaId: string
    fill?: string | null
    filter?: string | null
}

export interface Area {
    areaId: string,
    originalId?: string,
}

interface ProductCategoy {
  areaId: string,
  categoryId: string,
  categoryActiveColor: string,
}

interface AreasByCategoryIdOptions {
  categoryId: string,
  areaIds?: string[],
}

const defaultAreaColor = '#FFFFFF';
const defaultAreaFilter = '';

export class VenueTopView {
    private readonly apiUrl: string;
    private readonly venueId: string;
    private readonly productId?: string;
    private readonly salesChannelId?: string;
    private readonly containerSelector: string;
    private container: HTMLElement | null = null;

    private isLoaded = false;
    private areaElementDic: Map<string, SVGElement[]> = new Map<string, SVGElement[]>();
    private svgDocument: HTMLElement | null = null;
    private areas: Area[] = [];
    private disableInteraction: boolean = false;
    private productCategories: ProductCategoy[] = [];

    constructor(input: VenueTopViewConstructorInput) {
        if (!input.apiUrl) {
            throw new Error('apiUrl is required')
        }
        this.apiUrl = input.apiUrl;
        if (!input.venueId) {
            throw new Error('venueId is required')
        }
        this.venueId = input.venueId;
        if (!input.containerSelector) {
            throw new Error('containerSelector is required')
        }
        this.containerSelector = input.containerSelector;
        
        if(input.productId) {
          this.productId = input.productId;
          
          if(!input.salesChannelId) {
            throw new Error("SalesChannelId is required when productId is provided")
          } else {
            this.salesChannelId = input.salesChannelId
          }
        }
    }

    getTopViewSvgUrlByName(name: string) : string {
        // remove trailing slash from url if exists
        const baseUrl = this.apiUrl.replace(/\/$/, '');
        return `${baseUrl}/venue/${this.venueId}/image/${name}.svg`;

    }

    private async setupCategories(): Promise<void> {
      await this.loadProductCategories()
    }

    private async loadProductCategories(): Promise<void> {
      const apiUrl = this.apiUrl.replace(/\/$/, "")
      const url = `${apiUrl}/product/${this.productId}/salesChannel/${this.salesChannelId}/areas`
      const response = await fetch(url)
      if(response.ok) {
        this.productCategories = await response.json()
      } else {
        throw  new Error("Cannot get categories")
      }
    }

    public async load(input: VenueTopViewLoaderInput): Promise<void> {

        this.isLoaded = false;
        const imageUrl = this.getTopViewSvgUrlByName(input.name);
        this.container = document.querySelector(this.containerSelector);
        this.disableInteraction = input.options && "disableInteraction" in input.options ? input.options.disableInteraction : false;
        await this.loadSvg(imageUrl);

        if(this.productId) {
          await this.setupCategories()
        }

        this.isLoaded = true;
        const data = {
            container: this.container,
            svgDocument: this.svgDocument,
            areas: this.areas
        }
        this.onLoaded(data)
    }

    //TODO :  deprecated
    public destroy(): void {

    }

    private async getSvgDocumentByUrl (url: string) :Promise<HTMLElement | never> {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error('failed to fetch svg file');
        }
        const svgContent = await response.text();
        if (!svgContent) {
            throw new Error('svg document empty')
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');

        return doc.documentElement;
    }

    private async loadSvg(svgUrl: string): Promise<void> {

        const container = this.container;


        if (!container) {
            throw new Error('failed to load svg');
        }

        // empty container content
        container.innerHTML = '';

        const svg = this.svgDocument = await this.getSvgDocumentByUrl(svgUrl);

        container.appendChild(svg);

        //add style to SVG document
        const style = document.createElement('style');

        if (!this.disableInteraction) {
            style.innerHTML = `
          [data-area-id] { cursor: pointer; fill: ${defaultAreaColor}
          `;
        } else {
            style.innerHTML = `
          [data-area-id] { cursor: default; fill: ${defaultAreaColor}
          `;
        }
        svg.appendChild(style);

        if (!this.disableInteraction) {
            // add event listeners
            svg.addEventListener('mouseout', this.areaEventHandler, false);
            svg.addEventListener('mouseover', this.areaEventHandler, false);
            svg.addEventListener('click', this.areaEventHandler, false);
        }

        //fill areaElementDic with all areas in SVG
        const areaElements = svg.querySelectorAll('[data-area-id]');

        areaElements.forEach((item) => {

            const areaElt = item as SVGElement;

            const data: any = Object.assign({}, areaElt.dataset);

            if ("areaId" in data && data.areaId) {
                // fill areas data
                this.areas.push(data as Area);
                const {areaId} = data;
                // fill areaElementDic mapping areaId/Elements
                if (this.areaElementDic.has(areaId)) {
                    const elements = this.areaElementDic.get(areaId) || [];
                    elements?.push(areaElt);
                    this.areaElementDic.set(areaId, elements);
                } else {
                    this.areaElementDic.set(areaId, [areaElt]);
                }
            }
        });
    };

    private getAreaElements(areaId: string): SVGElement[] {
        const areaElements = this.areaElementDic.get(areaId) || null;

        if (!areaElements) {
            throw new Error(`Could not find area element with areaId=${areaId}`);
        }
        return areaElements;
    };

    private setAreaStyleFill(areaId: string, fill: string | null): void {
        const areaElements = this.getAreaElements(areaId);

        for (const areaElement of areaElements) {
            areaElement.style.fill = fill || defaultAreaColor;
        }
    };

    private setAreaStyleFilter(areaId: string, filter: string | null): void {
        const areaElements = this.getAreaElements(areaId);
        for (const areaElement of areaElements) {
            areaElement.style.filter = filter || defaultAreaFilter;
        }
    };

    private getAreaById(areaId: string): Area {
        const area = this.areas.find((o) => o.areaId === areaId);
        if (!area) {
            throw new Error(`could not find area with id : ${areaId}`);
        }
        return area;
    };

    private getAreaIdByHtmlElement(element: HTMLElement): string | null {
        return element ? element.getAttribute('data-area-id') : null;
    };

    public setAreaStyle = (style: AreaStyle): void => {
        if ('fill' in style) {
            this.setAreaStyleFill(style.areaId, style.fill || null);
        }

        if ('filter' in style) {
            this.setAreaStyleFilter(style.areaId, style.filter || null);
        }
    }

    public selectAreasByCategoryId = (options: AreasByCategoryIdOptions): void => {
      this.resetSelection()
      const entries = this.productCategories.filter((entry: any) => {
          if(options.areaIds) {
            return entry.categoryId === options.categoryId && options.areaIds.includes(entry.areaId)
          } else {
            return entry.categoryId === options.categoryId  
          }
      });

      entries.forEach((entry: any) => {
          this.setAreaStyle({
            areaId: entry.areaId,
            fill: entry.categoryDefaultColor
          })
      })
    }

    public resetSelection = (): void => {
        this.areas.forEach((area: Area) => {
            this.setAreaStyle({
              areaId: area.areaId,
              fill: null,
            })
        })
    }


    private areaEventHandler = (e: Event) => {
        const element = e.target as HTMLElement;
        const areaId = this.getAreaIdByHtmlElement(element);

        if (!areaId) {
            return;
        }

        if(this.productId && this.productCategories.every((entry: any) => entry.areaId !== areaId)) {
          // this area has no category and should not be reactive
          return;
        }

        const data = this.getAreaById(areaId);

        if (e.type === 'click') {
            this.onAreaClick(data);
        }

        if (e.type === 'mouseover') {
            this.onAreaMouseOver(data);
        }

        if (e.type === 'mouseout') {
            this.onAreaMouseOut(data);
        }
    };

    public onLoaded = (data: any) => {
    }

    public onAreaClick = (data: any) => {
    }

    public onAreaMouseOver = (data: any) => {
    }

    public onAreaMouseOut = (data: any) => {
    }


}

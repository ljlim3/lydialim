import { fetchHtmlContent, getStylesheet } from "../../utils/utils.js";

class Station extends HTMLElement {

  static get SOURCE_URL() {
    return new URL('./station.html', import.meta.url);
  }

  set scaleDownRailway(scaledown) {
    this._scaleDownRailway = scaledown;
  }

  get scaleDownRailway() {
    return this._scaleDownRailway;
  }

  set page(p) {
    this._page = p;
  }

  get page() {
    return this._page;
  }

  set signStops(stops) {
    this._signStops = stops;
  }

  static _initialized = false;

  constructor() {
    super(); // initialize the base class

    //render this element separate from the main doc DOM
    //keep element's properties private so that they don't collide with other parts of doc
    this.attachShadow({ mode: 'open' });

    this._lastWidth = window.innerWidth;
  }

  async connectedCallback() {
    const currentWidth = window.innerWidth;

    if (this._lastWidth !== currentWidth) {
      this._lastWidth = currentWidth;
      return;
    }

    const template = await Station.loadTemplate();
    this.shadowRoot.replaceChildren(template.content.cloneNode(true));

    await this.adoptStylesheets();

    Station._initialized = true;

    this.setSignPosition();
    this.setDirectionInstruction();
    this.setSignStops();
  }

  static async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(Station.SOURCE_URL);

      const template = doc.getElementById('station-component-template');
      if (template) {
        return template;
      } else {
        console.error('Could not find the template element');
      }

      return 
    } catch (e) {
      console.error('Failed to process the source file', e);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('./station.css', import.meta.url),
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    const stylesheets = await Promise.all(cssUrls.map(getStylesheet));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }

  setSignPosition() {
    const signPosAttr = this.getAttribute('sign-pos');
    if (signPosAttr === 'left') {
      const trainStationSignEl = this.shadowRoot.querySelector('.train-station-signage');
      trainStationSignEl.style.right = '0';
      trainStationSignEl.classList.add('stand');
    }
  }

  setDirectionInstruction() {
    const scrollDirectionInstruction = this.shadowRoot.getElementById('scroll-direction-instruction');
    const i = document.createElement('i');
    i.classList.add('fa-solid');

    const fragment = new DocumentFragment();
    let textNode;

    const dataPage = this.dataset.page;
    switch(dataPage) {
      case 'first':
        textNode = document.createTextNode('Scroll down ');
        i.classList.add('fa-arrow-down');
        i.classList.remove('fa-arrow-up');
        i.classList.remove('fa-up-down');
        break;
      case 'mid':
        textNode = document.createTextNode('Scroll up or down ');
        i.classList.add('fa-up-down');
        i.classList.remove('fa-arrow-down');
        i.classList.remove('fa-arrow-up');
        break;
      case 'last':
        textNode = document.createTextNode('Scroll up ');
        i.classList.add('fa-arrow-up');
        i.classList.remove('fa-arrow-down');
        i.classList.remove('fa-up-down');
        break;
    }
    fragment.appendChild(textNode);
    fragment.appendChild(i);
    scrollDirectionInstruction.replaceChildren(fragment);
  }

  setSignStops() {
    const leftStop = this.shadowRoot.querySelector('.left-stop');
    const rightStop = this.shadowRoot.querySelector('.right-stop');

    if (this._signStops) {     
      if (!this._signStops.left) {
        leftStop.style.visibility = 'hidden';
      } else {
        const fragment = document.createDocumentFragment();
        leftStop.style.display = 'flex';
        const leftStopIcon = document.createElement('i');
        leftStopIcon.classList.add('fa-solid', 'fa-arrow-left');
        fragment.appendChild(leftStopIcon);

        const leftStopLabel = document.createElement('span');
        leftStopLabel.textContent = this._signStops.left;
        fragment.appendChild(leftStopLabel);
        leftStop.replaceChildren(fragment);
      }

      if (!this._signStops.right) {
        rightStop.style.display = 'none';
      } else {
        const fragment = document.createDocumentFragment();
        rightStop.style.display = 'flex';
        const rightStopLabel = document.createElement('span');
        rightStopLabel.textContent = this._signStops.right;
        fragment.appendChild(rightStopLabel);

        const rightStopIcon = document.createElement('i');
        rightStopIcon.classList.add('fa-solid', 'fa-arrow-right');
        fragment.appendChild(rightStopIcon);
        rightStop.replaceChildren(fragment);
      }
    }
  }

  onScaleDownRailway() {
    const railwayWrapper = this.shadowRoot.querySelector('.railway-wrapper');
    const signage = this.shadowRoot.querySelector('.signage-board-outer');
    const extraRailwayWoods = this.shadowRoot.getElementById('extra');

    if (!this._scaleDownRailway) {
      if (railwayWrapper && extraRailwayWoods && signage) {
        railwayWrapper.classList.remove('scale-down');
        extraRailwayWoods.classList.remove('visible');
        signage.classList.remove('elongate-bars');
      }
    } else {
      railwayWrapper.classList.add('scale-down');
      extraRailwayWoods.classList.add('visible');
      signage.classList.add('elongate-bars');
    }
  }
  
  disconnectedCallback() {}
}

customElements.define('station-template', Station); // define custom element
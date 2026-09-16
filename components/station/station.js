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
    // this.shadowRoot.appendChild(template.content.cloneNode(true));
    // this.shadowRoot.innerHTML = `<div></div>`;
    // this._initialized = false;

    // console.log('STATION~~~~')
    this._lastWidth = window.innerWidth;
  }

  async connectedCallback() {
    const currentWidth = window.innerWidth;

    if (this._lastWidth !== currentWidth) {
      console.log('STATION~~~~ width changed, re-rendering')
      this._lastWidth = currentWidth;
      return;
    }
     
    console.log('STATION~~~~ connectedCallback')
    const template = await Station.loadTemplate();
    this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    // console.log('STATION~~~~')

    await this.adoptStylesheets();

    Station._initialized = true;


    // this.shadowRoot.innerHTML = `    
    //       <div class="station-wrapper">
    //         <div class="train-station-scene-wrapper">
    //           <img class="background" src="static/forest-animated-reduced.png">
    //           <div class="train-station-container">
    //           <slot name="train"></slot>
                

    //             <div class="train-station-signage">
    //               <div class="sign-holder"></div>
    //               <div class="signage-board-outer">
    //                 <div class="signage-board-inner">
    //                   <slot name="signage-text"></slot>
    //                   <div class="stripe-top"></div>
    //                   <div class="stripe-bottom"></div>
    //                 </div>
    //               </div>
    //             </div>
                
    //             <div class="railway-wrapper">
    //               <div class="railway"></div>
    //               <div class="railway-wood-wrapper">
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood"></div>
    //                 <div class="railway-wood extra-1"></div>
    //                 <div class="railway-wood extra-2"></div>
                  
    //               </div>
    //             </div>
    //           </div>

    //           <slot name="carousel"></slot>
    //         </div>
    //         <div id="scroll-direction-instruction" class="scroll-direction-instruction"></div>
    //       </div>
            
        
    // `;

    // this.onNavLinkClick();
    this.setSignPosition();
    this.setDirectionInstruction();
    this.setSignStops();
    // this.onScaleDownRailway();
    // const resizeObserver = new ResizeObserver(this.handleResize);
    // resizeObserver.observe(document.body);
  }

  disconnectedCallback() {
    // console.log('Station disconnectedCallback')
    
  }

  static async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(Station.SOURCE_URL);

      const template = doc.getElementById('station-component-template');
      if (template) {
        // this.shadowRoot.replaceChildren(template.content.cloneNode(true));
        // this.shadowRoot.setHTMLUnsafe(doc);
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
      // trainStationSignEl.style.left = '3rem';
    }
  }

  setDirectionInstruction() {
    const scrollDirectionInstruction = this.shadowRoot.getElementById('scroll-direction-instruction');
    const i = document.createElement('i');
    i.classList.add('fa-solid');

    const fragment = new DocumentFragment();
    let textNode;

    const dataPage = this.dataset.page;
    // this.shadowRoot.dataset
    switch(dataPage) {
      case 'first':
        textNode = document.createTextNode('Scroll down ');
        // scrollDirectionInstruction.insertAdjacentText('beforeend', 'Scroll down ');
        i.classList.add('fa-arrow-down');
        i.classList.remove('fa-arrow-up');
        i.classList.remove('fa-up-down');
        break;
      case 'mid':
        textNode = document.createTextNode('Scroll up or down ');
        // scrollDirectionInstruction.insertAdjacentText('beforeend', 'Scroll up or down ');
        i.classList.add('fa-up-down');
        i.classList.remove('fa-arrow-down');
        i.classList.remove('fa-arrow-up');
        break;
      case 'last':
        textNode = document.createTextNode('Scroll up ');
        // scrollDirectionInstruction.insertAdjacentText('beforeend', 'Scroll up ');
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

  handleResize(entries) {
    // const viewportWidth = entries[0].contentRect.width;
    // const railwayWoodCount = 2;
    // console.log(this.shadowRoot)
    // const railwayWoodWrapperEl = this.shadowRoot.querySelector('.railway-wood-wrapper');
    // console.log(railwayWoodWrapperEl);

    // if (viewportWidth <= 768) { // mobile
    //   console.log('observer fired 767')
    //   const railwayWoodEl = document.createElement('div');
    //   railwayWoodEl.classList.add('railway-wood');
    //   console.log(railwayWoodEl);
      
    //   for (let i = 0; i < railwayWoodCount; i++) {
    //     railwayWoodWrapperEl.appendChild(railwayWoodEl);
    //   }
    // } else if (viewportWidth <= 996) { // tablet
    //   console.log('observer fired 996')

    // } else { // desktop

    // }
  }

  onNavLinkClick() {
    const nav = this.shadowRoot.querySelector('.train-map-wrapper');
    // const firstLink = '.routing-link:first-child .link-one';
    // const secondLink = '.routing-link:nth-child(2) .link-two';
    // const lastLink = '.routing-link:last-child .link-three';
    const firstLink = '.link-one';
    const secondLink = '.link-two';
    const lastLink = '.link-three';
  
    // let prevTarget = this.shadowRoot.querySelector('.routing-link:first-child .nav-link-label');
    let prevTarget = this.shadowRoot.querySelector(firstLink);

    nav.addEventListener('click', (e) => {
      const currTarget = e.target;
      // e.preventDefault();

      if (!currTarget.isEqualNode(prevTarget)) {
        if (currTarget.matches(firstLink)) {
          currTarget.parentNode.classList.add('selected');
          if (prevTarget) {
            prevTarget.parentNode.classList.remove('selected');
          }
          prevTarget = currTarget;
          const firstPage = document.getElementById('home');
          window.scrollTo({
            top: firstPage.offsetLeft,
            behavior: 'smooth'
          });
        } else if (currTarget.matches(secondLink)) {
          currTarget.parentNode.classList.add('selected');
          if (prevTarget) {
            prevTarget.parentNode.classList.remove('selected');
          }
          prevTarget = currTarget;
          const secondPage = document.getElementById('introduction');
          secondPage.scrollIntoView({ behavior: 'smooth' });
          // window.scrollTo({
          //   left: secondPage.offsetLeft,
          //   behavior: 'smooth'
          // })
        } else if (currTarget.matches(lastLink)) {
          currTarget.parentNode.classList.add('selected');
          if (prevTarget) {
            prevTarget.parentNode.classList.remove('selected');
          }
          prevTarget = currTarget;
        }
      }
    }, false);
  }

  onScaleDownRailway() {
    const railwayWrapper = this.shadowRoot.querySelector('.railway-wrapper');
    const railwayWoodWrapper = this.shadowRoot.querySelector('.railway-wood-wrapper');
    const signage = this.shadowRoot.querySelector('.signage-board-outer');
    const extraRailwayWoods = this.shadowRoot.getElementById('extra');
    // const railway = this.shadowRoot.querySelector('.railway');

    if (!this._scaleDownRailway) {
      if (railwayWrapper && extraRailwayWoods && signage) {
        railwayWrapper.classList.remove('scale-down');
        extraRailwayWoods.classList.remove('visible');
        // railway.classList.remove('scale-down-railway');
        signage.classList.remove('elongate-bars');
      }

      // railwayWoodWrapper.classList.remove('scale-down-railway-wood-wrapper');
      // console.log('do not scale down', railway)
    } else {
      railwayWrapper.classList.add('scale-down');
      extraRailwayWoods.classList.add('visible');
      // railway.classList.add('scale-down-railway');
      signage.classList.add('elongate-bars');
      // railwayWoodWrapper.classList.add('scale-down-railway-wood-wrapper');
      // console.log('scale down', railway)
    }
  }
  
  // disconnectedCallback() {
    // this.resizeObserver.disconnect();
  // }
}

customElements.define('station-template', Station); // define custom element
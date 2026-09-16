import { fetchHtmlContent, getStylesheet } from "../../utils/utils.js";

class CarouselComponent extends HTMLElement {
  #data;

  static get SOURCE_URL() {
    return new URL('./carousel.html', import.meta.url);
  }

  set data(items = []) {
    this.#data = items.map(({ src, label, link = undefined }) => ({ src, label, link }));
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // allows access to internal structure for external scripts through element.shadowRoot
    this._initialized = false;
    this.#data = [];
  }

  async connectedCallback() {
    const template = await this.loadTemplate();
    await this.adoptStyleSheets();

    // const template = this.shadowRoot.querySelector('template');
    if (template) {
      this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    }

    this.carousel = this.shadowRoot.querySelector('.carousel');
    this.carousel.addEventListener('click', (e) => this.handleItemClick(e));
    this.populateItems(this.#data);
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(CarouselComponent.SOURCE_URL);

      const template = doc.getElementById('carousel-component-template');
      if (template) {
        // this.shadowRoot.setHTMLUnsafe(doc);
        // CarouselComponent.#templateCache = template;
        return template;
      } else {
        console.error('Could not find the template element');
      }
    } catch(e) {
      console.error('Failed to process source file', e);
    }
  }

  async adoptStyleSheets() {
    const cssUrls = [
      new URL('./carousel.css', import.meta.url)
    ];

    const stylesheets = await Promise.all(cssUrls.map(getStylesheet));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }

  populateItems(data) {
    const fragment = document.createDocumentFragment();

    data.forEach((d, i) => {
      const listItem = document.createElement('li');
      listItem.classList.add('item');
      listItem.setAttribute('part', 'item');
      listItem.setAttribute('aria-label', `slide ${i} of ${d.length}`);
      listItem.dataset.val = `${i}`;

      const img = document.createElement('img');
      img.setAttribute('src', d.src);

      const labelContainer = document.createElement('div');
      labelContainer.classList.add('item-label-container');

      const label = document.createElement('span');
      label.classList.add('item-label');
      label.textContent = d.label;

      labelContainer.appendChild(label);

      if (d.link) {
        const link = document.createElement('a');
        link.setAttribute('href', d.link);
        link.appendChild(img);
        link.appendChild(labelContainer);
        listItem.appendChild(link);
      } else {
        listItem.appendChild(img);
        listItem.appendChild(labelContainer);
      }

      fragment.appendChild(listItem);
    });
    this.carousel.replaceChildren(fragment);
  }

  handleItemClick(e) {
    const anchor = e.composedPath().find(el => el?.tagName === 'A');
    if (anchor) return;

    const listItem = e.target.closest('.item');
    if (!listItem) return;

    let val;

    if (listItem) {
      val = parseInt(listItem.dataset.val);

      if (this.#data[val].link) {
        // window.href = this.#data[val].link;
        // window.open(this.#data[val].link);
      }
    }

    // const event = new CustomEvent('itemClick', {
    //   detail: { val: this.#data[val].key },
    //   bubbles: true,
    //   composed: true
    // });

    // this.dispatchEvent(event);
  }


}
customElements.define('carousel-component', CarouselComponent);
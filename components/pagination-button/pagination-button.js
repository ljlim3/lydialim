import { fetchHtmlContent, getStylesheet } from '../../utils/utils.js';

class PaginationButton extends HTMLElement {
  static get SOURCE_URL() {
    return new URL('./pagination-button.html', import.meta.url);
  }

  set newUrl(data) {
    this._newUrl = data;
    if (this._newUrl) {
      this.addNewUrl();
    }
  }

  set label(data) {
    this._label = data;
    if (this._label) {
      this.addButtonLabel();
    }
  }

  get label() {
    return this._label;
  }

  constructor() {
    super(); // initialize the base class

    this.attachShadow({ mode: 'open' });
  }

  // fired when an instance of this custom element is added to the DOM
  async connectedCallback() {
    await this.loadTemplate();
    await this.adoptStylesheets();

    this.paginationButton = this.shadowRoot.querySelector('.pagination-button');
    this.styleButton();
    this.addButtonLabel();
    this.setUpListeners();
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(PaginationButton.SOURCE_URL); // class name should be used instad of 'this' keyword, 
                                    // because 'this' refers to the current instance of the object, while 'static' properties 
                                    // belong to the class constructor itself, not individual class instances
      const template = doc.querySelector('#pagination-button-template');

      if (template) {
        this.shadowRoot.appendChild(template.content.cloneNode(true));
      } else {
        console.error('Template element not found in the fetched file');
      }
    } catch (error) {
      console.error('Could not process source URL: ', error);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('./pagination-button.css', import.meta.url),
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    // Fetch all stylesheets concurrently
    const sheets = await Promise.all(cssUrls.map(getStylesheet)); // allows browser to initiate the network requests in parallel, rather than waiting
                  // waiting for the first file to download completely before starting the second
    this.shadowRoot.adoptedStyleSheets = sheets;
  }

  setUpListeners() {
    this.shadowRoot.addEventListener('click', (e) => this.handlePaginationBtnClick(e));
  }

  handlePaginationBtnClick = (e) => {
    if (!e.target.closest('.pagination-button')) return;

    const paginationEvent = new Event('paginationBtnClick', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(paginationEvent);
    console.log('button clicked and dispatched event')
  }

  styleButton() {
    const btnType = this.getAttribute('data-button-type');
    const btnLabelEl = this.shadowRoot.querySelector('.button-label');

    const span = document.createElement('span');
    span.classList.add('icon-container');

    const iconEl = document.createElement('i');
    iconEl.classList.add('fa-solid');

    if (btnType === 'prev') {
      this.paginationButton.classList.add('prev');

      iconEl.classList.add('fa-chevron-left');
      span.appendChild(iconEl);
      btnLabelEl.before(span);
    } else if (btnType === 'next') {
      this.paginationButton.classList.add('next');

      iconEl.classList.add('fa-chevron-right');
      span.appendChild(iconEl);
      btnLabelEl.after(span);
    }
  }

  addNewUrl() {
    this.paginationButton.href = this._newUrl;
    console.log('paginationButton', this.paginationButton.href)
  }

  addButtonLabel() {
    const btnLabelEl = this.shadowRoot.querySelector('.button-label');

    if (btnLabelEl) btnLabelEl.textContent = this._label;
  }
}
customElements.define('pagination-button-component', PaginationButton);
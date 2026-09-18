import { fetchHtmlContent, getStylesheet } from '../../utils/utils.js';
import '../station/station.js';
import '../carousel/carousel.js';

const SECTION_STATES = {
  home: { home: true, introduction: false, projects: false },
  introduction: { home: false, introduction: true, projects: false },
  projects: { home: false, introduction: false, projects: true },
}

const SECTION_LINKS = {
  home: ' ',
  introduction: '#introduction',
  projects: '#projects'
}

class AppHomeComponent extends HTMLElement {

  static get SOURCE_URL() {
    return new URL('./app-home.html', import.meta.url);
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this._initialized = false;
    this._lastWidth = window.innerWidth;

    this._onScroll = this._onScroll.bind(this);
    this._ticking = false;
    this.progress = 0;

    this._signStops = [
      {
        left: null,
        right: 'Introduction'
      },
      {
        left: 'Home',
        right: 'Projects'
      },
      {
        left: 'Introduction',
        right: null
      }
    ];
  }

  // fired when instance of this custom element is added to the DOM
  async connectedCallback() {
    const template = await this.loadTemplate();
    await this.adoptStylesheets();

    // const template = this.shadowRoot.querySelector('template');
    this.shadowRoot.replaceChildren(template.content.cloneNode(true));

    this.selectedLink = 0;
    this.navHomeBtn = this.shadowRoot.querySelector('.routing-link[data-link-index="0"]');
    this.navIntroBtn = this.shadowRoot.querySelector('.routing-link[data-link-index="1"]');
    this.navProjectBtn = this.shadowRoot.querySelector('.routing-link[data-link-index="2"]');
    this.navBar = this.shadowRoot.querySelector('.train-map-wrapper');
    this.linkArr = this.shadowRoot.querySelectorAll('.routing-link');
    this.carouselComponent = this.shadowRoot.querySelector('carousel-component');
    this.stations = this.shadowRoot.querySelectorAll('station-template');

    this.innerWrapperEl = this.shadowRoot.querySelector('.inner-wrapper');

    this.horizontalTween;
    
    this.userInitiatedScroll = false;
    this.prevPos = 0;
    this.screenResize = false;
    this.appliedLink = { home: true, intro: false, proj: false };
    this.linkMap = { 0: 'home', 1: 'introduction', 2: 'projects'};
    this.stations.forEach((station, index) => {
      station.signStops = this._signStops[index];
    });

    this.carouselData = [
      { 
        src: 'static/theater-app-carousel-cover.png',
        label: 'Movie Theater App',
        link: '#/project?project=movie-theater-app',
        key: 'movie-theater-app' 
      },
      { 
        src: 'static/emb-parent-dashboard-carousel-cover.png',
        label: 'EMBRACE',
        link: '#/project?project=embrace',
        key: 'embrace' 
      },
      { 
        src: 'static/restaurant-app.png',
        label: 'Restaurant App',
        link: '#/project?project=restaurant-app',
        key: 'restaurant-app' 
      }
    ];
    this.carouselComponent.data = this.carouselData;

    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(ScrollToPlugin);



    ///////// REFACTOR
    // const hash = window.location.hash;
    // if (hash) {
    //     console.log('hash', hash)
    //     if (hash === '#introduction') {
    //       this.handleNavIntroBtnClick();
    //       history.replaceState(null, null, '#introduction');
    //     } else if (hash === '#project') {
    //       this.handleNavProjectBtnClick();
    //       history.replaceState(null, null, '#project');
    //     }
    //   } else {
    //     history.replaceState(null, null, ' ');
    //   } 

    this.setupEventListeners();
    this.scrollAnimation();
    this.handleHash();

    this.start = 0;
    this.end = 0;
    // this.addCarouselItems(this.carouselData);

  }

  _onScroll() {
    if (!this._ticking) {
      window.requestAnimationFrame(() => {
        this._calculateHorizontalScroll();
        this._ticking = false;
      });
      this._ticking = true;
    }
  }

  _calculateHorizontalScroll() {
    // 1. Get current horizontal scroll position
    const scrollLeft = window.scrollY || document.documentElement.scrollTop;
    
    // 2. Calculate the maximum possible horizontal scroll distance
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    if (maxScroll <= 0) return;

    // 3. Normalize to a value between 0.000 and 1.000
    this.progress = (scrollLeft / maxScroll).toFixed(3);

    this.updateRailwayScale();
  }

  // playScrollSound() {
  //   if (!this.audioContext) return;

  //   if (this.audioContext.state === 'suspended') {
  //     this.audioContext.resume();
  //   }

  //   const now = this.audioContext.currentTime;
  //   const oscillator = this.audioContext.createOscillator();
  //   const gain = this.audioContext.createGain();
  //   const duration = 0.13;

  //   oscillator.type = 'sine';
  //   oscillator.frequency.setValueAtTime(110, now);
  //   oscillator.frequency.exponentialRampToValueAtTime(80, now + duration);

  //   gain.gain.setValueAtTime(0.0001, now);
  //   gain.gain.exponentialRampToValueAtTime(0.65, now + 0.01);
  //   gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  //   oscillator.connect(gain);
  //   gain.connect(this.audioContext.destination);

  //   oscillator.start(now);
  //   oscillator.stop(now + duration);
  // }


  /**
   * app-home (load) -> 3 station-template (load)
   */

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(AppHomeComponent.SOURCE_URL);

      const template = doc.querySelector('#app-home-template');

      if (template) {
        // this.shadowRoot.setHTMLUnsafe(doc);
        // instance.shadowRoot.replaceChildren(template.content.cloneNode(true));
        // this.#templateCache = template;
        return template;
      } else {
        console.error('Template element not found in the fetched file.');
      }
    } catch (error) {
      console.error('Could not process the source URL: ', error);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('./app-home.css', import.meta.url),
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    const stylesheets = await Promise.all(cssUrls.map(getStylesheet));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }

  setupEventListeners() {
    // this.navHomeBtn.addEventListener('click', (e) => this.handleNavHomeBtnClick(e));
    // this.navIntroBtn.addEventListener('click', (e) => this.handleNavIntroBtnClick(e));
    // this.navProjectBtn.addEventListener('click', (e) => this.handleNavProjectBtnClick(e));
    this.navBar.addEventListener('click', (e) => this.handleNavLinkClick(e));
    // this.carouselComponent.addEventListener('itemClick', (e) => this.handleCarouselItemClick(e));
    window.addEventListener('hashchange', () => this.handleHash());

    this.handleResize = () => {
      this.screenResize = true;
    }
    window.addEventListener('resize', () => this.handleResize());

    window.addEventListener("scroll", this._onScroll, { passive: true });
  }

  scrollXEvent() {
    this.dispatchEvent(new CustomEvent('scroll-x-update', {
      detail: { status: 'complete' },
      composed: true
    }));
  }

  handleNavLinkClick(e) {
    const target = e.target.closest('.routing-link');
  
    if (target) {
      const linkIndex = parseInt(target.dataset.linkIndex);
      this.userInitiatedScroll = false;
      this.screenResize = false;

      this.handleScrollTo(this.linkMap[linkIndex]);
      
      // console.log('selectedLink', this.selectedLink)
      this.handleNavUpdate(linkIndex);
      
    }
  }

  handleNavUpdate(linkIndex) {
    console.log('handleNavUpdate')
    // console.log('selectedLink', this.selectedLink)
    switch (linkIndex) {
      case 0: 
        if (!this.appliedLink.home) {
          this.navHomeBtn.classList.add('selected');
          this.linkArr[this.selectedLink].classList.remove('selected');

          history.replaceState(null, null, ' ');
        }
        break;
      case 1:
        if (!this.appliedLink.intro) {
          this.navIntroBtn.classList.add('selected');
          this.linkArr[this.selectedLink].classList.remove('selected');

          history.replaceState(null, null, '#introduction');
        }
        break;
      case 2:
        if (!this.appliedLink.proj) {
          this.navProjectBtn.classList.add('selected');
          this.linkArr[this.selectedLink].classList.remove('selected');

          history.replaceState(null, null, '#projects');
        }
        break;
    }
    this.selectedLink = linkIndex;
    const newState = SECTION_STATES[this.linkMap[linkIndex]];
    Object.assign(this.appliedLink, newState);
  }

  handleScrollTo(section) {
    console.log('section', section);
    gsap.to(window, {
      duration: 2,
      ease: "power2.inOut",
      scrollTo: () => {
        switch (section) {
          case 'home':
            return 0;
          case 'introduction':
            const sectionDistance = (this.end - this.start) / 2;
            const targetY = this.start + sectionDistance * 1;
            return targetY || window.innerWidth;
            
          case 'projects':
            console.log('project')
            return 'max';
        }
      }
    });

    // gsap.to(window, {
    //   // duration: 2,
    //   duration: 3,
    //   ease: "power2.inOut",
    //   overwrite: "auto",
    //   scrollTo: () => {
    //     switch (section) {
    //       case 'home':
    //         return 0;
    //       case 'introduction':
    //         // const targetLeft = el.offsetLeft;
    //         // const viewportWidth = window.innerWidth;
    //         // const middleXCoordinate = ((viewportWidth * 2) - targetLeft) / 2;
    //         // const targetY = targetLeft + middleXCoordinate * 1;
    //         // // console.log('viewportWidth', viewportWidth);
    //         // // console.log('targetLEft', targetLeft)
           
    //         // // console.log('start', this.start)
    //         // // console.log('end', this.end)
    //         // // // console.log('horizontalTween', this.horizontalTween)
    //         // // // if (!this.horizontalTween) return;
    //         // // console.log('YES horizontalTween')
    //         // // // const st = this.horizontalTween.scrollTrigger;
    //         // // // const sectionDistance = (st.end - st.start) / 2;
    //         // // const sectionDistance = (this.end - this.start) / 2;

    //         // // // const targetY = st.start + sectionDistance * 1;
    //         // // const targetY = this.start + sectionDistance * 1;
    //         // // return targetY;
    //         // console.log('targetY', targetY)
    //         // // return targetY;
    //         // return targetY;
    //         const secondPage = this.shadowRoot.getElementById('introduction');
    //         console.log('secondPage', secondPage);
    //         window.scrollTo({
    //           top: secondPage.offsetLeft,
    //           behavior: 'smooth'
    //         })
    //         // secondPage.scrollIntoView({ behavior: 'smooth' });
    //         return;
            
    //       case 'projects':
    //         console.log('project')
    //         return 'max';
    //     }
    //   }
    // });
    // const secondPage = document.getElementById('introduction');
    // secondPage.scrollIntoView({ behavior: 'smooth' });
   
  }

  handleNavHomeBtnClick() {
    if (!this.appliedLink.home) {
      gsap.to(window, {
        duration: 3,
        scrollTo: 0
      });
      this.navHomeBtn.classList.add('selected');
      this.linkArr[this.selectedLink].classList.remove('selected');
      this.selectedLink = parseInt(this.navHomeBtn.dataset.linkIndex);
      this.userInitiatedScroll = false;
      this.screenResize = false;
      this.appliedLink.home = true;
      this.appliedLink.intro = false;
      this.appliedLink.proj = false;

      history.replaceState(null, null, ' ');
    }
  }

  handleNavIntroBtnClick() {
    if (!this.appliedLink.intro) {
      if (!this.horizontalTween  || this.horizontalTween.scrollTrigger) return;

      const st = this.horizontalTween.scrollTrigger;
      const sectionDistance = (st.end - st.start) / 2;
      console.log('st.end', st.end)
      console.log('st.start', st.start)

      const targetY = st.start + sectionDistance * 1;

      gsap.to(window, {
        ease: 'none',
        duration: 2,
        scrollTo: {
          y: targetY,
          autoKill: false
        },
        ease: "power2.inOut"
        // scrollTo: {
        //   invalidateOnRefresh: true,
        //   // end: "left 0",
        //   // y: () => {
        //   //   console.log('innerWidth',Math.min(window.innerWidth, 1440));
        //   //   return -Math.min(window.innerWidth, 1440);
        //   // } 
        //   y: window.innerWidth
        // }
        // scrollTo: () => { 
          
        //   console.log('window.innerWidth',window.innerWidth)
        //   if (this.prevPos < 0.5) {
        //     return Math.min(window.innerWidth, 1440) * 0.85; // for snap, 0.5
        //   } 

        //   return Math.min(window.innerWidth, 1440) * 0.85; // for snap, 1.5
        // }
        // {
        //   y: window.innerWidth * 0.6
        //   // y: (param) => { console.log('innerWidth',window.innerWidth); return Math.min(window.innerWidth, 1440) * 0.868 }
        // }
      });
      this.navIntroBtn.classList.add('selected');
      this.linkArr[this.selectedLink].classList.remove('selected');
      this.selectedLink = parseInt(this.navIntroBtn.dataset.linkIndex);
      this.userInitiatedScroll = false;
      this.screenResize = false;
      this.appliedLink.home = false;
      this.appliedLink.intro = true;
      this.appliedLink.proj = false;

      history.replaceState(null, null, '#introduction');
    }
  }

  updateRailwayScale() {
    const stations = this.shadowRoot.querySelectorAll('station-template');
    stations.forEach((stationEl) => {
      // gsap.to(stationEl, {
      //   scrollTrigger: {
      //     trigger: stationEl,
      //     start: 0,
      //     end: `+=${window.innerWidth * 1.8}`,
      //     scrub: 1
      //   }
      // });

      // let scaleDownView = false;

      if (this.progress > 0.178) {
        stationEl.scaleDownRailway = true;
        stationEl.onScaleDownRailway();
        // scaleDownView = false;
      } else if (this.progress <= 0.178) {
        stationEl.scaleDownRailway = false;
        stationEl.onScaleDownRailway();
        // scaleDownView = true;
      }
    });
  }

  handleNavProjectBtnClick() {
    if (!this.appliedLink.proj) {
      gsap.to(window, {
        duration: 2,
        scrollTo: "max",
        ease: "power2.inOut"
      });
      this.navProjectBtn.classList.add('selected');
      this.linkArr[this.selectedLink].classList.remove('selected');
      this.selectedLink = parseInt(this.navProjectBtn.dataset.linkIndex);
      this.userInitiatedScroll = false;
      this.screenResize = false;
      this.appliedLink.home = false;
      this.appliedLink.intro = false;
      this.appliedLink.proj = true;

      history.replaceState(null, null, '#projects');
    }
  }

  handleCarouselItemClick(e) {
    if (e.detail.val === 1) {
      console.log('Project 2 clicked')
    }
    // console.log('DETAIL: ', e.detail);
  }

  scrollAnimation() {
    const outerWrapperEl = this.shadowRoot.querySelector('.outer-wrapper');
    const innerWrapperEl = this.shadowRoot.querySelector('.inner-wrapper');
    const trainWheels = this.shadowRoot.querySelectorAll('.train-wheel');
    const trainEl = this.shadowRoot.querySelector('.train');
    const stations = this.shadowRoot.querySelectorAll('station-template');

    // console.log(stations[1].shadowRoot.querySelector('.railway'))

    function getScrollAmount () {
      const innerWrapperOffsetWidth = innerWrapperEl.offsetWidth;
      const windowInnerWidth = window.innerWidth;
      const visibleWidth = windowInnerWidth >= 1440 ? 1440 : windowInnerWidth;
      const scrollDistance = windowInnerWidth >= 1440 ? (1440 * 3) : innerWrapperOffsetWidth;

      return -(scrollDistance - visibleWidth);
    }

    this.handleWheel = async () => {
      this.userInitiatedScroll = true;
    }


    // listen for user-initiated scroll
    outerWrapperEl.addEventListener('wheel', this.handleWheel);

   
    this.horizontalTween = gsap.to(innerWrapperEl, {
      x: getScrollAmount,
      duration: 3,
      ease: "none",
      immediateRender: true,
    });


    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh(true); 
    }

    setTimeout(() => {
      this.start = this.horizontalTween.scrollTrigger.start;
      this.end = this.horizontalTween.scrollTrigger.end;
    }, 50);
     
    ScrollTrigger.create({
      trigger: outerWrapperEl,
      start: "top top",
      // start: "top 0",
      end: `+=${getScrollAmount() * -1}`,
      // end: "+=4000",
      // end: () => `+=${getScrollAmount * -1}`,
      scrub: 3,
      pin: true,
      // snap: {
      //   snapTo: 1 / 2, // Snaps to each section
      //   duration: { min: 0.3, max: 2 }, // Ensures snap completes even if scroll is fast
      //   delay: 0.7, // Small delay allows the browser to process the scroll intent
      //   ease: "power2.out"
      // },
      // width: '1440px',
      // maxWidth: '1440px',
      animation: this.horizontalTween,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (self.progress > 0.8) {
          this.prevPos = self.progress;
        } else if (self.progress < 0.5) {
          this.prevPos = self.progress;
        }

        const currentX = self.progress;

        if (this.userInitiatedScroll || this.screenResize) {
          if (currentX <= 0.4) {
            const selectedIndex = parseInt(this.navHomeBtn.dataset.linkIndex);
            if (!this.appliedLink.home && selectedIndex !== this.selectedLink) {
              this.navHomeBtn.classList.add('selected');
              this.linkArr[this.selectedLink].classList.remove('selected');
              this.selectedLink = selectedIndex;
              const newState = SECTION_STATES[this.linkMap[selectedIndex]];
              Object.assign(this.appliedLink, newState);

              history.replaceState(null, null, ' ');
            }

          } else if (currentX > 0.4 && currentX <= 0.8) {
            const selectedIndex = parseInt(this.navIntroBtn.dataset.linkIndex);
            if (!this.appliedLink.introduction && selectedIndex !== this.selectedLink) {
              this.navIntroBtn.classList.add('selected');
              this.linkArr[this.selectedLink].classList.remove('selected');
              this.selectedLink = selectedIndex;
              const newState = SECTION_STATES[this.linkMap[selectedIndex]];
              Object.assign(this.appliedLink, newState);

              history.replaceState(null, null, '#introduction');
            }
          } else if (currentX > 0.8) {
            const selectedIndex = parseInt(this.navProjectBtn.dataset.linkIndex);
            if (!this.appliedLink.project && selectedIndex !== this.selectedLink) {
              this.navProjectBtn.classList.add('selected');
              this.linkArr[this.selectedLink].classList.remove('selected');
              this.selectedLink = selectedIndex;
              const newState = SECTION_STATES[this.linkMap[selectedIndex]];
              Object.assign(this.appliedLink, newState);

              history.replaceState(null, null, '#projects');
            }
          }
        }

        // gsap.to(innerWrapperEl, {
        //   maxWidth: '1440px',
        //   x: (i, target) => {
        //     // const currentX = gsap.getProperty(target, "x");
        //     // console.log('curr X', currentX)
        //     // console.log('progress', self.progress)
        //     const currentX = self.progress;

        //     if (this.userInitiatedScroll || this.screenResize) {
        //       if (currentX <= 0.4) {
        //         const selectedIndex = parseInt(this.navHomeBtn.dataset.linkIndex);
        //         if (!this.appliedLink.home && selectedIndex !== this.selectedLink) {
        //           this.navHomeBtn.classList.add('selected');
        //           this.linkArr[this.selectedLink].classList.remove('selected');
        //           this.selectedLink = selectedIndex;
        //           this.appliedLink.home = true;
        //           this.appliedLink.intro = false;
        //           this.appliedLink.proj = false;
        //           // appliedHomeLink = true;
        //           // appliedIntroLink = false;
        //           // appliedProjectLink = false;
        //         }

        //       } else if (currentX > 0.4 && currentX <= 0.8) {
        //         const selectedIndex = parseInt(this.navIntroBtn.dataset.linkIndex);
        //         if (!this.appliedLink.intro && selectedIndex !== this.selectedLink) {
        //           this.navIntroBtn.classList.add('selected');
        //           this.linkArr[this.selectedLink].classList.remove('selected');
        //           this.selectedLink = selectedIndex;
        //           this.appliedLink.home = false;
        //           this.appliedLink.intro = true;
        //           this.appliedLink.proj = false;
        //           // appliedIntroLink = true;
        //           // appliedHomeLink = false;
        //           // appliedProjectLink = false;
        //         }
        //       } else if (currentX > 0.8) {
        //         const selectedIndex = parseInt(this.navProjectBtn.dataset.linkIndex);
        //         if (!this.appliedLink.proj && selectedIndex !== this.selectedLink) {
        //           this.navProjectBtn.classList.add('selected');
        //           this.linkArr[this.selectedLink].classList.remove('selected');
        //           this.selectedLink = selectedIndex;
        //           this.appliedLink.home = false;
        //           this.appliedLink.intro = false;
        //           this.appliedLink.proj = true;
        //           // appliedProjectLink = true;
        //           // appliedHomeLink = false;
        //           // appliedIntroLink = false;
        //         }
        //       }
        //     }
        //     const vwValInPx = (window.innerWidth * -200) / 100;
        //     const maxVal = Math.max(vwValInPx, 1440 * -2);
        //     // console.log('getScrollAmount()', getScrollAmount())
        //     // return `${-200 * self.progress}vw`;
        //     return `${maxVal * self.progress}px`;
        //     // return `${getScrollAmount() * self.progress}px`
        //   },
        //   // xPercent: -100 * (sections.length - 1),
        //   duration: 1.3,
        //   ease: "none",
        // })
        // gsap.to(railwayEl, {
        //     // xPercent: self.progress * 60,
        //     height: "50%",
        //     // scaleY: () => self.progress > 0.2 ? "50%" : "100%",
        //     duration: 0.5,
        //     ease: 'none'
        //   });
      
      }
    });

    trainWheels.forEach(trainWheel => {
      ScrollTrigger.create({
        trigger: trainWheel,
        pin: false,
        // scrub: 1,
        end:'+=4000vh',
        scrub: 1,
        //  end: `+=${getScrollAmount() * -1}`,
        onUpdate: (self) => {
          // gsap.to(trainWheel, {
          //   rotation: 360 * self.progress * 4,
          //   duration: 1,
          //   ease: "power2.inOut"
          // })
          gsap.set(trainWheel, {
            rotation: self.progress * 1840
          });

          ///// SOUND LOGIC
          // this.audioContext ??= new (
          //   window.AudioContext || window.webkitAudioContext
          // )();

          // if (this.audioContext.state === 'suspended') {
          //   await this.audioContext.resume();
          // }

          // const now = performance.now();

          // if (now - (this.lastScrollSound ?? 0) < 420) return;

          // this.lastScrollSound = now;

          // this.playScrollSound();
        }
      });
    });

    ScrollTrigger.create({
      trigger: trainEl,
      pin: false,
      start: 0,
      scrub: 1,
      // end:'+=4000',
      end: `+=${Math.min(window.innerWidth, 1440) * 1.8}`,
      // end: `+=${getScrollAmount() * -1}`,
      // ease: "none",
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // console.log(self.progress)
        gsap.to(trainEl, {
          // x: () => {
          //   console.log('getScrollAmount() inside trainEl', getScrollAmount())
          //   return getScrollAmount() ;
          // },
          // xPercent: self.progress * 570,     
          x: () => {
            // const vwValInPx = (window.innerWidth * 200) / 100;
            // const maxVal = Math.max(vwValInPx, 1440 * 2);
            // console.log('getScrollAmount()', getScrollAmount())
            // return `${-200 * self.progress}vw`;
            // return `${maxVal * self.progress}px`;
            const scrollDistance = Math.min(window.innerWidth, 1440);
            return scrollDistance * self.progress * 1.6;
          },
          // x: (getScrollAmount() * -1) * self.progress * 0.8,
          width: () => {

            trainEl.style.bottom = self.progress > 0.2 ? "-0.3rem" : "1.5rem";
            return self.progress > 0.2 ? "30%" : "90%"
          },
          // bottom: () => self.progress > 0.2 ? "-0.3rem" : "1.5rem",
          // end: "bottom right",
          // duration: 0.4, 
          duration: 0.7, 
          ease: "pow2.inOut",
        })
      }
    });


    stations.forEach((stationEl) => {
      // gsap.to(stationEl, {
      //   scrollTrigger: {
      //     trigger: stationEl,
      //     start: 0,
      //     end: `+=${window.innerWidth * 1.8}`,
      //     scrub: 1
      //   }
      // });

      // let scaleDownView = false;
      // if (this.progress > 0.2 && scaleDownView) {
      //   console.log('scale down railway!!!')
      //   stationEl.scaleDownRailway = true;
      //   stationEl.onScaleDownRailway();
      //   scaleDownView = false;
      // } else if (this.progress <= 0.2 && !scaleDownView) {
      //   console.log('scale UP railway!!!')
      //   stationEl.scaleDownRailway = false;
      //   stationEl.onScaleDownRailway();
      //   scaleDownView = true;
      // }
    });

    // stations.forEach((stationEl) => {
    //   let scaleDownView = false;
    //   this.animation = gsap.to(stationEl, {
    //     opacity: 1,

    //     scrollTrigger: {
    //       trigger: stationEl,
    //       start: 0,
    // //     // end: '+=2500',
    // //     // end: `+=${getScrollAmount() * -1}`,
    //     end: `+=${window.innerWidth * 1.8}`,
    //       scrub: 1,
    //       invalidateOnRefresh: true,
    //       onUpdate: (self) => {
    //         // console.log('self.progress', self.progress)
    //         if (self.progress > 0.2 && scaleDownView) {
    //           console.log('scale down railway!!!')
    //           stationEl.scaleDownRailway = true;
    //           stationEl.onScaleDownRailway();
    //           scaleDownView = false;
    //         } else if (self.progress <= 0.2 && !scaleDownView) {
    //           console.log('scale UP railway!!!')
    //           stationEl.scaleDownRailway = false;
    //           stationEl.onScaleDownRailway();
    //           scaleDownView = true;
    //         }
    //       }
    //     }
    //   })
    // })

    // stations.forEach((stationEl, index) => {
    //   let scaleDownView = false;
    //   ScrollTrigger.create({
    //     trigger: stationEl,
    //     start: 0,
    //     // end: '+=2500',
    //     // end: `+=${getScrollAmount() * -1}`,
    //     end: `+=${window.innerWidth * 1.8}`,
    //     pin: false,
    //     scrub: 0.6,
    //     // onRefresh: () => {
    //     //   const currentWidth = window.innerWidth;
    //     //   if (currentWidth !== this._lastWidth) {
    //     //     this._lastWidth = currentWidth;
    //     //     return;
    //     //   }
    //     // },
    //     invalidateOnRefresh: true,
    //     onUpdate: (self) => {
    //       const currentWidth = window.innerWidth;
    //       if (this._lastWidth !== currentWidth) {
    //         this._lastWidth = currentWidth; // Lock in the new baseline
    //         console.log("Resize update blocked. Preventing progress calculation flicker.");
    //         return; 
    //       }
    //       console.log('STATION Update !!!')
    //       if (self.progress > 0.2 && scaleDownView) {
    //         // console.log('scale down railway!!!')
    //         stationEl.scaleDownRailway = true;
    //         stationEl.onScaleDownRailway();
    //         scaleDownView = false;
    //       } else if (self.progress <= 0.2 && !scaleDownView) {
    //         stationEl.scaleDownRailway = false;
    //         stationEl.onScaleDownRailway();
    //         scaleDownView = true;
    //       }
    //       // console.log('railway',railwayEl)
    //       // gsap.to(railwayEl, {
    //       //   // xPercent: self.progress * 60,
    //       //   height: "50%",
    //       //   // scaleY: () => self.progress > 0.2 ? "50%" : "100%",
    //       //   duration: 0.5,
    //       //   ease: 'none'
    //       // });
    //     }
    //     // onRefresh: (self) => {
    //     //   if (!stationEl) return;

    //     //   if (self.progress > 0.2 && scaleDownView) {
    //     //     // console.log('scale down railway!!!')
    //     //     stationEl.scaleDownRailway = true;
    //     //     stationEl.onScaleDownRailway();
    //     //     scaleDownView = false;
    //     //   } else if (self.progress <= 0.2 && !scaleDownView) {
    //     //     stationEl.scaleDownRailway = false;
    //     //     stationEl.onScaleDownRailway();
    //     //     scaleDownView = true;
    //     //   }
    //     // }
    //   });
    // });
  }

  // addCarouselItems(data = []) {
  //   const carousel = this.shadowRoot.querySelector('ul.carousel');
  //   const fragment = document.createDocumentFragment();

  //   data.forEach(item => {
  //     const listItem = document.createElement('li');
  //     listItem.classList.add('item');

  //     const img = document.createElement('img');
  //     img.src = item.src;

  //     const labelContainer = document.createElement('div');
  //     labelContainer.classList.add('item-label-container');

  //     const span = document.createElement('span');
  //     span.classList.add('item-label');
  //     span.textContent = item.label;

  //     listItem.appendChild(img);
  //     labelContainer.appendChild(span);
  //     listItem.appendChild(labelContainer);
  //     fragment.appendChild(listItem);
  //   });
  //   carousel.replaceChildren(fragment);
  // }

  handleHash() {
    const hash = window.location.hash;
    const linkIndex = hash === SECTION_LINKS['introduction'] ? 1 :
                      hash === SECTION_LINKS['projects'] ? 2 :
                      0;

    this.userInitiatedScroll = false;    
    this.screenResize = false;
    
    this.handleScrollTo(this.linkMap[linkIndex]);
    this.handleNavUpdate(linkIndex);
  }

  disconnectedCallback() {
    window.removeEventListener('haschange', this.handleHash);
    window.removeEventListener('resize', this.handleResize);
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    this.horizontalTween?.kill();
    this.outerWrapperEl?.removeEventListener('wheel', this.handleWheel);
  }
}
customElements.define('app-home-component', AppHomeComponent);

/*

function calcScrollPositionPercent() {
  const horizontalViewportEl = document.querySelector('.outer-wrapper');
  const innerViewportEl = document.querySelector('.inner-wrapper');
  const navEl = document.querySelector('.nav-wrapper');

//   window.addEventListener('wheel', (event) => {
  
//     if (
//         event.deltaY !== 0 && 
//         !(event.deltaY < 0 && window.scrollX === 0) && 
//         !(event.deltaY > 0 && window.scrollX >= innerViewportEl.offsetWidth * 2)
//     ) {
//         console.log('window.scrollX', window.scrollX)
//         window.scroll(window.scrollX + event.deltaY * 0.7, window.scrollY);
//         document.body.style.setProperty('--scroll', ((window.scrollX + event.deltaY )) / (document.body.offsetWidth));
//         event.preventDefault();
//     }
    
//   }, {passive: false})

  window.addEventListener('scroll', (e) => {
    console.log('scrolling')
    console.log('window.pageYOffset', window.pageYOffset)

    const beginThirdViewport = innerViewportEl.offsetWidth * 2;

    if ((window.pageYOffset) <= beginThirdViewport) {

    
    // document.body.style.setProperty('--scroll', (window.pageYOffset) / (document.body.offsetWidth));
    // document.body.style.setProperty('--scroll', horizontalViewportEl.scrollTop / (document.body.offsetWidth));
    // document.body.style.setProperty('--scroll', horizontalViewportEl.scrollTop);


    // innerViewportEl.style.transform = `rotate(90deg) translateY(-100vh) translate3d(-${horizontalViewportEl.scrollTop * 0.05}px,0,0)`;
    innerViewportEl.style.transform = `translate3d(-${(((window.scrollY) )  <= innerViewportEl.offsetWidth * 2) ? (window.pageYOffset ) : innerViewportEl.offsetWidth * 2}px,0,0)`;
    console.log(innerViewportEl.offsetWidth);
    }
    // navEl.style.transform = `rotate(90deg) translate3d(${horizontalViewportEl.scrollTop}px,0,0)`
    // innerViewportEl.style.transform = `rotate(90deg) translateY(-100vh) translate3d(-${horizontalViewportEl.scrollTop / (document.body.offsetWidth)}px,0,0)`;
    // horizontalViewportEl.scrollTop
    // console.log('scrollY', horizontalViewportEl.scrollTop);
    // console.log('document.body.offsetWidth', document.body.offsetWidth);
    // console.log('window.innerHeight', window.innerWidth)
  }, false);
  // console.log('hello, it is raining')
}

// function getElementWidth(el) {
//   const resizeObserver = new ResizeObserver((entries) => {
//     const elWidth = entries[0].contentRect.width;
//     document.body.style.setProperty('--trainWidth', elWidth);
//     // console.log(elWidth);
//   });
//   resizeObserver.observe(el);
// }

// const train = document.querySelector('.train-body');
// getElementWidth(train);

const carouselContainer = document.querySelector('.carousel-wrapper');
let isDragging = false;
let scrollLeft;

const drag = (e) => {
  if (!isDragging) return;
  e.preventDefault();
  // scrollLeft = carouselContainer.scrollLeft;
  // scrollLeft -= e.movementX;
  carouselContainer.scrollLeft -= e.movementX;
  console.log('dragging', carouselContainer.scrollLeft)
}

carouselContainer.addEventListener('mousedown', () => isDragging = true);
carouselContainer.addEventListener('mousemove', drag);
carouselContainer.addEventListener('mouseup', () => isDragging = false);

// calcScrollPositionPercent();


gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(ScrollToPlugin);

// const sections = gsap.utils.toArray('station-template');

// let scrollTween = gsap.to(sections, {
//   xPercent: (i) =>  i * -100,
//   ease: "none",
//   scrollTrigger: {
//     trigger: ".outer-wrapper",
//     pin: false,
//     scrub: true,
//     end: () => "+= 3000"
//   }
// });

document.addEventListener('DOMContentLoaded', () => {
  const sections = gsap.utils.toArray('station-template');

  ScrollTrigger.create({
    trigger: ".outer-wrapper",
    start: "top top",
    end: "+=2500vh",
    scrub: 1,
    pin: true,
    onUpdate: (self) => {
      // document.body.style.setProperty('--scroll', (window.pageYOffset ) / (document.body.offsetWidth));
      gsap.to(".inner-wrapper", {
        x: `${-200 * self.progress}vw`,
        // xPercent: -100 * (sections.length - 1),
        duration: 1.3,
        ease: "none",
       
      })
    }
  })

  ScrollTrigger.create({
    trigger: ".train-wheel",
    pin: false,
    scrub: 1,
    end:'+=2500vh',
    onUpdate: (self) => {
      gsap.to(".train-wheel", {
        rotation: 360 * self.progress * 2,
        duration: 2,
        ease: "none"
      })
    }
  });

  ScrollTrigger.create({
    trigger: ".train",
    pin: false,
    start: 0,
    scrub: 1,
    end:'+=2500',
    onUpdate: (self) => {
      gsap.to(".train", {
          xPercent: self.progress * 570,     
          width: () => self.progress > 0.2 ? "30%" : "90%",
          // end: "bottom right",
          duration: 1.5, 
          ease: "none"
      })
    }
  });

//   gsap.timeline({
//   scrollTrigger:{
//     trigger: ".train-wheel-wrapper",
//     pin: true,
//     scrub:0.2,
//     end:'+=10000',
//   }
// })
// .to('.train-wheel', {
//   rotation:360*5,
//   duration:1, ease:'none',
// })


const navHomeBtn = document.querySelector('.link-one');
const navIntroBtn = document.querySelector('.link-two');
const navProjectBtn = document.querySelector('.link-three');

navHomeBtn.addEventListener('click', handleNavHomeBtn);
navIntroBtn.addEventListener('click', handleNavIntroBtn);
navProjectBtn.addEventListener('click', handleNavProjectBtn);



function handleNavHomeBtn(e) {
  gsap.to(window, {
    duration: 3,
    scrollTo: 0
  })
}
function handleNavIntroBtn(e) {
  e.preventDefault();
  gsap.to(window, {
    duration: 1,
    scrollTo: {
      // y: () => {sections[0].offsetWidth; console.log(sections[1].offsetWidth)}
      y: "#introduction",
      // start: "left start"
    }
  });

  // gsap.to(".train", {
  //   x: "100vw",
  //   duration: 1
  // });
}

function handleNavProjectBtn() {
  gsap.to(window, {
    duration: 2,
    scrollTo: {
      y: "max"
    }
  });
}

  
});

/////// navigate to project pages
const projectOne = document.querySelector('.project-card:first-child');

projectOne.addEventListener('click', () => redirectToPage('./components/project/project.html'));

function redirectToPage(link) {
  window.location.href = link;
}

*/
(() => {
  'use strict';
  const root = document.documentElement;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const story = document.querySelector('.scroll-story');
  const sticky = document.querySelector('.story-sticky');
  const panels = [...document.querySelectorAll('.story-panel')];
  const steps = [...document.querySelectorAll('.story-step')];
  const counter = document.querySelector('.story-count');
  const hero = document.querySelector('.hero');
  const tracks = [...document.querySelectorAll('.photo-track')];
  const floats = [
    {node:document.querySelector('.product-main'), amount:38},
    {node:document.querySelector('.product-bottom'), amount:-32},
    {node:document.querySelector('.about-photo-one'), amount:34},
    {node:document.querySelector('.about-photo-two'), amount:-31}
  ].filter(item=>item.node);
  const clamp = (value,min=0,max=1) => Math.min(max,Math.max(min,value));
  let frame = 0;

  const headings = [...document.querySelectorAll('.section-heading h2,.details-copy h2,.about-copy h2,.contact-inner h2')].map(heading=>{
    const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    const words=[];
    nodes.forEach(node=>{
      const fragment=document.createDocumentFragment();
      (node.textContent.match(/\S+|\s+/g)||[]).forEach(part=>{
        if(/^\s+$/.test(part)) fragment.append(document.createTextNode(part));
        else {const word=document.createElement('span');word.className='reveal-word';word.textContent=part;fragment.append(word);words.push(word);}
      });
      node.replaceWith(fragment);
    });
    return {node:heading,words};
  });

  function render(){
    frame=0;
    if(media.matches) return;
    const viewport=innerHeight;
    const heroRect=hero.getBoundingClientRect();
    const storyRect=story.getBoundingClientRect();
    const stickyHeight=sticky.getBoundingClientRect().height;
    const storyDistance=Math.max(1,storyRect.height-stickyHeight);
    const progress=clamp(-storyRect.top/storyDistance);
    const position=progress*(panels.length-1);
    const active=Math.round(position);
    const galleryMeasures=tracks.map(track=>({track,rect:track.parentElement.getBoundingClientRect(),travel:Math.max(0,track.scrollWidth-track.parentElement.clientWidth),reverse:track.parentElement.classList.contains('row-reverse')}));
    const headingMeasures=headings.map(item=>({...item,rect:item.node.getBoundingClientRect()}));
    const floatMeasures=floats.map(item=>({...item,rect:item.node.getBoundingClientRect()}));
    const pageDistance=Math.max(1,document.documentElement.scrollHeight-viewport);
    const heroProgress=clamp(-heroRect.top/heroRect.height);

    document.body.classList.toggle('story-focused',storyRect.top<=0&&storyRect.bottom>=stickyHeight*.7);
    root.style.setProperty('--page-progress',clamp(scrollY/pageDistance).toFixed(4));
    root.style.setProperty('--hero-scroll',heroProgress.toFixed(4));
    story.style.setProperty('--story-progress',progress.toFixed(4));
    story.dataset.progress=progress.toFixed(4);
    story.dataset.activeStep=String(active);
    counter.textContent=String(active+1).padStart(2,'0')+' / '+String(panels.length).padStart(2,'0');

    panels.forEach((panel,index)=>{
      const weight=clamp(1-Math.abs(position-index));
      const isActive=index===active;
      panel.style.opacity=weight.toFixed(4);
      panel.style.visibility=weight>.001?'visible':'hidden';
      panel.style.pointerEvents=isActive?'auto':'none';
      panel.style.zIndex=isActive?'3':'2';
      panel.inert=!isActive;
      panel.setAttribute('aria-hidden',String(!isActive));
      panel.classList.toggle('is-active',isActive);
      const photo=panel.querySelector('.story-photo-wrap');
      const image=panel.querySelector('.story-image');
      const copy=panel.querySelector('.story-copy');
      photo.style.transform='translate3d(0,'+((index-position)*30).toFixed(2)+'px,0)';
      photo.style.clipPath='inset('+((1-weight)*8).toFixed(2)+'% 0 round 24px)';
      image.style.transform='scale('+(1.025+(1-weight)*.06).toFixed(4)+')';
      copy.style.transform='translate3d(0,'+((index-position)*38).toFixed(2)+'px,0)';
      copy.style.opacity=clamp((weight-.48)/.42).toFixed(4);
    });
    steps.forEach((button,index)=>{button.classList.toggle('is-active',index===active);button.setAttribute('aria-pressed',String(index===active));});
    galleryMeasures.forEach(({track,rect,travel,reverse})=>{
      const p=clamp((viewport-rect.top)/(viewport+rect.height));
      const x=-travel*(reverse?1-p:p);
      track.style.setProperty('--track-x',x.toFixed(2)+'px');
    });
    headingMeasures.forEach(({words,rect})=>{
      const p=clamp((viewport*.91-rect.top)/(viewport*.62+rect.height));
      words.forEach((word,index)=>word.style.setProperty('--word-fill',clamp((p*(words.length+2)-index)/1.6).toFixed(3)));
    });
    floatMeasures.forEach(({node,rect,amount})=>{
      const p=clamp((viewport-rect.top)/(viewport+rect.height));
      node.style.setProperty('--float-y',((p-.5)*amount).toFixed(2)+'px');
    });
    const role=document.querySelector('#role-word');
    if(role) role.textContent=['IDENTIDADE.','NATURALIDADE.','EQUILÍBRIO.'][Math.min(2,Math.floor(heroProgress*3))];
  }
  function schedule(){if(!frame&&!media.matches) frame=requestAnimationFrame(render);}
  function enable(){
    root.classList.toggle('scroll-enhanced',!media.matches);
    if(media.matches){
      document.body.classList.remove('story-focused');
      panels.forEach(panel=>{
        panel.removeAttribute('style');panel.removeAttribute('aria-hidden');panel.inert=false;
        panel.querySelector('.story-photo-wrap').removeAttribute('style');
        panel.querySelector('.story-image').removeAttribute('style');
        panel.querySelector('.story-copy').removeAttribute('style');
      });
      tracks.forEach(track=>track.style.removeProperty('--track-x'));
      headings.forEach(item=>item.words.forEach(word=>word.style.setProperty('--word-fill','1')));
      floats.forEach(item=>item.node.style.removeProperty('--float-y'));
    }else schedule();
  }
  steps.forEach((button,index)=>button.addEventListener('click',()=>{
    const rectangle=story.getBoundingClientRect();
    const distance=story.offsetHeight-sticky.offsetHeight;
    const target=scrollY+rectangle.top+distance*(index/(panels.length-1));
    window.scrollTo({top:target,behavior:media.matches?'auto':'smooth'});
  }));
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  addEventListener('pageshow',schedule);
  media.addEventListener('change',enable);
  document.querySelectorAll('img').forEach(image=>{if(!image.complete) image.addEventListener('load',schedule,{once:true});});
  document.fonts.ready.then(schedule);
  enable();
})();
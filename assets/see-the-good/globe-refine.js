(()=>{
  const detail=document.querySelector('[data-stg-detail]');
  const index=document.querySelector('[data-stg-project-chips]');
  const gallery=document.querySelector('[data-stg-category-gallery]');
  if(!detail||!index)return;

  const photos={
    'Ryan Honary — Wildfire Detector':{
      src:'https://s7d2.scene7.com/is/image/TWCNews/AI_Wildfire_detection_Technology_JK_CA_crop?$wide-bg$=&hei=703&wid=1250',
      alt:'Ryan Honary with a SensoRy AI wildfire sensor',
      credit:'Spectrum News / Jo Kwon'
    }
  };
  const categoryArtwork={
    'Accessibility & Care':'/assets/see-the-good/category-accessibility-care.svg',
    'Health & Science':'/assets/see-the-good/category-health-science.svg',
    'Climate & Environment':'/assets/see-the-good/category-climate-environment.svg',
    'Community Problem-Solvers':'/assets/see-the-good/category-community-problem-solvers.svg',
    'Reinventing Learning':'/assets/see-the-good/category-reinventing-learning.svg',
    'Student Voice & Agency':'/assets/see-the-good/category-student-voice-agency.svg',
    'Creativity & Storytelling':'/assets/see-the-good/category-creativity-storytelling.svg'
  };

  function simplifySnapshot(){
    const category=detail.querySelector('.category');
    const summary=detail.querySelector('.stg-story-body p');
    if(category&&!category.textContent.startsWith('Project snapshot · '))category.textContent='Project snapshot · '+category.textContent.split('·').pop().trim();
    if(summary&&/ This project is part of the working research pool/.test(summary.textContent))summary.textContent=summary.textContent.replace(/ This project is part of the working research pool[\s\S]*/, '');
    detail.querySelector('.stg-story-toggle')?.remove();
    detail.querySelector('.stg-story-more')?.remove();
    detail.querySelector('.stg-story-nav')?.remove();
  }

  function renderCategoryGallery(){
    if(!gallery||gallery.childElementCount)return;
    Object.entries(categoryArtwork).forEach(([category,src])=>{
      const button=document.createElement('button');
      button.className='stg-category-card';
      button.type='button';
      button.setAttribute('aria-label','Explore '+category+' projects');
      const image=document.createElement('img');
      image.src=src; image.alt=''; image.loading='lazy';
      const label=document.createElement('span');
      label.textContent=category;
      button.append(image,label);
      button.addEventListener('click',()=>{
        const filter=[...document.querySelectorAll('[data-stg-index-categories] button')].find(item=>item.textContent===category);
        filter?.click();
        index.scrollIntoView({block:'start',behavior:'smooth'});
      });
      gallery.appendChild(button);
    });
  }

  function decorateCards(){
    [...index.querySelectorAll('.stg-project-card')].forEach(card=>{
      if(card.querySelector('.stg-project-card-media'))return;
      const title=card.querySelector('h4')?.textContent||'';
      const team=(card.querySelector('.stg-project-card-meta span:first-child')?.textContent||'').replace(/^Student team:\s*/,'').trim();
      const photo=photos[title];
      if(!photo&&!team)return;
      const media=document.createElement('div');
      media.className='stg-project-card-media has-photo';
      const image=document.createElement('img');
      image.src=photo?photo.src:'/api/project-image?team='+encodeURIComponent(team);
      image.alt=photo?photo.alt:'';
      image.loading='lazy';
      image.addEventListener('error',()=>media.remove(),{once:true});
      media.appendChild(image);
      if(photo){
        const credit=document.createElement('span');
        credit.className='stg-project-card-credit'; credit.textContent=photo.credit;
        media.appendChild(credit);
      }
      card.prepend(media);
    });
  }

  function limitIndex(){
    const cards=[...index.querySelectorAll('.stg-project-card')];
    if(!cards.length||index.querySelector('.stg-load-more'))return;
    cards.slice(12).forEach(card=>card.hidden=true);
    if(cards.length<=12)return;
    const more=document.createElement('button');
    more.className='stg-load-more';
    more.type='button';
    more.textContent='Show '+Math.min(12,cards.length-12)+' more projects';
    more.addEventListener('click',()=>{
      const hidden=cards.filter(card=>card.hidden).slice(0,12);
      hidden.forEach(card=>card.hidden=false);
      const remaining=cards.filter(card=>card.hidden).length;
      if(remaining)more.textContent='Show '+Math.min(12,remaining)+' more projects';
      else more.remove();
    });
    index.appendChild(more);
  }

  new MutationObserver(simplifySnapshot).observe(detail,{childList:true,subtree:true});
  new MutationObserver(()=>{decorateCards();limitIndex();}).observe(index,{childList:true});
  simplifySnapshot();
  renderCategoryGallery();
  decorateCards();
  limitIndex();
})();

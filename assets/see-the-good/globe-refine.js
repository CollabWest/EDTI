(()=>{
  const detail=document.querySelector('[data-stg-detail]');
  const index=document.querySelector('[data-stg-project-chips]');
  if(!detail||!index)return;

  const photos={
    'Ryan Honary — Wildfire Detector':{
      src:'https://s7d2.scene7.com/is/image/TWCNews/AI_Wildfire_detection_Technology_JK_CA_crop?$wide-bg$=&hei=703&wid=1250',
      alt:'Ryan Honary with a SensoRy AI wildfire sensor',
      credit:'Spectrum News / Jo Kwon'
    }
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

  function decorateCards(){
    [...index.querySelectorAll('.stg-project-card')].forEach(card=>{
      if(card.querySelector('.stg-project-card-media'))return;
      const title=card.querySelector('h4')?.textContent||'';
      const category=card.querySelector('.stg-project-card-category')?.textContent||'Student project';
      const photo=photos[title];
      const media=document.createElement('div');
      media.className='stg-project-card-media'+(photo?' has-photo':'');
      if(photo){
        const image=document.createElement('img');
        image.src=photo.src; image.alt=photo.alt; image.loading='lazy';
        const credit=document.createElement('span');
        credit.className='stg-project-card-credit'; credit.textContent=photo.credit;
        media.append(image,credit);
      }else{
        const kicker=document.createElement('span');
        kicker.textContent=category;
        media.appendChild(kicker);
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
  decorateCards();
  limitIndex();
})();

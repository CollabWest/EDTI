(()=>{
  const detail=document.querySelector('[data-stg-detail]');
  const index=document.querySelector('[data-stg-project-chips]');
  if(!detail||!index)return;

  function simplifySnapshot(){
    const category=detail.querySelector('.category');
    const summary=detail.querySelector('.stg-story-body p');
    if(category&&!category.textContent.startsWith('Project snapshot · '))category.textContent='Project snapshot · '+category.textContent.split('·').pop().trim();
    if(summary&&/ This project is part of the working research pool/.test(summary.textContent))summary.textContent=summary.textContent.replace(/ This project is part of the working research pool[\s\S]*/, '');
    detail.querySelector('.stg-story-toggle')?.remove();
    detail.querySelector('.stg-story-more')?.remove();
    detail.querySelector('.stg-story-nav')?.remove();
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
  new MutationObserver(limitIndex).observe(index,{childList:true});
  simplifySnapshot();
  limitIndex();
})();

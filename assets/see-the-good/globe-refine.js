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
  const categoryCopy={
    'All projects':'A wide-angle view of the young people building the future—across classrooms, communities, and countries.',
    'Accessibility & Care':'Young people using technology to make the world easier to move through, hear, understand, and belong in.',
    'Health & Science':'Students putting curiosity, care, and emerging technology to work on urgent health questions.',
    'Climate & Environment':'Student builders turning their attention toward the planet, from agricultural tools to better ways to reuse.',
    'Community Problem-Solvers':'Projects that start with a practical local need, then build toward a solution.',
    'Reinventing Learning':'Students reimagining what learning can be—and who gets to shape it.',
    'Student Voice & Agency':'Students bringing their lived experience and ideas into the decisions that shape their schools.',
    'Creativity & Storytelling':'Young people using AI to make, preserve, and share the stories that matter to them.'
  };
  const categoryArtwork={
    'All projects':'/assets/see-the-good/category-all-projects.svg',
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

  function updateCategoryHero(category){
    if(!gallery)return;
    const src=categoryArtwork[category];
    if(!src){
      gallery.hidden=true;
      gallery.replaceChildren();
      return;
    }
    gallery.hidden=false;
    const visual=document.createElement('div');
    visual.className='stg-category-gallery-visual';
    const image=document.createElement('img');
    image.src=src; image.alt='';
    visual.appendChild(image);
    const copy=document.createElement('div');
    copy.className='stg-category-gallery-copy';
    const eyebrow=document.createElement('p');
    eyebrow.className='stg-category-gallery-eyebrow';
    eyebrow.textContent='Project category';
    const title=document.createElement('h4');
    title.textContent=category==='All projects'?'All Front Runners':category;
    const description=document.createElement('p');
    description.className='stg-category-gallery-description';
    description.textContent=categoryCopy[category]||'Explore the students and ideas in this collection.';
    const count=document.createElement('p');
    count.className='stg-category-gallery-count';
    const visible=[...index.querySelectorAll('.stg-project-card:not([hidden])')].length;
    count.textContent=visible+' project'+(visible===1?'':'s')+' in this selection';
    copy.append(eyebrow,title,description,count);
    gallery.replaceChildren(visual,copy);
  }

  document.querySelector('[data-stg-index-categories]')?.addEventListener('click',event=>{
    const filter=event.target.closest('button');
    if(!filter)return;
    requestAnimationFrame(()=>updateCategoryHero(filter.textContent));
  });

  function decorateCards(){
    [...index.querySelectorAll('.stg-project-card')].forEach(card=>{
      if(card.querySelector('.stg-project-card-media'))return;
      const title=card.querySelector('h4')?.textContent||'';
      const team=(card.querySelector('.stg-project-card-meta span:first-child')?.textContent||'').replace(/^Student team:\s*/,'').trim();
      const category=card.querySelector('.stg-project-card-category')?.textContent||'All projects';
      const media=document.createElement('div');
      media.className='stg-project-card-media';
      const image=document.createElement('img');
      image.src=categoryArtwork[category]||categoryArtwork['All projects'];
      image.alt='';
      image.loading='lazy';
      media.appendChild(image);
      card.prepend(media);
      const action=card.querySelector('.stg-project-card-toggle');
      if(action&&team){
        const visit=document.createElement('a');
        visit.className=action.className;
        visit.href='/api/project-image?team='+encodeURIComponent(team)+'&destination=source';
        visit.target='_blank';
        visit.rel='noopener noreferrer';
        visit.textContent='Visit their site ↗';
        action.replaceWith(visit);
      }
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
  updateCategoryHero('All projects');
  decorateCards();
  limitIndex();
})();

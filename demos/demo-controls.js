(function(){
  'use strict';

  var root=document.documentElement;
  var panel=document.getElementById('demoA11yPanel');
  var trigger=document.getElementById('demoA11yButton');
  var storageKey='a11y-prefs';
  var classes=['a11y-contraste','a11y-claro','a11y-fuente','a11y-links','a11y-quieto'];
  var prefs={cls:[],txt:0};

  function readPrefs(){
    try{
      var saved=JSON.parse(window.localStorage.getItem(storageKey)||'null');
      if(saved&&typeof saved==='object'){
        prefs.cls=Array.isArray(saved.cls)?saved.cls.filter(function(name){return classes.indexOf(name)>-1;}):[];
        prefs.txt=[0,1,2].indexOf(saved.txt)>-1?saved.txt:0;
      }
    }catch(_){prefs={cls:[],txt:0};}
    if(prefs.cls.indexOf('a11y-contraste')>-1){prefs.cls=prefs.cls.filter(function(name){return name!=='a11y-claro';});}
  }

  function savePrefs(){
    try{window.localStorage.setItem(storageKey,JSON.stringify(prefs));}catch(_){}
  }

  function applyPrefs(){
    classes.forEach(function(name){root.classList.toggle(name,prefs.cls.indexOf(name)>-1);});
    root.classList.toggle('a11y-txt1',prefs.txt===1);
    root.classList.toggle('a11y-txt2',prefs.txt===2);
    panel.querySelectorAll('[data-pref-class]').forEach(function(button){
      button.setAttribute('aria-pressed',prefs.cls.indexOf(button.dataset.prefClass)>-1?'true':'false');
    });
    panel.querySelectorAll('[data-pref-size]').forEach(function(button){
      button.setAttribute('aria-pressed',Number(button.dataset.prefSize)===prefs.txt?'true':'false');
    });
  }

  function closePanel(restoreFocus){
    panel.hidden=true;
    trigger.setAttribute('aria-expanded','false');
    if(restoreFocus)trigger.focus();
  }

  trigger.addEventListener('click',function(){
    var open=panel.hidden;
    panel.hidden=!open;
    trigger.setAttribute('aria-expanded',open?'true':'false');
    if(open)panel.querySelector('button').focus();
  });

  panel.addEventListener('click',function(event){
    var size=event.target.closest('[data-pref-size]');
    if(size){prefs.txt=Number(size.dataset.prefSize);savePrefs();applyPrefs();return;}
    var toggle=event.target.closest('[data-pref-class]');
    if(toggle){
      var name=toggle.dataset.prefClass;
      var index=prefs.cls.indexOf(name);
      if(index>-1){prefs.cls.splice(index,1);}
      else{
        if(name==='a11y-contraste'||name==='a11y-claro'){
          prefs.cls=prefs.cls.filter(function(value){return value!=='a11y-contraste'&&value!=='a11y-claro';});
        }
        prefs.cls.push(name);
      }
      savePrefs();applyPrefs();return;
    }
    if(event.target.closest('[data-pref-reset]')){prefs={cls:[],txt:0};savePrefs();applyPrefs();}
  });

  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&!panel.hidden){event.preventDefault();closePanel(true);}
  });
  document.addEventListener('pointerdown',function(event){
    if(!panel.hidden&&!event.target.closest('.demo-tools'))closePanel(false);
  });

  readPrefs();
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches&&prefs.cls.indexOf('a11y-quieto')===-1){prefs.cls.push('a11y-quieto');}
  applyPrefs();
})();

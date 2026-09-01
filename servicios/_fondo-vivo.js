<script>
/* Fondo vivo de toda la pagina: una reticula que reacciona al cursor, un
   barrido periodico y una red de particulas. Un lienzo fijo del tamano de
   la pantalla, asi que cuesta lo mismo aunque la pagina sea larga.
   Se apaga con "sin movimiento" y se oculta en alto contraste. */
(function(){
  var cv=document.querySelector('.fondo-vivo'); if(!cv)return;
  var R=document.documentElement, g=cv.getContext('2d');
  if(R.classList.contains('a11y-quieto'))return;

  var PASO=26, ratio=1, an=0, al=0, P=[], raton={x:-9999,y:-9999}, t=0, vivo=true, corriendo=false;

  function paleta(){
    return R.classList.contains('a11y-claro')
      ? {base:'rgba(70,58,32,.13)', vivoC:'194,148,20', punto:'rgba(90,80,60,.5)', linea:'194,148,20'}
      : {base:'rgba(104,113,138,.14)', vivoC:'240,180,41', punto:'rgba(154,163,182,.45)', linea:'240,180,41'};
  }
  var col=paleta();

  function medir(){
    ratio=Math.min(devicePixelRatio||1,2);
    an=innerWidth; al=innerHeight;
    cv.width=an*ratio; cv.height=al*ratio;
    g.setTransform(ratio,0,0,ratio,0,0);
    var n=Math.max(16,Math.min(Math.round(an*al/22000),56));
    P=[];
    for(var i=0;i<n;i++)P.push({x:Math.random()*an,y:Math.random()*al,
      vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22});
  }
  medir();
  addEventListener('resize',medir);
  addEventListener('pointermove',function(e){raton.x=e.clientX;raton.y=e.clientY;});
  addEventListener('pointerleave',function(){raton.x=raton.y=-9999;});

  function cuadro(){
    corriendo=true;
    g.clearRect(0,0,an,al);
    var barrido=((t*1.7)%(an+560))-280;
    var cols=Math.ceil(an/PASO), fils=Math.ceil(al/PASO);
    for(var y=0;y<fils;y++)for(var x=0;x<cols;x++){
      var cx=x*PASO+PASO/2, cy=y*PASO+PASO/2;
      var cerca=Math.max(0,1-Math.hypot(cx-raton.x,cy-raton.y)/170);
      var haz=Math.max(0,1-Math.abs(cx-barrido)/160);
      var f=Math.max(cerca,haz*0.8);
      if(f>0.015){
        var lado=3+f*7;
        g.fillStyle='rgba('+col.vivoC+','+(0.08+f*0.62)+')';
        g.fillRect(cx-lado/2,cy-lado/2,lado,lado);
      }else{
        g.fillStyle=col.base;
        g.fillRect(cx-1.5,cy-1.5,3,3);
      }
    }
    for(var i=0;i<P.length;i++){
      var p=P[i];
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>an)p.vx*=-1;
      if(p.y<0||p.y>al)p.vy*=-1;
      for(var j=i+1;j<P.length;j++){
        var q=P[j], d=Math.hypot(p.x-q.x,p.y-q.y);
        if(d<120){
          g.strokeStyle='rgba('+col.linea+','+(0.11*(1-d/120))+')';
          g.lineWidth=1; g.beginPath(); g.moveTo(p.x,p.y); g.lineTo(q.x,q.y); g.stroke();
        }
      }
      var dm=Math.hypot(p.x-raton.x,p.y-raton.y);
      g.fillStyle= dm<130 ? 'rgba('+col.vivoC+',.8)' : col.punto;
      g.beginPath(); g.arc(p.x,p.y,dm<130?2.1:1.3,0,7); g.fill();
    }
    t+=1;
    if(vivo)requestAnimationFrame(cuadro); else corriendo=false;
  }

  function despierta(){ if(vivo&&!corriendo)requestAnimationFrame(cuadro); }
  document.addEventListener('visibilitychange',function(){
    vivo=!document.hidden; despierta();
  });
  if('MutationObserver' in window){
    new MutationObserver(function(){col=paleta();}).observe(R,{attributes:true,attributeFilter:['class']});
  }
  requestAnimationFrame(cuadro);
})();
</script>
/* Datos del negocio en un solo lugar, compartidos por todas las páginas. */
/* En esta propuesta pública NO va ningún dato del cliente: ni teléfono,
   ni WhatsApp, ni correo, ni el nombre del director, ni sus fotografías.
   En el sitio real aquí irían los datos verdaderos y los botones
   marcarían de un toque. */
const NEGOCIO = {
  nombre:"Noah Tours", ciudad:"Manzanillo, Colima",
  direccion:"Plaza Galería, Salahua, Manzanillo",
  telefono:"", telVisible:"314 ··· ····", whatsapp:"",
  correo:"contacto@ ··· ", director:"", anios:25,
  demo:true,
};
(function(){
  const n = NEGOCIO;
  const tel = n.demo ? "#" : "tel:+52" + n.telefono;
  const wa  = m => n.demo ? "#" : "https://wa.me/" + n.whatsapp + "?text=" + encodeURIComponent(m);
  const msg = document.body.dataset.mensaje || "Buen día, quiero reservar un tour. Me interesa:";
  document.querySelectorAll("[data-tel]").forEach(e=>{ e.href = tel; });
  document.querySelectorAll("[data-wa]").forEach(e=>{ e.href = wa(msg); e.target="_blank"; e.rel="noopener"; });
  document.querySelectorAll("[data-mail]").forEach(e=>{ e.href = n.demo ? "#" : "mailto:" + n.correo; });
  document.querySelectorAll("[data-txt-tel]").forEach(e=>{ e.textContent = n.telVisible; });
  document.querySelectorAll("[data-txt-mail]").forEach(e=>{ e.textContent = n.correo; });
  document.querySelectorAll("[data-txt-dir]").forEach(e=>{ e.textContent = n.direccion; });
  document.querySelectorAll("[data-txt-pie]").forEach(e=>{ e.textContent = n.nombre + " · " + n.ciudad; });

  const ld = {
    "@context":"https://schema.org","@type":"TravelAgency",
    "name":n.nombre + " Manzanillo",
    "description":"Tours, pesca deportiva, yates y traslados en " + n.ciudad,
    "areaServed":n.ciudad,
    "address":{"@type":"PostalAddress","streetAddress":n.direccion,
      "addressLocality":"Manzanillo","addressRegion":"Colima","addressCountry":"MX"}
  };
  const s = document.createElement("script");
  s.type = "application/ld+json"; s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
})();

/* ── La mancha verde sigue la sección que estás viendo ───── */
(function(){
  const enlaces = [...document.querySelectorAll('.barra nav a[href*="#"]')];
  const mapa = new Map();
  enlaces.forEach(a=>{
    const id = a.getAttribute('href').split('#')[1];
    const sec = id && document.getElementById(id);
    if (sec) mapa.set(sec, a);
  });
  if (!mapa.size) return;
  const marca = a => {
    document.querySelectorAll('.barra nav a[aria-current]').forEach(e=>e.removeAttribute('aria-current'));
    if (a) a.setAttribute('aria-current','true');
  };
  const obs = new IntersectionObserver(entradas=>{
    const visibles = entradas.filter(e=>e.isIntersecting)
      .sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
    if (visibles.length) marca(mapa.get(visibles[0].target));
  }, { rootMargin:'-72px 0px -55% 0px', threshold:[.15,.4,.75] });
  mapa.forEach((_,sec)=>obs.observe(sec));

  // arriba del todo: la mancha vuelve a Inicio
  const inicio = document.querySelector('.barra nav a[href="index.html"]');
  addEventListener('scroll', ()=>{ if (scrollY < 120) marca(inicio); }, {passive:true});
})();

/* ── Aparición al bajar ─────────────────────────────────── */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const objetivos = document.querySelectorAll(
    '.nosotros .env > *, .tours .encabeza, .destacado, .malla > *, .nota-precio,' +
    '.tapa .env > *, .bloque .env > *, .otros-tours .malla > *, .contacto .env > *');
  objetivos.forEach(e=>e.classList.add('entra'));
  const mostrar = e => { e.classList.add('visible'); };
  const obs = new IntersectionObserver((es,o)=>{
    es.forEach((e,i)=>{ if(e.isIntersecting){
      e.target.style.transitionDelay = Math.min(i*60,240) + 'ms';
      mostrar(e.target); o.unobserve(e.target); } });
  }, { rootMargin:'0px 0px -8% 0px', threshold:.08 });
  objetivos.forEach(e=>obs.observe(e));

  // Red de seguridad: si el observador no corre, si algo falla o si la
  // página se imprime, a los 2.5 s todo se muestra igual. Un efecto no
  // puede ser la razón de que alguien no vea el contenido.
  setTimeout(()=>objetivos.forEach(mostrar), 2500);
  addEventListener('beforeprint', ()=>objetivos.forEach(mostrar));
})();

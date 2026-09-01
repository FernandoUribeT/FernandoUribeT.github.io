#!/usr/bin/env python3
"""Genera una pagina propia por servicio, bajo /servicios/<slug>/."""
import os, html

S = "/tmp/claude-1000/-home-XElCyanX-Proyectos-siat/69948902-997a-45a3-af81-412f156fcb68/scratchpad"
DEST = "/home/XElCyanX/portafolio/servicios"
BASE = open(f"{S}/estilo_base.css", encoding="utf-8").read()
TEMA = open(f"{S}/tema.js", encoding="utf-8").read()
WA = "https://wa.me/525659304558?text="
A11Y_HTML = open(f"{S}/a11y_panel.html", encoding="utf-8").read()
A11Y_JS   = open(f"{S}/a11y_script.js", encoding="utf-8").read()
LUCES = '<div class="luces" aria-hidden="true"><i></i><i></i><i></i></div>'

EXTRA = """
.migaja{display:inline-flex;align-items:center;gap:9px;font:700 .875rem/1 var(--sans);
        color:var(--tono);text-decoration:none;margin-bottom:34px}
.migaja:hover span{transform:translateX(-4px)}
.migaja span{display:inline-block;transition:transform .22s var(--ease)}
.cab{position:relative;overflow:hidden;padding:52px 0 44px}
.cab h1{font:800 clamp(2.1rem,5.2vw,3.9rem)/1.06 var(--display);letter-spacing:-.03em;margin-bottom:18px;max-width:18ch}
.cab .lema{font:600 clamp(1.0625rem,2.1vw,1.4375rem)/1.4 var(--display);color:var(--tono);max-width:44ch}
.cuerpo{display:grid;grid-template-columns:1.55fr .95fr;gap:46px;align-items:start;padding-bottom:70px}
@media(max-width:860px){.cuerpo{grid-template-columns:1fr;gap:34px}}
.texto p{margin-bottom:18px;color:var(--fg-dim);max-width:62ch}
.texto p strong{color:var(--fg);font-weight:600}
.texto h2{font:800 1.4375rem/1.25 var(--display);letter-spacing:-.02em;margin:38px 0 16px}
.opts{list-style:none;display:grid;gap:13px}
.opts li{padding-left:24px;position:relative;color:var(--fg-dim);font-size:.9375rem}
.opts li::before{content:"";position:absolute;left:0;top:.5em;width:10px;height:10px;border-radius:50%;background:var(--tono)}
.opts b{color:var(--fg);font-weight:700}
.lateral{position:sticky;top:82px;display:grid;gap:16px}
.cta{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px 24px}
.cta h2{font:800 1.375rem/1.2 var(--display);letter-spacing:-.02em;margin-bottom:11px}
.cta p{color:var(--fg-dim);font-size:.9375rem;margin-bottom:20px}
.cta a.wa{display:flex;align-items:center;justify-content:center;gap:9px;background:#25d366;color:#0b2f19;
          font:700 .9375rem/1 var(--sans);padding:15px 20px;border-radius:11px;text-decoration:none;
          transition:transform .2s var(--ease)}
.cta a.wa:hover{transform:translateY(-2px)}
.cta a.wa svg{width:1.15em;height:1.15em;flex:none}
.cta .nota{margin:14px 0 0;font:400 .75rem/1.5 var(--mono);color:var(--fg-faint);text-align:center}
.dato{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px 24px}
.dato b{display:block;font:700 .6875rem/1 var(--mono);letter-spacing:.14em;color:var(--fg-faint);margin-bottom:9px}
.dato p{font-size:.9375rem;color:var(--fg-dim);margin:0}
.demo{display:block;background:var(--card);border:1px solid var(--tono);border-radius:16px;padding:22px 24px;text-decoration:none;
      transition:transform .2s var(--ease)}
.demo:hover{transform:translateY(-2px)}
.demo b{display:block;font:700 .6875rem/1 var(--mono);letter-spacing:.14em;color:var(--tono);margin-bottom:9px}
.demo p{font-size:.9375rem;color:var(--fg-dim);margin:0 0 11px}
.demo em{font:700 .8125rem/1 var(--sans);color:var(--tono);font-style:normal}
.captura{margin:34px 0 8px;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--card)}
.captura img{display:block;width:100%;height:auto}
.captura figcaption{padding:13px 18px;font:400 .8125rem/1.5 var(--mono);color:var(--fg-faint);border-top:1px solid var(--line)}
.otras{padding:52px 0 70px;border-top:1px solid var(--line)}
.otras h2{font:800 1.375rem/1.2 var(--display);margin-bottom:20px}
.chips{display:flex;gap:11px;flex-wrap:wrap}
.chips a{border:1px solid var(--line-2);border-radius:10px;padding:11px 16px;font:600 .875rem/1 var(--sans);
         color:var(--fg-dim);text-decoration:none;background:var(--card)}
.chips a:hover{color:var(--fg);border-color:var(--accent)}
html.a11y-quieto .cta a.wa:hover,html.a11y-quieto .demo:hover{transform:none}
"""

ICONO_WA = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 '
 '1.86.5 3.6 1.36 5.1L2 22l5.2-1.52a9.8 9.8 0 0 0 4.84 1.26h.01c5.43 0 9.84-4.4 9.84-9.84C21.9 6.4 17.48 2 12.04 2Zm5.76 '
 '14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-.98.23-3.3-.7-2.78-1.1-4.54-3.94-4.68-4.12-.14-.18-1.12-1.5-1.12-2.86s.72-2.02.98'
 '-2.3c.24-.26.54-.32.72-.32h.52c.16 0 .4-.06.62.48.24.58.8 2 .87 2.14.07.14.12.3.02.48-.1.18-.15.3-.3.46-.14.18-.3.4-.44'
 '.53-.14.14-.3.3-.13.6.18.28.78 1.28 1.66 2.07 1.14 1.02 2.1 1.34 2.4 1.48.3.14.47.12.64-.08.18-.2.74-.86.94-1.16.2-.3.4'
 '-.24.66-.14.26.1 1.66.78 1.94.92.28.14.47.22.54.34.07.12.07.7-.17 1.38Z"/></svg>')


SWAP = """<script>
/* La captura sigue el tema elegido, igual que en el portafolio. */
(function(){
  var imgs=[].slice.call(document.querySelectorAll('img[data-base]'));
  if(!imgs.length)return;
  var R=document.documentElement, actual=null;
  function tema(){
    if(R.classList.contains('a11y-contraste'))return '-contraste';
    if(R.classList.contains('a11y-claro'))return '-claro';
    return '';
  }
  function pinta(){
    var t=tema(); if(t===actual)return; actual=t;
    imgs.forEach(function(im){im.src=im.dataset.base+t+'.webp';});
  }
  pinta();
  if('MutationObserver' in window){
    new MutationObserver(pinta).observe(R,{attributes:true,attributeFilter:['class']});
  }
})();
</script>"""

CAPTURAS = {
 "expedientes": ("expedientes", "Validación de expedientes: el sistema compara el documento contra el registro del titular."),
 "operacion":   ("calendario",  "Calendario de asignación: las reglas se aplican antes de guardar, no después."),
 "facturacion": ("qr",          "Identificadores QR para amarrar la unidad física con su registro."),
 "web":         ("revision",    "Sistema interno de revisión: firma en pantalla y bloqueo automático."),
}

SERVICIOS = [
 dict(slug="facturacion", tono="var(--accent)", titulo="Facturación electrónica",
   lema="Que tu sistema emita las facturas solo, y que el SAT no te las rechace.",
   parrafos=[
     "Si hoy capturas la venta en un lado y la factura en otro, estás haciendo el trabajo dos veces y "
     "abriendo la puerta a que los datos no coincidan. <strong>Cada diferencia entre lo que vendiste y lo "
     "que facturaste es un problema que aparece meses después</strong>, cuando ya nadie se acuerda.",
     "Conecto tu sistema con un proveedor autorizado por el SAT para que el CFDI salga con los datos que "
     "ya tienes capturados. Y antes de enviarlo, el sistema revisa que esté bien — porque un rechazo del "
     "SAT cuesta más tiempo que la validación que lo evita."],
   opts_titulo="¿Qué necesitas timbrar?",
   opts=[("Facturas de venta","CFDI 4.0 desde tu propio sistema, sin entrar a otro portal."),
         ("Carta Porte","Obligatoria para transporte de carga. Es la que más errores genera."),
         ("Complementos de pago","Cuando cobras en parcialidades o a crédito."),
         ("Nómina","Si tienes personal en nómina."),
         ("Cancelaciones","Con el motivo correcto, que desde 2022 el SAT exige.")],
   incluye=["Timbrado automático desde tu sistema actual",
            "Validación de datos antes de enviar, para evitar rechazos",
            "Carta Porte completa para transporte de carga",
            "Cancelaciones y complementos de pago",
            "Respaldo de XML y PDF ordenados por mes"],
   plazo="De tres a seis semanas, según qué tanto haya que conectar con lo que ya tienes.",
   demo=None),

 dict(slug="expedientes", tono="var(--azul)", titulo="Expedientes digitales",
   lema="Que el sistema revise la documentación de tus proveedores, no una persona.",
   parrafos=[
     "Revisar expedientes a mano es lento y, peor, es inconsistente: la misma carpeta pasa un lunes y no "
     "pasa un viernes según quién la revise. <strong>Y lo que más se cuela no es el documento falso, es el "
     "documento equivocado</strong> — uno auténtico, pero que no acredita lo que se supone que acredita.",
     "Te doy un ejemplo real que encontré en producción: un acta de nacimiento trae la CURP impresa. Una "
     "validación ingenua ve esa CURP y acepta el acta como si fuera identificación oficial. No lo es. "
     "<strong>Que un documento contenga un dato no significa que sea ese documento.</strong>"],
   opts_titulo="¿Qué puede revisar?",
   opts=[("Identificaciones","INE, pasaporte, cédula. Y que sean del titular, no de un familiar."),
         ("Documentos fiscales","Constancia de situación fiscal, opinión de cumplimiento."),
         ("Comprobantes de domicilio","Con validación de vigencia, que es donde más fallan."),
         ("Documentos de la empresa","Acta constitutiva, poderes, alta patronal."),
         ("Lo que tú definas","Las reglas de qué se acepta las pones tú, no yo.")],
   incluye=["Lectura de texto en documentos escaneados o fotografiados",
            "Clasificación por los marcadores propios de cada documento",
            "Verificación cruzada contra el registro del titular",
            "Aviso automático cuando algo está por vencer",
            "Explica qué falló, no solo que falló"],
   plazo="De cuatro a ocho semanas. Se puede entregar por etapas para que lo uses antes.",
   demo=("/demos/expedientes/","Pruébalo ahora mismo",
         "Sube uno de los documentos de ejemplo y cambia entre la validación ingenua y la endurecida. "
         "Vas a ver cómo una acepta un documento ajeno y la otra lo rechaza explicando por qué.")),

 dict(slug="operacion", tono="var(--verde)", titulo="Operación y logística",
   lema="Que las reglas de tu negocio se apliquen antes de guardar, no después.",
   parrafos=[
     "La mayoría de los sistemas dejan que capturen cualquier cosa y luego alguien revisa. Eso funciona "
     "hasta que el volumen crece. <strong>Después el error ya salió, ya se facturó, y corregirlo cuesta "
     "diez veces más que haberlo impedido.</strong>",
     "Construyo el sistema al revés: si un viaje no se puede asignar porque la unidad tiene una falla "
     "crítica, no se asigna — y la pantalla te dice por qué antes de que lo intentes. La regla vive en el "
     "sistema, no en la memoria de quien captura."],
   opts_titulo="¿Qué parte de tu operación?",
   opts=[("Programación de viajes","Calendario con las reglas que tú definas, no las que yo suponga."),
         ("Revisión de unidades","Punto por punto, con firma en pantalla del operador."),
         ("Control de mantenimiento","Por kilometraje y por días desde el último servicio."),
         ("Identificación física","Códigos QR para amarrar la unidad física con su registro."),
         ("Reportes de operación","Lo que necesitas ver el lunes en la mañana.")],
   incluye=["Calendario de asignación con reglas de negocio propias",
            "Revisión de unidades con firma en pantalla",
            "Bloqueo automático de unidad por falla crítica",
            "Control de mantenimiento por kilometraje y días",
            "Identificadores QR para control físico"],
   plazo="De dos a tres meses. Es el más variable: depende del tamaño de tu flota.",
   demo=("/demos/calendario/","Arrastra un viaje y mira qué pasa",
         "Suelta un evento en una fecha pasada. El sistema lo rechaza antes de guardar y te dice por qué. "
         "También está la demo de revisión de unidades con el bloqueo automático.")),

 dict(slug="web", tono="var(--accent)", titulo="Sitios y sistemas a medida",
   lema="Desde una página que explique bien a qué te dedicas, hasta dejar de trabajar en Excel.",
   parrafos=[
     "Hay dos problemas distintos que la gente junta. Uno es que <strong>tu negocio no aparece cuando "
     "alguien lo busca</strong>. El otro es que <strong>por dentro operas con hojas de cálculo que se "
     "mandan por WhatsApp</strong> y nadie sabe cuál es la buena.",
     "El primero se resuelve con un sitio rápido, que se vea bien en celular y que diga en dos líneas "
     "qué vendes. El segundo se resuelve con un sistema interno. No cuestan lo mismo ni tardan lo mismo, "
     "así que lo primero que hago es entender cuál de los dos tienes."],
   opts_titulo="¿Cuál de los dos es tu caso?",
   opts=[("Sitio informativo","Quién eres, qué vendes, cómo te contactan. Rápido y en celular."),
         ("Catálogo","Tus productos o servicios, con contacto directo por WhatsApp."),
         ("Sitio que puedas editar","Panel para que tú cambies textos y fotos sin llamarme."),
         ("Sistema interno","Inventario, clientes, cobranza. Para dejar las hojas de cálculo."),
         ("Los dos","Se puede, pero conviene empezar por uno y ver resultados.")],
   incluye=["Sitio rápido y que se vea bien en celular",
            "Catálogo, formularios y contacto directo por WhatsApp",
            "Panel para que tú mismo cambies el contenido",
            "Sistemas internos de inventario, clientes o cobranza",
            "Consultas protegidas contra inyección de código"],
   plazo="Una o dos semanas el sitio informativo. Un sistema interno, de cuatro a diez.",
   demo=None),

 dict(slug="automatizacion", tono="var(--azul)", titulo="Automatización de procesos",
   lema="Esa tarea que alguien hace a mano todos los días, hecha sola y con aviso cuando falla.",
   parrafos=[
     "Casi todo negocio tiene una tarea que se repite: entrar a un portal a ver si publicaron algo, copiar "
     "datos de un lado a otro, armar el mismo reporte cada lunes. Se puede automatizar casi siempre, y es "
     "<strong>lo más barato de empezar y lo que más tiempo devuelve.</strong>",
     "Pero lo importante no es que funcione — es que <strong>sepa cuándo no funcionó</strong>. Distingo "
     "entre «no pude llegar a la fuente» y «llegué pero los datos vienen mal»: la primera se reintenta "
     "sola, la segunda necesita que una persona la vea. Casi toda automatización reporta ambas igual, y "
     "por eso la gente deja de confiar en sus propias alertas."],
   opts_titulo="¿Qué se puede automatizar?",
   opts=[("Revisar portales","Que algo revise por ti si publicaron lo que esperas."),
         ("Extraer datos","De documentos, correos o sitios, hacia donde tú los necesites."),
         ("Reportes","El mismo reporte de siempre, en tu correo o WhatsApp, a la hora que quieras."),
         ("Conectar sistemas","Dos programas que hoy no se hablan y obligan a capturar dos veces."),
         ("Avisos","Que te enteres cuando algo pasa, sin tener que estar revisando.")],
   incluye=["Extracción de datos de portales y documentos",
            "Reportes automáticos por correo o WhatsApp",
            "Conexión entre sistemas que hoy no se hablan",
            "Distingue entre no llegar a la fuente y datos mal formados",
            "Registro de cada corrida, para poder auditarla"],
   plazo="De una a tres semanas. Es lo más rápido de ver funcionando.",
   demo=("https://github.com/FernandoUribeT/dof-scraper","El código está público",
         "Automaticé la revisión diaria del Diario Oficial de la Federación. Documenté tres defectos "
         "reproducibles del sitio de origen, incluido un certificado de seguridad vencido.")),

 dict(slug="soporte", tono="var(--verde)", titulo="Soporte y mantenimiento",
   lema="Para que lo que ya funciona siga funcionando cuando cambien las reglas.",
   parrafos=[
     "El software no se termina el día que se entrega. <strong>El SAT cambia requisitos, tu operación "
     "crece, y algo se rompe un viernes a las seis.</strong> Un sistema sin mantenimiento no se queda "
     "igual: se va degradando hasta que un día no puedes facturar.",
     "Por eso construyo la parte que cambia —la normativa— separada del resto. Cuando el SAT ajusta algo, "
     "se toca esa pieza y ya. Y te entrego el código y la documentación completos: <strong>si algún día "
     "quieres irte con otro desarrollador, puedes.</strong> No quiero clientes atrapados."],
   opts_titulo="¿Qué incluye el mes?",
   opts=[("Cambios de normativa","Cuando el SAT ajusta algo, la actualización va incluida."),
         ("Respaldos y monitoreo","Que alguien se dé cuenta antes que tu cliente."),
         ("Mejoras pequeñas","Ese campo que hacía falta, ese reporte que quieres distinto."),
         ("Atención por WhatsApp","Directo conmigo, no un formulario."),
         ("Documentación al día","Para que no dependas de mí para entender tu propio sistema.")],
   incluye=["Actualizaciones cuando cambia la normativa fiscal",
            "Respaldos automáticos y monitoreo",
            "Cambios y mejoras pequeñas incluidas",
            "Atención directa por WhatsApp",
            "Documentación al día, para que no dependas de mí"],
   plazo="Mensual, sin plazo forzoso. Se contrata aparte del proyecto.",
   demo=None),
]

def pagina(sv):
    otras = "".join(
      f'<a href="/servicios/{o["slug"]}/">{html.escape(o["titulo"])}</a>'
      for o in SERVICIOS if o["slug"] != sv["slug"])
    opts = "".join(f'<li><b>{html.escape(a)}</b> — {html.escape(b)}</li>' for a, b in sv["opts"])
    inc = "".join(f'<li>{html.escape(x)}</li>' for x in sv["incluye"])
    parr = "".join(f"<p>{p}</p>" for p in sv["parrafos"])
    demo = ""
    if sv["demo"]:
        u, t, d = sv["demo"]
        ext = ' target="_blank" rel="noopener"' if u.startswith("http") else ""
        demo = (f'<a class="demo" href="{u}"{ext}><b>NO TIENES QUE CREERME</b>'
                f'<p>{html.escape(d)}</p><em>{html.escape(t)} &rarr;</em></a>')
    cap = ""
    swap = ""
    if sv["slug"] in CAPTURAS:
        b, pie = CAPTURAS[sv["slug"]]
        cap = (f'<figure class="captura"><img src="/img/{b}.webp" data-base="/img/{b}" '
               f'alt="{html.escape(pie)}" width="900" height="495" loading="lazy">'
               f'<figcaption>{html.escape(pie)}</figcaption></figure>')
        swap = SWAP
    msg = f"Hola%20Fernando%2C%20me%20interesa%20{sv['slug']}%20para%20mi%20negocio."
    return f"""<!doctype html>
<html lang="es">
<meta charset="utf-8">
<link rel="icon" href="/icono.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(sv['titulo'])} — Fernando Uribe Trujillo</title>
<meta name="description" content="{html.escape(sv['lema'])}">
<style>{BASE}
:root{{--tono:{sv['tono']}}}
{EXTRA}</style>
{LUCES}
<a class="saltar" href="#main">Saltar al contenido</a>
<nav><div class="wrap">
  <a class="brand" href="/">FUT<span aria-hidden="true"></span></a>
  <div class="navlinks">
    <a href="/servicios/">Servicios</a>
    <a href="/servicios/#preguntas">Preguntas</a>
    <a class="destacado" href="/">Portafolio</a>
  </div>
</div></nav>
<div id="main" tabindex="-1"></div>
<header class="cab"><div class="trama" aria-hidden="true"></div><div class="wrap">
  <a class="migaja" href="/servicios/"><span aria-hidden="true">&larr;</span> Volver a servicios</a>
  <h1>{html.escape(sv['titulo'])}</h1>
  <p class="lema">{html.escape(sv['lema'])}</p>
</div></header>
<div class="wrap cuerpo">
  <div class="texto">
    {parr}
    <h2>{html.escape(sv['opts_titulo'])}</h2>
    <ul class="opts">{opts}</ul>
    {cap}
    <h2>Qué incluye</h2>
    <ul class="opts">{inc}</ul>
  </div>
  <aside class="lateral">
    <div class="cta">
      <h2>¿Empezamos?</h2>
      <p>Escríbeme y platicamos 15 minutos, sin costo y sin compromiso. Si lo que necesitas no es lo mío, te digo con quién sí.</p>
      <a class="wa" href="{WA}{msg}" target="_blank" rel="noopener">{ICONO_WA}Escribir por WhatsApp</a>
      <p class="nota">Contesto el mismo día.</p>
    </div>
    <div class="dato"><b>CUÁNTO TARDA</b><p>{html.escape(sv['plazo'])}</p></div>
    {demo}
  </aside>
</div>
<section class="otras"><div class="wrap">
  <h2>Otros servicios</h2>
  <div class="chips">{otras}</div>
</div></section>
<footer><div class="wrap">
  Fernando Uribe Trujillo · Manzanillo, Colima ·
  <a href="/">Ver portafolio técnico</a> ·
  <a href="https://github.com/FernandoUribeT">GitHub</a>
</div></footer>
{swap}
{A11Y_HTML}
<a class="wa-fab" href="{WA}{msg}" target="_blank" rel="noopener" aria-label="Escribirme por WhatsApp">{ICONO_WA}</a>
{A11Y_JS}
</html>"""

for sv in SERVICIOS:
    d = os.path.join(DEST, sv["slug"])
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(pagina(sv))
    print(f"  /servicios/{sv['slug']}/  {len(pagina(sv))//1024} KB")
print(f"  {len(SERVICIOS)} paginas generadas")

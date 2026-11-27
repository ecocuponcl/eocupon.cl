import type { Metadata } from "next"
import "./recicla.css"
import { LeadForm } from "./lead-form"

export const metadata: Metadata = {
  title: { absolute: "EcoCupon Recicla" },
  description:
    "Programa de incentivos al reciclaje para municipios, marcas y empresas: Recicla-Ya recibe y verifica los materiales, EcoCupon administra cupones y canjes.",
}

const WA = "https://wa.me/56979540471"
const WA_TEXT = `${WA}?text=${encodeURIComponent("Hola, quiero saber del programa EcoCupon Recicla")}`

export default function ReciclaPage() {
  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a className="brand" href="#top" aria-label="EcoCupon Recicla, inicio">
            <span className="dot" aria-hidden="true">♻</span> EcoCupon&nbsp;Recicla
          </a>
          <nav className="nav-links" aria-label="Secciones">
            <a href="#como">Cómo funciona</a>
            <a href="#para-quien">Para quién</a>
            <a href="#piloto">Piloto</a>
            <a href="#faq">Preguntas</a>
          </nav>
          <a className="btn btn--primary btn--sm" href="#piloto">Quiero el piloto</a>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Programa piloto · 2026</span>
              <h1>Cada kilo reciclado se convierte en un cupón que usa el comercio de tu comuna.</h1>
              <p className="lede">EcoCupon Recicla es el programa de incentivos que municipios, marcas y empresas financian.</p>
              <p className="lede lede-sub">Recicla-Ya recibe y verifica los materiales. EcoCupon administra participantes, cupones y canjes. Tú ves el resultado en un panel.</p>
              <div className="hero-ctas">
                <a className="btn btn--primary" href="#piloto">Quiero el piloto en mi comuna</a>
                <a className="btn btn--ghost" href={WA_TEXT} target="_blank" rel="noopener">Hablar por WhatsApp</a>
              </div>
              <p className="hero-note"><span className="pill">Etapa piloto</span> Sin costo para el comercio · sin app para el vecino · cupos 2026.</p>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="ticket-stage">
                <div className="ticket-2" />
                <div className="ticket float">
                  <div className="tick-top"><span>Cupón verde</span><span>EcoCupon</span></div>
                  <div className="big">20%<small>en tu comercio de barrio</small></div>
                  <div className="qr">
                    <svg viewBox="0 0 29 29" width="100%" height="100%" role="presentation">
                      <rect width="29" height="29" fill="#FBF8EC" />
                      <g fill="#1a1f14">
                        <rect x="1" y="1" width="7" height="7" /><rect x="2.4" y="2.4" width="4.2" height="4.2" fill="#FBF8EC" /><rect x="3.6" y="3.6" width="1.8" height="1.8" />
                        <rect x="21" y="1" width="7" height="7" /><rect x="22.4" y="2.4" width="4.2" height="4.2" fill="#FBF8EC" /><rect x="23.6" y="3.6" width="1.8" height="1.8" />
                        <rect x="1" y="21" width="7" height="7" /><rect x="2.4" y="22.4" width="4.2" height="4.2" fill="#FBF8EC" /><rect x="3.6" y="23.6" width="1.8" height="1.8" />
                        <rect x="10" y="2" width="2" height="2" /><rect x="14" y="1" width="2" height="2" /><rect x="17" y="3" width="2" height="2" /><rect x="10" y="6" width="2" height="2" /><rect x="13" y="8" width="2" height="2" /><rect x="17" y="6" width="2" height="2" />
                        <rect x="2" y="11" width="2" height="2" /><rect x="6" y="10" width="2" height="2" /><rect x="9" y="12" width="2" height="2" /><rect x="13" y="11" width="3" height="3" /><rect x="18" y="12" width="2" height="2" /><rect x="22" y="10" width="2" height="2" /><rect x="26" y="11" width="2" height="2" />
                        <rect x="2" y="15" width="2" height="2" /><rect x="5" y="17" width="3" height="2" /><rect x="10" y="16" width="2" height="2" /><rect x="15" y="15" width="2" height="2" /><rect x="19" y="17" width="2" height="2" /><rect x="23" y="16" width="3" height="2" />
                        <rect x="11" y="21" width="2" height="2" /><rect x="14" y="23" width="3" height="2" /><rect x="18" y="21" width="2" height="2" /><rect x="22" y="22" width="2" height="2" /><rect x="26" y="20" width="2" height="2" /><rect x="10" y="26" width="2" height="2" /><rect x="14" y="27" width="2" height="2" /><rect x="18" y="25" width="2" height="2" /><rect x="23" y="26" width="2" height="2" />
                      </g>
                    </svg>
                  </div>
                  <div className="tick-bottom"><span className="code">RECICLA20</span><span>1 uso · 15 días</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats" aria-label="Contexto del reciclaje en Chile">
          <div className="wrap">
            <div className="stat"><b>26%</b><span>declara reciclar con frecuencia en Chile</span></div>
            <div className="stat"><b>{"<"}2%</b><span>de los residuos se recicla</span></div>
            <div className="stat"><b>8,2 M t</b><span>de basura se generan al año</span></div>
          </div>
          <div className="wrap"><p className="src">Contexto, no resultados del programa. Fuente: Barómetro del Reciclaje ReSimple–CADEM 2025; SINIA 2022.</p></div>
        </section>

        <section className="section" id="como">
          <div className="wrap">
            <div className="head">
              <span className="eyebrow">Cómo funciona</span>
              <h2>Cuatro pasos, sin app para el vecino.</h2>
              <p>Cada parte hace lo suyo. Nadie duplica trabajo y el resultado queda medido.</p>
            </div>
            <div className="steps">
              <div className="step"><span className="num">PASO 01</span><h3>El vecino recicla</h3><p>Lleva sus materiales a un punto o registra su entrega desde el link del programa.</p><span className="who">Vecino</span></div>
              <div className="step"><span className="num">PASO 02</span><h3>Recicla-Ya verifica</h3><p>Recibe los materiales y valida el tipo y los kilos de cada entrega.</p><span className="who">Recicla-Ya</span></div>
              <div className="step"><span className="num">PASO 03</span><h3>Se emite el cupón</h3><p>EcoCupon asigna un cupón con código y QR al participante.</p><span className="who">EcoCupon</span></div>
              <div className="step"><span className="num">PASO 04</span><h3>Se canjea</h3><p>El vecino lo usa en un comercio del programa y el local confirma el canje.</p><span className="who">Comercio</span></div>
            </div>
          </div>
        </section>

        <section className="section section--tight" id="para-quien">
          <div className="wrap">
            <div className="head">
              <span className="eyebrow">Para quién</span>
              <h2>Tres compradores, tres motivos.</h2>
              <p>El programa se adapta a lo que cada uno necesita mostrar y lograr.</p>
            </div>
            <div className="aud-grid">
              <div className="aud aud--feat">
                <span className="tag">Municipios</span>
                <h3>Activa el reciclaje y muéstralo con datos.</h3>
                <p>Para direcciones de medio ambiente que necesitan resultados visibles en el territorio.</p>
                <ul>
                  <li>Canjes y kilos verificados, por período</li>
                  <li>Comercio local activado, no solo puntos limpios</li>
                  <li>Reporte para rendición y comunicación</li>
                </ul>
                <a className="btn" href="#piloto">Postular mi comuna</a>
              </div>
              <div className="aud">
                <span className="tag">Marcas</span>
                <h3>Propósito que se ve en la calle y se mide.</h3>
                <p>Para marcas de consumo que quieren activar su promesa de sostenibilidad en el punto de venta.</p>
                <ul>
                  <li>Activación territorial con comercios locales</li>
                  <li>Datos de participación y canjes para tu reporte</li>
                  <li>Contenido real, sin testimonios inventados</li>
                </ul>
                <a className="btn btn--primary" href="#piloto">Quiero activar mi marca</a>
              </div>
              <div className="aud">
                <span className="tag">Empresas</span>
                <h3>Recolección con retorno para tus clientes.</h3>
                <p>Para retail y operaciones que ya reciben materiales y quieren devolver valor.</p>
                <ul>
                  <li>Incentivo para quien recicla en tu local</li>
                  <li>Cupones administrados, sin operar la logística</li>
                  <li>Kilos verificados por Recicla-Ya</li>
                </ul>
                <a className="btn btn--primary" href="#piloto">Sumar mi empresa</a>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap panel-wrap">
            <div className="panel-copy">
              <span className="eyebrow">Para quien financia</span>
              <h2>El número que importa: canjes. Y los kilos, verificados.</h2>
              <p>No vistas ni compartidos. Canjes confirmados por el comercio, atribuidos al programa, y kilos validados por Recicla-Ya. Lo que un municipio puede rendir y una marca puede reportar.</p>
              <div className="chips">
                <span className="chip">Canjes por comercio</span><span className="chip">Kilos por material</span><span className="chip">Export CSV</span><span className="chip">Por período</span>
              </div>
            </div>
            <div className="panel" aria-label="Ejemplo de panel del operador">
              <div className="panel-top"><span className="t">Programa · comuna piloto</span><span className="badge">Ejemplo</span></div>
              <div className="metrics">
                <div className="metric"><b>128</b><span>canjes del mes</span></div>
                <div className="metric"><b>1,2 t</b><span>kilos verificados</span></div>
                <div className="metric"><b>24</b><span>comercios activos</span></div>
              </div>
              <div className="bars" aria-hidden="true">
                {[38, 52, 44, 66, 58, 74, 62, 86, 70, 94, 80, 100].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="panel-foot">Datos de ejemplo para mostrar el panel. En el piloto se llenan con canjes y kilos reales.</div>
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="wrap split">
            <div className="head" style={{ marginBottom: 0 }}>
              <span className="eyebrow">Cómo se reparte el trabajo</span>
              <h2>Una alianza, no un software suelto.</h2>
              <p>EcoCupon no reemplaza la operación de reciclaje: la conecta con incentivos y comercios.</p>
            </div>
            <div className="split-table">
              <div className="split-row"><div className="k">Municipio / marca</div><div className="v">Financia el programa, define territorio y materiales, y recibe el reporte.</div></div>
              <div className="split-row"><div className="k">Recicla-Ya</div><div className="v">Recibe los materiales y verifica tipo y kilos de cada entrega.</div></div>
              <div className="split-row"><div className="k">EcoCupon</div><div className="v">Administra participantes, comercios, cupones, canjes y el panel.</div></div>
              <div className="split-row"><div className="k">Comercio local</div><div className="v">Entrega el descuento y confirma el canje. No paga por participar.</div></div>
            </div>
          </div>
        </section>

        <section className="section section--tight">
          <div className="wrap">
            <div className="offer">
              <div>
                <span className="eyebrow" style={{ color: "#CFE8C6" }}>Oferta de piloto</span>
                <h2>90 días para probarlo en una comuna.</h2>
                <p>Un piloto acotado, con alcance definido y sin costo para los comercios. Al cierre recibes el reporte de canjes y kilos.</p>
                <ul>
                  <li>1 comuna o territorio, hasta 20 comercios</li>
                  <li>Panel de canjes y kilos verificados</li>
                  <li>Reporte final para rendición o comunicación</li>
                  <li>Propuesta económica según alcance</li>
                </ul>
              </div>
              <div className="side">
                <b>Sin resultados inventados</b>
                <span>Estamos abriendo el primer piloto. No mostramos clientes, convenios ni cifras que aún no existen: este programa se valida contigo.</span>
                <a className="btn" href="#piloto">Postular al piloto</a>
              </div>
            </div>
          </div>
        </section>

        <section className="section pilot" id="piloto">
          <div className="wrap pilot-grid">
            <div className="pilot-copy">
              <span className="eyebrow">Postulación al piloto</span>
              <h2>Cuéntanos tu comuna o tu marca.</h2>
              <p>Déjanos tus datos y te contactamos para definir alcance, comercios y fechas. Si prefieres, escríbenos directo por WhatsApp.</p>
              <div className="contact-lines">
                <span className="eyebrow" style={{ color: "var(--muted)" }}>Contacto directo</span>
                <a className="big" href={WA_TEXT} target="_blank" rel="noopener">WhatsApp +56 9 7954 0471</a>
                <a href="mailto:ecocupon.cl@gmail.com">ecocupon.cl@gmail.com</a>
                <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>Selecciona y copia el número o el correo si el enlace no abre.</span>
              </div>
            </div>
            <LeadForm />
          </div>
        </section>

        <section className="section" id="faq">
          <div className="wrap">
            <div className="head"><span className="eyebrow">Preguntas</span><h2>Lo que suelen preguntar.</h2></div>
            <div className="faq">
              <div className="qa"><h3>¿Cuánto paga el comercio?</h3><p>Nada dentro del programa. El descuento es su aporte; la plataforma la financia el municipio, la marca o la empresa.</p></div>
              <div className="qa"><h3>¿El vecino descarga una app?</h3><p>No. Usa un link o un QR y recibe el cupón en el navegador del celular.</p></div>
              <div className="qa"><h3>¿Quién verifica los kilos?</h3><p>Recicla-Ya recibe los materiales y valida tipo y kilos. EcoCupon registra los canjes asociados.</p></div>
              <div className="qa"><h3>¿Cómo evitan el fraude?</h3><p>Un canje por período por cupón, límite total configurable y confirmación del comercio. En fase 2, validación por el operador.</p></div>
              <div className="qa"><h3>¿Ya tienen clientes o resultados?</h3><p>No. Estamos abriendo el primer piloto. No presentamos convenios ni cifras que todavía no existen.</p></div>
              <div className="qa"><h3>¿Dónde opera?</h3><p>Piloto 2026 en la Región Metropolitana y regiones según demanda. Empezamos con una comuna a la vez.</p></div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div>
            <div className="brand" style={{ color: "var(--ink)", marginBottom: 10 }}><span className="dot" aria-hidden="true">♻</span> EcoCupon Recicla</div>
            <p>Incentivos al reciclaje para comunas y marcas. Una alianza entre EcoCupon y Recicla-Ya.</p>
          </div>
          <div>
            <h4>Contacto</h4>
            <ul>
              <li><a href={WA} target="_blank" rel="noopener">WhatsApp +56 9 7954 0471</a></li>
              <li><a href="mailto:ecocupon.cl@gmail.com">ecocupon.cl@gmail.com</a></li>
            </ul>
          </div>
          <div>
            <h4>Sitios</h4>
            <ul>
              <li><a href="https://www.ecocupon.cl" target="_blank" rel="noopener">ecocupon.cl</a></li>
              <li><a href="https://recicla-ya.cl" target="_blank" rel="noopener">recicla-ya.cl</a></li>
            </ul>
          </div>
        </div>
        <div className="wrap foot-bottom">
          <span>© 2026 EcoCupon Recicla · Programa piloto</span>
          <a href="/cupones">¿Solo buscas cupones? Ve al producto de cupones →</a>
        </div>
      </footer>

      <a className="fab" href={WA_TEXT} target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
        <span className="fab-label">Escríbenos</span>
        <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.4 1.6 6.3L3 29l6.9-1.6A13 13 0 0 0 16 29c7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.1 1 1.1-4-.3-.4A10.5 10.5 0 0 1 5.4 16C5.4 10.1 10.1 5.4 16 5.4S26.6 10.1 26.6 16 21.9 26.6 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.2-.6-.4z" /></svg>
      </a>
    </>
  )
}
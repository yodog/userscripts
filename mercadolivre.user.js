// ==UserScript==
// @name            Melhorador Mercado Livre
// @namespace       http://github.com/yodog/userscripts
// @author          yodog
// @description:en  Mercado Livre improvements: wide layout and product title filtering.
// @description:pt  Melhora o layout do Mercado Livre e filtra os resultados pelo titulo.
// @require         https://code.jquery.com/jquery-4.0.0.min.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require         https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource        toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @include         http*://*mercadolivre.com.br/*
// @icon            https://www.google.com/s2/favicons?domain=mercadolivre.com.br
// @version         2026.08.14.1942
// @grant           GM_addStyle
// @grant           GM_getMetadata
// @grant           GM_getResourceText
// @grant           GM_getValue
// @grant           GM_info
// @grant           GM_notification
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// @noframes
// ==/UserScript==

console.log("Iniciando script", GM_info.script.name, GM_info.script.version);

// -----------------------------------------------------------------------------
// LOAD TOAST NOTIFICATIONS LIBRARY
// -----------------------------------------------------------------------------

// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @grant       GM_addStyle
// @grant       GM_getResourceText

GM_addStyle( GM_getResourceText("toastcss") );

var toast = siiimpleToast.setOptions({
    position: 'top|right',
    duration: 4000,
});

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

/* global $, jQuery */

var $      = window.$;
var jQuery = window.jQuery;

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// PREVENT ANIMATIONS THAT SLOW DOWN THE PAGE
// -----------------------------------------------------------------------------

console.log("Disabling animations");

document.getAnimations().forEach((animation) => {
   animation.cancel();
});

GM_addStyle(`
  *, *:before, *:after {
    -moz-animation: none !important;
    -moz-transition-property: none !important;
    -moz-transition: none !important;
    -ms-animation: none !important;
    -ms-transform: none !important;
    -ms-transition-property: none !important;
    -o-animation: none !important;
    -o-transform: none !important;
    -o-transition-property: none !important;
    -o-transition: none !important;
    -webkit-animation: none !important;
    -webkit-transition: none !important;
    -webkit-transition-property: none !important;
    animation: none !important;
    animation-duration: 0s !important;
    animation-play-state: paused;
    transition: none !important;
    transition-property: none !important;
  }`
);

// -----------------------------------------------------------------------------
// OPTIONS / CONFIG MENU
// -----------------------------------------------------------------------------

var parametros = {
    layout:    { type: 'select', choices: [ 'padrao', 'lista', 'mini lista' ], default: 'padrao' },
    page_wide: { type: 'checkbox', default: true },
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Userscript Options',
        menuCommand: true,
        onSave:      function() { fnSaveChanges(); },
        params:      parametros
    });
    console.log("MonkeyConfig loaded; The settings menu will be enabled");
}
catch(err) {
    console.log(err);
    console.log("MonkeyConfig not loaded; The settings menu will be disabled");
    cfg = {
        params: parametros,
        get:    function get(name) { return GM_getValue(name, this.params[name].default) }
    }
}

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

var cssinjetado = {};   // dedicar CSS de injecao (hoisted gera bug se ficar no fim)
var _timer      = null; // debounce: roda 1x apos o DOM parar de mudar

// apply imediately at document start
fnCheckChanges();

// also wait for page load. jquery will be ready here
$(function() {

    // monitor the page for changes and reapply if necessary
    // use 'observer.disconnect()' in 'fnCheckChanges()' to stop monitoring
    var observer = new MutationObserver(fnCheckChanges);

    observer.observe(document.body, {
        attributes: false,
        characterData: false,
        childList: true,
        subtree: true
    });
});

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

// hub: agrupa as mutacoes e roda 1x apos o DOM parar de mudar
// (evita rodar a cada hover/tooltip/lazy-load ao passar o mouse)
function fnCheckChanges(changes, observer) {
    clearTimeout(_timer);
    _timer = setTimeout(aplicar_mercadolivre, 500);
}

// -----------------------------------------------------------------------------

function fnSaveChanges() {
    toast.success('Settings saved');
}

// -----------------------------------------------------------------------------

function fnInjectStyle(css, cssname = '') {
    if (cssinjetado[css]) return;
    cssinjetado[css] = true;

    try {
        console.log(`Injetando css ${cssname} na pagina`);
        GM_addStyle(css);
    }
    catch (e) {
        console.warn(`GM_addStyle ${cssname} falhou, usando fallback com jQuery`);
        $('<style>').attr('type', 'text/css').text(css).addClass('cssinjetado').appendTo('head');
    }
}

// -----------------------------------------------------------------------------
// MERCADO LIVRE
// -----------------------------------------------------------------------------

const SEL_TITULO = '.ui-search-item__title, .poly-component__title, .poly-component__headline';
const selItem = () => $('.ui-search-layout__item').length ? '.ui-search-layout__item' : '.poly-card';
const ACENTO     = { a:'aáàâãä', e:'eéèêë', i:'iíìîï', o:'oóòôõö', u:'uúùûü', c:'cç', n:'nñ' };
const PALETA     = ['#faca2eff','#8eff4dff','#effa50ff','#f1a4deff','#90CAF9','#64B5F6','#F48FB1','#CE93D8','#80CBC4','#FF8A65'];

const CSS_WIDE = `
.ui-search-main, .ui-search-main--with-topkeywords, .ui-search-results { max-width: unset !important; width: 100% !important; }
.ui-search-sidebar { min-width: unset !important; }
.ui-search-layout { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important; }
.ui-search-layout__item { height: unset !important; min-width: unset !important; }
`;

const CSS_BAR = `
#ml-filtro-bar { position:fixed; top:0; left:0; right:0; z-index:999999; display:flex; align-items:center; gap:8px; padding:6px 10px; font:13px sans-serif; background:linear-gradient(90deg, rgba(220,20,60,.85), rgba(178,34,34,.85)); border-bottom:1px solid rgba(255,255,255,.4); box-shadow:0 1px 3px rgba(0,0,0,.2); }
#ml-filtro-bar input { flex:1; min-width:120px; padding:3px 6px; border:1px solid #ccc; border-radius:3px; }
#ml-filtro-bar select, #ml-filtro-bar button { padding:3px 8px; border:1px solid #ccc; border-radius:3px; cursor:pointer; }
#ml-filtro-bar label { white-space:nowrap; }
#ml-filtro-info { font-size:11px; color:#fff; white-space:nowrap; }
`;

const HTML_BAR = `
<div id="ml-filtro-bar">
    <strong>Filtro:</strong>
    <input id="ml-filtro-input" placeholder="palavras separadas por espaco, ex: samsung tela oled">
    <label>Modo:
        <select id="ml-filtro-modo">
            <option value="AND">AND</option>
            <option value="OR" selected>OR</option>
        </select>
    </label>
    <button id="ml-filtro-aplicar">Aplicar</button>
    <button id="ml-filtro-limpar">Limpar</button>
    <span id="ml-filtro-info">encontrados: 0 · escondidos: 0 · mantidos: 0</span>
</div>
`;

let _assinatura = null;
let _cores = {};

function aplicar_mercadolivre() {
    if (typeof $ === 'undefined') return;
    if (cfg.get('page_wide')) {
        $('.ui-search-main').removeClass('ui-search-main--with-topkeywords');
        fnInjectStyle(CSS_WIDE, 'CSS_WIDE');
    }
    filtro_mercadolivre();
}

function filtro_mercadolivre() {
    if (!$('#ml-filtro-bar').length) montaBarra();

    const sig = assinatura();
    if (sig !== _assinatura) { _assinatura = sig; aplicar(); }

    function montaBarra() {
        fnInjectStyle(CSS_BAR, 'CSS_BAR');
        $('body').append(HTML_BAR).css('padding-top', '50px');

        $('#ml-filtro-input').val(session('ml_filtro'));
        $('#ml-filtro-modo').val(session('ml_filtro_modo') || 'OR');
        $('#ml-filtro-aplicar').on('click', aplicar);
        $('#ml-filtro-limpar').on('click', limpar);
        $('#ml-filtro-input').on('keyup', e => e.keyCode === 13 && aplicar());
        $('#ml-filtro-modo').on('change', () => $('#ml-filtro-input').val() && aplicar());
    }

    function itens() {
        return $(selItem()).filter((i, el) => tituloEl(el).length);
    }

    function titulo(el) {
        return norm(tituloEl(el).text());
    }

    function aplicar() {
        const raw = $('#ml-filtro-input').val() || '';
        const modo = $('#ml-filtro-modo').val();
        session('ml_filtro', raw);
        session('ml_filtro_modo', modo);
        const and = modo === 'AND';
        const termos = raw.split(/\s+/).map(norm).filter(Boolean);

        itens().each((i, el) => {
            const t = titulo(el);
            const ok = !termos.length
                || (and ? termos.every(x => t.includes(x)) : termos.some(x => t.includes(x)));
            if (termos.length) { $(el).toggle(ok); ok ? destacar(el, termos) : limparDestaque(el); }
            else limparDestaque(el);
            $(el).attr('data-filtrado', ok);
        });

        info();
    }

    function limpar() {
        $('#ml-filtro-input').val('');
        $('#ml-filtro-modo').val('OR');
        session('ml_filtro', null);
        session('ml_filtro_modo', null);
        itens().each((i, el) => { $(el).show().attr('data-filtrado', 'true'); limparDestaque(el); });
        info();
    }

    function info() {
        const all = itens();
        $('#ml-filtro-info').text(`encontrados: ${all.length} · escondidos: ${all.filter('[data-filtrado="false"]').length} · mantidos: ${all.filter('[data-filtrado="true"]').length}`);
    }
}


function assinatura() {
    const l = $(selItem());
    const a = l.find('a');
    return `${l.length}|${a.first().attr('href') || ''}|${a.last().attr('href') || ''}`;
}

function session(k, v) {
    try {
        if (v === undefined) return sessionStorage.getItem(k) || '';
        if (v === null) return sessionStorage.removeItem(k);
        return sessionStorage.setItem(k, v);
    } catch(e) {}
}

function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, '');
}

const tituloEl = el => $(el).find(SEL_TITULO).first();
const corDaPalavra = k => _cores[k] || (_cores[k] = PALETA[Object.keys(_cores).length % PALETA.length]);
const reTermo = t => t.split('').map(ch => ACENTO[ch] ? `[${ACENTO[ch]}]` : ch).join('');

function destacar(el, termos) {
    const tit = tituloEl(el);
    const txt = tit.text();
    if (!txt) return;
    const re = new RegExp('(' + termos.slice().sort((a, b) => b.length - a.length).map(reTermo).join('|') + ')', 'gi');
    tit.html(txt.replace(re, m => `<mark style="background:${corDaPalavra(norm(m))}">${m}</mark>`));
}

function limparDestaque(el) {
    const tit = tituloEl(el);
    tit.html(tit.text());
}

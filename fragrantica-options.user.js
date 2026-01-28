// ==UserScript==
// @name        Fragrantica new options
// @namespace   http://github.com/yodog/userscripts
// @author      yodog
// @description Fragrantica new options: use wide screen, bigger perfume pictures on shelf; bring shelf to top of page, add fragrantica.com reviews/pros/cons to fragrantica.com.br
// @require     http://code.jquery.com/jquery-3.7.1.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/datejs/1.0/date.min.js
// @match       *://*.fragrantica.com/*
// @match       *://*.fragrantica.com.br/*
// @connect     *
// @icon        https://www.google.com/s2/favicons?domain=fragrantica.com
// @version     2026.1.28.1501
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @noframes
// ==/UserScript==

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// PREVENT JQUERY CONFLICT
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

/* global $, jQuery */

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// MAIN
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

// -----------------------------------------------------------------------------
// trocar as imagens padrao pelas de alta densidade
// remover lazy loading
// -----------------------------------------------------------------------------

if ((window.location.href).includes('fragrantica.com.br/membros')) {
    const observer = new MutationObserver(mutations => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        node.querySelectorAll('img[loading="lazy"]').forEach(img => {
                            img.removeAttribute('loading');
                        });
                        node.querySelectorAll('picture > source').forEach(source => {
                            const oldSrcset = source.getAttribute('srcset');
                            const [doisx, umx] = oldSrcset.split(', ');
                            const url_2x = doisx.split(' ')[0];
                            const url_s = url_2x.replace(/-[a-z]+(?=\.\d+\.)/, '-s');
                            source.setAttribute('srcset', url_s);
                        });
                    }
                });
            }
        });
    });
    observer.observe((document), {childList: true, subtree: true});
}

// -----------------------------------------------------------------------------
// adicionar socialcard como primeira imagem do perfume
// -----------------------------------------------------------------------------

if ((window.location.href).includes('/perfume')) {
    const socialcardlink = $('div#fragram-photos a[href*=perfume-social-cards]').attr('href');
    const original = $('picture.max-w-full img.max-w-full[itemprop=image]').parent();
    const clone = original.clone(true).insertAfter(original);
    original.find('source').remove();
    original.find('img[itemprop=image]').attr('src', socialcardlink).removeAttr('srcset height width');
}

// -----------------------------------------------------------------------------
// injetar meu css na pagina
// -----------------------------------------------------------------------------

const css = `
    div.grid-container { max-width: unset !important ; }
    div.callout > div.grid-x { max-height: 26em !important ; }

    /* meu perfil - versao antiga */
    img.perfume-on-shelf { height: unset !important ; }

    /* meu perfil - versao nova */
    main.container { max-width: unset; }
    div.shelf-element { width: 12% ; }
    img.h-14 {
      height: unset;
      width: -moz-available;
      width: -webkit-fill-available;
    }

    #meuelemento { border: 1px dotted red; }

    .fr-review-injetado {
      border: 1px dashed #888;
      margin: 1em 0;
      padding: 0.5em;
      background: #fafafa;
    }
`;

fnInjectStyle(css);

// -----------------------------------------------------------------------------
// registrar eventos
// -----------------------------------------------------------------------------

if ((window.location.href).includes('fragrantica.com.br/perfume')) {
    onElementAppear('reviews-wrapper, #all-reviews', el => startReviewsParser(el).catch((e) => {console.log('erro em onElementAppear', e)}));
    onElementAppear('#showDiagram:not(:checked)', el => el.click());
    onElementAppear('#idIframeMMM', el => el.remove());
    onElementAppear('button.group', el => { if (el.textContent.trim().includes('Mostrar votos')) {el.click();}});
    onElementAppear('div.carousel, div.perfume-carousel-scroll', el => {$('#newreview').prepend(el.closest('div.mb-6'));});
    onElementAppear('sup', el => { if (el.textContent.trim().includes('Sponsored')) {el.closest('div.mb-4').remove();}});
}

// -----------------------------------------------------------------------------
// essa funcao deve ser chamada como callback de algum evento (ex: onElementAppear) para nao bloquear o javascript
// -----------------------------------------------------------------------------

async function startReviewsParser(ancorar_em) {
    if (ancorar_em.dataset.reviewsHandled) {
        console.log('ancorar_em ja existe', ancorar_em);
        return;
    }
    ancorar_em.dataset.reviewsHandled = '1';

    let meuelemento = $('<div id="meuelemento"></div>').prependTo(ancorar_em);

    const paginaEN = await obterPaginaEmInglesCompleta().catch((e) => {console.log('erro em obterPaginaEmInglesCompleta', e)});
    if (! paginaEN) {
        console.log('startReviewsParser: paginaEN retornou vazio');
        return;
    }

    const reviewsEn = parseReviews(paginaEN);
    const prosContrasElemento = parseProsCons(paginaEN);

    if (reviewsEn) {
        console.log('reviewsEn encontrado -> chamando promises...');
        await injetarReviews(reviewsEn, meuelemento).catch((e) => {console.log('erro em injetarReviews', e)});
    }
    if (prosContrasElemento) {
        console.log('prosContrasElemento encontrado -> chamando promises...');
        await injetarProsCons(prosContrasElemento, meuelemento).catch((e) => {console.log('erro em injetarProsCons', e)});
    }
}

// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
// AUX FUNCTIONS
// * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

// Funcao auxiliar que espera um elemento aparecer no DOM
// IMPORTANTE: 'await' bloqueia o javascript ate que o elemento seja encontrado. nao usar com elementos que podem nao existir
//
// USAR ASSIM (bloqueia enquanto espera):
//   const iframe = await waitForElement('#idIframeMMM', 5000).catch(() => null);
//   if (iframe) { iframe.remove(); }
//
// USAR ASSIM (promise em background -> fire-and-forget):
//   waitForElement('#idIframeMMM', 30000)
//     .then(el => { el.remove(); })
//     .catch(() => { console.log('não apareceu em 30 segundos. desistindo.'); });

function waitForElement(selector, timeout = 5000) {

    return new Promise((resolve, reject) => {
        if (document.querySelector(selector)) {
            console.log('waitForElement', 'elemento ja existe:', selector);
            return resolve(document.querySelector(selector));
        }

        console.log('waitForElement', 'monitorando:', selector);
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                console.log('waitForElement', 'elemento encontrado:', selector);
                observer.disconnect();
                clearTimeout(timer);
                resolve(document.querySelector(selector));
            }
        });

        const timer = setTimeout(() => {
            console.log('waitForElement', 'timeout atingido para:', selector);
            observer.disconnect();
            reject();
        }, timeout);

        observer.observe((document.body || document.documentElement), {childList: true, subtree: true});
    });
}

// -----------------------------------------------------------------------------

// Funcao (nao bloqueante) auxiliar que espera um elemento aparecer no DOM
// IMPORTANTE: nao abusar. monitora constantemente, sem observer.disconnect();
//
// USAR ASSIM:
//   onElementAppear('#showDiagram:not(:checked)', el => { el.click(); });

function onElementAppear(selector, callback) {
    console.log('onElementAppear: monitorando', selector);
    const observer = new MutationObserver(() => {
        document.querySelectorAll(selector).forEach(el => {
            if (el.dataset._observed) {
                console.log('onElementAppear: elemento ja existe. ignorando', selector, el);
                return;
            }
            el.dataset._observed = '1';
            console.log('onElementAppear: elemento encontrado', selector, el);
            callback(el);
        });
    });

    observer.observe((document.body || document.documentElement), {childList: true, subtree: true});
}

// -----------------------------------------------------------------------------

function fnInjectStyle(css) {
    try {
        console.log('Injetando css na pagina');
        GM_addStyle(css);
    }
    catch (e) {
        console.warn('GM_addStyle falhou, usando fallback com jQuery');
        $('<style>').attr('type', 'text/css').text(css).addClass('cssinjetado').appendTo('head');
    }
}

// -----------------------------------------------------------------------------

/**
 * Uma função auxiliar que envolve GM_xmlhttpRequest em uma Promise para uso com async/await.
 * @param {object} options - As opções para GM_xmlhttpRequest.
 * @returns {Promise<object>} Uma promessa que resolve com a resposta em caso de sucesso ou rejeita em caso de erro.
 */

function fetchAsyncGM(options) {
    return new Promise((resolve, reject) => {
        options.onload = response => (response.status >= 200 && response.status < 400) ? resolve(response) : reject(response);
        options.onerror = error => reject(error);
        GM_xmlhttpRequest(options);
    });
}

// -----------------------------------------------------------------------------

async function obterPaginaEmInglesCompleta() {
    console.log('obterPaginaEmInglesCompleta', 'Iniciando');
    if (!location.hostname.includes('fragrantica.com.br')) return null;

    const urlEn = location.href.replace('.com.br', '.com') + '#all-reviews';

    let paginaEN = null;
    try {
        const response = await fetchAsyncGM({method: 'GET', url: urlEn});
        console.log('obterPaginaEmInglesCompleta', 'response', response);

        if (response.status >= 200 && response.status < 400) {
            const parser = new DOMParser();
            paginaEN = parser.parseFromString(response.responseText, 'text/html');
            console.log('obterPaginaEmInglesCompleta', 'Página em inglês obtida e armazenada em paginaEN (completa usando fetchAsyncGM).');
        }
        else {
            console.error('obterPaginaEmInglesCompleta', 'Falha ao buscar a página em inglês (completa usando fetchAsyncGM). Status:', response.status);
        }
    }
    catch (error) {
        console.error('obterPaginaEmInglesCompleta', 'Erro ao buscar a página em inglês (completa usando fetchAsyncGM):', error);
    }
    return paginaEN;
}

// -----------------------------------------------------------------------------

function parseProsCons(html) {
    console.log('parseProsCons', 'Iniciando');
    const doc = (typeof html == 'string') ? new DOMParser().parseFromString(html, 'text/html') : html;
    const pc = doc.querySelector('pros-cons');
    const fa = pc ? pc.querySelector(':has(div.fa-lg)') : null;

    console.debug('parseProsCons', 'entrada', doc);
    console.debug('parseProsCons', 'meio', pc);
    console.debug('parseProsCons', 'saida', fa);

    if (fa) {
        console.log('parseProsCons', 'elemento <pros-cons> encontrado', fa);
    }
    else {
        console.log('parseProsCons', 'elemento <pros-cons> nao encontrado', fa);
    }

    return fa;
}

// -----------------------------------------------------------------------------

async function injetarProsCons(html, container) {
    console.debug('injetarProsCons', 'Iniciando');
    console.debug('injetarProsCons', 'entrada', html);
    console.debug('injetarProsCons', 'container', container);

    if (html && container) {
        console.log('injetarProsCons', 'container.prepend(html)');
        container.dataset.prosConsMerged = 'true';
        $(container).prepend(html);
    }
    else {
        console.log('injetarProsCons', 'Box de Pros/Contras encontrado vazio ou não encontrado após delay.');
    }
}

// -----------------------------------------------------------------------------

function extractReviewDate(div, markLocal = false) {
    const span = div.querySelector('span.vote-button-legend[itemprop="datePublished"]');
    const rawDate = span ? (span.textContent.trim() || span.getAttribute('content')) : "";
    const timestamp = Date.parse(rawDate);
    const date = isNaN(timestamp) ? new Date(0) : new Date(timestamp);
    const formatted = date.toString("yyyy-MM-dd HH:mm:ss"); // Usando date.js

    if (span && date) {
        span.textContent = formatted;
        span.setAttribute('content', formatted);
    }

    return markLocal ? {div, date, formatted, isLocal: true} : {div, date, formatted};
}

// -----------------------------------------------------------------------------

function parseReviews(html) {
    try {
        console.log('parseReviews', 'Iniciando');

        const doc = (typeof html === 'string') ? new DOMParser().parseFromString(html, 'text/html') : html;
        const reviewsContainerEn = doc.getElementById('all-reviews');

        if (!reviewsContainerEn) {
            console.log('parseReviews', 'Contêiner #all-reviews não encontrado na página EN para reviews.');
            return [];
        }

        let reviewsEn = $(reviewsContainerEn).find('div.fragrance-review-box[itemprop="review"]:lt(5)').toArray();

        // Elimina duplicatas via outerHTML
        const uniqueReviewsMap = new Map();
        reviewsEn.forEach(div => uniqueReviewsMap.set(div.outerHTML, div));
        reviewsEn = Array.from(uniqueReviewsMap.values());

        // Usa função utilitária para extrair review e data
        return reviewsEn.map(div => extractReviewDate(div));
    }
    catch (error) {
        console.error('parseReviews', 'Erro ao analisar as reviews:', error);
        return [];
    }
}

// -----------------------------------------------------------------------------

async function injetarReviews(parsedReviews, container) {
    console.log('injetarReviews', 'Iniciando');

    // normalizar e converter jquery para DOM puro
    container = container instanceof jQuery ? container[0] : container;

    // Reviews locais do DOM, usando utilitário
    const parsedLocal = $('#all-reviews div.fragrance-review-box[itemprop="review"]:lt(5)').toArray().map(div => extractReviewDate(div, true));

    // Mescla reviews importadas (parsedReviews) e locais (parsedLocal)
    const allSortedReviews = parsedReviews.concat(parsedLocal).sort((a, b) => b.date - a.date);

    // Prepara os elementos para injeção
    const elementosParaInjetar = allSortedReviews.map(({div, isLocal}) => {
        if (!isLocal) {
            div.classList.add('fr-review-injetado');
            div.style.borderLeft = '3px solid #007bff';
            div.style.backgroundColor = '#f7f7f9';
        }
        return div;
    });

    if (container && elementosParaInjetar) {
        container.dataset.reviewsMerged = 'true';

        if (Array.isArray(elementosParaInjetar)) {
            elementosParaInjetar.forEach(elemento => container.appendChild(elemento));
        }
        else {
            container.appendChild(elementosParaInjetar);
        }
        console.log('injetarReviews', `Mesclados ${elementosParaInjetar.length} reviews.`);
    }
    else {
        console.log('injetarReviews', 'Nao injetamos reviews');
    }
}

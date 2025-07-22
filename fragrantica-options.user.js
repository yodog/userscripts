// ==UserScript==
// @name        Fragrantica new options
// @namespace   http://github.com/yodog/userscripts
// @author      yodog
// @description Fragrantica new options: use wide screen, bigger perfume pictures on shelf; bring shelf to top of page, add fragrantica.com reviews/pros/cons to fragrantica.com.br
// @require     http://code.jquery.com/jquery.min.js
// @require     http://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     http://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss   http://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @match       *://*.fragrantica.com/*
// @match       *://*.fragrantica.com.br/*
// @connect     *
// @icon        https://images.icon-icons.com/3251/PNG/512/panel_left_expand_regular_icon_203421.png
// @version     2025.07.22.1650
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

GM_registerMenuCommand('🔄 Forçar Reload Estilos', () => {document.location.reload();});

// -----------------------------------------------------------------------------
// LOAD TOAST NOTIFICATIONS LIBRARY
// -----------------------------------------------------------------------------

/* global siiimpleToast */

// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @grant       GM_addStyle
// @grant       GM_getResourceText

fnInjectStyle(GM_getResourceText("toastcss"));

var toast = siiimpleToast.setOptions({
    position: 'top|right',
    duration: 3000,
});

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

/* global $, jQuery */

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

if ((window.location.href).includes('fragrantica.com.br')) {
    console.log('fragrantica.com');

    const css = `
div.grid-container { max-width: unset !important ; }
div.callout > div.grid-x { max-height: 26em !important ; }
div.grid-x:has(img.perfume-on-shelf) { flex-flow: wrap-reverse !important ; }
img.perfume-on-shelf { height: unset !important ; }

.fr-review-injetado {
  border: 1px dashed #888;
  margin: 1em 0;
  padding: 0.5em;
  background: #fafafa;
}
`;

    fnInjectStyle(css);

    //const elementoProsEContras = $('div.grid-x.grid-margin-x.grid-margin-y:has(:contains(Pros))');
    //console.log('elementoProsEContras', elementoProsEContras);
    //injetarElementoDaPaginaInglesa('#pros-cons-section', '.perfume-main-content', 'append');

    if ((window.location.href).includes('perfume')) {
        const socialcardlink = $('div#toptop a[href*=perfume-social-cards]').attr('href');
        const container = $('div.grid-x.grid-margin-x.grid-margin-y > div.cell.small-6:has(img[itemprop=image])');
        const socialcard = container.clone().find('img[itemprop=image]').attr('src', socialcardlink).removeAttr('srcset height width');
        socialcard.prependTo(container);

        injetarReviewsDaPaginaInglesa();
        injetarProsContrasDaPaginaInglesa();

        $(document, 'body').on('click load pageshow ready scroll', () => {
            $('iframe#idIframeMMM').remove();
            $('input#showDiagram:not(:checked)').click();
        });
    }
}

// -----------------------------------------------------------------------------
// AUX FUNCTIONS
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

function fnSaveChanges() {

    $('body').on("click", "#reloadnow", function () {
        $(this).fadeOut("fast", function () {document.location.reload(false);});
    });

    var msg_success = 'Settings saved';
    toast.success(msg_success);

    var msg_reload = '<span id="reloadnow"> Some changes will be applied after you reload the page. <br> Click here to reload now </span>';
    if (shouldreload) toast.message(msg_reload, {delay: 3000, duration: 7000});
}

// -----------------------------------------------------------------------------

function sortUsingNestedText(parentSelector, childSelector, keySelector, keyIsDate = false) {

    console.log('---> ordenando o elemento', parentSelector);

    parentSelector = $(parentSelector);

    var items = parentSelector.children(childSelector).sort(function (a, b) {
        var vA = $(keySelector, a).text().trim();
        var vB = $(keySelector, b).text().trim();

        //console.log('texto', vA, vB);

        // converte dd/mm/yyyy para yyyy/mm/dd
        if (keyIsDate) {
            vA = new Date(vA.split('/').reverse().join('/'));
            if (isNaN(vA.getTime())) vA = new Date('2029/01/01');

            vB = new Date(vB.split('/').reverse().join('/'));
            if (isNaN(vB.getTime())) vB = new Date('2029/01/01');
        }

        //console.log('data', vA, vB);
        return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
    });

    //console.log('items', items);
    parentSelector.append(items);
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

/**
 * (Versão async/await)
 * Busca um elemento de uma página correspondente no fragrantica.com e o injeta na página atual do fragrantica.com.br.
 *
 * @param {string} selectorDoElementoFonte - O seletor CSS do elemento a ser copiado da página em inglês. Ex: '#notas_de_topo'.
 * @param {string} selectorDoElementoAlvo - O seletor CSS do elemento na página em português onde o novo conteúdo será injetado. Ex: '#bloco_principal'.
 * @param {string} [posicaoDeInjecao='append'] - Como injetar o elemento. Opções: 'append', 'prepend', 'before', 'after'.
 */

async function injetarElementoDaPaginaInglesa(selectorDoElementoFonte, selectorDoElementoAlvo, posicaoDeInjecao = 'append') {
    // 1. Só executa o código se estivermos no site em português
    if (!window.location.hostname.includes('fragrantica.com.br')) {
        return;
    }

    const elementoAlvo = $(selectorDoElementoAlvo);
    if (elementoAlvo.length === 0) {
        console.warn(`[Userscript] Elemento alvo "${selectorDoElementoAlvo}" não encontrado na página. A injeção foi cancelada.`);
        return;
    }

    const urlAtual = window.location.href;
    const urlFonte = urlAtual.replace('fragrantica.com.br', 'fragrantica.com');

    console.log(`[Userscript] Buscando elemento "${selectorDoElementoFonte}" de: ${urlFonte}`);

    try {
        // 2. Usa 'await' para esperar a resposta da requisição de forma não-bloqueante
        const response = await fetchAsyncGM({
            method: 'GET',
            url: urlFonte
        });

        // O código abaixo só executa DEPOIS que a requisição for bem-sucedida
        const parser = new DOMParser();
        const docFonte = parser.parseFromString(response.responseText, 'text/html');
        const elementoParaInjetar = $(docFonte).find(selectorDoElementoFonte);

        if (elementoParaInjetar.length > 0) {
            console.log(`[Userscript] Elemento "${selectorDoElementoFonte}" encontrado. Injetando em "${selectorDoElementoAlvo}".`);

            // Corrige URLs relativas de links e imagens
            elementoParaInjetar.find('a[href^="/"]').each(function () {
                $(this).attr('href', 'https://www.fragrantica.com' + $(this).attr('href'));
            });
            elementoParaInjetar.find('img[src^="/"]').each(function () {
                $(this).attr('src', 'https://www.fragrantica.com' + $(this).attr('src'));
            });

            // Injeta o elemento na página
            switch (posicaoDeInjecao) {
                case 'prepend': elementoAlvo.prepend(elementoParaInjetar); break;
                case 'before': elementoAlvo.before(elementoParaInjetar); break;
                case 'after': elementoAlvo.after(elementoParaInjetar); break;
                default: elementoAlvo.append(elementoParaInjetar); break;
            }
        } else {
            console.warn(`[Userscript] Elemento "${selectorDoElementoFonte}" não foi encontrado na página de origem.`);
        }

    } catch (error) {
        // 3. O bloco 'catch' lida com erros de rede ou respostas com status de erro (ex: 404, 500)
        console.error(`[Userscript] Falha ao buscar elemento de ${urlFonte}.`, error);
    }
}

// -----------------------------------------------------------------------------

async function fetchWithRetries(url, options = {}, retries = 5, baseDelay = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const resp = await fetchAsyncGM({ method: options.method || 'GET', url, ...options });
    if (resp.status !== 429) return resp;

    const retryMatch = resp.responseHeaders.match(/Retry-After:\s*(\S+)/i);
    let waitMs = baseDelay * 2 ** attempt;

    if (retryMatch) {
      const ra = retryMatch[1];
      const seconds = isNaN(ra) ? (new Date(ra) - new Date()) / 1000 : parseInt(ra, 10);
      if (!isNaN(seconds) && seconds > 0) waitMs = seconds * 1000;
    }

    console.warn(`[MakeWide] 429 received — waiting ${Math.round(waitMs)}ms before retry #${attempt+1}`);
    await new Promise(r => setTimeout(r, waitMs));
  }
  throw new Error(`Failed after ${retries + 1} attempts (429 Too Many Requests)`);
}

async function buscarConteudoPaginaInglesa(urlEn) {
    try {
        const resp = await fetchWithRetries(urlEn);
        return resp.responseText;
    } catch (e) {
        console.error('[MakeWide] Falha ao buscar página EN:', e);
        return null;
    }
}

function parseReviews(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const reviewsContainerEn = doc.getElementById('all-reviews');
    if (!reviewsContainerEn) {
        console.log('[MakeWide] Contêiner #all-reviews não encontrado na página EN para reviews.');
        return [];
    }

    let reviewsEn = Array.from(reviewsContainerEn.querySelectorAll('div.fragrance-review-box[itemprop="review"]'));
    const uniqueReviewsMap = new Map();
    reviewsEn.forEach(div => {
        uniqueReviewsMap.set(div.outerHTML, div);
    });
    reviewsEn = Array.from(uniqueReviewsMap.values());

    const parseDate = div => {
        const span = div.querySelector('span.vote-button-legend[itemprop="datePublished"]');
        if (!span) return new Date(0);
        const cd = span.getAttribute('content') || '';
        return new Date(cd || span.textContent.trim());
    };

    return reviewsEn.map(div => ({ div, date: parseDate(div) }));
}


function parseProsContras(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    console.log("Objeto recebido por parseProsContras:", doc);
    return doc.querySelector('pros-cons');
}



function injetarConteudo(containerSelector, elementosParaInjetar, injectionMethod = 'appendChild') {
    const container = document.querySelector(containerSelector);
    if (!container) {
        return console.error(`[MakeWide] Contêiner "${containerSelector}" não encontrado.`);
    }

    if (Array.isArray(elementosParaInjetar)) {
        elementosParaInjetar.forEach(elemento => {
            switch (injectionMethod) {
                case 'prepend':
                    container.prepend(elemento);
                    break;
                case 'append':
                    container.append(elemento);
                    break;
                default:
                    container.appendChild(elemento);
                    break;
            }
        });
        console.log(`[MakeWide] Injetados ${elementosParaInjetar.length} elementos em ${containerSelector} usando ${injectionMethod}.`);
    } else if (elementosParaInjetar) {
        switch (injectionMethod) {
            case 'prepend':
                container.prepend(elementosParaInjetar);
                break;
            case 'append':
                container.append(elementosParaInjetar);
                break;
            default:
                container.appendChild(elementosParaInjetar);
                break;
        }
        console.log(`[MakeWide] Conteúdo injetado em ${containerSelector} usando ${injectionMethod}.`);
    }
}



async function injetarReviewsDaPaginaInglesa() {
    if (!location.hostname.includes('fragrantica.com.br')) return;

    const urlEn = location.href.replace('.com.br', '.com');
    const htmlEn = await buscarConteudoPaginaInglesa(urlEn);
    if (!htmlEn) return;

    const reviewsEn = parseReviews(htmlEn);
    const localEls = Array.from(document.querySelectorAll('#all-reviews div.fragrance-review-box[itemprop="review"]'));
    const parsedLocal = localEls.map(div => {
        const span = div.querySelector('span.vote-button-legend[itemprop="datePublished"]');
        const date = span ? new Date(span.getAttribute('content') || span.textContent.trim()) : new Date(0);
        return { div, date, isLocal: true };
    });

    const allSortedReviews = reviewsEn.concat(parsedLocal).sort((a, b) => b.date - a.date);

    const container = document.querySelector('#all-reviews');
    if (container) {
        container.dataset.reviewsMerged = 'true';
        const elementosParaInjetar = allSortedReviews.map(({ div, isLocal }) => {
            if (!isLocal) {
                div.classList.add('fr-review-injetado');
                div.style.borderLeft = '3px solid #007bff';
                div.style.backgroundColor = '#f7f7f9';
            }
            return div;
        });
        injetarConteudo('#all-reviews', elementosParaInjetar, 'appendChild');
        console.log(`[MakeWide] Mesclados ${elementosParaInjetar.length} reviews.`);
    }
}


async function injetarProsContrasDaPaginaInglesa() {
    if (!location.hostname.includes('fragrantica.com.br')) return;

    const urlEn = location.href.replace('.com.br', '.com');
    const htmlEn = await buscarConteudoPaginaInglesa(urlEn);
    if (!htmlEn) return;

    await new Promise(resolve => setTimeout(resolve, 1000));

    const prosContrasElemento = parseProsContras(htmlEn);
    console.log("Objeto recebido por injetarProsContrasDaPaginaInglesa() após delay:", prosContrasElemento);

    if (prosContrasElemento) {
        injetarConteudo('#all-reviews', prosContrasElemento, 'prepend');
    } else {
        console.log('[MakeWide] Box de Pros/Contras encontrado vazio ou não encontrado após delay.');
    }
}


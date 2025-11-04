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
// @version     2025.11.4.1300
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

/* global $, jQuery */

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// ERROR HANDLING - CAPTURING ERRORS FROM THE PAGE THAT COULD BREAK THE SCRIPT
// -----------------------------------------------------------------------------

const isUserscriptError = (sourceOrStack) => {
    return (sourceOrStack && (sourceOrStack.includes('blob:') || sourceOrStack.includes('userscript.html')));
};

// A. window.onerror (para erros síncronos)
const originalOnError = unsafeWindow.onerror;
unsafeWindow.onerror = function (message, source, lineno, colno, error) {
    // Se o erro tem um 'source' e não é este script, tentar ignorar.
    // Erros sem 'source' (ex: erro de sintaxe) ou que são claramente do userscript devem ser passados para o handler original.
    if (source && !isUserscriptError(source)) {
        console.warn('Userscript: Erro síncrono da página ignorado:', message, source);
        return true; // Suprime o erro
    }

    // Se for um erro do userscript ou sem source, passe para o handler original
    if (originalOnError) {
        return originalOnError.apply(this, arguments);
    }
    return false; // Deixa o erro ser Uncaught se não houver handler original
};

// B. addEventListener para 'error' (para erros síncronos, DOM errors)
unsafeWindow.addEventListener('error', function (event) {
    const source = event.filename || '';
    // console.log('Erro via addEventListener. Source:', source, 'Message:', event.message || event.error);

    // Ignorar se o erro vem de um arquivo .js da página e não é seu userscript ou se é um erro genérico sem source específico do seu userscript.
    if (source && !isUserscriptError(source)) {
        console.warn('Userscript: Erro da página via addEventListener ignorado:', event.message || event.error, source);
        event.preventDefault(); // Impede o comportamento padrão
        event.stopImmediatePropagation(); // Impede que outros listeners recebam o evento
    }
    // Se for um erro do userscript ou sem source, não previne.
}, true); // Use `true` para fase de captura

// C. Captura de Erros em Promises Não Tratadas (para "Uncaught (in promise)")
unsafeWindow.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason || {};
    // Para rejections, é mais difícil determinar a origem do arquivo, então precisamos inspecionar o stack trace, se disponível.
    const stack = reason.stack || '';

    // Se a stack trace existe e não parece vir do seu script, ignore. Ou seja, se o erro não foi gerado dentro do seu userscript.
    if (stack && !isUserscriptError(stack)) {
        console.warn('Userscript: Rejeição de promise não tratada da página ignorada:', reason);
        event.preventDefault(); // Impede o comportamento padrão de "Uncaught"
        event.stopImmediatePropagation();
    }
    // Se a stack for do seu userscript ou for indeterminada, não previna.
});

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------

// ---
// funcoes que podem podem ser executadas no document start
// ---

// criar meu elemento que sera o container para injetar os reviews e pros/cons
// esperar ate que qualquer um dos elementos ancora exista
//if ((window.location.href).includes('fragrantica.com.br/perfume')) {
    //const ancorar_em = await waitForElement('reviews-wrapper, #all-reviews');
    //const ancorar_em = document.querySelector('reviews-wrapper, #all-reviews');
    //$('<div id="meuelemento"></div>').prependTo(ancorar_em);
//}

// adicionar socialcard como primeira imagem do perfume
const socialcardlink = $('div#toptop a[href*=perfume-social-cards]').attr('href');
const container = $('div.grid-x.grid-margin-x.grid-margin-y > div.cell.small-6:has(img[itemprop=image])');
const socialcard = container.clone().find('img[itemprop=image]').attr('src', socialcardlink).removeAttr('srcset height width');
socialcard.prependTo(container);

// injetar meu css na pagina
const css = `
    div.grid-container { max-width: unset !important ; }
    div.callout > div.grid-x { max-height: 26em !important ; }

    /* meu perfil - versao antiga */
    img.perfume-on-shelf { height: unset !important ; }

    /* meu perfil - versao nova */
    main.container { max-width: unset; }
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

// ---
// funcoes assincronas
// ---

(async () => {
    if ((window.location.href).includes('fragrantica.com.br/perfume')) {

        const ancorar_em = await waitForElement('reviews-wrapper, #all-reviews');
        let meuelemento = $('<div id="meuelemento"></div>').prependTo(ancorar_em);

        const paginaEN = await obterPaginaEmInglesCompleta();
        const reviewsEn = parseReviews(paginaEN);
        const prosContrasElemento = parseProsCons(paginaEN);

        meuelemento = await waitForElement('#meuelemento');
        if (meuelemento) {
            console.log('meuelemento encontrado -> injetando...', meuelemento);
            if (reviewsEn) {
                console.log('reviewsEn encontrado -> chamando promises...');
                await injetarReviews(reviewsEn, meuelemento);
            }
            if (prosContrasElemento) {
                console.log('prosContrasElemento encontrado -> chamando promises...');
                await injetarProsCons(prosContrasElemento, meuelemento);
            }
        }
    }

    const showDiagram = await waitForElement('#showDiagram:not(:checked)');
    if (showDiagram) {
        showDiagram.click();
        console.log('showDiagram encontrado -> clicando...');
    }

    const iframe = await waitForElement('#idIframeMMM');
    if (iframe) {
        iframe.remove();
        console.log('idIframeMMM encontrado -> removendo...');
    }
})();

// ---
// funcoes que dependem do DOM
// ---

$().ready(() => {
    console.log('DOM e jQuery prontos');
    window.scrollTo(0, document.documentElement.scrollHeight);
    window.scrollTo(0, 0);
});

// ---
// funcoes que dependem de outros eventos
// ---

$([window, document, document.documentElement]).on('load pageshow ready', (e) => {
    console.log(`[${performance.now().toFixed(2)}ms] evento: ${e.type}`, e);
    window.scrollTo(0, document.documentElement.scrollHeight);
    window.scrollTo(0, 0);
});

// -----------------------------------------------------------------------------
// AUX FUNCTIONS
// -----------------------------------------------------------------------------

// Função auxiliar que espera um elemento aparecer no DOM
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            console.log('waitForElement', 'elemento ja existe:', selector);
            return resolve(document.querySelector(selector));
        }

        console.log('waitForElement', 'monitorando:', selector);
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                console.log('waitForElement', 'elemento encontrado:', selector);
                observer.disconnect();
            }
        });

        observer.observe((document), {childList: true, subtree: true});
    });
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

    let paginaEN = null
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

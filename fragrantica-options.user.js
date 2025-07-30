// ==UserScript==
// @name        Fragrantica new options
// @namespace   http://github.com/yodog/userscripts
// @author      yodog
// @description Fragrantica new options: use wide screen, bigger perfume pictures on shelf; bring shelf to top of page, add fragrantica.com reviews/pros/cons to fragrantica.com.br
// @require     http://code.jquery.com/jquery-3.7.1.min.js
// @match       *://*.fragrantica.com/*
// @match       *://*.fragrantica.com.br/*
// @connect     *
// @icon        https://images.icon-icons.com/3251/PNG/512/panel_left_expand_regular_icon_203421.png
// @version     2025.07.30.0040
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
$('<div id="meuelemento"></div>').prependTo('reviews-wrapper');

// adicionar socialcard como primeira imagem do perfume
const socialcardlink = $('div#toptop a[href*=perfume-social-cards]').attr('href');
const container = $('div.grid-x.grid-margin-x.grid-margin-y > div.cell.small-6:has(img[itemprop=image])');
const socialcard = container.clone().find('img[itemprop=image]').attr('src', socialcardlink).removeAttr('srcset height width');
socialcard.prependTo(container);

// injetar meu css na pagina
const css = `
    div.grid-container { max-width: unset !important ; }
    div.callout > div.grid-x { max-height: 26em !important ; }
    /* div.grid-x:has(img.perfume-on-shelf) { flex-flow: wrap-reverse !important ; } */
    img.perfume-on-shelf { height: unset !important ; }

    #meuelemento {
    border: 1px dotted red;
    }

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
        const paginaEN = await obterPaginaEmInglesCompleta();
        const reviewsEn = parseReviews(paginaEN);
        const prosContrasElemento = parseProsCons(paginaEN);

        const meuelemento = await waitForElement('#meuelemento');
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

$([window, document, 'body']).on('load pageshow ready', (e) => {
    //console.log(`[${performance.now().toFixed(2)}ms] evento: ${e.type}`, e);
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

        observer.observe(document.body, {childList: true, subtree: true});
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

    try {
        const response = await fetchAsyncGM({method: 'GET', url: urlEn});
        console.log('obterPaginaEmInglesCompleta', 'response', response);

        if (response.status >= 200 && response.status < 400) {
            const parser = new DOMParser();
            paginaEN = parser.parseFromString(response.responseText, 'text/html');
            console.log('obterPaginaEmInglesCompleta', 'Página em inglês obtida e armazenada em paginaEN (completa usando fetchAsyncGM).');
            return paginaEN;
        }
        else {
            console.error('obterPaginaEmInglesCompleta', 'Falha ao buscar a página em inglês (completa usando fetchAsyncGM). Status:', response.status);
            paginaEN = null;
            return null;
        }
    }
    catch (error) {
        console.error('obterPaginaEmInglesCompleta', 'Erro ao buscar a página em inglês (completa usando fetchAsyncGM):', error);
        paginaEN = null;
        return null;
    }
}

// -----------------------------------------------------------------------------

function parseProsCons(html) {
    console.log('parseProsCons', 'Iniciando');
    const doc = (typeof html == 'string') ? new DOMParser().parseFromString(html, 'text/html') : html;
    const pc = doc.querySelector('pros-cons');
    const fa = pc ? pc.querySelector(':has(div.fa-lg)') : null;

    console.log('parseProsCons', 'entrada', doc);
    console.log('parseProsCons', 'meio', pc);
    console.log('parseProsCons', 'saida', fa);

    if (fa) {
        allReviews_ok = true;
    }
    else {
        console.log('parseProsCons', 'elemento <pros-cons> nao encontrado no html');
    }

    return fa;
}

// -----------------------------------------------------------------------------

async function injetarProsCons(html, container) {
    console.log('injetarProsCons', 'Iniciando');
    console.log('injetarProsCons', 'entrada', html);
    console.log('injetarProsCons', 'container', container);

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

function parseReviews(html) {
    try {
        console.log('parseReviews', 'Iniciando');

        const doc = (typeof html === 'string') ? new DOMParser().parseFromString(html, 'text/html') : html;
        const reviewsContainerEn = doc.getElementById('all-reviews');

        if (!reviewsContainerEn) {
            console.log('parseReviews', 'Contêiner #all-reviews não encontrado na página EN para reviews.');
            return [];
        }

        let reviewsEn = $(reviewsContainerEn).find('div.fragrance-review-box[itemprop="review"]:lt(2)').toArray();

        const uniqueReviewsMap = new Map();
        reviewsEn.forEach(div => {uniqueReviewsMap.set(div.outerHTML, div);});
        reviewsEn = Array.from(uniqueReviewsMap.values());

        const parseDate = div => {
            const span = div.querySelector('span.vote-button-legend[itemprop="datePublished"]');
            if (!span) return new Date(0);
            const rawDate = span.getAttribute('content') || span.textContent.trim();
            const date = new Date(rawDate);
            if (!isNaN(date)) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                const hh = String(date.getHours()).padStart(2, '0');
                const min = String(date.getMinutes()).padStart(2, '0');
                const ss = String(date.getSeconds()).padStart(2, '0');
                const formato = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
                span.textContent = formato;
                span.setAttribute('content', formato);
            }
            return date;
        };

        return reviewsEn.map(div => {
            const date = parseDate(div);
            return {div, date};
        });
    }
    catch (error) {
        console.error('parseReviews', 'Erro ao analisar as reviews:', error);
        return [];
    }
}

// -----------------------------------------------------------------------------

async function injetarReviews(html, container) {
    console.log('injetarReviews', 'Iniciando');

    const parsedLocal = $('#all-reviews div.fragrance-review-box[itemprop="review"]:lt(2)').map(function () {
        const div = this;
        const span = div.querySelector('span.vote-button-legend[itemprop="datePublished"]');
        const date = span ? new Date(span.getAttribute('content') || span.textContent.trim()) : new Date(0);
        return {div, date, isLocal: true};
    }).get(); // .get() converts the jQuery object back to a plain JavaScript array

    const allSortedReviews = html.concat(parsedLocal).sort((a, b) => b.date - a.date);

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

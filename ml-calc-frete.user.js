// ==UserScript==
// @name            Mercado Livre - novas funcoes
// @namespace       https://github.com/yodog/userscripts
// @author          RASG
// @description:en  Add several new functions to Mercado Livre
// @description:pt  Adiciona funcoes na visualizacao em lista do Mercado Livre para: (1) somar frete exibindo valor total da compra, (2) destacar produtos com frete gratis, (3) esconder produtos muito caros, (4) esconder produtos com frete muito caro
// @require         http://code.jquery.com/jquery.min.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require         https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource        toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @include         http*://*.mercadolivre.com.br/*
// @icon            https://www.google.com/s2/favicons?domain=mercadolivre.com
// @version         2020.03.22.0040
// @connect         mercadolivre.com.br
// @grant           GM_addStyle
// @grant           GM_getMetadata
// @grant           GM_getResourceText
// @grant           GM_getValue
// @grant           GM_notification
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @noframes
// ==/UserScript==

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
    duration: 3000,
});

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

var $      = window.$;
var jQuery = window.jQuery;

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// OPTIONS / CONFIG MENU
// -----------------------------------------------------------------------------

var parametros = {
    abrir_links_em_nova_aba:        { type: 'checkbox', default: true },
    ordenar_por_total:              { type: 'checkbox', default: true },
    esconder_frete_a_combinar:      { type: 'checkbox', default: true },
    expandir_area_de_visualizacao:  { type: 'checkbox', default: true },
    esconder_total_maior_que:       { type: 'number',   default: 999 }
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Config MercadoLivre Options',
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

var shouldreload = false;
var lista = $('ol#searchResults');
var items = lista.find('li.results-item > div.rowItem');
var produtos = [];

// apply imediately at document start
fnCheckChangesBody();

// also wait for page load. jquery will be ready here
$(function() {

    // monitor the page for changes and reapply if necessary
    // use 'observer.disconnect()' in 'fnCheckChanges()' to stop monitoring

    var body = document.querySelector('body');

    var observerBody = new MutationObserver(fnCheckChangesBody);
    observerBody.observe(body, { attributes: false, characterData: false, childList: true, subtree: false });

    var observerSubTree = new MutationObserver(fnCheckChangesSubTree);
    observerSubTree.observe(body, { attributes: false, characterData: false, childList: true, subtree: true });

    // capturar produtos da pagina
    fnScanItems();
});

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

function fnCheckChangesSubTree(changes, observer) {

    // para as fotos do produto nao vazarem do elemento pai redimensionado
    $('li.ch-carousel-item').css({'display':'inline-table'});

}

// -----------------------------------------------------------------------------

function fnCheckChangesBody(changes, observer) {

    var page_size = '';
    var grid = {
        img:  { height: '' },
        item: { height: '', width: '', margin: '' },
    };
    var stack = {
        img:  { height: '' },
        item: { height: '', width: '', margin: '' },
    };

    if (cfg.get("expandir_area_de_visualizacao")) {
        page_size = 'unset';
        grid = {
            img:  { height: '180px' },
            item: { height: '470px', width: '200px', margin: '0 0 20px 10px' },
        };
        stack = {
            img: { height: '120px' },
            //item: { height: '470px', width: '200px', margin: '0 0 20px 10px' },
        };
    }

    // tamanho da pagina (TDP)
    $('.ml-main, #results-section').css({'max-width':page_size});
    $('section.results').css({'width':page_size});

    // tamanho de cada item (TCI)
    $('.item.item--grid, .item__image').css({'width':grid.item.width});
    $('.search-results.grid .results-item.item-info-height-169').css({'height':grid.item.height});

    // espaco entre cada item (ECI) depende de TCI
    $('.search-results.grid .results-item').css({'margin':grid.item.margin});

    // titulo, cidade, avaliacoes, parcelas
    $('span.item-installments').remove();
    $('.item__reviews, .item__status').show();
    $('span.main-title').css({'overflow':'unset', 'display':'unset', 'font-size':'12px'});
    $('div.item__condition').css({'font-size':'12px'});
    $('.search-results .item .item__shipping.highlighted.item--has-installments').css({'padding-top':'inherit'});
    $('.item.item--grid .item__info').css({'padding':'15px'});

    // abrir produtos em nova aba
    if ( cfg.get("abrir_links_em_nova_aba") ) fnReplaceLinks();

    // ordenar produtos
    fnReordenarItems();
}

// -----------------------------------------------------------------------------

function fnScanItems() {

    items.each(function() {
        var item = $(this);
        var id = ( item.attr('id') || item.find('div.images-viewer').attr('product-id') ).trim();
        var link = item.find('a.item__info-title, a.item-link, a.item__info-link').attr('href');
        var preco = parseInt( (item.find('span.price__fraction').text()).replace(/\D/g,'') );
        var frete = fnParseShipping(item, link);
        var total = (preco + frete);
        var title = item.find('span.main-title').text().trim();

        var produto = {
            ['preco']: preco,
            ['frete']: frete,
            ['total']: total,
            ['title']: title,
            ['link']: link,
        };

        produtos[id] = produto;

        // adicionar elemento que ira conter o preco total
        var e = item.find('div.item__price');
        e.html(`<span id='p_${id}' class='p'> ${preco} </span> + <span id='f_${id}' class='f'> ${frete} </span> = <span id='t_${id}' class='t'> ${total} </span>`);
        e.css('background', 'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(200,200,200,0.7) 50%, rgba(255,255,255,1) 100%)');
        if ( item.hasClass('item--grid') ) e.css({'display':'block', 'text-align':'center'});
        $('.p').css({'font-size':'0.7em', 'color':'black'});
        $('.f').css({'font-size':'0.7em', 'color':'purple'});
        $('.t').css({'font-size':'0.7em', 'color':'blue'});
    })

    console.log('produtos', produtos);
}

// -----------------------------------------------------------------------------
// Tenta capturar o valor do frete usando o codigo da pagina que o usuario esta
// Se nao conseguir, conectar na pagina do produto e retornar o valor de la
// -----------------------------------------------------------------------------

function fnParseShipping(item, link) {

    var id = ( item.attr('id') || item.find('div.images-viewer').attr('product-id') ).trim();
    var fretecombinar = item.find('p.shipping-text:contains("combinar")');
    var fretegratis = item.find('div.free-shipping, div.item__shipping[title^="Frete gr"], div.item__shipping > span.item--has-fulfillment');

    //try { var id = item.attr('id').trim(); }
    //catch(err) { console.log('Item nao tem ID', link); return false; }

    if ( fretecombinar.length ) {
        fnEfeitoFreteCombinar(id);
        return 'c';
    }
    else if ( fretegratis.length ) {
        fnEfeitoFreteGratis(id);
        return 0;
    }
    else {
        return fnConnectXHR('GET', link, fnParseShippingXHR);
    }

    return '???';
}

// -----------------------------------------------------------------------------

function fnReplaceLinks() {

    var searchResults = document.querySelector('ol#searchResults');
    var links = searchResults.querySelectorAll('a');

    if (! links) return;

    links.forEach(
        a => $(a).filter(function() {
            return this.href.match(/^http/);
        }).attr('target', '_blank')
    );
}

// -----------------------------------------------------------------------------

function fnSaveChanges() {

    $('body').on("click", "#reloadnow", function() {
        $(this).fadeOut("fast", function() { document.location.reload(false); });
    });

    var msg_success = 'Settings saved';
    toast.success(msg_success);

    var msg_reload = '<span id="reloadnow"> Some changes will be applied after you reload the page. <br> Click here to reload now </span>';
    if (shouldreload) toast.message(msg_reload, { delay: 3000, duration: 7000 });

    fnReAplicarTodosEfeitos();
    fnReordenarItems();
}

// ---
// SORT PAGE ELEMENTS (USED TO SORT BY PRICE TOTAL)
// ---

function sortUsingNestedText(parent, childSelector, keySelector) {
    var items = parent.children(childSelector).sort(function(a, b) {
        var vA = parseFloat($(keySelector, a).text());
        var vB = parseFloat($(keySelector, b).text());
        return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
    });

    parent.append(items);
}

// ---
//
// ---

function fnConnectXHR(metodo, endereco, resposta, corpo) {
    var callback = function(xhr) { resposta(xhr); }

    GM_xmlhttpRequest({
        "method"    : metodo,
        "url"       : endereco,
        "onerror"   : callback,
        "onload"    : callback,
        "headers"   : {'Content-Type' : 'application/x-www-form-urlencoded'},
        "data"      : corpo
    });
}

// ---
//
// ---

function fnParseShippingXHR(detalhes) {

    var objDetalhes = $(detalhes.responseText);
    var shipping = objDetalhes.find('p.shipping-method-title, p.shipping-text, .ui-pdp-pick-up .ui-pdp-media__title, .ui-pdp-shipping .ui-pdp-media__title').text().trim().replace(/\s+/g, ' ');

    try { var id = objDetalhes.find('input[name=item_id], input[name=itemId]').val().trim(); }
    catch(err) { console.log('fnParseShippingXHR: item nao tem ID'); return false; }

    switch (true) {
        case /gr.tis/i.test(shipping):
            shipping = 0;
            break;
        case /Frete R\$/i.test(shipping):
            shipping = parseInt( shipping.split("R$")[1].split(" ")[1].slice(0,-2) );
            break;
        case /Chegar.*por R\$/i.test(shipping):
            shipping = parseInt( shipping.split("R$")[1].split(",")[0] );
            break;
        case /combinar/i.test(shipping):
            shipping = 'c';
            break;
        default:
            shipping = shipping;
            break;
    }

    produtos[id].frete = shipping;
    produtos[id].total = produtos[id].preco + produtos[id].frete;

    fnRecalcularTotal(id);
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fnRecalcularTotal(id) {

    var f = produtos[id].frete;
    var t = produtos[id].total;

    $(`#f_${id}`).text(f);
    $(`#t_${id}`).text(t);

    // a ordem dos 'if' eh importante!
    if ( f == 'c') fnEfeitoFreteCombinar(id);
    if ( f == 0 ) fnEfeitoFreteGratis(id);
    if ( t > cfg.get("esconder_total_maior_que") ) fnEfeitoProdutoCaro(id);
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fnEfeitoFreteCombinar(id) {
    var item = $(`div#${id}`);

    item.css('border', '2px dotted blue');

    if ( cfg.get("esconder_frete_a_combinar") ) {
        item.css('opacity', '0.3');
        //item.hide();
    }
    else {
        item.css('opacity', 'unset');
        //item.show();
    }
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fnEfeitoFreteGratis(id) {
    $(`div#${id}`).css('border', '2px dotted green');
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fnEfeitoProdutoCaro(id) {
    $(`div#${id}`).css('border', '2px dotted red');
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fnReAplicarTodosEfeitos() {
    for ( let [id, produto] of Object.entries(produtos) ) {
        fnRecalcularTotal(id);
    }
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fnReordenarItems() {
    if ( $('span.t').lenght < items.lenght ) return;
    sleep(5000).then(() => {
        console.log('sleep');
        cfg.get("ordenar_por_total") ? sortUsingNestedText(lista, items, "span.t") : sortUsingNestedText(lista, items, "span.p");
    });
}

// -----------------------------------------------------------------------------
// sleep time expects milliseconds
// -----------------------------------------------------------------------------

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

// ==UserScript==
// @name        aaa
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description bbb
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @include     http*://*.mercadolivre.com.br/*
// @icon        https://www.google.com/s2/favicons?domain=mercadolivre.com.br
// @version     2020.03.18.1856
// @grant       GM_addStyle
// @grant       GM_getMetadata
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_notification
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
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
    destacar_frete_gratis:          { type: 'checkbox', default: true },
    esconder_frete_a_combinar:      { type: 'checkbox', default: true },
    expandir_area_de_visualizacao:  { type: 'checkbox', default: true },
    esconder_frete_maior_que:       { type: 'number',   default: 30 },
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

    // titulo, cidade, avaliacoes, parcelamento
    $('span.item-installments').remove();
    $('.item__reviews, .item__status').show();
    $('span.main-title').css({'overflow':'unset', 'display':'unset', 'font-size':'12px'});
    $('div.item__condition').css({'font-size':'12px'});

    // abrir produtos em nova aba
    if ( cfg.get("abrir_links_em_nova_aba") ) fnReplaceLinks();

    // ordenar produtos
    if ( cfg.get("ordenar_por_total") ) sortUsingNestedText(lista, items, "span.price__fraction");

    // frete
    //if ( cfg.get("destacar_frete_gratis") ) fnDestacarFreteGratis();
    //if ( cfg.get("esconder_frete_a_combinar") ) fnEsconderFreteCombinar();

    // esconder produtos
    fnEsconderProdutosCaros();
}

// -----------------------------------------------------------------------------

function fnScanItems() {

    items.each(function() {
    //items.first(function() {
        var item = $(this);
        var id = item.attr('id').trim();
        var link = item.find('a.item__info-title').attr('href') || item.find('a.item-link, a.item__info-link').attr('href');

        var produto = {
            ['id']: id,
            ['preco']: parseInt( (item.find('span.price__fraction').text()).replace(/\D/g,'') ) || 0,
            ['frete']: fnBuscarFrete(id, item, link),
            ['total']: 0,
            ['title']: item.find('span.main-title').text().trim(),
            ['link']: link,
        };

        produto.total = produto.preco + produto.frete;

        //console.log('produto sincrono', produto);
        produtos[produto.id] = produto;
    })

    console.log('produtos', produtos);
}

// -----------------------------------------------------------------------------

function fnEsconderProdutosCaros() {

    for ( let [id, produto] of Object.entries(produtos) ) {
        var item = $(`div#${id}`).parent('li');
        //produto.preco > cfg.get("esconder_total_maior_que") ? item.hide() : item.show() ;
        produto.preco > cfg.get("esconder_total_maior_que") ? item.css('opacity', '0.3') : item.css('opacity', 'unset');
    }
}

// -----------------------------------------------------------------------------

function fnBuscarFrete(id, item, link) {

    var fretegratis = item.find('div.free-shipping, div.item__shipping[title^="Frete gr"], div.item__shipping > span.item--has-fulfillment');
    var fretecombinar = item.find('p.shipping-text:contains("a combinar")');

    return fnConectar('GET', link, fnRespParser);
    /*
    if ( fretecombinar.length ) {
        item.css('border', '2px dotted blue');
        if ( cfg.get("esconder_frete_a_combinar") ) item.css('opacity', '0.3');
        return 'a combinar';
    }
    else if ( fretegratis.length ) {
        if ( cfg.get("destacar_frete_gratis") ) item.css('border', '2px dotted green');
        return 0;
    }
    else {
        return fnConectar('GET', link, fnRespParser);
    }
*/
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
// PSEUDO FUNCTION TO SEARCH FOR EXACT TEXT
// ---

$.expr[':'].textEquals = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().match("^" + arg + "$");
    };
});

// ---
//
// ---

function fnConectar(metodo, endereco, resposta, corpo) {
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

function fnRespParser(detalhes) {

    var objDetalhes = $(detalhes.responseText);
    var shippingmethodtitle = objDetalhes.find('.shipping-method-title');
    var textofrete = shippingmethodtitle.text();
    var retorno;

    var shipping = objDetalhes.find('p.shipping-method-title, p.shipping-text').text().trim().replace(/\s+/g,' ');

    /*
    if ( $(`${shipping}:contains("a combinar")`) ) {
        retorno = 'c'
    }
    else if ( $(`${shipping}:contains("Frete gr")`) ) {
        retorno = 'g'
    }
    else {
        //retorno = parseInt( elfrete.text().replace(/\D/g,'') );
        retorno = '?'
    }
*/
    //var fretegratis = objDetalhes.find('div.free-shipping, div.item__shipping[title^="Frete gr"], div.item__shipping > span.item--has-fulfillment');
    //var fretecombinar = objDetalhes.find('p.shipping-text:contains("a combinar")');

    console.log('shipping', shipping);
    //console.log('fretegratis', fretegratis.length);
    //console.log('fretecombinar', fretecombinar.length);

/*
    if ( textofrete.indexOf('a combinar') > -1 ) {
        retorno = 'a combinar';
    }
    else {
        var elfrete = shippingmethodtitle.find('.ch-price:first').contents().filter(function() {
            return this.nodeType == 3;
        });

        if ( textofrete.indexOf('Frete gr') > -1 ) {
            retorno = 'gratis';
        }
        else {
            retorno = parseInt( elfrete.text().replace(/\D/g,'') );
        }
    }
*/
    //console.log('retorno', retorno);
    return shipping;
}

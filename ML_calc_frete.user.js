// ==UserScript==
// @name            Mercado Livre - novas funcoes
// @namespace       https://github.com/yodog/userscripts
// @author          RASG
// @description:en  Add several new functions to Mercado Livre
// @description:pt  Adiciona funcoes na visualizacao em lista do Mercado Livre para: (1) somar frete exibindo valor total da compra, (2) destacar produtos com frete gratis, (3) esconder produtos muito caros, (4) esconder produtos com frete muito caro
// @require         http://code.jquery.com/jquery.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require         https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include         http*://*.mercadolivre.com.br/*
// @version         2019.03.17.2208
// @grant           GM_addStyle
// @grant           GM.addStyle
// @grant           GM_getMetadata
// @grant           GM.getMetadata
// @grant           GM_getValue
// @grant           GM.getValue
// @grant           GM_registerMenuCommand
// @grant           GM.registerMenuCommand
// @grant           GM_setValue
// @grant           GM.setValue
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

this.$ = this.jQuery = jQuery.noConflict(true);

// -----------------------------------------------------------------------------
// COMPATIBILITY BETWEEN GM VERSIONS
// -----------------------------------------------------------------------------

(async () => {

/*
try {
    GM_addStyle            = GM.addStyle;
    GM_getMetadata         = GM.getMetadata;
    GM_getValue            = GM.getValue;
    GM_registerMenuCommand = GM.registerMenuCommand;
    GM_setValue            = GM.setValue;
    GM_xmlhttpRequest      = GM.xmlHttpRequest;

    console.log('GM object found; Using GM. methods');
}
catch(err) {
    console.log(err);
    console.log('GM object not found; Using GM_ functions');
}
*/

// -----------------------------------------------------------------------------
// OPTIONS / CONFIG MENU
// -----------------------------------------------------------------------------

var parametros = {
    ordenar_por_total:              { type: 'checkbox', default: true },
    destacar_frete_gratis:          { type: 'checkbox', default: true },
    esconder_frete_a_combinar:      { type: 'checkbox', default: true },
    expandir_area_de_visualizacao:  { type: 'checkbox', default: true },
    esconder_frete_maior_que:       { type: 'number',   default: 30 },
    esconder_total_maior_que:       { type: 'number',   default: 999 }
}

try {
    var cfg = new MonkeyConfig({
        title: 'Config ML_calc_frete',
        menuCommand: true,
        onSave: function() { recarregar(); },
        params: parametros
    });
    console.log("MonkeyConfig loaded; The settings menu will be enabled");
}
catch(err) {
    console.log(err);
    console.log("MonkeyConfig not loaded; The settings menu will be disabled");
    var cfg = {
        params: parametros,
        get: function get(name) { return GM_getValue(name, this.params[name].default) }
    }
}

var ordenar_por_total             = await cfg.get("ordenar_por_total");
var destacar_frete_gratis         = await cfg.get("destacar_frete_gratis");
var esconder_frete_a_combinar     = await cfg.get("esconder_frete_a_combinar");
var expandir_area_de_visualizacao = await cfg.get("expandir_area_de_visualizacao");
var esconder_frete_maior_que      = await cfg.get("esconder_frete_maior_que");
var esconder_total_maior_que      = await cfg.get("esconder_total_maior_que");

// -----------------------------------------------------------------------------
// FUNCTIONS
// -----------------------------------------------------------------------------

// ---
// RELOAD PAGE (USED WHEN SETTINGS ARE CHANGED)
// ---

function recarregar() {
    //alert('Recarregue a pagina para aplicar as alteracoes');
    document.location.reload(false);
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

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

    $(function() {

        // ---
        // ELEMENTS
        // ---

        var lista    = $('ol#searchResults');
        var items    = lista.find('li.results-item');
        var produtos = [];

        if ( expandir_area_de_visualizacao ) $('.ml-main').attr('style', 'max-width: 1700px !important');

        items.each(function() {
        //items.first(function() {

            var item = $(this);
            var id   = item.find('div.rowItem').attr('id');

            var produto = {
                ['id']: id.trim(),
                ['preco']: 0,
                ['frete']: 0,
                ['total']: 0,
                ['title']: item.find('span.main-title').text().trim(),
            }

            // capturar o link

            var link = item.find('a.item__info-title').attr('href') || item.find('a.item-link, a.item__info-link').attr('href');

            // adicionar o elemento que ira receber os meus campos 'envio' e 'total'

            var itemprice = item.find('div.item__price');
            itemprice.append('<span class="freteholder"> Envio: R$ <span id="freteholder_'+id+'">?</span></span> <span class="totalholder"> Total: R$ <span id="totalholder_'+id+'" class="totals">?</span></span>');
            $('.totalholder').css('color', 'red');

            var totalholder_id = $('#totalholder_'+id);
            var freteholder_id = $('#freteholder_'+id);

            // capturar o preco

            var pricefraction = item.find('span.price__fraction');
            var preco = pricefraction.text();

            produto.preco = parseInt( preco.replace(/\D/g,'') );

            // ---
            // FRETE
            // ---

            // capturar o texto; se for frete gratis marcar com borda verde e nao enviar a requisicao

            var regrafrete = item.find('p.stack-item-info').text() || item.find('div.item__shipping').attr('title') || item.find('div.item__shipping > p').text();
            //var regrafrete = item.children(":contains('Frete gr')").text();
            //var regrafrete = item.find(":contains('Frete gr')").first();
            //var regrafrete = item.find(":textEquals('Frete grátis')");

            if ( (regrafrete) && (regrafrete.indexOf('Frete gr') > -1) ) {

                color         = 'green';
                produto.total = produto.preco + produto.frete;

                freteholder_id.html(produto.frete);
                totalholder_id.html(produto.total);

                if ( destacar_frete_gratis ) item.css('border', '2px dotted ' + color);

                if ( produto.total > esconder_total_maior_que ) {
                    item.hide();
                }
                else {
                    if ( ordenar_por_total ) sortUsingNestedText(lista, items, "span.totals");
                }

                console.log('produto sincrono', produto);
                produtos[produto.id] = produto;
            }
            else {
                color = 'blue';
                conectar('GET', link, resparser);
            }

            itemprice.find('.freteholder').css('color', color);

            // ---
            //
            // ---

            function conectar(metodo, endereco, resposta, corpo) {
                callback = function(xhr) { resposta(xhr); }

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

            function resparser(detalhes) {

                shippingmethodtitle = $(detalhes.responseText).find('.shipping-method-title');
                textofrete = shippingmethodtitle.text();

                if ( textofrete.indexOf('a combinar') > -1 ) {
                    color = 'blue';
                    itemprice.find('.freteholder').hide();
                    itemprice.find('.totalholder').html(textofrete);

                    if ( esconder_frete_a_combinar ) item.hide();
                }
                else {
                    elfrete = shippingmethodtitle.find('.ch-price:first').contents().filter(function() { return this.nodeType == 3; });

                    if ( textofrete.indexOf('Frete gr') > -1 ) {
                        color = 'green';
                        produto.frete = 0;
                        if ( destacar_frete_gratis ) item.css('border', '2px dotted ' + color);
                    }
                    else {
                        produto.frete = parseInt( elfrete.text().replace(/\D/g,'') );
                    }

                    produto.total = produto.preco + produto.frete;

                    freteholder_id.html(produto.frete);
                    totalholder_id.html(produto.total);

                    if ( (produto.frete > esconder_frete_maior_que) || (produto.total > esconder_total_maior_que) ) {
                        item.hide();
                    }
                    else {
                        if ( ordenar_por_total ) sortUsingNestedText(lista, items, "span.totals");
                    }
                }
                console.log('produto assincrono', produto);
                produtos[produto.id] = produto;
            }
        })

        console.log('produtos', produtos.length, produtos);

    }); // closing $(function() {

})(); // closing (async () => {

// ==UserScript==
// @name        Mercado Livre - calculadora de frete
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Adiciona campo somando o valor do frete na visualizacao em lista do Mercado Livre
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include     http*://*.mercadolivre.com.br/*
// @version     2018.01.16.1751
// @grant       GM_addStyle
// @grant       GM_getMetadata
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// ==/UserScript==

// PREVENT JQUERY CONFLICT
this.$ = this.jQuery = jQuery.noConflict(true);

$(window).load(function(){

    // ---
    // OPTIONS / CONFIG MENU
    // ---

    var cfg = new MonkeyConfig({
        title: 'Config ML_calc_frete',
        menuCommand: true,
        onSave: function() { recarregar(); },
        params: {
            esconder_frete_maior_que: {
                type: 'number',
                default: 99
            },
            esconder_total_maior_que: {
                type: 'number',
                default: 999
            }
        }
    });

    var esconder_frete_maior_que = cfg.get("esconder_frete_maior_que");
    var esconder_total_maior_que = cfg.get("esconder_total_maior_que");

    // ---
    // ELEMENTS
    // ---

    //$('.item__info:lt(2)').each(function() {
    //$('div.rowItem:lt(2)').each(function() {
    $('div.rowItem').each(function() {

        var rowItem = $(this);

        var id = rowItem.attr('id');

        var iteminfotitle = rowItem.find('.item__info-title');
        link              = iteminfotitle.attr('href');

        var itemprice = rowItem.find('.item__price');
        itemprice.append('<span class="freteholder"> Envio: <span id="freteholder_'+id+'">?</span></span> <span class="totalholder"> Total: R$ <span id="totalholder_'+id+'">?</span></span>');
        $('.freteholder').css('color', 'blue');
        $('.totalholder').css('color', 'red');

        pricefraction = rowItem.find('.price-fraction');
        var preco     = pricefraction.text();

        conectar('GET', link, resparser);

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

        function resparser(detalhes) {

            elfrete = $(detalhes.responseText).find('.shipping-method-title > .ch-price').contents().filter(function() { return this.nodeType == 3; });
            valorfrete = elfrete.text();

            n1 = parseInt( valorfrete.replace(/\D/g,'') );
            n2 = parseInt( preco.replace(/\D/g,'') );

            valortotal = n1 + n2;

            itemprice.find('#freteholder_'+id).html(valorfrete);
            itemprice.find('#totalholder_'+id).html(valortotal);

            if ( esconder_frete_maior_que ) {
                if ( n1 > esconder_frete_maior_que ) rowItem.parent().hide();
            }

            if ( esconder_total_maior_que ) {
                if ( valortotal > esconder_total_maior_que ) rowItem.parent().hide();
            }
        }
    })
});

function recarregar() {
    alert('Recarregue a pagina para aplicar as alteracoes');
}

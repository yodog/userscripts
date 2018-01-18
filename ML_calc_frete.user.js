// ==UserScript==
// @name        Mercado Livre - funcoes que deveriam existir no site
// @namespace   http://stackoverflow.com/users/982924/rasg
// @author      RASG
// @description Adiciona funcoes na visualizacao em lista do Mercado Livre para: (1) somar frete exibindo valor total da compra, (2) destacar produtos com frete gratis, (3) esconder produtos muito caros, (4) esconder produtos com frete muito caro
// @require     http://code.jquery.com/jquery.min.js
// @require     https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @include     http*://*.mercadolivre.com.br/*
// @version     2018.01.18.2042
// @grant       GM_addStyle
// @grant       GM_getMetadata
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// ==/UserScript==

// PREVENT JQUERY CONFLICT
this.$ = this.jQuery = jQuery.noConflict(true);

// START
$(window).load(function(){

    // ---
    // OPTIONS / CONFIG MENU
    // ---

    var cfg = new MonkeyConfig({
        title: 'Config ML_calc_frete',
        menuCommand: true,
        onSave: function() { recarregar(); },
        params: {
            ordenar_por_total: {
                type: 'checkbox',
                default: true
            },
            destacar_frete_gratis: {
                type: 'checkbox',
                default: true
            },
            esconder_frete_a_combinar: {
                type: 'checkbox',
                default: false
            },
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

    var ordenar_por_total         = cfg.get("ordenar_por_total");
    var destacar_frete_gratis     = cfg.get("destacar_frete_gratis");
    var esconder_frete_a_combinar = cfg.get("esconder_frete_a_combinar");
    var esconder_frete_maior_que  = cfg.get("esconder_frete_maior_que");
    var esconder_total_maior_que  = cfg.get("esconder_total_maior_que");

    // ---
    // ELEMENTS
    // ---

    var rowItems = $('div.rowItem');

    rowItems.each(function() {

        var rowItem = $(this);

        var id = rowItem.attr('id');

        // capturar o link

        var iteminfotitle = rowItem.find('.item__info-title');
        link = iteminfotitle.attr('href');

        // adicionar o elemento que ira receber os meus campos 'envio' e 'total'

        var itemprice = rowItem.find('.item__price');
        itemprice.append('<span class="freteholder"> Envio: R$ <span id="freteholder_'+id+'">?</span></span> <span class="totalholder"> Total: R$ <span id="totalholder_'+id+'" class="totals">?</span></span>');
        $('.totalholder').css('color', 'red');

        var totalholder_id = $('#totalholder_'+id);
        var freteholder_id = $('#freteholder_'+id);

        // capturar o preco

        pricefraction = rowItem.find('.price-fraction');
        var preco = pricefraction.text();
        preco = parseInt( preco.replace(/\D/g,'') );

        // ---
        // FRETE
        // ---

        // capturar o texto; se for frete gratis marcar com borda verde e nao enviar a requisicao

        var stackiteminfo = rowItem.find('.stack-item-info ');
        regrafrete = stackiteminfo.text();

        if ( regrafrete.indexOf('Frete gr') > 0 ) {
            color      = 'green';
            valorfrete = 0;
            valortotal = preco + valorfrete;

            freteholder_id.html(valorfrete);
            totalholder_id.html(valortotal);

            if ( destacar_frete_gratis ) rowItem.parent().css('border', '2px dotted ' + color);

            if ( valortotal > esconder_total_maior_que ) {
                rowItem.parent().hide();
            }
            else {
                if ( ordenar_por_total ) sortUsingNestedText($('#searchResults'), "li", "span.totals");
            }
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
            elfrete = shippingmethodtitle.find('.ch-price').contents().filter(function() { return this.nodeType == 3; });

            valorfrete = parseInt( elfrete.text().replace(/\D/g,'') );
            textofrete = shippingmethodtitle.text();

            if ( ! valorfrete ) {
                itemprice.find('.freteholder').hide();
                itemprice.find('.totalholder').html(textofrete);

                if ( esconder_frete_a_combinar ) rowItem.parent().hide();
            }
            else {
                valortotal = preco + valorfrete;

                freteholder_id.html(valorfrete);
                totalholder_id.html(valortotal);

                if ( (valorfrete > esconder_frete_maior_que) || (valortotal > esconder_total_maior_que) ) {
                    rowItem.parent().hide();
                }
                else {
                    if ( ordenar_por_total ) sortUsingNestedText($('#searchResults'), "li", "span.totals");
                }
            }
        }
    })
});


// ---
//
// ---

function recarregar() {
    alert('Recarregue a pagina para aplicar as alteracoes');
}

// ---
//
// ---

function sortUsingNestedText(parent, childSelector, keySelector) {
    var items = parent.children(childSelector).sort(function(a, b) {
        var vA = $(keySelector, a).text();
        var vB = $(keySelector, b).text();
        return (vA < vB) ? -1 : (vA > vB) ? 1 : 0;
    });

    parent.append(items);
}

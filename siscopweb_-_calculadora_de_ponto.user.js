// ==UserScript==
// @name        siscopweb - calculadora de ponto
// @namespace   https://github.com/yodog/userscripts
// @author      RASG
// @require     http://code.jquery.com/jquery.min.js
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @include     http*://siscopweb.serpro/*
// @include     file://*
// @version     2018.09.11.1240
// @grant       GM_addStyle
// @noframes
// ==/UserScript==

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

this.$ = this.jQuery = jQuery.noConflict(true);

// -----------------------------------------------------------------------------
// Variaveis que precisam estar disponiveis para todas as funcoes
// -----------------------------------------------------------------------------

var today    = new Date();
var hoje     = today.getDate();      // 1-31
var mesatual = today.getMonth() + 1; // 0-11 +1 = 1-12

var tabelaRegistros = $('table#tabelaRegistros');
var tblHead = tabelaRegistros.find('thead');
var tblBody = tabelaRegistros.find('tbody');
var tblRows = tblBody.find('tr');
var firstrow = tblRows.first();
var lastrow = tblRows.last();

// -----------------------------------------------------------------------------
// Acoes globais, que podem ser aplicadas para todas as paginas
// -----------------------------------------------------------------------------

// Monitorar evento 'scroll' para fixar a linha de 'saldo'

$(document).on('ready scroll', function() {
    var $stickyRow = $('.totalrow'),
    $anchor = $stickyRow.prev();

    $stickyRow.removeClass('fixed flutuante top bottom');

    if (! isScrolledIntoView($anchor)) {
        var orientation = ($anchor.offset().top < $(window).scrollTop()) ? 'top' : 'bottom';
        $stickyRow.addClass('fixed flutuante ' + orientation);
    }

    // Mostrar painel de pesquisa de empregados

    $('div#panel-pesquisa-empregado').show();
});

// Remover 'footer' inutil

$('body > footer').remove();

// Arrumar menu

waitForKeyElements('ul#menu li.menu-primary', fMenu);

// -----------------------------------------------------------------------------
// Acoes especificas para cada pagina
// -----------------------------------------------------------------------------

if (window.location.href.indexOf('manutencao.html') > -1) {

    // -------------------------------------------------------------------------
    // Experar o AJAX maldito carregar a tabela com os dados
    // Somente a partir de entao executar o codigo
    // -------------------------------------------------------------------------

    waitForKeyElements('table#tabelaRegistros > tbody', function(tblBody) {

        // atualizar valores das variaveis que foram definidas fora dessa funcao

        tblRows = tblBody.find('tr');
        lastrow = tblRows.last();

        // true = executar em loop ate encontrar o elemento que estou esperando

        if (tblRows.length == 0) return true;

        // se chegou aqui o elemento apareceu. iniciar a execucao

        fSaldoBanco();
        fMes();
        fDia();
        fJornada();
        fLinhaSaldo();
        fCabecalho();

        // aplicar alteracoes esteticas

        $('.fds').attr('style', 'background-color: whitesmoke !important').css('opacity', '0.2');
        $('.diafuturo').css('opacity', '0.3');
        $('.diapassado').css('border', '1px solid red');
        $('.diamenor').parent().css('background-color', 'yellow');
        $('.diamaior').parent().css('background-color', 'lightgreen');

    });
}

if (window.location.href.indexOf('registro.html') > -1) {

    // Incluir aqui o calculo em tempo real de horas do dia
    // baseado no relogio da pagina e nos registros

}

// -----------------------------------------------------------------------------
// FUNCOES QUE PODEM SER APROVEITADAS EM OUTROS SCRIPTS
// -----------------------------------------------------------------------------

function MinToHM(minutos) {
    var h = Math.floor(minutos / 60);
    var m = minutos % 60;

    return `${minutos} (${h}h ${m}min)`;
}

function MyArrayObj(array) {
    this.array  = array;
    this.sorted = [...this.array].sort((a, b) => a - b);
    this.max    = this.sorted[this.sorted.length - 1];
    this.min    = this.sorted[0];
    this.sum    = this.sorted.reduce((a, b) => a + b, 0);
    this.unique = [...new Set(this.sorted)];
}

function isScrolledIntoView($elem) {
  var $window = $(window);
  var docViewTop = $window.scrollTop();
  var docViewBottom = docViewTop + $window.height();
  var elemTop = $elem.offset().top;
  var elemBottom = elemTop + $elem.height();

  return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

// -----------------------------------------------------------------------------
// FUNCOES E MANIPULACOES DE ELEMENTOS ESPECIFICOS PARA ESTE SCRIPT
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Saldo do banco de horas
// -----------------------------------------------------------------------------

function fSaldoBanco() {

    // Preparar o elemento que ira receber o total

    var saldo_semestral_banco_horas = $('span#saldo_semestral_banco_horas');
    var ssbh = $("span#ssbh");
    if (ssbh.length == 0) ssbh = saldo_semestral_banco_horas.clone().attr('id', 'ssbh');
    saldo_semestral_banco_horas.after(ssbh).after('<br>');

    // Capturar e converter o saldo

    var txt  = saldo_semestral_banco_horas.text().split('/');
    var base = Number( txt[0].replace(/\D/g,'') );
    var act  = Number( txt[1].replace(/\D/g,'') );

    var saldo = new MyArrayObj([base, act]);

    // Inserir o resultado

    ssbh.text('Total: ' + MinToHM(saldo.sum));
}

// -----------------------------------------------------------------------------
// Barra de meses
// -----------------------------------------------------------------------------
// Para cada mes:
// 1- capturar a representacao numerica (1-12)
// 2- dividir passado, presente e futuro em classes
// -----------------------------------------------------------------------------

var meses;
var mesativo;
var mesespassados;

function fMes() {

    meses = $('div#mesesDoAno li');

    meses.each(function() {
        var mes = $(this).attr("id");
        if (mes < mesatual) $(this).addClass('mespassado').css('text-decoration', 'line-through');
        if ($(this).hasClass('active')) mesativo = $(this).attr("id");
    });

    mesespassados = meses.filter('.mespassado');

    meses.on("click", function(e) { mesativo = this.find('li.active').attr("id"); });
}

// -----------------------------------------------------------------------------
// Linhas da tabela : dia
// -----------------------------------------------------------------------------
// Para cada dia:
// 1- capturar a representacao numerica (1-31)
// 2- dividir passado, presente e futuro em classes
// -----------------------------------------------------------------------------

var linhasAteHoje;

function fDia() {

    linhasAteHoje = tblRows.map(function() {

        var dia = Number( $('td:eq(3)', this).text() );
        if ( isNaN(dia) ) return null;

        if ( mesativo > mesatual ) $(this).addClass('diafuturo');
        if ( mesativo < mesatual ) $(this).addClass('diapassado');
        if ( mesativo == mesatual ) {
            if ( dia < hoje ) $(this).addClass('diapassado');
            if ( dia == hoje ) return null;
            if ( dia > hoje ) { $(this).addClass('diafuturo') ; return null; }
        }

        return $(this);

    }).get();
}

// -----------------------------------------------------------------------------
// Linhas da tabela : jornada
// -----------------------------------------------------------------------------
// Capturar todos o valores da coluna 'Diferenca na Jornada'
// Capturar todos o valores da coluna 'Saldo Final da Jornada'
// -----------------------------------------------------------------------------

var arrValoresDiferenca;
var arrValoresSaldoFinal;
var colunaDiferenca;
var colunaSaldoFinal;

function fJornada() {

    //colunaDiferenca = $('.diapassado > td:nth-child(17)');
    colunaDiferenca = $('.diapassado td[id^="diferenca_jornada_"]');

    arrValoresDiferenca = new MyArrayObj(colunaDiferenca.map(function() {
        var n = Number(this.textContent);
        if ( isNaN(n) ) return null;
        if ( n == 0 ) return null;
        return n;
    }).get());

    //colunaSaldoFinal = $('.diapassado > td:nth-child(18)');
    colunaSaldoFinal = $('.diapassado td[id^="execucao_jornada_"]');

    arrValoresSaldoFinal = new MyArrayObj(colunaSaldoFinal.map(function() {
        var n = Number(this.textContent);
        if ( isNaN(n) ) return null;
        if ( n == 0 ) return null;
        return n;
    }).get());

    colunaDiferenca.each(function() {
        if ( this.textContent == arrValoresDiferenca.min ) { $(this).addClass('diamenor'); }
        else if ( this.textContent == arrValoresDiferenca.max ) { $(this).addClass('diamaior'); }
    });
}

// -----------------------------------------------------------------------------
// Linhas da tabela : SALDO
// -----------------------------------------------------------------------------
// Adicionar linha de saldo abaixo da ultima linha da tabela
// -----------------------------------------------------------------------------

var totalrow;
var myTblHeader;
var myTblFooter;

function fLinhaSaldo() {

    var linhasaldo = `
        <tr id="myTblFooter" class="totalrow">
            <td id="saldo"      class="l" colspan="15"> SALDO </td>
            <td id="diferenca"  class="r"> ${MinToHM(arrValoresDiferenca.sum)} </td>
            <td id="saldofinal" class="r"> ${MinToHM(arrValoresSaldoFinal.sum)} </td>
        </tr>
    `;

    lastrow.after(linhasaldo);

    var wdmyTblFooter = $('tr#myTblFooter').width()+'px';
    var wdsaldo       = $('td#saldo').width()+'px';
    var wddiferenca   = $('td#diferenca').width()+'px';
    var wdsaldofinal  = $('td#saldofinal').width()+'px';

    GM_addStyle('tr#myTblFooter { text-align: center; background-color: lightgray; display: table-row; }');

    GM_addStyle('tr#myTblFooter.flutuante                   { width: '+wdmyTblFooter+'; display: inline-table; }');
    GM_addStyle('tr#myTblFooter.flutuante > td#saldo        { width: '+wdsaldo+'; }');
    GM_addStyle('tr#myTblFooter.flutuante > td#diferenca    { min-width: '+wddiferenca+'; }');
    GM_addStyle('tr#myTblFooter.flutuante > td#saldofinal   { min-width: '+wdsaldofinal+'; }');

    GM_addStyle('.flutuante.fixed  { position: fixed; }');
    GM_addStyle('.flutuante.bottom { bottom: 0; }');
    GM_addStyle('.flutuante.top    { top: 0; }');
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fMenu() {

    var stickymenu = `
        ul#menu, .dropdown-menu {
            display: block;
            position: sticky;
            top: 10%;
            z-index: 9999;
        }

        div.container {
            margin-right: 0;
        }

        div.serpro-titulo {
            margin-bottom: -15em;
        }
    `;

    GM_addStyle(stickymenu);

    $('ul#menu').removeAttr('style');
    $('ul#menu').show();
    $('ul#menu').prependTo('article');

    $('ul#menu ul').removeClass('collapse');
}

// -----------------------------------------------------------------------------
//
// -----------------------------------------------------------------------------

function fCabecalho() {

    var stickyheader = `
        div#mesesDoAno {
            position: sticky;
            top: 200;
        }

        thead tr:nth-child(1) th {
            background: black;
            position: sticky;
            top: 300;
            z-index: 10;
        }
    `;

    //GM_addStyle(stickyheader);

    //$('td#saldo').css({'width' : firstrow.width()+'px', 'background-color' : 'lightblue'});
    //$('tr#myTblFooter').css({'width' : firstrow.width()+'px', 'background-color' : 'lightblue'});

    /*
    if (! totalrow) totalrow = lastrow.clone();

    //totalrow.removeAttr('class style');
    //totalrow.find('td').removeAttr('bgcolor id style').text('');

    totalrow.attr('class', 'totalrow');
    totalrow.css({'width' : lastrow.width()+'px', 'background-color' : 'lightgrey'});

    totalrow.find('td').text('');
    totalrow.find("td:first").text('SALDO');
    totalrow.find("td[id^='diferenca_jornada_']").text(MinToHM(arrValoresDiferenca.sum));
    totalrow.find("td[id^='execucao_jornada_']").text(MinToHM(arrValoresSaldoFinal.sum));

    myTblHeader = totalrow.clone().attr('id', 'myTblHeader');
    //myTblFooter = totalrow.clone().attr('id', 'myTblFooter').addClass('flutuante');

    //firstrow.before(myTblHeader);
    //lastrow.after(myTblFooter);
    */
}

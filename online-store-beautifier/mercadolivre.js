var _mlUltimaAssinatura = null;   // guarda a ultima assinatura da lista de produtos
const SEL_TITULO = '.ui-search-item__title, .poly-component__title, .poly-component__headline';

function aplicar_mercadolivre() {

    console.log('Carregando configuracoes do mercado livre v2026.08.12.1812')

    if (typeof $ == 'undefined') {
        console.log('JQuery nao encontrado. Saindo da funcao aplicar_mercadolivre');
        return
    }

    // ajustar css para ocupar toda a largura da tela
    if (cfg.get("page_wide")) {
        const css = `
            .ui-search-main, .ui-search-results {
                max-width: unset !important ;
                width: 100% !important ;
            }
            .ui-search-sidebar {
                min-width: unset !important ;
            }
            .ui-search-layout__item {
                height: unset !important ;
                min-width: unset !important ;
            }
            .ui-search-layout {
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important ;
            }
        `;
        fnInjectStyle(css);
    }

    // barra de filtro de produtos (topo, oculta itens que nao baterem)
    filtro_mercadolivre();
}

function filtro_mercadolivre() {

    // cria a barra uma unica vez
    if (!$('#ml-filtro-bar').length) {
        var barra = $(`
            <div id="ml-filtro-bar" style="position:fixed;top:0;left:0;right:0;z-index:999999;background:linear-gradient(90deg, rgba(220,20,60,0.85) 0%, rgba(178,34,34,0.85) 100%);border-bottom:1px solid rgba(255,255,255,0.4);padding:6px 10px;font-size:13px;font-family:sans-serif;display:flex;gap:8px;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.2);">
                <strong>Filtro:</strong>
                <input id="ml-filtro-input" style="flex:1;min-width:120px;padding:3px 6px;border:1px solid #ccc;border-radius:3px;" placeholder="palavras separadas por espaco, ex: samsung tela oled">
                <label style="white-space:nowrap;">Modo:
                    <select id="ml-filtro-modo" style="padding:2px 4px;border:1px solid #ccc;border-radius:3px;">
                        <option value="AND">AND</option>
                        <option value="OR" selected>OR</option>
                    </select>
                </label>
                <button id="ml-filtro-aplicar" style="padding:3px 10px;cursor:pointer;">Aplicar</button>
                <button id="ml-filtro-limpar" style="padding:3px 10px;cursor:pointer;">Limpar</button>
                <span id="ml-filtro-info" style="font-size:11px;color:#fff;white-space:nowrap;">encontrados: 0 · escondidos: 0 · mantidos: 0</span>
            </div>
        `);
        barra.appendTo('body');

        // desloca o conteudo para caber a barra fixa
        $('body').css({'padding-top':'42px'});

        // restaura o filtro salvo (so existe enquanto a aba/navegador estiver aberto)
        var salvo = '';
        try { salvo = sessionStorage.getItem('ml_filtro') || ''; } catch(e) {}
        $('#ml-filtro-input').val(salvo);

        var salvo_modo = 'OR';
        try { salvo_modo = sessionStorage.getItem('ml_filtro_modo') || 'OR'; } catch(e) {}
        $('#ml-filtro-modo').val(salvo_modo);

        $('#ml-filtro-aplicar').on('click', aplicar);
        $('#ml-filtro-limpar').on('click', limpar);
        $('#ml-filtro-input').on('keyup', function(e) { if (e.keyCode == 13) aplicar(); });
        $('#ml-filtro-modo').on('change', function() { if ($('#ml-filtro-input').val()) aplicar(); });
    }

    // so reage quando a lista de produtos muda (scroll, "ver mais" ou paginacao)
    var sig = mlAssinaturaProdutos();
    if (sig !== _mlUltimaAssinatura) {
        _mlUltimaAssinatura = sig;
        aplicar();   // aplicar lida com filtro vazio (marca tudo como data-filtrado=true)
    }

    function itens() {
        var cards = $('.ui-search-layout__item');
        if (!cards.length) cards = $('.poly-card');
        return cards.filter(function() {
            return $(this).find(SEL_TITULO).length;
        });
    }

    function titulo(el) {
        return norm($(el).find(SEL_TITULO).first().text());
    }

    function aplicar() {
        var raw = $('#ml-filtro-input').val() || '';
        var modo = $('#ml-filtro-modo').val();
        if ($('#ml-filtro-input').length) {         // so persiste se o input existir
            try {
                sessionStorage.setItem('ml_filtro', raw);
                sessionStorage.setItem('ml_filtro_modo', modo);
            } catch(e) {}
        }

        var and  = $('#ml-filtro-modo').val() == 'AND';   // OR e' o padrao
        var termos = raw.split(/\s+/).map(norm).filter(Boolean);

        itens().each(function(i, el) {
            var t  = titulo(el);
            var ok = !termos.length
                || (and ? termos.every(function(x) { return t.indexOf(x) >= 0; })
                        : termos.some(function(x) { return t.indexOf(x) >= 0; }));
            if (termos.length) {
                $(el).toggle(ok);
                if (ok) destacar(el, termos); else limparDestaque(el);
            } else {
                limparDestaque(el);
            }
            $(el).attr('data-filtrado', ok ? 'true' : 'false');
        });

        atualizarInfo();
    }

    function limpar() {
        $('#ml-filtro-input').val('');
        $('#ml-filtro-modo').val('OR');
        try {
            sessionStorage.removeItem('ml_filtro');
            sessionStorage.removeItem('ml_filtro_modo');
        } catch(e) {}
        itens().each(function() { $(this).show(); $(this).attr('data-filtrado', 'true'); limparDestaque(this); });
        atualizarInfo();
    }

    function atualizarInfo() {
        var todos      = itens().length;
        var mantidos   = $('[data-filtrado="true"]').length;
        var escondidos = $('[data-filtrado="false"]').length;
        $('#ml-filtro-info').text('encontrados: ' + todos + ' · escondidos: ' + escondidos + ' · mantidos: ' + mantidos);
    }
}

// retorna "qtd|hrefPrimeiro|hrefUltimo" para detectar mudanca na lista de produtos
function mlAssinaturaProdutos() {
    var lista = $('.ui-search-layout__item');
    if (!lista.length) lista = $('.poly-card');
    var first = lista.first().find('a').first().attr('href') || '';
    var last  = lista.last().find('a').first().attr('href')  || '';
    return lista.length + '|' + first + '|' + last;
}
// converte para minusculas + apenas caracteres ascii (remove acentos e nao-ascii)
function norm(s) {
    return s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 ]/g, '');
}

// realce dos termos encontrados com cores distintas
var _paleta = ['#faca2eff','#8eff4dff','#effa50ff','#f1a4deff','#90CAF9','#64B5F6','#F48FB1','#CE93D8','#80CBC4','#FF8A65'];
var _corPalavras = {};
var _acento = { a:'aáàâãä', e:'eéèêë', i:'iíìîï', o:'oóòôõö', u:'uúùûü', c:'cç', n:'nñ' };

function corDaPalavra(k) {
    if (!_corPalavras.hasOwnProperty(k)) {
        _corPalavras[k] = _paleta[Object.keys(_corPalavras).length % _paleta.length];
    }
    return _corPalavras[k];
}

// monta regex sem sensibilidade a acento p/ um termo (termos ja normalizados)
function reTermo(t) {
    return t.split('').map(function(ch) {
        return _acento[ch] ? '[' + _acento[ch] + ']' : ch;
    }).join('');
}

function tituloEl(el) {
    return $(el).find(SEL_TITULO).first();
}

// envolve cada termo encontrado num <mark> com cor propria
function destacar(el, termos) {
    var tit = tituloEl(el);
    var txt = tit.text();
    if (!txt) return;
    var re = new RegExp('(' + termos.slice().sort(function(a,b){ return b.length - a.length; }).map(reTermo).join('|') + ')', 'gi');
    tit.html(txt.replace(re, function(m) {
        return '<mark style="background:' + corDaPalavra(norm(m)) + '">' + m + '</mark>';
    }));
}

// remove os destaques do titulo
function limparDestaque(el) {
    var tit = tituloEl(el);
    tit.html(tit.text());
}


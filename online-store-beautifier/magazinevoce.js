function aplicar_magazinevoce() {

    console.log('Carregando configuracoes do magazinevoce v2021.09.10.1444')

    if (typeof $ == 'undefined') {
        console.log('JQuery nao encontrado. Saindo da funcao aplicar_magazinevoce');
        return
    }

    // Expandir a tela para aproveitar todo o espaco
    var page_size = '';
    if (cfg.get("page_wide")) page_size = 'unset';
    $('div.container').css({'max-width':page_size});
    $('.g-items').css({'width':page_size});

    // Adicionar borda nos itens para facilitar a visualizacao
    $('.g-items .g-item').css({'border':'1px dotted blue'}); // magazinevoce

    // Dimimuir espaco entre os itens
    $('.g-items .g-item').css({'margin-top':'1em', 'margin-right':'1em', 'padding-left':'0.5em'}); // magazinevoce

    // Alinhamento do texto
    $('.g-items .g-desc').css({'text-align':'left'});

    // ---
    // Visualizacao em lista
    // ---

    var layout = '';
    if (cfg.get("layout") == 'lista') {
        $('.g-items .g-item').css({'display':'table', 'width':'45%', 'height':'130px'});
        $('.g-items .g-img-wrapper').css({'display':'table-cell', 'width':'40%', 'height':'unset'});
        $('.g-items .g-img-wrapper>img').css({'width':'40%'});
        $('.g-items .g-desc').css({'display':'table-cell'});
    }
    if (cfg.get("layout") == 'mini lista') {
        $('.g-items .g-item').css({'display':'table', 'width':'30%', 'height':'100px'});
        $('.g-items .g-img-wrapper').css({'display':'table-cell', 'width':'35%', 'height':'unset'});
        $('.g-items .g-img-wrapper>img').css({'width':'35%'});
        $('.g-items .g-desc').css({'display':'table-cell'});
    }
}

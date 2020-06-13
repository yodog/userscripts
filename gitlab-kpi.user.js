// ==UserScript==
// @name         GitLab Metrics
// @namespace    http://stackoverflow.com/users/982924/rasg
// @version      2020.06.13.1400
// @description  KPI
// @author       RASG
// @match        http*://git.serpro/*
// @connect      serpro.gov.br
// @require      http://code.jquery.com/jquery.min.js
// @require      https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @require      https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @require      https://cdn.jsdelivr.net/npm/gridjs/dist/gridjs.production.min.js
// @resource     gridcss  https://unpkg.com/gridjs/dist/theme/mermaid.min.css
// @resource     toastcss https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @grant        GM_addStyle
// @grant        GM_getMetadata
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// -----------------------------------------------------------------------------
// LOAD TOAST NOTIFICATIONS LIBRARY
// -----------------------------------------------------------------------------

// @require     https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource    toastcss  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css
// @grant       GM_addStyle
// @grant       GM_getResourceText

GM_addStyle( GM_getResourceText("toastcss") );
GM_addStyle( GM_getResourceText("gridcss") );

// -----------------------------------------------------------------------------
// PREVENT JQUERY CONFLICT
// -----------------------------------------------------------------------------

var $      = window.$;
var jQuery = window.jQuery;

this.$ = this.jQuery = jQuery.noConflict(true);

if (typeof $ == 'undefined') console.log('JQuery not found; The script will certainly fail');

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

(function() {

    $('#nav-groups-dropdown').clone().prop('id', 'btnKPI').appendTo('ul.navbar-sub-nav');
    $('#btnKPI > button.btn').text('KPI');
    //$('#btnKPI .frequent-items-dropdown-container').empty();

    var menu_mes = `
<ul>
<li id="jan" data-start="2020-01-01" data-end="2020-01-30"> <a> Janeiro   </a> </li>
<li id="fev" data-start="2020-02-01" data-end="2020-02-29"> <a> Fevereiro </a> </li>
<li id="mar" data-start="2020-03-01" data-end="2020-03-31"> <a> Março     </a> </li>
<li id="abr" data-start="2020-04-01" data-end="2020-04-30"> <a> Abril     </a> </li>
<li id="mai" data-start="2020-05-01" data-end="2020-05-31"> <a> Maio      </a> </li>
<li id="jun" data-start="2020-06-01" data-end="2020-06-30"> <a> Junho     </a> </li>
<li id="jul" data-start="2020-07-01" data-end="2020-07-30"> <a> Julho     </a> </li>
<li id="ago" data-start="2020-08-01" data-end="2020-08-31"> <a> Agosto    </a> </li>
<li id="set" data-start="2020-09-01" data-end="2020-09-30"> <a> Setembro  </a> </li>
<li id="out" data-start="2020-10-01" data-end="2020-10-31"> <a> Outubro   </a> </li>
<li id="nov" data-start="2020-11-01" data-end="2020-11-30"> <a> Novembro  </a> </li>
<li id="dez" data-start="2020-12-01" data-end="2020-12-31"> <a> Dezembro  </a> </li>
</ul>
`

var styles = `
.gridjs {
font-size: 1em;
}

td.gridjs-td {
padding: 5px;
}

input.gridjs-input {
padding: 5px;
}

table.gridjs-table {
text-align: center;
}

.frequent-items-dropdown-container {
height: unset;
}

.dropdown-menu {
max-width: unset;
}

.frequent-items-dropdown-container .frequent-items-dropdown-content {
width: unset;
}
`

var styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = styles
document.head.appendChild(styleSheet)



    const meu_cpf = $('a.header-user-dropdown-toggle').attr('href').replace(/\D/g, '');
    //var url = `https://git.serpro/api/v4/projects/8969/issues?assignee_username=${meu_cpf}&updated_after=2020-06-01&updated_before=2020-07-01&per_page=100`;
    const project_issues_url = (start, end) => `https://git.serpro/api/v4/projects/8969/issues?updated_after=${start}&updated_before=${end}&per_page=100`;

    $('#btnKPI .frequent-items-dropdown-sidebar').prop('id', 'sidebarKPI').html(menu_mes);
    $('#btnKPI .frequent-items-dropdown-content').prop('id', 'contentKPI').css({'font-size':'12px'}).empty();
    $('#btnKPI .dropdown-menu li a').css({'padding-top':'5px'});

    $('#sidebarKPI li').click(function(e) {
        //console.log();
        getJsonPages( project_issues_url( $(this).data('start'), $(this).data('end') ));
        return false;
    });

    // ---
    // Usar API para buscar os dados, filtrar os que preciso e descartar o resto
    // Iterar o json e filrar, mantendo somente os campos que vou mostrar na tabela
    // Deve estar autenticado no git para funcionar
    // ---

    var dadosFiltrados = {};
    var dadosTratados  = [];

    function getJsonPages(url) {
        $('#contentKPI').empty();
        var req = $.getJSON(url, function(jsondata) {
            var hdrlink, linknext, relnext;
            //dadosFiltrados = {...filtrarJson(jsondata), ...dadosFiltrados};
            dadosFiltrados = mergeDeep(filtrarJson(jsondata), dadosFiltrados);
            try {
                hdrlink  = req.getResponseHeader('link').split(',');
                relnext  = hdrlink.filter(l => l.toLowerCase().indexOf('rel="next"') > -1);
                linknext = decodeURIComponent(relnext[0].split('<')[1].split('>')[0]);
            }
            catch (e) {
                //console.log(e);
            }
            if (linknext) {
                getJsonPages(linknext);
            }
            else {
                dadosTratados = tratarDados(dadosFiltrados);
                montarTabela(['Nome', 'Issues', 'Horas', 'Media'], dadosTratados, 'contentKPI');
            }
        });
    }(project_issues_url);

    // ---
    // Filtrar o json e retornar somente os campos que vou usar
    // ---

    function filtrarJson(j) {
        var r = {};
        j.forEach((item) => {
            try {
                dt = {
                    closed_at: item.closed_at,
                    created_at: item.created_at,
                    due_date: item.due_date,
                    id: item.assignee.id,
                    name: item.assignee.name,
                    state: item.state,
                    total_time_spent: item.time_stats.total_time_spent,
                    title: item.title,
                    updated_at: item.updated_at
                };
            }
            catch (e) {
                //console.log(e);
            }
            key = dt.name.split(' ')[0] || dt.id;
            (r[key] = r[key] || []).push(dt);
        });
        return r;
    }

    // ---
    // Iterar os dados e retornar o json que ira para a tabela
    // Somar horas, contar issues, etc
    // ---

    function tratarDados(dados) {
        r = [];
        var nome, issues, segundos, horas;
        for (var k in dados) {
            nome     = dados[k][0].name.split(' ')[0];
            issues   = dados[k].length;
            segundos = dados[k].map(o => o.total_time_spent).reduce((a, c) => { return a + c });
            horas    = Math.floor(segundos / 60 / 60);
            media    = (horas / issues).toFixed(1);
            r.push([nome, issues, horas, media]);
        };
        console.log(dados)
        return r;
    }

    // ---
    // Montar tabela com as informacoes
    // ---

    function montarTabela(columns, data, elementID) {
        //$(`#${elementID}`).empty();
        const grid = new gridjs.Grid({
            columns: columns,
            search: true,
            data: data.sort(),
        }).render(document.getElementById(elementID));
    }

    /**
    * Performs a deep merge of objects and returns new object. Does not modify
    * objects (immutable) and merges arrays via concatenation.
    *
    * @param {...object} objects - Objects to merge
    * @returns {object} New object with merged key/values
    */

    function mergeDeep(...objects) {
        const isObject = obj => obj && typeof obj === 'object';

        return objects.reduce((prev, obj) => {
            Object.keys(obj).forEach(key => {
                const pVal = prev[key];
                const oVal = obj[key];

                if (Array.isArray(pVal) && Array.isArray(oVal)) {
                    prev[key] = pVal.concat(...oVal);
                }
                else if (isObject(pVal) && isObject(oVal)) {
                    prev[key] = mergeDeep(pVal, oVal);
                }
                else {
                    prev[key] = oVal;
                }
            });

            return prev;
        }, {});
    }

    // ---
    //
    // ---

    const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {})

})();

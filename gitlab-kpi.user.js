// ==UserScript==
// @name         GitLab Metrics
// @namespace    http://stackoverflow.com/users/982924/rasg
// @version      2020.06.15.0001
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
// Carregar css das bibliotecas
// -----------------------------------------------------------------------------

// @require  https://cdn.jsdelivr.net/npm/siiimple-toast/dist/siiimple-toast.min.js
// @resource toastcss https://cdn.jsdelivr.net/npm/siiimple-toast/dist/style.css

// @require  https://cdn.jsdelivr.net/npm/gridjs/dist/gridjs.production.min.js
// @resource gridcss https://unpkg.com/gridjs/dist/theme/mermaid.min.css

// @grant    GM_addStyle
// @grant    GM_getResourceText

GM_addStyle(GM_getResourceText("toastcss"));
GM_addStyle(GM_getResourceText("gridcss"));

var toast = siiimpleToast.setOptions({
    position: 'top|right',
    duration: 3000,
});

var colunas = ['Nome', 'Issues', 'Horas', 'H/Dia', 'H/Issue'];
const grid = new gridjs.Grid({
    columns: colunas,
    data: colunas,
});

// -----------------------------------------------------------------------------
// Tentar evitar conflito deste jquery com o carregado pela pagina
// -----------------------------------------------------------------------------

var $ = window.$;
var jQuery = window.jQuery;

this.$ = this.jQuery = jQuery.noConflict(true);

var msg_jqnotfound = 'JQuery not found; The script will certainly fail';
if (typeof $ == 'undefined') {
    console.log(msg_jqnotfound);
    toast.alert(msg_jqnotfound);
}

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

(function () {

    var menu_mes = `
<ul id="meses">
<li id="1"  tabindex="1"  data-start="2020-01-01" data-end="2020-01-30"> <a> Janeiro   </a> </li>
<li id="2"  tabindex="2"  data-start="2020-02-01" data-end="2020-02-29"> <a> Fevereiro </a> </li>
<li id="3"  tabindex="3"  data-start="2020-03-01" data-end="2020-03-31"> <a> Março     </a> </li>
<li id="4"  tabindex="4"  data-start="2020-04-01" data-end="2020-04-30"> <a> Abril     </a> </li>
<li id="5"  tabindex="5"  data-start="2020-05-01" data-end="2020-05-31"> <a> Maio      </a> </li>
<li id="6"  tabindex="6"  data-start="2020-06-01" data-end="2020-06-30"> <a> Junho     </a> </li>
<li id="7"  tabindex="7"  data-start="2020-07-01" data-end="2020-07-30"> <a> Julho     </a> </li>
<li id="8"  tabindex="8"  data-start="2020-08-01" data-end="2020-08-31"> <a> Agosto    </a> </li>
<li id="9"  tabindex="9"  data-start="2020-09-01" data-end="2020-09-30"> <a> Setembro  </a> </li>
<li id="10" tabindex="10" data-start="2020-10-01" data-end="2020-10-31"> <a> Outubro   </a> </li>
<li id="11" tabindex="11" data-start="2020-11-01" data-end="2020-11-30"> <a> Novembro  </a> </li>
<li id="12" tabindex="12" data-start="2020-12-01" data-end="2020-12-31"> <a> Dezembro  </a> </li>
</ul>
`

    var styles = `
#meses li:focus {
background-color: #eee;
}

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

#btnKPI .dropdown-menu li a {
padding-top: 5px;
}

#btnKPI .frequent-items-dropdown-content {
font-size: 12px;
}
`

    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    $('#nav-groups-dropdown').clone().prop('id', 'btnKPI').appendTo('ul.navbar-sub-nav');
    $('#btnKPI > button.btn').text('KPI');
    $('#btnKPI').click(() => $(`#meses #${mes}`).click());

    const meu_cpf = $('a.header-user-dropdown-toggle').attr('href').replace(/\D/g, '');
    const minhas_issues_url = (start, end) => `https://git.serpro/api/v4/projects/8969/issues?updated_after=${start}&updated_before=${end}&per_page=100&assignee_username=${meu_cpf}`;
    const project_issues_url = (start, end) => `https://git.serpro/api/v4/projects/8969/issues?updated_after=${start}&updated_before=${end}&per_page=100`;

    // ---
    // diasNoMes() : Retornar quantos dias ha no mes passado como parametro
    // diasUteisNoMes() : Retornar quantos dias uteis ha no mes passado como parametro
    // diasUteisAteHoje() : Retornar quantos dias uteis ha no mes corrente, ate a data de hoje
    // diasUteisNoMesOuAteHoje() : Retornar quantos dias uteis ha no mes passado como parametro, ou ate a data de hoje se for o mes corrente
    // ---

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const dia = hoje.getDate();

    const diasNoMes = (...args) => (args.length == 0) ? new Date(ano, mes, 0).getDate() : new Date(args).getDate() + 1;

    const diasUteisNoMes = (...args) => {
        var du = diasNoMes(args);
        var y = new Date(args).getFullYear();
        var m = new Date(args).getMonth();
        for (var d = 0; d < du; d++) {
            var t = new Date(y, m, d);
            if (t.getDay(d) == 0 || t.getDay(d) == 6) du--;
        }
        return du;
    };
    console.log('diasUteisNoMes1', diasUteisNoMes());
    console.log('diasUteisNoMes2', diasUteisNoMes('2020-02-01'));
    console.log('diasUteisNoMes3', diasUteisNoMes('2020-02-29'));
    console.log('diasUteisNoMes4', diasUteisNoMes('2020-03-01'));
    console.log('diasUteisNoMes5', diasUteisNoMes('2020-03-30'));
    console.log('diasUteisNoMes6', diasUteisNoMes('2020-06-30'));

    const diasUteisAteHoje = () => {
        var du = dia;
        for (var d = 0; d < dia; d++) {
            var t = new Date(ano, mes, d);
            if (t.getDay(d) == 0 || t.getDay(d) == 6) du--;
        }
        console.log('diasUteisAteHoje du', du);
        return du;
    };

    const diasUteisNoMesOuAteHoje = (...args) => (args.length == 0) ? diasUteisAteHoje() : diasUteisNoMes(args);

    // ---
    //
    // ---

    $('#btnKPI .frequent-items-dropdown-sidebar').prop('id', 'sidebarKPI').html(menu_mes);
    $('#btnKPI .frequent-items-dropdown-content').prop('id', 'contentKPI').empty();

    // ---
    // Atualizar o grid quando o usuario clica no menu
    // ---

    $('#sidebarKPI li').click(function (e) {
        var u = project_issues_url($(this).data('start'), $(this).data('end'));

        grid.updateConfig({
            data: () => getAllData(u).then(resolve => {
                console.log('updateConfig resolve', resolve);
                return resolve;
            })
        });

        try { grid.forceRender(); }
        catch (e) { grid.render(document.getElementById('contentKPI')); }

        return false;
    });

    // ---
    //
    // ---

    function getAllData(url) {
        var dadosFiltrados = {};
        var dadosTratados = [];

        function recursiveCall(url, resolve, reject) {

            var req = $.getJSON(url, (jsondata) => {
                var hdrlink, linknext, relnext;
                dadosFiltrados = mergeDeep(filtrarJson(jsondata), dadosFiltrados);
                try {
                    hdrlink = req.getResponseHeader('link').split(',');
                    relnext = hdrlink.filter(l => l.toLowerCase().indexOf('rel="next"') > -1);
                    linknext = decodeURIComponent(relnext[0].split('<')[1].split('>')[0]);
                }
                catch (e) {
                    //console.log(e);
                }
                if (linknext) {
                    console.log('recursiveCall if dadosTratados', dadosTratados)
                    recursiveCall(linknext, resolve, reject);
                }
                else {
                    dadosTratados = tratarDados(dadosFiltrados);
                    console.log('recursiveCall else dadosTratados', dadosTratados)
                    resolve(dadosTratados);
                }
            });
        }

        return new Promise((resolve, reject) => {
            recursiveCall(url, resolve, reject);
        });
    }

    // ---
    // Filtrar o json e retornar somente os campos que vou usar
    // ---

    function filtrarJson(j) {
        var r = {};
        var dt, key;
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
    // Iterar os dados e retornar os arrays que irao para a tabela
    // Somar horas, contar issues, etc
    // ---

    function tratarDados(dados) {
        const r = [];
        var nome, issues, segundos, horas, media_d, media_i;
        for (var k in dados) {
            nome = dados[k][0].name.split(' ')[0];
            issues = dados[k].length;
            segundos = dados[k].map(o => o.total_time_spent).reduce((a, c) => { return a + c });
            horas = Math.floor(segundos / 60 / 60);
            media_d = (horas / diasUteisNoMesOuAteHoje()).toFixed(1);
            media_i = (horas / issues).toFixed(1);
            r.push([nome, issues, horas, media_d, media_i]);
        };
        console.log('tratarDados dados', dados)
        return r;
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
})();

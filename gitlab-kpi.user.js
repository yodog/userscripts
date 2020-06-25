// ==UserScript==
// @name         GitLab Metrics
// @namespace    http://stackoverflow.com/users/982924/rasg
// @version      2020.06.25.0720
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
// @icon         https://www.google.com/s2/favicons?domain=mail.serpro.gov.br
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
// OPTIONS / CONFIG MENU
// -----------------------------------------------------------------------------

var parametros = {
    project_id: { type: 'number', default: 8969 },
    campo_data_inicial: { type: 'select', choices: [ 'created_after', 'updated_after' ], default: 'updated_after', variant: "radio" },
    campo_data_final: { type: 'select', choices: [ 'created_before', 'updated_before' ], default: 'created_before', variant: "radio" },
    order_by: { type: 'select', choices: [ 'created_at', 'due_date', 'label_priority', 'milestone_due', 'popularity', 'priority', 'updated_at' ], default: 'created_at' },
    labels: { type: 'text', default: '' },
    per_page: { type: 'number', default: 100 },
    scope: { type: 'select', choices: [ 'all', 'assigned_to_me', 'created_by_me' ], default: 'assigned_to_me' },
    sort: { type: 'select', choices: [ 'asc', 'desc' ], default: 'asc', variant: "radio" },
    state: { type: 'select', choices: [ 'all', 'closed', 'opened' ], default: 'all', variant: "radio" },
};

var cfg;
try {
    cfg = new MonkeyConfig({
        title:       'Config GitLab Metrics',
        menuCommand: true,
        onSave:      function() { fnSaveChanges(); },
        params:      parametros
    });
    console.log("MonkeyConfig loaded; The settings menu will be enabled");
}
catch(err) {
    console.log(err.message);
    console.log("MonkeyConfig not loaded; The settings menu will be disabled");
    cfg = {
        params: parametros,
        get: function get(name) { return GM_getValue(name, this.params[name].default) }
    }
}

// -----------------------------------------------------------------------------
// START
// -----------------------------------------------------------------------------

(function () {

    // ---
    // CSS
    // ---

    var menu_mes = `
<ul class="menu_mes" id="menuconfig">
<li id="c" tabindex="1"> <a> Configuracoes </a> </li>
</ul>

<ul class="menu_mes" id="menumeses">
<li id="1"  tabindex="1"  data-start="2020-01-01" data-end="2020-01-30T23:59"> <a> Janeiro   </a> </li>
<li id="2"  tabindex="2"  data-start="2020-02-01" data-end="2020-02-29T23:59"> <a> Fevereiro </a> </li>
<li id="3"  tabindex="3"  data-start="2020-03-01" data-end="2020-03-31T23:59"> <a> Março     </a> </li>
<li id="4"  tabindex="4"  data-start="2020-04-01" data-end="2020-04-30T23:59"> <a> Abril     </a> </li>
<li id="5"  tabindex="5"  data-start="2020-05-01" data-end="2020-05-31T23:59"> <a> Maio      </a> </li>
<li id="6"  tabindex="6"  data-start="2020-06-01" data-end="2020-06-30T23:59"> <a> Junho     </a> </li>
<li id="7"  tabindex="7"  data-start="2020-07-01" data-end="2020-07-30T23:59"> <a> Julho     </a> </li>
<li id="8"  tabindex="8"  data-start="2020-08-01" data-end="2020-08-31T23:59"> <a> Agosto    </a> </li>
<li id="9"  tabindex="9"  data-start="2020-09-01" data-end="2020-09-30T23:59"> <a> Setembro  </a> </li>
<li id="10" tabindex="10" data-start="2020-10-01" data-end="2020-10-31T23:59"> <a> Outubro   </a> </li>
<li id="11" tabindex="11" data-start="2020-11-01" data-end="2020-11-30T23:59"> <a> Novembro  </a> </li>
<li id="12" tabindex="12" data-start="2020-12-01" data-end="2020-12-31T23:59"> <a> Dezembro  </a> </li>
</ul>
`

    var styles = `
.menu_mes {
cursor: default;
}

.menu_mes li.clicado {
background-color: #fee;
}

#menuconfig {
border-bottom: 1px solid gainsboro;
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

.frequent-items-dropdown-container {
width: 550px;
}

.frequent-items-dropdown-container .frequent-items-dropdown-content {
width: unset;
}

.frequent-items-dropdown-container .frequent-items-dropdown-sidebar, .frequent-items-dropdown-container .frequent-items-dropdown-content {
padding: unset;
}

.gridjs-container, .gridjs-wrapper, table.gridjs-table {
height: 100%;
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

    // ---
    // Botao KPI
    // ---

    $('#nav-groups-dropdown').clone().prop('id', 'btnKPI').appendTo('ul.navbar-sub-nav');
    $('#btnKPI > button.btn').text('KPI');
    $('#btnKPI').click(() => $(`#menumeses #${mes}`).click());

    $('#btnKPI .frequent-items-dropdown-sidebar').prop('id', 'sidebarKPI').html(menu_mes);
    $('#btnKPI .frequent-items-dropdown-content').prop('id', 'contentKPI').empty().click(() => false);

    // ---
    // Endpoints
    // ---

    const meu_cpf = $('a.header-user-dropdown-toggle').attr('href').replace(/\D/g, '');

    const project_issues_url = (start, end) => {
        var pid = cfg.get("project_id");
        var cdi = cfg.get("campo_data_inicial");
        var cdf = cfg.get("campo_data_final");
        var oby = cfg.get("order_by");
        var lbl = cfg.get("labels");
        var ppg = cfg.get("per_page");
        var scp = cfg.get("scope");
        var srt = cfg.get("sort");
        var stt = cfg.get("state");

        return `https://git.serpro/api/v4/projects/${pid}/issues?${cdi}=${start}&${cdf}=${end}&order_by=${oby}&per_page=${ppg}&scope=${scp}&sort=${srt}&state=${stt}&labels=${lbl}&assignee_id=any`;
    }

    const minhas_issues_url = (start, end) => project_issues_url(start, end).replace(/assignee_id=any/, `assignee_username=${meu_cpf}`);

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

    const diasUteisAteHoje = () => {
        var du = dia;
        for (var d = 0; d < dia; d++) {
            var t = new Date(ano, mes, d);
            if (t.getDay(d) == 0 || t.getDay(d) == 6) du--;
        }
        return du;
    };

    const diasUteisNoMesOuAteHoje = (...args) => (args.length == 0) ? diasUteisAteHoje() : diasUteisNoMes(args);

    // ---
    // Atualizar o grid quando o usuario clica no menu
    // ---

    $('#sidebarKPI #menuconfig li').click(function (e) {
        cfg.open();
        return false;
    });

    $('#sidebarKPI #menumeses li').click(function (e) {
        $(this).addClass('clicado');
        $(this).siblings().removeClass('clicado');
        var u = project_issues_url( $(this).data('start'), $(this).data('end') );
        grid.updateConfig({
            data: () => getAllData(u).then(dados => dados.sort()),
            autoWidth: false,
        });
        try { grid.forceRender(); }
        catch (e) { grid.render(document.getElementById('contentKPI')); }
        return false;
    });

    // ---
    // A API do gitlab retorna dados paginados (header rel="next")
    // Esta funcao vai requisitando cada pagina e acumulando para processar depois
    // ---

    function getAllData(url) {
        var dadosFiltrados = {};
        var dadosTratados = [];
        let pagina = 0;

        function recursiveCall(url, resolve, reject) {
            let erros = 0;
            pagina++;
            var req = $.getJSON(url, (jsondata) => {
                var hdrlink, linknext, relnext;
                dadosFiltrados = mergeDeep(filtrarJson(jsondata), dadosFiltrados);
                try {
                    hdrlink = req.getResponseHeader('link').split(',');
                    relnext = hdrlink.filter(l => l.toLowerCase().indexOf('rel="next"') > -1);
                    linknext = decodeURIComponent(relnext[0].split('<')[1].split('>')[0]);
                }
                catch (e) {
                    console.log(e.message);
                    erros++;
                }
                if (linknext) {
                    recursiveCall(linknext, resolve, reject);
                }
                else {
                    dadosTratados = tratarDados(dadosFiltrados);
                    resolve(dadosTratados);
                }
            });
            let msg_erros = `${erros} paginas nao foram carregadas`;
            if (erros > 0) {
                console.log(msg_erros);
                toast.alert(msg_erros);
            }
            toast.message(`carregando pagina ${pagina}`);
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
        let erros = 0;
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
                key = dt.name.split(' ')[0] || dt.id;
                (r[key] = r[key] || []).push(dt);
            }
            catch (e) {
                console.log(e.message);
                erros++;
            }
        });
        let msg_erros = `${erros} registros nao foram filtrados`;
        if (erros > 0) {
            console.log(msg_erros);
            toast.alert(msg_erros);
        }
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

// -----------------------------------------------------------------------------

function fnSaveChanges() {

    $('body').on("click", "#reloadnow", function() {
        $(this).fadeOut("fast", function() { document.location.reload(false); });
    });

    var msg_success = 'Settings saved';
    toast.success(msg_success);

    var msg_reload = '<span id="reloadnow"> Some changes will be applied after you reload the page. <br> Click here to reload now </span>';
    toast.message(msg_reload, { delay: 3000, duration: 7000 });
}

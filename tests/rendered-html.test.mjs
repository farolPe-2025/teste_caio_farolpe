import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: {
        accept: "text/html",
        host: "localhost",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("mantem o panorama contido e rolavel em telas pequenas", async () => {
  const panorama = await readFile(
    new URL("../public/painel-conjuntura-2026-08-13.html", import.meta.url),
    "utf8",
  );

  assert.match(
    panorama,
    /@media \(max-width:640px\)[\s\S]*?html,body\{width:100%; max-width:100%; overflow-x:hidden;\}/,
  );
  assert.match(
    panorama,
    /\.blocogrid>div\{width:100%; min-width:0; overflow:hidden;\}/,
  );
  assert.match(
    panorama,
    /\.blocogrid \.colchart\{[^}]*overflow-x:auto;[^}]*touch-action:pan-x pan-y;/,
  );
  assert.match(
    panorama,
    /\.blocogrid \.tblscroll\{[^}]*overflow-x:auto;[^}]*touch-action:pan-x pan-y;/,
  );
  assert.equal((panorama.match(/class="tblscroll trab-table-scroll"/g) ?? []).length, 2);
  assert.match(
    panorama,
    /\.trab-table-scroll table\.mini\{width:100%; min-width:640px; table-layout:fixed;\}/,
  );
  assert.match(
    panorama,
    /\.trab-table-scroll table\.mini th:first-child,[\s\S]*?position:sticky; left:0;/,
  );
  assert.match(
    panorama,
    /initialScrollers=document\.querySelectorAll\('\.colchart,\.tblwrap,\.tblscroll'\)/,
  );
  assert.match(
    panorama,
    /Cabeçalho do Panorama[\s\S]*?\.siteheader\{[\s\S]*?min-height:350px;[\s\S]*?background:#F5F9FB;/,
  );
  assert.match(
    panorama,
    /\.site-eyebrow::before\{[\s\S]*?background:#F7A600;/,
  );
  assert.match(
    panorama,
    /\.site-h1\{[\s\S]*?color:#000;[\s\S]*?font-size:clamp\(42px,4vw,56px\);[\s\S]*?white-space:nowrap;/,
  );
  assert.match(
    panorama,
    /\.dcard::after\{z-index:0; background:var\(--blue-100\);\}/,
  );
  assert.match(
    panorama,
    /Crescimento mensal<span>jun\/2026 sobre mai\/2026<\/span>/,
  );
  assert.match(
    panorama,
    /Crescimento interanual<span>jun\/2026 sobre jun\/2025<\/span>/,
  );
  assert.match(
    panorama,
    /Crescimento acumulado no ano<span>jan a jun\/2026 sobre jan a jun\/2025<\/span>/,
  );
  assert.match(
    panorama,
    /Crescimento acumulado em 12 meses<span>jul\/25 a jun\/26 sobre jul\/24 a jun\/25<\/span>/,
  );
  assert.equal(
    (panorama.match(/Indústria geral \(PIM-PF\)/g) ?? []).length,
    4,
  );
  assert.equal((panorama.match(/Dados referentes a/g) ?? []).length, 0);
  assert.equal(
    (panorama.match(/Atividade econômica \(IBCR\)<\/div>/g) ?? []).length,
    4,
  );
  assert.match(panorama, /@media \(max-width:720px\)[\s\S]*?\.site-h1\{[^}]*white-space:normal;/);
});

test("renderiza a home institucional do FarolPE", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const source = await readFile(
    new URL("../app/FarolPortal.tsx", import.meta.url),
    "utf8",
  );
  assert.match(html, /<html lang="pt-BR">/i);
  assert.match(html, /SDEC_FAROLPE_ICONE_SITE\.png/);
  assert.match(html, /FarolPE/i);
  assert.match(html, /Ver com clareza\./);
  assert.match(html, /Decidir com segurança\./);
  assert.match(html, /Navegue pelos dados/);
  assert.match(html, /Painéis dos Dados/);
  assert.doesNotMatch(html, /\/noticias/i);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.match(html, /class="home-more-strip"[\s\S]*?Veja mais/);
  assert.match(
    source,
    /getElementById\("home-analysis"\)[\s\S]*?scrollIntoView/,
  );
  assert.match(html, /<section id="home-analysis" class="home-analysis"/);
  assert.match(
    stylesheet,
    /\.reference-home \{[^}]*min-height: 100dvh;[^}]*url\("\/farol-home\.jpg"\)/,
  );
  assert.match(
    stylesheet,
    /\.home-more-strip \{\s*bottom: clamp\(56px, 7vh, 84px\);\s*border: 0;\s*background: transparent;\s*pointer-events: none;/,
  );
  assert.match(
    stylesheet,
    /\.home-more-strip button \{[^}]*color: #fff;[^}]*pointer-events: auto;/,
  );
  assert.match(
    stylesheet,
    /\.home-page > \.home-footer \.sdec-lockup \{[\s\S]*?align-self: center;[\s\S]*?align-items: center;/,
  );
  assert.match(
    stylesheet,
    /\.home-page > \.home-footer \.sdec-logo-crop \{\s*margin-block: auto;/,
  );
});

test("remove as faixas multicoloridas do menu e da home", async () => {
  const homeResponse = await render("/");
  const homeHtml = await homeResponse.text();
  const panelResponse = await render("/paineis/atividade-economica");
  const panelHtml = await panelResponse.text();
  const source = await readFile(
    new URL("../app/FarolPortal.tsx", import.meta.url),
    "utf8",
  );
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(homeHtml, /pe-color-rule/);
  assert.doesNotMatch(panelHtml, /pe-stripe/);
  assert.doesNotMatch(source, /pe-color-rule|pe-stripe/);
  assert.doesNotMatch(stylesheet, /\.pe-color-rule|\.pe-stripe|sidebarStripeIn/);
});

test("abre os painéis prontos pelos cards da leitura rápida", async () => {
  const response = await render("/");
  const html = await response.text();
  const dataSource = await readFile(
    new URL("../app/portal-data.ts", import.meta.url),
    "utf8",
  );
  const summaryKpis = dataSource.match(/export const summaryKpis = \[[\s\S]*?\n\];/)?.[0] ?? "";

  assert.equal((html.match(/class="analysis-card-link"/g) ?? []).length, 3);
  assert.match(html, /aria-label="Abrir painel de Atividade econômica \(IBCR\/BCB\)"/);
  assert.match(html, /aria-label="Abrir painel de Produção industrial \(PIM\/IBGE\)"/);
  assert.match(html, /aria-label="Abrir painel de Comércio varejista restrito \(PMC\/IBGE\)"/);
  assert.doesNotMatch(html, /aria-label="Abrir painel de Saldo de empregos formais"/);
  assert.match(summaryKpis, /label: "Atividade econômica[\s\S]*?panelHref: "\/paineis\/atividade-economica"/);
  assert.match(summaryKpis, /label: "Produção industrial[\s\S]*?panelHref: "\/paineis\/industria"/);
  assert.match(summaryKpis, /label: "Comércio varejista[\s\S]*?panelHref: "\/paineis\/comercio"/);
  assert.match(summaryKpis, /label: "Saldo de empregos formais"[\s\S]*?panelHref: null/);

  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(stylesheet, /\.home-analysis \.analysis-card-link::after \{[\s\S]*?content: "→";/);
  assert.match(stylesheet, /\.home-analysis \.analysis-card-link:hover::after,[\s\S]*?transform: translateX\(3px\);/);
});

test("renderiza rotas internas por URL", async () => {
  for (const path of [
    "/panorama",
    "/sobre",
    "/publicacoes",
    "/dicionario-de-dados",
    "/paineis/agricultura",
    "/temas/agriculture",
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200, `esperava 200 em ${path}`);
    const html = await response.text();
    assert.match(html, /FarolPE/i);
  }
});

test("protege o carregamento do iframe até a hidratação", async () => {
  const response = await render("/paineis/agricultura");
  const html = await response.text();
  const iframes = html.match(/<iframe\b/gi) ?? [];

  assert.equal(iframes.length, 0);
  assert.match(html, /class="iframe-wrap"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /data-frame-state="loading"/);
  assert.match(html, /class="lighthouse-loader-icon"/);
  assert.doesNotMatch(html, /app\.powerbi\.com|app\.fabric\.microsoft\.com/);
});

test("aplica a centralização padrão a qualquer painel incorporado", async () => {
  for (const path of [
    "/paineis/industria",
    "/paineis/atividade-economica",
    "/paineis/servicos",
    "/paineis/turismo",
    "/paineis/agricultura",
    "/paineis/aquicultura",
    "/paineis/origem-animal",
    "/paineis/rebanhos",
  ]) {
    const response = await render(path);
    const html = await response.text();
    assert.match(html, /panel-page is-embedded/);
    assert.doesNotMatch(html, /is-powerbi|is-fabric/);
  }

  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(
    stylesheet,
    /@media \(min-width: 861px\)[\s\S]*?\.panel-page\.is-embedded \.panel-stage[\s\S]*?place-items: center/,
  );
  assert.match(
    stylesheet,
    /\.panel-page\.is-embedded \.iframe-wrap[\s\S]*?width: min\(100%, 1680px\)/,
  );
  assert.match(
    stylesheet,
    /@media \(min-width: 1360px\)[\s\S]*?\.panel-page\.is-embedded \.panel-stage[\s\S]*?padding: 0/,
  );
  assert.match(
    stylesheet,
    /@media \(min-width: 1360px\)[\s\S]*?\.panel-page\.is-embedded \.iframe-wrap[\s\S]*?width: 100%[\s\S]*?height: 100%/,
  );
  assert.match(
    stylesheet,
    /\.panel-page\.is-embedded \.iframe-wrap::after \{[\s\S]*?height: 76px;[\s\S]*?background: #f5f9fb;[\s\S]*?pointer-events: none;/,
  );
  assert.match(
    stylesheet,
    /@media \(max-width: 860px\)[\s\S]*?\.panel-page\.is-embedded \.iframe-wrap::after \{ height: 76px; \}/,
  );
  assert.match(
    stylesheet,
    /\.panel-page\.is-embedded[\s\S]*?\.iframe-wrap:not\(\[data-frame-state="ready"\]\)::after \{[\s\S]*?background: #f5f9fb;/,
  );
});

test("mantém a busca acessível no menu superior", async () => {
  const response = await render("/paineis/atividade-economica");
  const html = await response.text();
  const source = await readFile(
    new URL("../app/FarolPortal.tsx", import.meta.url),
    "utf8",
  );
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(html, /class="top-navigation-search"/);
  assert.match(html, /aria-label="Pesquisar no FarolPE"/);
  assert.match(html, /<span>Buscar<\/span><kbd>\/<\/kbd>/);
  assert.match(source, /return <Search className="search-glyph"/);
  assert.match(stylesheet, /\.top-navigation-search \{[\s\S]*?grid-template-columns: auto auto auto;/);
  assert.match(
    stylesheet,
    /@media \(max-width: 1100px\)[\s\S]*?\.top-navigation-search span,[\s\S]*?display: none;/,
  );
});

test("organiza a navegação superior com ícones, temas e subgrupos", async () => {
  const response = await render("/paineis/atividade-economica");
  const html = await response.text();
  const source = await readFile(
    new URL("../app/FarolPortal.tsx", import.meta.url),
    "utf8",
  );
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(html, /class="portal-shell has-top-navigation"/);
  assert.match(html, /class="top-navigation"/);
  assert.match(html, /class="top-navigation-menu /);
  assert.match(html, /class="top-nav-link is-active"[\s\S]*?Painéis/);
  assert.doesNotMatch(html, /class="sidebar|class="mobile-topbar/);
  assert.doesNotMatch(source, /function Sidebar\(/);

  for (const icon of [
    "House",
    "Compass",
    "LayoutGrid",
    "ChartNoAxesCombined",
    "Building2",
    "HandCoins",
    "Leaf",
    "Users",
    "Download",
    "FileText",
    "Info",
  ]) {
    assert.match(source, new RegExp(`\\b${icon}\\b`));
  }

  for (const label of [
    "Dinâmica Econômica",
    "Estrutura Setorial",
    "Produção e Renda",
    "Agropecuária",
    "Emprego",
    "Mercado de Trabalho",
    "Vínculos Formais",
  ]) {
    assert.ok(source.includes(label), `item esperado: ${label}`);
  }

  assert.match(source, /className="top-panels-cascade"/);
  assert.match(source, /className="top-cascade-group"/);
  assert.match(source, /top-cascade-group-link/);
  assert.match(source, /top-cascade-group-toggle/);
  assert.match(source, /onMouseEnter=\{openPanelsMenu\}/);
  assert.match(source, /onMouseEnter=\{\(\) => setOpenPanelGroup\(group\.id\)\}/);
  assert.match(source, /onFocus=\{\(\) => setOpenPanelGroup\(group\.id\)\}/);
  assert.match(source, /className="top-panel-subgroup"/);
  assert.doesNotMatch(source, /top-cascade-all|Ver todos os painéis/);
  assert.match(stylesheet, /\.top-panels-cascade \{[\s\S]*?width: 270px;/);
  assert.match(stylesheet, /\.top-cascade-submenu \{[\s\S]*?left: 100%;[\s\S]*?width: 330px;/);
});

test("usa o símbolo atual nos painéis em preparação", async () => {
  const response = await render("/paineis/estoque-de-emprego");
  const html = await response.text();

  assert.match(html, /class="empty-panel-icon"/);
  assert.match(html, /SDEC_FAROLPE_SÍMBOLO_SITE_v2\.png/);
});

test("mantém na busca os mesmos nomes exibidos no menu", async () => {
  const source = await readFile(
    new URL("../app/portal-data.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /label:\s*panel\.shortTitle/);
  assert.doesNotMatch(source, /label:\s*panel\.title/);
  assert.doesNotMatch(source, /label:\s*`Sobre\s/);
  assert.doesNotMatch(source, /\/noticias/i);
});

test("organiza o acesso aos dados pelos mesmos temas dos painéis", async () => {
  const response = await render("/dicionario-de-dados");
  const html = await response.text();
  const catalog = html.match(/<section class="dictionary-list"[\s\S]*?<\/section>/)?.[0] ?? "";
  const catalogText = catalog
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")");

  assert.equal(response.status, 200);
  assert.match(html, /Acesse os dados/);
  assert.match(html, /Escolha o tema de seu interesse/);
  assert.match(html, /Acessar dados/);
  assert.match(html, /https:\/\/forms\.gle\/Ky4y4akU6UJJ3GTv7/);
  assert.match(html, /https:\/\/forms\.gle\/eeio4YLBs8V47fKE7/);
  assert.match(html, /https:\/\/forms\.gle\/7G81FS6xyxwVhHjj6/);
  assert.equal(catalog.match(/<article class="dictionary-card[^\"]*"/g)?.length, 5);

  for (const theme of [
    "Dinâmica Econômica",
    "Estrutura Setorial",
    "Produção e Renda",
    "Agropecuária",
    "Emprego",
  ]) {
    assert.ok(catalogText.includes(theme), `catálogo deveria conter ${theme}`);
  }

  assert.equal(catalog.match(/Disponível em breve/g)?.length, 2);

  assert.doesNotMatch(html, /Buscar termo no dicionário|termos disponíveis/);
});

test("estrutura publicações oficiais com filtros", async () => {
  const response = await render("/publicacoes");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Tipo de publicação/);
  assert.match(html, /Notas Técnicas/);
  assert.match(html, /Notícias de PE/);
  assert.match(html, /Relatórios Analíticos/);
  assert.match(html, /Boletins Econômicos/);
  assert.match(html, /Janela de tempo/);
  assert.match(html, /Últimos 30 dias/);
  assert.match(html, /Dinâmica empresarial de Pernambuco em junho de 2026/);
  assert.match(html, /12\.226 empresas/);
  assert.match(html, /Relatório Analítico Setorial: Piscicultura de Pernambuco/);
  assert.match(html, /piscicultura da tilápia/);
  assert.match(html, /Acessar publicação/);
  assert.match(html, /1SEgyO4ynuPrVY3zeXbGKrafxkQS5Rr3/);
  assert.match(html, /15JXPhjlnoo4Lqm_AMG9MKz52RDeZL2Uu/);
  assert.doesNotMatch(html, /Exemplo|clipping|Diario de Pernambuco/i);
  assert.equal(html.match(/class="publication-card"/g)?.length, 2);
});

test("abre resumos nos temas e os painéis diretamente nos itens internos", async () => {
  const panelResponse = await render("/paineis/estoque-de-emprego");
  const panelHtml = await panelResponse.text();
  const themeResponse = await render("/temas/economic");
  const themeHtml = await themeResponse.text();
  const source = await readFile(
    new URL("../app/FarolPortal.tsx", import.meta.url),
    "utf8",
  );
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  for (const html of [panelHtml, themeHtml]) {
    assert.match(html, /class="top-nav-link is-active"[\s\S]*?Painéis/);
  }

  assert.match(panelHtml, /Painel em preparação/);
  assert.equal(themeResponse.status, 200);
  assert.match(themeHtml, /Tema dos painéis/);
  assert.match(themeHtml, /Dinâmica Econômica/);
  assert.match(themeHtml, /O que você encontra/);
  assert.match(themeHtml, /Atividade Econômica/);
  assert.match(themeHtml, /Explorar primeiro painel/);
  assert.match(source, /activePanelSlug === panel\.slug/);
  assert.match(source, /className=\{`top-menu-panel-link[\s\S]*?active \? "is-active"/);
  assert.match(source, /go\(`\/paineis\/\$\{panel\.slug\}`\)/);
  assert.match(source, /go\(`\/temas\/\$\{group\.id\}`\)/);
  assert.doesNotMatch(source, /\/indicadores\//);
  assert.match(stylesheet, /\.top-nav-link\.is-active::after \{[\s\S]*?background: var\(--brand-yellow\);/);
  assert.match(stylesheet, /\.top-menu-panel-link\.is-active \{[\s\S]*?box-shadow: inset 3px 0 var\(--brand-yellow\);/);
});

test("abre Panorama diretamente e mantém o menu de painéis acessível", async () => {
  const source = await readFile(
    new URL("../app/FarolPortal.tsx", import.meta.url),
    "utf8",
  );
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const panoramaDocument = await readFile(
    new URL("../public/painel-conjuntura-2026-08-13.html", import.meta.url),
    "utf8",
  );

  assert.match(source, /onClick=\{\(\) => go\("\/panorama"\)\}/);
  assert.doesNotMatch(source, /panorama-top-menu|panoramaTopics|storePanoramaTopic/);
  assert.match(source, /aria-controls="panels-top-menu"/);
  assert.match(source, /aria-expanded=\{openMenu === "panels"\}/);
  assert.match(source, /aria-controls=\{submenuId\}/);
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.doesNotMatch(source, /top-cascade-all|Ver todos os painéis/);
  assert.match(source, /event\.key !== "Escape"/);
  assert.match(source, /document\.addEventListener\("pointerdown", closeNavigation\)/);
  assert.match(source, /window\.addEventListener\("popstate", closeForHistoryNavigation\)/);
  assert.match(source, /document\.body\.classList\.toggle\("portal-menu-open", mobileMenuOpen\)/);
  assert.match(source, /tabIndex=\{mobileOpen \? 0 : -1\}/);
  assert.match(source, /farol-panorama-select/);
  assert.match(panoramaDocument, /farol-panorama-select/);
  assert.match(panoramaDocument, /farol-panorama-section/);
  assert.match(panoramaDocument, /<nav class="sitenav">/);
  assert.match(panoramaDocument, />Panorama geral<\/button>/);
  assert.match(panoramaDocument, />Calendário de Dados<\/button>/);
  assert.doesNotMatch(panoramaDocument, /html\.is-embedded \.sitenav\s*\{\s*display\s*:\s*none/);
  assert.match(stylesheet, /\.top-cascade-submenu \{[\s\S]*?max-height: min\(600px,[\s\S]*?overflow-y: auto;/);
  assert.match(stylesheet, /@media \(max-width: 1100px\)[\s\S]*?\.top-cascade-submenu \{[\s\S]*?position: static;[\s\S]*?max-height: none;/);
});

test("conclui a página Sobre com cabeçalho textual e equipe ampliada", async () => {
  const response = await render("/sobre");
  const html = await response.text();

  assert.doesNotMatch(html, /Farol%20de%20Olinda2\.jpg|about-photo/);
  assert.match(html, /Pedro Leonardo Lacerda/);
  assert.match(html, /Secretário Executivo de Atração de Investimentos e Estudos Econômicos/);
  assert.match(html, /Danielle Jar/);
  assert.match(html, /Secretária de Desenvolvimento Econômico/);
  assert.doesNotMatch(html, /O FarolPE é uma plataforma pública de inteligência socioeconômica/);
});

test("adiciona o link oficial da SDEC e diferencia cargos de nomes", async () => {
  const response = await render("/sobre");
  const html = await response.text();
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    html,
    /href="https:\/\/www\.sdec\.pe\.gov\.br\/"[^>]*>Secretaria de Desenvolvimento Econômico de Pernambuco \(SDEC-PE\)<\/a>/,
  );
  assert.match(
    stylesheet,
    /\.about-credits-panel \.credits-role \{[\s\S]*?color: var\(--brand-blue\);/,
  );
  assert.match(
    stylesheet,
    /\.about-credits-panel \.credits-members strong \{[\s\S]*?color: #000;/,
  );
  assert.match(
    stylesheet,
    /\.about-narrative > \.eyebrow,\s*\.about-credits-panel > p \{[\s\S]*?padding: 0;[\s\S]*?background: transparent;[\s\S]*?color: var\(--brand-yellow\);/,
  );
  assert.match(
    stylesheet,
    /\.home-why-heading > p \{[\s\S]*?padding: 0;[\s\S]*?background: transparent;[\s\S]*?color: var\(--brand-yellow\);/,
  );
});

test("explica por que o nome FarolPE logo após os quatro sinais", async () => {
  const response = await render("/");
  const html = await response.text();

  assert.match(html, /class="home-why"/);
  assert.match(html, /id="home-why-title"/);
  assert.match(html, /Assim como os faróis orientam navegadores/);
  assert.match(html, /traduz dados, monitora tendências e antecipa desafios/);
  assert.match(html, /fortalecer a governança, ampliar a transparência/);
  assert.ok(
    html.indexOf('class="home-analysis"') < html.indexOf('class="home-why"'),
  );
});

test("usa a marca bicolor e a paleta oficial", async () => {
  const homeResponse = await render("/");
  const homeHtml = await homeResponse.text();
  const aboutResponse = await render("/sobre");
  const aboutHtml = await aboutResponse.text();
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  for (const html of [homeHtml, aboutHtml]) {
    assert.match(html, /class="farol-name-word"[^>]*>Farol<\/span>/);
    assert.match(html, /class="farol-name-state"[^>]*>PE<\/span>/);
    assert.doesNotMatch(html, /class="farol-name-(?:word|state)"[^>]*aria-hidden/);
  }

  assert.match(stylesheet, /--brand-blue: #00466e;/);
  assert.match(stylesheet, /--brand-yellow: #f7a600;/);
  assert.match(
    stylesheet,
    /\.farol-name-word \{[\s\S]*?color: var\(--brand-blue\);/,
  );
  assert.match(
    stylesheet,
    /\.farol-name-state \{[\s\S]*?color: var\(--brand-yellow\);/,
  );
  assert.match(
    stylesheet,
    /\.hero-lead \.farol-name\.is-on-dark \{[\s\S]*?padding: 0;[\s\S]*?background: transparent;[\s\S]*?box-shadow: none;/,
  );
  assert.match(
    stylesheet,
    /\.hero-lead \.farol-name\.is-on-dark \.farol-name-word \{\s*color: #fff;/,
  );
});

test("carrega e aplica Inter no portal e no panorama incorporado", async () => {
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const panorama = await readFile(
    new URL("../public/painel-conjuntura-2026-08-13.html", import.meta.url),
    "utf8",
  );
  const font = await readFile(
    new URL("../public/fonts/InterVariable.woff2", import.meta.url),
  );

  assert.ok(font.byteLength > 300_000);
  assert.match(stylesheet, /@font-face \{[\s\S]*?InterVariable\.woff2/);
  assert.match(stylesheet, /body \*[\s\S]*?font-family: var\(--font-inter\) !important;/);
  assert.match(panorama, /@font-face\{font-family:'Inter'/);
  assert.match(panorama, /--mono:var\(--font\);/);
});

test("padroniza cabeçalhos internos e mantém o Sobre neutro no mobile", async () => {
  for (const [path, className] of [
    ["/sobre", "about-hero"],
    ["/publicacoes", "publications-hero"],
    ["/dicionario-de-dados", "dictionary-hero"],
    ["/temas/agriculture", "info-hero"],
    ["/paineis/estoque-de-emprego", "panel-page-hero"],
  ]) {
    const response = await render(path);
    const html = await response.text();
    assert.match(html, new RegExp(`class="page-hero ${className}(?:\\s|\")`));
  }

  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    stylesheet,
    /radial-gradient\(circle at top left, rgba\(247, 166, 0, 0\.12\)/,
  );
  assert.match(
    stylesheet,
    /\.page-hero h1,[\s\S]*?color: #000;/,
  );
  assert.match(
    stylesheet,
    /\.page-hero,\s*\.info-hero\.page-hero,\s*\.about-hero\.page-hero,\s*\.dictionary-hero\.page-hero,\s*\.publications-hero\.page-hero \{[\s\S]*?border-bottom: 0;/,
  );
  assert.match(
    stylesheet,
    /\.page-hero::after,\s*\.info-hero\.page-hero::after,\s*\.dictionary-hero\.page-hero::after \{\s*display: none;\s*content: none;/,
  );
  assert.doesNotMatch(
    stylesheet,
    /border-bottom: 3px solid var\(--brand-blue\);/,
  );
  assert.doesNotMatch(stylesheet, /\.page-hero::after,[^{]*\{[^}]*width:\s*96px/);
  assert.match(
    stylesheet,
    /@media \(max-width: 560px\)[\s\S]*?\.about-content-layout \{[\s\S]*?padding: 34px 16px 52px;/,
  );
});

test("adapta o menu superior a desktop, tablet e celular", async () => {
  const response = await render("/sobre");
  const html = await response.text();
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    html,
    /class="top-navigation-brand"[\s\S]*?SDEC_FAROLPE_HORIZONTAL_VARIAÇÃO\.png/,
  );
  assert.match(html, /class="top-navigation-toggle"[\s\S]*?aria-controls="portal-navigation"/);
  assert.match(html, /class="top-nav-scrim /);
  assert.match(stylesheet, /\.top-navigation-brand \.brand-lockup \{[\s\S]*?overflow: hidden;/);
  assert.match(stylesheet, /\.top-navigation-brand \.brand-logo \{[\s\S]*?width: 168%;[\s\S]*?transform: translate\(-50%, -50%\);/);
  assert.match(stylesheet, /\.portal-shell\.has-top-navigation \{[\s\S]*?--portal-header-height: 76px;[\s\S]*?display: block;/);
  assert.match(stylesheet, /\.has-top-navigation \.panel-page\.is-embedded \{[\s\S]*?calc\(100dvh - var\(--portal-header-height\)\)/);
  assert.match(
    stylesheet,
    /@media \(max-width: 1100px\)[\s\S]*?--portal-header-height: 64px;[\s\S]*?\.top-navigation-menu \{[\s\S]*?position: fixed;[\s\S]*?overflow-y: auto;[\s\S]*?flex-direction: column;/,
  );
  assert.match(stylesheet, /\.top-navigation-menu\.is-open \{[\s\S]*?display: flex;/);
  assert.match(stylesheet, /\.top-nav-scrim\.is-open \{[\s\S]*?pointer-events: auto;/);
  assert.match(stylesheet, /@media \(max-width: 1100px\)[\s\S]*?\.top-panels-cascade \{[\s\S]*?position: static;[\s\S]*?width: 100%;/);
});

test("marca corretamente Panorama, Painéis e serviços na navegação superior", async () => {
  for (const [path, label] of [
    ["/panorama", "Panorama"],
    ["/paineis/atividade-economica", "Painéis"],
    ["/dicionario-de-dados", "Dados"],
    ["/publicacoes", "Publicações"],
    ["/sobre", "Sobre"],
  ]) {
    const response = await render(path);
    const html = await response.text();
    assert.match(
      html,
      new RegExp(`class="top-nav-link is-active"[^>]*[\\s\\S]*?<span>${label}<\\/span>`),
      `área ativa esperada em ${path}`,
    );
  }
});

test("anima o farol durante o carregamento protegido do BI", async () => {
  const source = await readFile(
    new URL("../app/FarolPortal.tsx", import.meta.url),
    "utf8",
  );
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const readinessSource = await readFile(
    new URL("../app/frame-readiness.ts", import.meta.url),
    "utf8",
  );
  const panoramaDocument = await readFile(
    new URL("../public/painel-conjuntura-2026-08-13.html", import.meta.url),
    "utf8",
  );
  const symbol = await readFile(
    new URL("../public/SDEC_FAROLPE_SÍMBOLO_SITE_v2.png", import.meta.url),
  );

  assert.match(source, /PANEL_REVEAL_MINIMUM_MS = 3_800/);
  assert.match(source, /PANEL_REVEAL_SETTLE_MS = 2_700/);
  assert.match(source, /FRAME_LOAD_TIMEOUT_MS = 30_000/);
  assert.match(source, /FRAME_REVEAL_TRANSITION_MS = 400/);
  assert.match(source, /POWER_BI_MAX_WAIT_MS = 4_500/);
  assert.match(source, /POWER_BI_PAGE_LOADED_SETTLE_MS = 1_500/);
  assert.match(source, /useSyncExternalStore/);
  assert.match(source, /useLayoutEffect/);
  assert.match(source, /getServerHydrationSnapshot = \(\) => false/);
  assert.match(source, /aria-busy=\{busy\}/);
  assert.match(source, /loading="eager"/);
  assert.match(source, /Tentar novamente/);
  assert.match(source, /event\.source !== iframeRef\.current\?\.contentWindow/);
  assert.match(source, /isPowerBiRenderedMessage\(event\.data\)/);
  assert.match(source, /isPowerBiPageLoadedMessage\(event\.data\)/);
  assert.match(source, /completionStartedRef\.current/);
  assert.match(source, /phase === "revealing" \|\| ready/);
  assert.match(source, /readyMessageType="farol-panorama-ready"/);
  assert.match(readinessSource, /POWER_BI_RENDERED_EVENT_PATH/);
  assert.match(readinessSource, /reportpageloaded/);
  assert.match(panoramaDocument, /document\.fonts\.ready/);
  assert.match(panoramaDocument, /farol-panorama-ready/);
  assert.match(panoramaDocument, /window\.requestAnimationFrame/);
  assert.match(source, /className="lighthouse-loader-base"/);
  assert.match(source, /className="lighthouse-loader-yellow"/);
  const deferredFrameSource = source.match(
    /function DeferredFrame[\s\S]*?function AnimatedMetric/,
  )?.[0] ?? "";
  assert.equal(
    (deferredFrameSource.match(/SDEC_FAROLPE_SÍMBOLO_SITE_v2\.png/g) ?? []).length,
    2,
  );
  assert.ok(symbol.length > 10_000);
  assert.match(
    stylesheet,
    /\.panel-loading \{\s*z-index: 3;[\s\S]*?background: #f5f9fb;[\s\S]*?color: var\(--brand-blue\);/,
  );
  assert.match(stylesheet, /@keyframes lighthouseYellowBlink/);
  assert.match(
    stylesheet,
    /\.lighthouse-loader-yellow \{[\s\S]*?clip-path: circle\(16% at 50% 50%\);[\s\S]*?animation: lighthouseYellowBlink/,
  );
  assert.match(
    stylesheet,
    /\.iframe-wrap iframe \{[\s\S]*?pointer-events: none;[\s\S]*?opacity: 0;/,
  );
  assert.doesNotMatch(stylesheet, /\.iframe-wrap iframe \{[^}]*visibility: hidden;/);
  assert.match(
    stylesheet,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.lighthouse-loader-yellow \{[\s\S]*?animation: none !important;/,
  );
});

test("reconhece apenas sinais confiáveis de prontidão dos painéis", async () => {
  const readinessModuleUrl = new URL(
    "../app/frame-readiness.ts",
    import.meta.url,
  );
  readinessModuleUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const {
    isPowerBiPageLoadedMessage,
    isPowerBiRenderedMessage,
  } = await import(readinessModuleUrl.href);

  assert.equal(isPowerBiRenderedMessage({ eventName: "rendered" }), true);
  assert.equal(
    isPowerBiRenderedMessage({
      type: "event",
      body: { path: "/reports/current/events/rendered" },
    }),
    true,
  );
  assert.equal(
    isPowerBiRenderedMessage(
      JSON.stringify({ detail: { name: "rendered" } }),
    ),
    true,
  );
  assert.equal(isPowerBiRenderedMessage({ eventName: "loaded" }), false);
  assert.equal(
    isPowerBiRenderedMessage({ telemetry: { type: "rendered" } }),
    false,
  );
  assert.equal(
    isPowerBiPageLoadedMessage(
      JSON.stringify({ event: "reportPageLoaded", error: "" }),
    ),
    true,
  );
  assert.equal(
    isPowerBiPageLoadedMessage({ event: "reportPageLoaded", error: "failed" }),
    false,
  );
});

test("sincroniza os quatro sinais da home com fundo azul e cards brancos", async () => {
  const dataSource = await readFile(
    new URL("../app/portal-data.ts", import.meta.url),
    "utf8",
  );
  const panorama = await readFile(
    new URL("../public/painel-conjuntura-2026-08-13.html", import.meta.url),
    "utf8",
  );
  const stylesheet = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const summaryKpis = dataSource.match(/export const summaryKpis = \[[\s\S]*?\n\];/)?.[0] ?? "";

  for (const value of ["+4,47%", "+10,9%", "+10,7%", "+6.162"]) {
    assert.ok(summaryKpis.includes(`value: "${value}"`));
    assert.ok(panorama.includes(value));
  }

  assert.match(panorama, /Panorama econômico de Pernambuco/i);
  assert.match(panorama, /Atualizado em 28 de agosto de 2026/);
  assert.match(
    stylesheet,
    /\.home-analysis \{\s*background:[\s\S]*?linear-gradient\(145deg, #071a38 0%, #0a2447 54%, #0d3158 100%\);\s*color: #fff;/,
  );
  assert.match(
    stylesheet,
    /\.home-analysis \.analysis-grid article \{[\s\S]*?background: #fff;/,
  );
});

test("não exibe fonte metodológica nos resumos dos temas", async () => {
  const response = await render("/temas/agriculture");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.doesNotMatch(html, /Fonte metodológica/);
});

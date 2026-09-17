# FarolPE — Front-end

Nova versão do Observatório Socioeconômico de Pernambuco, reconstruída como
aplicação React/Vinext.

## Testar no Windows

1. Dê dois cliques em `iniciar.bat`.
2. Aguarde aparecer o endereço `http://localhost:3000`.
3. Abra esse endereço no navegador.
4. Para encerrar, volte à janela aberta pelo arquivo e pressione `Ctrl + C`.

O projeto inclui um runtime local dentro de `.tools`, portanto não é necessário
instalar Node.js nesta máquina.

## Rotas principais

- `/` — página inicial;
- `/panorama` — panorama econômico;
- `/sobre` — apresentação institucional;
- `/publicacoes` — página preparada para conteúdo futuro;
- `/dicionario-de-dados` — catálogo dos painéis e acesso à solicitação de dados;
- `/paineis/<nome>` — painéis de dados;
- `/temas/<nome>` — resumo dos painéis disponíveis em cada tema.

Somente o iframe da rota ativa é montado. A página inicial não carrega nenhum
Power BI.

## Navegação interna

As rotas internas usam um menu superior responsivo. Panorama abre diretamente
a análise completa. No desktop, Painéis abre um catálogo vertical em cascata
por hover ou teclado; em telas menores, a mesma estrutura funciona por toque.
Os cinco títulos principais levam a páginas-resumo do respectivo tema. Os itens
internos abrem diretamente o painel correspondente, e a seta ao lado de cada
título controla o submenu sem interferir na navegação.

## Painéis pendentes

Os painéis de Produção de origem animal e Rebanhos ainda não possuíam links no
HTML original. As páginas mostram um estado de preparação até que os endereços
sejam adicionados em `app/portal-data.ts`.

## Ao trocar de máquina (ex.: OneDrive entre computador pessoal e do trabalho)

O código-fonte (pastas `app`, `public`, etc.) sincroniza bem pelo OneDrive —
são poucos arquivos, todos pequenos. **Mas duas pastas não devem ser
sincronizadas pelo OneDrive**, pois têm milhares de arquivos pequenos e travam
a sincronização: `.tools` (o Node.js portátil) e `node_modules` (as
dependências). As duas já ficam de fora do Git (`.gitignore`) — se elas
existirem dentro de uma pasta sincronizada pelo OneDrive, é melhor excluí-las
da sincronização (clique direito → "Sempre manter neste dispositivo" ➜ não; ou
apenas apague-as depois de mudar de máquina) e recriá-las localmente em cada
computador com os passos abaixo.

Em cada máquina nova (ou sempre que `.tools`/`node_modules` estiverem
ausentes ou incompletos):

1. Baixe o Node.js portátil para dentro do projeto:
   ```powershell
   Invoke-WebRequest -Uri "https://nodejs.org/dist/v24.18.0/node-v24.18.0-win-x64.zip" -OutFile ".tools\node.zip"
   Expand-Archive ".tools\node.zip" -DestinationPath ".tools"
   Remove-Item ".tools\node.zip"
   ```
2. Instale as dependências:
   ```powershell
   .\.tools\node-v24.18.0-win-x64\npm.cmd install
   ```
3. Rode `iniciar.bat` normalmente.

Isso leva menos de 2 minutos e evita depender do OneDrive para essa parte.

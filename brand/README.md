# Marca Termfy Starter Kit

O Termfy Starter Kit é o template do GitHub para começar um binário de
terminal em Bun: o mesmo executável abre uma TUI para pessoas, responde como
CLI com saída em texto ou `--json` e roda como servidor MCP via stdio para
agentes. Ele já vem com as skills do framework
[Termfy](https://github.com/promovaweb/termfy) instaladas.

O kit usa um módulo com prompt e acento verde-folha.

## Esta pasta é a marca do template

O kit em `brand/` identifica o projeto Termfy Starter Kit no GitHub. Ele não
é a identidade do binário de exemplo nem a paleta da TUI:

- o nome, o título, os créditos e os links do binário ficam no bloco `termfy`
  do `package.json` e em `src/app/manifest.ts`, mantidos pela skill
  `termfy-brand`;
- as cores da TUI ficam em `src/tui/theme.ts` e não seguem esta paleta.

Um projeto criado a partir do template deve trocar `brand/` pela própria
marca ou remover a pasta. Ela não entra no binário, e nenhum script do
template depende dela.

## Conceito visual

Um módulo de terminal. A cor de identificação é `#65A30D`.

## Arquivos oficiais

| Arquivo | Uso |
| --- | --- |
| `logo/icon.svg` | ícone principal com placa petróleo |
| `logo/icon-light.svg` | símbolo transparente sobre fundo claro |
| `logo/icon-dark.svg` | símbolo transparente sobre fundo escuro |
| `logo/logo-light.svg` | assinatura horizontal sobre fundo claro |
| `logo/logo-dark.svg` | assinatura horizontal sobre fundo escuro |
| `logo/icon.png` | fallback raster de 512 × 512 px |
| `logo/icon-light.png`, `logo/icon-dark.png` | símbolos raster de 512 × 512 px |
| `logo/logo-light.png`, `logo/logo-dark.png` | assinaturas raster de 1300 × 272 px |
| `logo/icon-16w.png` a `logo/icon-512w.png` | favicons e ícones de aplicativo de 16, 32, 48, 180, 192 e 512 px |

O nome na assinatura está convertido em curvas, em Manrope 750. Use a
variante correspondente ao fundo. Preserve 12,5% de área livre ao redor do
ativo. O tamanho mínimo é 24 px para o ícone e 140 px para a assinatura.
Dimensões e hashes de cada arquivo ficam em `manifest.json`.

## Sistema digital

- `colors/palette.json`: fonte editável da paleta;
- `colors/README.md`: papel de cada família;
- `tokens.json`: tokens agnósticos;
- `global.css`: webfontes, variáveis CSS e troca de tema;
- `tailwind-theme.js`: extensão para Tailwind CSS;
- `accessibility.md`: relatório de contraste;
- `typography/README.md`: hierarquia tipográfica;
- `fonts/`: Manrope e Inter latinas, com as licenças OFL;
- `style-guide.html`: guia visual para abrir no navegador.

## Regras para agentes

1. Use os ativos desta pasta sem redesenhá-los.
2. Lima indica a conexão com agentes pelo MCP; turquesa identifica a família.
3. Estado nunca depende apenas de cor: inclua texto, ícone ou posição.
4. Use tokens semânticos e a variante correta para light ou dark mode.
5. Como texto, use o acento semântico (`#4D7C0F` no claro, `#A3E635` no
   escuro). O lima 500 não serve como texto sobre fundo claro.
6. Não aplique filtros, gradientes, sombras, rotações ou deformações.
7. Não use esta paleta para mudar `src/tui/theme.ts` nem a identidade do
   binário; essas mudanças pertencem a `termfy-brand` e `termfy-tui`.
8. Ao preparar um projeto derivado, troque ou remova `brand/`.

# Ebook do guia do usuário

`<Titulo>-Guia-do-Usuario-v<versão>.pdf` e `.epub` são gerados a partir de
`docs/`, na ordem de `docs/reading-order.txt`, por `bun run ebook`. A mesma
`docs/` entra no binário e sai por `--skill`; o ebook é a versão para ler
fora do terminal. Os placeholders `{{bin}}`, `{{titulo}}`, `{{versao}}` e
`{{BIN}}` são resolvidos pelo manifesto do `package.json` na hora do build.

Os aliases `ebook-<bin>.pdf` e `ebook-<bin>.epub` apontam para a edição
vigente e `build.json` registra versão, hashes e fontes.

A versão do ebook vive em `VERSION` e avança quando `docs/` muda de forma
relevante; ela é independente da versão do binário. Depois de
`bun run iniciar`, regenere o ebook: a capa e o rodapé leem o título novo.

`bun run ebook:verify` confere versão, hashes, XML do EPUB, links internos,
seções obrigatórias e fontes incorporadas sem gerar nada. Requer Pandoc,
WeasyPrint, ImageMagick, xmllint, poppler-utils e unzip. Para trocar o logo da
capa, substitua `.ebook/assets/logo.png`.

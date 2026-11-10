# Release

Toda alteração publicada sai com versão, changelog, tag e GitHub Release.

1. Atualize `version` em `package.json` (SemVer).
2. Registre a mudança em `CHANGELOG.md`, no formato Keep a Changelog.
3. Se `docs/` mudou, avance `ebook/VERSION` e rode `bun run ebook`. O PDF e o
   EPUB em `ebook/` entram no commit.
4. Rode `bun run validar`.
5. Commit: `release: <bin> vX.Y.Z`.
6. Tag: `git tag vX.Y.Z`.
7. Push: `git push origin main --tags`.
8. O workflow `release.yml` compila os binários para linux-x64, linux-arm64,
   darwin-x64, darwin-arm64 e windows-x64, gera `SHA256SUMS` e publica a
   GitHub Release com as notas do changelog, o PDF e o EPUB do guia.
9. Confira a release em `https://github.com/<org>/<repo>/releases/tag/vX.Y.Z`.

Uma tag publicada nunca é movida. Correção posterior recebe nova versão.

## Build local

```bash
bun run build          # dist/<bin> para a plataforma atual
bun run build:todos    # dist/<bin>-<plataforma> para todas
./dist/<bin> --version
```

## Ebook do guia

```bash
bun run ebook          # ebook/<Titulo>-Guia-do-Usuario-v<versão>.{pdf,epub}
bun run ebook:verify   # confere sem gerar; entra em bun run validar
```

A fonte é a própria `docs/`, com os placeholders resolvidos pelo manifesto.
Depois de `bun run iniciar`, regenere o ebook para a capa e o rodapé levarem
o título novo. Requer Pandoc, WeasyPrint, ImageMagick, xmllint, poppler-utils
e unzip.

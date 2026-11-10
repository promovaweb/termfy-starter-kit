/**
 * Declarações de módulo para os imports de texto usados pelo Bun.
 * Arquivos Markdown entram no binário com `with { type: "text" }` e chegam
 * ao código como string. O TypeScript precisa desta declaração para aceitar
 * o import sem erro de tipo.
 */
declare module "*.md" {
  const conteudo: string;
  export default conteudo;
}

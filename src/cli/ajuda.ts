/**
 * Renderização do `--help`.
 *
 * Gera a ajuda da raiz e de qualquer subcomando a partir do registro. A
 * saída inclui uso, descrição, argumentos, opções do comando, opções globais,
 * subcomandos, exemplos e a tabela de códigos de saída. Como tudo vem do
 * registro, a ajuda nunca diverge do parser.
 */
import { manifesto } from "../app/manifesto.ts";
import { descricoesSaida, CodigoSaida } from "../app/saida.ts";
import { blocos, cor, secao, tabela } from "./formato.ts";
import { OPCOES_GLOBAIS, type Comando, type DefinicaoArgumento, type DefinicaoOpcao } from "./registro.ts";

function usoDeArgumento(a: DefinicaoArgumento): string {
  const nome = a.variadico ? `${a.nome}...` : a.nome;
  return a.obrigatorio ? `<${nome}>` : `[${nome}]`;
}

function rotuloDeOpcao(o: DefinicaoOpcao): string {
  const nomes = [...(o.aliases ?? []), o.nome].join(", ");
  if (!o.argumento) return nomes;
  const arg = o.argumento.opcional ? `[${o.argumento.nome}]` : `<${o.argumento.nome}>`;
  return `${nomes} ${arg}`;
}

function descricaoDeOpcao(o: DefinicaoOpcao): string {
  const partes = [o.descricao];
  if (o.argumento?.valores) partes.push(cor.sutil(`Valores: ${o.argumento.valores.join(", ")}.`));
  if (o.padrao !== undefined) partes.push(cor.sutil(`Padrão: ${String(o.padrao)}.`));
  return partes.join(" ");
}

/** Linha de uso de um comando, por exemplo `termfy config set <chave> <valor>`. */
export function linhaDeUso(caminho: string[], comando: Comando): string {
  const partes = [manifesto.bin, ...caminho];
  if (comando.subcomandos?.length) partes.push("<subcomando>");
  for (const a of comando.argumentos ?? []) partes.push(usoDeArgumento(a));
  if ((comando.opcoes?.length ?? 0) > 0 || OPCOES_GLOBAIS.length > 0) partes.push("[opções]");
  return partes.join(" ");
}

/** Tabela dos códigos de saída, usada na ajuda da raiz. */
export function tabelaCodigosSaida(filtro?: readonly CodigoSaida[]): string {
  const base: CodigoSaida[] = [CodigoSaida.SUCESSO, CodigoSaida.ERRO_GENERICO, CodigoSaida.USO_INVALIDO];
  const lista = filtro ? descricoesSaida.filter((d) => base.includes(d.codigo) || filtro.includes(d.codigo)) : descricoesSaida;
  return tabela(lista.map((d) => [`${String(d.codigo).padStart(3)}  ${d.nome}`, d.descricao]));
}

/** Ajuda completa para o comando indicado pelo caminho. */
export function renderizarAjuda(raiz: Comando, caminho: string[], comando: Comando): string {
  const ehRaiz = caminho.length === 0;
  const titulo = ehRaiz
    ? `${cor.destaque(manifesto.titulo)} ${cor.sutil(`v${manifesto.versao}`)}\n${manifesto.descricao}`
    : `${cor.destaque([manifesto.bin, ...caminho].join(" "))}\n${comando.descricao}`;

  const uso = blocos(
    secao("Uso"),
    `  ${linhaDeUso(caminho, comando)}` +
      (ehRaiz
        ? `\n  ${manifesto.bin}                      ${cor.sutil("abre a TUI (sem argumentos, em terminal interativo)")}` +
          `\n  ${manifesto.bin} mcp                  ${cor.sutil("inicia o servidor MCP via stdio")}`
        : ""),
  );

  const descricaoLonga = comando.descricaoLonga ? blocos(secao("Descrição"), recuar(comando.descricaoLonga)) : undefined;

  const argumentos = comando.argumentos?.length
    ? blocos(
        secao("Argumentos"),
        tabela(
          comando.argumentos.map((a) => [
            usoDeArgumento(a),
            a.descricao + (a.valores ? ` ${cor.sutil(`Valores: ${a.valores.join(", ")}.`)}` : ""),
          ]),
        ),
      )
    : undefined;

  const subcomandos = comando.subcomandos?.filter((c) => !c.oculto).length
    ? blocos(
        secao(ehRaiz ? "Comandos" : "Subcomandos"),
        tabela(
          (comando.subcomandos ?? [])
            .filter((c) => !c.oculto)
            .map((c) => [c.aliases?.length ? `${c.nome} (${c.aliases.join(", ")})` : c.nome, c.descricao]),
        ),
      )
    : undefined;

  const opcoesLocais = comando.opcoes?.filter((o) => !o.oculta).length
    ? blocos(secao("Opções"), tabela((comando.opcoes ?? []).filter((o) => !o.oculta).map((o) => [rotuloDeOpcao(o), descricaoDeOpcao(o)])))
    : undefined;

  const opcoesGlobais = blocos(
    secao("Opções globais"),
    tabela(OPCOES_GLOBAIS.filter((o) => !o.oculta).map((o) => [rotuloDeOpcao(o), descricaoDeOpcao(o)])),
  );

  const exemplos = comando.exemplos?.length
    ? blocos(secao("Exemplos"), comando.exemplos.map((e) => `  ${cor.codigo(e)}`).join("\n"))
    : undefined;

  const codigos = blocos(
    secao("Códigos de saída"),
    ehRaiz ? tabelaCodigosSaida() : tabelaCodigosSaida(comando.codigosSaida ?? []),
  );

  const rodape = ehRaiz
    ? cor.sutil(
        `Dados do usuário em ~/.${manifesto.bin}/ (settings.json e credentials.json). ` +
          `Use "${manifesto.bin} --skill" para a documentação completa embutida.`,
      )
    : cor.sutil(`Veja "${manifesto.bin} --help" para os demais comandos.`);

  return blocos(titulo, uso, descricaoLonga, argumentos, subcomandos, opcoesLocais, opcoesGlobais, exemplos, codigos, rodape);
}

function recuar(texto: string): string {
  return texto
    .split("\n")
    .map((l) => (l.length ? `  ${l}` : l))
    .join("\n");
}

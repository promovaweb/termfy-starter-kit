/**
 * Finds literal `getCredential("<name>")` calls in TypeScript and
 * JavaScript sources without a compiler API.
 *
 * TypeScript 7 (the native compiler) no longer ships the JavaScript API that
 * `spec:check` used, so this module tokenizes the source just enough for the
 * question it answers: it skips line and block comments, reads string and
 * template literals as single tokens (code inside `${...}` is tokenized
 * again) and reports an identifier `getCredential`, followed by `(` and a
 * string or substitution-free template literal. Calls with computed names
 * are ignored, as before.
 */

export interface CredentialCall { name: string; line: number }

type Token =
  | { kind: "ident"; value: string; line: number }
  | { kind: "string"; value: string; line: number }
  | { kind: "punct"; value: string; line: number };

/** Splits source code into identifiers, string literals and punctuation, dropping comments. */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  // Brace depth of each open template substitution, innermost last.
  const templates: number[] = [];
  let depth = 0;
  const readTemplate = (start: number): void => {
    // Reads from after "`" (or after "}" closing a substitution) to the end of the chunk.
    let value = "";
    let j = start;
    while (j < source.length) {
      const c = source[j]!;
      if (c === "\\") { value += source[j + 1] ?? ""; j += 2; continue; }
      if (c === "\n") line++;
      if (c === "`") { i = j + 1; tokens.push({ kind: "string", value, line }); return; }
      if (c === "$" && source[j + 1] === "{") {
        // A substitution makes the template computed; mark it so it never matches.
        tokens.push({ kind: "punct", value: "`${", line });
        templates.push(depth);
        depth++;
        i = j + 2;
        return;
      }
      value += c;
      j++;
    }
    i = j;
  };
  while (i < source.length) {
    const c = source[i]!;
    if (c === "\n") { line++; i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "/" && source[i + 1] === "/") { while (i < source.length && source[i] !== "\n") i++; continue; }
    if (c === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end < 0 ? source.length : end + 2;
      for (let k = i; k < stop; k++) if (source[k] === "\n") line++;
      i = stop;
      continue;
    }
    if (c === "'" || c === '"') {
      let value = "";
      let j = i + 1;
      while (j < source.length && source[j] !== c && source[j] !== "\n") {
        if (source[j] === "\\") { value += source[j + 1] ?? ""; j += 2; continue; }
        value += source[j];
        j++;
      }
      tokens.push({ kind: "string", value, line });
      i = j + 1;
      continue;
    }
    if (c === "`") { readTemplate(i + 1); continue; }
    if (c === "{") { depth++; tokens.push({ kind: "punct", value: c, line }); i++; continue; }
    if (c === "}") {
      depth--;
      if (templates.length && templates.at(-1) === depth) { templates.pop(); readTemplate(i + 1); continue; }
      tokens.push({ kind: "punct", value: c, line });
      i++;
      continue;
    }
    const ident = /^[A-Za-z_$][\w$]*/.exec(source.slice(i, i + 256));
    if (ident) { tokens.push({ kind: "ident", value: ident[0], line }); i += ident[0].length; continue; }
    tokens.push({ kind: "punct", value: c, line });
    i++;
  }
  return tokens;
}

/** Returns every `getCredential(<literal>)` call with the literal and its line. */
export function credentialCalls(source: string): CredentialCall[] {
  const tokens = tokenize(source);
  const calls: CredentialCall[] = [];
  for (let k = 0; k + 2 < tokens.length; k++) {
    const [name, open, argument, after] = [tokens[k]!, tokens[k + 1]!, tokens[k + 2]!, tokens[k + 3]];
    if (name.kind !== "ident" || name.value !== "getCredential") continue;
    if (open.kind !== "punct" || open.value !== "(") continue;
    if (argument.kind !== "string") continue;
    // A template chunk followed by "`${" is a computed name.
    if (after?.kind === "punct" && after.value === "`${") continue;
    const previous = tokens[k - 1];
    if (previous?.kind === "punct" && previous.value === ".") continue;
    calls.push({ name: argument.value, line: name.line });
  }
  return calls;
}

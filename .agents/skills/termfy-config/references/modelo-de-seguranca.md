# Modelo de segurança do cofre

## Formato

`credentials.json` guarda um envelope AES-256-GCM:

| Campo | Conteúdo |
| --- | --- |
| `versao` | `1` |
| `algoritmo` | `aes-256-gcm` |
| `iv` | 12 bytes aleatórios em base64 |
| `tag` | tag de autenticação de 16 bytes em base64 |
| `dados` | JSON `{ nome: valor }` cifrado, em base64 |

A tag garante integridade: um arquivo editado ou cifrado com outra chave
falha ao decifrar e o comando encerra com código 4.

## Chave mestra

32 bytes. Fonte, em ordem: `<BIN>_MASTER_KEY` (64 hex) e depois
`~/.<bin>/master.key`. O arquivo é criado na primeira gravação com 0600.

Rotação: exporte as credenciais com `credentials get --reveal` para um lugar
seguro, apague `credentials.json` e `master.key`, defina a nova chave e
grave de novo. Projetos derivados podem automatizar com um comando
`credentials rotate-key` que decifra com a chave antiga e cifra com a nova.

## O que a cifra cobre

- Leitura casual do arquivo por quem abre a pasta.
- Cópia do arquivo em backup, sincronização de pasta ou repositório por
  engano.
- Ferramentas que varrem o disco à procura de tokens em texto claro.

## O que a cifra não cobre

- Outro processo da mesma conta de usuário, que lê `master.key` e decifra.
- Memória do processo enquanto o valor está em uso.
- Um atacante com acesso root.

Para esses casos, a mitigação é injetar `<BIN>_MASTER_KEY` a partir de um
gerenciador de segredos (1Password CLI, Bitwarden, Vault, variáveis do CI) e
não gravar `master.key`.

## Regras de código

- Nunca `console.log(valor)`, nem em modo debug.
- Mensagens de erro citam o nome da credencial, nunca o valor.
- `mascarar()` para qualquer exibição sem `--reveal`.
- Em `--json`, `credentials get` sem `--reveal` devolve `mascarado` e
  `tamanho`, não `valor`.
- Tools MCP expõem só `statusCofre()`.
- Testes usam `<BIN>_HOME` apontando para pasta temporária e nunca tocam em
  `~/.<bin>/` da máquina.

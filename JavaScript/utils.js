/**
 * utilidades do Gerador de Senha
 * módulo: exporta funções usadas pelo index.js
 *
 * Usa métodos nativos: Math.random, slice, includes, join, push
 */

/**
 * Conjuntos de caracteres usados na geração.
 * @type {{lower:string, upper:string, digit:string, symbol:string}}
 */
export const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digit: "0123456789",
  symbol: "!@#$%^&*()_-+=<>?{}[]|:;.,"
};

/**
 * Embaralha um array (Fisher-Yates) e retorna uma cópia embaralhada.
 * Usa: Math.random, slice
 * @author Guilherme & Pedro Locatelli
 * @param {Array<any>} arr - array de entrada
 * @returns {Array<any>} nova cópia embaralhada do array
 * @example
 * const a = [1,2,3,4];
 * const b = shuffleArray(a); // b é permutação de a
 */
export function shuffleArray(arr) {
  // faz uma cópia com slice para não mutar o original
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    // usa Math.random para escolher índice
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Gera uma senha com os parâmetros especificados.
 * Usa: push, Math.random, join, includes (indiretamente pela validação de símbolos)
 *
 * Observação: esta função usa Math.random (aleatoriedade não-criptográfica).
 * Se quiser aleatoriedade criptográfica, substitua por crypto.getRandomValues.
 * @author Guilherme & Pedro Locatelli
 * @param {number} total - total desejado de caracteres (inteiro >= 4)
 * @param {number} numeros - quantidade mínima de dígitos (0..total)
 * @param {number} simbolos - quantidade mínima de símbolos (0..total)
 * @param {number} maiusculas - quantidade mínima de maiúsculas (0..total)
 * @param {number} minusculas - quantidade mínima de minúsculas (0..total)
 * @returns {string} senha gerada (string com `total` caracteres)
 * @throws {Error} se parâmetros inválidos (ex.: soma das mínimas > total)
 *
 * @example
 * gerarSenha(12, 3, 2, 3, 4); // retorna algo como "aB3!dE2f9@G"
 */
export function gerarSenha(total, numeros, simbolos, maiusculas, minusculas) {
// converte para números (opcional, mas protege contra strings)
  total = Number(total);
  numeros = Number(numeros);
  simbolos = Number(simbolos);
  maiusculas = Number(maiusculas);
  minusculas = Number(minusculas);
  // validações simples
  if (!Number.isInteger(total) || total < 4) {
    throw new Error("total deve ser inteiro >= 4");
  }
  // garante que são valores positivos
  for (const v of [numeros, simbolos, maiusculas, minusculas]) {
    if (!Number.isInteger(v) || v < 0) {
      throw new Error("os contadores devem ser inteiros não-negativos");
    }
  }
  const soma = numeros + simbolos + maiusculas + minusculas;
  if (soma > total) {
    throw new Error("a soma das quantidades mínimas não pode exceder o total");
  }

  const out = [];

  // helper para pegar um caractere aleatório de uma string
  function pick(str) {
    return str[Math.floor(Math.random() * str.length)]; // Math.random usado aqui
  }

  // Adiciona mínimos
  for (let i = 0; i < numeros; i++) out.push(pick(SETS.digit));   // push usado aqui
  for (let i = 0; i < simbolos; i++) out.push(pick(SETS.symbol));
  for (let i = 0; i < maiusculas; i++) out.push(pick(SETS.upper));
  for (let i = 0; i < minusculas; i++) out.push(pick(SETS.lower));

  // Pools para preencher o restante
  const pools = [SETS.lower, SETS.upper, SETS.digit, SETS.symbol];

  // Se nenhuma categoria foi pedida especificamente, usa todas para preencher
  while (out.length < total) {
    const pool = pools[Math.floor(Math.random() * pools.length)];
    out.push(pick(pool)); // push novamente
  }

  // Embaralha e retorna string (usa join)
  return shuffleArray(out).join("");
}

/**
 * Avalia a "força" da senha retornando porcentagem e etiqueta.
 * Usa: includes (para detectar presença de conjuntos)
 * @author Guilherme & Pedro Locatelli
 * @param {string} senha - senha a avaliar
 * @returns {{percent:number, label:string, score:number}} objeto com percent (0-100), label e score bruto
 * @example
 * avaliarForca("Abc123!@"); // -> {percent: ~80, label: "Forte", score: ...}
 */
export function avaliarForca(senha) {
  if (!senha || typeof senha !== "string") {
    return { percent: 0, label: "—", score: 0 };
  }

  let score = 0;

  if (senha.length >= 8) score++;
  if (senha.length >= 12) score++;

  // includes: verifica a presença de algum caractere dos conjuntos
  if ([...SETS.upper].some(ch => senha.includes(ch))) score++;
  if ([...SETS.digit].some(ch => senha.includes(ch))) score++;
  if ([...SETS.symbol].some(ch => senha.includes(ch))) score++;

  // penaliza repetições sequenciais simples
  if (/(.)\1\1/.test(senha)) score = Math.max(0, score - 1);

  const percent = Math.min(100, Math.round((score / 6) * 100));
  let label = "Fraca";
  if (percent >= 90) label = "Muito forte";
  else if (percent >= 66) label = "Forte";
  else if (percent >= 33) label = "Média";
  else label = "Fraca";

  return { percent, label, score };
}

/**
 * Copia texto para a área de transferência com fallback.
 * @author Guilherme & Pedro Locatelli
 * @param {string} text - texto a copiar
 * @returns {Promise<void>} resolve quando copiado (ou fallback executado)
 * @example
 * await copyToClipboard("minhaSenha123!");
 */
export async function copyToClipboard(text) {
  if (!navigator?.clipboard) {
    // fallback: cria a area de texto temporário
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
    return;
  }
  await navigator.clipboard.writeText(text);
}

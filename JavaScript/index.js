import { gerarSenha, avaliarForca, copyToClipboard } from "./utils.js";

const form = document.getElementById("formGerador");
const senhaInput = document.getElementById("senha");
const toggleBtn = document.getElementById("toggleSenha");
const copiarBtn = document.getElementById("copiarResultado");
const erroDiv = document.getElementById("erro");
const meterBar = document.getElementById("meterBar");
const forcaSenha = document.getElementById("forcaSenha");
const btnLimpar = document.getElementById("btnLimpar");

/* SVGS  */
const SVG_EYE = /*html*/`
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
`;

const SVG_EYE_OFF = /*html*/`
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a20.43 20.43 0 0 1 4.35-5.4"></path>
    <path d="M1 1l22 22"></path>
    <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12"></path>
  </svg>
`;

let senhaGerada = "";
let isVisible = false; // false = borrada (oculta), true = visível

function setToggleVisual(visible) {
  // atualiza o SVG e atributos
  if (visible) {
    toggleBtn.innerHTML = SVG_EYE;
    toggleBtn.setAttribute("aria-pressed", "false");
    toggleBtn.setAttribute("aria-label", "Mostrar senha");
    toggleBtn.setAttribute("data-title", "Mostrar senha");
  } else {
    toggleBtn.innerHTML = SVG_EYE_OFF;
    toggleBtn.setAttribute("aria-pressed", "true");
    toggleBtn.setAttribute("aria-label", "Ocultar senha");
    toggleBtn.setAttribute("data-title", "Ocultar senha");
  }
  // garante sr-only presente
  if (!toggleBtn.querySelector(".sr-only")) {
    const span = document.createElement("span");
    span.className = "sr-only";
    span.textContent = "Ocultar/Mostrar senha";
    toggleBtn.appendChild(span);
  }
}

function updateForcaUI(senha) {
  const { percent, label } = avaliarForca(senha);
  meterBar.style.width = `${percent}%`;
  forcaSenha.textContent = `Força da senha: ${label}`;
}

setToggleVisual(isVisible);
senhaInput.classList.toggle("blurred", !isVisible);
copiarBtn.disabled = true;

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const total = Number(document.getElementById("qtdCaracteres").value);
  const simbolos = Number(document.getElementById("qtdSimbolos").value);
  const maius = Number(document.getElementById("qtdMaisculas").value);
  const minus = Number(document.getElementById("qtdMinusculas").value);
  const nums = Number(document.getElementById("qtdNumeros").value);

  // validação
  if (simbolos + maius + minus + nums > total) {
    erroDiv.textContent = "A soma das quantidades não pode exceder o total de caracteres.";
    return;
  }
  erroDiv.textContent = "";

  try {
    // gerarSenha(total, numeros, simbolos, maiusculas, minusculas)
    senhaGerada = gerarSenha(total, nums, simbolos, maius, minus);
    senhaInput.value = senhaGerada;

    // aplica ou remove blur dependendo do estado 'isVisible'
    senhaInput.classList.toggle("blurred", !isVisible);

    copiarBtn.disabled = false;
    updateForcaUI(senhaGerada);
  } catch (err) {
    erroDiv.textContent = err.message || "Erro ao gerar senha.";
  }
});

// Toggle blur/mostrar
toggleBtn.addEventListener("click", () => {
  isVisible = !isVisible;
  // quando visível -> remover blur; quando oculto -> aplicar blur
  senhaInput.classList.toggle("blurred", !isVisible);
  setToggleVisual(isVisible);
});

// Copiar
copiarBtn.addEventListener("click", async () => {
  if (!senhaGerada) return;
  try {
    await copyToClipboard(senhaGerada);
    const old = copiarBtn.textContent;
    copiarBtn.textContent = "✅ Copiado!";
    copiarBtn.disabled = true;
    setTimeout(() => {
      copiarBtn.textContent = old;
      copiarBtn.disabled = false;
    }, 1400);
  } catch (err) {
    try {
      await navigator.clipboard.writeText(senhaGerada);
    } catch (e) {
      console.error("Erro ao copiar:", e);
    }
  }
});

// Limpar
btnLimpar.addEventListener("click", () => {
  form.reset();
  senhaGerada = "";
  senhaInput.value = "";
  isVisible = false;
  senhaInput.classList.add("blurred");
  setToggleVisual(isVisible);
  copiarBtn.disabled = true;
  meterBar.style.width = "0%";
  forcaSenha.textContent = "Força da senha: —";
  erroDiv.textContent = "";
});

toggleBtn.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter" || ev.key === " ") {
    ev.preventDefault();
    toggleBtn.click();
  }
});

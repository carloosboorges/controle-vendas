// ========================================================
// MÓDULO DE CONTAS (Gerenciamento e Renderização)
// ========================================================

const EPIC_SVG = `<svg viewBox="0 0 512 512" width="16" height="16" style="vertical-align: middle; fill: currentColor;"><path d="M296.6 42.1l-104 22c-9.1 1.9-15.6 9.8-15.6 19v136.2l-62.8-13.4c-9.1-1.9-17.5 4.3-19.4 13.4l-14 65.5c-1.9 9.1 4.3 17.5 13.4 19.4l63.5 13.5v157c0 8.8 6.4 16.5 15.2 17.7l126.8 17.7c8.3 1.2 16.4-5.3 16.4-13.7V61.1c-.1-11.4-10-20-21.5-19zm-5.8 406L195.5 435V111l95.3-20.2v357.3z"/></svg>`;
const XBOX_SVG = `<svg viewBox="0 0 512 512" width="16" height="16" style="vertical-align: middle; fill: #4ade80;"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zM116.8 402.9c-29.2-22.3-51.5-52.6-63.5-87.3-6.2-18-9-37.4-8-56.9 1.6-32.5 13.3-63.1 32.8-88.7 13.8-18.1 31.6-33.1 51.5-44.1l11.4-6.4 3.7 12.6c5.2 18.2 15.6 34.6 29.8 47.7 20.3 18.7 48.7 27.6 77.2 27.1 27.7-.5 54.3-10.7 73.6-30 13.3-13.3 23-30 27.7-48.4l3.5-13.7 12.3 6.9c19.3 10.9 36.6 25.4 50.3 42.9 23.3 29.8 35.8 66 35.1 103-.6 30-10 59.2-26.6 84.1-15.5 23.3-36.6 42.6-61.2 56l-14 7.6-6.4-14.5c-15.5-35.3-43.2-64-78.6-80.8-21.5-10.2-45.6-15.4-69.6-15-28.7.4-56.8 8.6-80.8 23.7-27.1 17.1-48.3 42.4-60.5 72.1l-5.3 12.8-13.5-9.8z"/></svg>`;

let contasAberto = false;
let abaContasAtiva = 'geral'; 

function mudarAbaContas(aba) {
  abaContasAtiva = aba;
  const btnGeral = document.getElementById('tabContasGeral');
  const btnAcessos = document.getElementById('tabContasAcessos');
  
  if (btnGeral && btnAcessos) {
    if (aba === 'geral') {
      btnGeral.style.cssText = "padding: 6px 14px; font-size: 12px; border-radius: 8px; font-weight: bold; background: rgba(142,68,255,0.2); border: 1px solid var(--accent-light); color: #fff; cursor: pointer; outline: none; transition: all 0.2s;";
      btnAcessos.style.cssText = "padding: 6px 14px; font-size: 12px; border-radius: 8px; font-weight: bold; background: transparent; border: 1px solid transparent; color: var(--muted); cursor: pointer; outline: none; transition: all 0.2s;";
    } else {
      btnAcessos.style.cssText = "padding: 6px 14px; font-size: 12px; border-radius: 8px; font-weight: bold; background: rgba(16,124,16,0.2); border: 1px solid #4ade80; color: #fff; cursor: pointer; outline: none; transition: all 0.2s;";
      btnGeral.style.cssText = "padding: 6px 14px; font-size: 12px; border-radius: 8px; font-weight: bold; background: transparent; border: 1px solid transparent; color: var(--muted); cursor: pointer; outline: none; transition: all 0.2s;";
    }
  }
  if (typeof renderContasCards === 'function') renderContasCards();
}

function toggleGerenciarContas() {
  contasAberto = !contasAberto;
  const content = document.getElementById("contasContent");
  const arrow = document.getElementById("contasToggleArrow");
  if (content && arrow) {
    content.style.display = contasAberto ? "block" : "none";
    arrow.textContent = contasAberto ? "▴" : "▾";
  }
}

// === AUTO INJETOR DE CAMPOS XBOX NOS MODAIS ===
function injetarCamposXboxNoModal(isEdit) {
  const prefixo = isEdit ? 'editConta' : 'novaConta';
  const senhaInput = document.getElementById(`${prefixo}SenhaInput`);
  
  if (senhaInput && !document.getElementById(`${prefixo}EmailXboxInput`)) {
    const parentDiv = senhaInput.closest('.field') || senhaInput.parentNode;
    if (parentDiv) {
      const xboxHtml = `
        <div style="margin-top:16px; margin-bottom:8px; border-bottom: 1px solid var(--border); padding-bottom: 4px;">
          <span style="font-weight:bold; font-size:13px; color:#4ade80;">🎮 Credenciais Xbox Live</span>
        </div>
        <div class="field">
          <label style="color: #4ade80;">E-mail (Xbox)</label>
          <input id="${prefixo}EmailXboxInput" type="text" placeholder="E-mail do Xbox">
        </div>
        <div class="field">
          <label style="color: #4ade80;">Senha (Xbox)</label>
          <input id="${prefixo}SenhaXboxInput" type="text" placeholder="Senha do Xbox">
        </div>
      `;
      parentDiv.insertAdjacentHTML('afterend', xboxHtml);
    }
  }
}

function abrirModalAddConta() {
  document.getElementById("novaContaNomeInput").value = "";
  document.getElementById("novaContaVbucksInput").value = "0";
  document.getElementById("novaContaEmailInput").value = "";
  document.getElementById("novaContaSenhaInput").value = "";
  
  injetarCamposXboxNoModal(false);
  if(document.getElementById("novaContaEmailXboxInput")) document.getElementById("novaContaEmailXboxInput").value = "";
  if(document.getElementById("novaContaSenhaXboxInput")) document.getElementById("novaContaSenhaXboxInput").value = "";

  if (document.getElementById("addContaModal")) document.getElementById("addContaModal").style.display = "flex";
}

function fecharModalAddConta() {
  if (document.getElementById("addContaModal")) document.getElementById("addContaModal").style.display = "none";
}

function salvarNovaContaModal() {
  const nome = document.getElementById("novaContaNomeInput")?.value.trim();
  const vbucks = parseInt(String(document.getElementById("novaContaVbucksInput")?.value || "0").replace(/\D/g, ""), 10) || 0;
  const email = document.getElementById("novaContaEmailInput")?.value.trim() || "";
  const senha = document.getElementById("novaContaSenhaInput")?.value.trim() || "";
  
  const emailXbox = document.getElementById("novaContaEmailXboxInput")?.value.trim() || "";
  const senhaXbox = document.getElementById("novaContaSenhaXboxInput")?.value.trim() || "";
  
  if (!nome) {
    mostrarNotificacao("Digite o nome da conta.", "erro");
    return;
  }
  
  state.contas.push({ nome, ativa: false, vbucks: Number(vbucks) || 0, email, senha, emailXbox, senhaXbox });
  save();
  fecharModalAddConta();
  mostrarNotificacao(`Conta ${nome} adicionada!`, "sucesso");
  if (typeof render === 'function') render();
}

function abrirModalEditConta(i) {
  const conta = state.contas[i];
  if (!conta) return;
  
  document.getElementById("editContaIndex").value = i;
  document.getElementById("editContaNomeInput").value = conta.nome;
  document.getElementById("editContaVbucksInput").value = Number(conta.vbucks) || 0;
  document.getElementById("editContaSomarVbucksInput").value = "";
  document.getElementById("editContaEmailInput").value = conta.email || "";
  document.getElementById("editContaSenhaInput").value = conta.senha || "";
  
  injetarCamposXboxNoModal(true);
  if(document.getElementById("editContaEmailXboxInput")) document.getElementById("editContaEmailXboxInput").value = conta.emailXbox || "";
  if(document.getElementById("editContaSenhaXboxInput")) document.getElementById("editContaSenhaXboxInput").value = conta.senhaXbox || "";
  
  if (document.getElementById("editContaModal")) document.getElementById("editContaModal").style.display = "flex";
}

function fecharModalEditConta() {
  if (document.getElementById("editContaModal")) document.getElementById("editContaModal").style.display = "none";
}

function somarPacoteRapido(qtd) {
  const saldoInput = document.getElementById("editContaVbucksInput");
  if (!saldoInput) return;
  saldoInput.value = (parseInt(String(saldoInput.value || "0").replace(/\D/g, ""), 10) || 0) + qtd;
  mostrarNotificacao(`+${qtd.toLocaleString("pt-BR")} VB somados!`, "sucesso");
}

function aplicarSomaVbucksModal() {
  const saldoInput = document.getElementById("editContaVbucksInput");
  const somarInput = document.getElementById("editContaSomarVbucksInput");
  const valorSomar = parseInt(String(somarInput?.value || "0").replace(/\D/g, ""), 10) || 0;
  
  if (valorSomar > 0) {
    saldoInput.value = (parseInt(String(saldoInput.value || "0").replace(/\D/g, ""), 10) || 0) + valorSomar;
    somarInput.value = "";
    mostrarNotificacao(`+${valorSomar.toLocaleString("pt-BR")} VB somados!`, "sucesso");
  }
}

function salvarEdicaoContaModal() {
  const i = parseInt(document.getElementById("editContaIndex").value, 10);
  const conta = state.contas[i];
  if (!conta) return;
  
  const novoNome = document.getElementById("editContaNomeInput").value.trim();
  const novoVbucks = parseInt(String(document.getElementById("editContaVbucksInput").value || "0").replace(/\D/g, ""), 10);
  const novoEmail = document.getElementById("editContaEmailInput").value.trim();
  const novaSenha = document.getElementById("editContaSenhaInput").value.trim();
  
  const novoEmailXbox = document.getElementById("editContaEmailXboxInput")?.value.trim() || "";
  const novaSenhaXbox = document.getElementById("editContaSenhaXboxInput")?.value.trim() || "";
  
  if (!novoNome) return;
  
  conta.nome = novoNome;
  conta.vbucks = Number(novoVbucks) || 0;
  conta.email = novoEmail;
  conta.senha = novaSenha;
  conta.emailXbox = novoEmailXbox;
  conta.senhaXbox = novaSenhaXbox;
  
  save();
  fecharModalEditConta();
  mostrarNotificacao("Conta atualizada!", "sucesso");
  if (typeof render === 'function') render();
}

function confirmarRemoverTimerEspecifico(index, numeroVenda, nomeConta) {
  if (typeof abrirModalConfirmacao === 'function') {
      abrirModalConfirmacao(
        "⏱️ Remover Timer",
        `Tem certeza que deseja excluir o timer da Venda ${numeroVenda} da conta ${nomeConta}?`,
        () => {
          if (typeof removerTimerEspecifico === "function") {
            removerTimerEspecifico(index);
          }
        }
      );
  }
}

function atualizarRelogios() {
  if (!state || !state.contas) return;
  if (abaContasAtiva === 'acessos') return; // Na aba acessos não tem timer, não roda
  
  let precisaAtualizarTudo = false;
  if (typeof limparReservasExpiradas === 'function') {
      if (limparReservasExpiradas()) {
          precisaAtualizarTudo = true;
      }
  }
  
  if (precisaAtualizarTudo) {
      if (typeof renderContasCards === 'function') renderContasCards();
      if (typeof render === 'function') render();
      return;
  }

  (state.contas || []).filter(c => c.ativa).forEach(c => {
    const idLimpo = c.nome.replace(/\s+/g, '-');
    const container = document.getElementById(`timers-conta-${idLimpo}`);
    if (container) {
      const reservasAtivas = (state.reservas || []).filter(r => r.conta === c.nome && r.expiresAt > Date.now());
      const tempos = reservasAtivas.map((r, n) => `<div class="timer-line"><span>Venda ${n + 1}: ${tempoRestante(r.expiresAt - Date.now())}</span><button type="button" class="btn-danger timer-remove-btn" onclick="confirmarRemoverTimerEspecifico(${state.reservas.indexOf(r)}, ${n + 1}, '${esc(c.nome).replace(/'/g, "\\'")}')">✕</button></div>`);
      container.innerHTML = tempos.length ? tempos.join("") : "";
    }
  });
}

function renderContasCards(t) {
  if (!t) t = typeof totais === 'function' ? totais() : {};
  const container = document.getElementById("totaisPorConta");
  if (!container || !state) return;
  
  const hojeObj = new Date();
  hojeObj.setHours(0, 0, 0, 0);
  const hojeTime = hojeObj.getTime();
  
  container.innerHTML = (state.contas || []).filter(c => c.ativa).map((c, i) => {
    const sId = c.nome.replace(/\s+/g, '-');
    
    // ==========================================
    // SE A ABA "ACESSOS" ESTIVER ATIVA
    // ==========================================
    if (abaContasAtiva === 'acessos') {
       // Botões Epic
       const btnEmailEpic = c.email ? `<button type="button" class="btn-gray btn-copy" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px;" onclick="copiarTexto('${esc(c.email)}', 'E-mail', event)">📧 E-mail</button>` : `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px; opacity: 0.3;" disabled>📧 Vazio</button>`;
       const btnSenhaEpic = c.senha ? `<button type="button" class="btn-gray btn-copy" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px;" onclick="copiarTexto('${esc(c.senha)}', 'Senha', event)">🔑 Senha</button>` : `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px; opacity: 0.3;" disabled>🔑 Vazio</button>`;

       // Botões Xbox
       const btnEmailXbox = c.emailXbox ? `<button type="button" class="btn-gray btn-copy" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px; border-color: rgba(16,124,16,0.3); color: #fff;" onclick="copiarTexto('${esc(c.emailXbox)}', 'E-mail', event)">📧 E-mail</button>` : `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px; opacity: 0.3;" disabled>📧 Vazio</button>`;
       const btnSenhaXbox = c.senhaXbox ? `<button type="button" class="btn-gray btn-copy" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px; border-color: rgba(16,124,16,0.3); color: #fff;" onclick="copiarTexto('${esc(c.senhaXbox)}', 'Senha', event)">🔑 Senha</button>` : `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 6px; opacity: 0.3;" disabled>🔑 Vazio</button>`;

       return `
        <div class="total-account" style="min-height: 290px; display: flex; flex-direction: column;">
          <div class="account-card-head" style="display:flex; align-items:center; flex-wrap:nowrap; gap:6px; margin-bottom: 12px;">
            <div class="name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;" title="${esc(c.nome)}">${esc(c.nome)}</div>
            <span style="font-size: 10px; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: var(--muted); font-weight: bold;">🗄️ COFRE</span>
          </div>

          <!-- EPIC GAMES -->
          <div style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 10px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
             <div style="font-weight: 800; font-size: 12px; color: var(--accent-light); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
               ${EPIC_SVG} EPIC GAMES
             </div>
             <div style="display: flex; gap: 6px;">
               ${btnEmailEpic}
               ${btnSenhaEpic}
             </div>
          </div>

          <!-- XBOX LIVE -->
          <div style="background: rgba(16,124,16,0.05); border: 1px solid rgba(16,124,16,0.2); border-radius: 8px; padding: 12px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
             <div style="font-weight: 800; font-size: 12px; color: #4ade80; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
               ${XBOX_SVG} XBOX LIVE
             </div>
             <div style="display: flex; gap: 6px;">
               ${btnEmailXbox}
               ${btnSenhaXbox}
             </div>
          </div>
        </div>
       `;
    }

    // ==========================================
    // SE A ABA "VISÃO GERAL" ESTIVER ATIVA (ORIGINAL)
    // ==========================================
    const quantidade = typeof usadasDaConta === 'function' ? usadasDaConta(c.nome) : 0;
    const disponiveis = Math.max(0, 5 - quantidade);
    const reservasAtivas = (state.reservas || []).filter(r => r.conta === c.nome && r.expiresAt > Date.now());
    
    const agendamentosPendentes = (state.agendamentos || []).filter(a => {
      if (a.conta !== c.nome) return false;
      if (!a.dataEnvio || a.dataEnvio === "Imediato") return true;
      const p = a.dataEnvio.split("/");
      if (p.length === 3) {
          const dataAg = new Date(p[2], p[1] - 1, p[0]);
          return dataAg.getTime() <= hojeTime;
      }
      return true;
    }).reduce((sum, a) => sum + (Number(a.quantidade) || 1), 0);
    
    const textoVaga = agendamentosPendentes === 1 ? "vaga reservada" : "vagas reservadas";
    const avisoAgenda = agendamentosPendentes > 0 ? `<div style="font-size: 11px; color: #ffb74d; margin-top: 4px; font-weight: bold; background: rgba(255, 152, 0, 0.1); padding: 4px 6px; border-radius: 4px;">⚠️ ${agendamentosPendentes} ${textoVaga}</div>` : '';
    
    const tempos = reservasAtivas.map((r, n) => `<div class="timer-line"><span>Venda ${n + 1}: ${tempoRestante(r.expiresAt - Date.now())}</span><button type="button" class="btn-danger timer-remove-btn" onclick="confirmarRemoverTimerEspecifico(${state.reservas.indexOf(r)}, ${n + 1}, '${esc(c.nome).replace(/'/g, "\\'")}')">✕</button></div>`);
    
    const btnEmail = c.email ? `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 8px;" onclick="copiarTexto('${esc(c.email)}', 'E-mail', event)">📧 Copiar E-mail</button>` : `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 8px; opacity: 0.3; cursor: default;" disabled>📧 Sem E-mail</button>`;
    const btnSenha = c.senha ? `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 8px;" onclick="copiarTexto('${esc(c.senha)}', 'Senha', event)">🔑 Copiar Senha</button>` : `<button type="button" class="btn-gray" style="flex:1; padding: 6px; font-size: 11px; border-radius: 8px; opacity: 0.3; cursor: default;" disabled>🔑 Sem Senha</button>`;
    const painelCreds = `<div style="display:flex; gap: 8px; margin-top: 12px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 12px;">${btnEmail}${btnSenha}</div>`;

    return `
      <div class="total-account ${quantidade >= 5 ? "limit-reached" : ""}" style="min-height: 290px;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div class="account-card-head" style="display:flex; align-items:center; flex-wrap:nowrap; gap:6px;">
            <div class="name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;" title="${esc(c.nome)}">${esc(c.nome)}</div>
            <div style="display:flex; gap: 4px; flex-shrink: 0;">
              <button type="button" class="btn-green" style="font-size: 11px; padding: 5px 8px; height: fit-content; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="adicionarTimerManual('${esc(c.nome).replace(/'/g, "\\'")}')" title="Adicionar envio manual">➕⏱️</button>
              <button type="button" class="btn-danger" style="font-size: 11px; padding: 5px 8px; height: fit-content; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="confirmarRemoverVendasConta('${esc(c.nome).replace(/'/g, "\\'")}')" title="Zerar R$ da Sessão">💲</button>
              <button type="button" class="btn-danger" style="font-size: 11px; padding: 5px 8px; height: fit-content; display: flex; align-items: center; justify-content: center; gap: 4px;" onclick="confirmarRemoverTimersConta(${state.contas.indexOf(c)}, '${esc(c.nome).replace(/'/g, "\\'")}')" title="Resetar Timers">⏱️</button>
            </div>
          </div>
          <div class="amount">${maskMoney(money(t[c.nome] || 0))}</div>
          <div class="sales-count">🪙 ${formatVBucks(c.vbucks)} V-Bucks</div>
          <div class="sales-count">🛒 ${quantidade === 1 ? "1 venda nessa conta" : quantidade + " vendas nessa conta"}</div>
          <div class="sales-count">📦 ${disponiveis === 1 ? "1 venda disponível" : disponiveis + " vendas disponíveis"}</div>
          ${avisoAgenda}
          <div class="timer" id="timers-conta-${esc(c.nome).replace(/\s+/g, '-')}">${tempos.length ? tempos.join("") : ""}</div>
        </div>
        ${painelCreds}
      </div>`;
  }).join("");
}
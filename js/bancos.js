// ==========================================
// MÓDULO DE BANCOS (Fechamento e Estatísticas)
// ==========================================

let bancoEmEdicaoId = null;

// Mantém o fechamento de caixa original do modal da Sessão Atual
function saldoPorBanco() {
  const saldoBancos = {};
  const totaisPorConta = typeof totais === 'function' ? totais() : {}; 
  
  (state?.bancos || []).forEach(b => {
    saldoBancos[b.id] = { nome: b.nome, valor: 0, contas: [] };
  });

  (state?.contas || []).forEach(conta => {
    const valorNaConta = totaisPorConta[conta.nome] || 0;
    const idDoBanco = conta.bancoId || "banco-sem-categoria";
    
    if (!saldoBancos[idDoBanco]) {
        saldoBancos[idDoBanco] = { nome: "⚠️ Sem Banco Definido", valor: 0, contas: [] };
    }
    
    saldoBancos[idDoBanco].valor += valorNaConta;
    
    if(valorNaConta > 0) {
        const formatoDinheiro = typeof money === 'function' ? money(valorNaConta) : `R$ ${valorNaConta.toFixed(2)}`;
        saldoBancos[idDoBanco].contas.push(`${conta.nome} (${formatoDinheiro})`);
    }
  });

  return saldoBancos;
}

// 🚀 MOTOR DE ESTATÍSTICAS FINANCEIRAS POR BANCO
function calcularEstatisticasBancos() {
    const stats = {};
    (state.bancos || []).forEach(b => {
        stats[b.id] = { dia: 0, semana: 0, mes: 0, total: 0 };
    });
    stats["sem-banco"] = { dia: 0, semana: 0, mes: 0, total: 0 };

    // 🚀 FORÇA O INÍCIO DO CAIXA PARA ONTEM (Ignora as vendas de semanas atrás)
    if (!state.configBancos || !state.configBancos.foiResetadoParaOntem) {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        ontem.setHours(0, 0, 0, 0); // Começa a contar de ontem meia-noite
        state.configBancos = { 
            dataInicio: ontem.getTime(),
            foiResetadoParaOntem: true 
        };
        if (typeof save === 'function') save();
    }
    const dataInicioTracking = state.configBancos.dataInicio;

    const historico = state.historicoVendas || [];
    
    // Puxa as datas dos calendários nativos do sistema
    const diaParaFiltrar = typeof diaFiltroSelecionado !== 'undefined' && diaFiltroSelecionado ? diaFiltroSelecionado : (typeof obterDataHojeFormatada === 'function' ? obterDataHojeFormatada() : new Date().toLocaleDateString('pt-BR'));
    const mesLocal = typeof mesFiltroSelecionado !== 'undefined' && mesFiltroSelecionado ? mesFiltroSelecionado : `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`;
    const [selM, selA] = mesLocal.split("/").map(Number);

    // Calcula a semana exata (Segunda a Domingo) do dia selecionado
    let refDate = new Date();
    const partesDia = diaParaFiltrar.split("/");
    if (partesDia.length === 3) {
        refDate = new Date(Number(partesDia[2]), Number(partesDia[1]) - 1, Number(partesDia[0]));
    }
    
    const dayOfWeek = refDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; 
    const semInicio = new Date(refDate);
    semInicio.setDate(refDate.getDate() + diff);
    semInicio.setHours(0,0,0,0);
    
    const semFim = new Date(semInicio);
    semFim.setDate(semFim.getDate() + 7);

    const chaveData = dataStr => {
        const p = String(dataStr || "").split("/");
        if (p.length !== 3) return null;
        const d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
        return Number.isNaN(d.getTime()) ? null : d;
    };

    const contaBancoMap = {};
    (state.contas || []).forEach(c => {
        contaBancoMap[c.nome] = c.bancoId || "sem-banco";
    });

    historico.forEach(v => {
        // 🚀 IGNORA TODAS AS VENDAS FEITAS ANTES DA DATA DE RESET!
        if ((v.criadoEmMs || 0) < dataInicioTracking) return;

        const valor = Number(v.valor || 0);
        
        if (v.itens && v.itens.length > 0) {
            const vbTotalItens = v.itens.reduce((sum, item) => sum + (Number(item.vbucks) || 0), 0);
            v.itens.forEach(item => {
                const cNome = item.contaEnvio || v.conta;
                const bId = contaBancoMap[cNome] || "sem-banco";
                
                let valorItem = 0;
                if (Number(item.vbucks) > 0 && vbTotalItens > 0) {
                    valorItem = (Number(item.vbucks) / vbTotalItens) * valor;
                } else if (Number(item.vbucks) === 0 && v.itens.length > 0) {
                    valorItem = valor / v.itens.length;
                }
                
                atribuirValorStats(stats, bId, valorItem, v.data, diaParaFiltrar, selM, selA, semInicio, semFim, chaveData);
            });
        } else {
            const bId = contaBancoMap[v.conta] || "sem-banco";
            atribuirValorStats(stats, bId, valor, v.data, diaParaFiltrar, selM, selA, semInicio, semFim, chaveData);
        }
    });

    return stats;
}

function atribuirValorStats(stats, bId, valor, dataVenda, diaParaFiltrar, selM, selA, semInicio, semFim, chaveData) {
    if (!stats[bId]) stats[bId] = { dia: 0, semana: 0, mes: 0, total: 0 };
    
    if (dataVenda === diaParaFiltrar) {
        stats[bId].dia += valor;
    }
    
    const d = chaveData(dataVenda);
    if (!d) return;

    if (d >= semInicio && d < semFim) {
        stats[bId].semana += valor;
    }

    if (d.getMonth() + 1 === selM && d.getFullYear() === selA) {
        stats[bId].mes += valor;
        stats[bId].total += valor; // O "Total Acumulado" espelha o mês selecionado no calendário
    }
}

// 🚀 BOTÃO MANUAL DE ZERAR CAIXA DISPONÍVEL NOVAMENTE
window.resetarSaldosBancos = function() {
    if (typeof abrirModalConfirmacao === 'function') {
        abrirModalConfirmacao(
            "🔄 Zerar Saldos dos Bancos",
            "Isso fará com que as estatísticas de TODOS os bancos comecem a contar do zero a partir de agora.\n\nFique tranquilo: O seu histórico principal de vendas na aba 'Vendas' NÃO será apagado, apenas este contador financeiro será reiniciado.\n\nTem certeza?",
            () => {
                if (!state.configBancos) state.configBancos = {};
                state.configBancos.dataInicio = Date.now();
                state.configBancos.foiResetadoParaOntem = true;
                if (typeof save === 'function') save();
                renderizarAbaBancos();
                if (typeof mostrarNotificacao === 'function') mostrarNotificacao("Saldos zerados! Contando a partir de agora.", "sucesso");
            }
        );
    }
};

// 🚀 GATILHOS EXCLUSIVOS DOS CALENDÁRIOS DA ABA BANCO
window.abrirFiltroDiaBancos = function(e) {
    if (e) e.stopPropagation();
    if (typeof calPopoverAberto !== 'undefined') {
        calPopoverAberto = !calPopoverAberto;
        if (typeof mesPopoverAberto !== 'undefined') mesPopoverAberto = false;
        renderizarAbaBancos();
    }
};

window.abrirFiltroMesBancos = function(e) {
    if (e) e.stopPropagation();
    if (typeof mesPopoverAberto !== 'undefined') {
        mesPopoverAberto = !mesPopoverAberto;
        if (typeof calPopoverAberto !== 'undefined') calPopoverAberto = false;
        renderizarAbaBancos();
    }
};

// 🚀 RENDERIZA A ABA
function renderizarAbaBancos() {
    const container = document.getElementById("listaDeBancosContainer");
    
    if (typeof preencherSelectBancos === 'function') {
        preencherSelectBancos("novaContaBancoSelect", document.getElementById("novaContaBancoSelect")?.value || "");
        preencherSelectBancos("editContaBancoSelect", document.getElementById("editContaBancoSelect")?.value || "");
    }

    if (!container) return;

    const stats = calcularEstatisticasBancos();
    const agoraData = new Date();
    
    const diaParaFiltrar = typeof diaFiltroSelecionado !== 'undefined' && diaFiltroSelecionado ? diaFiltroSelecionado : (typeof obterDataHojeFormatada === 'function' ? obterDataHojeFormatada() : new Date().toLocaleDateString('pt-BR'));
    const mesLocal = typeof mesFiltroSelecionado !== 'undefined' && mesFiltroSelecionado ? mesFiltroSelecionado : `${String(agoraData.getMonth() + 1).padStart(2, "0")}/${agoraData.getFullYear()}`;

    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 15px; flex-wrap: wrap; gap: 10px;">
            <h4 style="margin: 0; color: var(--muted); font-size: 14px;">Filtrar relatórios dos bancos (Atualização Automática):</h4>
            <button type="button" onclick="window.resetarSaldosBancos()" class="btn-gray" style="padding: 6px 15px; height: 36px; font-weight: bold; font-size: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">🔄 Começar do Zero</button>
        </div>
        
        <div class="history-periods" style="margin-bottom: 30px;">
            <div class="period-card period-card-calendar-container" style="position:relative; cursor:pointer; min-width: 140px;" onclick="window.abrirFiltroDiaBancos(event)">
                <div class="period-header-select"><span>📅</span><strong style="font-size:12px; color:var(--accent-light);">Filtro Dia: ${diaParaFiltrar} ▾</strong></div>
                <small style="color:var(--muted); margin-top:4px;">Clique para mudar o dia</small>
                ${typeof calPopoverAberto !== 'undefined' && calPopoverAberto && typeof gerarHtmlCalendarioPopover === 'function' ? gerarHtmlCalendarioPopover() : ""}
            </div>
            
            <div class="period-card period-card-mes-container" style="position:relative; cursor:pointer; min-width: 140px;" onclick="window.abrirFiltroMesBancos(event)">
                <div class="period-header-select"><span>🗓️</span><strong style="font-size:12px; color:var(--accent-light);">Filtro Mês: ${mesLocal} ▾</strong></div>
                <small style="color:var(--muted); margin-top:4px;">Clique para mudar o mês</small>
                ${typeof mesPopoverAberto !== 'undefined' && mesPopoverAberto && typeof gerarHtmlMesPopover === 'function' ? gerarHtmlMesPopover() : ""}
            </div>
        </div>
    `;

    if (!state || !state.bancos || state.bancos.length === 0) {
        html += `<div style="text-align: center; color: var(--muted); padding: 15px; background: rgba(255,255,255,0.02); border-radius: 8px;">Nenhum banco cadastrado ainda. Digite o nome acima e clique em "Criar Banco"!</div>`;
    } else {
        state.bancos.forEach(b => {
            const s = stats[b.id] || { dia: 0, semana: 0, mes: 0, total: 0 };
            const nomeBancoSeguro = typeof esc === 'function' ? esc(b.nome) : b.nome;
            
            html += `
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border-left: 4px solid var(--accent); margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                        <span style="color: #fff; font-weight: 900; font-size: 18px;">🏦 ${nomeBancoSeguro}</span>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" onclick="abrirModalEditarBanco('${b.id}')" class="btn-gray" style="padding: 6px 14px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 8px;">✏️ Editar</button>
                            <button type="button" onclick="abrirModalExcluirBanco('${b.id}')" class="btn-danger" style="padding: 6px 14px; font-size: 11px; font-weight: bold; cursor: pointer; border-radius: 8px;">🗑️ Excluir</button>
                        </div>
                    </div>
                    
                    <div class="history-periods" style="margin-top: 10px;">
                        <div class="period-card" style="background: rgba(255,255,255,0.03);">
                            <span>📅 Dia (${diaParaFiltrar})</span>
                            <strong id="banco_dia_${b.id}" style="color: ${s.dia > 0 ? 'var(--green)' : '#fff'};">${money(s.dia)}</strong>
                        </div>
                        <div class="period-card" style="background: rgba(255,255,255,0.03);">
                            <span>📅 Esta Semana</span>
                            <strong id="banco_sem_${b.id}" style="color: ${s.semana > 0 ? 'var(--green)' : '#fff'};">${money(s.semana)}</strong>
                        </div>
                        <div class="period-card" style="background: rgba(255,255,255,0.03);">
                            <span>🗓️ Mês (${mesLocal})</span>
                            <strong id="banco_mes_${b.id}" style="color: ${s.mes > 0 ? 'var(--green)' : '#fff'};">${money(s.mes)}</strong>
                        </div>
                        <div class="period-card profit-card">
                            <span>💰 Total Acumulado</span>
                            <strong id="banco_tot_${b.id}" style="color: var(--accent-light);">${money(s.total)}</strong>
                        </div>
                    </div>
                </div>
            `;
        });

        const sSem = stats["sem-banco"];
        if (sSem && (sSem.total > 0)) {
            html += `
                <div style="background: rgba(244, 67, 54, 0.05); padding: 20px; border-radius: 12px; border-left: 4px solid #ff5252; margin-top: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span style="color: #ff5252; font-weight: 900; font-size: 16px;">⚠️ Valores Perdidos (Contas Sem Banco)</span>
                    </div>
                    <div class="history-periods" style="margin-top: 10px;">
                        <div class="period-card" style="background: rgba(255,255,255,0.03);">
                            <span>📅 Dia</span>
                            <strong id="banco_dia_sem_banco" style="color: rgba(255,255,255,0.8);">${money(sSem.dia)}</strong>
                        </div>
                        <div class="period-card" style="background: rgba(255,255,255,0.03);">
                            <span>📅 Esta Semana</span>
                            <strong id="banco_sem_sem_banco" style="color: rgba(255,255,255,0.8);">${money(sSem.semana)}</strong>
                        </div>
                        <div class="period-card" style="background: rgba(255,255,255,0.03);">
                            <span>🗓️ Mês</span>
                            <strong id="banco_mes_sem_banco" style="color: rgba(255,255,255,0.8);">${money(sSem.mes)}</strong>
                        </div>
                        <div class="period-card" style="background: rgba(244, 67, 54, 0.1); border-color: rgba(244, 67, 54, 0.3);">
                            <span style="color: #ff5252;">💰 Total Perdido</span>
                            <strong id="banco_tot_sem_banco" style="color: #ff5252;">${money(sSem.total)}</strong>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}

function adicionarBancoAction() {
    const input = document.getElementById("novoNomeBancoInput");
    if (!input) return;
    
    const nome = input.value.trim();
    if (!nome) {
        if (typeof mostrarNotificacao === 'function') mostrarNotificacao("Digite o nome do banco.", "erro");
        return;
    }

    if (!state.bancos) state.bancos = [];
    state.bancos.push({
        id: 'banco-' + Date.now(),
        nome: nome
    });

    input.value = "";
    if (typeof save === 'function') save();
    renderizarAbaBancos();
    if (typeof render === 'function') render();
    if (typeof mostrarNotificacao === 'function') mostrarNotificacao("Banco criado com sucesso!", "sucesso");
}

function abrirModalEditarBanco(id) {
    const banco = (state.bancos || []).find(b => b.id === id);
    if (!banco) return;

    bancoEmEdicaoId = id;
    let modal = document.getElementById("modalEditarBancoCustom");

    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalEditarBancoCustom";
        modal.className = "modal-overlay";
        modal.style.cssText = "display: none; align-items: center; justify-content: center; z-index: 10500;";
        modal.innerHTML = `
            <div class="modal-card" style="max-width: 420px; width: 100%;">
                <div class="modal-head">
                    <h3 style="margin: 0; color: var(--accent-light);">✏️ Editar Banco</h3>
                    <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalEditarBanco()">✕</button>
                </div>
                <div class="field" style="margin-top: 15px;">
                    <label>Novo Nome do Banco</label>
                    <input id="inputNomeBancoEditado" type="text" maxlength="60" placeholder="Ex: Nubank" />
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="button" class="btn-green" style="flex: 1; padding: 10px;" onclick="salvarEdicaoBancoCustom()">💾 Salvar</button>
                    <button type="button" class="btn-gray" style="padding: 10px 16px;" onclick="fecharModalEditarBanco()">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const input = document.getElementById("inputNomeBancoEditado");
    if (input) input.value = banco.nome;
    modal.style.display = "flex";
    if (input) {
        input.focus();
        input.select();
    }
}

function fecharModalEditarBanco() {
    const modal = document.getElementById("modalEditarBancoCustom");
    if (modal) modal.style.display = "none";
    bancoEmEdicaoId = null;
}

function salvarEdicaoBancoCustom() {
    const input = document.getElementById("inputNomeBancoEditado");
    if (!input || !bancoEmEdicaoId) return;

    const novoNome = input.value.trim();
    if (!novoNome) {
        if (typeof mostrarNotificacao === 'function') mostrarNotificacao("O nome do banco não pode ficar vazio.", "erro");
        return;
    }

    const banco = (state.bancos || []).find(b => b.id === bancoEmEdicaoId);
    if (banco) {
        banco.nome = novoNome;
        if (typeof save === 'function') save();
        renderizarAbaBancos();
        if (typeof render === 'function') render();
        if (typeof mostrarNotificacao === 'function') mostrarNotificacao("Banco atualizado com sucesso!", "sucesso");
    }

    fecharModalEditarBanco();
}

function abrirModalExcluirBanco(id) {
    const banco = (state.bancos || []).find(b => b.id === id);
    if (!banco) return;

    if (typeof abrirModalConfirmacao === 'function') {
        abrirModalConfirmacao(
            "🚨 Excluir Banco",
            `Tem certeza que deseja excluir o banco "${banco.nome}"?\nAs contas vinculadas a ele ficarão sem banco definido.`,
            () => {
                state.bancos = state.bancos.filter(b => b.id !== id);
                
                (state.contas || []).forEach(c => {
                    if (c.bancoId === id) c.bancoId = "";
                });
                
                if (typeof save === 'function') save();
                renderizarAbaBancos();
                if (typeof render === 'function') render();
                if (typeof mostrarNotificacao === 'function') mostrarNotificacao("Banco excluído com sucesso!", "sucesso");
            }
        );
    }
}

function abrirModalFecharCaixaBancos() {
    let modal = document.getElementById("modalFecharCaixaBancos");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalFecharCaixaBancos";
        modal.className = "modal-overlay";
        modal.style.cssText = "display: none; align-items: center; justify-content: center; z-index: 9999;";
        
        modal.innerHTML = `
            <div class="modal-card" style="max-width: 500px; width: 100%; max-height: 85vh; display: flex; flex-direction: column; padding: 25px;">
                <div class="modal-head" style="flex-shrink: 0; margin-bottom: 15px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 12px;">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 20px;">🏦 Fechamento de Caixa</h3>
                    <button class="close-modal-btn btn-danger" onclick="fecharModalFecharCaixaBancos()" style="padding: 4px 10px;">✕</button>
                </div>
                
                <p style="flex-shrink: 0; color: var(--muted); font-size: 13px; margin-bottom: 15px;">
                    Confira abaixo a soma das vendas da sessão de hoje direcionadas para cada aplicativo de banco:
                </p>

                <div id="corpoModalBancos" style="overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; padding-right: 5px; margin-bottom: 15px;">
                </div>
                
                <div style="flex-shrink: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <button class="btn-green" onclick="fecharModalFecharCaixaBancos()" style="width: 100%; padding: 12px; font-weight: bold; font-size: 14px; cursor: pointer;">Tudo Certo ✅</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const corpoModal = document.getElementById("corpoModalBancos");
    const saldos = saldoPorBanco();
    
    let html = "";
    let totalGeral = 0;

    for (const bancoId in saldos) {
        const banco = saldos[bancoId];
        if (banco.valor > 0) {
            totalGeral += banco.valor;
            const bgCor = "var(--accent-light)";
            const escFunc = typeof esc === 'function' ? esc : (s) => s;
            const moneyFunc = typeof money === 'function' ? money : (v) => `R$ ${v.toFixed(2)}`;
            
            html += `
                <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${bgCor}; border-radius: 8px; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: bold; font-size: 16px; color: #fff;">${escFunc(banco.nome)}</span>
                        <span style="font-size: 20px; font-weight: 900; color: ${bgCor};">${moneyFunc(banco.valor)}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--muted); line-height: 1.4;">
                        <strong style="color: #aaa;">Contas:</strong><br>
                        ${banco.contas.length > 0 ? banco.contas.join('<br>') : "—"}
                    </div>
                </div>
            `;
        }
    }

    if (html === "") {
        html = `<div style="text-align: center; color: var(--muted); padding: 30px; background: rgba(255,255,255,0.02); border-radius: 8px;">Caixa zerado. Nenhuma venda processada nesta sessão ainda.</div>`;
    } else {
        const moneyFunc = typeof money === 'function' ? money : (v) => `R$ ${v.toFixed(2)}`;
        html += `
            <div style="text-align: right; padding-top: 5px;">
                <span style="color: var(--muted); font-size: 14px;">Soma Total (Sessão):</span>
                <span style="font-size: 22px; font-weight: 900; color: #fff; margin-left: 10px;">${moneyFunc(totalGeral)}</span>
            </div>
        `;
    }

    corpoModal.innerHTML = html;
    modal.style.display = "flex";
}

function fecharModalFecharCaixaBancos() {
    const modal = document.getElementById("modalFecharCaixaBancos");
    if (modal) modal.style.display = "none";
}

let lastBancosState = { calAberto: false, mesAberto: false, diaFiltro: '', mesFiltro: '' };

// 🚀 O OLHEIRO INVISÍVEL
setInterval(() => {
    if (typeof state === 'undefined' || !state || typeof abaHistoricoAtiva === 'undefined' || abaHistoricoAtiva !== 'bancos') return;
    
    const currentCalAberto = typeof calPopoverAberto !== 'undefined' ? calPopoverAberto : false;
    const currentMesAberto = typeof mesPopoverAberto !== 'undefined' ? mesPopoverAberto : false;
    const currentDiaFiltro = typeof diaFiltroSelecionado !== 'undefined' && diaFiltroSelecionado ? diaFiltroSelecionado : '';
    const currentMesFiltro = typeof mesFiltroSelecionado !== 'undefined' && mesFiltroSelecionado ? mesFiltroSelecionado : '';

    if (lastBancosState.calAberto !== currentCalAberto ||
        lastBancosState.mesAberto !== currentMesAberto ||
        lastBancosState.diaFiltro !== currentDiaFiltro ||
        lastBancosState.mesFiltro !== currentMesFiltro) {
        
        lastBancosState = { calAberto: currentCalAberto, mesAberto: currentMesAberto, diaFiltro: currentDiaFiltro, mesFiltro: currentMesFiltro };
        if (typeof renderizarAbaBancos === 'function') renderizarAbaBancos();
        return;
    }

    const stats = calcularEstatisticasBancos();
    
    (state.bancos || []).forEach(b => {
        const s = stats[b.id] || { dia: 0, semana: 0, mes: 0, total: 0 };
        
        const elDia = document.getElementById(`banco_dia_${b.id}`);
        if (elDia && typeof money === 'function') {
            const valStr = money(s.dia);
            if (elDia.textContent !== valStr) {
                elDia.textContent = valStr;
                elDia.style.color = s.dia > 0 ? 'var(--green)' : '#fff';
            }
        }
        
        const elSem = document.getElementById(`banco_sem_${b.id}`);
        if (elSem && typeof money === 'function') {
            const valStr = money(s.semana);
            if (elSem.textContent !== valStr) {
                elSem.textContent = valStr;
                elSem.style.color = s.semana > 0 ? 'var(--green)' : '#fff';
            }
        }
        
        const elMes = document.getElementById(`banco_mes_${b.id}`);
        if (elMes && typeof money === 'function') {
            const valStr = money(s.mes);
            if (elMes.textContent !== valStr) {
                elMes.textContent = valStr;
                elMes.style.color = s.mes > 0 ? 'var(--green)' : '#fff';
            }
        }
        
        const elTot = document.getElementById(`banco_tot_${b.id}`);
        if (elTot && typeof money === 'function') {
            const valStr = money(s.total);
            if (elTot.textContent !== valStr) elTot.textContent = valStr;
        }
    });

    const sSem = stats['sem-banco'];
    if (sSem) {
         const elDiaSem = document.getElementById(`banco_dia_sem_banco`);
         if (elDiaSem && typeof money === 'function') {
             const valStr = money(sSem.dia);
             if (elDiaSem.textContent !== valStr) elDiaSem.textContent = valStr;
         }
         const elSemSem = document.getElementById(`banco_sem_sem_banco`);
         if (elSemSem && typeof money === 'function') {
             const valStr = money(sSem.semana);
             if (elSemSem.textContent !== valStr) elSemSem.textContent = valStr;
         }
         const elMesSem = document.getElementById(`banco_mes_sem_banco`);
         if (elMesSem && typeof money === 'function') {
             const valStr = money(sSem.mes);
             if (elMesSem.textContent !== valStr) elMesSem.textContent = valStr;
         }
         const elTotSem = document.getElementById(`banco_tot_sem_banco`);
         if (elTotSem && typeof money === 'function') {
             const valStr = money(sSem.total);
             if (elTotSem.textContent !== valStr) elTotSem.textContent = valStr;
         }
    }
}, 150);

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (typeof renderizarAbaBancos === 'function') renderizarAbaBancos();
    }, 200);
});
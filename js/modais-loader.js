// ========================================================
// MÓDULO DE INJEÇÃO DINÂMICA DE MODAIS
// ========================================================

document.addEventListener("DOMContentLoaded", () => {
  const modaisHtmlContainer = document.createElement("div");
  modaisHtmlContainer.id = "sistemaModaisDinamicos";
  modaisHtmlContainer.innerHTML = `
    <div id="authModal" class="modal-overlay" style="display: none">
      <div class="modal-card">
        <div class="modal-head">
          <h3 id="modalTitle" style="margin: 0">🔑 Acesso Administrativo</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalAuth()">✕</button>
        </div>
        <div id="authFormArea">
          <div class="field" style="margin-top: 12px">
            <label>E-mail</label>
            <input id="authEmail" type="email" placeholder="seuemail@exemplo.com" />
          </div>
          <div class="field" style="margin-top: 10px">
            <label>Senha</label>
            <div style="position: relative; display: flex; align-items: center">
              <input id="authPassword" type="password" placeholder="Sua senha" style="padding-right: 35px" />
              <span id="togglePasswordBtn" onclick="toggleMostrarSenha()" style="position: absolute; right: 12px; cursor: pointer; font-size: 16px; user-select: none;" title="Mostrar/Ocultar Senha">👁️</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 12px">
            <input type="checkbox" id="lembrarCredenciais" style="width: 16px; height: 16px; cursor: pointer" />
            <label for="lembrarCredenciais" style="font-size: 13px; color: var(--muted); cursor: pointer">Manter conectado</label>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 16px">
            <button type="button" class="btn-green" style="flex: 1" onclick="fazerLogin()">Entrar</button>
            <button type="button" class="btn-gray" onclick="fecharModalAuth()">Cancelar</button>
          </div>
        </div>
        <div id="authUserInfo" style="display: none; margin-top: 12px">
          <p id="userLoggedText" style="font-size: 14px; margin: 0 0 14px"></p>
          <button type="button" class="btn-danger" style="width: 100%" onclick="fazerLogout()">🚪 Sair da Conta</button>
        </div>
      </div>
    </div>

    <div id="clienteDetalhesModal" class="modal-overlay" style="display: none">
      <div class="modal-card modal-card-large" style="max-width: 650px">
        <div class="modal-head" style="align-items: flex-start; flex-wrap: wrap; gap: 12px">
          <div id="detalhesClienteTitulo" style="margin: 0; flex: 1 1 250px; min-width: 0; word-wrap: break-word;">
            <h3 style="margin: 0; color: var(--accent-light)">👤 Detalhes do Cliente</h3>
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start; flex-shrink: 0; margin-left: auto;">
            <div id="containerBtnNovaVendaCliente" style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end;"></div>
            <button type="button" class="btn-danger close-modal-btn" style="flex-shrink: 0" onclick="fecharModalDetalhesCliente()">✕</button>
          </div>
        </div>

        <div style="margin: 15px 0; background: rgba(142, 68, 255, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 12px; padding: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
          <div>
            <div style="font-size: 11px; color: var(--muted); text-transform: uppercase;">Total Gasto</div>
            <div id="detalhesClienteTotalGasto" style="font-size: 18px; font-weight: 900; color: var(--green); margin-top: 4px;">R$ 0,00</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--muted); text-transform: uppercase;">V-Bucks Resgatados</div>
            <div id="detalhesClienteTotalVbucks" style="font-size: 18px; font-weight: 900; color: var(--accent-light); margin-top: 4px;">0 VB</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--muted); text-transform: uppercase;">Total de Pedidos</div>
            <div id="detalhesClienteTotalPedidos" style="font-size: 18px; font-weight: 900; color: #fff; margin-top: 4px;">0</div>
          </div>
        </div>

        <div style="font-size: 13px; font-weight: 700; color: var(--muted); margin-bottom: 8px;">📜 Histórico de Pedidos Realizados:</div>
        <div id="detalhesClienteListaPedidos" style="max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;"></div>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px">
          <button type="button" class="btn-gray" onclick="fecharModalDetalhesCliente()">Fechar</button>
        </div>
      </div>
    </div>

    <div id="editClienteModal" class="modal-overlay" style="display: none; z-index: 1050">
      <div class="modal-card">
        <div class="modal-head">
          <h3 style="margin: 0; color: var(--accent-light)">✏️ Editar Perfil do Cliente</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalEdicaoCliente()">✕</button>
        </div>
        <input type="hidden" id="editClienteNomeOriginal" />
        <p style="font-size: 12px; color: var(--muted); margin: 10px 0 14px">Altere o nome ou os contatos gerais. Isso atualizará <b>todas</b> as compras antigas dessa pessoa.</p>

        <div class="field" style="margin-top: 14px">
          <label>Nome Completo do Cliente</label>
          <input id="editClienteNomeInput" type="text" maxlength="80" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>WhatsApp</label>
          <input id="editClienteWhatsappInput" type="text" maxlength="25" oninput="mascaraTelefone(event)" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>TikTok</label>
          <input id="editClienteTiktokInput" type="text" maxlength="40" />
        </div>

        <div class="field" style="margin-top: 10px; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 10px;">
          <label style="color: var(--accent-light)">📌 Observação Fixa do Cliente (opcional)</label>
          <input id="editClienteObservacaoInput" type="text" maxlength="150" placeholder="Ex: Cliente VIP, prefere pacotões, etc..." />
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px">
          <button type="button" class="btn-green" style="flex: 1" onclick="salvarEdicaoCliente()">💾 Salvar Alterações</button>
          <button type="button" class="btn-gray" onclick="fecharModalEdicaoCliente()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="leituraObsModal" class="modal-overlay" style="display: none; z-index: 1060">
      <div class="modal-card">
        <div class="modal-head">
          <h3 style="margin: 0; color: #ffb74d">⚠️ Observação Salva</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="document.getElementById('leituraObsModal').style.display = 'none'">✕</button>
        </div>
        <div id="leituraObsNome" style="font-size: 13px; font-weight: 700; color: #fff; margin-top: 14px;"></div>
        <div id="leituraObsTexto" style="font-size: 14px; color: #fff; margin: 8px 0 16px; background: rgba(0, 0, 0, 0.3); padding: 14px; border-radius: 8px; border-left: 4px solid #ff9800; line-height: 1.5; word-wrap: break-word;"></div>
        <div style="display: flex; justify-content: flex-end">
          <button type="button" class="btn-green" style="padding: 8px 24px" onclick="document.getElementById('leituraObsModal').style.display = 'none'">Estou ciente</button>
        </div>
      </div>
    </div>

    <div id="apoiadorModal" class="modal-overlay" style="display: none">
      <div class="modal-card modal-card-large" style="overflow: visible">
        <div class="modal-head">
          <h3 style="margin: 0; color: var(--accent-light)">🤝 Gerenciar Código Apoiador</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalApoiador()">✕</button>
        </div>
        <p style="font-size: 12px; color: var(--muted); margin: 10px 0 14px">Registre o valor bruto fechado em dólares ($) e o valor líquido real (R$) recebido no mês:</p>

        <div class="apoiador-form-grid" style="position: relative; z-index: 50">
          <div class="field" id="apoiadorSeletorContainer" style="grid-column: 1 / -1"></div>
          <div class="field">
            <label>Valor Bruto ($ USD)</label>
            <input id="apoiadorBrutoUsd" type="number" step="0.01" min="0" placeholder="Ex: 200.00" style="width: 100%; box-sizing: border-box" />
          </div>
          <div class="field">
            <label>Líquido Recebido (R$)</label>
            <input id="apoiadorLiquidoBrl" type="number" step="0.01" min="0" placeholder="Ex: 950.00" style="width: 100%; box-sizing: border-box" />
          </div>
        </div>
        <button type="button" class="btn-green" style="width: 100%; margin-top: 14px; margin-bottom: 16px" onclick="salvarRegistroApoiador()">💾 Salvar / Atualizar Apoiador do Mês</button>

        <div style="display: flex; justify-content: flex-end; margin-top: 16px">
          <button type="button" class="btn-gray" onclick="fecharModalApoiador()">Fechar</button>
        </div>
      </div>
    </div>

    <div id="valorBaseModal" class="modal-overlay" style="display: none">
      <div class="modal-card">
        <div class="modal-head">
          <h3 style="margin: 0">⚙️ Alterar Valor Base</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalValorBase()">✕</button>
        </div>
        <p style="font-size: 13px; color: var(--muted); margin: 12px 0 8px">Defina o novo valor cobrado por cada 100 V-Bucks:</p>
        <div class="field">
          <label>Valor por 100 V-Bucks (R$)</label>
          <input id="novoValorBaseInput" type="number" step="0.01" min="0.01" placeholder="Ex.: 2.50" />
        </div>
        <div style="display: flex; gap: 10px; margin-top: 16px">
          <button type="button" class="btn-green" style="flex: 1" onclick="salvarValorBaseModal()">💾 Salvar Novo Valor</button>
          <button type="button" class="btn-gray" onclick="fecharModalValorBase()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="addContaModal" class="modal-overlay" style="display: none">
      <div class="modal-card">
        <div class="modal-head">
          <h3 style="margin: 0">➕ Adicionar Nova Conta</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalAddConta()">✕</button>
        </div>
        <div class="field" style="margin-top: 14px">
          <label>Nome / Nick da Conta</label>
          <input id="novaContaNomeInput" type="text" maxlength="60" placeholder="Ex.: Putz0606" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>Saldo Inicial de V-Bucks (opcional)</label>
          <input id="novaContaVbucksInput" type="text" placeholder="Ex.: 8100 ou 8.100" value="0" />
        </div>
        <div class="field" style="margin-top: 10px; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 10px;">
          <label>E-mail de Login (opcional)</label>
          <input id="novaContaEmailInput" type="email" placeholder="email@epic.com" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>Senha da Epic (opcional)</label>
          <input id="novaContaSenhaInput" type="text" placeholder="Sua senha" />
        </div>
        <div style="display: flex; gap: 10px; margin-top: 16px">
          <button type="button" class="btn-green" style="flex: 1" onclick="salvarNovaContaModal()">➕ Adicionar Conta</button>
          <button type="button" class="btn-gray" onclick="fecharModalAddConta()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="editContaModal" class="modal-overlay" style="display: none">
      <div class="modal-card">
        <div class="modal-head">
          <h3 id="editContaTitle" style="margin: 0">✏️ Editar Conta</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalEditConta()">✕</button>
        </div>
        <input type="hidden" id="editContaIndex" />
        <div class="field" style="margin-top: 14px">
          <label>Nick da Conta</label>
          <input id="editContaNomeInput" type="text" maxlength="60" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>Saldo Atual de V-Bucks</label>
          <input id="editContaVbucksInput" type="text" placeholder="Ex.: 8100 ou 8.100" />
        </div>
        <div class="field" style="margin-top: 10px; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 10px;">
          <label>E-mail de Login (opcional)</label>
          <input id="editContaEmailInput" type="email" placeholder="email@epic.com" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>Senha da Epic (opcional)</label>
          <input id="editContaSenhaInput" type="text" placeholder="Sua senha" />
        </div>

        <div class="field" style="margin-top: 12px; border-top: 1px dashed rgba(255, 255, 255, 0.1); padding-top: 10px;">
          <label style="color: var(--green); font-weight: 700">➕ Somar V-Bucks ao Saldo</label>
          <div style="display: flex; gap: 8px">
            <input id="editContaSomarVbucksInput" type="number" step="50" placeholder="Ex.: 800, 2400 ou 12500" />
            <button type="button" class="btn-green" style="padding: 0 14px; font-size: 13px; white-space: nowrap" onclick="aplicarSomaVbucksModal()">Somar</button>
          </div>
        </div>

        <div class="quick" style="margin-top: 8px">
          <button type="button" style="font-size: 11px; padding: 5px 10px" onclick="somarPacoteRapido(800)">+800</button>
          <button type="button" style="font-size: 11px; padding: 5px 10px" onclick="somarPacoteRapido(2400)">+2.400</button>
          <button type="button" style="font-size: 11px; padding: 5px 10px" onclick="somarPacoteRapido(4500)">+4.500</button>
          <button type="button" style="font-size: 11px; padding: 5px 10px" onclick="somarPacoteRapido(12500)">+12.500</button>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 18px">
          <button type="button" class="btn-green" style="flex: 1" onclick="salvarEdicaoContaModal()">💾 Salvar Dados</button>
          <button type="button" class="btn-gray" onclick="fecharModalEditConta()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="editSaleModal" class="modal-overlay" style="display: none; align-items: center; justify-content: center; z-index: 1050;">
      <div class="modal-card modal-card-large" style="max-height: 85vh; display: flex; flex-direction: column; width: 100%; max-width: 650px; box-sizing: border-box; margin: auto;">
        <div class="modal-head" style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
          <h3 id="editSaleTitle" style="margin: 0; color: var(--accent-light)">✏️ Editar Registro de Venda</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalEdicao()" style="padding: 4px 10px; font-size: 14px; cursor: pointer">✕</button>
        </div>

        <input type="hidden" id="editVendaId" />
        <input type="hidden" id="editTipoRegistro" value="venda" />

        <div class="modal-body-grid" style="overflow-y: auto; max-height: calc(85vh - 130px); padding-right: 6px; margin: 12px 0; flex: 1; display: flex; flex-direction: column; gap: 10px;">
          <div class="field">
            <label>Conta utilizada</label>
            <select id="editContaSelect"></select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
            <div class="field">
              <label>Nome do Cliente</label>
              <input id="editClientInput" type="text" maxlength="80" />
            </div>
            <div class="field">
              <label>Nick do Cliente</label>
              <input id="editNickInput" type="text" maxlength="80" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
            <div class="field">
              <label>WhatsApp</label>
              <input id="editWhatsappInput" type="text" maxlength="25" oninput="mascaraTelefone(event)" />
            </div>
            <div class="field">
              <label>TikTok</label>
              <input id="editTiktokInput" type="text" maxlength="40" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10px;">
            <div class="field">
              <label>📅 Data da Venda (DD/MM/AAAA)</label>
              <input id="editDataInput" type="text" maxlength="10" placeholder="Ex.: 23/08/2026" />
            </div>
            <div class="field">
              <label>⏰ Horário (HH:MM)</label>
              <input id="editHoraInput" type="text" maxlength="5" placeholder="Ex.: 19:30" />
            </div>
          </div>

          <div class="field" style="position: relative">
            <div class="field-label-row">
              <label>Valor da Venda (R$)</label>
              <span id="editVbucksPreview" class="vbucks-badge-preview">🪙 0 V-Bucks</span>
            </div>
            <input id="editValorInput" type="number" step="0.01" min="0.01" oninput="atualizarPreviewVBucksEdicao()" />
          </div>

          <div id="editItensListContainer" style="display: flex; flex-direction: column; gap: 8px"></div>

          <div class="field">
            <label>💬 Observação (opcional)</label>
            <input id="editObservacaoInput" type="text" maxlength="1000" placeholder="Ex.: Cliente pediu para enviar só amanhã" />
          </div>
        </div>

        <div style="display: flex; gap: 10px; flex-shrink: 0; border-top: 1px solid var(--border); padding-top: 12px; margin-top: auto;">
          <button type="button" class="btn-green" style="flex: 1; padding: 12px" onclick="salvarEdicaoVenda()">💾 Salvar Alterações</button>
          <button type="button" class="btn-gray" style="padding: 12px 20px" onclick="fecharModalEdicao()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="editItemModal" class="modal-overlay" style="display: none; z-index: 1050">
      <div class="modal-card">
        <div class="modal-head">
          <h3 style="margin: 0; color: var(--accent-light)">✏️ Editar Item</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalEdicaoItem()">✕</button>
        </div>
        <p style="font-size: 12px; color: var(--muted); margin: 10px 0 14px">Altere o nome, categoria ou V-Bucks do item. Isso atualizará todas as vendas e recalculará os totais do sistema.</p>

        <div class="field" style="margin-top: 14px">
          <label>Nome do Item</label>
          <input id="editItemNomeInput" type="text" maxlength="120" />
        </div>
        <div class="field" style="margin-top: 10px">
          <label>Tipo / Categoria</label>
          <select id="editItemTipoSelect"></select>
        </div>
        <div class="field" style="margin-top: 10px">
          <label>Valor Unitário em V-Bucks</label>
          <input id="editItemVbucksInput" type="number" step="50" min="0" placeholder="Ex: 500, 1200..." />
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px">
          <button type="button" class="btn-green" style="flex: 1" onclick="salvarEdicaoItem()">💾 Salvar Alterações</button>
          <button type="button" class="btn-gray" onclick="fecharModalEdicaoItem()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="itemDetalhesModal" class="modal-overlay" style="display: none; z-index: 1050">
      <div class="modal-card modal-card-large" style="max-width: 650px">
        <div class="modal-head" style="display: flex; justify-content: space-between; align-items: center;">
          <h3 id="detalhesItemTitulo" style="margin: 0; color: var(--accent-light)">📦 Compradores do Item</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalDetalhesItem()">✕</button>
        </div>

        <p style="font-size: 13px; color: var(--muted); margin: 12px 0 14px">Lista de todos os clientes que adquiriram este item, com contatos e contas utilizadas:</p>

        <div id="detalhesItemListaCompradores" style="max-height: 360px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px;"></div>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px">
          <button type="button" class="btn-gray" onclick="fecharModalDetalhesItem()">Fechar</button>
        </div>
      </div>
    </div>

    <div id="trashModal" class="modal-overlay" style="display: none">
      <div class="modal-card modal-card-large">
        <div class="modal-head">
          <h3 style="margin: 0; color: var(--accent-light)">🗑️ Lixeira de Vendas</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalLixeira()">✕</button>
        </div>
        <p style="font-size: 12px; color: var(--muted); margin: 10px 0 14px">Vendas excluídas que podem ser restauradas ao histórico a qualquer momento:</p>
        <div id="trashListContainer" class="trash-list-container"></div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn-danger" onclick="esvaziarLixeira()">🔥 Esvaziar Lixeira</button>
          <button type="button" class="btn-gray" onclick="fecharModalLixeira()">Fechar</button>
        </div>
      </div>
    </div>

    <div id="genericConfirmModal" class="modal-overlay" style="display: none; z-index: 10500">
      <div class="modal-card">
        <div class="modal-head">
          <h3 id="genericConfirmTitle" style="margin: 0">⚠️ Confirmação</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalConfirmacao()">✕</button>
        </div>
        <p id="genericConfirmDesc" style="font-size: 14px; color: var(--muted); margin: 14px 0 18px"></p>
        <div style="display: flex; gap: 10px">
          <button type="button" class="btn-danger" style="flex: 1" id="genericConfirmOkBtn">Confirmar</button>
          <button type="button" class="btn-gray" onclick="fecharModalConfirmacao()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="toastContainer" class="toast-container"></div>

    <div id="modalAdicionarClienteRetroativo" class="modal-overlay" style="display: none; z-index: 1050;">
      <div class="modal-card" style="max-width: 480px;">
        <div class="modal-head" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
          <h3 style="margin: 0; color: var(--accent-light);">➕ Adicionar Novo Cliente</h3>
          <button type="button" class="btn-danger close-modal-btn" onclick="fecharModalAdicionarClienteRetroativo()">✕</button>
        </div>

        <p style="font-size: 12px; color: var(--muted); margin: 12px 0;">Cadastre um novo cliente no sistema para futuros atendimentos.</p>

        <div class="modal-body-grid" style="display: flex; flex-direction: column; gap: 12px;">
          <div class="field">
            <label>Nome do Cliente *</label>
            <input id="retroClienteInput" type="text" maxlength="80" placeholder="Ex: João Silva">
          </div>
          <div class="field">
            <label>Nick do Cliente *</label>
            <input id="retroNickInput" type="text" maxlength="80" placeholder="Ex: JoaoFortnite">
          </div>
          <div class="field">
            <label>WhatsApp</label>
            <input id="retroWhatsappInput" type="text" maxlength="25" placeholder="Ex: +55 (27) 99999-9999" oninput="mascaraTelefone(event)">
          </div>
          <div class="field">
            <label>TikTok</label>
            <input id="retroTiktokInput" type="text" maxlength="40" placeholder="Ex: @joao_tk">
          </div>
          <div class="field">
            <label>💬 Observação (opcional)</label>
            <input id="retroObservacaoInput" type="text" maxlength="1000" placeholder="Ex: Cliente VIP" />
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px; border-top: 1px solid var(--border); padding-top: 14px;">
          <button type="button" class="btn-green" style="flex: 1; padding: 12px;" onclick="salvarClienteSimples()">💾 Salvar Cliente</button>
          <button type="button" class="btn-gray" style="padding: 12px 20px;" onclick="fecharModalAdicionarClienteRetroativo()">Cancelar</button>
        </div>
      </div>
    </div>

    <div id="modalAntiDuplicacao" class="modal-overlay" style="display: none; z-index: 9999">
      <div class="modal-card" style="max-width: 450px; text-align: center; padding: 30px">
        <div style="font-size: 40px; margin-bottom: 10px">⚠️</div>
        <h3 style="color: #ffb74d; margin-top: 0">Cliente Já Existe!</h3>
        <p style="color: var(--muted); font-size: 14px; margin-bottom: 15px">
          Você digitou o nome <strong id="antiDupNomeTexto" style="color: #fff"></strong>, mas o sistema identificou que este cliente já possui cadastro. Clique abaixo para abrir o perfil dele ou continuar como outra pessoa:
        </p>

        <div id="listaHomonimos" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 200px; overflow-y: auto; text-align: left;"></div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <button class="btn-gray" onclick="confirmarVendaNovoHomonimo()" style="padding: 12px; font-size: 14px">➕ É outra pessoa (Criar Novo Cliente)</button>
          <button class="btn-danger" onclick="fecharModalAntiDuplicacao()" style="padding: 12px; font-size: 14px; background: transparent; border: 1px solid var(--danger);">❌ Cancelar e voltar</button>
        </div>
      </div>
    </div>

    <div id="modalMesclarClientes" class="modal-overlay" style="display: none; z-index: 9999">
      <div class="modal-card" style="max-width: 500px">
        <div class="modal-head" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
          <h3 style="margin: 0; color: #fff">🔗 Unificar Clientes</h3>
          <button class="btn-danger close-modal-btn" onclick="fecharModalMesclar()" style="padding: 4px 10px">✕</button>
        </div>
        <p style="color: var(--muted); font-size: 13px; margin-bottom: 20px">
          Esta ação moverá todo o histórico, V-Bucks e compras do <strong style="color: var(--danger)">Cliente Duplicado</strong> para o <strong style="color: var(--green)">Cliente Original</strong>, e o perfil duplicado será excluído.
        </p>

        <div class="field" style="margin-bottom: 15px">
          <label style="color: var(--danger)">1. Cliente Duplicado (Que será apagado)</label>
          <input type="text" id="mesclarOrigem" disabled style="background: rgba(255, 71, 87, 0.1); border-color: rgba(255, 71, 87, 0.3); color: #fff;" />
          <input type="hidden" id="mesclarOrigemId" />
        </div>

        <div class="field" style="position: relative; margin-bottom: 25px">
          <label style="color: var(--green)">2. Pesquise o Cliente Original (Que receberá os dados)</label>
          <input type="text" id="mesclarDestinoBusca" placeholder="Digite o nome do cliente original..." oninput="buscarSugestoesMesclar(this.value)" autocomplete="off" />
          <input type="hidden" id="mesclarDestinoId" />
          <div id="mesclarSuggestions" class="autocomplete-dropdown" style="top: 65px"></div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px">
          <button class="btn-gray" onclick="fecharModalMesclar()">Cancelar</button>
          <button class="btn-green" onclick="executarMesclagem()">🔗 Unificar Histórico</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modaisHtmlContainer);
});
// ========================================================
// MÓDULO DA ABA DE ITENS (Histórico e Gestão de Produtos)
// ========================================================

let itensPaginaAtual = 1;
let itensTermoBusca = "";
let itemFiltroCategoria = "";
let itemOrdenacaoAtual = "mais_vendidos";
let ocultarLucroItens = false;
let itemEmEdicaoNomeOriginal = null;
let itemOrigemEdicao = null;

function snapVBucksTier(val) {
  const tiers = [200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 1800, 2000, 2800, 3500, 5000, 8000];
  if (!val || val <= 0) return 0;
  let closest = tiers[0];
  let minDiff = Math.abs(val - closest);
  for (let i = 1; i < tiers.length; i++) {
    let diff = Math.abs(val - tiers[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = tiers[i];
    }
  }
  return closest;
}

function filtrarItensInput(val) {
  itensTermoBusca = String(val || "").trim().toLowerCase();
  itensPaginaAtual = 1;
  const btnClear = document.getElementById("clearItemSearchBtn");
  if (btnClear) btnClear.style.display = itensTermoBusca ? "block" : "none";
  renderizarHistoricoItensCompleto();
}

function filtrarItensPorCategoria(tipo) {
  itemFiltroCategoria = String(tipo || "").trim();
  itensPaginaAtual = 1;
  renderizarHistoricoItensCompleto();
}

function ordenarItens(criterio) {
  itemOrdenacaoAtual = String(criterio || "mais_vendidos").trim();
  itensPaginaAtual = 1;
  renderizarHistoricoItensCompleto();
}

function toggleOcultarLucroItens() {
  ocultarLucroItens = !ocultarLucroItens;
  const btn = document.getElementById("eyeToggleLucroBtn");
  if (btn) {
    btn.innerHTML = ocultarLucroItens ? "🙈 Mostrar Lucro" : "👁️ Ocultar Lucro";
  }
  renderizarHistoricoItensCompleto();
}

function limparBuscaItens() {
  itensTermoBusca = "";
  itemFiltroCategoria = "";
  itemOrdenacaoAtual = "mais_vendidos";
  ocultarLucroItens = false;
  itensPaginaAtual = 1;
  if (document.getElementById("itemSearchInput")) document.getElementById("itemSearchInput").value = "";
  const selectFiltro = document.getElementById("itemFiltroCategoriaSelect");
  if (selectFiltro) selectFiltro.value = "";
  const selectOrd = document.getElementById("itemOrdenacaoSelect");
  if (selectOrd) selectOrd.value = "mais_vendidos";
  const btnClear = document.getElementById("clearItemSearchBtn");
  if (btnClear) btnClear.style.display = "none";
  const btnEye = document.getElementById("eyeToggleLucroBtn");
  if (btnEye) btnEye.innerHTML = "👁️ Ocultar Lucro";
  renderizarHistoricoItensCompleto();
}

function mudarPaginaItens(p) {
  itensPaginaAtual = p;
  renderizarHistoricoItensCompleto();
  const barraBusca = document.querySelector("#conteudoAbaItens .history-search-bar-box");
  if (barraBusca) barraBusca.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderizarHistoricoItensCompleto() {
  const container = document.getElementById("tabelaHistoricoItensCompleto");
  const resumoEl = document.getElementById("totalItensResumo");
  const paginacaoContainer = document.getElementById("itensPagination");
  if (!container) return;

  const historico = state.historicoVendas || [];
  const itensMap = {};
  const baseAtual = Number(state?.valorBase100 || 2.5);

  historico.forEach(v => {
    const listaItens = Array.isArray(v.itens) && v.itens.length > 0 ? v.itens : (v.item ? [{ tipo: "Outro", nome: v.item }] : []);
    const qtdItensNoPedido = listaItens.length || 1;
    const vbucksPedido = v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);

    listaItens.forEach(itemObj => {
      let tipo = "Outro", nome = "", vbEspecifico = 0;
      if (typeof itemObj === "string") {
        nome = itemObj.trim();
      } else if (itemObj) {
        tipo = itemObj.tipo || "Outro";
        nome = String(itemObj.nome || "").trim();
        vbEspecifico = Number(itemObj.vbucks) || 0;
      }

      if (!nome) return;
      const chaveKey = nome.toLowerCase();

      if (!itensMap[chaveKey]) {
        itensMap[chaveKey] = {
          nomeOriginal: nome,
          tipo: tipo,
          totalVendidos: 0,
          somaVbucksBrutos: 0,
          searchString: nome.toLowerCase() + " " + tipo.toLowerCase()
        };
      }

      itensMap[chaveKey].totalVendidos += 1;
      
      const vbAtribuido = vbEspecifico > 0 ? vbEspecifico : (vbucksPedido / qtdItensNoPedido);
      itensMap[chaveKey].somaVbucksBrutos += vbAtribuido;

      if (tipo && tipo !== "Outro") itensMap[chaveKey].tipo = tipo;
    });
  });

  let listaItensArr = Object.values(itensMap);

  if (itensTermoBusca) {
    listaItensArr = listaItensArr.filter(i => i.searchString.includes(itensTermoBusca));
  }

  if (itemFiltroCategoria) {
    listaItensArr = listaItensArr.filter(i => i.tipo.toLowerCase() === itemFiltroCategoria.toLowerCase());
  }

  listaItensArr.forEach(item => {
    const mediaBruta = item.totalVendidos > 0 ? (item.somaVbucksBrutos / item.totalVendidos) : 0;
    item.vbucksUnitario = snapVBucksTier(mediaBruta);
    item.vbucksAcumuladoReal = item.vbucksUnitario * item.totalVendidos;
    item.faturamentoReal = (item.vbucksAcumuladoReal / 100) * baseAtual;
  });

  listaItensArr.sort((a, b) => {
    if (itemOrdenacaoAtual === "menos_vendidos") {
      return a.totalVendidos - b.totalVendidos;
    } else if (itemOrdenacaoAtual === "maior_vbucks") {
      return b.vbucksAcumuladoReal - a.vbucksAcumuladoReal;
    } else if (itemOrdenacaoAtual === "alfabetica") {
      return a.nomeOriginal.localeCompare(b.nomeOriginal, 'pt-BR', { sensitivity: 'base' });
    } else {
      return b.totalVendidos - a.totalVendidos;
    }
  });

  const totalItensFiltrados = listaItensArr.length;
  const totalPaginas = Math.ceil(totalItensFiltrados / ITENS_POR_PAGINA) || 1;
  if (itensPaginaAtual > totalPaginas) itensPaginaAtual = totalPaginas;
  if (itensPaginaAtual < 1) itensPaginaAtual = 1;
  const itensPagina = listaItensArr.slice((itensPaginaAtual - 1) * ITENS_POR_PAGINA, itensPaginaAtual * ITENS_POR_PAGINA);

  if (resumoEl) resumoEl.textContent = `${totalItensFiltrados} ${totalItensFiltrados === 1 ? 'item encontrado' : 'itens encontrados'}`;

  if (itensPagina.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--muted); font-size:13px;">Nenhum item encontrado com esses filtros.</div>`;
    if (paginacaoContainer) paginacaoContainer.innerHTML = "";
    return;
  }

  const mLucro = typeof MARGEM_LUCRO !== 'undefined' ? MARGEM_LUCRO : (100 / 310);

  container.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="financial-table" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:12px; text-align:left; border-bottom:1px solid var(--border);">Nome do Item</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Tipo</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Qtd. Vendida</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">V-Bucks Unitário</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">V-Bucks Acumulados</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Faturamento (R$)</th>
            <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border);">Lucro (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${itensPagina.map(item => {
            const lucroItem = item.faturamentoReal * mLucro;
            const lucroFormatado = ocultarLucroItens ? "R$ *****" : money(lucroItem);

            return `
              <tr style="cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='rgba(142,68,255,0.08)'" onmouseout="this.style.background='transparent'" onclick="abrirModalDetalhesItem(\`${item.nomeOriginal.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`)">
                <td style="padding:12px; border-bottom:1px solid var(--border); font-weight:700; color:var(--accent-light);">🎁 ${esc(item.nomeOriginal)} 🔍</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:#fff; font-weight:600;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; white-space: nowrap;">${esc(item.tipo)}</span>
                </td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:var(--muted); font-weight:700;">${item.totalVendidos}x</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:#ffb74d; font-weight:700;">🪙 ${formatVBucks(item.vbucksUnitario)} VB</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:#ffb74d; font-weight:700;">🪙 ${formatVBucks(item.vbucksAcumuladoReal)} VB</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:var(--accent-light); font-weight:900;">${money(item.faturamentoReal)}</td>
                <td style="padding:12px; text-align:center; border-bottom:1px solid var(--border); color:var(--green); font-weight:900;">${lucroFormatado}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>`;

  if (paginacaoContainer) {
    if (totalItensFiltrados <= ITENS_POR_PAGINA) {
      paginacaoContainer.innerHTML = "";
    } else {
      let bHtml = "";
      for (let p = 1; p <= totalPaginas; p++) {
        if (p === 1 || p === totalPaginas || (p >= itensPaginaAtual - 1 && p <= itensPaginaAtual + 1)) {
          bHtml += `<button type="button" class="pagination-btn ${p === itensPaginaAtual ? "active" : ""}" onclick="mudarPaginaItens(${p})">${p}</button>`;
        } else if (p === itensPaginaAtual - 2 || p === itensPaginaAtual + 2) {
          bHtml += `<span style="color:var(--muted); font-size:12px; padding:0 2px;">...</span>`;
        }
      }
      paginacaoContainer.innerHTML = `<div class="pagination-controls-row"><button type="button" class="pagination-btn" ${itensPaginaAtual === 1 ? "disabled" : ""} onclick="mudarPaginaItens(${itensPaginaAtual - 1})">‹ Anterior</button>${bHtml}<button type="button" class="pagination-btn" ${itensPaginaAtual === totalPaginas ? "disabled" : ""} onclick="mudarPaginaItens(${itensPaginaAtual + 1})">Próxima ›</button></div>`;
    }
  }
}

function abrirModalDetalhesItem(nomeItem) {
  const modal = document.getElementById("itemDetalhesModal");
  const modalHead = modal?.querySelector(".modal-head");
  const listaContainer = document.getElementById("detalhesItemListaCompradores");
  if (!modal || !listaContainer) return;

  let tipoAtual = "Outro";
  const historico = state.historicoVendas || [];
  for (let v of historico) {
    const lista = Array.isArray(v.itens) && v.itens.length ? v.itens : (v.item ? [v.item] : []);
    for (let it of lista) {
      let itName = typeof it === 'string' ? it : (it.nome || '');
      if (itName.trim().toLowerCase() === nomeItem.toLowerCase() && typeof it === 'object' && it.tipo) {
        tipoAtual = it.tipo;
        break;
      }
    }
  }

  if (modalHead) {
    modalHead.style.display = "block";
    modalHead.style.width = "100%";
    modalHead.innerHTML = `
      <div style="position: relative; width: 100%;">
        <button type="button" class="btn-danger close-modal-btn" style="position: absolute; top: -5px; right: 0; height: 36px; width: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; padding: 0; flex-shrink: 0; z-index: 10;" onclick="fecharModalDetalhesItem()">✕</button>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; padding-right: 50px; gap: 10px; flex-wrap: wrap;">
          <div style="font-size: 12px; color: var(--muted); text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-top: 10px;">
            📦 Detalhes do Item
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
            <button type="button" class="btn-gray" style="height: 36px; padding: 0 16px; font-size: 12px; font-weight: bold; border-radius: 8px; white-space: nowrap;" onclick="abrirModalEdicaoItem(\`${nomeItem.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`, \`${tipoAtual.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`)">✏️ Editar Item</button>
            <button type="button" class="btn-danger" style="height: 36px; padding: 0 16px; font-size: 12px; font-weight: bold; border-radius: 8px; white-space: nowrap;" onclick="excluirItemDoHistorico(\`${nomeItem.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`); fecharModalDetalhesItem();">🗑️ Excluir Item</button>
          </div>
        </div>
        
        <div style="width: 100%; margin-top: 16px;">
          <h3 style="margin:0; color:#fff; font-size: 24px; font-weight: 900; line-height: 1.3; word-wrap: break-word; padding-right: 20px;">
            🎁 <span class="copyable-text" onclick="copiarTexto('${esc(nomeItem).replace(/'/g, "\\'")}', 'Nome do Item', event)">${esc(nomeItem)}</span>
          </h3>
        </div>
      </div>
    `;
  }

  const pedidosComItem = [];

  historico.forEach(v => {
    const listaItens = Array.isArray(v.itens) && v.itens.length > 0 ? v.itens : (v.item ? [{ tipo: "Outro", nome: v.item }] : []);
    const comprouEsteItem = listaItens.some(itemObj => {
      let nome = typeof itemObj === "string" ? itemObj : (itemObj?.nome || "");
      return String(nome).trim().toLowerCase() === nomeItem.toLowerCase();
    });

    if (comprouEsteItem) {
      pedidosComItem.push(v);
    }
  });

  if (pedidosComItem.length === 0) {
    listaContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--muted); font-size:13px;">Nenhum pedido encontrado para este item.</div>`;
  } else {
    listaContainer.innerHTML = pedidosComItem.reverse().map((v) => {
      const vb = v.vbucks !== undefined ? Number(v.vbucks) : valorParaVBucks(v.valor, v.valorBaseMomento);
      const listaItensHtml = Array.isArray(v.itens) && v.itens.length > 0 
        ? v.itens.map((itemObj, n) => {
            let itemText = "", presenteText = "";
            if (typeof itemObj === "string") {
              itemText = itemObj;
            } else if (itemObj) {
              itemText = `${itemObj.tipo || 'Outro'} — ${itemObj.nome}`;
              if (itemObj.presente) {
                presenteText = `<span style="color:var(--accent-light); font-size:12px; margin-left:8px; background: rgba(142,68,255,0.15); padding: 2px 6px; border-radius: 6px; display:inline-flex; align-items:center;">➡️ 🎁 Para: <b>${esc(itemObj.presente)}</b></span>`;
              }
            }
            return `<div style="margin-bottom: 4px;">🎁 ${n + 1}. <b>${esc(itemText)}</b> ${presenteText}</div>`;
          }).join("") 
        : `🎁 ${esc(v.item)}`;

      return `
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; max-width: 75%;">
            <div style="font-weight: 800; color: var(--accent-light);">📦 Conta: <span style="color:#fff;">${esc(v.conta)}</span></div>
            <div style="color: #fff; font-weight: 700;">👤 ${esc(v.cliente)} <span style="color:var(--muted); font-weight:600;">(Nick: ${esc(v.nickCliente)})</span></div>
            <div style="color: var(--muted); font-size: 12px;">📱 Wpp: ${esc(v.whatsapp || "—")} | 🎵 TikTok: ${esc(v.tiktok || "—")}</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.06);">${listaItensHtml}</div>
            <div style="color: var(--muted); font-size: 11px; margin-top: 2px;">📅 ${esc(v.data)} às ${esc(v.hora)}</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
            <div style="color: var(--green); font-size: 17px; font-weight: 900; white-space: nowrap;">${money(v.valor)}</div>
            <div style="color: #ffb74d; font-size: 12px; font-weight: 800; white-space: nowrap;">🪙 ${formatVBucks(vb)} VB</div>
          </div>
        </div>
      `;
    }).join("");
  }

  modal.style.display = "flex";
}

function fecharModalDetalhesItem() {
  const modal = document.getElementById("itemDetalhesModal");
  if (modal) modal.style.display = "none";
}

function abrirModalEdicaoItem(nome, tipo) {
  fecharModalDetalhesItem();
  itemOrigemEdicao = nome;
  itemEmEdicaoNomeOriginal = nome;

  const modal = document.getElementById("editItemModal");
  const inputNome = document.getElementById("editItemNomeInput");
  const selectTipo = document.getElementById("editItemTipoSelect");
  const inputVbucks = document.getElementById("editItemVbucksInput");

  if (inputNome) inputNome.value = nome;
  if (selectTipo) {
    const cats = typeof CATEGORIAS_ITENS !== 'undefined' ? CATEGORIAS_ITENS : ["Traje", "Gesto", "Picareta", "Música", "Pacote", "Pacotão", "Asa-delta", "Envelopamento", "Calçado", "Acessório", "Carro", "Mascote", "Outro"];
    selectTipo.innerHTML = cats.map(c => `<option value="${c}" ${c === tipo ? "selected" : ""}>${c}</option>`).join("");
    selectTipo.value = tipo;
  }

  let encontradoVb = 500;
  const historico = state.historicoVendas || [];
  for (let v of historico) {
    const lista = Array.isArray(v.itens) && v.itens.length ? v.itens : (v.item ? [v.item] : []);
    for (let it of lista) {
      let itName = typeof it === 'string' ? it : (it.nome || '');
      if (itName.trim().toLowerCase() === nome.toLowerCase()) {
        if (it && typeof it === 'object' && it.vbucks) {
          encontradoVb = it.vbucks;
          break;
        }
      }
    }
  }
  if (inputVbucks) inputVbucks.value = encontradoVb;

  if (modal) modal.style.display = "flex";
}

function fecharModalEdicaoItem() {
  const modal = document.getElementById("editItemModal");
  if (modal) modal.style.display = "none";
  
  const nomeRetorno = itemOrigemEdicao;
  itemOrigemEdicao = null;
  itemEmEdicaoNomeOriginal = null;
  
  if (nomeRetorno) {
    abrirModalDetalhesItem(nomeRetorno);
  }
}

function salvarEdicaoItem() {
  const nomeAntigo = String(itemEmEdicaoNomeOriginal || "").trim().toLowerCase();
  const novoNome = document.getElementById("editItemNomeInput")?.value.trim();
  const novoTipo = document.getElementById("editItemTipoSelect")?.value;
  const novoVbucks = parseInt(document.getElementById("editItemVbucksInput")?.value, 10) || 0;

  if (!novoNome) {
    mostrarNotificacao("O nome do item não pode estar vazio.", "erro");
    return;
  }

  const atualizarListaItens = (lista) => {
    if (!Array.isArray(lista)) return;
    lista.forEach(v => {
      let modificado = false;
      if (Array.isArray(v.itens)) {
        v.itens.forEach(itemObj => {
          if (itemObj && typeof itemObj === "object") {
            let nomeAtual = String(itemObj.nome || "").trim().toLowerCase();
            if (nomeAtual === nomeAntigo || nomeAtual.includes(nomeAntigo) || nomeAntigo.includes(nomeAtual)) {
              itemObj.nome = novoNome;
              if (novoTipo) itemObj.tipo = novoTipo;
              if (novoVbucks > 0) itemObj.vbucks = novoVbucks;
              modificado = true;
            }
          } else if (typeof itemObj === "string") {
            let nomeAtual = itemObj.trim().toLowerCase();
            if (nomeAtual === nomeAntigo || nomeAtual.includes(nomeAntigo) || nomeAtual.includes(nomeAtual)) {
              const idx = v.itens.indexOf(itemObj);
              if (idx !== -1) {
                v.itens[idx] = { tipo: novoTipo || "Outro", nome: novoNome, vbucks: novoVbucks, presente: "" };
                modificado = true;
              }
            }
          }
        });
      }
      if (v.item) {
        let nomeUnico = typeof v.item === "string" ? v.item : (v.item.nome || "");
        let nomeAtualUnico = String(nomeUnico).trim().toLowerCase();
        if (nomeAtualUnico === nomeAntigo || nomeAtualUnico.includes(nomeAntigo) || nomeAtualUnico.includes(nomeAtualUnico)) {
          if (typeof v.item === "string") {
            v.item = { tipo: novoTipo || "Outro", nome: novoNome, vbucks: novoVbucks, presente: "" };
          } else if (v.item && typeof v.item === "object") {
            v.item.nome = novoNome;
            if (novoTipo) v.item.tipo = novoTipo;
            if (novoVbucks > 0) v.item.vbucks = novoVbucks;
          }
          modificado = true;
        }
      }

      if (modificado && Array.isArray(v.itens) && v.itens.length > 0) {
        const somaVb = v.itens.reduce((acc, it) => acc + (typeof it === 'object' && it.vbucks ? Number(it.vbucks) : 0), 0);
        if (somaVb > 0) {
          v.vbucks = somaVb;
        }
      }
    });
  };

  atualizarListaItens(state.historicoVendas);
  atualizarListaItens(state.vendas);
  atualizarListaItens(state.agendamentos);
  atualizarListaItens(state.lixeiraVendas);

  if (typeof save === 'function') save();
  
  const modalEdicao = document.getElementById("editItemModal");
  if (modalEdicao) modalEdicao.style.display = "none";
  
  const nomeParaReabrir = novoNome;
  itemOrigemEdicao = null;
  itemEmEdicaoNomeOriginal = null;
  
  mostrarNotificacao("Item e V-Bucks atualizados em todo o histórico!", "sucesso");
  if (abaHistoricoAtiva === 'itens') renderizarHistoricoItensCompleto();
  if (typeof render === 'function') render();
  
  abrirModalDetalhesItem(nomeParaReabrir);
}

function excluirItemDoHistorico(nomeItem) {
  if (typeof abrirModalConfirmacao === 'function') {
    abrirModalConfirmacao(
      "🗑️ Excluir Item do Histórico",
      `Tem certeza que deseja remover o item "${nomeItem}" de todas as vendas registradas?`,
      () => {
        const limparItensLista = (lista) => {
          if (!lista) return;
          lista.forEach(v => {
            if (Array.isArray(v.itens)) {
              v.itens = v.itens.filter(itemObj => {
                let nomeAtual = typeof itemObj === "string" ? itemObj : (itemObj?.nome || "");
                return String(nomeAtual).trim().toLowerCase() !== String(nomeItem).trim().toLowerCase();
              });
            }
          });
        };

        limparItensLista(state.historicoVendas);
        limparItensLista(state.vendas);
        limparItensLista(state.agendamentos);
        limparItensLista(state.lixeiraVendas);

        if (typeof save === 'function') save();
        if (abaHistoricoAtiva === 'itens') renderizarHistoricoItensCompleto();
        if (typeof render === 'function') render();
        mostrarNotificacao("Item removido com sucesso!", "sucesso");
      }
    );
  }
}
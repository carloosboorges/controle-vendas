// ========================================================
// MÓDULO DE AUTOCOMPLETE (Sugestões Inteligentes)
// ========================================================

function safeString(str) {
  if (!str) return "";
  const jsEscaped = String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return typeof esc === 'function' ? esc(jsEscaped) : jsEscaped.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// 🚀 FUNÇÃO PARA IGNORAR ACENTOS NAS BUSCAS
function removerAcentosBusca(str) {
  if (!str) return "";
  return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// 🚀 FUNÇÃO GLOBAL DE DESTAQUE VISUAL (O "Roxinho")
function highlightTexto(textoOriginal, termoPesquisado) {
  if (!termoPesquisado || !textoOriginal) return typeof esc === 'function' ? esc(textoOriginal) : textoOriginal;
  
  const originalLimpo = removerAcentosBusca(textoOriginal);
  const termoLimpo = removerAcentosBusca(termoPesquisado);
  
  const idx = originalLimpo.indexOf(termoLimpo);
  if (idx === -1) return typeof esc === 'function' ? esc(textoOriginal) : textoOriginal;
  
  const antes = textoOriginal.substring(0, idx);
  const match = textoOriginal.substring(idx, idx + termoLimpo.length);
  const depois = textoOriginal.substring(idx + termoLimpo.length);
  
  const safeAntes = typeof esc === 'function' ? esc(antes) : antes;
  const safeMatch = typeof esc === 'function' ? esc(match) : match;
  const safeDepois = typeof esc === 'function' ? esc(depois) : depois;
  
  return `${safeAntes}<span style="color: #fff; background: rgba(142,68,255,0.6); padding: 0 2px; border-radius: 4px;">${safeMatch}</span>${safeDepois}`;
}

// 🚀 MAPA DE CLIENTES (PARA O NOME)
function obterMapaDeClientes() {
  const clientesMap = {};
  
  if (state && state.clientesInfo) {
    Object.keys(state.clientesInfo).forEach(id => {
      const info = state.clientesInfo[id];
      const nome = String(info.nome || id).trim(); 
      if (nome && !nome.startsWith('cli-')) {
        const chaveUnica = removerAcentosBusca(nome);
        clientesMap[chaveUnica] = { 
          id: id, 
          nome: nome, 
          nick: info.nick || info.nickCliente || "", 
          whatsapp: info.whatsapp || "", 
          tiktok: info.tiktok || "" 
        };
      }
    });
  }

  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const nome = String(v.cliente || "").trim();
    const id = v.clienteId || nome;
    const chaveUnica = removerAcentosBusca(nome);
    
    if (nome && !clientesMap[chaveUnica]) {
      clientesMap[chaveUnica] = { id: id, nome: nome, nick: v.nickCliente || "", whatsapp: v.whatsapp || "", tiktok: v.tiktok || "" };
    } else if (nome && clientesMap[chaveUnica]) {
      if (!clientesMap[chaveUnica].whatsapp && v.whatsapp) clientesMap[chaveUnica].whatsapp = v.whatsapp;
      if (!clientesMap[chaveUnica].tiktok && v.tiktok) clientesMap[chaveUnica].tiktok = v.tiktok;
      if (!clientesMap[chaveUnica].nick && v.nickCliente) clientesMap[chaveUnica].nick = v.nickCliente;
    }
  });

  return clientesMap;
}

function buscarSugestoesCliente(texto) {
  const dropdown = document.getElementById("clienteSuggestions");
  const idInput = document.getElementById("clienteIdInput");
  
  if (idInput) idInput.value = ""; 

  if (!dropdown) return;
  const termoLimpo = removerAcentosBusca(texto);
  if (!termoLimpo) { dropdown.style.display = "none"; return; }
  
  const clientesMap = obterMapaDeClientes();
  
  const sugestoes = Object.values(clientesMap).filter(c => removerAcentosBusca(c.nome).includes(termoLimpo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(c => {
    const obsIcon = (state.clientesInfo && state.clientesInfo[c.id] && state.clientesInfo[c.id].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    const nomeDestacado = highlightTexto(c.nome, texto);
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.whatsapp)}', '${safeString(c.tiktok)}')">👤 ${nomeDestacado}${obsIcon} <span class="autocomplete-nick">🎮 ${esc(c.nick)}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

// 🚀 BUSCA DE NICKS PERMITINDO MÚLTIPLOS COMPROVANTES (Mãe, Pai, etc.)
function buscarSugestoesNick(texto) {
  const dropdown = document.getElementById("nickSuggestions");
  if (!dropdown) return;
  const termoLimpo = removerAcentosBusca(texto);
  if (!termoLimpo) { dropdown.style.display = "none"; return; }
  
  const combinacoesUnicas = new Set();
  const listaSugestoes = [];
  
  // 1. Varre o histórico de vendas recolhendo todas as duplas (Nick + Nome de Comprovante)
  const histReverso = [...(state.historicoVendas || [])].reverse();
  histReverso.forEach(v => {
    const nickVenda = String(v.nickCliente || "").trim();
    const nomeVenda = String(v.cliente || "").trim();
    
    if (nickVenda && removerAcentosBusca(nickVenda).includes(termoLimpo)) {
      const chave = `${removerAcentosBusca(nickVenda)}|||${removerAcentosBusca(nomeVenda)}`;
      if (!combinacoesUnicas.has(chave)) {
        combinacoesUnicas.add(chave);
        listaSugestoes.push({
          id: v.clienteId || nomeVenda,
          nome: nomeVenda,
          nick: nickVenda,
          whatsapp: v.whatsapp || "",
          tiktok: v.tiktok || ""
        });
      }
    }
  });

  // 2. Varre o cadastro central de clientes (`state.clientesInfo`)
  if (state && state.clientesInfo) {
    Object.keys(state.clientesInfo).forEach(id => {
      const info = state.clientesInfo[id];
      const nickInfo = String(info.nick || info.nickCliente || "").trim();
      const nomeInfo = String(info.nome || "").trim();
      
      if (nickInfo && nomeInfo && !nomeInfo.startsWith('cli-') && removerAcentosBusca(nickInfo).includes(termoLimpo)) {
        const chave = `${removerAcentosBusca(nickInfo)}|||${removerAcentosBusca(nomeInfo)}`;
        if (!combinacoesUnicas.has(chave)) {
          combinacoesUnicas.add(chave);
          listaSugestoes.push({
            id: id,
            nome: nomeInfo,
            nick: nickInfo,
            whatsapp: info.whatsapp || "",
            tiktok: info.tiktok || ""
          });
        }
      }
    });
  }

  if (listaSugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = listaSugestoes.slice(0, 8).map(c => {
    const nickDestacado = highlightTexto(c.nick, texto);
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.whatsapp)}', '${safeString(c.tiktok)}')">🎮 ${nickDestacado} <span class="autocomplete-nick">👤 ${esc(c.nome)}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesWhatsapp(texto) {
  const dropdown = document.getElementById("whatsappSuggestions");
  if (!dropdown) return;
  let termo = String(texto).replace(/\D/g, "");
  if (termo.startsWith("55") && termo.length > 2) termo = termo.substring(2);
  if (!termo || termo.length < 2) { dropdown.style.display = "none"; return; }
  
  const clientesMap = obterMapaDeClientes();
  const resultadosEncontrados = {};
  
  Object.values(clientesMap).forEach(c => {
    const wppOriginal = String(c.whatsapp || "");
    if (!wppOriginal) return;
    
    let wppNumbers = wppOriginal.replace(/\D/g, "");
    if (wppNumbers.startsWith("55") && wppNumbers.length > 2) wppNumbers = wppNumbers.substring(2);
    
    if (wppNumbers.includes(termo)) {
      resultadosEncontrados[c.id] = { ...c, wppOriginal: wppOriginal };
    }
  });
  
  const sugestoes = Object.values(resultadosEncontrados);
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(c => {
    const obsIcon = (state.clientesInfo && state.clientesInfo[c.id] && state.clientesInfo[c.id].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    const wppDestacado = highlightTexto(c.wppOriginal, texto);
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.wppOriginal)}', '${safeString(c.tiktok)}')">📱 ${wppDestacado} <span class="autocomplete-nick">👤 ${esc(c.nome)}${obsIcon}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesTiktok(texto) {
  const dropdown = document.getElementById("tiktokSuggestions");
  if (!dropdown) return;
  let termoLimpo = removerAcentosBusca(texto).replace(/@/g, "");
  if (!termoLimpo || termoLimpo.length < 2) { dropdown.style.display = "none"; return; }
  
  const clientesMap = obterMapaDeClientes();
  const resultadosEncontrados = {};
  
  Object.values(clientesMap).forEach(c => {
    const tkOriginal = String(c.tiktok || "").trim();
    if (!tkOriginal) return;
    
    const tkLimpo = removerAcentosBusca(tkOriginal).replace(/@/g, "");
    if (tkLimpo.includes(termoLimpo)) {
      resultadosEncontrados[c.id] = { ...c, tkOriginal: tkOriginal };
    }
  });
  
  const sugestoes = Object.values(resultadosEncontrados);
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(c => {
    const obsIcon = (state.clientesInfo && state.clientesInfo[c.id] && state.clientesInfo[c.id].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    const tkDestacado = highlightTexto(c.tkOriginal, texto.replace(/@/g, ""));
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.whatsapp)}', '${safeString(c.tkOriginal)}')">${typeof TIKTOK_SVG !== 'undefined' ? TIKTOK_SVG : '🎵'} ${tkDestacado} <span class="autocomplete-nick">👤 ${esc(c.nome)}${obsIcon}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function sugerirNickPresente(texto, index) {
  const dropdown = document.getElementById(`nickPresenteSuggestions_${index}`);
  if (!dropdown) return;
  const termoLimpo = removerAcentosBusca(texto);
  if (!termoLimpo) { dropdown.style.display = "none"; return; }
  
  const nicksMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const nickC = String(v.nickCliente || "").trim();
    if (nickC) {
      const chaveN = removerAcentosBusca(nickC);
      if (!nicksMap[chaveN]) nicksMap[chaveN] = { nick: nickC, cliente: v.cliente || "" };
    }
    if (Array.isArray(v.itens)) {
      v.itens.forEach(item => {
        if (item && typeof item === 'object' && item.presente) {
          const np = item.presente.trim();
          const chaveP = removerAcentosBusca(np);
          if (!nicksMap[chaveP]) nicksMap[chaveP] = { nick: np, cliente: "Nick Anterior" };
        }
      });
    }
  });
  
  const sugestoes = Object.values(nicksMap).filter(item => removerAcentosBusca(item.nick).includes(termoLimpo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(item => {
      const nickDestacado = highlightTexto(item.nick, texto);
      return `<div class="autocomplete-item" onmousedown="selecionarSugestaoNickPresente('${safeString(item.nick)}', ${index})">🎁 ${nickDestacado} <span class="autocomplete-nick">(${esc(item.cliente)})</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesItem(texto, index) {
  const dropdown = document.getElementById(`itemSuggestions_${index}`);
  if (!dropdown) return;
  
  try {
      const termoLimpo = removerAcentosBusca(texto);
      
      if (!termoLimpo) { 
        dropdown.style.display = "none"; 
        const inputVb = document.getElementById(`itemVbucksInput_${index}`);
        if(inputVb) {
            inputVb.value = "";
            if (typeof recalcularValorSugeridoPorItem === 'function') recalcularValorSugeridoPorItem();
            if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
        }
        return; 
      }

      const itensMap = {};
      const histReverso = [...(state.historicoVendas || [])].reverse();

      histReverso.forEach(v => {
        let totalVbVendaStr = String(v.vbucks || "0").replace(/\D/g, "");
        let totalVbVenda = Number(totalVbVendaStr) || 0;

        if (Array.isArray(v.itens) && v.itens.length > 0) {
          v.itens.forEach(itemObj => {
            let nomeItem = String(typeof itemObj === "string" ? itemObj : (itemObj?.nome || ""));
            let tipoItem = String(typeof itemObj === "string" ? "Outro" : (itemObj?.tipo || "Outro"));
            
            let vbItemStr = String((typeof itemObj === "string" ? 0 : itemObj?.vbucks) || "0").replace(/\D/g, "");
            let vbItem = Number(vbItemStr) || 0;

            if (vbItem === 0 && v.itens.length === 1 && totalVbVenda > 0) {
                vbItem = totalVbVenda;
            }
            
            let nomeLimpo = nomeItem.trim();
            
            if (nomeLimpo) {
              const chave = `${removerAcentosBusca(nomeLimpo)}|||${removerAcentosBusca(tipoItem)}`;
              if (!itensMap[chave]) {
                itensMap[chave] = { nome: nomeLimpo, tipo: tipoItem, vbucks: vbItem };
              } else {
                if (itensMap[chave].vbucks === 0 && vbItem > 0) {
                   itensMap[chave].vbucks = vbItem;
                }
              }
            }
          });
        } else if (v.item) {
          const strAntiga = String(v.item).trim();
          let parseado = { tipo: "Outro", nome: strAntiga };
          if (typeof parseItemString === 'function') {
            parseado = parseItemString(strAntiga);
          }
          const nomeLimpo = String(parseado.nome).trim();
          const tipoItem = String(parseado.tipo).trim();
          const vbItem = totalVbVenda; 
          
          if (nomeLimpo) {
            const chave = `${removerAcentosBusca(nomeLimpo)}|||${removerAcentosBusca(tipoItem)}`;
            if (!itensMap[chave]) {
              itensMap[chave] = { nome: nomeLimpo, tipo: tipoItem, vbucks: vbItem };
            } else {
              if (itensMap[chave].vbucks === 0 && vbItem > 0) {
                 itensMap[chave].vbucks = vbItem;
              }
            }
          }
        }
      });

      const sugestoes = Object.values(itensMap).filter(i => removerAcentosBusca(i.nome).includes(termoLimpo));
      
      if (sugestoes.length === 0) { 
        dropdown.style.display = "none"; 
        const inputVb = document.getElementById(`itemVbucksInput_${index}`);
        if(inputVb) {
            inputVb.value = "";
            if (typeof recalcularValorSugeridoPorItem === 'function') recalcularValorSugeridoPorItem();
            if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
        }
        return; 
      }

      sugestoes.sort((a, b) => {
         const nomeA = a.nome.toLowerCase();
         const nomeB = b.nome.toLowerCase();
         if (nomeA < nomeB) return -1;
         if (nomeA > nomeB) return 1;
         return a.vbucks - b.vbucks; 
      });

      dropdown.innerHTML = sugestoes.slice(0, 8).map(i => {
        const formatadorVb = typeof formatVBucks === 'function' ? formatVBucks : (val) => val;
        const vbFormatado = i.vbucks > 0 ? `${formatadorVb(i.vbucks)} VB` : '? VB';
        const nomeDestacado = highlightTexto(i.nome, texto);

        return `<div class="autocomplete-item" onmousedown="clicarSugestaoItem(this, ${index})" data-nome="${esc(i.nome)}" data-tipo="${esc(i.tipo)}" data-vbucks="${i.vbucks || 0}">🎁 ${nomeDestacado} <span style="color:#ffb74d; font-weight:800; font-size:11px; margin-left:6px;">[${vbFormatado}]</span> <span class="autocomplete-nick">📦 ${esc(i.tipo)}</span></div>`;
      }).join("");
      
      dropdown.style.display = "block";
  } catch (e) {
      console.error("Erro no Autocomplete:", e);
      dropdown.style.display = "none";
  }
}

function selecionarSugestaoCliente(id, nome, nick, whatsapp, tiktok) {
  const idInput = document.getElementById("clienteIdInput");
  if (idInput) idInput.value = id; 
  
  document.getElementById("clienteInput").value = nome;
  document.getElementById("nickClienteInput").value = nick;
  if (document.getElementById("whatsappInput")) document.getElementById("whatsappInput").value = whatsapp || "";
  if (document.getElementById("tiktokInput")) document.getElementById("tiktokInput").value = tiktok || "";
  
  ["clienteSuggestions", "nickSuggestions", "whatsappSuggestions", "tiktokSuggestions"].forEach(idEl => {
    if (document.getElementById(idEl)) document.getElementById(idEl).style.display = "none";
  });
  
  if (typeof verificarObservacaoCliente === 'function') verificarObservacaoCliente(id); 
}

function selecionarSugestaoNickPresente(nick, index) {
  const input = document.getElementById(`itemPresenteInput_${index}`);
  if (input) input.value = nick;
  document.getElementById(`nickPresenteSuggestions_${index}`).style.display = "none";
}

function clicarSugestaoItem(element, index) {
  const nomeItem = element.getAttribute("data-nome");
  const tipoItem = element.getAttribute("data-tipo");
  const vbucksItem = Number(element.getAttribute("data-vbucks")) || 0; 
  
  const input = document.getElementById(`itemNameInput_${index}`);
  if (input) input.value = nomeItem;

  const selectType = document.getElementById(`itemTypeSelect_${index}`);
  if (selectType && tipoItem) {
    selectType.value = tipoItem;
  }

  const inputVb = document.getElementById(`itemVbucksInput_${index}`);
  if (inputVb) {
      if(vbucksItem > 0) {
          inputVb.value = vbucksItem;
      } else {
          inputVb.value = ""; 
      }
  }

  const dropdown = document.getElementById(`itemSuggestions_${index}`);
  if (dropdown) dropdown.style.display = "none";

  if (typeof recalcularValorSugeridoPorItem === 'function') recalcularValorSugeridoPorItem();
  if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
}

// CORREÇÃO DA JANELA FANTASMA: fecha as listas ao clicar fora
document.addEventListener("mousedown", (e) => {
    const dropdowns = document.querySelectorAll('.autocomplete-dropdown, .autocomplete-edicao-drop');
    dropdowns.forEach(drop => {
        const wrapper = drop.closest('.autocomplete-wrapper') || drop.parentElement;
        if (wrapper && !wrapper.contains(e.target)) {
            drop.style.display = 'none';
        }
    });
});
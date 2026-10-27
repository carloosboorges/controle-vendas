// ========================================================
// MÓDULO DE AUTOCOMPLETE (Sugestões Inteligentes)
// ========================================================

// Nova função blindada: Protege aspas e apóstrofos PRIMEIRO para o JS, depois para o HTML
function safeString(str) {
  if (!str) return "";
  const jsEscaped = String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return typeof esc === 'function' ? esc(jsEscaped) : jsEscaped.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// FUNÇÃO AUXILIAR: Mapeia todos os clientes (Histórico + Clientes Cadastrados Manualmente)
function obterMapaDeClientes() {
  const clientesMap = {};
  
  // Prioridade: Clientes cadastrados manualmente ou já com perfil no clientesInfo
  if (state && state.clientesInfo) {
    Object.keys(state.clientesInfo).forEach(id => {
      const info = state.clientesInfo[id];
      const nome = String(info.nome || id).trim(); // Se não tiver nome salvo, tenta usar o ID (alguns antigos usam nome como ID)
      if (nome && !nome.startsWith('cli-')) {
        clientesMap[id] = { 
          id: id, 
          nome: nome, 
          nick: info.nick || info.nickCliente || "", 
          whatsapp: info.whatsapp || "", 
          tiktok: info.tiktok || "" 
        };
      }
    });
  }

  // 2. Mescla com os do Histórico de Vendas (do mais recente para o mais antigo)
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const nome = String(v.cliente || "").trim();
    const id = v.clienteId || nome;
    
    if (nome && !clientesMap[id]) {
      clientesMap[id] = { id: id, nome: nome, nick: v.nickCliente || "", whatsapp: v.whatsapp || "", tiktok: v.tiktok || "" };
    } else if (nome && clientesMap[id]) {
      // Atualiza dados faltantes se achar no histórico
      if (!clientesMap[id].whatsapp && v.whatsapp) clientesMap[id].whatsapp = v.whatsapp;
      if (!clientesMap[id].tiktok && v.tiktok) clientesMap[id].tiktok = v.tiktok;
      if (!clientesMap[id].nick && v.nickCliente) clientesMap[id].nick = v.nickCliente;
    }
  });

  return clientesMap;
}

function buscarSugestoesCliente(texto) {
  const dropdown = document.getElementById("clienteSuggestions");
  const idInput = document.getElementById("clienteIdInput");
  
  if (idInput) idInput.value = ""; 

  if (!dropdown) return;
  const termo = String(texto).toLowerCase().trim();
  if (!termo) { dropdown.style.display = "none"; return; }
  
  const clientesMap = obterMapaDeClientes();
  
  const sugestoes = Object.values(clientesMap).filter(c => c.nome.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(c => {
    const obsIcon = (state.clientesInfo && state.clientesInfo[c.id] && state.clientesInfo[c.id].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.whatsapp)}', '${safeString(c.tiktok)}')">👤 ${esc(c.nome)}${obsIcon} <span class="autocomplete-nick">🎮 ${esc(c.nick)}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesNick(texto) {
  const dropdown = document.getElementById("nickSuggestions");
  if (!dropdown) return;
  const termo = String(texto).toLowerCase().trim();
  if (!termo) { dropdown.style.display = "none"; return; }
  
  const clientesMap = obterMapaDeClientes();
  
  const sugestoes = Object.values(clientesMap).filter(c => c.nick.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(c => {
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.whatsapp)}', '${safeString(c.tiktok)}')">🎮 ${esc(c.nick)} <span class="autocomplete-nick">👤 ${esc(c.nome)}</span></div>`;
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
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.wppOriginal)}', '${safeString(c.tiktok)}')">📱 ${esc(c.wppOriginal)} <span class="autocomplete-nick">👤 ${esc(c.nome)}${obsIcon}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesTiktok(texto) {
  const dropdown = document.getElementById("tiktokSuggestions");
  if (!dropdown) return;
  let termo = String(texto).toLowerCase().trim().replace(/@/g, "");
  if (!termo || termo.length < 2) { dropdown.style.display = "none"; return; }
  
  const clientesMap = obterMapaDeClientes();
  const resultadosEncontrados = {};
  
  Object.values(clientesMap).forEach(c => {
    const tkOriginal = String(c.tiktok || "").trim();
    if (!tkOriginal) return;
    
    const tkLimpo = tkOriginal.toLowerCase().replace(/@/g, "");
    if (tkLimpo.includes(termo)) {
      resultadosEncontrados[c.id] = { ...c, tkOriginal: tkOriginal };
    }
  });
  
  const sugestoes = Object.values(resultadosEncontrados);
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(c => {
    const obsIcon = (state.clientesInfo && state.clientesInfo[c.id] && state.clientesInfo[c.id].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.whatsapp)}', '${safeString(c.tkOriginal)}')">${typeof TIKTOK_SVG !== 'undefined' ? TIKTOK_SVG : '🎵'} ${esc(c.tkOriginal)} <span class="autocomplete-nick">👤 ${esc(c.nome)}${obsIcon}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function sugerirNickPresente(texto, index) {
  const dropdown = document.getElementById(`nickPresenteSuggestions_${index}`);
  if (!dropdown) return;
  const termo = String(texto).toLowerCase().trim();
  if (!termo) { dropdown.style.display = "none"; return; }
  
  const nicksMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const nickC = String(v.nickCliente || "").trim();
    if (nickC && !nicksMap[nickC]) nicksMap[nickC] = v.cliente || "";
    if (Array.isArray(v.itens)) {
      v.itens.forEach(item => {
        if (item && typeof item === 'object' && item.presente) {
          const np = item.presente.trim();
          if (!nicksMap[np]) nicksMap[np] = "Nick Anterior";
        }
      });
    }
  });
  
  const sugestoes = Object.keys(nicksMap).filter(n => n.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(nick => `<div class="autocomplete-item" onmousedown="selecionarSugestaoNickPresente('${safeString(nick)}', ${index})">🎁 ${esc(nick)} <span class="autocomplete-nick">(${esc(nicksMap[nick])})</span></div>`).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesItem(texto, index) {
  const dropdown = document.getElementById(`itemSuggestions_${index}`);
  if (!dropdown) return;
  const termo = String(texto).toLowerCase().trim();
  if (!termo) { dropdown.style.display = "none"; return; }

  const itensMap = {};
  
  // A memória mais fresca primeiro
  const histReverso = [...(state.historicoVendas || [])].reverse();

  histReverso.forEach(v => {
    if (Array.isArray(v.itens)) {
      v.itens.forEach(itemObj => {
        const nomeItem = typeof itemObj === "string" ? itemObj : (itemObj?.nome || "");
        const tipoItem = typeof itemObj === "string" ? "Outro" : (itemObj?.tipo || "Outro");
        const vbItem = typeof itemObj === "string" ? 0 : (Number(itemObj?.vbucks) || 0); // 🚀 LÊ O V-BUCK SALVO NO HISTÓRICO
        const nomeLimpo = String(nomeItem).trim();
        
        if (nomeLimpo) {
          const chave = `${nomeLimpo.toLowerCase()}|||${tipoItem.toLowerCase()}`;
          if (!itensMap[chave]) {
            // Guarda o nome, o tipo e a quantidade exata de moedas!
            itensMap[chave] = { nome: nomeLimpo, tipo: tipoItem, vbucks: vbItem };
          } else if (!itensMap[chave].vbucks && vbItem > 0) {
            // Se já estava mapeado mas sem moedas, atualiza.
            itensMap[chave].vbucks = vbItem;
          }
        }
      });
    } else if (v.item) {
      // Vendas bem antigas que não tinham itens divididos
      const nomeLimpo = String(v.item).trim();
      const tipoItem = "Outro";
      const vbItem = Number(v.vbucks) || 0; 
      
      if (nomeLimpo) {
        const chave = `${nomeLimpo.toLowerCase()}|||${tipoItem.toLowerCase()}`;
        if (!itensMap[chave]) {
          itensMap[chave] = { nome: nomeLimpo, tipo: tipoItem, vbucks: vbItem };
        }
      }
    }
  });

  const sugestoes = Object.values(itensMap).filter(i => i.nome.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }

  dropdown.innerHTML = sugestoes.slice(0, 6).map(i => {
    // 🚀 Passa o V-Buck para o data-attribute do HTML!
    return `<div class="autocomplete-item" onmousedown="clicarSugestaoItem(this, ${index})" data-nome="${esc(i.nome)}" data-tipo="${esc(i.tipo)}" data-vbucks="${i.vbucks || 0}">🎁 ${esc(i.nome)} <span class="autocomplete-nick">📦 ${esc(i.tipo)}</span></div>`;
  }).join("");
  
  dropdown.style.display = "block";
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
  const vbucksItem = Number(element.getAttribute("data-vbucks")) || 0; // 🚀 LÊ O VALOR DO HTML
  
  const input = document.getElementById(`itemNameInput_${index}`);
  if (input) input.value = nomeItem;

  const selectTipo = document.getElementById(`itemTypeSelect_${index}`);
  if (selectTipo && tipoItem) {
    selectTipo.value = tipoItem;
  }

  // 🚀 MÁGICA ACONTECENDO: Preenche o campo de V-Bucks automaticamente!
  const inputVb = document.getElementById(`itemVbucksInput_${index}`);
  if (inputVb && vbucksItem > 0) {
    inputVb.value = vbucksItem;
  }

  const dropdown = document.getElementById(`itemSuggestions_${index}`);
  if (dropdown) dropdown.style.display = "none";

  // 🚀 RECALCULA TUDO SOZINHO! Ao preencher os V-Bucks, ele roda o motor de dinheiro lá do top!
  if (typeof recalcularValorSugeridoPorItem === 'function') recalcularValorSugeridoPorItem();
  if (typeof atualizarPreviewVBucks === 'function') atualizarPreviewVBucks();
}
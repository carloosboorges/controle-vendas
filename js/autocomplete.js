// ========================================================
// MÓDULO DE AUTOCOMPLETE (Sugestões Inteligentes)
// ========================================================

// Nova função blindada: Protege aspas e apóstrofos PRIMEIRO para o JS, depois para o HTML
function safeString(str) {
  if (!str) return "";
  const jsEscaped = String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return typeof esc === 'function' ? esc(jsEscaped) : jsEscaped.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function buscarSugestoesCliente(texto) {
  const dropdown = document.getElementById("clienteSuggestions");
  const idInput = document.getElementById("clienteIdInput");
  
  if (idInput) idInput.value = ""; 

  if (!dropdown) return;
  const termo = String(texto).toLowerCase().trim();
  if (!termo) { dropdown.style.display = "none"; return; }
  
  const clientesMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const nome = String(v.cliente || "").trim();
    const id = v.clienteId || nome;
    
    if (nome && !clientesMap[id]) {
      clientesMap[id] = { id: id, nome: nome, nick: v.nickCliente || "", whatsapp: v.whatsapp || "", tiktok: v.tiktok || "" };
    } else if (nome && clientesMap[id]) {
      if (!clientesMap[id].whatsapp && v.whatsapp) clientesMap[id].whatsapp = v.whatsapp;
      if (!clientesMap[id].tiktok && v.tiktok) clientesMap[id].tiktok = v.tiktok;
    }
  });
  
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
  
  const clientesMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const nick = String(v.nickCliente || "").trim();
    const id = v.clienteId || v.cliente;
    if (nick && !clientesMap[id]) {
        clientesMap[id] = { id: id, nick: nick, nome: v.cliente || "", whatsapp: v.whatsapp || "", tiktok: v.tiktok || "" };
    }
  });
  
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
  
  const clientesMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const wppOriginal = String(v.whatsapp || "");
    const id = v.clienteId || v.cliente;
    if (!wppOriginal) return;
    
    let wppNumbers = wppOriginal.replace(/\D/g, "");
    if (wppNumbers.startsWith("55") && wppNumbers.length > 2) wppNumbers = wppNumbers.substring(2);
    
    if (wppNumbers.includes(termo) && !clientesMap[id]) {
      clientesMap[id] = { id: id, wppOriginal: wppOriginal, nome: v.cliente || "", nick: v.nickCliente || "", tiktok: v.tiktok || "" };
    }
  });
  
  const sugestoes = Object.values(clientesMap);
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
  
  const clientesMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const tkOriginal = String(v.tiktok || "").trim();
    const id = v.clienteId || v.cliente;
    if (!tkOriginal) return;
    
    const tkLimpo = tkOriginal.toLowerCase().replace(/@/g, "");
    if (tkLimpo.includes(termo) && !clientesMap[id]) {
      clientesMap[id] = { id: id, tkOriginal: tkOriginal, nome: v.cliente || "", nick: v.nickCliente || "", whatsapp: v.whatsapp || "" };
    }
  });
  
  const sugestoes = Object.values(clientesMap);
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(c => {
    const obsIcon = (state.clientesInfo && state.clientesInfo[c.id] && state.clientesInfo[c.id].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    return `<div class="autocomplete-item" onmousedown="selecionarSugestaoCliente('${safeString(c.id)}', '${safeString(c.nome)}', '${safeString(c.nick)}', '${safeString(c.whatsapp)}', '${safeString(c.tkOriginal)}')">${TIKTOK_SVG} ${esc(c.tkOriginal)} <span class="autocomplete-nick">👤 ${esc(c.nome)}${obsIcon}</span></div>`;
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
  const histReverso = [...(state.historicoVendas || [])].reverse();

  histReverso.forEach(v => {
    if (Array.isArray(v.itens)) {
      v.itens.forEach(itemObj => {
        const nomeItem = typeof itemObj === "string" ? itemObj : (itemObj?.nome || "");
        const tipoItem = typeof itemObj === "string" ? "Outro" : (itemObj?.tipo || "Outro");
        const nomeLimpo = String(nomeItem).trim();
        
        if (nomeLimpo) {
          // AQUI ESTÁ A MÁGICA: A chave agora junta o nome e o tipo em minúsculas!
          const chave = `${nomeLimpo.toLowerCase()}|||${tipoItem.toLowerCase()}`;
          if (!itensMap[chave]) {
            itensMap[chave] = { nome: nomeLimpo, tipo: tipoItem };
          }
        }
      });
    } else if (v.item) {
      const nomeLimpo = String(v.item).trim();
      const tipoItem = "Outro";
      
      if (nomeLimpo) {
        const chave = `${nomeLimpo.toLowerCase()}|||${tipoItem.toLowerCase()}`;
        if (!itensMap[chave]) {
          itensMap[chave] = { nome: nomeLimpo, tipo: tipoItem };
        }
      }
    }
  });

  const sugestoes = Object.values(itensMap).filter(i => i.nome.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }

  dropdown.innerHTML = sugestoes.slice(0, 6).map(i => {
    return `<div class="autocomplete-item" onmousedown="clicarSugestaoItem(this, ${index})" data-nome="${esc(i.nome)}" data-tipo="${esc(i.tipo)}">🎁 ${esc(i.nome)} <span class="autocomplete-nick">📦 ${esc(i.tipo)}</span></div>`;
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
  
  const input = document.getElementById(`itemNameInput_${index}`);
  if (input) input.value = nomeItem;

  const selectTipo = document.getElementById(`itemTypeSelect_${index}`);
  if (selectTipo && tipoItem) {
    selectTipo.value = tipoItem;
  }

  const dropdown = document.getElementById(`itemSuggestions_${index}`);
  if (dropdown) dropdown.style.display = "none";
}
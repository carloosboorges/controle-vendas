// ========================================================
// MÓDULO DE AUTOCOMPLETE (Sugestões Inteligentes de Clientes)
// ========================================================

function buscarSugestoesCliente(texto) {
  const dropdown = document.getElementById("clienteSuggestions");
  if (!dropdown) return;
  const termo = String(texto).toLowerCase().trim();
  if (!termo) { dropdown.style.display = "none"; return; }
  
  const clientesMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  
  histReverso.forEach(v => {
    const nome = String(v.cliente || "").trim();
    if (nome && !clientesMap[nome]) {
      clientesMap[nome] = { nick: v.nickCliente || "", whatsapp: v.whatsapp || "", tiktok: v.tiktok || "" };
    } else if (nome && clientesMap[nome]) {
      if (!clientesMap[nome].whatsapp && v.whatsapp) clientesMap[nome].whatsapp = v.whatsapp;
      if (!clientesMap[nome].tiktok && v.tiktok) clientesMap[nome].tiktok = v.tiktok;
    }
  });
  
  const sugestoes = Object.keys(clientesMap).filter(n => n.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(nome => {
    const dados = clientesMap[nome];
    const obsIcon = (state.clientesInfo && state.clientesInfo[nome] && state.clientesInfo[nome].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    return `<div class="autocomplete-item" onclick="selecionarSugestaoCliente('${esc(nome).replace(/'/g, "\\'")}', '${esc(dados.nick).replace(/'/g, "\\'")}', '${esc(dados.whatsapp).replace(/'/g, "\\'")}', '${esc(dados.tiktok).replace(/'/g, "\\'")}')">👤 ${esc(nome)}${obsIcon} <span class="autocomplete-nick">🎮 ${esc(dados.nick)}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesNick(texto) {
  const dropdown = document.getElementById("nickSuggestions");
  if (!dropdown) return;
  const termo = String(texto).toLowerCase().trim();
  if (!termo) { dropdown.style.display = "none"; return; }
  
  const nicksMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  histReverso.forEach(v => {
    const nick = String(v.nickCliente || "").trim();
    if (nick && !nicksMap[nick]) nicksMap[nick] = { nome: v.cliente || "", whatsapp: v.whatsapp || "", tiktok: v.tiktok || "" };
  });
  
  const sugestoes = Object.keys(nicksMap).filter(n => n.toLowerCase().includes(termo));
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(nick => {
    const d = nicksMap[nick];
    return `<div class="autocomplete-item" onclick="selecionarSugestaoCliente('${esc(d.nome).replace(/'/g, "\\'")}', '${esc(nick).replace(/'/g, "\\'")}', '${esc(d.whatsapp).replace(/'/g, "\\'")}', '${esc(d.tiktok).replace(/'/g, "\\'")}')">🎮 ${esc(nick)} <span class="autocomplete-nick">👤 ${esc(d.nome)}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesWhatsapp(texto) {
  const dropdown = document.getElementById("whatsappSuggestions");
  if (!dropdown) return;
  let termo = String(texto).replace(/\D/g, "");
  if (termo.startsWith("55") && termo.length > 2) termo = termo.substring(2);
  if (!termo || termo.length < 2) { dropdown.style.display = "none"; return; }
  
  const wppMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  histReverso.forEach(v => {
    const wppOriginal = String(v.whatsapp || "");
    if (!wppOriginal) return;
    let wppNumbers = wppOriginal.replace(/\D/g, "");
    if (wppNumbers.startsWith("55") && wppNumbers.length > 2) wppNumbers = wppNumbers.substring(2);
    if (wppNumbers.includes(termo) && !wppMap[wppOriginal]) {
      wppMap[wppOriginal] = { nome: v.cliente || "", nick: v.nickCliente || "", tiktok: v.tiktok || "" };
    }
  });
  
  const sugestoes = Object.keys(wppMap);
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(wpp => {
    const d = wppMap[wpp];
    const obsIcon = (state.clientesInfo && state.clientesInfo[d.nome] && state.clientesInfo[d.nome].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    return `<div class="autocomplete-item" onclick="selecionarSugestaoCliente('${esc(d.nome).replace(/'/g, "\\'")}', '${esc(d.nick).replace(/'/g, "\\'")}', '${esc(wpp).replace(/'/g, "\\'")}', '${esc(d.tiktok).replace(/'/g, "\\'")}')">📱 ${esc(wpp)} <span class="autocomplete-nick">👤 ${esc(d.nome)}${obsIcon}</span></div>`;
  }).join("");
  dropdown.style.display = "block";
}

function buscarSugestoesTiktok(texto) {
  const dropdown = document.getElementById("tiktokSuggestions");
  if (!dropdown) return;
  let termo = String(texto).toLowerCase().trim().replace(/@/g, "");
  if (!termo || termo.length < 2) { dropdown.style.display = "none"; return; }
  
  const tkMap = {};
  const histReverso = [...(state.historicoVendas || [])].reverse();
  histReverso.forEach(v => {
    const tkOriginal = String(v.tiktok || "").trim();
    if (!tkOriginal) return;
    const tkLimpo = tkOriginal.toLowerCase().replace(/@/g, "");
    if (tkLimpo.includes(termo) && !tkMap[tkOriginal]) {
      tkMap[tkOriginal] = { nome: v.cliente || "", nick: v.nickCliente || "", whatsapp: v.whatsapp || "" };
    }
  });
  
  const sugestoes = Object.keys(tkMap);
  if (sugestoes.length === 0) { dropdown.style.display = "none"; return; }
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(tk => {
    const d = tkMap[tk];
    const obsIcon = (state.clientesInfo && state.clientesInfo[d.nome] && state.clientesInfo[d.nome].observacao) ? ' <span style="font-size:11px;" title="Possui observação">📌</span>' : '';
    return `<div class="autocomplete-item" onclick="selecionarSugestaoCliente('${esc(d.nome).replace(/'/g, "\\'")}', '${esc(d.nick).replace(/'/g, "\\'")}', '${esc(d.whatsapp).replace(/'/g, "\\'")}', '${esc(tk).replace(/'/g, "\\'")}')">${TIKTOK_SVG} ${esc(tk)} <span class="autocomplete-nick">👤 ${esc(d.nome)}${obsIcon}</span></div>`;
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
  
  dropdown.innerHTML = sugestoes.slice(0, 6).map(nick => `<div class="autocomplete-item" onclick="selecionarSugestaoNickPresente('${esc(nick).replace(/'/g, "\\'")}', ${index})">🎁 ${esc(nick)} <span class="autocomplete-nick">(${esc(nicksMap[nick])})</span></div>`).join("");
  dropdown.style.display = "block";
}

function selecionarSugestaoCliente(nome, nick, whatsapp, tiktok) {
  document.getElementById("clienteInput").value = nome;
  document.getElementById("nickClienteInput").value = nick;
  if (document.getElementById("whatsappInput")) document.getElementById("whatsappInput").value = whatsapp || "";
  if (document.getElementById("tiktokInput")) document.getElementById("tiktokInput").value = tiktok || "";
  
  ["clienteSuggestions", "nickSuggestions", "whatsappSuggestions", "tiktokSuggestions"].forEach(id => {
    if (document.getElementById(id)) document.getElementById(id).style.display = "none";
  });
  verificarObservacaoCliente(nome); // Chama a função que ficou no ui.js
}

function selecionarSugestaoNickPresente(nick, index) {
  const input = document.getElementById(`itemPresenteInput_${index}`);
  if (input) input.value = nick;
  document.getElementById(`nickPresenteSuggestions_${index}`).style.display = "none";
}
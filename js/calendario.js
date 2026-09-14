// ========================================================
// MÓDULO DE CALENDÁRIO E FILTROS DE DATA
// ========================================================

let calViewMes = new Date().getMonth();
let calViewAno = new Date().getFullYear();
let calPopoverAberto = false;
let mesPopoverAberto = false;
let mesViewAno = new Date().getFullYear();
let anoPopoverAberto = false;
let anoViewDecada = new Date().getFullYear();

let diaFiltroSelecionado = null;
let mesFiltroSelecionado = null;
let anoFiltroSelecionado = null;

function toggleCalendarioPopover(e) {
  if (e) e.stopPropagation();
  mesPopoverAberto = anoPopoverAberto = apoiadorPopoverAberto = false;
  calPopoverAberto = !calPopoverAberto;
  render();
}

function navegarMesCalendario(direcao, e) {
  if (e) e.stopPropagation();
  calViewMes += direcao;
  if (calViewMes < 0) { calViewMes = 11; calViewAno--; }
  else if (calViewMes > 11) { calViewMes = 0; calViewAno++; }
  render();
}

function selecionarDiaCalendario(diaStr, e) {
  if (e) e.stopPropagation();
  diaFiltroSelecionado = (diaStr === obterDataHojeFormatada()) ? null : diaStr;
  calPopoverAberto = false;
  render();
}

function gerarHtmlCalendarioPopover() {
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];
  const primeiroDiaSemana = new Date(calViewAno, calViewMes, 1).getDay();
  const totalDiasMes = new Date(calViewAno, calViewMes + 1, 0).getDate();
  const hojeChave = obterDataHojeFormatada();
  const diaAtivo = diaFiltroSelecionado || hojeChave;
  const diasComVendas = new Set((state?.historicoVendas || []).map(v => v.data));
  
  let diasHtml = "";
  for (let i = 0; i < primeiroDiaSemana; i++) diasHtml += `<div class="cal-day-empty"></div>`;
  const agoraZero = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const dataStr = `${String(dia).padStart(2, "0")}/${String(calViewMes + 1).padStart(2, "0")}/${calViewAno}`;
    const isFuturo = new Date(calViewAno, calViewMes, dia) > agoraZero;
    const isToday = dataStr === hojeChave;
    const isSelected = dataStr === diaAtivo;
    const hasSales = diasComVendas.has(dataStr);
    
    diasHtml += `<button type="button" class="cal-day-btn ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${hasSales ? "has-sales" : ""}" ${isFuturo ? "disabled" : ""} onclick="selecionarDiaCalendario('${dataStr}', event)">${dia}</button>`;
  }
  
  return `<div class="custom-calendar-popover" onclick="event.stopPropagation()"><div class="calendar-header-nav"><button type="button" class="calendar-nav-btn" onclick="navegarMesCalendario(-1, event)">‹</button><strong>${nomesMeses[calViewMes]} ${calViewAno}</strong><button type="button" class="calendar-nav-btn" onclick="navegarMesCalendario(1, event)">›</button></div><div class="calendar-weekdays-grid">${diasSemana.map(d => `<span>${d}</span>`).join("")}</div><div class="calendar-days-grid">${diasHtml}</div></div>`;
}

function toggleMesPopover(e) {
  if (e) e.stopPropagation();
  calPopoverAberto = anoPopoverAberto = apoiadorPopoverAberto = false;
  mesPopoverAberto = !mesPopoverAberto;
  render();
}

function navegarAnoMesPopover(direcao, e) {
  if (e) e.stopPropagation();
  mesViewAno += direcao;
  render();
}

function selecionarMesPopover(mesIndex, e) {
  if (e) e.stopPropagation();
  mesFiltroSelecionado = `${String(mesIndex + 1).padStart(2, "0")}/${mesViewAno}`;
  diaFiltroSelecionado = null;
  mesPopoverAberto = false;
  render();
}

function gerarHtmlMesPopover() {
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const agora = new Date();
  const mesAtualKey = `${String(agora.getMonth() + 1).padStart(2, "0")}/${agora.getFullYear()}`;
  
  let gridMesesHtml = nomesMeses.map((nm, idx) => {
    const chaveMes = `${String(idx + 1).padStart(2, "0")}/${mesViewAno}`;
    return `<button type="button" class="cal-day-btn ${chaveMes === mesAtualKey ? "is-today" : ""} ${chaveMes === (mesFiltroSelecionado || mesAtualKey) ? "is-selected" : ""}" style="width:100%; aspect-ratio:unset; padding:10px 4px; font-size:12px; border-radius:8px;" onclick="selecionarMesPopover(${idx}, event)">${nm.slice(0, 3)}</button>`;
  }).join("");
  
  return `<div class="custom-calendar-popover" style="width:260px;" onclick="event.stopPropagation()"><div class="calendar-header-nav"><button type="button" class="calendar-nav-btn" onclick="navegarAnoMesPopover(-1, event)">‹</button><strong>Ano ${mesViewAno}</strong><button type="button" class="calendar-nav-btn" onclick="navegarAnoMesPopover(1, event)">›</button></div><div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:10px;">${gridMesesHtml}</div></div>`;
}

function toggleAnoPopover(e) {
  if (e) e.stopPropagation();
  calPopoverAberto = mesPopoverAberto = apoiadorPopoverAberto = false;
  anoPopoverAberto = !anoPopoverAberto;
  render();
}

function navegarDecadaAnoPopover(direcao, e) {
  if (e) e.stopPropagation();
  anoViewDecada += direcao * 12;
  render();
}

function selecionarAnoPopover(anoVal, e) {
  if (e) e.stopPropagation();
  anoFiltroSelecionado = String(anoVal);
  anoPopoverAberto = false;
  render();
}

function gerarHtmlAnoPopover() {
  const agoraAno = new Date().getFullYear();
  const anoAtivo = Number(anoFiltroSelecionado || agoraAno);
  let anosHtml = "";
  const inicio = anoViewDecada - 5;
  const fim = anoViewDecada + 6;
  
  for (let a = inicio; a <= fim; a++) {
    anosHtml += `<button type="button" class="cal-day-btn ${a === agoraAno ? "is-today" : ""} ${a === anoAtivo ? "is-selected" : ""}" style="width:100%; aspect-ratio:unset; padding:10px 4px; font-size:12px; border-radius:8px;" onclick="selecionarAnoPopover(${a}, event)">${a}</button>`;
  }
  
  return `<div class="custom-calendar-popover" style="width:260px;" onclick="event.stopPropagation()"><div class="calendar-header-nav"><button type="button" class="calendar-nav-btn" onclick="navegarDecadaAnoPopover(-1, event)">‹</button><strong>${inicio} – ${fim}</strong><button type="button" class="calendar-nav-btn" onclick="navegarDecadaAnoPopover(1, event)">›</button></div><div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:10px;">${anosHtml}</div></div>`;
}
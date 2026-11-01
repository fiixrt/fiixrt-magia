// Valores y palos del truco. Se usa tanto en el navegador como en las funciones /api.
//
// Protocolo del atajo:  <VALOR>-<PALO>
//   valores: A 2 3 4 5 6 7 8 9 10 J Q K
//   palos:   1=picas  2=corazones  3=diamantes  4=tréboles

export const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const SUITS = {
  1: { name: "Picas", symbol: "♠", color: "black" },
  2: { name: "Corazones", symbol: "♥", color: "red" },
  3: { name: "Diamantes", symbol: "♦", color: "red" },
  4: { name: "Tréboles", symbol: "♣", color: "black" },
};

export const VALUE_LABEL = { A: "As", J: "Jota", Q: "Reina", K: "Rey" };

const SUIT_TOKEN = {
  picas: 1, pica: 1, espadas: 1, espada: 1, spades: 1, spade: 1, s: 1,
  corazones: 2, corazon: 2, corazone: 2, hearts: 2, heart: 2, h: 2,
  diamantes: 3, diamante: 3, diamonds: 3, diamond: 3, rombos: 3, rombo: 3, d: 3,
  treboles: 4, trebol: 4, clubs: 4, club: 4, c: 4, t: 4,
};

const SUIT_LETTER = { s: 1, h: 2, d: 3, c: 4 };

const VALUE_TOKEN = {
  a: "A", as: "A", ases: "A", ace: "A", uno: "A",
  j: "J", jota: "J", jotas: "J", jack: "J",
  q: "Q", reina: "Q", reinas: "Q", queen: "Q",
  k: "K", rey: "K", reyes: "K", king: "K",
};

const NUMBER_VALUE = { 1: "A", 11: "J", 12: "Q", 13: "K" };

export const CLEAR_WORDS = ["reset", "clear", "none", "null", "vaciar", "limpiar", "borrar", "-"];

function deaccent(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function cardLabel(code) {
  if (!code) return "";
  const [value, suit] = String(code).split("-");
  if (!value || !SUITS[suit]) return String(code);
  return `${VALUE_LABEL[value] || value} de ${SUITS[suit].name}`;
}

export function buildCard(value, suit) {
  const normalizedValue = String(value).toUpperCase().replace(/^1$/, "A");
  const normalizedSuit = Number(suit);
  if (!VALUES.includes(normalizedValue)) return null;
  if (!SUITS[normalizedSuit]) return null;
  const code = `${normalizedValue}-${normalizedSuit}`;
  return {
    code,
    value: normalizedValue,
    suit: normalizedSuit,
    label: cardLabel(code),
    image: `/cards/${code}.png`,
  };
}

function numberToValue(token) {
  const number = Number(token);
  if (NUMBER_VALUE[number]) return NUMBER_VALUE[number];
  if (number >= 2 && number <= 10) return String(number);
  return null;
}

/**
 * Acepta casi cualquier forma de nombrar una carta:
 *   "Q-2" · "A♠" · "10H" · "as de picas" · "10 de corazones" · "jota de diamantes"
 * Devuelve { code, value, suit, label, image } o null si no se reconoce.
 */
export function parseCard(input) {
  if (input === null || input === undefined) return null;

  if (typeof input === "object") {
    if (input.c) return parseCard(input.c);
    if (input.code) return parseCard(input.code);
    if (input.carta) return parseCard(input.carta);
    if (input.card) return parseCard(input.card);
    const value = input.valor ?? input.value;
    const suit = input.palo ?? input.suit;
    if (value !== undefined && suit !== undefined) return buildCard(value, suit);
    return null;
  }

  const raw = String(input).trim();
  if (!raw) return null;

  // 1) Protocolo "valor-palo": 1-1, 10-3, q-2, K-4
  const protocol = raw.match(/^([1-9]|1[0-3]|[ajqk])\s*[-–—/]\s*([1-4])$/i);
  if (protocol) {
    const value = /^\d+$/.test(protocol[1]) ? numberToValue(protocol[1]) : protocol[1].toUpperCase();
    return value ? buildCard(value, protocol[2]) : null;
  }

  // 2) Símbolos y acentos → palabras
  const text = deaccent(raw)
    .replace(/[♠♤]/g, " picas ")
    .replace(/[♥♡]/g, " corazones ")
    .replace(/[♦♢]/g, " diamantes ")
    .replace(/[♣♧]/g, " treboles ");

  // 3) Forma compacta: "10h", "as", "kd"
  const compact = text.replace(/[\s\-.]+/g, "");
  const compactMatch = compact.match(/^(10|[2-9]|[ajqk])([shdc])$/);
  if (compactMatch) {
    const value = /^\d+$/.test(compactMatch[1]) ? numberToValue(compactMatch[1]) : compactMatch[1].toUpperCase();
    return value ? buildCard(value, SUIT_LETTER[compactMatch[2]]) : null;
  }

  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);

  // 4) Palo
  let suit = null;
  for (const token of tokens) {
    if (SUIT_TOKEN[token]) {
      suit = SUIT_TOKEN[token];
      break;
    }
  }
  if (!suit) return null;

  // 5) Valor
  let value = null;
  for (const token of tokens) {
    if (/^(?:[1-9]|1[0-3])$/.test(token)) {
      value = numberToValue(token);
      if (value) break;
    }
    if (VALUE_TOKEN[token]) {
      value = VALUE_TOKEN[token];
      break;
    }
  }
  if (!value) return null;

  return buildCard(value, suit);
}

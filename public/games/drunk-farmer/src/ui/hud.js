// Drunk Farmer - game HUD.
//
// DOM-only UI for player-facing controls and readouts. Values are displayed as
// x multipliers, not currency.

import {
  BOTTLE,
  CHICKEN_SHOT,
  FREE_SPINS,
  MAX_WIN,
  PAYTABLE,
} from '../math/constants.js';

const MIN_BET = 0.1;
const MAX_BET = 10;
const BET_STEP = 0.1;

const STYLE_ID = 'drunk-farmer-hud-style';

function fmt(n) {
  return Number(n || 0).toFixed(2);
}

function clampBet(value) {
  const rounded = Math.round(Number(value || MIN_BET) / BET_STEP) * BET_STEP;
  return Math.min(MAX_BET, Math.max(MIN_BET, Number(rounded.toFixed(1))));
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .game-hud {
      position: fixed;
      inset: 0;
      z-index: 10;
      pointer-events: none;
      font-family: system-ui, sans-serif;
      color: #f6f2df;
    }
    .game-hud__top {
      position: absolute;
      top: max(10px, env(safe-area-inset-top));
      left: max(10px, env(safe-area-inset-left));
      right: max(10px, env(safe-area-inset-right));
      display: grid;
      grid-template-columns: minmax(112px, 1fr) auto minmax(112px, 1fr);
      align-items: start;
      gap: 10px;
    }
    .game-hud__panel,
    .game-hud__bet {
      pointer-events: auto;
      background: rgba(7, 12, 8, 0.74);
      border: 1px solid rgba(255, 211, 90, 0.28);
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
    }
    .game-hud__panel {
      min-width: 112px;
      padding: 8px 11px;
    }
    .game-hud__panel--right {
      justify-self: end;
      text-align: right;
    }
    .game-hud__label {
      display: block;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: rgba(246, 242, 223, 0.72);
      text-transform: uppercase;
    }
    .game-hud__value {
      display: block;
      margin-top: 2px;
      font-size: 18px;
      font-weight: 900;
      color: #ffd35a;
      line-height: 1.05;
      white-space: nowrap;
    }
    .game-hud__bet {
      display: grid;
      grid-template-columns: 34px minmax(82px, auto) 34px;
      align-items: center;
      gap: 6px;
      padding: 6px;
      justify-self: center;
    }
    .game-hud__bet-value {
      text-align: center;
      min-width: 82px;
    }
    .game-hud__mode {
      pointer-events: auto;
      justify-self: end;
      display: block;
      cursor: pointer;
    }
    .game-hud__mode input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .game-hud__mode-track {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      width: 74px;
      height: 38px;
      padding: 4px;
      box-sizing: border-box;
      border-radius: 999px;
      background: rgba(54, 50, 70, 0.94);
      border: 1px solid rgba(163, 153, 190, 0.25);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.32);
    }
    .game-hud__mode-track::before {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      width: 32px;
      height: 28px;
      border-radius: 999px;
      background: #dcae55;
      box-shadow: inset 0 1px rgba(255,255,255,0.22), 0 2px 5px rgba(0,0,0,0.35);
      transition: transform 0.18s ease;
    }
    .game-hud__mode-option {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      color: #c9c4d6;
      transition: color 0.18s ease;
    }
    .game-hud__mode-option svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .game-hud__mode input:not(:checked) + .game-hud__mode-track .game-hud__mode-option--desktop,
    .game-hud__mode input:checked + .game-hud__mode-track .game-hud__mode-option--mobile {
      color: #27222e;
    }
    .game-hud__mode input:checked + .game-hud__mode-track::before {
      transform: translateX(32px);
    }
    .game-hud__icon-btn,
    .game-hud__spin,
    .game-hud__paytable-close {
      border: 0;
      color: #fff;
      cursor: pointer;
      font: inherit;
      font-weight: 900;
    }
    .game-hud__icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(#8fd35f, #4a9427 62%, #3c7d1e);
      border: 1px solid #2c6b17;
      box-shadow: inset 0 2px rgba(255,255,255,0.35), 0 3px 0 #245812, 0 5px 10px rgba(0,0,0,0.35);
      font-size: 24px;
      line-height: 1;
      text-shadow: 0 1px 2px rgba(0,0,0,0.35);
    }
    .game-hud__icon-btn:active {
      transform: translateY(2px);
      box-shadow: inset 0 2px rgba(255,255,255,0.25), 0 1px 0 #245812, 0 3px 6px rgba(0,0,0,0.3);
    }
    .game-hud__buzz {
      position: absolute;
      /* Hug the stage's left edge, not the viewport's, when pillarboxed. */
      left: max(10px, env(safe-area-inset-left), calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 10px));
      top: 50%;
      transform: translateY(-50%);
      display: grid;
      justify-items: center;
      gap: 6px;
      padding: 10px 8px;
      pointer-events: none;
      background: rgba(7, 12, 8, 0.74);
      border: 1px solid rgba(255, 211, 90, 0.28);
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
    }
    .game-hud__buzz-track {
      position: relative;
      width: 16px;
      height: 168px;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(255, 211, 90, 0.22);
      overflow: hidden;
    }
    .game-hud__buzz-fill {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      /* Fill fraction lives in --tdf-fill (set by setFillMeter) so vertical
         (desktop) and horizontal (mobile) tracks share the same state. */
      height: var(--tdf-fill, 0%);
      background: linear-gradient(#ffcf5c, #b87810);
      transition: height 0.35s ease, width 0.35s ease;
    }
    .game-hud__buzz-value {
      font-size: 14px;
    }
    .game-hud__bottom {
      position: absolute;
      left: max(12px, env(safe-area-inset-left));
      right: max(12px, env(safe-area-inset-right));
      bottom: max(14px, env(safe-area-inset-bottom));
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: end;
      gap: 12px;
    }
    .game-hud__demo {
      pointer-events: auto;
      grid-column: 1;
      justify-self: start;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: min(360px, 34vw);
    }
    .game-hud__demo-btn {
      border: 1px solid rgba(255, 211, 90, 0.32);
      border-radius: 999px;
      padding: 8px 11px;
      background: rgba(7, 12, 8, 0.78);
      color: #ffd35a;
      box-shadow: 0 3px 10px rgba(0,0,0,0.32);
      cursor: pointer;
      font: inherit;
      font-size: 12px;
      font-weight: 900;
      white-space: nowrap;
    }
    .game-hud__spin {
      pointer-events: auto;
      grid-column: 2;
      min-width: 190px;
      padding: 18px 54px 17px;
      border-radius: 999px;
      background: linear-gradient(#ffcf5c, #b87810);
      box-shadow: 0 5px 0 #7b4b08, 0 10px 24px rgba(0,0,0,0.42);
      font-size: 24px;
      letter-spacing: 0.08em;
      transition: transform 0.05s, filter 0.12s, opacity 0.12s;
    }
    .game-hud__spin:hover,
    .game-hud__icon-btn:hover,
    .game-hud__paytable:hover,
    .game-hud__demo-btn:hover {
      filter: brightness(1.08);
    }
    .game-hud__spin:active {
      transform: translateY(2px);
      box-shadow: 0 3px 0 #7b4b08, 0 7px 18px rgba(0,0,0,0.38);
    }
    .game-hud button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(0.25);
    }
    .game-hud__paytable {
      pointer-events: auto;
      justify-self: end;
      width: 48px;
      height: 48px;
      border: 1px solid rgba(255, 211, 90, 0.35);
      border-radius: 50%;
      background: rgba(7, 12, 8, 0.78);
      color: #ffd35a;
      box-shadow: 0 4px 14px rgba(0,0,0,0.36);
      cursor: pointer;
      font-size: 24px;
      font-weight: 900;
    }
    .game-hud__event {
      position: absolute;
      left: 50%;
      top: 76px;
      transform: translateX(-50%);
      pointer-events: none;
      display: none;
      padding: 8px 18px;
      border-radius: 8px;
      background: rgba(80, 50, 0, 0.84);
      border: 1px solid rgba(255, 211, 90, 0.55);
      color: #ffd35a;
      box-shadow: 0 0 22px rgba(255, 211, 90, 0.2);
      text-align: center;
      font-weight: 900;
    }
    .game-hud__event.is-visible {
      display: block;
    }
    .game-hud__event-spin {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: rgba(246, 242, 223, 0.78);
      text-transform: uppercase;
    }
    .game-hud__control-bar {
      position: absolute;
      left: 50%;
      bottom: max(10px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      width: min(980px, calc(var(--tdf-stage-w, 100vw) - 16px), calc(100vw - 20px));
      min-height: 78px;
      display: grid;
      grid-template-columns: 48px auto 1fr auto 90px;
      align-items: center;
      gap: 12px;
      padding: 8px 14px;
      box-sizing: border-box;
      pointer-events: auto;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(54, 57, 64, 0.72) 0%, rgba(38, 40, 46, 0.64) 48%, rgba(26, 28, 33, 0.72) 100%);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px rgba(255,255,255,0.14);
      backdrop-filter: blur(14px) saturate(1.15);
    }
    .game-hud__bar-menu {
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 32px;
      line-height: 1;
      opacity: 0.9;
    }
    .game-hud__control-bar .game-hud__panel,
    .game-hud__control-bar .game-hud__bet {
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
    }
    .game-hud__control-bar .game-hud__panel {
      padding: 6px 14px;
      border-left: 1px solid rgba(255,255,255,0.14);
    }
    .game-hud__control-bar .game-hud__bet {
      grid-column: 4;
      padding: 4px 10px;
    }
    .game-hud__control-bar .game-hud__label {
      color: rgba(226, 229, 235, 0.72);
      letter-spacing: 0.12em;
    }
    .game-hud__control-bar .game-hud__value {
      color: #fff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
    }
    .game-hud__control-bar .game-hud__spin {
      grid-column: 5;
      min-width: 0;
      width: 78px;
      height: 78px;
      padding: 0;
      display: grid;
      place-items: center;
      border: 6px solid #100e17;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 32%, #3a3644, #1d1a24 68%);
      box-shadow: 0 4px 0 #060509, 0 9px 22px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.1);
    }
    .game-hud__control-bar .game-hud__spin svg {
      width: 52px;
      height: 52px;
      fill: none;
      stroke: #fff;
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .game-hud__corner {
      position: absolute;
      top: max(10px, env(safe-area-inset-top));
      /* Hug the stage's right edge, not the viewport's, when pillarboxed. */
      right: max(10px, env(safe-area-inset-right), calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 10px));
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: auto;
    }
    .game-hud__corner .game-hud__paytable {
      width: 38px;
      height: 38px;
      color: #e6e0f7;
      border: 1px solid rgba(163, 153, 190, 0.35);
      background: rgba(34, 30, 48, 0.88);
      font-size: 20px;
    }
    .game-hud__demo--hidden {
      display: none;
    }
    .game-hud__overlay {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: none;
      place-items: center;
      padding: 18px;
      background: rgba(0, 0, 0, 0.62);
      pointer-events: auto;
    }
    .game-hud__overlay.is-open {
      display: grid;
    }
    .game-hud__paytable-card {
      width: min(920px, 94vw);
      max-height: min(760px, 86vh);
      overflow: auto;
      border-radius: 8px;
      background: #132016;
      border: 1px solid rgba(255, 211, 90, 0.38);
      box-shadow: 0 18px 50px rgba(0,0,0,0.58);
      color: #f6f2df;
    }
    .game-hud__paytable-head {
      position: sticky;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      background: #192b1c;
      border-bottom: 1px solid rgba(255, 211, 90, 0.24);
    }
    .game-hud__paytable-title {
      margin: 0;
      font-size: 20px;
    }
    .game-hud__paytable-close {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #3b2411;
      font-size: 20px;
    }
    .game-hud__paytable-body {
      padding: 14px 16px 18px;
    }
    .game-hud__paytable-grid {
      display: grid;
      /* minmax(0,1fr): the pay table's min-width must NOT widen the track —
         without this the whole card grows past the viewport on phones and the
         info grid packs into clipped columns; the table scrolls in its own
         wrap instead. */
      grid-template-columns: minmax(0, 1fr);
      gap: 14px;
    }
    .game-hud__paytable-section {
      min-width: 0;
      padding: 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(255, 211, 90, 0.14);
    }
    .game-hud__paytable-section h3 {
      margin: 0 0 10px;
      color: #ffd35a;
      font-size: 15px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .game-hud__paytable-table-wrap {
      overflow-x: auto;
    }
    .game-hud__paytable-table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
      font-size: 13px;
    }
    .game-hud__paytable-table th,
    .game-hud__paytable-table td {
      padding: 7px 8px;
      border: 1px solid rgba(255, 211, 90, 0.12);
      text-align: right;
      white-space: nowrap;
    }
    .game-hud__paytable-table th {
      color: rgba(246, 242, 223, 0.78);
      background: rgba(0, 0, 0, 0.18);
      font-weight: 900;
    }
    .game-hud__paytable-table th:first-child,
    .game-hud__paytable-table td:first-child {
      position: sticky;
      left: 0;
      z-index: 1;
      text-align: left;
      background: #1a2a1d;
      color: #ffd35a;
      font-weight: 900;
    }
    .game-hud__info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 10px;
    }
    .game-hud__paytable-row {
      display: block;
      padding: 9px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.055);
      font-size: 14px;
    }
    .game-hud__paytable-symbol {
      display: block;
      margin-bottom: 3px;
      font-weight: 900;
      color: #ffd35a;
    }
    .game-hud__paytable-text {
      color: rgba(246, 242, 223, 0.82);
      line-height: 1.35;
    }
    .game-hud__paytable-note {
      margin: 12px 0 0;
      color: rgba(246, 242, 223, 0.72);
      font-size: 13px;
    }
    /* Desktop now shares mobile's floating-control language: no opaque banner,
       circular steppers/spin button, transparent stats and a horizontal meter. */
    .game-hud--desktop .game-hud__control-bar {
      display: contents;
    }
    .game-hud--desktop .game-hud__bar-menu {
      display: none;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__panel {
      position: absolute;
      left: calc(50vw - var(--tdf-stage-w, 100vw) / 2 + var(--tdf-stage-w, 100vw) * 0.07);
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 44px);
      min-width: 0;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__panel--win {
      left: calc(50vw - var(--tdf-stage-w, 100vw) / 2 + var(--tdf-stage-w, 100vw) * 0.27);
      text-align: center;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__bet {
      display: contents;
    }
    .game-hud--desktop .game-hud__bet-value {
      position: absolute;
      left: calc(50vw - var(--tdf-stage-w, 100vw) / 2 + var(--tdf-stage-w, 100vw) * 0.66);
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 44px);
      min-width: 0;
      text-align: center;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__icon-btn {
      position: absolute;
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 55px);
      transform: translate(-50%, -50%);
      width: 44px;
      height: 44px;
      border: 0;
      background: rgba(20, 20, 26, 0.58);
      box-shadow: none;
      font-weight: 400;
    }
    .game-hud--desktop [data-hud="bet-minus"] { left: 43%; }
    .game-hud--desktop [data-hud="bet-plus"] { left: 57%; }
    .game-hud--desktop .game-hud__control-bar .game-hud__spin {
      position: absolute;
      left: 50%;
      top: calc(50vh + var(--tdf-stage-h, 100vh) / 2 - 55px);
      transform: translate(-50%, -50%);
      width: 82px;
      height: 82px;
      min-width: 0;
      padding: 0;
      border: 0;
      background: rgba(20, 20, 26, 0.48);
      box-shadow: none;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__spin svg {
      width: 60px;
      height: 60px;
      stroke-width: 5;
    }
    .game-hud--desktop .game-hud__control-bar .game-hud__label,
    .game-hud--desktop .game-hud__control-bar .game-hud__value {
      color: #fff;
      text-shadow: 0 1px 4px rgba(0,0,0,0.78);
    }
    .game-hud--desktop .game-hud__buzz {
      left: 50%;
      top: calc(50vh - var(--tdf-stage-h, 100vh) / 2 + var(--tdf-stage-h, 100vh) * 0.125);
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 8px;
      width: min(330px, calc(var(--tdf-stage-w, 100vw) * 0.31));
      box-sizing: border-box;
      padding: 6px 10px;
    }
    .game-hud--desktop .game-hud__buzz-track {
      flex: 1;
      width: auto;
      height: 14px;
    }
    .game-hud--desktop .game-hud__buzz-track::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(90deg, transparent calc(34% - 1px), rgba(255, 215, 90, 0.55) calc(34% - 1px), rgba(255, 215, 90, 0.55) calc(34% + 1px), transparent calc(34% + 1px)),
        linear-gradient(90deg, transparent calc(68% - 1px), rgba(255, 215, 90, 0.55) calc(68% - 1px), rgba(255, 215, 90, 0.55) calc(68% + 1px), transparent calc(68% + 1px));
    }
    .game-hud--desktop .game-hud__buzz-fill {
      right: auto;
      top: 0;
      bottom: 0;
      height: 100%;
      width: var(--tdf-fill, 0%);
      background: linear-gradient(90deg, #b87810, #ffcf5c);
    }
    /* Compact HUD: applied by JS when the STAGE (not the viewport) is narrow,
       so a pillarboxed mobile layout in a wide window compacts too. */
    .game-hud--compact .game-hud__control-bar {
      min-height: 66px;
      grid-template-columns: 32px minmax(0, auto) 1fr auto 64px;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 14px;
    }
    .game-hud--compact .game-hud__bar-menu {
      font-size: 24px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__panel {
      min-width: 0;
      padding: 4px 8px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__bet {
      grid-template-columns: 30px minmax(56px, auto) 30px;
      gap: 3px;
      padding: 3px 4px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__icon-btn {
      width: 30px;
      height: 30px;
      font-size: 19px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__spin {
      width: 64px;
      height: 64px;
      min-width: 0;
      padding: 0;
      border-width: 5px;
    }
    .game-hud--compact .game-hud__control-bar .game-hud__spin svg {
      width: 43px;
      height: 43px;
    }
    .game-hud--compact .game-hud__value {
      font-size: 15px;
    }
    .game-hud--compact .game-hud__corner .game-hud__mode-track {
      width: 62px;
      height: 32px;
    }
    .game-hud--compact .game-hud__corner .game-hud__mode-track::before {
      width: 26px;
      height: 24px;
    }
    .game-hud--compact .game-hud__corner .game-hud__mode input:checked + .game-hud__mode-track::before {
      transform: translateX(28px);
    }
    .game-hud--compact .game-hud__corner .game-hud__paytable {
      width: 32px;
      height: 32px;
      font-size: 17px;
    }
    .game-hud--compact .game-hud__demo {
      max-width: 33vw;
    }
    .game-hud--compact .game-hud__buzz-track {
      height: 110px;
    }
    .game-hud--compact .game-hud__demo-btn {
      padding: 7px 9px;
      font-size: 11px;
    }
    /* ------------------------------------------------------------------
       Mobile layout (Le Cowboy style): NO bar — controls float straight on
       the scene as translucent dark circles. The bar element becomes
       display:contents so each child positions itself on the viewport. */
    .game-hud--mobile .game-hud__control-bar {
      display: contents;
    }
    /* The bar menu has no function yet — dead UI hidden on mobile until a
       real menu exists; the paytable "?" takes its bottom-left spot. */
    .game-hud--mobile .game-hud__bar-menu {
      display: none;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__panel {
      position: absolute;
      left: max(14px, calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 14px));
      /* Stats line: 0.44 of the stage below center, but never clipped by the
         window edge (short landscape windows put 0.44 past the bottom). */
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.44), calc(100vh - 46px));
      min-width: 0;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      pointer-events: auto;
    }
    /* Win readout: CENTER of the stats line (same line as Balance/Bet) — a
       band-relative spot collided with the bet value whenever the window had
       no letterbox band (mobile layout in a landscape window). */
    .game-hud--mobile .game-hud__control-bar .game-hud__panel--win {
      left: 50%;
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.44), calc(100vh - 46px));
      transform: translateX(-50%);
      text-align: center;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__bet {
      display: contents;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__icon-btn {
      position: absolute;
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.36), calc(100vh - 88px));
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: rgba(20, 20, 26, 0.58);
      box-shadow: none;
      color: #fff;
      font-size: 26px;
      font-weight: 400;
      pointer-events: auto;
    }
    .game-hud--mobile [data-hud="bet-minus"] {
      left: calc(50% - 96px);
    }
    .game-hud--mobile [data-hud="bet-plus"] {
      left: calc(50% + 52px);
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__icon-btn:active {
      transform: translateY(calc(-50% + 2px));
      box-shadow: none;
    }
    /* Bet value sits under its "+" stepper (right of the spin button), so the
       stats line reads Balance | Win | Bet without collisions. */
    .game-hud--mobile .game-hud__bet-value {
      position: absolute;
      left: calc(50% + 74px);
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.44), calc(100vh - 46px));
      transform: translateX(-50%);
      min-width: 0;
      text-align: center;
      pointer-events: auto;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__spin {
      position: absolute;
      left: 50%;
      top: min(calc(50vh + var(--tdf-stage-h, 100vh) * 0.36), calc(100vh - 88px));
      transform: translate(-50%, -50%);
      width: 84px;
      height: 84px;
      padding: 0;
      display: grid;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: rgba(20, 20, 26, 0.42);
      box-shadow: none;
      pointer-events: auto;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__spin svg {
      width: 62px;
      height: 62px;
      stroke-width: 5;
    }
    .game-hud--mobile .game-hud__control-bar .game-hud__spin:active {
      transform: translate(-50%, calc(-50% + 2px));
      box-shadow: none;
    }
    /* Stats text scales with the on-screen stage width so Balance | Win | Bet
       always fit on one line, even heavily pillarboxed in a short window. */
    .game-hud--mobile .game-hud__label {
      color: rgba(255, 255, 255, 0.82);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
      font-size: clamp(9px, calc(var(--tdf-stage-w, 100vw) * 0.028), 11px);
    }
    .game-hud--mobile .game-hud__value {
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.75);
      font-size: clamp(11px, calc(var(--tdf-stage-w, 100vw) * 0.046), 18px);
    }
    /* Paytable "?" docks TOP-LEFT (mirror of the mode toggle): the farmer
       covered it bottom-right, and on the controls line it collided with the
       "-" stepper in narrow pillarboxed windows. */
    .game-hud--mobile .game-hud__corner .game-hud__paytable {
      position: fixed;
      left: max(10px, env(safe-area-inset-left), calc(50vw - var(--tdf-stage-w, 100vw) / 2 + 10px));
      right: auto;
      top: max(10px, env(safe-area-inset-top));
      transform: none;
      width: 42px;
      height: 42px;
      border: 0;
      background: rgba(20, 20, 26, 0.58);
      font-size: 18px;
    }
    /* Buzz meter: HORIZONTAL bar centered ABOVE the board, filling
       left-to-right — full bar = the farmer shoots more + free spins.
       Tier ticks mark the 34%/68% shot-chance thresholds. */
    .game-hud--mobile .game-hud__buzz {
      left: 50%;
      top: calc(50vh - var(--tdf-stage-h, 100vh) * 0.243);
      bottom: auto;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 7px;
      width: calc(var(--tdf-stage-w, 100vw) * 0.55);
      box-sizing: border-box;
      padding: 6px 10px;
    }
    .game-hud--mobile .game-hud__buzz .game-hud__label {
      font-size: 10px;
      letter-spacing: 0.06em;
    }
    .game-hud--mobile .game-hud__buzz-track {
      flex: 1;
      width: auto;
      height: 14px;
    }
    /* Tier ticks (34% / 68%) drawn ABOVE the fill — dark, so they read as
       notches against BOTH the gold fill and the dark empty track (gold ticks
       vanished once the fill passed them). */
    .game-hud--mobile .game-hud__buzz-track::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(90deg, transparent calc(34% - 1px), rgba(0, 0, 0, 0.45) calc(34% - 1px), rgba(0, 0, 0, 0.45) calc(34% + 1px), transparent calc(34% + 1px)),
        linear-gradient(90deg, transparent calc(68% - 1px), rgba(0, 0, 0, 0.45) calc(68% - 1px), rgba(0, 0, 0, 0.45) calc(68% + 1px), transparent calc(68% + 1px));
    }
    .game-hud--mobile .game-hud__buzz-fill {
      right: auto;
      top: 0;
      bottom: 0;
      height: 100%;
      width: var(--tdf-fill, 0%);
      background: linear-gradient(90deg, #b87810, #ffcf5c);
    }
    .game-hud--mobile .game-hud__buzz-value {
      font-size: 14px;
      min-width: 36px;
      text-align: right;
    }
  `;
  document.head.appendChild(style);
}

function paytableRows() {
  const sizes = Array.from({ length: 10 }, (_, i) => i + 5);
  const head = sizes.map((size) => `<th>${size === 14 ? '14+' : size}</th>`).join('');
  const rows = Object.entries(PAYTABLE)
    .filter(([, values]) => Array.isArray(values))
    .map(([symbol, values]) => {
      const cells = sizes.map((size) => `<td>${fmt(values[size] || 0)}x</td>`).join('');
      return `<tr><td>${symbol}</td>${cells}</tr>`;
    })
    .join('');
  return `
    <div class="game-hud__paytable-table-wrap">
      <table class="game-hud__paytable-table">
        <thead><tr><th>Symbol</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function featureRows() {
  const shotTiers = CHICKEN_SHOT.fill_tiers
    .map((t) => `${t.min_fill}%+: ${Math.round(t.shot_chance * 1000) / 10}%`)
    .join(' · ');
  const shotValues = CHICKEN_SHOT.buff_values.map((v) => `x${v.value}`).join(', ');
  const bottleTypes = BOTTLE.BOTTLE_TYPES
    .map((t) => `${(t.label || t.id).toUpperCase()} +${t.fill}%`)
    .join(' · ');
  return `
    <div class="game-hud__info-grid">
      <div class="game-hud__paytable-row">
        <span class="game-hud__paytable-symbol">Buzz Meter &amp; Free Spins</span>
        <span class="game-hud__paytable-text">Bottles can spawn each spin (base chance ${Math.round(BOTTLE.BASE_SPAWN_CHANCE * 100)}%, rising ${Math.round(BOTTLE.SPAWN_RISE_PER_DRY_SPIN * 100)}% per dry spin). Every bottle contains alcohol — what varies is the drink: ${bottleTypes} of the Buzz meter. The fuller the meter, the more often the farmer shoots chickens (see below). When the meter tops out you win ${FREE_SPINS.count} FREE SPINS where at least ${FREE_SPINS.guaranteed_chickens} chickens land on every board and EVERY chicken in a winning cluster is shot — and the overflow carries over into the next meter.</span>
      </div>
      <div class="game-hud__paytable-row">
        <span class="game-hud__paytable-symbol">Chicken Wilds</span>
        <span class="game-hud__paytable-text">Every wild is a chicken and substitutes to help form clusters. When a chicken ends up in a winning cluster, the farmer may shoot it — the chance scales with the Buzz meter (${shotTiers}). A SHOT chicken buffs the WHOLE cluster (${shotValues}): the cluster win is multiplied, and several shot cells in one cluster add their values. The buff then STAYS on its cell as a waiting ×badge — however many spins it takes — until a winning cluster covers that cell again: that cluster is multiplied too, and the badge is used up.</span>
      </div>
      <div class="game-hud__paytable-row">
        <span class="game-hud__paytable-symbol">Limits</span>
        <span class="game-hud__paytable-text">MAX WIN: ${MAX_WIN}x. RTP target: 94-96%. Values are placeholders pending balancing.</span>
      </div>
    </div>
  `;
}

function createHudMarkup(mount) {
  mount.className = 'game-hud';
  mount.innerHTML = `
    <div class="game-hud__control-bar">
      <div class="game-hud__bar-menu" aria-hidden="true">☰</div>
      <div class="game-hud__panel">
        <span class="game-hud__label">Balance</span>
        <span class="game-hud__value" data-hud="balance">0.00x</span>
      </div>
      <div class="game-hud__panel game-hud__panel--win">
        <span class="game-hud__label">Win</span>
        <span class="game-hud__value" data-hud="last-win">0.00x</span>
      </div>
      <div class="game-hud__bet" aria-label="Bet amount">
        <button class="game-hud__icon-btn" type="button" data-hud="bet-minus" aria-label="Decrease bet">-</button>
        <div class="game-hud__bet-value">
          <span class="game-hud__label">Bet</span>
          <span class="game-hud__value" data-hud="bet">1.00x</span>
        </div>
        <button class="game-hud__icon-btn" type="button" data-hud="bet-plus" aria-label="Increase bet">+</button>
      </div>
      <button class="game-hud__spin" type="button" data-hud="spin" aria-label="Spin">
        <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M49 19A23 23 0 1 0 54 38"></path><path d="M48 8v13H35"></path></svg>
      </button>
    </div>
    <div class="game-hud__corner">
      <label class="game-hud__mode" aria-label="Switch between desktop and mobile layout">
        <input type="checkbox" data-hud="display-mode">
        <span class="game-hud__mode-track">
          <span class="game-hud__mode-option game-hud__mode-option--desktop" title="Desktop">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path></svg>
          </span>
          <span class="game-hud__mode-option game-hud__mode-option--mobile" title="Mobil">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M11 18h2"></path></svg>
          </span>
        </span>
      </label>
      <button class="game-hud__paytable" type="button" data-hud="paytable" aria-label="Open paytable">?</button>
    </div>
    <div class="game-hud__buzz" aria-label="Farmer fill meter">
      <span class="game-hud__label">Buzz</span>
      <div class="game-hud__buzz-track">
        <div class="game-hud__buzz-fill" data-hud="buzz-fill"></div>
      </div>
      <span class="game-hud__value game-hud__buzz-value" data-hud="buzz-value">0%</span>
    </div>
    <div class="game-hud__event" data-hud="event-win">
      <span class="game-hud__label">Event Win</span>
      <span class="game-hud__value" data-hud="event-win-value">0.00x</span>
      <span class="game-hud__event-spin" data-hud="event-spin"></span>
    </div>
    <div class="game-hud__demo game-hud__demo--hidden" aria-label="Demo controls" aria-hidden="true">
        <button class="game-hud__demo-btn" type="button" data-hud="demo-beer">Small</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-wine">Big</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-moonshine">Mega</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-jug">Ultra</button>
        <button class="game-hud__demo-btn" type="button" data-hud="demo-barrel">Full</button>
    </div>
    <div class="game-hud__overlay" data-hud="overlay" aria-hidden="true">
      <div class="game-hud__paytable-card" role="dialog" aria-modal="true" aria-label="Paytable">
        <div class="game-hud__paytable-head">
          <h2 class="game-hud__paytable-title">Paytable</h2>
          <button class="game-hud__paytable-close" type="button" data-hud="paytable-close" aria-label="Close paytable">x</button>
        </div>
        <div class="game-hud__paytable-body">
          <div class="game-hud__paytable-grid">
            <section class="game-hud__paytable-section">
              <h3>Cluster Pays</h3>
              ${paytableRows()}
              <p class="game-hud__paytable-note">Pays start at 5+ connected symbols. Values are bet multipliers. Wild substitutes and has no direct paytable.</p>
            </section>
            <section class="game-hud__paytable-section">
              <h3>Feature Rules</h3>
              ${featureRows()}
            </section>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Build and mount the complete game HUD.
 * @param {HTMLElement|string} container
 * @param {{balance?:number, bet?:number, lastWin?:number, onSpin?:Function, onBetChange?:Function}} options
 */
export function initHud(container, options = {}) {
  const mount = typeof container === 'string' ? document.querySelector(container) : container;
  if (!mount) throw new Error('initHud: container element not found.');

  injectStyles();
  createHudMarkup(mount);

  let balance = Number(options.balance ?? 0);
  let bet = clampBet(options.bet ?? 1);
  let lastWin = Number(options.lastWin ?? 0);
  let eventWin = 0;
  let eventVisible = false;
  let eventSpinLabel = '';
  let spinDisabled = false;

  const els = {
    balance: mount.querySelector('[data-hud="balance"]'),
    lastWin: mount.querySelector('[data-hud="last-win"]'),
    bet: mount.querySelector('[data-hud="bet"]'),
    displayMode: mount.querySelector('[data-hud="display-mode"]'),
    buzzFill: mount.querySelector('[data-hud="buzz-fill"]'),
    buzzValue: mount.querySelector('[data-hud="buzz-value"]'),
    eventBox: mount.querySelector('[data-hud="event-win"]'),
    eventWin: mount.querySelector('[data-hud="event-win-value"]'),
    eventSpin: mount.querySelector('[data-hud="event-spin"]'),
    spin: mount.querySelector('[data-hud="spin"]'),
    betMinus: mount.querySelector('[data-hud="bet-minus"]'),
    betPlus: mount.querySelector('[data-hud="bet-plus"]'),
    paytable: mount.querySelector('[data-hud="paytable"]'),
    demoBeer: mount.querySelector('[data-hud="demo-beer"]'),
    demoWine: mount.querySelector('[data-hud="demo-wine"]'),
    demoMoonshine: mount.querySelector('[data-hud="demo-moonshine"]'),
    demoJug: mount.querySelector('[data-hud="demo-jug"]'),
    demoBarrel: mount.querySelector('[data-hud="demo-barrel"]'),
    overlay: mount.querySelector('[data-hud="overlay"]'),
    paytableClose: mount.querySelector('[data-hud="paytable-close"]'),
  };

  function render() {
    els.balance.textContent = `${fmt(balance)}x`;
    els.lastWin.textContent = `${fmt(lastWin)}x`;
    els.bet.textContent = `${fmt(bet)}x`;
    els.eventWin.textContent = `${fmt(eventWin)}x`;
    els.eventSpin.textContent = eventSpinLabel ? `Free Spin ${eventSpinLabel}` : '';
    els.eventBox.classList.toggle('is-visible', eventVisible);
    els.spin.disabled = spinDisabled;
    els.betMinus.disabled = spinDisabled || bet <= MIN_BET;
    els.betPlus.disabled = spinDisabled || bet >= MAX_BET;
    els.demoBeer.disabled = spinDisabled;
    els.demoWine.disabled = spinDisabled;
    els.demoMoonshine.disabled = spinDisabled;
    els.demoJug.disabled = spinDisabled;
    els.demoBarrel.disabled = spinDisabled;
  }

  function setBet(nextBet) {
    const clamped = clampBet(nextBet);
    if (clamped === bet) return;
    bet = clamped;
    render();
    if (options.onBetChange) options.onBetChange(bet);
  }

  function setPaytableOpen(open) {
    els.overlay.classList.toggle('is-open', open);
    els.overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  }

  els.betMinus.addEventListener('click', () => setBet(bet - BET_STEP));
  els.betPlus.addEventListener('click', () => setBet(bet + BET_STEP));
  const savedMode = localStorage.getItem('tdf-display-mode');
  const currentMobile = savedMode ? savedMode === 'mobile' : window.innerHeight > window.innerWidth;
  els.displayMode.checked = currentMobile;
  els.displayMode.addEventListener('change', () => {
    localStorage.setItem('tdf-display-mode', els.displayMode.checked ? 'mobile' : 'desktop');
    window.location.reload();
  });
  els.spin.addEventListener('click', () => {
    if (options.onSpin) options.onSpin();
  });
  els.demoBeer.addEventListener('click', () => {
    if (options.onDemoBottle) options.onDemoBottle('beer');
  });
  els.demoWine.addEventListener('click', () => {
    if (options.onDemoBottle) options.onDemoBottle('wine');
  });
  els.demoMoonshine.addEventListener('click', () => {
    if (options.onDemoBottle) options.onDemoBottle('moonshine');
  });
  els.demoJug.addEventListener('click', () => {
    if (options.onDemoBottle) options.onDemoBottle('jug');
  });
  els.demoBarrel.addEventListener('click', () => {
    if (options.onDemoBottle) options.onDemoBottle('barrel');
  });
  els.paytable.addEventListener('click', () => setPaytableOpen(true));
  els.paytableClose.addEventListener('click', () => setPaytableOpen(false));
  els.overlay.addEventListener('click', (event) => {
    if (event.target === els.overlay) setPaytableOpen(false);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setPaytableOpen(false);
  });

  // Compact HUD keys off the STAGE's on-screen width, not the viewport, so the
  // mobile layout pillarboxed in a wide window compacts too.
  const stageEl = document.querySelector('#stage');
  function syncCompact() {
    const isMobile = Boolean(stageEl && stageEl.classList.contains('tdf-mobile'));
    const stageW = (stageEl && stageEl.clientWidth) || window.innerWidth;
    // Mobile has no bar (floating controls) — compact only shrinks the bar,
    // so it never applies together with the mobile layout.
    mount.classList.toggle('game-hud--compact', !isMobile && Math.min(stageW, window.innerWidth) < 560);
    mount.classList.toggle('game-hud--mobile', isMobile);
    mount.classList.toggle('game-hud--desktop', !isMobile);
  }
  window.addEventListener('resize', syncCompact);
  syncCompact();

  render();

  return {
    spinButton: els.spin,
    getBet: () => bet,
    setSpinDisabled(disabled) {
      spinDisabled = Boolean(disabled);
      render();
    },
    setBalance(value) {
      balance = Number(value || 0);
      render();
    },
    setLastWin(value) {
      lastWin = Number(value || 0);
      render();
    },
    // Farmer fill ("buzz") meter beside the board: 0..1 fraction of METER_MAX.
    setFillMeter(fraction) {
      const f = Math.max(0, Math.min(1, Number(fraction) || 0));
      els.buzzFill.style.setProperty('--tdf-fill', `${f * 100}%`);
      els.buzzValue.textContent = `${Math.round(f * 100)}%`;
    },
    showEventWin(value = 0, spinLabel = '') {
      eventWin = Number(value || 0);
      eventVisible = true;
      eventSpinLabel = spinLabel;
      render();
    },
    setEventWin(value, spinLabel) {
      eventWin = Number(value || 0);
      if (spinLabel !== undefined) eventSpinLabel = spinLabel;
      render();
    },
    hideEventWin() {
      eventWin = 0;
      eventVisible = false;
      eventSpinLabel = '';
      render();
    },
  };
}

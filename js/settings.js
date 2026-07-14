/* ============================================================
   SETTINGS.JS — Экран настроек Василий-прыгун
   ============================================================ */

function showSettings(backFn) {
  const overlay = document.getElementById('overlay');

  function render() {
    const sfxVol   = Math.round(Sounds.getSfxVol()   * 100);
    const musicVol = Math.round(Sounds.getMusicVol() * 100);
    const sfxOn    = Sounds.isSfxOn();
    const musicOn  = Sounds.isMusicOn();
    const ctrl     = getControlMode();

    const ctrlOpts = [
      { id: 'buttons', icon: '🕹️', label: 'Кнопки' },
      { id: 'tap',     icon: '👆', label: 'Тап' },
      { id: 'gyro',    icon: '📱', label: 'Гироскоп' },
    ];

    overlay.innerHTML = `
      <div style="position:absolute;inset:0;background:url('menu-bg.png') center/cover no-repeat;border-radius:12px;">
        <div class="swamp-panel" style="overflow-y:auto;max-height:calc(100% - 36px);">
          <div class="swamp-panel-title">Настройки</div>

          <div class="swamp-panel-list" style="margin-top:20px;gap:8px;">

            <!-- УПРАВЛЕНИЕ -->
            <div class="swamp-panel-row" style="flex-direction:column;align-items:flex-start;gap:10px;padding:14px 14px 14px">
              <span class="swamp-panel-name" style="font-size:10px;letter-spacing:1px;">🎮 Управление</span>
              <div style="display:flex;gap:8px;width:100%;">
                ${ctrlOpts.map(o => `
                  <button class="ctrl-opt-btn ${ctrl === o.id ? 'ctrl-opt-active' : ''}" data-ctrl="${o.id}">
                    <span style="font-size:18px;display:block;margin-bottom:4px;">${o.icon}</span>
                    <span style="font-size:7px;letter-spacing:0.5px;">${o.label}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- МУЗЫКА -->
            <div class="swamp-panel-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 14px 12px">
              <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
                <span class="swamp-panel-name">🎵 Музыка</span>
                <button class="swamp-pill-btn sett-toggle-btn" id="musicToggle"
                  style="min-width:56px;padding:6px 14px;font-size:8px;border:none;cursor:pointer;font-family:var(--font-sans);border-radius:999px;
                  background:${musicOn ? 'rgba(242,193,78,0.9)' : 'rgba(255,250,244,0.15)'}; color:${musicOn ? '#111' : '#ccc'}">
                  ${musicOn ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>
              <div style="display:flex;align-items:center;gap:10px;width:100%;${musicOn ? '' : 'opacity:0.35'}">
                <span class="swamp-panel-score" id="musicVolVal" style="min-width:34px;text-align:left">${musicVol}%</span>
                <input type="range" class="sett-range" id="musicSlider"
                  min="0" max="100" value="${musicVol}" ${musicOn ? '' : 'disabled'}>
              </div>
            </div>

            <!-- ЗВУКИ -->
            <div class="swamp-panel-row" style="flex-direction:column;align-items:flex-start;gap:8px;padding:14px 14px 12px">
              <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
                <span class="swamp-panel-name">🔊 Звуки</span>
                <button class="swamp-pill-btn sett-toggle-btn" id="sfxToggle"
                  style="min-width:56px;padding:6px 14px;font-size:8px;border:none;cursor:pointer;font-family:var(--font-sans);border-radius:999px;
                  background:${sfxOn ? 'rgba(242,193,78,0.9)' : 'rgba(255,250,244,0.15)'}; color:${sfxOn ? '#111' : '#ccc'}">
                  ${sfxOn ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>
              <div style="display:flex;align-items:center;gap:10px;width:100%;${sfxOn ? '' : 'opacity:0.35'}">
                <span class="swamp-panel-score" id="sfxVolVal" style="min-width:34px;text-align:left">${sfxVol}%</span>
                <input type="range" class="sett-range" id="sfxSlider"
                  min="0" max="100" value="${sfxVol}" ${sfxOn ? '' : 'disabled'}>
              </div>
            </div>

          </div>

          <div class="swamp-panel-actions" style="margin-top:20px">
            <button class="swamp-pill-btn ghost" id="settBackBtn">← Назад</button>
          </div>
        </div>
      </div>`;

    overlay.style.display = 'flex';

    // Стили
    if (!document.getElementById('sett-range-style')) {
      const st = document.createElement('style');
      st.id = 'sett-range-style';
      st.textContent = `
        .sett-range { flex:1; -webkit-appearance:none; appearance:none;
          height:4px; border-radius:2px; background:rgba(255,255,255,0.15); outline:none; cursor:pointer; }
        .sett-range::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px;
          border-radius:50%; background:#f2c14e; cursor:pointer;
          box-shadow:0 0 6px rgba(242,193,78,0.6); }
        .ctrl-opt-btn {
          flex:1; padding:10px 4px 8px;
          background:linear-gradient(180deg,rgba(251,242,225,0.14) 0%,rgba(188,164,143,0.12) 100%);
          border:2px solid rgba(255,250,240,0.12);
          border-radius:14px;
          color:rgba(255,246,232,0.7);
          font-family:var(--font-sans);
          cursor:pointer;
          text-align:center;
          transition:all .15s ease;
        }
        .ctrl-opt-btn:active { transform:scale(0.95); }
        .ctrl-opt-active {
          background:linear-gradient(180deg,rgba(242,193,78,0.22) 0%,rgba(180,140,40,0.18) 100%);
          border-color:rgba(242,193,78,0.7);
          color:#f2c14e;
          box-shadow:0 0 12px rgba(242,193,78,0.2);
        }
      `;
      document.head.appendChild(st);
    }

    // Обработчики управления
    document.querySelectorAll('.ctrl-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Sounds.click();
        setControlMode(btn.dataset.ctrl);
        render();
      });
    });

    document.getElementById('settBackBtn').addEventListener('click', () => { Sounds.click(); backFn(); });
    document.getElementById('musicToggle').addEventListener('click', () => { Sounds.click(); Sounds.setMusicOn(!Sounds.isMusicOn()); render(); });
    document.getElementById('musicSlider').addEventListener('input', e => {
      Sounds.setMusicVol(parseInt(e.target.value) / 100);
      document.getElementById('musicVolVal').textContent = e.target.value + '%';
    });
    document.getElementById('sfxToggle').addEventListener('click', () => { Sounds.setSfxOn(!Sounds.isSfxOn()); Sounds.click(); render(); });
    document.getElementById('sfxSlider').addEventListener('input', e => {
      Sounds.setSfxVol(parseInt(e.target.value) / 100);
      document.getElementById('sfxVolVal').textContent = e.target.value + '%';
      Sounds.click();
    });
  }

  render();
}

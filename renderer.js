const MODES = {
  work: { label: 'FOCUS MODE', minutes: 25, colorClass: 'active' },
  shortBreak: { label: 'SHORT BREAK', minutes: 5, colorClass: 'break' },
  longBreak: { label: 'LONG BREAK', minutes: 15, colorClass: 'break' }
};

class PomodoroTimer {
  constructor() {
    this.mode = 'work';
    this.totalSeconds = MODES.work.minutes * 60;
    this.remaining = this.totalSeconds;
    this.isRunning = false;
    this.interval = null;
    this.soundEnabled = true;
    this.todayKey = this.getTodayKey();
    this.stats = this.loadStats();

    this.elements = {
      timeDisplay: document.getElementById('time-display'),
      modeLabel: document.getElementById('mode-label'),
      progressFill: document.getElementById('progress-fill'),
      btnMain: document.getElementById('btn-main'),
      btnReset: document.getElementById('btn-reset'),
      btnSkip: document.getElementById('btn-skip'),
      btnSound: document.getElementById('btn-sound'),
      soundLed: document.getElementById('sound-led'),
      playIcon: document.getElementById('play-icon'),
      pauseIcon: document.getElementById('pause-icon'),
      statsCount: document.getElementById('stats-count'),
      modeTabs: document.querySelectorAll('.mode-tab'),
      statusIndicator: document.getElementById('status-indicator'),
      ledRing: document.querySelector('.led-ring'),
      core: document.getElementById('core')
    };

    this.init();
  }

  getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  loadStats() {
    try {
      const data = JSON.parse(localStorage.getItem('pomodoroStats') || '{}');
      if (data.date !== this.todayKey) {
        return { date: this.todayKey, count: 0 };
      }
      return data;
    } catch {
      return { date: this.todayKey, count: 0 };
    }
  }

  saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));
  }

  init() {
    this.updateDisplay();
    this.updateProgress();
    this.updateStatsDisplay();
    this.updateStatusVisual('idle');
    this.bindEvents();
  }

  bindEvents() {
    this.elements.btnMain.addEventListener('click', () => this.toggle());
    this.elements.btnReset.addEventListener('click', () => this.reset());
    this.elements.btnSkip.addEventListener('click', () => this.skip());
    this.elements.btnSound.addEventListener('click', () => this.toggleSound());

    this.elements.modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        this.switchMode(mode);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.updateStatusVisual('running');
    this.updateIcons();

    this.interval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    clearInterval(this.interval);
    this.updateStatusVisual('idle');
    this.updateIcons();
  }

  reset() {
    this.pause();
    this.remaining = this.totalSeconds;
    this.updateDisplay();
    this.updateProgress();
    this.updateStatusVisual('idle');
    this.clearAlarm();
  }

  skip() {
    this.pause();
    this.onComplete(true);
  }

  tick() {
    if (this.remaining > 0) {
      this.remaining--;
      this.updateDisplay();
      this.updateProgress();

      if (this.remaining <= 5 && this.remaining > 0) {
        this.updateStatusVisual('tense');
      }
    } else {
      this.pause();
      this.onComplete();
    }
  }

  switchMode(mode) {
    this.pause();
    this.mode = mode;
    this.totalSeconds = MODES[mode].minutes * 60;
    this.remaining = this.totalSeconds;
    this.updateDisplay();
    this.updateProgress();
    this.updateModeUI();
    this.updateStatusVisual('idle');
    this.clearAlarm();
  }

  onComplete(skipped = false) {
    this.setAlarm();

    if (!skipped && this.mode === 'work') {
      this.stats.count++;
      this.saveStats();
      this.updateStatsDisplay();
    }

    const title = skipped ? 'SKIPPED' : MODES[this.mode].label + ' COMPLETE';
    const body = skipped
      ? 'Phase skipped by user'
      : (this.mode === 'work'
          ? `Session complete. Total: ${String(this.stats.count).padStart(2, '0')}`
          : 'Break over. Ready to focus.');

    if (this.soundEnabled) {
      this.playNotificationSound();
    }

    if (window.electronAPI && window.electronAPI.showNotification) {
      window.electronAPI.showNotification(title, body);
    }

    setTimeout(() => {
      this.clearAlarm();
    }, 2500);

    this.autoSwitch();
  }

  autoSwitch() {
    if (this.mode === 'work') {
      this.switchMode('shortBreak');
    } else {
      this.switchMode('work');
    }
  }

  updateDisplay() {
    const m = Math.floor(this.remaining / 60);
    const s = this.remaining % 60;
    this.elements.timeDisplay.textContent =
      `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  updateProgress() {
    const progress = this.remaining / this.totalSeconds;
    this.elements.progressFill.style.transform = `scaleX(${progress})`;
  }

  updateModeUI() {
    const config = MODES[this.mode];
    this.elements.modeLabel.textContent = config.label;

    const isBreak = config.colorClass === 'break';

    this.elements.timeDisplay.classList.toggle('break', isBreak);
    this.elements.timeDisplay.classList.toggle('active', !isBreak);
    this.elements.modeLabel.classList.toggle('break', isBreak);
    this.elements.modeLabel.classList.toggle('active', !isBreak);
    this.elements.progressFill.classList.toggle('break', isBreak);
    this.elements.progressFill.classList.toggle('active', !isBreak);
    this.elements.btnMain.classList.toggle('break', isBreak);

    this.elements.modeTabs.forEach(tab => {
      const tabMode = tab.dataset.mode;
      tab.classList.toggle('active', tabMode === this.mode);
      tab.classList.toggle('break', isBreak);
    });
  }

  updateStatusVisual(state) {
    const isBreak = MODES[this.mode].colorClass === 'break';
    const ring = this.elements.ledRing;
    const core = this.elements.core;

    ring.classList.remove('active', 'break', 'alarm');
    core.classList.remove('active', 'break', 'alarm');
    this.elements.timeDisplay.classList.remove('alarm');

    if (state === 'running') {
      ring.classList.add(isBreak ? 'break' : 'active');
      core.classList.add(isBreak ? 'break' : 'active');
    } else if (state === 'tense') {
      ring.classList.add('alarm');
      core.classList.add('alarm');
      this.elements.timeDisplay.classList.add('alarm');
    } else {
      // idle - no ring glow
      core.classList.add(isBreak ? 'break' : 'active');
    }
  }

  setAlarm() {
    this.elements.ledRing.classList.add('alarm');
    this.elements.core.classList.add('alarm');
    this.elements.timeDisplay.classList.add('alarm');
  }

  clearAlarm() {
    this.elements.ledRing.classList.remove('alarm');
    this.elements.core.classList.remove('alarm');
    this.elements.timeDisplay.classList.remove('alarm');
  }

  updateIcons() {
    if (this.isRunning) {
      this.elements.playIcon.style.display = 'none';
      this.elements.pauseIcon.style.display = 'block';
    } else {
      this.elements.playIcon.style.display = 'block';
      this.elements.pauseIcon.style.display = 'none';
    }
  }

  updateStatsDisplay() {
    this.elements.statsCount.textContent = String(this.stats.count).padStart(2, '0');
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.elements.soundLed.classList.toggle('off', !this.soundEnabled);
  }

  playNotificationSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio not supported
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PomodoroTimer();
});

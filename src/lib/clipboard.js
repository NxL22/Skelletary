let copyAudioContext = null;

function getCopyAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!copyAudioContext) {
    copyAudioContext = new AudioContextConstructor();
  }

  return copyAudioContext;
}

export async function copyText(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export async function playCopyFeedback() {
  const context = getCopyAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const startAt = context.currentTime + 0.01;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, startAt);
  master.gain.exponentialRampToValueAtTime(0.12, startAt + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
  master.connect(context.destination);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, startAt);
  filter.Q.setValueAtTime(1.2, startAt);
  filter.connect(master);

  const lead = context.createOscillator();
  lead.type = "square";
  lead.frequency.setValueAtTime(740, startAt);
  lead.frequency.exponentialRampToValueAtTime(980, startAt + 0.08);
  lead.frequency.exponentialRampToValueAtTime(1174, startAt + 0.18);

  const leadGain = context.createGain();
  leadGain.gain.setValueAtTime(0.0001, startAt);
  leadGain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.015);
  leadGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.2);
  lead.connect(leadGain);
  leadGain.connect(filter);

  const accent = context.createOscillator();
  accent.type = "triangle";
  accent.frequency.setValueAtTime(1480, startAt);
  accent.frequency.exponentialRampToValueAtTime(1760, startAt + 0.12);

  const accentGain = context.createGain();
  accentGain.gain.setValueAtTime(0.0001, startAt);
  accentGain.gain.exponentialRampToValueAtTime(0.09, startAt + 0.02);
  accentGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);
  accent.connect(accentGain);
  accentGain.connect(filter);

  lead.start(startAt);
  accent.start(startAt + 0.01);
  lead.stop(startAt + 0.24);
  accent.stop(startAt + 0.18);

  const cleanup = () => {
    lead.disconnect();
    leadGain.disconnect();
    accent.disconnect();
    accentGain.disconnect();
    filter.disconnect();
    master.disconnect();
  };

  accent.onended = cleanup;
}

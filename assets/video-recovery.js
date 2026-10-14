/* Recover from an unavailable portfolio video without losing the case study. */
for (const wrap of document.querySelectorAll('.case-video-wrap')) {
  const videos = [...wrap.querySelectorAll('video')];
  if (!videos.length) continue;
  const failed = new Set();
  const pending = new Map();
  const panel = document.createElement('div');
  panel.className = 'video-recovery'; panel.hidden = true;
  const message = document.createElement('p'); message.setAttribute('role', 'status');
  const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Try again';
  const direct = document.createElement('a'); direct.textContent = 'Open video in a new tab'; direct.target = '_blank'; direct.rel = 'noopener noreferrer';
  panel.append(message, retry, direct); wrap.append(panel);
  const strip = wrap.querySelector('.case-strip');
  function activeVideo() { return videos[Math.min(videos.length - 1, Math.max(0, strip ? Math.round(strip.scrollLeft / (strip.clientWidth || 1)) : 0))]; }
  function render() {
    const video = activeVideo();
    const visible = failed.has(video) || pending.has(video);
    if (!visible && panel.contains(document.activeElement)) video.focus({ preventScroll: true });
    panel.hidden = !visible;
    if (!visible) return;
    direct.href = video.currentSrc || video.src;
    message.textContent = pending.has(video) ? 'Trying the video again…' : 'This video could not load. Try again, or open it in a new tab.';
    retry.textContent = pending.has(video) ? 'Trying again…' : 'Try again';
    panel.setAttribute('aria-busy', String(pending.has(video)));
  }
  function clearPending(video) { clearTimeout(pending.get(video)); pending.delete(video); }
  for (const video of videos) {
    video.addEventListener('error', () => { clearPending(video); failed.add(video); render(); });
    video.addEventListener('canplay', () => { clearPending(video); failed.delete(video); render(); });
  }
  retry.addEventListener('click', () => {
    const video = activeVideo();
    if (pending.has(video)) return;
    pending.set(video, setTimeout(() => { pending.delete(video); failed.add(video); render(); }, 12000));
    render();
    video.load();
    video.play().catch(() => { clearPending(video); failed.add(video); render(); });
  });
  strip?.addEventListener('scroll', render, { passive: true });
}

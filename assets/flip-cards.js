// Touch/tap toggle for flip cards on non-hover devices
document.querySelectorAll('.flip-card').forEach(function(card) {
  card.addEventListener('click', function() {
    this.classList.toggle('flipped');
  });
  card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.classList.toggle('flipped');
    }
  });
});

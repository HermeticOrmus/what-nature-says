/**
 * What Nature Says - Main Application
 * Interactive children's book experience
 * Optimized for iOS/iPad touch interactions
 */

class NatureSaysApp {
  constructor() {
    this.currentPage = 'cover';
    this.currentElementIndex = 0;
    this.elements = window.ELEMENTS || [];
    this.drawingColors = window.DRAWING_COLORS || [];
    this.selectedColor = this.drawingColors[0]?.value || '#7cb342';
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    // Touch tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;

    // Device detection
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Audio and Progress managers
    this.audioManager = null;
    this.progressManager = null;

    // Reading mode: 'read-to-me' or 'read-myself'
    this.readingMode = 'read-to-me';

    // Current word elements for highlighting
    this.currentWordElements = [];

    this.init();
  }

  init() {
    this.preventIOSQuirks();
    this.bindEvents();
    this.initCanvas();
    this.initColorPicker();
    this.updateNavDots();
    this.showSwipeHint();

    // Initialize audio manager
    if (window.AudioManager) {
      this.audioManager = new AudioManager();
    }

    // Initialize progress manager
    if (window.ProgressManager) {
      this.progressManager = new ProgressManager();
      this.progressManager.onStarEarned = (elementId, totalStars) => {
        this.showStarAnimation(elementId);
      };
      this.progressManager.onBadgeEarned = (badge) => {
        this.showBadgeNotification(badge);
      };
    }

    // Update stars display
    this.updateStarsDisplay();
  }

  // ==================== iOS SPECIFIC FIXES ====================

  preventIOSQuirks() {
    // Prevent double-tap zoom on iOS
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - this.lastTouchEnd <= 300) {
        e.preventDefault();
      }
      this.lastTouchEnd = now;
    }, { passive: false });

    // Prevent iOS bounce/rubber-banding
    document.body.addEventListener('touchmove', (e) => {
      if (e.target.closest('#drawCanvas')) return;
      if (!e.target.closest('.scrollable')) {
        if (!this.isSwiping) {
          e.preventDefault();
        }
      }
    }, { passive: false });

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.resizeCanvas();
        window.scrollTo(0, 0);
      }, 100);
    });

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.resizeCanvas();
      }, 100);
    });
  }

  showSwipeHint() {
    if (localStorage.getItem('swipeHintSeen')) return;

    if (!document.querySelector('.swipe-hint')) {
      const hint = document.createElement('div');
      hint.className = 'swipe-hint';
      hint.innerHTML = '<span class="arrow">←</span> Swipe to turn pages <span class="arrow">→</span>';
      document.body.appendChild(hint);
    }
  }

  displaySwipeHint() {
    const hint = document.querySelector('.swipe-hint');
    if (hint && !localStorage.getItem('swipeHintSeen')) {
      hint.classList.add('visible');
      setTimeout(() => {
        hint.classList.remove('visible');
        localStorage.setItem('swipeHintSeen', 'true');
      }, 3000);
    }
  }

  // ==================== EVENT BINDING ====================

  bindEvents() {
    // Cover page - Begin button
    document.getElementById('startBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.goToElement(0, 'forward');
    });

    // Reading mode toggle
    document.getElementById('readModeBtn')?.addEventListener('click', () => {
      this.toggleReadingMode();
    });

    // Play/Pause narration button
    document.getElementById('playNarrationBtn')?.addEventListener('click', () => {
      this.toggleNarration();
    });

    // Element page navigation
    document.getElementById('prevBtn')?.addEventListener('click', () => this.prevElement());
    document.getElementById('nextBtn')?.addEventListener('click', () => this.nextElement());

    // Pause page navigation
    document.getElementById('pausePrevBtn')?.addEventListener('click', () => this.goToElement(this.elements.length - 1, 'backward'));
    document.getElementById('pauseNextBtn')?.addEventListener('click', () => this.showPage('draw', 'forward'));

    // Draw page
    document.getElementById('drawPrevBtn')?.addEventListener('click', () => this.showPage('pause', 'backward'));
    document.getElementById('clearBtn')?.addEventListener('click', () => this.clearCanvas());
    document.getElementById('saveBtn')?.addEventListener('click', () => this.saveDrawing());
    document.getElementById('finishBtn')?.addEventListener('click', () => this.finishBook());

    // End page
    document.getElementById('restartBtn')?.addEventListener('click', () => this.restart());

    // Fun fact accordion
    document.querySelector('.fun-fact-toggle')?.addEventListener('click', (e) => this.toggleFunFact(e));

    // Swipe gestures
    this.initSwipeGestures();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  initSwipeGestures() {
    const app = document.getElementById('app');

    app.addEventListener('touchstart', (e) => {
      if (e.target.closest('button, .fun-fact, #drawCanvas, #colorPicker, .word-tappable')) {
        this.isSwiping = false;
        return;
      }

      this.touchStartX = e.changedTouches[0].clientX;
      this.touchStartY = e.changedTouches[0].clientY;
      this.touchStartTime = Date.now();
      this.isSwiping = true;
    }, { passive: true });

    app.addEventListener('touchmove', (e) => {
      if (!this.isSwiping) return;

      const touchX = e.changedTouches[0].clientX;
      const touchY = e.changedTouches[0].clientY;
      const deltaX = Math.abs(touchX - this.touchStartX);
      const deltaY = Math.abs(touchY - this.touchStartY);

      if (deltaY > deltaX * 1.5) {
        this.isSwiping = false;
      }
    }, { passive: true });

    app.addEventListener('touchend', (e) => {
      if (!this.isSwiping) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      this.handleSwipe(
        this.touchStartX,
        touchEndX,
        this.touchStartY,
        touchEndY,
        touchEndTime - this.touchStartTime
      );

      this.isSwiping = false;
    }, { passive: true });
  }

  handleSwipe(startX, endX, startY, endY, duration) {
    const deltaX = endX - startX;
    const deltaY = Math.abs(endY - startY);
    const absDeltaX = Math.abs(deltaX);

    const swipeThreshold = 50;
    const maxDuration = 500;

    if (absDeltaX < swipeThreshold) return;
    if (deltaY > absDeltaX * 0.7) return;
    if (duration > maxDuration) return;

    this.hapticFeedback();

    if (this.currentPage === 'element') {
      if (deltaX < 0) {
        this.nextElement();
      } else {
        this.prevElement();
      }
    } else if (this.currentPage === 'pause') {
      if (deltaX < 0) {
        this.showPage('draw', 'forward');
      } else {
        this.goToElement(this.elements.length - 1, 'backward');
      }
    } else if (this.currentPage === 'draw') {
      if (deltaX > 0) {
        this.showPage('pause', 'backward');
      }
    } else if (this.currentPage === 'cover') {
      if (deltaX < 0) {
        this.goToElement(0, 'forward');
      }
    }
  }

  hapticFeedback() {
    if (this.isIOS && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  }

  handleKeyboard(e) {
    if (this.currentPage === 'element') {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        this.nextElement();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prevElement();
      }
    }
  }

  // ==================== PAGE NAVIGATION ====================

  showPage(pageId, direction = 'forward') {
    const currentPageEl = document.querySelector('.page.active');
    const targetPage = document.querySelector(`[data-page="${pageId}"]`);

    if (!targetPage) return;

    if (currentPageEl === targetPage && pageId !== 'element') {
      return;
    }

    // Stop any current narration when changing pages
    if (this.audioManager) {
      this.audioManager.stopNarration();
      this.audioManager.stopAmbientSound();
    }

    // Animate page transition
    if (currentPageEl && currentPageEl !== targetPage) {
      const exitClass = direction === 'forward' ? 'flip-exit' : 'flip-back-exit';
      const enterClass = direction === 'forward' ? 'flip-enter' : 'flip-back-enter';

      currentPageEl.classList.add(exitClass);
      targetPage.classList.add('active', enterClass);

      setTimeout(() => {
        currentPageEl.classList.remove('active', exitClass);
        targetPage.classList.remove(enterClass);
      }, 500);
    } else {
      if (currentPageEl) {
        currentPageEl.classList.remove('active');
      }
      targetPage.classList.add('active');
    }

    this.currentPage = pageId;

    // Special handling
    if (pageId === 'draw') {
      setTimeout(() => this.resizeCanvas(), 50);
    }

    if (pageId === 'element' && this.currentElementIndex === 0) {
      this.displaySwipeHint();
    }

    targetPage.scrollTop = 0;
  }

  goToElement(index, direction = 'forward') {
    if (index < 0) {
      this.showPage('cover', 'backward');
      return;
    }

    if (index >= this.elements.length) {
      this.showPage('pause', 'forward');
      return;
    }

    this.renderElement(this.elements[index]);
    this.showPage('element', direction);
    this.currentElementIndex = index;
    this.updateNavDots();

    // Track progress
    if (this.progressManager) {
      this.progressManager.markElementViewed(this.elements[index].id);
    }

    // Start ambient sound and narration for read-to-me mode
    const element = this.elements[index];
    if (this.audioManager) {
      this.audioManager.playAmbientSound(element.id);

      if (this.readingMode === 'read-to-me') {
        setTimeout(() => this.startNarration(), 500);
      }
    }
  }

  nextElement() {
    // Mark current element as completed when moving to next
    if (this.progressManager && this.currentElementIndex < this.elements.length) {
      this.progressManager.markElementCompleted(this.elements[this.currentElementIndex].id);
    }
    this.goToElement(this.currentElementIndex + 1, 'forward');
  }

  prevElement() {
    this.goToElement(this.currentElementIndex - 1, 'backward');
  }

  finishBook() {
    // Mark last element and book as complete
    if (this.progressManager) {
      if (this.currentElementIndex >= 0 && this.currentElementIndex < this.elements.length) {
        this.progressManager.markElementCompleted(this.elements[this.currentElementIndex].id);
      }
      this.progressManager.markBookFinished();
    }
    this.showPage('end', 'forward');
  }

  restart() {
    this.currentElementIndex = 0;
    this.clearCanvas();
    this.showPage('cover', 'backward');
    this.updateStarsDisplay();
  }

  // ==================== READING MODE & NARRATION ====================

  toggleReadingMode() {
    this.readingMode = this.readingMode === 'read-to-me' ? 'read-myself' : 'read-to-me';

    // Update button icon and style
    const btn = document.getElementById('readModeBtn');
    if (btn) {
      const icon = btn.querySelector('.icon');
      if (icon) {
        icon.textContent = this.readingMode === 'read-to-me' ? '🔊' : '📖';
      }
      btn.classList.toggle('active', this.readingMode === 'read-to-me');
      btn.title = this.readingMode === 'read-to-me' ? 'Read to me (on)' : 'Read myself';
    }

    // If switching to read-to-me on element page, start narration
    if (this.readingMode === 'read-to-me' && this.currentPage === 'element') {
      this.startNarration();
    } else if (this.audioManager) {
      this.audioManager.stopNarration();
    }
  }

  toggleNarration() {
    if (!this.audioManager) return;

    if (this.audioManager.isNarrating) {
      if (this.audioManager.isPaused) {
        this.audioManager.resumeNarration();
        this.updatePlayButton(true);
      } else {
        this.audioManager.pauseNarration();
        this.updatePlayButton(false);
      }
    } else {
      this.startNarration();
    }
  }

  startNarration() {
    if (!this.audioManager || this.currentPage !== 'element') return;

    const element = this.elements[this.currentElementIndex];
    if (!element) return;

    // Get the question text
    const questionEl = document.getElementById('elementQuestion');
    const text = element.question;

    // Narrate with highlighting
    this.audioManager.narrateWithHighlight(
      text,
      this.currentWordElements,
      () => {
        this.updatePlayButton(false);
        // Mark element as completed after narration
        if (this.progressManager) {
          this.progressManager.markElementCompleted(element.id);
        }
      }
    );

    this.updatePlayButton(true);
  }

  updatePlayButton(isPlaying) {
    const btn = document.getElementById('playNarrationBtn');
    if (btn) {
      const icon = btn.querySelector('.icon');
      if (icon) {
        icon.textContent = isPlaying ? '⏸' : '▶';
      }
      btn.classList.toggle('playing', isPlaying);
      btn.setAttribute('aria-label', isPlaying ? 'Pause narration' : 'Play narration');
    }
  }

  // ==================== ELEMENT RENDERING ====================

  renderElement(element) {
    const elementPage = document.querySelector('[data-page="element"]');

    elementPage.className = 'page element-page element-' + element.id;
    elementPage.style.setProperty('--element-color', element.color);
    elementPage.style.setProperty('--element-color-light', element.colorLight);

    // Render question with tappable words
    document.getElementById('elementQuestion').innerHTML = this.formatQuestionWithTappableWords(element);

    // Store word elements for highlighting
    this.currentWordElements = Array.from(document.querySelectorAll('#elementQuestion .word-tappable'));

    // Add tap-to-pronounce handlers
    this.currentWordElements.forEach(wordEl => {
      wordEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleWordTap(wordEl);
      });
    });

    // Update fun fact
    document.getElementById('funFactText').textContent = element.funFact;

    // Close fun fact if open
    document.getElementById('funFact').classList.remove('open');
    document.querySelector('.fun-fact-toggle')?.setAttribute('aria-expanded', 'false');

    // Render verb buttons
    this.renderVerbButtons(element);

    // Update visual
    const placeholder = document.querySelector('.element-placeholder');
    if (placeholder) {
      placeholder.textContent = '';
      placeholder.style.backgroundImage = `url('/assets/images/elements/${element.id}.png')`;
      placeholder.style.backgroundSize = 'cover';
      placeholder.style.backgroundPosition = 'center';
    }

    // Show completion star if completed
    this.updateElementCompletionStar(element.id);
  }

  formatQuestionWithTappableWords(element) {
    const { name, adjective, verbs, question } = element;

    // Split into words while preserving punctuation
    const words = question.split(/(\s+)/);

    return words.map(word => {
      if (!word.trim()) return word; // Keep whitespace

      // Clean word for comparison
      const cleanWord = word.replace(/[.,!?]/g, '').toLowerCase();

      // Determine word class
      let classes = ['word-tappable'];

      if (cleanWord === adjective.toLowerCase()) {
        classes.push('adjective');
      } else if (cleanWord === name.toLowerCase()) {
        classes.push('element-name');
      } else if (verbs.map(v => v.toLowerCase()).includes(cleanWord)) {
        classes.push('verb');
      }

      return `<span class="${classes.join(' ')}" data-word="${cleanWord}">${word}</span>`;
    }).join('');
  }

  handleWordTap(wordEl) {
    if (!this.audioManager) return;

    const word = wordEl.dataset.word || wordEl.textContent.trim();

    // Visual feedback
    wordEl.classList.add('word-tapped');
    setTimeout(() => wordEl.classList.remove('word-tapped'), 300);

    // Speak the word
    this.audioManager.speakWord(word);
  }

  renderVerbButtons(element) {
    const container = document.getElementById('verbButtons');
    container.innerHTML = '';

    element.verbs.forEach(verb => {
      const btn = document.createElement('button');
      btn.className = 'verb-btn';
      btn.textContent = verb;
      btn.style.setProperty('--element-color', element.color);
      btn.setAttribute('aria-label', `Animate ${verb}`);

      btn.addEventListener('click', () => this.animateVerb(element.id, verb, btn));

      container.appendChild(btn);
    });
  }

  animateVerb(elementId, verb, button) {
    const elementPage = document.querySelector('.element-page');

    // Remove existing animation classes
    const animClasses = Array.from(elementPage.classList).filter(c => c.startsWith('animate-'));
    animClasses.forEach(c => elementPage.classList.remove(c));

    // Trigger button pulse
    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), 600);

    // Map verb to animation
    const verbToAnimation = {
      'flits': 'flit', 'flutters': 'flutter', 'floats': 'float',
      'burbles': 'burble', 'gurgles': 'gurgle', 'prattles': 'prattle',
      'links': 'link', 'feeds': 'feed', 'heals': 'heal',
      'croaks': 'croak', 'grunts': 'grunt', 'ribbits': 'ribbit',
      'laps': 'lap', 'slaps': 'slap', 'roars': 'roar',
      'beats': 'beat', 'darts': 'dart', 'shakes': 'shake',
      'shimmers': 'shimmer', 'glimmers': 'glimmer', 'glistens': 'glisten',
      'spurts': 'spurt', 'splashes': 'splash', 'pools': 'pool',
      'jumps': 'jump', 'swims': 'swim', 'plays': 'play',
      'twinkles': 'twinkle', 'blinks': 'blink', 'shines': 'shine',
      'stretches': 'stretch', 'breathes': 'breathe', 'sways': 'sway',
      'cry': 'cry', 'laugh': 'laugh', 'tumble': 'tumble'
    };

    const animName = verbToAnimation[verb] || verb.replace(/s$/, '');
    elementPage.classList.add('animate-' + animName);

    setTimeout(() => elementPage.classList.remove('animate-' + animName), 2000);
  }

  // ==================== PROGRESS & REWARDS UI ====================

  updateStarsDisplay() {
    const starCount = document.getElementById('starCount');
    if (!starCount || !this.progressManager) return;

    const stars = this.progressManager.getStars();
    starCount.textContent = stars;
  }

  updateElementCompletionStar(elementId) {
    const starIndicator = document.querySelector('.element-star-indicator');
    if (!starIndicator || !this.progressManager) return;

    if (this.progressManager.isElementCompleted(elementId)) {
      starIndicator.classList.add('completed');
      starIndicator.innerHTML = '⭐';
    } else {
      starIndicator.classList.remove('completed');
      starIndicator.innerHTML = '☆';
    }
  }

  showStarAnimation(elementId) {
    // Create floating star animation
    const star = document.createElement('div');
    star.className = 'star-animation';
    star.innerHTML = '⭐';
    star.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      font-size: 4rem;
      transform: translate(-50%, -50%) scale(0);
      animation: starPop 1s ease-out forwards;
      z-index: 1000;
      pointer-events: none;
    `;

    document.body.appendChild(star);

    setTimeout(() => {
      star.remove();
      this.updateStarsDisplay();
    }, 1000);
  }

  showBadgeNotification(badge) {
    // Create badge notification
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
      <div class="badge-icon">${badge.icon}</div>
      <div class="badge-info">
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.description}</div>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => notification.classList.add('visible'), 10);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ==================== FUN FACT ====================

  toggleFunFact(e) {
    const funFact = document.getElementById('funFact');
    const toggle = e.currentTarget;
    const isOpen = funFact.classList.contains('open');

    funFact.classList.toggle('open');
    toggle.setAttribute('aria-expanded', !isOpen);
  }

  // ==================== NAVIGATION DOTS ====================

  updateNavDots() {
    const containers = ['navDots', 'pauseNavDots'];

    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';

      this.elements.forEach((element, index) => {
        const dot = document.createElement('button');
        dot.className = 'nav-dot';
        dot.setAttribute('aria-label', `Go to ${element.name}`);

        if (index === this.currentElementIndex) {
          dot.classList.add('active');
          dot.style.backgroundColor = element.color;
        }

        // Show completion status
        if (this.progressManager?.isElementCompleted(element.id)) {
          dot.classList.add('completed');
        }

        dot.addEventListener('click', () => this.goToElement(index));

        container.appendChild(dot);
      });
    });
  }

  // ==================== DRAWING CANVAS ====================

  initCanvas() {
    const canvas = document.getElementById('drawCanvas');
    if (!canvas) return;

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });

    this.paths = [];
    this.currentPath = [];

    canvas.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.stopDrawing(e), { passive: false });
    canvas.addEventListener('touchcancel', () => this.stopDrawing());

    canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    canvas.addEventListener('mousemove', (e) => this.draw(e));
    canvas.addEventListener('mouseup', () => this.stopDrawing());
    canvas.addEventListener('mouseleave', () => this.stopDrawing());

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;

    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    const width = rect.width - 24;
    const height = rect.height - 120;

    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    this.ctx.scale(dpr, dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.lineWidth = this.isTouchDevice ? 10 : 8;
    this.ctx.strokeStyle = this.selectedColor;

    this.redrawPaths();
  }

  redrawPaths() {
    if (!this.ctx || !this.paths.length) return;

    this.paths.forEach(path => {
      if (path.points.length < 2) return;

      this.ctx.beginPath();
      this.ctx.strokeStyle = path.color;
      this.ctx.lineWidth = path.width;

      this.ctx.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length; i++) {
        this.ctx.lineTo(path.points[i].x, path.points[i].y);
      }

      this.ctx.stroke();
    });
  }

  startDrawing(e) {
    e.preventDefault();
    e.stopPropagation();
    this.isDrawing = true;

    const coords = this.getCoords(e);
    this.lastX = coords.x;
    this.lastY = coords.y;

    this.currentPath = {
      color: this.selectedColor,
      width: this.isTouchDevice ? 10 : 8,
      points: [{ x: coords.x, y: coords.y }]
    };

    this.ctx.beginPath();
    this.ctx.arc(coords.x, coords.y, (this.isTouchDevice ? 10 : 8) / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.selectedColor;
    this.ctx.fill();
  }

  draw(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    e.stopPropagation();

    const coords = this.getCoords(e);

    this.ctx.beginPath();
    this.ctx.strokeStyle = this.selectedColor;

    const midX = (this.lastX + coords.x) / 2;
    const midY = (this.lastY + coords.y) / 2;

    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.quadraticCurveTo(this.lastX, this.lastY, midX, midY);
    this.ctx.stroke();

    this.currentPath.points.push({ x: coords.x, y: coords.y });

    this.lastX = coords.x;
    this.lastY = coords.y;
  }

  stopDrawing() {
    if (this.isDrawing && this.currentPath && this.currentPath.points.length > 0) {
      this.paths.push(this.currentPath);
      this.currentPath = null;
    }
    this.isDrawing = false;
  }

  getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width / (window.devicePixelRatio || 1);
    const scaleY = this.canvas.height / rect.height / (window.devicePixelRatio || 1);

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  clearCanvas() {
    if (!this.ctx) return;
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.paths = [];
    this.currentPath = null;
  }

  saveDrawing() {
    if (!this.canvas) return;

    // Track drawing creation
    if (this.progressManager) {
      this.progressManager.markDrawingCreated();
    }

    const dataUrl = this.canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = 'what-nature-says-to-me.png';
    link.href = dataUrl;
    link.click();

    // Show feedback
    this.showBadgeNotification({
      icon: '🎨',
      name: 'Drawing Saved!',
      description: 'Your artwork has been downloaded'
    });
  }

  // ==================== COLOR PICKER ====================

  initColorPicker() {
    const container = document.getElementById('colorPicker');
    if (!container) return;

    this.drawingColors.forEach((color, index) => {
      const btn = document.createElement('button');
      btn.className = 'btn-icon';
      btn.style.backgroundColor = color.value;
      btn.style.border = index === 0 ? '3px solid var(--text-primary)' : '3px solid transparent';
      btn.setAttribute('aria-label', `Select ${color.name} color`);

      btn.addEventListener('click', () => {
        this.selectedColor = color.value;
        if (this.ctx) {
          this.ctx.strokeStyle = color.value;
        }

        container.querySelectorAll('button').forEach(b => {
          b.style.border = '3px solid transparent';
        });
        btn.style.border = '3px solid var(--text-primary)';
      });

      container.appendChild(btn);
    });
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new NatureSaysApp();
});

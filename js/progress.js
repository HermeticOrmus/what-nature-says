/**
 * What Nature Says - Progress & Rewards Module
 * Tracks completion and awards stars/badges
 */

class ProgressManager {
  constructor() {
    this.storageKey = 'nature-says-progress';
    this.progress = this.loadProgress();

    // Callbacks
    this.onStarEarned = null;
    this.onBadgeEarned = null;
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load progress:', e);
    }

    // Default progress
    return {
      elementsViewed: [],      // IDs of elements visited
      elementsCompleted: [],   // IDs of elements fully read
      starsEarned: 0,
      badges: [],              // Earned badge IDs
      totalReadings: 0,        // How many times book was finished
      drawingsCreated: 0,
      firstVisit: Date.now(),
      lastVisit: Date.now()
    };
  }

  saveProgress() {
    try {
      this.progress.lastVisit = Date.now();
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Could not save progress:', e);
    }
  }

  // ==================== ELEMENT TRACKING ====================

  // Mark element as viewed (visited but not necessarily completed)
  markElementViewed(elementId) {
    if (!this.progress.elementsViewed.includes(elementId)) {
      this.progress.elementsViewed.push(elementId);
      this.saveProgress();
    }
  }

  // Mark element as completed (fully read/interacted)
  markElementCompleted(elementId) {
    this.markElementViewed(elementId);

    if (!this.progress.elementsCompleted.includes(elementId)) {
      this.progress.elementsCompleted.push(elementId);

      // Award a star
      this.awardStar(elementId);

      this.saveProgress();

      // Check for badges
      this.checkBadges();
    }
  }

  isElementCompleted(elementId) {
    return this.progress.elementsCompleted.includes(elementId);
  }

  getCompletedCount() {
    return this.progress.elementsCompleted.length;
  }

  // ==================== STARS ====================

  awardStar(elementId) {
    this.progress.starsEarned++;

    if (this.onStarEarned) {
      this.onStarEarned(elementId, this.progress.starsEarned);
    }
  }

  getStars() {
    return this.progress.starsEarned;
  }

  // ==================== BADGES ====================

  // Badge definitions
  static BADGES = {
    'first-element': {
      id: 'first-element',
      name: 'First Listen',
      description: 'Read your first nature element',
      icon: '👂',
      condition: (progress) => progress.elementsCompleted.length >= 1
    },
    'halfway': {
      id: 'halfway',
      name: 'Nature Explorer',
      description: 'Discovered half of all elements',
      icon: '🔍',
      condition: (progress) => progress.elementsCompleted.length >= 6
    },
    'all-elements': {
      id: 'all-elements',
      name: 'Nature Listener',
      description: 'Heard what all of nature says',
      icon: '🌟',
      condition: (progress) => progress.elementsCompleted.length >= 12
    },
    'first-drawing': {
      id: 'first-drawing',
      name: 'Young Artist',
      description: 'Created your first drawing',
      icon: '🎨',
      condition: (progress) => progress.drawingsCreated >= 1
    },
    'return-reader': {
      id: 'return-reader',
      name: 'Return Reader',
      description: 'Finished the book twice',
      icon: '📚',
      condition: (progress) => progress.totalReadings >= 2
    },
    'super-reader': {
      id: 'super-reader',
      name: 'Super Reader',
      description: 'Finished the book five times',
      icon: '⭐',
      condition: (progress) => progress.totalReadings >= 5
    }
  };

  checkBadges() {
    const newBadges = [];

    for (const [id, badge] of Object.entries(ProgressManager.BADGES)) {
      if (!this.progress.badges.includes(id) && badge.condition(this.progress)) {
        this.progress.badges.push(id);
        newBadges.push(badge);
      }
    }

    if (newBadges.length > 0) {
      this.saveProgress();

      // Notify for each new badge
      newBadges.forEach(badge => {
        if (this.onBadgeEarned) {
          this.onBadgeEarned(badge);
        }
      });
    }

    return newBadges;
  }

  getBadges() {
    return this.progress.badges.map(id => ProgressManager.BADGES[id]).filter(Boolean);
  }

  hasBadge(badgeId) {
    return this.progress.badges.includes(badgeId);
  }

  // ==================== BOOK COMPLETION ====================

  markBookFinished() {
    this.progress.totalReadings++;
    this.saveProgress();
    this.checkBadges();
  }

  markDrawingCreated() {
    this.progress.drawingsCreated++;
    this.saveProgress();
    this.checkBadges();
  }

  // ==================== RESET ====================

  resetProgress() {
    this.progress = {
      elementsViewed: [],
      elementsCompleted: [],
      starsEarned: 0,
      badges: [],
      totalReadings: 0,
      drawingsCreated: 0,
      firstVisit: this.progress.firstVisit,
      lastVisit: Date.now()
    };
    this.saveProgress();
  }
}

// Export for use in main app
window.ProgressManager = ProgressManager;

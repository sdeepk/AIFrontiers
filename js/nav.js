(function () {
  function getCurrentFilename() {
    var path = location.pathname.replace(/\\/g, '/');
    var parts = path.split('/');
    return parts[parts.length - 1];
  }

  function isIndexPage() {
    var filename = getCurrentFilename();
    return filename === 'index.html' || filename === '' || filename.indexOf('slide-') !== 0;
  }

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  function init() {
    if (typeof SLIDE_MANIFEST === 'undefined') return;
    var slides = SLIDE_MANIFEST.slides;
    if (!slides) return;

    if (isIndexPage()) {
      setupIndexNav(slides);
    } else {
      setupSlideNav(slides);
    }
  }

  function setupSlideNav(slides) {
    var currentFile = getCurrentFilename();
    var currentIndex = -1;

    for (var i = 0; i < slides.length; i++) {
      if (slides[i].file === currentFile) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex === -1) return;

    var total = slides.length;
    var slideNum = currentIndex + 1;

    // Update counter
    var counter = document.querySelector('.nav-counter');
    if (counter) counter.textContent = pad(slideNum) + ' / ' + pad(total);

    // Apply part color class to body
    var part = slides[currentIndex].part;
    document.body.classList.add(part);

    // Update part label
    var partLabel = document.querySelector('.nav-part-label');
    if (partLabel) {
      if (part === 'opening') partLabel.textContent = 'Opening';
      else if (part === 'part-1') partLabel.textContent = 'Part 1';
      else if (part === 'part-2') partLabel.textContent = 'Part 2';
      else if (part === 'part-3') partLabel.textContent = 'Part 3';
      else if (part === 'part-4') partLabel.textContent = 'Part 4';
    }

    // Update prev link
    var prevBtn = document.querySelector('.nav-prev');
    if (prevBtn) {
      if (currentIndex > 0) {
        prevBtn.href = slides[currentIndex - 1].file;
      } else {
        prevBtn.classList.add('disabled');
      }
    }

    // Update next link
    var nextBtn = document.querySelector('.nav-next');
    if (nextBtn) {
      if (currentIndex < total - 1) {
        nextBtn.href = slides[currentIndex + 1].file;
      } else {
        nextBtn.classList.add('disabled');
      }
    }

    // Section jump dropdown
    var sectionJump = document.querySelector('.nav-section-jump');
    if (sectionJump && SLIDE_MANIFEST.sections) {
      var sectionOrder = [];
      var sectionFirstSlide = {};
      for (var j = 0; j < slides.length; j++) {
        var sec = slides[j].section;
        if (!sectionFirstSlide[sec]) {
          sectionFirstSlide[sec] = slides[j].file;
          sectionOrder.push(sec);
        }
      }

      var partGroups = SLIDE_MANIFEST.parts || {};
      var currentGroup = null;
      var optgroup = null;

      sectionOrder.forEach(function (sec) {
        // Find the part for this section
        var partKey = null;
        for (var k = 0; k < slides.length; k++) {
          if (slides[k].section === sec) { partKey = slides[k].part; break; }
        }

        if (partKey !== currentGroup) {
          currentGroup = partKey;
          optgroup = document.createElement('optgroup');
          optgroup.label = partGroups[partKey] || partKey;
          sectionJump.appendChild(optgroup);
        }

        var opt = document.createElement('option');
        opt.value = sectionFirstSlide[sec];
        opt.textContent = sec === 'opening' ? 'Opening' : sec + ' ' + (SLIDE_MANIFEST.sections[sec] || '');
        if (sec === slides[currentIndex].section) {
          opt.selected = true;
        }
        optgroup.appendChild(opt);
      });

      sectionJump.addEventListener('change', function () {
        if (this.value) {
          window.location.href = this.value;
        }
      });
    }

    // Update divider part-number from manifest
    var partNumberEl = document.querySelector('.part-number');
    if (partNumberEl && SLIDE_MANIFEST.parts) {
      var fullPartName = SLIDE_MANIFEST.parts[part];
      if (fullPartName) partNumberEl.textContent = fullPartName;
    }

    // Breadcrumb
    var breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
      var current = slides[currentIndex];
      var partName = (SLIDE_MANIFEST.parts && SLIDE_MANIFEST.parts[current.part]) || '';
      var sectionName = (SLIDE_MANIFEST.sections && SLIDE_MANIFEST.sections[current.section]) || '';

      var left = '<span class="breadcrumb-section">' + partName;
      if (sectionName && current.section !== 'opening') {
        left += ' <span class="breadcrumb-separator">›</span> ' + current.section + ' ' + sectionName;
      }
      left += '</span>';

      var right = '';
      if (currentIndex < total - 1) {
        right = '<span class="breadcrumb-upcoming">Up next: ' + slides[currentIndex + 1].title + '</span>';
      }

      breadcrumb.innerHTML = left + right;
    }

    // Speaker notes panel
    var notesSource = document.querySelector('speaker-notes');
    var notesPanel = document.querySelector('.speaker-notes-panel');
    if (notesPanel) {
      var notesText = notesSource ? notesSource.textContent.trim() : '';
      notesPanel.innerHTML =
        '<div class="speaker-notes-header"><span>Insights</span><span>Press S to toggle</span></div>' +
        '<div class="speaker-notes-body">' + (notesText || 'No insights for this slide.') + '</div>';
    }

    // Restore speaker notes visibility from localStorage
    if (localStorage.getItem('notesVisible') === 'true') {
      document.body.classList.add('notes-visible');
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (e.key === 's' || e.key === 'S') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        e.preventDefault();
        document.body.classList.toggle('notes-visible');
        localStorage.setItem('notesVisible', document.body.classList.contains('notes-visible'));
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < total - 1) {
          window.location.href = slides[currentIndex + 1].file;
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          window.location.href = slides[currentIndex - 1].file;
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        window.location.href = '../index.html';
      }
    });

    // Touch swipe support
    var touchStartX = 0;
    document.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    });
    document.addEventListener('touchend', function (e) {
      var diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0 && currentIndex < total - 1) {
          window.location.href = slides[currentIndex + 1].file;
        } else if (diff > 0 && currentIndex > 0) {
          window.location.href = slides[currentIndex - 1].file;
        }
      }
    });
  }

  function setupIndexNav(slides) {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var parts = SLIDE_MANIFEST.parts || {};
    var sections = SLIDE_MANIFEST.sections || {};

    // Group slides: part → section → slides[]
    var structure = [];
    var currentPart = null;
    var currentSection = null;
    var partObj, sectionObj;

    slides.forEach(function (slide, i) {
      if (slide.file.indexOf('slide-divider-') === 0) return;

      if (slide.part !== currentPart) {
        currentPart = slide.part;
        currentSection = null;
        partObj = { part: slide.part, name: parts[slide.part] || slide.part, sections: [] };
        structure.push(partObj);
      }
      if (slide.section !== currentSection) {
        currentSection = slide.section;
        sectionObj = { section: slide.section, name: sections[slide.section] || '', slides: [] };
        partObj.sections.push(sectionObj);
      }
      sectionObj.slides.push({ file: slide.file, title: slide.title, index: i });
    });

    // Render
    toc.innerHTML = '';
    structure.forEach(function (part) {
      var partDiv = document.createElement('div');
      partDiv.className = 'toc-part ' + part.part;

      var partHeader = document.createElement('h2');
      partHeader.className = 'toc-part-header';
      partHeader.textContent = part.name;
      partDiv.appendChild(partHeader);

      part.sections.forEach(function (sec) {
        var secDiv = document.createElement('div');
        secDiv.className = 'toc-section';

        var secHeader = document.createElement('a');
        secHeader.className = 'toc-section-header';
        secHeader.href = 'slides/' + sec.slides[0].file;
        secHeader.textContent = sec.section === 'opening' ? sec.name : sec.section + ' ' + sec.name;
        secDiv.appendChild(secHeader);

        var slideList = document.createElement('div');
        slideList.className = 'toc-slide-list';
        sec.slides.forEach(function (s) {
          var link = document.createElement('a');
          link.href = 'slides/' + s.file;
          link.className = 'toc-slide-link';
          link.innerHTML =
            '<span class="toc-slide-title">' + s.title + '</span>' +
            '<span class="toc-dots"></span>' +
            '<span class="toc-page">' + pad(s.index + 1) + '</span>';
          slideList.appendChild(link);
        });
        secDiv.appendChild(slideList);
        partDiv.appendChild(secDiv);
      });

      toc.appendChild(partDiv);
    });

    // Search filter
    var searchBar = document.querySelector('.search-bar');
    if (searchBar) {
      searchBar.addEventListener('input', function () {
        var query = this.value.toLowerCase();
        var secs = document.querySelectorAll('.toc-section');
        secs.forEach(function (sec) {
          var text = sec.textContent.toLowerCase();
          sec.style.display = text.indexOf(query) !== -1 ? '' : 'none';
        });
        var tocParts = document.querySelectorAll('.toc-part');
        tocParts.forEach(function (p) {
          var visible = p.querySelectorAll('.toc-section:not([style*="display: none"])');
          p.style.display = visible.length > 0 ? '' : 'none';
        });
      });
    }

    // Arrow right goes to first slide
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (slides.length > 0) {
          window.location.href = 'slides/' + slides[0].file;
        }
      }
    });
  }

  init();
})();

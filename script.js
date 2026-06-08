// ============================================
// APP STATE & CONFIGURATION
// ============================================
const AppState = {
    selectedDrug: 'heparin',
    infusionMethod: 'syringe',
    solutionVolume: 50,
    ampouleCount: 2,
    desiredDose: '',
    patientWeight: '',
    useWeight: false,
    currentAmpouleIndex: 0,
    theme: 'light',
    currentTab: 'calculator',
    calculationsToday: 0,
    customVolume: false,
    pwaInstallPrompt: null,
    settings: {
        darkMode: false,
        largeFont: false,
        doseAlerts: true,
        compatAlerts: true,
        saveHistory: true,
        hapticFeedback: true,
        colorTheme: 'fox'
    },
    reverseMode: false
};

// ============================================
// LOADING SCREEN
// ============================================
(function setupLoadingScreen() {
    const steps = [
        { status: 'در حال بارگذاری پایگاه داده دارویی...', pct: 20 },
        { status: 'در حال راه‌اندازی ماشین حساب...', pct: 50 },
        { status: 'در حال اعمال تنظیمات...', pct: 75 },
        { status: 'آماده است!', pct: 100 }
    ];

    let tipIndex = 0;
    function rotateTip() {
        const tips = document.querySelectorAll('.loading-tip');
        if (!tips.length) return;
        tips[tipIndex % tips.length].classList.remove('active');
        tipIndex = (tipIndex + 1) % tips.length;
        tips[tipIndex].classList.add('active');
    }

    window.loadingProgress = function(pct, status) {
        const bar    = document.getElementById('loadingBar');
        const stat   = document.getElementById('loadingStatus');
        if (bar)  bar.style.width  = pct + '%';
        if (stat) stat.textContent = status;
    };

    window.hideLoadingScreen = function() {
        const screen = document.getElementById('loadingScreen');
        if (!screen) return;
        screen.classList.add('fade-out');
        setTimeout(() => { screen.style.display = 'none'; }, 550);
    };

    document.addEventListener('DOMContentLoaded', () => {
        const tipInterval = setInterval(rotateTip, 1800);
        let i = 0;
        function runStep() {
            if (i >= steps.length) {
                clearInterval(tipInterval);
                setTimeout(window.hideLoadingScreen, 300);
                return;
            }
            loadingProgress(steps[i].pct, steps[i].status);
            i++;
            setTimeout(runStep, i === steps.length ? 400 : 600);
        }
        setTimeout(runStep, 300);
    });
})();

// ============================================
// PWA INSTALL MODAL
// ============================================
(function setupPWAModal() {
    let deferredPrompt = null;

    function isIOS() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    }
    function isInStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }
    function shouldShow() {
        if (isInStandaloneMode()) return false;
        if (localStorage.getItem('pwaNeverShow') === 'true') return false;
        const remind = localStorage.getItem('pwaRemindAfter');
        if (remind && Date.now() < parseInt(remind)) return false;
        return true;
    }
    function showModal() {
        if (!shouldShow()) return;
        const modal = document.getElementById('pwaModal');
        if (!modal) return;
        const androidNative = document.getElementById('pwaAndroidNative');
        const iosGuide      = document.getElementById('pwaIOSGuide');
        const genericGuide  = document.getElementById('pwaGenericGuide');
        if (deferredPrompt) {
            androidNative.style.display = 'block';
            iosGuide.style.display = 'none';
            genericGuide.style.display = 'none';
        } else if (isIOS()) {
            androidNative.style.display = 'none';
            iosGuide.style.display = 'block';
            genericGuide.style.display = 'none';
        } else {
            androidNative.style.display = 'none';
            iosGuide.style.display = 'none';
            genericGuide.style.display = 'block';
        }
        modal.style.display = 'flex';
    }
    function hideModal() {
        const modal = document.getElementById('pwaModal');
        if (modal) modal.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        AppState.pwaInstallPrompt = e;
    });

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => { if (shouldShow()) showModal(); }, 3500);

        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            hideModal();
            if (outcome === 'accepted') localStorage.setItem('pwaNeverShow', 'true');
        });

        const laterBtn = document.getElementById('pwaLaterBtn');
        if (laterBtn) laterBtn.addEventListener('click', () => {
            hideModal();
            localStorage.setItem('pwaRemindAfter', Date.now() + 172800000);
        });

        const neverBtn = document.getElementById('pwaNeverBtn');
        if (neverBtn) neverBtn.addEventListener('click', () => {
            hideModal();
            localStorage.setItem('pwaNeverShow', 'true');
        });

        const closeBtn = document.getElementById('pwaModalClose');
        if (closeBtn) closeBtn.addEventListener('click', hideModal);

        const overlay = document.getElementById('pwaModalOverlay');
        if (overlay) overlay.addEventListener('click', hideModal);
    });

    window.addEventListener('appinstalled', () => {
        hideModal();
        localStorage.setItem('pwaNeverShow', 'true');
    });
})();

// ============================================
// BIDIRECTIONAL TEXT SUPPORT
// ============================================
const TextDirection = {
    wrapLatin: function(text) {
        if (!text) return '';
        const hasLatin = /[A-Za-z0-9]/.test(text);
        if (hasLatin) return `\u202B${text}\u202C`;
        return text;
    },
    wrapPersian: function(text) {
        if (!text) return '';
        const hasRTL = /[\u0600-\u06FF]/.test(text);
        if (hasRTL) return `\u202B${text}\u202C`;
        return text;
    },
    fixMixedText: function(text) {
        if (!text) return '';
        const segments = this.splitByLanguage(text);
        return segments.map(segment => {
            if (segment.isLatin) return this.wrapLatin(segment.text);
            return segment.text;
        }).join('');
    },
    splitByLanguage: function(text) {
        const segments = [];
        let currentSegment = '';
        let currentIsLatin = null;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const isLatin = /[A-Za-z0-9.,\/;:!?@#$%^&*()_+\-=\[\]{}'"\\|<>]/.test(char);
            if (currentIsLatin !== isLatin && currentSegment !== '') {
                segments.push({ text: currentSegment, isLatin: currentIsLatin });
                currentSegment = '';
            }
            currentSegment += char;
            currentIsLatin = isLatin;
        }
        if (currentSegment !== '') segments.push({ text: currentSegment, isLatin: currentIsLatin });
        return segments;
    },
    formatDrugInfo: function(persian, latin) {
        if (!latin) return persian;
        if (!persian) return this.wrapLatin(latin);
        return `${persian}\u200F \u200E${this.wrapLatin(latin)}\u200F`;
    },
    createBilingualLabel: function(persianLabel, latinValue) {
        return `${persianLabel}:\u200F \u200E${this.wrapLatin(latinValue)}`;
    },
    applyBidiFixes: function() {
        document.querySelectorAll('.text-mixed, .text-latin, .drug-name-english').forEach(el => {
            el.style.unicodeBidi = 'isolate';
            el.style.direction = 'ltr';
        });
        document.querySelectorAll('.persian-text, .drug-name-compact, .selected-drug-name-compact').forEach(el => {
            el.style.unicodeBidi = 'isolate';
            el.style.direction = 'rtl';
        });
        document.querySelectorAll('input[type="number"], input[type="text"]').forEach(input => {
            input.style.unicodeBidi = 'plaintext';
        });
    }
};

// ============================================
// PERSIAN NUMBER SUPPORT
// ============================================
const PersianNumbers = {
    persianToLatin: {
        '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
        '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
        '٫':'.','٬':',','،':',','−':'-','–':'-','—':'-'
    },
    latinToPersian: {
        '0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹',
        '.':'٫',',':'٬'
    },
    toLatin: function(text) {
        if (!text) return '';
        return text.toString().split('').map(char => this.persianToLatin[char] || char).join('');
    },
    toPersian: function(text) {
        if (!text) return '';
        return text.toString().split('').map(char => this.latinToPersian[char] || char).join('');
    },
    parseNumber: function(text) {
        if (!text || text.toString().trim() === '') return NaN;
        let s = this.toLatin(text.toString()).trim();
        s = s.replace(/\s+/g, '');
        if (s.includes('.')) {
            s = s.replace(/,/g, '');
        } else if (s.includes(',')) {
            const thousandsPattern = /^-?\d{1,3}(,\d{3})+$/;
            if (thousandsPattern.test(s)) {
                s = s.replace(/,/g, '');
            } else {
                s = s.replace(',', '.');
                s = s.replace(/,/g, '');
            }
        }
        return parseFloat(s);
    },
    formatNumber: function(number, decimals = 2) {
        if (!Number.isFinite(number)) return '0';
        const d = parseInt(decimals, 10);
        const usedDecimals = Number.isFinite(d) ? d : 2;
        return number.toFixed(usedDecimals);
    },
    formatMixedText: function(text) {
        if (!text) return '';
        let formatted = this.toLatin(text.toString());
        formatted = TextDirection.fixMixedText(formatted);
        formatted = formatted.replace(/([A-Za-z][A-Za-z0-9\s.,\/;:!?@#$%^&*()_+\-=\[\]{}'"\\|<>]+)/g,
            match => `\u202B${match}\u202C`);
        return formatted;
    },
    parseMixed: function(text) {
        if (!text) return 0;
        let latinText = this.toLatin(text.toString());
        latinText = latinText.replace(/[^\d.\-]/g, '');
        return parseFloat(latinText) || 0;
    },
    bilingual: function(persian, latin, showBoth = true) {
        if (!showBoth || !latin) return persian;
        return `${persian}\u200F \u200E(${latin})\u200F`;
    }
};

// ============================================
// SIMPLE INPUT HANDLING
// ============================================
function renderDrugIcon(iconStr, extraStyle) {
    if (!iconStr) return '<i class="fas fa-pills"></i>';
    return `<i class="${iconStr}"${extraStyle ? ' style="' + extraStyle + '"' : ''}></i>`;
}

function setupSimpleInputHandling() {
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], textarea').forEach(input => {
        input.style.textAlign = 'center';
    });
    const style = document.createElement('style');
    style.textContent = `::placeholder { text-align: center !important; } input::placeholder { text-align: center !important; }`;
    document.head.appendChild(style);

    document.querySelectorAll('input[type="number"], input[type="text"].numeric-input').forEach(input => {
        input.addEventListener('focus', function() { this.select(); });
        input.addEventListener('click', function() { this.select(); });
    });

    const calculatorInputs = [DOM.doctorOrder, DOM.patientWeight, DOM.customVolume];
    calculatorInputs.forEach(input => {
        if (!input) return;
        input.addEventListener('focus', function() { this.select(); });
        input.addEventListener('click', function() { this.select(); });
        input.addEventListener('input', function() {
            const before = this.value || '';
            const normalized = PersianNumbers.toLatin(before);
            if (normalized !== before) {
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = normalized;
                if (start != null && end != null) this.setSelectionRange(start, end);
            }
            const numValue = PersianNumbers.parseNumber(this.value);
            if (!isNaN(numValue)) this.dataset.numericValue = numValue;
            clearResults();
        });
        input.addEventListener('blur', function() {
            if (this.value && this.value.trim() !== '') {
                try {
                    const numValue = PersianNumbers.parseNumber(this.value);
                    if (!isNaN(numValue)) {
                        this.dataset.numericValue = numValue;
                        const decimalsAttr = this.getAttribute('data-decimals');
                        const decimals = decimalsAttr == null ? 2 : parseInt(decimalsAttr, 10);
                        const latinValue = PersianNumbers.formatNumber(numValue, Number.isFinite(decimals) ? decimals : 2);
                        if (this.value !== latinValue) this.value = latinValue;
                    }
                } catch (e) { /* keep original */ }
            }
        });
    });
}

// ============================================
// MOBILE NUMERIC KEYBOARD
// ============================================
function setupMobileNumericKeyboard() {
    document.querySelectorAll('input').forEach(input => {
        const type = input.type;
        const name = input.name || input.id || '';
        const isNumericField = type === 'number' || name.includes('dose') || name.includes('weight') ||
            name.includes('volume') || name.includes('count') || name.includes('value') ||
            name.includes('amount') || input.classList.contains('numeric-input') ||
            input.getAttribute('data-numeric') === 'true';

        if (isNumericField) {
            if (input.getAttribute('step') === '1' || name.includes('count') || name.includes('age') || name.includes('ampoule')) {
                input.setAttribute('inputmode', 'numeric');
                input.setAttribute('pattern', '[0-9]*');
            } else {
                input.setAttribute('inputmode', 'decimal');
                input.setAttribute('pattern', '[0-9]*[.,]?[0-9]*');
            }
            input.classList.add('numeric-keyboard');
            input.style.textAlign = 'center';
            input.addEventListener('input', function() {
                const before = this.value || '';
                const normalized = PersianNumbers.toLatin(before);
                if (normalized !== before) {
                    const start = this.selectionStart;
                    const end = this.selectionEnd;
                    this.value = normalized;
                    if (start != null && end != null) this.setSelectionRange(start, end);
                }
                const numValue = PersianNumbers.parseNumber(this.value);
                if (!isNaN(numValue)) this.dataset.numericValue = numValue;
            });
        }
    });
}

// ============================================
// HAPTIC FEEDBACK
// ============================================
function haptic(ms) {
    if (!AppState.settings.hapticFeedback) return;
    try { if (navigator.vibrate) navigator.vibrate(ms || 30); } catch(e) {}
}

// ============================================
// DOM ELEMENTS
// ============================================
const DOM = {
    themeToggle: document.getElementById('themeToggle'),
    historyBtn: document.getElementById('historyBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    drugGrid: document.getElementById('drugGrid'),
    drugSearch: document.getElementById('drugSearch'),
    selectedDrugIcon: document.getElementById('selectedDrugIcon'),
    selectedDrugName: document.getElementById('selectedDrugName'),
    selectedDrugDesc: document.getElementById('selectedDrugDesc'),
    methodBtns: document.querySelectorAll('.method-btn-compact'),
    volumeOptions: document.getElementById('volumeOptions'),
    customVolume: document.getElementById('customVolume'),
    customVolumeContainer: document.getElementById('customVolumeContainer'),
    ampouleCount: document.getElementById('ampouleCount'),
    decreaseAmpoule: document.getElementById('decreaseAmpoule'),
    increaseAmpoule: document.getElementById('increaseAmpoule'),
    ampouleInfo: document.getElementById('ampouleInfo'),
    doctorOrder: document.getElementById('doctorOrder'),
    weightContainer: document.getElementById('weightContainer'),
    weightCheckbox: document.getElementById('weightCheckbox'),
    patientWeight: document.getElementById('patientWeight'),
    weightIosToggle: document.getElementById('weightIosToggle'),
    weightInputRow: document.getElementById('weightInputRow'),
    calculateBtn: document.getElementById('calculateBtn'),
    calculateBtnWrap: document.getElementById('calculateBtnWrap'),
    resultsSection: document.getElementById('resultsSection'),
    totalDrugAmount: document.getElementById('totalDrugAmount'),
    totalDrugUnit: document.getElementById('totalDrugUnit'),
    concentrationResult: document.getElementById('concentrationResult'),
    concentrationUnit: document.getElementById('concentrationUnit'),
    pumpRateResult: document.getElementById('pumpRateResult'),
    pumpRateUnit: document.getElementById('pumpRateUnit'),
    durationResult: document.getElementById('durationResult'),
    durationUnit: document.getElementById('durationUnit'),
    guideSection: document.getElementById('guideSection'),
    stepByStepGuide: document.getElementById('stepByStepGuide'),
    warningsSection: document.getElementById('warningsSection'),
    warningsList: document.getElementById('warningsList'),
    compatibilitySection: document.getElementById('compatibilitySection'),
    compatibleDrugsList: document.getElementById('compatibleDrugsList'),
    incompatibleDrugsList: document.getElementById('incompatibleDrugsList'),
    settingsModal: document.getElementById('settingsModal'),
    historyModal: document.getElementById('historyModal'),
    closeSettings: document.getElementById('closeSettings'),
    closeHistory: document.getElementById('closeHistory'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    largeFontToggle: document.getElementById('largeFontToggle'),
    doseAlertToggle: document.getElementById('doseAlertToggle'),
    compatAlertToggle: document.getElementById('compatAlertToggle'),
    saveHistoryToggle: document.getElementById('saveHistoryToggle'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    checkUpdateBtn: document.getElementById('checkUpdateBtn'),
    drugCount: document.getElementById('drugCount'),
    lastUpdate: document.getElementById('lastUpdate'),
    historyList: document.getElementById('historyList'),
    tabItems: document.querySelectorAll('.tab-item'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    librarySearch: document.getElementById('librarySearch'),
    openManualBtn: document.getElementById('openManual'),
    manualSection: document.getElementById('manualSection'),
    calculatorControls: document.getElementById('calculatorControls'),
    hapticToggle: document.getElementById('hapticToggle'),
    reverseCalcBtn: document.querySelector('.reverse-toggle-row'),
    reverseIosToggle: document.getElementById('reverseIosToggle'),
    reverseTooltip: document.getElementById('reverseTooltip'),
    doseRangeIndicator: document.getElementById('doseRangeIndicator'),
    doseRangeDot: document.getElementById('doseRangeDot'),
    doseRangeText: document.getElementById('doseRangeText'),
    dripRateRow: document.getElementById('dripRateRow'),
    dripRateResult: document.getElementById('dripRateResult'),
    dripRateLabel: document.getElementById('dripRateLabel')
};

// ============================================
// MOBILE LAYOUT
// ============================================
function setupMobileLayout() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        fixTabVisibility();
        positionManualButtonInDrugGrid();
        fixDrugSidebar();
        ensureContentVisibility();
        if (DOM.calculatorControls) DOM.calculatorControls.style.display = 'grid';
        if (DOM.openManualBtn) DOM.openManualBtn.style.display = 'none';
        removeFloatingBars();
        setupMobileSearch();
        setupTouchFeedback();
        fixMethodButtonTextColor();
        TextDirection.applyBidiFixes();
        setupMobileNumericKeyboard();
        if (DOM.calculateBtnWrap) {
            DOM.calculateBtnWrap.style.position = 'sticky';
            DOM.calculateBtnWrap.style.bottom = '0';
            DOM.calculateBtnWrap.style.marginTop = 'auto';
        }
    } else {
        resetDesktopLayout();
    }
}

function clearMobileLayoutIssues() {}

function fixTabVisibility() {
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (!pane.classList.contains('active')) {
            pane.style.display = 'none';
        }
    });
    const activePane = document.querySelector('.tab-pane.active');
    if (activePane) activePane.style.display = 'block';
}

function fixDrugSidebar() {
    const drugSidebar = document.querySelector('.drug-sidebar');
    if (drugSidebar) drugSidebar.removeAttribute('style');
    const drugQuickSelect = document.querySelector('.drug-quick-select');
    if (drugQuickSelect) drugQuickSelect.removeAttribute('style');
    const drugScroll = document.querySelector('.drug-scroll-container');
    if (drugScroll) drugScroll.removeAttribute('style');
}

function removeFloatingBars() {
    const elementsToHide = [
        '.quick-actions-enhanced', '.quick-actions', '.action-btn-enhanced', '.action-btn',
        '.floating-bar', '.bottom-action-bar', '.overlay-bar', '#floatingBar', '#bottomBar'
    ];
    elementsToHide.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.position = 'absolute';
            el.style.zIndex = '-100';
        });
    });
}

function ensureContentVisibility() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.removeAttribute('style');
    const calculatorTab = document.getElementById('calculatorTab');
    if (calculatorTab) calculatorTab.removeAttribute('style');
    const calculatorLayout = document.querySelector('.calculator-layout');
    if (calculatorLayout) calculatorLayout.removeAttribute('style');
    const calculatorMain = document.querySelector('.calculator-main');
    if (calculatorMain) {
        calculatorMain.style.overflowY = 'auto';
        calculatorMain.style.webkitOverflowScrolling = 'touch';
    }
}

function fixVolumeButtonColors() {
    document.querySelectorAll('.volume-preset-btn.active').forEach(btn => {
        btn.style.setProperty('color', 'white', 'important');
        btn.querySelectorAll('.number, .unit-text, .custom-text, span').forEach(el => {
            el.style.setProperty('color', 'white', 'important');
        });
    });
    document.querySelectorAll('.volume-preset-btn:not(.active)').forEach(btn => {
        btn.style.removeProperty('color');
        btn.querySelectorAll('.number, .unit-text, .custom-text, span').forEach(el => {
            el.style.removeProperty('color');
        });
    });
}

function fixMethodButtonTextColor() {
    document.querySelectorAll('.method-btn-compact').forEach(button => {
        if (button.classList.contains('active')) {
            button.style.color = 'white';
            const icon = button.querySelector('i');
            const text = button.querySelector('span');
            if (icon) icon.style.color = 'white';
            if (text) text.style.color = 'white';
        } else {
            button.style.removeProperty('color');
            const icon = button.querySelector('i');
            const text = button.querySelector('span');
            if (icon) icon.style.removeProperty('color');
            if (text) text.style.removeProperty('color');
        }
    });
    fixVolumeButtonColors();
}

function positionManualButtonInDrugGrid() {
    const drugGrid = DOM.drugGrid;
    if (!drugGrid) return;
    const existingBtn = document.getElementById('openManualMobile');
    if (existingBtn) existingBtn.remove();
    const mobileManualBtn = document.createElement('div');
    mobileManualBtn.id = 'openManualMobile';
    mobileManualBtn.className = 'drug-item-compact';
    mobileManualBtn.innerHTML = `
        <div class="drug-icon-small" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <i class="fas fa-edit" style="color: white;"></i>
        </div>
        <div class="drug-name-compact" style="font-size: 10px; font-weight: 700;">محاسبه دستی</div>
    `;
    drugGrid.appendChild(mobileManualBtn);
    mobileManualBtn.addEventListener('click', openManualCalculation);
    mobileManualBtn.addEventListener('touchstart', function() { this.style.transform = 'scale(0.95)'; }, { passive: true });
    mobileManualBtn.addEventListener('touchend', function() { this.style.transform = ''; }, { passive: true });
}

function setupMobileSearch() {
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const drugSearchContainer = document.querySelector('.drug-search-container');
    if (mobileSearchToggle && drugSearchContainer) {
        mobileSearchToggle.addEventListener('click', () => {
            drugSearchContainer.style.display = drugSearchContainer.style.display === 'none' ? 'block' : 'none';
        });
    }
}

function setupTouchFeedback() {
    document.querySelectorAll('button, .drug-item-compact, .tab-item').forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.97)';
            this.style.transition = 'transform 0.1s ease';
        }, { passive: true });
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        }, { passive: true });
    });
}

function resetDesktopLayout() {
    const mobileBtn = document.getElementById('openManualMobile');
    if (mobileBtn) mobileBtn.remove();
    if (DOM.openManualBtn) DOM.openManualBtn.style.display = 'flex';
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadDrugGrid();
    selectDrug('heparin');
    initCompatibilityDropdowns();
    loadDrugLibrary();
});

function initializeApp() {
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setVH();
    window.addEventListener('resize', setVH);
    if (window.loadingProgress) loadingProgress(20, 'در حال بارگذاری پایگاه داده دارویی...');
    loadSettings();
    loadTheme();
    updateStats();
    updateVolumeOptions();
    setupMobileLayout();
    setupMobileOptimizations();
    setupSimpleInputHandling();
    TextDirection.applyBidiFixes();
    setupMobileNumericKeyboard();
    initializeConverters();
    initializeTools();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => setupMobileLayout(), 150);
    });

    if (DOM.drugCount) DOM.drugCount.textContent = Object.keys(drugDatabase).length;
    if (DOM.lastUpdate) {
        const now = new Date();
        const persianDate = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        DOM.lastUpdate.textContent = PersianNumbers.toLatin(persianDate);
    }
    setupManualCalculation();
    setupOnboarding();
    setupOfflineIndicator();
    setupTabBarMeasurement();
    setupGCS();
    setupBurns();
    setupThemePicker();
    setupUpdateDetection();
}

function setupMobileOptimizations() {
    if (window.innerWidth <= 768) {
        document.addEventListener('touchstart', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                document.body.style.zoom = '100%';
            }
        }, { passive: true });
        const drugScroll = document.querySelector('.drug-scroll-container');
        if (drugScroll) {
            drugScroll.addEventListener('touchmove', function(e) { e.stopPropagation(); }, { passive: true });
        }
    }
}

// ============================================
// SETTINGS
// ============================================
function loadSettings() {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        AppState.settings = Object.assign({}, AppState.settings, parsed);
    }
    if (DOM.darkModeToggle) DOM.darkModeToggle.checked = AppState.settings.darkMode;
    if (DOM.largeFontToggle) DOM.largeFontToggle.checked = AppState.settings.largeFont;
    if (DOM.doseAlertToggle) DOM.doseAlertToggle.checked = AppState.settings.doseAlerts;
    if (DOM.compatAlertToggle) DOM.compatAlertToggle.checked = AppState.settings.compatAlerts;
    if (DOM.saveHistoryToggle) DOM.saveHistoryToggle.checked = AppState.settings.saveHistory;
    if (DOM.hapticToggle) DOM.hapticToggle.checked = AppState.settings.hapticFeedback !== false;
    applySettings();
}

function saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(AppState.settings));
}

function applySettings() {
    if (AppState.settings.darkMode) {
        document.body.classList.add('dark-mode');
        AppState.theme = 'dark';
        if (DOM.darkModeToggle) DOM.darkModeToggle.checked = true;
        if (DOM.themeToggle) {
            const icon = DOM.themeToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-sun';
        }
    } else {
        document.body.classList.remove('dark-mode');
        AppState.theme = 'light';
        if (DOM.darkModeToggle) DOM.darkModeToggle.checked = false;
        if (DOM.themeToggle) {
            const icon = DOM.themeToggle.querySelector('i');
            if (icon) icon.className = 'fas fa-moon';
        }
    }
    if (AppState.settings.largeFont) document.body.classList.add('large-font');
    else document.body.classList.remove('large-font');
    const savedColor = AppState.settings.colorTheme || 'default';
    applyTheme(savedColor);
    fixVolumeButtonColors();
}

// ============================================
// DRUG MANAGEMENT
// ============================================
function loadDrugGrid() {
    const container = DOM.drugGrid;
    if (!container) return;
    container.innerHTML = '';
    Object.entries(drugDatabase).forEach(([id, drug]) => {
        const card = document.createElement('div');
        card.className = 'drug-item-compact';
        card.dataset.drugId = id;
        card.innerHTML = `
            <div class="drug-icon-small">${renderDrugIcon(drug.icon)}</div>
            <div class="drug-name-compact">${drug.persianName}</div>
            <div class="drug-name-english">${drug.englishName}</div>
        `;
        card.addEventListener('click', () => selectDrug(id));
        container.appendChild(card);
    });
    setupMobileLayout();
}

function selectDrug(drugId) {
    if (!drugDatabase[drugId]) return;
    const drug = drugDatabase[drugId];
    AppState.selectedDrug = drugId;
    AppState.ampouleCount = drug.defaultAmpoules;
    AppState.currentAmpouleIndex = 0;

    DOM.selectedDrugName.textContent = drug.persianName;
    DOM.selectedDrugDesc.innerHTML = `
        <span class="persian-inline">${drug.persianName}</span>
        <span> - </span>
        <span class="latin-inline">${drug.englishName}</span>
        <span> (</span><span class="latin-inline">${drug.category}</span><span>)</span>
    `;
    DOM.selectedDrugIcon.innerHTML = renderDrugIcon(drug.icon, 'font-size:1.5rem;');
    DOM.selectedDrugIcon.style.background = `linear-gradient(135deg, ${drug.color}, ${drug.color}99)`;

    updateAmpouleTypeSelector(drug);
    updateAmpouleInfo();
    updateVolumeOptions();

    if (DOM.weightContainer && DOM.weightCheckbox && DOM.patientWeight) {
        if (drug.weightBased && drug.weightBased.active) {
            DOM.weightContainer.style.display = 'block';
            if (DOM.weightIosToggle) DOM.weightIosToggle.classList.remove('on');
            if (DOM.weightInputRow) DOM.weightInputRow.style.display = 'none';
            const defaultUseWeight = drug.weightBased.defaultUseWeight !== undefined ? drug.weightBased.defaultUseWeight : false;
            AppState.useWeight = defaultUseWeight;
            DOM.weightCheckbox.checked = defaultUseWeight;
            DOM.patientWeight.disabled = !defaultUseWeight;
            DOM.patientWeight.value = drug.weightBased.defaultWeight || '70';
            DOM.patientWeight.setAttribute('inputmode', 'decimal');
            DOM.patientWeight.style.textAlign = 'center';
            updateWeightBasedUnit(drug);
        } else {
            DOM.weightContainer.style.display = 'none';
            AppState.useWeight = false;
            DOM.weightCheckbox.checked = false;
            DOM.patientWeight.disabled = true;
            DOM.patientWeight.value = '';
            const unitElement = document.getElementById('orderUnit');
            if (unitElement) unitElement.textContent = drug.standardUnit;
        }
    }

    if (DOM.doctorOrder) {
        DOM.doctorOrder.setAttribute('inputmode', 'decimal');
        DOM.doctorOrder.style.textAlign = 'center';
        DOM.doctorOrder.value = '';
    }

    document.querySelectorAll('.drug-item-compact').forEach(card => card.classList.remove('selected'));
    const selectedCard = document.querySelector(`.drug-item-compact[data-drug-id="${drugId}"]`);
    if (selectedCard) selectedCard.classList.add('selected');

    clearResults();
    if (DOM.customVolumeContainer) {
        DOM.customVolumeContainer.style.display = 'none';
        DOM.customVolume.value = '';
    }
    AppState.customVolume = false;
}

function updateAmpouleTypeSelector(drug) {
    const container = document.getElementById('ampouleTypeButtons');
    if (!container) return;
    container.innerHTML = '';
    if (drug.ampouleOptions.length <= 1) {
        container.style.display = 'none';
        AppState.currentAmpouleIndex = 0;
        updateAmpouleInfo();
        return;
    }
    container.style.display = 'flex';
    drug.ampouleOptions.forEach((ampoule, index) => {
        const button = document.createElement('button');
        button.className = 'ampoule-type-btn';
        button.textContent = ampoule.label;
        button.dataset.index = index;
        if (index === AppState.currentAmpouleIndex) button.classList.add('active');
        button.addEventListener('click', () => {
            container.querySelectorAll('.ampoule-type-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            AppState.currentAmpouleIndex = index;
            updateAmpouleInfo();
            clearResults();
        });
        container.appendChild(button);
    });
}

function updateAmpouleInfo() {
    const drug = drugDatabase[AppState.selectedDrug];
    const ampoule = drug.ampouleOptions[AppState.currentAmpouleIndex];
    if (DOM.ampouleCount) DOM.ampouleCount.textContent = AppState.ampouleCount;
    if (DOM.ampouleInfo) {
        const labelParts = ampoule.label.split(' in ');
        if (labelParts.length === 2) {
            DOM.ampouleInfo.innerHTML = `<span>هر آمپول: </span><span class="latin-inline">${labelParts[0]}</span><span> در </span><span class="latin-inline">${labelParts[1]}</span>`;
        } else {
            DOM.ampouleInfo.innerHTML = `<span>هر آمپول: </span><span class="latin-inline">${ampoule.label}</span>`;
        }
    }
}

function updateVolumeOptions() {
    const drug = drugDatabase[AppState.selectedDrug];
    const method = AppState.infusionMethod;
    const volumes = drug.defaultSolutionVolumes[method];
    const defaultVol = drug.defaultVolume[method];
    if (!DOM.volumeOptions) return;
    DOM.volumeOptions.innerHTML = '';
    volumes.forEach(volume => {
        const btn = document.createElement('button');
        btn.className = 'volume-preset-btn';
        btn.innerHTML = `<span class="number">${volume}</span><span class="unit-text">cc</span>`;
        btn.dataset.volume = volume;
        if (volume === defaultVol) {
            btn.classList.add('active');
            AppState.solutionVolume = volume;
        }
        btn.addEventListener('click', () => {
            document.querySelectorAll('.volume-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.solutionVolume = volume;
            if (DOM.customVolumeContainer) { DOM.customVolumeContainer.style.display = 'none'; DOM.customVolume.value = ''; }
            AppState.customVolume = false;
            clearResults();
            fixVolumeButtonColors();
        });
        DOM.volumeOptions.appendChild(btn);
    });
    const customBtn = document.createElement('button');
    customBtn.className = 'volume-preset-btn';
    customBtn.innerHTML = '<span class="custom-text">سایر</span>';
    customBtn.addEventListener('click', () => {
        if (DOM.customVolumeContainer) {
            DOM.customVolumeContainer.style.display = 'flex';
            DOM.customVolume.focus();
            AppState.customVolume = true;
            document.querySelectorAll('.volume-preset-btn').forEach(b => b.classList.remove('active'));
            clearResults();
            fixVolumeButtonColors();
        }
    });
    DOM.volumeOptions.appendChild(customBtn);
    fixVolumeButtonColors();
}

// ============================================
// CALCULATION
// ============================================
function calculateInfusion() {
    const drug = drugDatabase[AppState.selectedDrug];
    const ampoule = drug.ampouleOptions[AppState.currentAmpouleIndex];

    let doseValue;
    if (DOM.doctorOrder.value && DOM.doctorOrder.value.trim() !== '') {
        doseValue = DOM.doctorOrder.dataset.numericValue
            ? parseFloat(DOM.doctorOrder.dataset.numericValue)
            : PersianNumbers.parseNumber(DOM.doctorOrder.value);
    }

    if (!doseValue || isNaN(doseValue) || doseValue <= 0) {
        showToast('خطا', 'لطفاً مقدار دوز درخواستی را وارد کنید', 'error');
        DOM.doctorOrder.focus();
        DOM.doctorOrder.style.borderColor = 'var(--danger)';
        return;
    }
    DOM.doctorOrder.style.borderColor = '';
    updateDoseRangeIndicator();

    let desiredDosePerHour;

    if (drug.weightBased && drug.weightBased.active && AppState.useWeight) {
        let weightValue;
        if (DOM.patientWeight.value && DOM.patientWeight.value.trim() !== '') {
            weightValue = DOM.patientWeight.dataset.numericValue
                ? parseFloat(DOM.patientWeight.dataset.numericValue)
                : PersianNumbers.parseNumber(DOM.patientWeight.value);
        }
        if (!weightValue || isNaN(weightValue) || weightValue <= 0) {
            showToast('خطا', 'لطفاً وزن بیمار را وارد کنید', 'error');
            DOM.patientWeight.focus();
            DOM.patientWeight.style.borderColor = 'var(--danger)';
            return;
        }
        DOM.patientWeight.style.borderColor = '';
        AppState.patientWeight = weightValue;
        switch(drug.id) {
            case 'dopamine': case 'norepinephrine': desiredDosePerHour = doseValue * weightValue * 60; break;
            case 'fentanyl': desiredDosePerHour = doseValue * weightValue; break;
            case 'midazolam': desiredDosePerHour = (doseValue * weightValue * 60) / 1000; break;
            default: desiredDosePerHour = doseValue * weightValue;
        }
    } else {
        AppState.patientWeight = null;
        switch(drug.id) {
            case 'dopamine': case 'norepinephrine': case 'tng': desiredDosePerHour = doseValue * 60; break;
            case 'amiodarone': desiredDosePerHour = doseValue * 60; break;
            default: desiredDosePerHour = doseValue;
        }
    }

    if (AppState.customVolume) {
        let customVol;
        if (DOM.customVolume.value && DOM.customVolume.value.trim() !== '') {
            customVol = DOM.customVolume.dataset.numericValue
                ? parseFloat(DOM.customVolume.dataset.numericValue)
                : PersianNumbers.parseNumber(DOM.customVolume.value);
        }
        if (!customVol || isNaN(customVol) || customVol <= 0) {
            showToast('خطا', 'حجم محلول وارد شده معتبر نیست', 'error');
            DOM.customVolume.focus();
            return;
        }
        AppState.solutionVolume = customVol;
    }

    AppState.desiredDose = doseValue;
    const totalDrug = AppState.ampouleCount * ampoule.strength;
    const concentration = totalDrug / AppState.solutionVolume;

    let totalDrugForCalculation = totalDrug;
    let concentrationForCalculation = concentration;
    let desiredDoseForCalculation = desiredDosePerHour;

    if (drug.id === 'norepinephrine' || drug.id === 'dopamine' || drug.id === 'fentanyl' || drug.id === 'tng') {
        totalDrugForCalculation = totalDrug * 1000;
        concentrationForCalculation = totalDrugForCalculation / AppState.solutionVolume;
    }

    const pumpRate = desiredDoseForCalculation / concentrationForCalculation;
    const duration = AppState.solutionVolume / pumpRate;

    displayResults(totalDrug, concentration, pumpRate, duration, ampoule.unit);
    displayDripRate(pumpRate, AppState.solutionVolume);
    generateStepByStepGuide(drug, totalDrug, concentration, pumpRate, doseValue);
    displayWarnings(drug);
    displayCompatibility(drug);

    if (AppState.settings.saveHistory) saveCalculation(totalDrug, concentration, pumpRate, duration);
    updateCalculationStats();
    showToast('موفق', 'محاسبه با موفقیت انجام شد', 'success');
}

function displayResults(totalDrug, concentration, pumpRate, duration, unit) {
    const drug = drugDatabase[AppState.selectedDrug];
    DOM.totalDrugAmount.textContent = PersianNumbers.formatNumber(totalDrug, 0);
    DOM.totalDrugUnit.innerHTML = `<span class="latin-inline">${unit}</span>`;

    let concentrationDisplay, concentrationUnitDisplay;
    if (drug.id === 'norepinephrine' || drug.id === 'dopamine' || drug.id === 'fentanyl' || drug.id === 'tng') {
        concentrationDisplay = PersianNumbers.formatNumber(concentration * 1000, 2);
        concentrationUnitDisplay = 'mcg/cc';
    } else {
        concentrationDisplay = PersianNumbers.formatNumber(concentration, 2);
        concentrationUnitDisplay = `${unit}/cc`;
    }
    DOM.concentrationResult.textContent = concentrationDisplay;
    DOM.concentrationUnit.innerHTML = `<span class="latin-inline">${concentrationUnitDisplay}</span>`;
    DOM.pumpRateResult.textContent = PersianNumbers.formatNumber(pumpRate, 2);
    DOM.pumpRateUnit.innerHTML = `<span class="latin-inline">cc/hour</span>`;
    DOM.durationResult.textContent = PersianNumbers.formatNumber(duration, 1);
    DOM.durationUnit.innerHTML = `<span class="persian-inline">ساعت</span>`;

    if (DOM.resultsSection) {
        DOM.resultsSection.classList.add('show');
        DOM.resultsSection.style.display = 'block';
        setTimeout(() => DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
}

function clearResults() {
    if (DOM.resultsSection) { DOM.resultsSection.classList.remove('show'); DOM.resultsSection.style.display = 'none'; }
    if (DOM.guideSection) DOM.guideSection.style.display = 'none';
    if (DOM.warningsSection) DOM.warningsSection.style.display = 'none';
    if (DOM.compatibilitySection) DOM.compatibilitySection.style.display = 'none';
    if (DOM.dripRateRow) DOM.dripRateRow.style.display = 'none';
    const pumpRateCard = document.getElementById('pumpRateResult')?.closest('.result-item-enhanced');
    if (pumpRateCard) {
        pumpRateCard.classList.remove('highlight');
        const labelEl = pumpRateCard.querySelector('.result-label-enhanced');
        const valueEl = pumpRateCard.querySelector('.result-value-enhanced');
        const unitEl = pumpRateCard.querySelector('.result-unit-enhanced');
        if (labelEl) labelEl.textContent = 'سرعت پمپ';
        if (valueEl) { valueEl.textContent = '0'; valueEl.style.color = ''; }
        if (unitEl) unitEl.innerHTML = '';
    }
    const origHighlight = document.querySelector('.result-item-enhanced:nth-child(3)');
    if (origHighlight && !origHighlight.classList.contains('highlight')) origHighlight.classList.add('highlight');
}

function generateStepByStepGuide(drug, totalDrug, concentration, pumpRate, desiredDose) {
    if (!DOM.guideSection || !DOM.stepByStepGuide) return;
    DOM.stepByStepGuide.innerHTML = '';
    const { factor: dripFactor, label: dripLabel } = getDripFactor(AppState.solutionVolume);
    const dropsPerMin = (pumpRate * dripFactor) / 60;
    const setType = AppState.solutionVolume <= 100 ? 'سرنگ پمپ / میکروست' : 'ست وریدی ماکروست';
    const steps = [
        `۱. آماده کردن ${AppState.ampouleCount} آمپول ${drug.persianName}`,
        `۲. کشیدن ${AppState.solutionVolume} cc محلول ${drug.solutionType[0]} به سرنگ/کیسه`,
        `۳. اضافه کردن ${PersianNumbers.formatNumber(totalDrug, 0)} ${drug.ampouleOptions[0].unit} از دارو به محلول`,
        `۴. مخلوط کردن کامل محلول`,
        `۵. نصب بر روی پمپ ${AppState.infusionMethod === 'syringe' ? 'سرنگ' : 'انفوزیون'} با ${setType}`,
        `۶. تنظیم سرعت پمپ روی ${PersianNumbers.formatNumber(pumpRate, 2)} cc/hour`,
        `۷. در صورت تزریق گراویتی: ${PersianNumbers.formatNumber(dropsPerMin, 1)} قطره/دقیقه (${dripLabel})`,
        `۸. شروع تزریق با دوز ${PersianNumbers.formatNumber(desiredDose, 2)} ${drug.standardUnit}`
    ];
    steps.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'guide-step';
        stepDiv.innerHTML = `<div class="step-content">${step}</div>`;
        DOM.stepByStepGuide.appendChild(stepDiv);
    });
    DOM.guideSection.style.display = 'block';
}

function displayWarnings(drug) {
    if (!DOM.warningsSection || !DOM.warningsList || !drug.cautions) return;
    DOM.warningsList.innerHTML = '';
    drug.cautions.forEach(caution => {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-item';
        warningDiv.innerHTML = `<i class="fas fa-exclamation-circle warning-icon"></i><span class="warning-text">${caution}</span>`;
        DOM.warningsList.appendChild(warningDiv);
    });
    DOM.warningsSection.style.display = 'block';
}

function displayCompatibility(drug) {
    if (!DOM.compatibilitySection || !DOM.compatibleDrugsList || !DOM.incompatibleDrugsList) return;
    DOM.compatibleDrugsList.innerHTML = '';
    DOM.incompatibleDrugsList.innerHTML = '';
    if (drug.ySiteCompatibilities) {
        drug.ySiteCompatibilities.compatible.forEach(drugName => {
            const item = document.createElement('div');
            item.textContent = drugName;
            item.className = 'persian-text';
            DOM.compatibleDrugsList.appendChild(item);
        });
        drug.ySiteCompatibilities.incompatible.forEach(drugName => {
            const item = document.createElement('div');
            item.textContent = drugName;
            item.className = 'persian-text';
            DOM.incompatibleDrugsList.appendChild(item);
        });
    }
    DOM.compatibilitySection.style.display = 'block';
}

function updateWeightBasedUnit(drug) {
    const unitElement = document.getElementById('orderUnit');
    if (!unitElement || !drug.weightBased) return;
    unitElement.textContent = AppState.useWeight ? drug.weightBased.unit : (drug.weightBased.nonWeightUnit || drug.standardUnit);
    clearResults();
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    function animateBtn(btn) {
        if (!btn) return;
        btn.classList.add('btn-press');
        btn.classList.add('btn-spin');
        setTimeout(() => btn.classList.remove('btn-press'), 150);
        setTimeout(() => btn.classList.remove('btn-spin'), 500);
    }

    ['themeToggle', 'historyBtn', 'settingsBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', () => animateBtn(btn), { passive: true });
        btn.addEventListener('mousedown', () => animateBtn(btn));
    });

    if (DOM.themeToggle) DOM.themeToggle.addEventListener('click', () => { haptic(25); toggleTheme(); });
    if (DOM.historyBtn) DOM.historyBtn.addEventListener('click', () => {
        loadHistory();
        if (DOM.historyModal) { DOM.historyModal.classList.add('active'); document.body.classList.add('no-scroll'); }
    });
    if (DOM.settingsBtn) DOM.settingsBtn.addEventListener('click', () => {
        if (DOM.settingsModal) { DOM.settingsModal.classList.add('active'); document.body.classList.add('no-scroll'); }
    });
    if (DOM.tabItems) DOM.tabItems.forEach(btn => btn.addEventListener('click', function() { switchTab(this.dataset.tab); }));
    if (DOM.methodBtns) DOM.methodBtns.forEach(btn => btn.addEventListener('click', function() {
        DOM.methodBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        AppState.infusionMethod = this.dataset.method;
        fixMethodButtonTextColor();
        updateVolumeOptions();
        clearResults();
    }));
    if (DOM.decreaseAmpoule) DOM.decreaseAmpoule.addEventListener('click', () => {
        if (AppState.ampouleCount > 1) { AppState.ampouleCount--; updateAmpouleInfo(); clearResults(); }
    });
    if (DOM.increaseAmpoule) DOM.increaseAmpoule.addEventListener('click', () => {
        const drug = drugDatabase[AppState.selectedDrug];
        const maxAmpoules = Math.floor(1000 / drug.ampouleOptions[0].strength) || 20;
        if (AppState.ampouleCount < maxAmpoules) { AppState.ampouleCount++; updateAmpouleInfo(); clearResults(); }
    });
    
    // Weight toggle row click handling (whole row)
    const weightToggleRow = document.getElementById('weightToggleRow');
    if (weightToggleRow) {
        weightToggleRow.addEventListener('click', (e) => {
            // Prevent toggling twice if the click came from the toggle itself
            if (e.target.closest('.ios-toggle')) return;
            haptic(25);
            AppState.useWeight = !AppState.useWeight;
            if (DOM.weightCheckbox) DOM.weightCheckbox.checked = AppState.useWeight;
            if (DOM.weightIosToggle) DOM.weightIosToggle.classList.toggle('on', AppState.useWeight);
            if (DOM.weightInputRow) {
                DOM.weightInputRow.style.display = AppState.useWeight ? 'flex' : 'none';
            }
            if (DOM.patientWeight) {
                DOM.patientWeight.disabled = !AppState.useWeight;
                if (AppState.useWeight) setTimeout(() => DOM.patientWeight.focus(), 150);
            }
            const drug = drugDatabase[AppState.selectedDrug];
            updateWeightBasedUnit(drug);
            clearResults();
        });
    }
    
    // Also keep individual toggle click (to update the row state without double toggling)
    if (DOM.weightIosToggle) {
        DOM.weightIosToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent row handler from firing again
            haptic(25);
            AppState.useWeight = !AppState.useWeight;
            if (DOM.weightCheckbox) DOM.weightCheckbox.checked = AppState.useWeight;
            DOM.weightIosToggle.classList.toggle('on', AppState.useWeight);
            if (DOM.weightInputRow) {
                DOM.weightInputRow.style.display = AppState.useWeight ? 'flex' : 'none';
            }
            if (DOM.patientWeight) {
                DOM.patientWeight.disabled = !AppState.useWeight;
                if (AppState.useWeight) setTimeout(() => DOM.patientWeight.focus(), 150);
            }
            const drug = drugDatabase[AppState.selectedDrug];
            updateWeightBasedUnit(drug);
            clearResults();
        });
    }

    if (DOM.weightCheckbox && DOM.patientWeight) {
        DOM.weightCheckbox.addEventListener('change', function() {
            AppState.useWeight = this.checked;
            DOM.patientWeight.disabled = !this.checked;
            if (DOM.weightIosToggle) DOM.weightIosToggle.classList.toggle('on', this.checked);
            if (DOM.weightInputRow) DOM.weightInputRow.style.display = this.checked ? 'flex' : 'none';
            const drug = drugDatabase[AppState.selectedDrug];
            updateWeightBasedUnit(drug);
            if (this.checked && DOM.patientWeight) DOM.patientWeight.focus();
            clearResults();
        });
    }
    if (DOM.customVolume) {
        DOM.customVolume.setAttribute('inputmode', 'numeric');
        DOM.customVolume.setAttribute('pattern', '[0-9]*');
        DOM.customVolume.style.textAlign = 'center';
    }
    if (DOM.calculateBtn) DOM.calculateBtn.addEventListener('click', () => {
        haptic(40);
        if (AppState.reverseMode) calculateReverse();
        else calculateInfusion();
    });

    const copyResultBtn = document.getElementById('copyResultBtn');
    if (copyResultBtn) copyResultBtn.addEventListener('click', () => {
        const drug = drugDatabase[AppState.selectedDrug];
        const pumpRate = document.getElementById('pumpRateResult')?.textContent;
        const concentration = document.getElementById('concentrationResult')?.textContent;
        const concentrationUnit = document.getElementById('concentrationUnit')?.textContent;
        const dose = AppState.desiredDose;
        const unit = drug?.standardUnit || '';
        const text = `MedCalc Pro\n${drug?.persianName || ''} (${drug?.englishName || ''})\nدوز: ${dose} ${unit}\nغلظت: ${concentration} ${concentrationUnit}\nسرعت پمپ: ${pumpRate} cc/hr`;
        if (navigator.share) {
            navigator.share({ title: 'FoxiMed', text }).catch(() => {});
            haptic(30);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => { showToast('کپی شد', 'نتیجه در کلیپ‌بورد کپی شد', 'success'); haptic(20); });
        } else {
            const ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
            showToast('کپی شد', 'نتیجه در کلیپ‌بورد کپی شد', 'success');
        }
    });

    if (DOM.doctorOrder) {
        DOM.doctorOrder.addEventListener('input', () => clearResults());
        DOM.doctorOrder.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calculateInfusion(); } });
    }
    if (DOM.closeSettings) DOM.closeSettings.addEventListener('click', () => {
        if (DOM.settingsModal) { DOM.settingsModal.classList.remove('active'); document.body.classList.remove('no-scroll'); }
    });
    if (DOM.closeHistory) DOM.closeHistory.addEventListener('click', () => {
        if (DOM.historyModal) { DOM.historyModal.classList.remove('active'); document.body.classList.remove('no-scroll'); }
    });
    if (DOM.drugSearch) DOM.drugSearch.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('.drug-item-compact').forEach(card => {
            const drugId = card.dataset.drugId;
            const drug = drugDatabase[drugId];
            if (!drug) return;
            const searchText = [drug.persianName, drug.englishName, drug.category, ...(drug.alternativeNames || [])].join(' ').toLowerCase();
            card.style.display = searchText.includes(term) ? 'flex' : 'none';
        });
    });
    if (DOM.librarySearch) DOM.librarySearch.addEventListener('input', function() {
        const term = this.value.toLowerCase();
        document.querySelectorAll('.qref-accordion-item').forEach(card => {
            const drugName = card.querySelector('.qref-name')?.textContent || '';
            const englishName = card.querySelector('.qref-english')?.textContent || '';
            card.style.display = (drugName + ' ' + englishName).toLowerCase().includes(term) ? 'block' : 'none';
        });
    });
    // Reverse mode toggle row
    const reverseRow = document.querySelector('.reverse-toggle-row');
    if (reverseRow) {
        reverseRow.addEventListener('click', () => {
            haptic(30);
            AppState.reverseMode = !AppState.reverseMode;
            if (AppState.reverseMode && !localStorage.getItem('reverseTooltipSeen')) {
                showReverseTooltip();
            }
            updateReverseUI();
            clearResults();
        });
    }

    if (DOM.doctorOrder) {
        DOM.doctorOrder.addEventListener('input', () => {
            clearResults();
            updateDoseRangeIndicator();
        });
    }

    setupSettingsEventListeners();
    window.addEventListener('resize', () => setupMobileLayout());
    document.querySelectorAll('.converter-body input, .tool-body input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const card = input.closest('.converter-card, .tool-card');
                const button = card?.querySelector('.converter-btn, .tool-btn');
                if (button) button.click();
            }
        });
    });
}

function setupSettingsEventListeners() {
    if (DOM.darkModeToggle) DOM.darkModeToggle.addEventListener('change', function() {
        AppState.settings.darkMode = this.checked;
        saveSettings();
        applySettings();
    });
    if (DOM.largeFontToggle) DOM.largeFontToggle.addEventListener('change', function() {
        AppState.settings.largeFont = this.checked;
        saveSettings();
        applySettings();
    });
    if (DOM.doseAlertToggle) DOM.doseAlertToggle.addEventListener('change', function() {
        AppState.settings.doseAlerts = this.checked;
        saveSettings();
    });
    if (DOM.compatAlertToggle) DOM.compatAlertToggle.addEventListener('change', function() {
        AppState.settings.compatAlerts = this.checked;
        saveSettings();
    });
    if (DOM.saveHistoryToggle) DOM.saveHistoryToggle.addEventListener('change', function() {
        AppState.settings.saveHistory = this.checked;
        saveSettings();
    });
    if (DOM.clearHistoryBtn) DOM.clearHistoryBtn.addEventListener('click', function() {
        if (confirm('آیا از پاک کردن تاریخچه اطمینان دارید؟')) {
            localStorage.removeItem('calculationHistory');
            showToast('تاریخچه پاک شد', 'تمامی محاسبات ذخیره شده حذف شدند.', 'success');
        }
    });
    if (DOM.hapticToggle) DOM.hapticToggle.addEventListener('change', function() {
        AppState.settings.hapticFeedback = this.checked;
        saveSettings();
        if (this.checked) haptic(40);
    });
    if (DOM.exportDataBtn) DOM.exportDataBtn.addEventListener('click', exportHistory);
    if (DOM.checkUpdateBtn) DOM.checkUpdateBtn.addEventListener('click', async function() {
        this.disabled = true;
        const origHTML = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال بررسی...';
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                await reg.update();
                if (reg.waiting) {
                    showUpdateBanner();
                } else {
                    showToast('بروز است', 'شما آخرین نسخه FoxiMed را دارید', 'success');
                }
            }
        } catch(e) {
            showToast('خطا', 'بررسی به‌روزرسانی ممکن نشد', 'error');
        }
        setTimeout(() => { this.disabled = false; this.innerHTML = origHTML; }, 1500);
    });
}

// ============================================
// MANUAL CALCULATION
// ============================================
function setupManualCalculation() {
    if (DOM.openManualBtn && DOM.manualSection && DOM.calculatorControls) {
        DOM.openManualBtn.addEventListener('click', openManualCalculation);
    }
}

function openManualCalculation() {
    const manualSection = DOM.manualSection;
    const calculatorControls = DOM.calculatorControls;
    const selectedDrugHeader = document.querySelector('.selected-drug-compact');
    const drugSidebar = document.querySelector('.drug-sidebar');
    const calcBtnWrap = DOM.calculateBtnWrap;

    if (manualSection && calculatorControls) {
        if (calculatorControls) calculatorControls.style.display = 'none';
        if (calcBtnWrap) calcBtnWrap.style.display = 'none';
        if (selectedDrugHeader) selectedDrugHeader.style.display = 'none';
        manualSection.style.display = 'flex';
        manualSection.style.flexDirection = 'column';
        manualSection.style.height = '100%';
        if (!manualSection.querySelector('.manual-controls')) createManualCalculationContent();
        ['resultsSection', 'guideSection', 'warningsSection', 'compatibilitySection'].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });
        if (drugSidebar && window.innerWidth < 768) drugSidebar.style.display = 'none';
    }
}

function createManualCalculationContent() {
    const manualSection = document.getElementById('manualSection');
    if (!manualSection) return;
    manualSection.innerHTML = `
        <div class="manual-header">
            <h3><i class="fas fa-edit"></i> محاسبه دستی دارو</h3>
            <button class="icon-btn" id="closeManualBtn"><i class="fas fa-times"></i></button>
        </div>
        <div class="manual-controls">
            <div class="control-group">
                <label><i class="fas fa-pills"></i> نام دارو (اختیاری)</label>
                <input type="text" id="manualDrugName" placeholder="نام دارو را وارد کنید" style="text-align: right; direction: rtl;">
            </div>
            <div class="control-group">
                <label><i class="fas fa-infinity"></i> روش تزریق</label>
                <div class="method-selector-compact">
                    <button class="method-btn-compact active" data-method="syringe"><i class="fas fa-syringe"></i> <span>پمپ سرنگ</span></button>
                    <button class="method-btn-compact" data-method="infusion"><i class="fas fa-pump-medical"></i> <span>پمپ انفوزیون</span></button>
                </div>
            </div>
            <div class="manual-inputs-grid">
                <div class="control-group">
                    <label><i class="fas fa-vial"></i> قدرت آمپول</label>
                    <div class="manual-input-with-unit">
                        <input type="number" id="manualStrength" placeholder="0" step="0.01" min="0.01" value="5000" inputmode="decimal" style="text-align: center;">
                        <select id="manualStrengthUnit">
                            <option value="units">واحد</option>
                            <option value="mg">میلی‌گرم</option>
                            <option value="mcg">میکروگرم</option>
                            <option value="g">گرم</option>
                        </select>
                    </div>
                </div>
                <div class="control-group">
                    <label><i class="fas fa-vial"></i> حجم آمپول</label>
                    <div class="manual-input-with-unit">
                        <input type="number" id="manualVialVolume" placeholder="0" step="0.1" min="0.1" value="1" inputmode="decimal" style="text-align: center;">
                        <span class="unit">میلی‌لیتر</span>
                    </div>
                </div>
                <div class="control-group">
                    <label><i class="fas fa-syringe"></i> تعداد آمپول</label>
                    <div class="ampoule-control-enhanced">
                        <button class="ampoule-btn-enhanced" id="manualDecreaseAmpoule"><i class="fas fa-minus"></i></button>
                        <div class="ampoule-count-enhanced"><span id="manualAmpouleCount">1</span><small>عدد</small></div>
                        <button class="ampoule-btn-enhanced" id="manualIncreaseAmpoule"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
                <div class="control-group">
                    <label><i class="fas fa-flask"></i> حجم محلول</label>
                    <div class="manual-input-with-unit">
                        <input type="number" id="manualSolutionVolume" placeholder="0" step="1" min="1" value="50" inputmode="numeric" style="text-align: center;">
                        <span class="unit">سی‌سی</span>
                    </div>
                </div>
                <div class="control-group">
                    <label><i class="fas fa-file-medical-alt"></i> دوز درخواستی</label>
                    <div class="dose-input-enhanced">
                        <div class="dose-input-wrapper">
                            <input type="number" id="manualDesiredDose" placeholder="0" step="0.01" min="0.01" value="1000" inputmode="decimal" style="text-align: center;">
                            <select class="dose-unit-enhanced" id="manualDoseUnit" style="position:static;transform:none;background:none;color:var(--text-secondary);padding:4px;">
                                <option value="units/hour">واحد/ساعت</option>
                                <option value="mg/hour">mg/hour</option>
                                <option value="mcg/hour">mcg/hour</option>
                                <option value="mg/min">mg/min</option>
                                <option value="mcg/min">mcg/min</option>
                                <option value="mcg/kg/min">mcg/kg/min</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="control-group">
                    <label><i class="fas fa-weight-scale"></i> وزن بیمار (اختیاری)</label>
                    <div class="manual-input-with-unit">
                        <input type="number" id="manualPatientWeight" placeholder="0" step="0.1" min="1" value="70" inputmode="decimal" style="text-align: center;">
                        <span class="unit latin-inline">kg</span>
                    </div>
                </div>
            </div>
            <button class="calculate-btn-enhanced" id="manualCalculateBtn">
                <i class="fas fa-calculator"></i><span>محاسبه سرعت پمپ</span>
            </button>
            <div class="manual-results" id="manualResults" style="display: none; margin-top: 16px;">
                <div class="results-grid-enhanced" style="grid-template-columns: repeat(2, 1fr);">
                    <div class="result-item-enhanced">
                        <div class="result-label-enhanced">غلظت محلول</div>
                        <div class="result-value-enhanced" id="manualConcentration">0</div>
                        <div class="result-unit-enhanced" id="manualConcentrationUnit">واحد/سی‌سی</div>
                    </div>
                    <div class="result-item-enhanced">
                        <div class="result-label-enhanced">مقدار کل دارو</div>
                        <div class="result-value-enhanced" id="manualTotalDrug">0</div>
                        <div class="result-unit-enhanced" id="manualTotalDrugUnit">واحد</div>
                    </div>
                    <div class="result-item-enhanced highlight gradient" style="grid-column: span 2;">
                        <div class="result-label-enhanced">سرعت پمپ</div>
                        <div class="result-value-enhanced" id="manualPumpRate">0</div>
                        <div class="result-unit-enhanced">cc/hour</div>
                    </div>
                </div>
                <div class="drip-rate-row" id="manualDripRow" style="margin-top:10px;">
                    <div class="drip-rate-icon"><i class="fas fa-droplet"></i></div>
                    <div class="drip-rate-body">
                        <span class="drip-rate-label" id="manualDripLabel">سرعت قطره</span>
                        <span class="drip-rate-value"><span id="manualDripRate">0</span> <span class="drip-rate-unit">قطره/دقیقه</span></span>
                    </div>
                </div>
                <div class="manual-duration-row" id="manualDurationRow" style="margin-top:8px; display:flex; align-items:center; gap:8px; font-family:var(--font-persian); font-size:13px; color:var(--text-secondary); padding:8px 12px; background:var(--surface-elevated); border-radius:10px; border:1px solid var(--border);">
                    <i class="fas fa-clock" style="color:var(--primary);"></i>
                    <span>زمان تخمینی تزریق: </span>
                    <strong id="manualDuration" style="color:var(--text-primary); margin-right:4px;">0 ساعت</strong>
                </div>
            </div>
        </div>
    `;
    setupManualCalculationFunctionality();
}

function setupManualCalculationFunctionality() {
    const methodBtns = document.querySelectorAll('#manualSection .method-btn-compact');
    methodBtns.forEach(btn => btn.addEventListener('click', function() {
        methodBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    }));
    let manualAmpCount = 1;
    document.getElementById('manualDecreaseAmpoule').addEventListener('click', () => {
        if (manualAmpCount > 1) { manualAmpCount--; document.getElementById('manualAmpouleCount').textContent = manualAmpCount; }
    });
    document.getElementById('manualIncreaseAmpoule').addEventListener('click', () => {
        if (manualAmpCount < 20) { manualAmpCount++; document.getElementById('manualAmpouleCount').textContent = manualAmpCount; }
    });
    document.getElementById('manualCalculateBtn').addEventListener('click', calculateManualInfusion);
    document.getElementById('closeManualBtn').addEventListener('click', () => {
        document.getElementById('manualSection').style.display = 'none';
        document.getElementById('calculatorControls').style.display = 'grid';
        if (DOM.calculateBtnWrap) DOM.calculateBtnWrap.style.display = 'block';
        const selectedDrugHeader = document.querySelector('.selected-drug-compact');
        if (selectedDrugHeader) selectedDrugHeader.style.display = 'flex';
        const drugSidebar = document.querySelector('.drug-sidebar');
        if (drugSidebar && window.innerWidth < 768) drugSidebar.removeAttribute('style');
    });
}

function calculateManualInfusion() {
    const strength = PersianNumbers.parseNumber(document.getElementById('manualStrength').value);
    const strengthUnit = document.getElementById('manualStrengthUnit').value;
    const vialVolume = PersianNumbers.parseNumber(document.getElementById('manualVialVolume').value);
    const ampouleCount = parseInt(document.getElementById('manualAmpouleCount').textContent);
    const solutionVolume = PersianNumbers.parseNumber(document.getElementById('manualSolutionVolume').value);
    const desiredDose = PersianNumbers.parseNumber(document.getElementById('manualDesiredDose').value);
    const doseUnit = document.getElementById('manualDoseUnit').value;
    const patientWeight = PersianNumbers.parseNumber(document.getElementById('manualPatientWeight').value) || 0;

    if (!strength || !vialVolume || !solutionVolume || !desiredDose) {
        showToast('خطا', 'لطفاً تمامی فیلدهای ضروری را پر کنید', 'error');
        return;
    }

    const totalDrug = ampouleCount * strength;
    const concentration = totalDrug / solutionVolume;
    let desiredDosePerHour = desiredDose;
    if (doseUnit.includes('/min')) desiredDosePerHour = desiredDose * 60;
    if (doseUnit.includes('/kg/') && patientWeight > 0) {
        desiredDosePerHour = desiredDose * patientWeight;
        if (doseUnit.includes('/min')) desiredDosePerHour *= 60;
    }
    const pumpRate = desiredDosePerHour / concentration;
    const duration = solutionVolume / pumpRate;
    const { factor: dripFactor, label: dripLabel } = getDripFactor(solutionVolume);
    const dropsPerMin = (pumpRate * dripFactor) / 60;

    const totalEl = document.getElementById('manualTotalDrug');
    const totalUnitEl = document.getElementById('manualTotalDrugUnit');
    if (totalEl) totalEl.textContent = PersianNumbers.formatNumber(totalDrug, 0);
    if (totalUnitEl) totalUnitEl.innerHTML = `<span class="latin-inline">${strengthUnit}</span>`;

    document.getElementById('manualConcentration').textContent = PersianNumbers.formatNumber(concentration, 3);
    document.getElementById('manualConcentrationUnit').innerHTML = `<span class="latin-inline">${strengthUnit}/cc</span>`;
    document.getElementById('manualPumpRate').textContent = PersianNumbers.formatNumber(pumpRate, 2);

    const dripRateEl = document.getElementById('manualDripRate');
    const dripLabelEl = document.getElementById('manualDripLabel');
    if (dripRateEl) dripRateEl.textContent = PersianNumbers.formatNumber(dropsPerMin, 1);
    if (dripLabelEl) dripLabelEl.textContent = 'سرعت قطره (' + dripLabel + ')';

    const durationEl = document.getElementById('manualDuration');
    if (durationEl) durationEl.textContent = PersianNumbers.formatNumber(duration, 1) + ' ساعت';

    document.getElementById('manualResults').style.display = 'block';
    haptic(40);
    showToast('موفق', 'محاسبه دستی با موفقیت انجام شد', 'success');
}

// ============================================
// TAB MANAGEMENT
// ============================================
function switchTab(tabName) {
    DOM.tabItems.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    DOM.tabPanes.forEach(pane => {
        const isActive = pane.id === tabName + 'Tab';
        pane.classList.toggle('active', isActive);
        pane.style.display = isActive ? 'block' : 'none';
    });
    AppState.currentTab = tabName;
    if (tabName === 'drugs') loadDrugLibrary();
    if (tabName === 'tools') {
        initializeTools();
        initializeConverters();
    }
}

// ============================================
// THEME
// ============================================
function toggleTheme() {
    AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', AppState.theme === 'dark');
    AppState.settings.darkMode = AppState.theme === 'dark';
    saveSettings();
    const meta = document.getElementById('themeColorMeta');
    if (meta) meta.content = AppState.theme === 'dark' ? '#1f2937' : '#ffffff';
    applyTheme(AppState.settings.colorTheme || 'default');
    const icon = DOM.themeToggle.querySelector('i');
    if (icon) icon.className = AppState.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    if (DOM.darkModeToggle) DOM.darkModeToggle.checked = AppState.theme === 'dark';
    localStorage.setItem('theme', AppState.theme);
    fixVolumeButtonColors();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    AppState.theme = savedTheme;
    document.body.classList.toggle('dark-mode', AppState.theme === 'dark');
    const icon = DOM.themeToggle?.querySelector('i');
    if (icon) icon.className = AppState.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    if (DOM.darkModeToggle) DOM.darkModeToggle.checked = AppState.theme === 'dark';
    fixVolumeButtonColors();
    const savedColor = AppState.settings.colorTheme || 'default';
    if (savedColor !== 'default') applyTheme(savedColor);
}

// ============================================
// CONVERTERS — bidirectional live
// ============================================
function initializeConverters() {
    const defaults = { percentageValue:'5', percentageVolume:'100', dripVolume:'500', dripTime:'8', tempC:'37', weightKg:'70' };
    Object.entries(defaults).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    convertPercentageLive();
    calculateDripRateLive();
    convertTempLive('c');
    convertWeightLive('kg');
}

const ELECTROLYTE_DATA = {
    sodium:             { mw: 23,  valence: 1 },
    potassium:          { mw: 39,  valence: 1 },
    calcium:            { mw: 20,  valence: 2 },
    magnesium:          { mw: 12,  valence: 2 },
    sodium_bicarbonate: { mw: 84,  valence: 1 }
};

function convertElectrolyteLive(source) {
    const element = document.getElementById('electrolyteElement').value;
    const data = ELECTROLYTE_DATA[element];
    if (!data) return;
    const meqEl = document.getElementById('electrolyteMeq');
    const mgEl  = document.getElementById('electrolyteMg');
    const resEl = document.getElementById('electrolyteResult');
    const eqWeight = data.mw / data.valence;
    if (source === 'meq') {
        const meq = parseFloat(meqEl.value);
        if (!isNaN(meq) && meq >= 0) mgEl.value = parseFloat((meq * eqWeight).toFixed(3));
    } else if (source === 'mg') {
        const mg = parseFloat(mgEl.value);
        if (!isNaN(mg) && mg >= 0) meqEl.value = parseFloat((mg / eqWeight).toFixed(3));
    }
    const meq = parseFloat(meqEl.value) || 0;
    const mg  = parseFloat(mgEl.value)  || 0;
    if (meq > 0 || mg > 0) {
        resEl.innerHTML = renderConverterResult([
            { label: 'mEq', value: meq.toFixed(2) },
            { label: 'mg',  value: mg.toFixed(2) },
            { label: 'وزن اکی‌والان', value: eqWeight.toFixed(1) + ' mg/mEq' }
        ]);
        resEl.style.display = 'block';
    }
}

function convertUnitsLive(source) {
    const fromSel = document.getElementById('unitFromSelect');
    const toSel   = document.getElementById('unitToSelect');
    const fromEl  = document.getElementById('unitFromVal');
    const toEl    = document.getElementById('unitToVal');
    const resEl   = document.getElementById('unitResult');
    const toMcg = { mcg: 1, mg: 1000, g: 1000000 };
    const fromUnit = fromSel.value, toUnit = toSel.value;
    if (source === 'from') {
        const val = parseFloat(fromEl.value);
        if (!isNaN(val) && val >= 0) {
            const mcg = val * toMcg[fromUnit];
            toEl.value = parseFloat((mcg / toMcg[toUnit]).toFixed(6));
        }
    } else if (source === 'to') {
        const val = parseFloat(toEl.value);
        if (!isNaN(val) && val >= 0) {
            const mcg = val * toMcg[toUnit];
            fromEl.value = parseFloat((mcg / toMcg[fromUnit]).toFixed(6));
        }
    }
    const fromVal = parseFloat(fromEl.value) || 0;
    const toVal   = parseFloat(toEl.value)   || 0;
    if (fromVal > 0 || toVal > 0) {
        resEl.innerHTML = renderConverterResult([
            { label: fromUnit, value: fromVal.toFixed(4) },
            { label: toUnit,   value: toVal.toFixed(4) }
        ]);
        resEl.style.display = 'block';
    }
}

function convertPercentageLive() {
    const pct = parseFloat(document.getElementById('percentageValue').value) || 0;
    const vol = parseFloat(document.getElementById('percentageVolume').value) || 100;
    const resEl = document.getElementById('percentageResult');
    if (pct <= 0) { resEl.style.display = 'none'; return; }
    const grams = (pct / 100) * vol;
    const mgPerMl = (pct / 100) * 1000;
    resEl.innerHTML = renderConverterResult([
        { label: 'مقدار دارو در محلول', value: grams.toFixed(2) + ' g' },
        { label: 'غلظت', value: mgPerMl.toFixed(1) + ' mg/mL' },
        { label: 'غلظت میکروگرمی', value: (mgPerMl * 1000).toFixed(0) + ' mcg/mL' }
    ]);
    resEl.style.display = 'block';
}

function calculateDripRateLive() {
    const vol    = parseFloat(document.getElementById('dripVolume').value) || 0;
    const time   = parseFloat(document.getElementById('dripTime').value)   || 0;
    const factor = parseInt(document.getElementById('dripFactorSelect').value) || 20;
    const resEl  = document.getElementById('dripResult');
    if (vol <= 0 || time <= 0) { resEl.style.display = 'none'; return; }
    const mlPerHr   = vol / time;
    const dropsMin  = (mlPerHr * factor) / 60;
    const drops15s  = dropsMin / 4;
    resEl.innerHTML = renderConverterResult([
        { label: 'سرعت پمپ',         value: mlPerHr.toFixed(1) + ' mL/hr' },
        { label: 'قطره در دقیقه',     value: dropsMin.toFixed(1) + ' gtt/min' },
        { label: 'قطره در ۱۵ ثانیه',  value: Math.round(drops15s) + ' قطره (شمارش در ۱۵ ثانیه)' }
    ]);
    resEl.style.display = 'block';
}

function convertTempLive(source) {
    const cEl   = document.getElementById('tempC');
    const fEl   = document.getElementById('tempF');
    const resEl = document.getElementById('tempResult');
    if (!cEl || !fEl) return;
    if (source === 'c') {
        const c = parseFloat(cEl.value);
        if (!isNaN(c)) fEl.value = parseFloat(((c * 9/5) + 32).toFixed(1));
    } else {
        const f = parseFloat(fEl.value);
        if (!isNaN(f)) cEl.value = parseFloat(((f - 32) * 5/9).toFixed(1));
    }
    const c = parseFloat(cEl.value) || 0;
    let note = '';
    if (c < 35)       note = '🔵 هیپوترمی';
    else if (c < 36.5) note = '⚪ زیر نرمال';
    else if (c <= 37.5) note = '🟢 طبیعی';
    else if (c <= 38.5) note = '🟡 تب خفیف';
    else if (c <= 40)  note = '🟠 تب';
    else               note = '🔴 تب شدید — اورژانسی';
    resEl.innerHTML = renderConverterResult([
        { label: 'سلسیوس',  value: (parseFloat(cEl.value) || 0).toFixed(1) + ' °C' },
        { label: 'فارنهایت', value: (parseFloat(fEl.value) || 0).toFixed(1) + ' °F' },
        { label: 'وضعیت',   value: note }
    ]);
    resEl.style.display = 'block';
}

function convertWeightLive(source) {
    const kgEl  = document.getElementById('weightKg');
    const lbEl  = document.getElementById('weightLb');
    const gEl   = document.getElementById('weightG');
    const resEl = document.getElementById('weightResult');
    if (!kgEl || !lbEl || !gEl) return;
    let kg = 0;
    if (source === 'kg') kg = parseFloat(kgEl.value) || 0;
    else if (source === 'lb') { kg = (parseFloat(lbEl.value) || 0) / 2.20462; kgEl.value = kg.toFixed(2); }
    else if (source === 'g')  { kg = (parseFloat(gEl.value) || 0) / 1000; kgEl.value = kg.toFixed(3); }
    if (kg > 0) {
        lbEl.value = (kg * 2.20462).toFixed(1);
        gEl.value  = (kg * 1000).toFixed(0);
        resEl.innerHTML = renderConverterResult([
            { label: 'کیلوگرم', value: kg.toFixed(2) + ' kg' },
            { label: 'پوند',    value: (kg * 2.20462).toFixed(1) + ' lb' },
            { label: 'گرم',     value: (kg * 1000).toFixed(0) + ' g' }
        ]);
        resEl.style.display = 'block';
    }
}

function renderConverterResult(rows) {
    return '<div class="conv-result-list">' + rows.map(r =>
        '<div class="conv-result-row"><span class="conv-result-label">' + r.label + '</span><strong class="conv-result-value">' + r.value + '</strong></div>'
    ).join('') + '</div>';
}

function convertElectrolyte() { convertElectrolyteLive('meq'); }
function convertPercentage() { convertPercentageLive(); }
function convertUnits() { convertUnitsLive('from'); }
function calculateDripRate() { calculateDripRateLive(); }

// ============================================
// TOOLS
// ============================================
function initializeTools() {
    const defaults = { bmiWeight:'70', bmiHeight:'170', bsaWeight:'70', bsaHeight:'170', ibwHeight:'170', crclAge:'40', crclWeight:'70', crclValue:'1.0' };
    Object.entries(defaults).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    ['compatDrug1','compatDrug2','doseCalcDrugPicker'].forEach(selId => {
        const sel = document.getElementById(selId);
        if (!sel || sel.options.length > 1) return;
        Object.values(drugDatabase).forEach(drug => {
            const opt = document.createElement('option');
            opt.value = drug.id;
            opt.textContent = drug.persianName + ' (' + drug.englishName + ')';
            sel.appendChild(opt);
        });
    });
}

function calculateBMI() {
    const weight = PersianNumbers.parseNumber(document.getElementById('bmiWeight').value);
    const height = PersianNumbers.parseNumber(document.getElementById('bmiHeight').value);
    const resultDiv = document.getElementById('bmiResult');
    if (!weight || !height) { showToast('خطا', 'لطفاً وزن و قد را وارد کنید', 'error'); resultDiv.innerHTML = ''; resultDiv.style.display = 'none'; return; }
    const bmi = weight / Math.pow(height / 100, 2);
    let cat, color;
    if (bmi < 18.5)      { cat = 'کمبود وزن';  color = '#60a5fa'; }
    else if (bmi < 25)   { cat = 'طبیعی';       color = '#34d399'; }
    else if (bmi < 30)   { cat = 'اضافه وزن';   color = '#fbbf24'; }
    else                 { cat = 'چاقی';         color = '#f87171'; }
    resultDiv.innerHTML = renderConverterResult([
        { label: 'BMI', value: PersianNumbers.formatNumber(bmi, 1) + ' kg/m²' },
        { label: 'وضعیت', value: `<span style="color:${color};font-weight:700;">${cat}</span>` }
    ]);
    resultDiv.style.display = 'block';
    refreshAccordion(resultDiv);
}

function calculateBSA() {
    const weight = PersianNumbers.parseNumber(document.getElementById('bsaWeight').value);
    const height = PersianNumbers.parseNumber(document.getElementById('bsaHeight').value);
    const formula = document.getElementById('bsaFormula').value;
    const resultDiv = document.getElementById('bsaResult');
    if (!weight || !height) { showToast('خطا', 'لطفاً وزن و قد را وارد کنید', 'error'); resultDiv.innerHTML = ''; resultDiv.style.display = 'none'; return; }
    let bsa;
    if (formula === 'mosteller') bsa = Math.sqrt((weight * height) / 3600);
    else if (formula === 'dubois') bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
    else bsa = 0.024265 * Math.pow(weight, 0.5378) * Math.pow(height, 0.3964);
    resultDiv.innerHTML = renderConverterResult([
        { label: 'سطح بدن (BSA)', value: PersianNumbers.formatNumber(bsa, 3) + ' m²' },
        { label: 'فرمول', value: formula === 'mosteller' ? 'Mosteller' : formula === 'dubois' ? 'DuBois' : 'Haycock' }
    ]);
    resultDiv.style.display = 'block';
    refreshAccordion(resultDiv);
}

function calculateIBW() {
    const height = PersianNumbers.parseNumber(document.getElementById('ibwHeight').value);
    const gender = document.getElementById('ibwGender').value;
    const formula = document.getElementById('ibwFormula').value;
    const resultDiv = document.getElementById('ibwResult');
    if (!height) { showToast('خطا', 'لطفاً قد را وارد کنید', 'error'); resultDiv.innerHTML = ''; resultDiv.style.display = 'none'; return; }
    const hIn = height / 2.54;
    let ibw;
    if (formula === 'devine') ibw = gender === 'male' ? 50 + 2.3 * (hIn - 60) : 45.5 + 2.3 * (hIn - 60);
    else if (formula === 'robinson') ibw = gender === 'male' ? 52 + 1.9 * (hIn - 60) : 49 + 1.7 * (hIn - 60);
    else ibw = gender === 'male' ? 56.2 + 1.41 * (hIn - 60) : 53.1 + 1.36 * (hIn - 60);
    resultDiv.innerHTML = renderConverterResult([
        { label: 'وزن ایده‌آل (IBW)', value: PersianNumbers.formatNumber(ibw, 1) + ' kg' },
        { label: 'فرمول', value: formula.charAt(0).toUpperCase() + formula.slice(1) }
    ]);
    resultDiv.style.display = 'block';
    refreshAccordion(resultDiv);
}

function calculateCrCl() {
    const age = PersianNumbers.parseNumber(document.getElementById('crclAge').value);
    const weight = PersianNumbers.parseNumber(document.getElementById('crclWeight').value);
    const creatinine = PersianNumbers.parseNumber(document.getElementById('crclValue').value);
    const gender = document.getElementById('crclGender').value;
    const resultDiv = document.getElementById('crclResult');
    if (!age || !weight || !creatinine) { showToast('خطا', 'لطفاً تمامی مقادیر را وارد کنید', 'error'); resultDiv.innerHTML = ''; resultDiv.style.display = 'none'; return; }
    let crcl = ((140 - age) * weight) / (72 * creatinine);
    if (gender === 'female') crcl *= 0.85;
    let fn, fnColor;
    if (crcl > 90)       { fn = 'طبیعی';         fnColor = '#34d399'; }
    else if (crcl > 60)  { fn = 'کاهش خفیف';     fnColor = '#fbbf24'; }
    else if (crcl > 30)  { fn = 'کاهش متوسط';    fnColor = '#f97316'; }
    else if (crcl > 15)  { fn = 'کاهش شدید';     fnColor = '#f87171'; }
    else                 { fn = 'نارسایی کلیه';   fnColor = '#ef4444'; }
    resultDiv.innerHTML = renderConverterResult([
        { label: 'کلیرانس کراتینین', value: PersianNumbers.formatNumber(crcl, 0) + ' mL/min' },
        { label: 'وضعیت کلیه', value: `<span style="color:${fnColor};font-weight:700;">${fn}</span>` },
        { label: 'توجه', value: crcl < 30 ? 'تنظیم دوز داروهای کلیوی ضروری است' : 'دوز داروها را بر اساس CrCl بررسی کنید' }
    ]);
    resultDiv.style.display = 'block';
    refreshAccordion(resultDiv);
}

function checkCompatibility() {
    const drug1Id = document.getElementById('compatDrug1').value;
    const drug2Id = document.getElementById('compatDrug2').value;
    const solution = document.getElementById('compatSolution').value;
    const resultDiv = document.getElementById('compatResult');
    if (!drug1Id || !drug2Id) { showToast('خطا', 'لطفاً هر دو دارو را انتخاب کنید', 'error'); resultDiv.innerHTML = ''; resultDiv.style.display = 'none'; return; }
    if (drug1Id === drug2Id) {
        resultDiv.innerHTML = '<div class="compat-result-box warn"><i class="fas fa-info-circle"></i><span>داروهای یکسان انتخاب شده‌اند</span></div>';
        resultDiv.style.display = 'block'; return;
    }
    const d1 = drugDatabase[drug1Id], d2 = drugDatabase[drug2Id];
    if (!d1 || !d2) { resultDiv.textContent = 'اطلاعات دارو یافت نشد'; resultDiv.style.display = 'block'; return; }

    const solMap = { NS: 'N.S', D5W: 'D5W', DS: 'D/S', RL: 'RL' };
    const solKey = solMap[solution] || solution;
    const d1SolOk = d1.solutionType.some(s => s.replace(/[\s.\/]/g,'').toLowerCase() === solKey.replace(/[\s.\/]/g,'').toLowerCase() || d1.solutionType.includes(solution));
    const d2SolOk = d2.solutionType.some(s => s.replace(/[\s.\/]/g,'').toLowerCase() === solKey.replace(/[\s.\/]/g,'').toLowerCase() || d2.solutionType.includes(solution));

    const d2EnglishLower = d2.englishName.toLowerCase();
    const d1EnglishLower = d1.englishName.toLowerCase();
    const d1Compatibles = (d1.ySiteCompatibilities?.compatible || []).map(s => s.toLowerCase());
    const d1Incompatibles = (d1.ySiteCompatibilities?.incompatible || []).map(s => s.toLowerCase());
    const d2Compatibles = (d2.ySiteCompatibilities?.compatible || []).map(s => s.toLowerCase());
    const d2Incompatibles = (d2.ySiteCompatibilities?.incompatible || []).map(s => s.toLowerCase());

    const d1SaysCompat = d1Compatibles.some(s => s.includes(d2EnglishLower) || s.includes(d2.persianName));
    const d1SaysIncompat = d1Incompatibles.some(s => s.includes(d2EnglishLower) || s.includes(d2.persianName));
    const d2SaysCompat = d2Compatibles.some(s => s.includes(d1EnglishLower) || s.includes(d1.persianName));
    const d2SaysIncompat = d2Incompatibles.some(s => s.includes(d1EnglishLower) || s.includes(d1.persianName));

    const isIncompat = d1SaysIncompat || d2SaysIncompat;
    const isCompat = (d1SaysCompat || d2SaysCompat) && !isIncompat;

    let solNote = '';
    if (!d1SolOk) solNote = `<div class="compat-sol-note"><i class="fas fa-exclamation-triangle"></i> ${d1.persianName} معمولاً با ${solution} استفاده نمی‌شود</div>`;
    else if (!d2SolOk) solNote = `<div class="compat-sol-note"><i class="fas fa-exclamation-triangle"></i> ${d2.persianName} معمولاً با ${solution} استفاده نمی‌شود</div>`;

    let html = '';
    if (isIncompat) {
        html = `<div class="compat-result-box danger">
            <i class="fas fa-times-circle"></i>
            <div>
                <strong>${d1.persianName} و ${d2.persianName} ناسازگار هستند</strong>
                <span>از تزریق همزمان در یک خط خودداری کنید</span>
            </div>
        </div>`;
    } else if (isCompat) {
        html = `<div class="compat-result-box success">
            <i class="fas fa-check-circle"></i>
            <div>
                <strong>${d1.persianName} و ${d2.persianName} سازگار هستند (Y-Site)</strong>
                <span>تزریق همزمان در یک خط امکان‌پذیر است</span>
            </div>
        </div>`;
    } else {
        html = `<div class="compat-result-box warn">
            <i class="fas fa-question-circle"></i>
            <div>
                <strong>اطلاعات کافی در پایگاه داده موجود نیست</strong>
                <span>قبل از تزریق همزمان با داروساز مشورت کنید</span>
            </div>
        </div>`;
    }
    resultDiv.innerHTML = html + solNote;
    resultDiv.style.display = 'block';
}

function calculateDose() {
    const needed = PersianNumbers.parseNumber(document.getElementById('doseNeeded').value);
    const concentration = PersianNumbers.parseNumber(document.getElementById('doseConcentration').value);
    const vialVolume = PersianNumbers.parseNumber(document.getElementById('doseVialVolume').value);
    const unit = document.getElementById('doseUnit')?.value || 'mg';
    const resultDiv = document.getElementById('doseResult');
    if (!needed || !concentration || !vialVolume) { showToast('خطا', 'لطفاً تمامی مقادیر را وارد کنید', 'error'); resultDiv.innerHTML = ''; resultDiv.style.display = 'none'; return; }
    if (concentration === 0) { resultDiv.innerHTML = 'غلظت نمی‌تواند صفر باشد'; resultDiv.style.display = 'block'; return; }
    const volumeNeeded = needed / concentration;
    const vialsNeeded = Math.ceil(volumeNeeded / vialVolume);
    const syringes = [1, 2, 3, 5, 10, 20, 50];
    const bestSyringe = syringes.find(s => s >= volumeNeeded) || 50;
    const vialText = vialsNeeded > 1 ? ` — ${vialsNeeded} ویال` : ' — ۱ ویال';
    resultDiv.innerHTML = `
        <div class="dose-calc-result">
            <div class="dose-calc-row"><span>حجم مورد نیاز:</span><strong>${PersianNumbers.formatNumber(volumeNeeded, 2)} mL${vialText}</strong></div>
            <div class="dose-calc-row"><span>سرنگ پیشنهادی:</span><strong>${bestSyringe} mL</strong></div>
        </div>`;
    resultDiv.style.display = 'block';
}

function populateDoseCalcFromDrug() {
    const sel = document.getElementById('doseCalcDrugPicker');
    if (!sel) return;
    const drugId = sel.value;
    if (!drugId) return;
    const drug = drugDatabase[drugId];
    if (!drug) return;
    const amp = drug.ampouleOptions[0];
    const conc = amp.strength / amp.volume;
    const concEl = document.getElementById('doseConcentration');
    const vialEl = document.getElementById('doseVialVolume');
    const unitEl = document.getElementById('doseUnit');
    const concUnitEl = document.getElementById('doseConcentrationUnit');
    if (concEl) concEl.value = parseFloat(conc.toFixed(3));
    if (vialEl) vialEl.value = amp.volume;
    if (unitEl) unitEl.value = amp.unit || 'mg';
    if (concUnitEl) concUnitEl.textContent = (amp.unit || 'mg') + '/mL';
    showToast('بارگذاری شد', drug.persianName + ' — غلظت: ' + parseFloat(conc.toFixed(3)) + ' ' + (amp.unit||'mg') + '/mL', 'success');
}

// ============================================
// DRUG QUICK REFERENCE — Accordion style
// ============================================
function loadDrugLibrary() {
    const container = document.getElementById('drugLibrary');
    if (!container) return;
    if (container.children.length > 0) { wireDrugLibrarySearch(); return; }

    Object.values(drugDatabase).forEach(drug => {
        // Format dose range with proper LTR isolation for numbers
        // Inside loadDrugLibrary, replace the doseRangeDisplay block with:
let doseRangeDisplay = '--';
if (drug.typicalDoseRange) {
    const minFormatted = PersianNumbers.formatNumber(drug.typicalDoseRange.min, 1);
    const maxFormatted = PersianNumbers.formatNumber(drug.typicalDoseRange.max, 1);
    doseRangeDisplay = '<span dir="ltr" style="display:inline-block; unicode-bidi:isolate;">' + minFormatted + '–' + maxFormatted + ' ' + drug.typicalDoseRange.unit + '</span>';
}
        const maxConc = drug.maxSafeConcentration || '--';
        const solutions = drug.solutionType.join(' / ');
        const compatible = (drug.ySiteCompatibilities?.compatible || []).slice(0, 5);
        const incompatible = (drug.ySiteCompatibilities?.incompatible || []).slice(0, 5);

        const ampoulesHTML = drug.ampouleOptions.map(a =>
            '<div class="qref-ampoule-item"><i class="fas fa-vial"></i><span>' + a.label + '</span></div>'
        ).join('');

        const item = document.createElement('div');
        item.className = 'accordion-item qref-accordion-item';
        item.style.setProperty('--drug-color', drug.color);
        item.dataset.drugName = drug.persianName.toLowerCase() + ' ' + drug.englishName.toLowerCase();
        item.innerHTML =
            '<div class="qref-row" data-body-id="drug-body-' + drug.id + '">' +
                '<div class="qref-acc-icon" style="background:linear-gradient(135deg,' + drug.color + ',' + drug.color + 'bb)">' +
                    renderDrugIcon(drug.icon) +
                '</div>' +
                '<div class="qref-title-block">' +
                    '<span class="qref-name">' + drug.persianName + '</span>' +
                    '<span class="qref-english">' + drug.englishName + ' — ' + drug.category + '</span>' +
                '</div>' +
                '<button class="qref-calc-btn" onclick="event.stopPropagation();selectDrug(\'' + drug.id + '\');switchTab(\'calculator\')">' +
                    '<i class="fas fa-calculator"></i>' +
                    '<span>محاسبه</span>' +
                '</button>' +
                '<div class="qref-chevron">' +
                    '<i class="fas fa-chevron-down"></i>' +
                '</div>' +
            '</div>' +
            '<div class="accordion-body qref-acc-body" id="drug-body-' + drug.id + '">' +
                '<div class="qref-info-grid">' +
                    '<div class="qref-info-row"><span class="qref-info-label"><i class="fas fa-pills"></i> دوز معمول</span><span class="qref-info-val">' + doseRangeDisplay + '</span></div>' +
                    '<div class="qref-info-row"><span class="qref-info-label"><i class="fas fa-flask"></i> حداکثر غلظت</span><span class="qref-info-val">' + maxConc + '</span></div>' +
                    '<div class="qref-info-row"><span class="qref-info-label"><i class="fas fa-droplet"></i> محلول‌های سازگار</span><span class="qref-info-val">' + solutions + '</span></div>' +
                '</div>' +
                '<div class="qref-ampoule-section">' +
                    '<div class="qref-ampoule-title"><i class="fas fa-syringe"></i> آمپول‌های موجود</div>' +
                    '<div class="qref-ampoule-list">' + ampoulesHTML + '</div>' +
                '</div>' +
                (compatible.length || incompatible.length ? (
                    '<div class="qref-compat-grid">' +
                        '<div class="qref-compat-col compatible">' +
                            '<div class="qref-compat-title"><i class="fas fa-check-circle"></i> سازگار (Y-Site)</div>' +
                            (compatible.length ? compatible.map(d => '<div class="qref-compat-item">' + d + '</div>').join('') : '<div class="qref-compat-item muted">—</div>') +
                        '</div>' +
                        '<div class="qref-compat-col incompatible">' +
                            '<div class="qref-compat-title"><i class="fas fa-times-circle"></i> ناسازگار</div>' +
                            (incompatible.length ? incompatible.map(d => '<div class="qref-compat-item">' + d + '</div>').join('') : '<div class="qref-compat-item muted">—</div>') +
                        '</div>' +
                    '</div>'
                ) : '') +
                (drug.cautions && drug.cautions.length ? (
                    '<div class="qref-warnings">' +
                        '<div class="qref-warnings-title"><i class="fas fa-exclamation-triangle"></i> هشدارها</div>' +
                        drug.cautions.slice(0, 3).map(c => '<div class="qref-warning-item">' + c + '</div>').join('') +
                    '</div>'
                ) : '') +
            '</div>';

        container.appendChild(item);
    });
    wireDrugLibrarySearch();
}

function wireDrugLibrarySearch() {
    const input = document.getElementById('librarySearch');
    const container = document.getElementById('drugLibrary');
    if (!input || !container || input.dataset.wired) return;
    input.dataset.wired = 'true';
    input.addEventListener('input', () => {
        const term = input.value.trim().toLowerCase();
        container.querySelectorAll('.qref-accordion-item').forEach(item => {
            const name = (item.dataset.drugName || '');
            item.style.display = (!term || name.includes(term)) ? '' : 'none';
        });
    });

    if (!container.dataset.delegated) {
        container.dataset.delegated = 'true';
        container.addEventListener('click', (e) => {
            if (e.target.closest('.qref-calc-btn')) return;
            const row = e.target.closest('.qref-row');
            if (row && row.dataset.bodyId) {
                toggleAccordionById(row.dataset.bodyId);
            }
        });
    }
}

// ============================================
// UTILITIES
// ============================================
function showToast(title, message, type = 'info') {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="toast-icon ${icons[type]}"></i>
        <div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div>
        <button class="toast-close">&times;</button>
    `;
    document.body.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

function updateStats() {}
function updateCalculationStats() { AppState.calculationsToday++; }

function saveCalculation(totalDrug, concentration, pumpRate, duration) {
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    history.unshift({
        id: Date.now(),
        drug: AppState.selectedDrug,
        drugName: drugDatabase[AppState.selectedDrug].persianName,
        dose: AppState.desiredDose,
        weight: AppState.patientWeight,
        totalDrug, concentration, pumpRate, duration,
        timestamp: new Date().toISOString()
    });
    if (history.length > 50) history.pop();
    localStorage.setItem('calculationHistory', JSON.stringify(history));
}

function loadHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    if (history.length === 0) { historyList.innerHTML = '<div class="empty-history">تاریخچه‌ای یافت نشد</div>'; return; }
    historyList.innerHTML = '';
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.title = 'برای بازیابی کلیک کنید';
        div.innerHTML = `
            <div class="history-drug">${item.drugName} <span class="history-restore-hint"><i class="fas fa-rotate-left"></i></span></div>
            <div class="history-details">
                <div>دوز: ${PersianNumbers.formatNumber(item.dose, 2)}</div>
                <div>سرعت پمپ: <span class="latin-inline">${PersianNumbers.formatNumber(item.pumpRate, 2)} cc/hr</span></div>
                <div class="history-time">${PersianNumbers.toLatin(new Date(item.timestamp).toLocaleDateString('fa-IR'))} — ${new Date(item.timestamp).toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
            <div class="history-restore-bar">بازیابی این محاسبه</div>
        `;
        div.addEventListener('click', () => {
            restoreFromHistory(item);
        });
        historyList.appendChild(div);
    });
}

// ============================================
// REVERSE MODE
// ============================================
function updateReverseUI() {
    const doseLabel = document.querySelector('#calculatorControls .control-group:last-of-type > label');
    const unitEl = document.getElementById('orderUnit');
    const calcBtnLabel = document.querySelector('#calculateBtn span');
    const reverseRow = document.querySelector('.reverse-toggle-row');
    if (AppState.reverseMode) {
        if (DOM.reverseIosToggle) DOM.reverseIosToggle.classList.add('on');
        if (reverseRow) reverseRow.classList.add('active');
        if (doseLabel) doseLabel.innerHTML = '<i class="fas fa-pump-medical"></i> سرعت پمپ';
        if (unitEl) unitEl.textContent = 'cc/hour';
        if (DOM.doctorOrder) DOM.doctorOrder.placeholder = '0';
        if (calcBtnLabel) calcBtnLabel.textContent = 'محاسبه دوز دریافتی';
    } else {
        if (DOM.reverseIosToggle) DOM.reverseIosToggle.classList.remove('on');
        if (reverseRow) reverseRow.classList.remove('active');
        if (doseLabel) doseLabel.innerHTML = '<i class="fas fa-file-medical-alt"></i> دوز درخواستی';
        if (DOM.doctorOrder) DOM.doctorOrder.placeholder = '0';
        if (calcBtnLabel) calcBtnLabel.textContent = 'محاسبه سرعت پمپ';
        const drug = drugDatabase[AppState.selectedDrug];
        if (drug && unitEl) {
            unitEl.textContent = AppState.useWeight && drug.weightBased?.active
                ? drug.weightBased.unit
                : (drug.weightBased?.nonWeightUnit || drug.standardUnit);
        }
    }
}

// ============================================
// DOSE RANGE INDICATOR
// ============================================
function updateDoseRangeIndicator() {
    const drug = drugDatabase[AppState.selectedDrug];
    if (!drug || !drug.typicalDoseRange || AppState.reverseMode) {
        if (DOM.doseRangeIndicator) DOM.doseRangeIndicator.style.display = 'none';
        return;
    }
    const raw = DOM.doctorOrder?.value;
    if (!raw || raw.trim() === '') {
        if (DOM.doseRangeIndicator) DOM.doseRangeIndicator.style.display = 'none';
        return;
    }
    const val = PersianNumbers.parseNumber(raw);
    if (isNaN(val) || val <= 0) {
        if (DOM.doseRangeIndicator) DOM.doseRangeIndicator.style.display = 'none';
        return;
    }
    const { min, max, unit } = drug.typicalDoseRange;
    let status, color, text;
    if (val < min * 0.8) {
        status = 'low'; color = '#60a5fa';
        text = `پایین‌تر از محدوده معمول (${min}–${max} ${unit})`;
    } else if (val >= min * 0.8 && val <= max * 1.1) {
        status = 'ok'; color = '#34d399';
        text = `در محدوده معمول (${min}–${max} ${unit})`;
    } else if (val > max * 1.1 && val <= max * 1.5) {
        status = 'warn'; color = '#fbbf24';
        text = `بالاتر از محدوده معمول — بررسی شود`;
    } else {
        status = 'danger'; color = '#f87171';
        text = `خارج از محدوده ایمن — دوز را بررسی کنید`;
    }
    if (DOM.doseRangeDot) DOM.doseRangeDot.style.background = color;
    if (DOM.doseRangeText) { DOM.doseRangeText.textContent = text; DOM.doseRangeText.style.color = color; }
    if (DOM.doseRangeIndicator) DOM.doseRangeIndicator.style.display = 'flex';
}

// ============================================
// REVERSE CALCULATION
// ============================================
function calculateReverse() {
    const drug = drugDatabase[AppState.selectedDrug];
    if (!drug) { showToast('خطا', 'ابتدا یک دارو انتخاب کنید', 'error'); return; }
    const ampoule = drug.ampouleOptions[AppState.currentAmpouleIndex];
    const pumpRateVal = PersianNumbers.parseNumber(DOM.doctorOrder.value);
    if (!pumpRateVal || isNaN(pumpRateVal) || pumpRateVal <= 0) {
        DOM.doctorOrder.style.borderColor = 'var(--danger)';
        showToast('خطا', 'لطفاً سرعت پمپ را وارد کنید (cc/hour)', 'error');
        DOM.doctorOrder.focus();
        return;
    }
    DOM.doctorOrder.style.borderColor = '';
    const totalDrug = AppState.ampouleCount * ampoule.strength;
    const concentration = totalDrug / AppState.solutionVolume;
    let derivedDose = pumpRateVal * concentration;
    const unit = AppState.useWeight && drug.weightBased?.active ? drug.weightBased.unit : (drug.weightBased?.nonWeightUnit || drug.standardUnit);
    const isPerMin = unit && unit.toLowerCase().includes('min');
    if (isPerMin) derivedDose = derivedDose / 60;
    const isPerKg = unit && unit.toLowerCase().includes('kg');
    const weight = AppState.useWeight ? (parseFloat(DOM.patientWeight?.dataset.numericValue) || 1) : 1;
    if (isPerKg && AppState.useWeight) derivedDose = derivedDose / weight;
    const duration = AppState.solutionVolume / pumpRateVal;
    displayResultsReverse(totalDrug, concentration, pumpRateVal, derivedDose, duration, ampoule.unit, unit);
    generateStepByStepGuide(drug, totalDrug, concentration, pumpRateVal, derivedDose);
    displayWarnings(drug);
    displayCompatibility(drug);
    if (AppState.settings.saveHistory) saveCalculation(totalDrug, concentration, pumpRateVal, duration);
}

function displayResultsReverse(totalDrug, concentration, pumpRate, derivedDose, duration, ampUnit, doseUnit) {
    const drug = drugDatabase[AppState.selectedDrug];
    DOM.totalDrugAmount.textContent = PersianNumbers.formatNumber(totalDrug, 0);
    DOM.totalDrugUnit.innerHTML = `<span class="latin-inline">${ampUnit}</span>`;
    let concentrationDisplay, concentrationUnitDisplay;
    if (drug.id === 'norepinephrine' || drug.id === 'dopamine' || drug.id === 'fentanyl' || drug.id === 'tng') {
        concentrationDisplay = PersianNumbers.formatNumber(concentration * 1000, 2);
        concentrationUnitDisplay = 'mcg/cc';
    } else {
        concentrationDisplay = PersianNumbers.formatNumber(concentration, 2);
        concentrationUnitDisplay = `${ampUnit}/cc`;
    }
    DOM.concentrationResult.textContent = concentrationDisplay;
    DOM.concentrationUnit.innerHTML = `<span class="latin-inline">${concentrationUnitDisplay}</span>`;
    DOM.pumpRateResult.textContent = PersianNumbers.formatNumber(pumpRate, 2);
    DOM.pumpRateUnit.innerHTML = `<span class="latin-inline">cc/hour</span>`;
    DOM.durationResult.textContent = PersianNumbers.formatNumber(duration, 1);
    DOM.durationUnit.innerHTML = `<span class="persian-inline">ساعت</span>`;
    const highlightEl = document.querySelector('.result-item-enhanced.highlight');
    const pumpRateCard = document.getElementById('pumpRateResult')?.closest('.result-item-enhanced');
    if (highlightEl && pumpRateCard) {
        highlightEl.classList.remove('highlight');
    }
    if (pumpRateCard) {
        pumpRateCard.classList.add('highlight');
        const labelEl = pumpRateCard.querySelector('.result-label-enhanced');
        const valueEl = pumpRateCard.querySelector('.result-value-enhanced');
        const unitEl = pumpRateCard.querySelector('.result-unit-enhanced');
        if (labelEl) labelEl.textContent = 'دوز دریافتی';
        if (valueEl) { valueEl.textContent = PersianNumbers.formatNumber(derivedDose, 2); valueEl.style.color = 'white'; }
        if (unitEl) { unitEl.innerHTML = `<span class="latin-inline">${doseUnit || ampUnit}</span>`; }
    }
    if (DOM.resultsSection) {
        DOM.resultsSection.classList.add('show');
        DOM.resultsSection.style.display = 'block';
        setTimeout(() => DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }
}

// ============================================
// RESTORE FROM HISTORY
// ============================================
function restoreFromHistory(item) {
    if (drugDatabase[item.drug]) {
        selectDrug(item.drug);
        if (DOM.historyModal) { DOM.historyModal.classList.remove('active'); document.body.classList.remove('no-scroll'); }
        setTimeout(() => {
            if (DOM.doctorOrder) {
                DOM.doctorOrder.value = item.dose;
                DOM.doctorOrder.dataset.numericValue = item.dose;
                updateDoseRangeIndicator();
            }
            if (item.weight && DOM.patientWeight && DOM.weightCheckbox) {
                DOM.weightCheckbox.checked = true;
                AppState.useWeight = true;
                DOM.patientWeight.disabled = false;
                if (DOM.weightIosToggle) DOM.weightIosToggle.classList.add('on');
                if (DOM.weightInputRow) DOM.weightInputRow.style.display = 'flex';
                DOM.patientWeight.value = item.weight;
                DOM.patientWeight.dataset.numericValue = item.weight;
            }
            showToast('بازیابی شد', `محاسبه ${item.drugName} بازیابی شد`, 'success');
            haptic(40);
        }, 300);
    } else {
        showToast('خطا', 'این دارو در پایگاه داده یافت نشد', 'error');
    }
}

// ============================================
// EXPORT HISTORY
// ============================================
function exportHistory() {
    const history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
    if (history.length === 0) {
        showToast('اطلاع', 'تاریخچه‌ای برای خروجی وجود ندارد', 'info');
        return;
    }
    const lines = ['MedCalc Pro — تاریخچه محاسبات', '='.repeat(40), ''];
    history.forEach((item, i) => {
        const d = new Date(item.timestamp);
        const dateStr = d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit'});
        lines.push(`#${i + 1} — ${item.drugName}`);
        lines.push(`تاریخ: ${dateStr}`);
        lines.push(`دوز: ${item.dose}`);
        lines.push(`سرعت پمپ: ${parseFloat(item.pumpRate).toFixed(2)} cc/hr`);
        lines.push(`غلظت: ${parseFloat(item.concentration).toFixed(2)}`);
        lines.push(`مدت: ${parseFloat(item.duration).toFixed(1)} ساعت`);
        if (item.weight) lines.push(`وزن بیمار: ${item.weight} kg`);
        lines.push('-'.repeat(30));
        lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FoxiMed-History-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('خروجی گرفته شد', `${history.length} محاسبه ذخیره شد`, 'success');
}

// ============================================
// DRIP RATE CALCULATION
// ============================================
function getDripFactor(volumeCC) {
    if (volumeCC <= 100) return { factor: 60, label: 'میکروست — ۶۰ قطره/mL' };
    return { factor: 20, label: 'ماکروست — ۲۰ قطره/mL' };
}

function displayDripRate(pumpRate, volumeCC) {
    if (!DOM.dripRateRow || !DOM.dripRateResult || !DOM.dripRateLabel) return;
    const { factor, label } = getDripFactor(volumeCC);
    const dropsPerMin = (pumpRate * factor) / 60;
    DOM.dripRateResult.textContent = PersianNumbers.formatNumber(dropsPerMin, 1);
    DOM.dripRateLabel.textContent = 'سرعت قطره (' + label + ')';
    DOM.dripRateRow.style.display = 'flex';
}

// ============================================
// TAB BAR HEIGHT MEASUREMENT
// ============================================
function measureTabBarHeight() {
    const tabBar = document.querySelector('.tab-bar');
    if (!tabBar) return;
    const rect = tabBar.getBoundingClientRect();
    const height = rect.height;
    if (height > 20) {
        document.documentElement.style.setProperty('--tab-bar-height', height + 'px');
        return true;
    }
    return false;
}

function setupTabBarMeasurement() {
    if (!measureTabBarHeight()) {
        const delays = [50, 150, 300, 600, 1000];
        delays.forEach(d => setTimeout(measureTabBarHeight, d));
    }
    window.addEventListener('resize', measureTabBarHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(measureTabBarHeight, 100);
        setTimeout(measureTabBarHeight, 400);
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setTimeout(measureTabBarHeight, 200);
    });
}

// ============================================
// OFFLINE INDICATOR
// ============================================
function setupOfflineIndicator() {
    const bar = document.createElement('div');
    bar.id = 'offlineBar';
    bar.className = 'offline-bar';
    bar.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>اتصال اینترنت قطع است — اپ به صورت آفلاین کار می‌کند</span>';
    bar.style.display = 'none';
    document.body.appendChild(bar);

    function update() {
        if (!navigator.onLine) {
            bar.style.display = 'flex';
            bar.classList.remove('online-flash');
        } else {
            bar.classList.add('online-flash');
            bar.innerHTML = '<i class="fas fa-wifi"></i> <span>اتصال برقرار شد</span>';
            setTimeout(() => { bar.style.display = 'none'; bar.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>اتصال اینترنت قطع است — اپ به صورت آفلاین کار می‌کند</span>'; }, 2500);
        }
    }

    window.addEventListener('offline', update);
    window.addEventListener('online', update);
    if (!navigator.onLine) update();
}

// ============================================
// REVERSE TOOLTIP
// ============================================
function showReverseTooltip() {
    const overlay = DOM.reverseTooltip;
    if (!overlay) return;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('visible'));
    const okBtn = document.getElementById('reverseTooltipOk');
    const close = () => {
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 350);
        localStorage.setItem('reverseTooltipSeen', 'true');
    };
    if (okBtn) okBtn.addEventListener('click', close, { once: true });
    overlay.querySelector('.reverse-tooltip-backdrop')?.addEventListener('click', close, { once: true });
}

// ============================================
// ONBOARDING
// ============================================
function setupOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    const doneBtn = document.getElementById('onboardingDoneBtn');
    const skipBtn = document.getElementById('onboardingSkip');
    if (!overlay) return;

    const seen = localStorage.getItem('onboardingSeen');
    if (!seen) {
        setTimeout(() => {
            overlay.style.display = 'flex';
            requestAnimationFrame(() => overlay.classList.add('visible'));
        }, 1200);
    }

    function close(dontShow) {
        overlay.classList.remove('visible');
        setTimeout(() => { overlay.style.display = 'none'; }, 400);
        if (dontShow) localStorage.setItem('onboardingSeen', 'true');
    }

    if (doneBtn) doneBtn.addEventListener('click', () => { haptic(30); close(true); });
    if (skipBtn) skipBtn.addEventListener('click', () => close(true));
    overlay.querySelector('.onboarding-backdrop')?.addEventListener('click', () => close(false));
}

// ============================================
// UPDATE AVAILABLE BANNER
// ============================================
let _pendingWorker = null;

function showUpdateBanner() {
    if (document.getElementById('updateBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.className = 'update-banner';
    banner.innerHTML =
        '<div class="update-banner-icon"><i class="fas fa-rocket"></i></div>' +
        '<div class="update-banner-text">' +
            '<div class="update-banner-title">نسخه جدید FoxiMed آماده است</div>' +
            '<div class="update-banner-sub">برای دریافت آخرین تغییرات بروزرسانی کنید</div>' +
        '</div>' +
        '<button class="update-banner-btn" id="doUpdateBtn"><i class="fas fa-download"></i> بروزرسانی</button>' +
        '<button class="update-banner-dismiss" id="dismissBannerBtn"><i class="fas fa-times"></i></button>';
    document.body.appendChild(banner);
    haptic(40);

    document.getElementById('doUpdateBtn').addEventListener('click', () => {
        if (_pendingWorker) {
            _pendingWorker.postMessage({ type: 'SKIP_WAITING' });
        } else {
            window.location.reload();
        }
    });
    document.getElementById('dismissBannerBtn').addEventListener('click', () => {
        banner.style.animation = 'none';
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-10px) scale(0.96)';
        banner.style.transition = 'all 0.25s ease';
        setTimeout(() => banner.remove(), 260);
    });
}

function setupUpdateDetection() {
    if (!('serviceWorker' in navigator)) return;

    let firstInstall = localStorage.getItem('sw_first_install') === null;
    if (firstInstall) {
        localStorage.setItem('sw_first_install', 'true');
    }

    navigator.serviceWorker.ready.then(reg => {
        if (reg.waiting && !firstInstall) {
            _pendingWorker = reg.waiting;
            showUpdateBanner();
        }
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !firstInstall) {
                    _pendingWorker = newWorker;
                    showUpdateBanner();
                }
            });
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (localStorage.getItem('sw_first_install') === 'true') {
            localStorage.setItem('sw_first_install', 'false');
        } else {
            setTimeout(() => window.location.reload(), 300);
        }
    });
}

// ============================================
// THEME COLOR SYSTEM
// ============================================
const THEMES = {
    default: {
        light: {
            '--primary':          '#667eea',
            '--primary-dark':     '#5a67d8',
            '--primary-light':    'rgba(102,126,234,0.1)',
            '--gradient-primary': 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
            '--secondary':        '#f093fb',
        },
        dark: {
            '--primary':          '#60a5fa',
            '--primary-dark':     '#3b82f6',
            '--primary-light':    'rgba(96,165,250,0.15)',
            '--gradient-primary': 'linear-gradient(135deg,#60a5fa 0%,#34d399 100%)',
            '--secondary':        '#c084fc',
        }
    },
    fox: {
        light: {
            '--primary':          '#ea580c',
            '--primary-dark':     '#c2410c',
            '--primary-light':    'rgba(234,88,12,0.1)',
            '--gradient-primary': 'linear-gradient(135deg,#f97316 0%,#dc2626 100%)',
            '--secondary':        '#fbbf24',
        },
        dark: {
            '--primary':          '#fb923c',
            '--primary-dark':     '#f97316',
            '--primary-light':    'rgba(251,146,60,0.15)',
            '--gradient-primary': 'linear-gradient(135deg,#fb923c 0%,#ef4444 100%)',
            '--secondary':        '#fcd34d',
        }
    },
    ocean: {
        light: {
            '--primary':          '#0284c7',
            '--primary-dark':     '#0369a1',
            '--primary-light':    'rgba(2,132,199,0.1)',
            '--gradient-primary': 'linear-gradient(135deg,#0ea5e9 0%,#0d9488 100%)',
            '--secondary':        '#38bdf8',
        },
        dark: {
            '--primary':          '#38bdf8',
            '--primary-dark':     '#0ea5e9',
            '--primary-light':    'rgba(56,189,248,0.15)',
            '--gradient-primary': 'linear-gradient(135deg,#38bdf8 0%,#2dd4bf 100%)',
            '--secondary':        '#7dd3fc',
        }
    },
    rose: {
        light: {
            '--primary':          '#e11d48',
            '--primary-dark':     '#be123c',
            '--primary-light':    'rgba(225,29,72,0.1)',
            '--gradient-primary': 'linear-gradient(135deg,#f43f5e 0%,#ec4899 100%)',
            '--secondary':        '#fb7185',
        },
        dark: {
            '--primary':          '#fb7185',
            '--primary-dark':     '#f43f5e',
            '--primary-light':    'rgba(251,113,133,0.15)',
            '--gradient-primary': 'linear-gradient(135deg,#fb7185 0%,#f472b6 100%)',
            '--secondary':        '#fda4af',
        }
    },
    forest: {
        light: {
            '--primary':          '#16a34a',
            '--primary-dark':     '#15803d',
            '--primary-light':    'rgba(22,163,74,0.1)',
            '--gradient-primary': 'linear-gradient(135deg,#22c55e 0%,#14b8a6 100%)',
            '--secondary':        '#4ade80',
        },
        dark: {
            '--primary':          '#4ade80',
            '--primary-dark':     '#22c55e',
            '--primary-light':    'rgba(74,222,128,0.15)',
            '--gradient-primary': 'linear-gradient(135deg,#4ade80 0%,#2dd4bf 100%)',
            '--secondary':        '#86efac',
        }
    }
};

function applyTheme(themeName) {
    const isDark = AppState.theme === 'dark';
    const palette = THEMES[themeName] || THEMES.default;
    const vars = isDark ? palette.dark : palette.light;
    const root = document.documentElement;
    const allVars = ['--primary','--primary-dark','--primary-light','--gradient-primary','--secondary'];
    if (themeName === 'default') {
        allVars.forEach(k => root.style.removeProperty(k));
    } else {
        Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    }
    const meta = document.getElementById('themeColorMeta');
    if (meta) meta.content = isDark ? '#1f2937' : '#ffffff';
    document.querySelectorAll('.theme-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.theme === themeName);
    });
    AppState.settings.colorTheme = themeName;
    saveSettings();
}

function setupThemePicker() {
    document.querySelectorAll('.theme-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic(25);
            applyTheme(btn.dataset.theme);
        });
    });
    const saved = AppState.settings.colorTheme || 'default';
    applyTheme(saved);
}

// ============================================
// ACCORDION
// ============================================
function toggleAccordion(headerBtn) {
    const item = headerBtn.closest('.accordion-item');
    const body = item.querySelector('.accordion-body');
    const chevron = headerBtn.querySelector('.accordion-chevron');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.accordion-item.open').forEach(openItem => {
        if (openItem !== item) {
            openItem.classList.remove('open');
            openItem.querySelector('.accordion-body').style.maxHeight = '0';
            openItem.querySelector('.accordion-body').style.padding = '0';
            openItem.querySelector('.accordion-chevron').style.transform = '';
        }
    });

    if (isOpen) {
        item.classList.remove('open');
        body.style.maxHeight = '0';
        body.style.padding = '0';
        chevron.style.transform = '';
    } else {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 2000 + 'px';
        body.style.padding = '12px 14px 14px';
        chevron.style.transform = 'rotate(180deg)';
        haptic(20);
        setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
    }
}

function refreshAccordion(el) {
    const body = el.closest('.accordion-body');
    if (body && body.closest('.accordion-item.open')) {
        body.style.maxHeight = body.scrollHeight + 2000 + 'px';
    }
}

function toggleAccordionById(bodyId) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    const item = body.closest('.accordion-item');
    if (!item) return;
    const chevronIcon = item.querySelector('.qref-chevron i');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.qref-accordion-item.open').forEach(openItem => {
        if (openItem !== item) {
            openItem.classList.remove('open');
            const b = openItem.querySelector('.accordion-body');
            if (b) { b.style.maxHeight = '0'; b.style.padding = '0'; }
            const c = openItem.querySelector('.qref-chevron i');
            if (c) c.style.transform = '';
        }
    });
    if (isOpen) {
        item.classList.remove('open');
        body.style.maxHeight = '0';
        body.style.padding = '0';
        if (chevronIcon) chevronIcon.style.transform = '';
    } else {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 1000 + 'px';
        body.style.padding = '0 12px 12px';
        if (chevronIcon) chevronIcon.style.transform = 'rotate(180deg)';
        haptic(20);
        setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
    }
}

// ============================================
// GCS CALCULATOR
// ============================================
const GCS_STATE = { eye: null, verbal: null, motor: null };

function setupGCS() {
    document.querySelectorAll('.gcs-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            haptic(25);
            const domain = btn.dataset.domain;
            const score = parseInt(btn.dataset.score);
            btn.closest('.gcs-btn-group').querySelectorAll('.gcs-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            GCS_STATE[domain] = score;
            const scoreMap = { eye: 'eScore', verbal: 'vScore', motor: 'mScore' };
            const scoreEl = document.getElementById(scoreMap[domain]);
            if (scoreEl) scoreEl.textContent = score;
            updateGCS();
        });
    });

    const resetBtn = document.getElementById('gcsResetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetGCS);
}

function updateGCS() {
    const { eye, verbal, motor } = GCS_STATE;
    if (eye === null || verbal === null || motor === null) return;

    const total = eye + verbal + motor;
    const totalEl = document.getElementById('gcsTotalScore');
    const formulaEl = document.getElementById('gcsTotalFormula');
    const badgeEl = document.getElementById('gcsSeverityBadge');
    const notesEl = document.getElementById('gcsNotes');
    const boxEl = document.getElementById('gcsResultBox');

    if (totalEl) totalEl.textContent = total;
    if (formulaEl) formulaEl.textContent = `E${eye} + V${verbal} + M${motor}`;

    let severity, badgeClass, notes;

    if (total >= 13) {
        severity = 'خفیف';
        badgeClass = 'gcs-badge-mild';
        notes = [
            'سطح هوشیاری خوب — بیمار پاسخ‌دهی مناسب دارد',
            'پایش مداوم علائم حیاتی توصیه می‌شود',
            'در صورت کاهش GCS بلافاصله گزارش دهید'
        ];
    } else if (total >= 9) {
        severity = 'متوسط';
        badgeClass = 'gcs-badge-moderate';
        notes = [
            'اختلال هوشیاری متوسط — نیاز به مراقبت ویژه دارد',
            'پایش مداوم راه هوایی ضروری است',
            'خطر آسپیراسیون وجود دارد — وضعیت بیمار را مدیریت کنید',
            'بررسی مکرر GCS هر ۱ تا ۲ ساعت'
        ];
    } else {
        severity = 'شدید — کُما';
        badgeClass = 'gcs-badge-severe';
        notes = [
            '⚠️ GCS ≤ ۸: آستانه اینتوباسیون — راه هوایی را ایمن کنید',
            'خطر بالای آسپیراسیون و انسداد راه هوایی',
            'بیمار نیاز به ICU و مراقبت‌های ویژه دارد',
            'پزشک را فوری مطلع کنید',
            'پایش ICP در صورت آسیب مغزی توصیه می‌شود'
        ];
    }

    if (badgeEl) {
        badgeEl.textContent = `شدت: ${severity}`;
        badgeEl.className = `gcs-severity-badge ${badgeClass}`;
    }

    if (notesEl) {
        notesEl.innerHTML = notes.map(n => `<div class="gcs-note-item"><i class="fas fa-circle-info"></i><span>${n}</span></div>`).join('');
    }

    if (boxEl) {
        boxEl.style.display = 'block';
        refreshAccordion(boxEl);
        setTimeout(() => boxEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }
    haptic(40);
}

function resetGCS() {
    GCS_STATE.eye = null;
    GCS_STATE.verbal = null;
    GCS_STATE.motor = null;
    document.querySelectorAll('.gcs-btn').forEach(b => b.classList.remove('active'));
    ['eScore','vScore','mScore'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
    const box = document.getElementById('gcsResultBox');
    if (box) box.style.display = 'none';
    haptic(30);
}

// ============================================
// BURNS / TBSA CALCULATOR
// ============================================

const BURNS_ADULT = {
    head: 4.5, head_b: 4.5,
    neck: 1,
    chest: 9, abdomen: 9,
    upper_back: 9, lower_back: 9,
    perineum: 1,
    buttocks: 2.5,
    l_upper_arm: 2, r_upper_arm: 2,
    l_upper_arm_b: 2, r_upper_arm_b: 2,
    l_lower_arm: 1.5, r_lower_arm: 1.5,
    l_lower_arm_b: 1.5, r_lower_arm_b: 1.5,
    l_hand: 1.25, r_hand: 1.25,
    l_thigh_f: 4.75, r_thigh_f: 4.75,
    l_thigh_b: 4.75, r_thigh_b: 4.75,
    l_leg_f: 3.5, r_leg_f: 3.5,
    l_leg_b: 3.5, r_leg_b: 3.5,
    l_foot: 1.75, r_foot: 1.75
};

const BURNS_PEDIATRIC = {
    head: 9.5, head_b: 9.5,
    neck: 1,
    chest: 9, abdomen: 9,
    upper_back: 9, lower_back: 9,
    perineum: 1,
    buttocks: 2.5,
    l_upper_arm: 2, r_upper_arm: 2,
    l_upper_arm_b: 2, r_upper_arm_b: 2,
    l_lower_arm: 1.5, r_lower_arm: 1.5,
    l_lower_arm_b: 1.5, r_lower_arm_b: 1.5,
    l_hand: 1.25, r_hand: 1.25,
    l_thigh_f: 3.25, r_thigh_f: 3.25,
    l_thigh_b: 3.25, r_thigh_b: 3.25,
    l_leg_f: 2.75, r_leg_f: 2.75,
    l_leg_b: 2.75, r_leg_b: 2.75,
    l_foot: 1.75, r_foot: 1.75
};

const BURNS_STATE = { selected: new Set(), ageMode: 'adult' };

function setupBurns() {
    document.querySelectorAll('.burns-region').forEach(region => {
        region.addEventListener('click', () => {
            haptic(20);
            const key = region.dataset.region;
            if (BURNS_STATE.selected.has(key)) {
                BURNS_STATE.selected.delete(key);
                document.querySelectorAll(`[data-region="${key}"]`).forEach(el => el.classList.remove('selected'));
            } else {
                BURNS_STATE.selected.add(key);
                document.querySelectorAll(`[data-region="${key}"]`).forEach(el => el.classList.add('selected'));
            }
            updateBurns();
        });
    });
}

function setBurnsAge(mode) {
    BURNS_STATE.ageMode = mode;
    const adultBtn = document.getElementById('burnsAdultBtn');
    const pedBtn = document.getElementById('burnsPedBtn');
    const noteEl = document.getElementById('burnsRuleNote');
    if (adultBtn) adultBtn.classList.toggle('active', mode === 'adult');
    if (pedBtn) pedBtn.classList.toggle('active', mode === 'pediatric');
    if (noteEl) noteEl.textContent = mode === 'adult' ? 'قانون نُه — بزرگسال' : 'Lund-Browder — کودک (تقریبی)';
    updateBurns();
    haptic(25);
}

function updateBurns() {
    const table = BURNS_STATE.ageMode === 'adult' ? BURNS_ADULT : BURNS_PEDIATRIC;
    let total = 0;
    BURNS_STATE.selected.forEach(key => { total += (table[key] || 0); });
    total = Math.min(total, 100);

    const tbsaEl = document.getElementById('burnsTBSA');
    const resultBox = document.getElementById('burnsResultBox');
    const chipsEl = document.getElementById('burnsChips');
    const notesEl = document.getElementById('burnsNotes');

    if (chipsEl) {
        if (BURNS_STATE.selected.size === 0) {
            chipsEl.innerHTML = '<span class="burns-chips-placeholder">هیچ ناحیه‌ای انتخاب نشده</span>';
        } else {
            const labels = [];
            BURNS_STATE.selected.forEach(key => {
                const el = document.querySelector(`[data-region="${key}"]`);
                if (el) labels.push(el.dataset.label);
            });
            chipsEl.innerHTML = labels.map(l => `<span class="burns-chip">${l}</span>`).join('');
        }
    }

    if (BURNS_STATE.selected.size === 0) {
        if (resultBox) resultBox.style.display = 'none';
        refreshAccordion(chipsEl || document.getElementById('burnsChips'));
        return;
    }

    if (tbsaEl) tbsaEl.textContent = total.toFixed(1) + '%';

    let notes = [];
    if (total < 10) {
        notes = ['سوختگی محدود — مراقبت سرپایی ممکن است کافی باشد', 'درصورت درگیری صورت، دست یا پرینه: ارجاع به مرکز سوختگی'];
    } else if (total < 20) {
        notes = ['سوختگی متوسط — بستری ضروری است', 'احیاء مایع را شروع کنید (فرمول Parkland)', 'پایش ادرار ساعتی توصیه می‌شود (۰.۵ cc/kg/hr)'];
    } else if (total < 40) {
        notes = ['⚠️ سوختگی وسیع — ICU ضروری است', 'فوری فرمول Parkland را شروع کنید', '۵۰٪ مایع اول ۸ ساعت، ۵۰٪ باقی ۱۶ ساعت', 'ارجاع فوری به مرکز تخصصی سوختگی'];
    } else {
        notes = ['🚨 سوختگی حیاتی — خطر جدی برای بیمار', 'انتقال فوری به مرکز تخصصی سوختگی', 'احیاء مایع تهاجمی فوری', 'پایش راه هوایی — احتمال سوختگی استنشاقی را بررسی کنید'];
    }

    if (notesEl) {
        notesEl.innerHTML = notes.map(n => `<div class="burns-note-item"><i class="fas fa-circle-info"></i><span>${n}</span></div>`).join('');
    }

    if (resultBox) {
        resultBox.style.display = 'block';
        refreshAccordion(resultBox);
    }

    updateParkland();
}

function updateParkland() {
    const weightEl = document.getElementById('burnsWeight');
    const parklandEl = document.getElementById('parklandResult');
    const parklandRow = document.getElementById('parklandRow');
    if (!weightEl || !parklandEl || !parklandRow) return;

    const weight = parseFloat(weightEl.value);
    const table = BURNS_STATE.ageMode === 'adult' ? BURNS_ADULT : BURNS_PEDIATRIC;
    let total = 0;
    BURNS_STATE.selected.forEach(key => { total += (table[key] || 0); });
    total = Math.min(total, 100);

    if (!weight || weight <= 0 || BURNS_STATE.selected.size === 0) {
        parklandRow.style.display = 'none';
        return;
    }

    const totalFluid = 4 * weight * total;
    const first8h = totalFluid / 2;
    const next16h = totalFluid / 2;
    parklandEl.innerHTML = `<span dir="ltr" style="display:inline-block; unicode-bidi:isolate;">${totalFluid.toFixed(0)} mL</span>`;
parklandRow.querySelector('.burns-result-label').innerHTML = 
    `Parkland: <span dir="ltr" style="display:inline-block; unicode-bidi:isolate;">${totalFluid.toFixed(0)} mL</span> (اول ۸ ساعت: <span dir="ltr">${first8h.toFixed(0)} mL</span> | ۱۶ ساعت باقی: <span dir="ltr">${next16h.toFixed(0)} mL</span>)`;

function resetBurns() {
    BURNS_STATE.selected.clear();
    document.querySelectorAll('.burns-region').forEach(el => el.classList.remove('selected'));
    const chipsEl = document.getElementById('burnsChips');
    if (chipsEl) chipsEl.innerHTML = '<span class="burns-chips-placeholder">هیچ ناحیه‌ای انتخاب نشده</span>';
    const resultBox = document.getElementById('burnsResultBox');
    if (resultBox) resultBox.style.display = 'none';
    const weightEl = document.getElementById('burnsWeight');
    if (weightEl) weightEl.value = '';
    haptic(30);
}

// ============================================
// GLOBALS
// ============================================
window.selectDrug = selectDrug;
window.switchTab = switchTab;
window.calculateManualInfusion = calculateManualInfusion;
window.convertElectrolyte = convertElectrolyte;
window.convertElectrolyteLive = convertElectrolyteLive;
window.convertUnitsLive = convertUnitsLive;
window.convertPercentageLive = convertPercentageLive;
window.calculateDripRateLive = calculateDripRateLive;
window.convertTempLive = convertTempLive;
window.convertWeightLive = convertWeightLive;
window.convertPercentage = convertPercentage;
window.convertUnits = convertUnits;
window.calculateDripRate = calculateDripRate;
window.calculateBMI = calculateBMI;
window.calculateBSA = calculateBSA;
window.calculateIBW = calculateIBW;
window.calculateCrCl = calculateCrCl;
window.checkCompatibility = checkCompatibility;
window.calculateDose = calculateDose;
window.TextDirection = TextDirection;
window.PersianNumbers = PersianNumbers;
window.exportHistory = exportHistory;
window.toggleAccordion = toggleAccordion;
window.applyTheme = applyTheme;
window.showUpdateBanner = showUpdateBanner;
window.toggleAccordionById = toggleAccordionById;
window.setBurnsAge = setBurnsAge;
window.resetBurns = resetBurns;
window.updateParkland = updateParkland;
window.restoreFromHistory = restoreFromHistory;
window.updateDoseRangeIndicator = updateDoseRangeIndicator;

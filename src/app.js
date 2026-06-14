/**
 * UangNih - Core Application Logic
 * Manages State, UI Interactions, Web Speech API, Firebase Sync, and SVG Charts
 */

// Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1iwhmGbuVPaA-OEW_hQvKLRH7LKQBsh4",
  authDomain: "catat-keuangan3.firebaseapp.com",
  projectId: "catat-keuangan3",
  storageBucket: "catat-keuangan3.firebasestorage.app",
  messagingSenderId: "711474608759",
  appId: "1:711474608759:web:20f49fd6a038fe54f56472",
  measurementId: "G-4W4MLB3LRK"
};

class UangNihApp {
  constructor() {
    // Application State
    this.transactions = [];
    this.user = null; // Logged in user info { uid, displayName, email, photoURL }
    this.isDemoMode = false; // False by default to connect to the real Firebase config
    this.startingBalance = 0;
    this.recurringBills = [];

    // UI State
    this.currentView = 'home';
    this.activeFilter = 'all';
    this.searchQuery = '';

    // Date view for statistics (defaults to current month: June 2026)
    this.currentDate = new Date(2026, 5, 14); // June 14, 2026
    this.activeChart = 'categories';

    // Speech Recognition properties
    this.recognition = null;
    this.isRecording = false;

    // Firebase App references
    this.firebaseApp = null;
    this.firestoreDb = null;
    this.firebaseAuth = null;
    this.firestoreUnsubscribe = null;

    // DOM Elements
    this.initDOMElements();

    // Bind Event Listeners
    this.bindEvents();

    // Load configurations and initialize
    this.initApp();
  }

  initDOMElements() {
    this.el = {
      // Pages
      pageHome: document.getElementById('page-home'),
      pageStats: document.getElementById('page-stats'),
      appContent: document.getElementById('app-content'),

      // Nav buttons
      navHome: document.getElementById('nav-btn-home'),
      navStats: document.getElementById('nav-btn-stats'),

      // Header & banners
      btnProfile: document.getElementById('btn-profile'),
      profileIcon: document.getElementById('profile-icon'),
      profileAvatar: document.getElementById('profile-avatar'),
      syncIndicator: document.getElementById('sync-indicator'),
      offlineBanner: document.getElementById('offline-banner'),
      btnBannerLogin: document.getElementById('btn-banner-login'),

      // Summary Dashboard
      totalBalance: document.getElementById('total-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpense: document.getElementById('total-expense'),

      // Quick NLP Input
      nlpInput: document.getElementById('nlp-input'),
      btnMic: document.getElementById('btn-mic'),
      btnSubmitNlp: document.getElementById('btn-submit-nlp'),

      // Transactions Riwayat
      btnSearchToggle: document.getElementById('btn-search-toggle'),
      searchBarContainer: document.getElementById('search-bar-container'),
      searchInput: document.getElementById('search-input'),
      filterChips: document.querySelectorAll('.filter-chips .chip'),
      transactionList: document.getElementById('transaction-list'),
      transactionsSkeleton: document.getElementById('transactions-skeleton'),

      // Stats Elements
      btnPrevMonth: document.getElementById('btn-prev-month'),
      btnNextMonth: document.getElementById('btn-next-month'),
      currentMonthDisplay: document.getElementById('current-month-display'),
      monthIncome: document.getElementById('month-income'),
      monthExpense: document.getElementById('month-expense'),
      chartTabs: document.querySelectorAll('.chart-tab'),
      chartCategoriesContainer: document.getElementById('chart-categories-container'),
      chartTrendContainer: document.getElementById('chart-trend-container'),
      donutChart: document.getElementById('donut-chart'),
      donutTotal: document.getElementById('donut-total'),
      categoryLegend: document.getElementById('category-legend'),
      barChart: document.getElementById('bar-chart'),
      categoryBreakdownList: document.getElementById('category-breakdown-list'),

      // Voice Modal
      modalVoice: document.getElementById('modal-voice'),
      btnCloseVoice: document.getElementById('btn-close-voice'),
      voiceTranscriptText: document.getElementById('voice-transcript-text'),
      btnVoiceCancel: document.getElementById('btn-voice-cancel'),
      btnVoiceDone: document.getElementById('btn-voice-done'),

      // Preview Drawer
      drawerPreview: document.getElementById('drawer-preview'),
      btnClosePreview: document.getElementById('btn-close-preview'),
      previewForm: document.getElementById('preview-form'),
      previewTypeExpense: document.getElementById('btn-type-expense'),
      previewTypeIncome: document.getElementById('btn-type-income'),
      previewDesc: document.getElementById('preview-desc'),
      previewAmount: document.getElementById('preview-amount'),
      previewCategory: document.getElementById('preview-category'),
      previewDate: document.getElementById('preview-date'),
      btnPreviewCancel: document.getElementById('btn-preview-cancel'),
      btnPreviewSave: document.getElementById('btn-preview-save'),

      // Detail Drawer
      drawerDetail: document.getElementById('drawer-detail'),
      btnCloseDetail: document.getElementById('btn-close-detail'),
      btnDetailDeleteAction: document.getElementById('btn-detail-delete-action'),
      btnDetailCloseAction: document.getElementById('btn-detail-close-action'),

      // Profile Modal
      modalProfile: document.getElementById('modal-profile'),
      btnCloseProfile: document.getElementById('btn-close-profile'),
      userInfoUnlogged: document.getElementById('user-info-unlogged'),
      btnLoginGoogle: document.getElementById('btn-login-google'),
      userInfoLogged: document.getElementById('user-info-logged'),
      userAvatar: document.getElementById('user-avatar'),
      userDisplayName: document.getElementById('user-display-name'),
      userEmail: document.getElementById('user-email'),
      btnLogout: document.getElementById('btn-logout'),

      // Backup Settings
      btnExportData: document.getElementById('btn-export-data'),
      btnImportTrigger: document.getElementById('btn-import-trigger'),
      fileImport: document.getElementById('file-import'),


      btnFab: document.getElementById('btn-fab'),

      // Balance Modal
      btnEditBalance: document.getElementById('btn-edit-balance'),
      modalBalance: document.getElementById('modal-balance'),
      btnCloseBalance: document.getElementById('btn-close-balance'),
      btnBalanceCancel: document.getElementById('btn-balance-cancel'),
      balanceForm: document.getElementById('balance-form'),
      inputStartingBalance: document.getElementById('input-starting-balance'),

      // Recurring Bills elements
      btnOpenAddBill: document.getElementById('btn-add-bill-trigger'),
      modalAddBill: document.getElementById('modal-add-bill'),
      btnCloseAddBill: document.getElementById('btn-close-add-bill'),
      btnAddBillCancel: document.getElementById('btn-add-bill-cancel'),
      addBillForm: document.getElementById('add-bill-form'),
      billName: document.getElementById('bill-name'),
      billAmount: document.getElementById('bill-amount'),
      billDay: document.getElementById('bill-day'),
      recurringBillsList: document.getElementById('recurring-bills-list'),
    };
  }

  bindEvents() {
    // Page navigation
    this.el.navHome.addEventListener('click', () => this.switchView('home'));
    this.el.navStats.addEventListener('click', () => this.switchView('stats'));

    // Modals & Drawers Toggles
    this.el.btnProfile.addEventListener('click', () => this.showModal('profile'));
    this.el.btnCloseProfile.addEventListener('click', () => this.hideModal('profile'));
    this.el.btnBannerLogin.addEventListener('click', () => this.showModal('profile'));

    // Search Toggle
    this.el.btnSearchToggle.addEventListener('click', () => {
      this.el.searchBarContainer.classList.toggle('hidden');
      if (!this.el.searchBarContainer.classList.contains('hidden')) {
        this.el.searchInput.focus();
      } else {
        this.el.searchInput.value = '';
        this.searchQuery = '';
        this.renderTransactions();
      }
    });

    this.el.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderTransactions();
    });

    // Filter Chips
    this.el.filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.el.filterChips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.activeFilter = e.target.getAttribute('data-filter');
        this.renderTransactions();
      });
    });

    // NLP Input
    this.el.btnSubmitNlp.addEventListener('click', () => this.handleNLPInput());
    this.el.nlpInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleNLPInput();
    });

    // Mic (Voice Recognition)
    this.el.btnMic.addEventListener('click', () => this.startVoiceRecognition());
    this.el.btnCloseVoice.addEventListener('click', () => this.stopVoiceRecognition(true));
    this.el.btnVoiceCancel.addEventListener('click', () => this.stopVoiceRecognition(true));
    this.el.btnVoiceDone.addEventListener('click', () => this.stopVoiceRecognition(false));

    // Preview Drawer Action Buttons
    this.el.btnClosePreview.addEventListener('click', () => this.hideDrawer('preview'));
    this.el.btnPreviewCancel.addEventListener('click', () => this.hideDrawer('preview'));
    this.el.previewTypeExpense.addEventListener('click', () => this.setPreviewType('expense'));
    this.el.previewTypeIncome.addEventListener('click', () => this.setPreviewType('income'));
    this.el.previewForm.addEventListener('submit', () => this.savePreviewTransaction());

    // Detail Drawer Action Buttons
    this.el.btnCloseDetail.addEventListener('click', () => this.hideDrawer('detail'));
    this.el.btnDetailCloseAction.addEventListener('click', () => this.hideDrawer('detail'));
    this.el.btnDetailDeleteAction.addEventListener('click', () => {
      const activeId = this.el.btnDetailDeleteAction.getAttribute('data-id');
      if (activeId) {
        this.deleteTransaction(activeId);
        this.hideDrawer('detail');
      }
    });

    // Month Selector for Stats
    this.el.btnPrevMonth.addEventListener('click', () => this.changeMonth(-1));
    this.el.btnNextMonth.addEventListener('click', () => this.changeMonth(1));

    // Stats Chart Tabs
    this.el.chartTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.el.chartTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.activeChart = e.target.getAttribute('data-chart');
        this.switchChart();
      });
    });

    // Auth & Google Login
    this.el.btnLoginGoogle.addEventListener('click', () => this.loginGoogle());
    this.el.btnLogout.addEventListener('click', () => this.logout());

    // Import/Export
    this.el.btnExportData.addEventListener('click', () => this.exportTransactionsJSON());
    this.el.btnImportTrigger.addEventListener('click', () => this.el.fileImport.click());
    this.el.fileImport.addEventListener('change', (e) => this.importTransactionsJSON(e));



    // FAB Button Click
    this.el.btnFab.addEventListener('click', () => this.handleFabClick());

    // Balance Edit Buttons
    this.el.btnEditBalance.addEventListener('click', () => this.showBalanceModal());
    this.el.btnCloseBalance.addEventListener('click', () => this.hideModal('balance'));
    this.el.btnBalanceCancel.addEventListener('click', () => this.hideModal('balance'));
    this.el.balanceForm.addEventListener('submit', () => this.saveStartingBalance());

    // Recurring Bills Edit Buttons
    this.el.btnOpenAddBill.addEventListener('click', () => this.showAddBillModal());
    this.el.btnCloseAddBill.addEventListener('click', () => this.hideModal('add-bill'));
    this.el.btnAddBillCancel.addEventListener('click', () => this.hideModal('add-bill'));
    this.el.addBillForm.addEventListener('submit', () => this.saveRecurringBill());
  }

  // APP INITIALIZATION
  initApp() {
    // Load local auth session from previous login if stored
    const storedUser = localStorage.getItem('uangnih_user_session');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    this.isDemoMode = false;

    // Initialize Firebase Auth / DB
    this.initFirebase();

    // Check voice recognition compatibility
    this.initVoiceRecognition();

    // Sync UI elements
    this.updateUserUI();
    this.switchView('home');
  }

  // ================= NAVIGATION =================
  switchView(view) {
    this.currentView = view;
    this.el.navHome.classList.toggle('active', view === 'home');
    this.el.navStats.classList.toggle('active', view === 'stats');

    this.el.pageHome.classList.toggle('active', view === 'home');
    this.el.pageStats.classList.toggle('active', view === 'stats');

    if (this.el.appContent) {
      if (view === 'home') {
        this.el.appContent.style.transform = 'translateX(0%)';
      } else {
        this.el.appContent.style.transform = 'translateX(-50%)';
      }
    }

    if (view === 'stats') {
      this.updateStatsView();
    }
  }

  showModal(modalId) {
    if (modalId === 'profile') {
      this.el.modalProfile.classList.add('active');
      this.renderRecurringBills();
    }
    if (modalId === 'voice') this.el.modalVoice.classList.add('active');
    if (modalId === 'balance') this.el.modalBalance.classList.add('active');
    if (modalId === 'add-bill') this.el.modalAddBill.classList.add('active');
  }

  hideModal(modalId) {
    if (modalId === 'profile') this.el.modalProfile.classList.remove('active');
    if (modalId === 'voice') this.el.modalVoice.classList.remove('active');
    if (modalId === 'balance') this.el.modalBalance.classList.remove('active');
    if (modalId === 'add-bill') this.el.modalAddBill.classList.remove('active');
  }

  showDrawer(drawerId) {
    if (drawerId === 'preview') this.el.drawerPreview.classList.add('active');
    if (drawerId === 'detail') this.el.drawerDetail.classList.add('active');
  }

  hideDrawer(drawerId) {
    if (drawerId === 'preview') this.el.drawerPreview.classList.remove('active');
    if (drawerId === 'detail') this.el.drawerDetail.classList.remove('active');
  }

  handleFabClick() {
    // Set dynamic drawer title
    const drawerTitle = document.querySelector('#drawer-preview .drawer-header h3');
    if (drawerTitle) {
      drawerTitle.textContent = 'Tambah Transaksi';
    }

    // Reset fields to empty/default values
    this.setPreviewType('expense');
    this.el.previewDesc.value = '';
    this.el.previewAmount.value = '';
    this.el.previewCategory.value = 'Lain-lain';
    this.el.previewDate.value = Parser.formatDate(new Date());

    this.showDrawer('preview');

    // Auto focus description field
    setTimeout(() => this.el.previewDesc.focus(), 300);
  }

  showBalanceModal() {
    this.el.inputStartingBalance.value = this.startingBalance;
    this.showModal('balance');
    setTimeout(() => this.el.inputStartingBalance.focus(), 300);
  }

  saveStartingBalance() {
    const val = parseInt(this.el.inputStartingBalance.value) || 0;
    this.startingBalance = val;

    // Save starting balance depending on mode
    if (this.user && !this.isDemoMode) {
      // Save starting balance to Firestore
      this.firestoreDb.collection('users')
        .doc(this.user.uid)
        .set({ startingBalance: val }, { merge: true })
        .catch(err => {
          console.error("Gagal menyimpan Saldo Awal ke Firestore:", err);
        });
    } else {
      // Local or Demo storage key
      const storageKey = this.user
        ? `uangnih_demo_starting_balance_${this.user.uid}`
        : 'uangnih_starting_balance';
      localStorage.setItem(storageKey, val);
    }

    this.hideModal('balance');
    this.renderDashboard();
  }

  showAddBillModal() {
    this.el.billName.value = '';
    this.el.billAmount.value = '';
    this.el.billDay.value = new Date().getDate();
    this.showModal('add-bill');
    setTimeout(() => this.el.billName.focus(), 300);
  }

  saveRecurringBill() {
    const name = this.el.billName.value.trim();
    const amount = parseInt(this.el.billAmount.value) || 0;
    const day = parseInt(this.el.billDay.value) || 1;

    if (!name || amount <= 0 || day < 1 || day > 31) {
      alert("Harap lengkapi semua bidang dengan nilai yang valid.");
      return;
    }

    const bill = {
      name,
      amount,
      dayOfMonth: day,
      category: 'Tagihan'
    };

    if (this.user && !this.isDemoMode) {
      // Save to real Firestore
      this.firestoreDb.collection('users')
        .doc(this.user.uid)
        .collection('recurring_bills')
        .add(bill)
        .then(() => {
          this.hideModal('add-bill');
        })
        .catch(err => {
          console.error("Gagal menambahkan tagihan ke Firestore:", err);
          alert("Error: " + err.message);
        });
    } else {
      // Local/Demo mock
      const billsKey = this.user
        ? `uangnih_demo_recurring_bills_${this.user.uid}`
        : 'uangnih_recurring_bills';

      bill.id = 'bill_' + Date.now() + Math.random().toString(36).substr(2, 5);
      this.recurringBills.push(bill);
      localStorage.setItem(billsKey, JSON.stringify(this.recurringBills));

      this.hideModal('add-bill');
      this.renderRecurringBills();
      this.checkAndApplyRecurringBills();
    }
  }

  deleteRecurringBill(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus tagihan bulanan ini? Pencatatan otomatis bulanan untuk tagihan ini akan dihentikan.")) return;

    if (this.user && !this.isDemoMode) {
      // Delete from real Firestore
      this.firestoreDb.collection('users')
        .doc(this.user.uid)
        .collection('recurring_bills')
        .doc(id)
        .delete()
        .catch(err => {
          console.error("Gagal menghapus tagihan dari Firestore:", err);
          alert("Error: " + err.message);
        });
    } else {
      // Local/Demo mock
      const billsKey = this.user
        ? `uangnih_demo_recurring_bills_${this.user.uid}`
        : 'uangnih_recurring_bills';

      this.recurringBills = this.recurringBills.filter(b => b.id !== id);
      localStorage.setItem(billsKey, JSON.stringify(this.recurringBills));

      this.renderRecurringBills();
    }
  }

  renderRecurringBills() {
    let listHTML = '';

    if (this.recurringBills.length === 0) {
      listHTML = '<div class="empty-bills">Belum ada tagihan rutin bulanan.</div>';
      this.el.recurringBillsList.innerHTML = listHTML;
      return;
    }

    this.recurringBills.forEach(b => {
      listHTML += `
        <div class="bill-item" id="bill-${b.id}">
          <div class="bill-info">
            <span class="bill-title">${b.name}</span>
            <span class="bill-meta">
              Rp ${b.amount.toLocaleString('id-ID')} <span class="bullet">•</span> Setiap tgl ${b.dayOfMonth}
            </span>
          </div>
          <button class="btn-delete-bill" type="button" onclick="app.deleteRecurringBill('${b.id}')" title="Hapus">
            <span class="material-icons-round" style="font-size: 16px;">delete_outline</span>
          </button>
        </div>
      `;
    });

    this.el.recurringBillsList.innerHTML = listHTML;
  }

  checkAndApplyRecurringBills() {
    if (this.recurringBills.length === 0) return;

    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();
    const curDay = today.getDate();

    let countApplied = 0;

    this.recurringBills.forEach(b => {
      // Clamp scheduled day to month length (e.g. 31st feb -> 28th feb)
      const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDate();
      const scheduledDay = Math.min(b.dayOfMonth, lastDayOfMonth);

      // Apply if today is past or equal to scheduled day
      if (curDay >= scheduledDay) {
        // Check if there is already a transaction for this bill in the current month
        const alreadyLogged = this.transactions.some(t => {
          const tDate = new Date(t.date);
          const sameMonth = tDate.getMonth() === curMonth && tDate.getFullYear() === curYear;
          const sameBill = t.recurringBillId === b.id || (t.description === `[Tagihan] ${b.name}` && t.amount === b.amount);
          return sameMonth && sameBill;
        });

        if (!alreadyLogged) {
          // Auto create transaction
          const transDateStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-${String(scheduledDay).padStart(2, '0')}`;

          const newTrans = {
            type: 'expense',
            description: `[Tagihan] ${b.name}`,
            amount: b.amount,
            category: 'Tagihan',
            date: transDateStr,
            recurringBillId: b.id,
            time: '00:00'
          };

          this.saveTransaction(newTrans);
          countApplied++;
        }
      }
    });

    if (countApplied > 0) {
      console.log(`Auto-applied ${countApplied} recurring bills.`);
    }
  }

  // ================= FIREBASE LOGIC =================
  initFirebase() {
    // Reset previous listeners
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }

    try {
      // Prevent re-initializing the same app if already initialized
      if (firebase.apps.length === 0) {
        this.firebaseApp = firebase.initializeApp(firebaseConfig);
      } else {
        this.firebaseApp = firebase.app();
      }

      this.firestoreDb = firebase.firestore();
      this.firebaseAuth = firebase.auth();

      // Listen to Auth State
      this.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          this.user = {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          };
          localStorage.setItem('uangnih_user_session', JSON.stringify(this.user));
          this.el.syncIndicator.className = 'sync-dot online';
          this.el.syncIndicator.title = 'Terhubung dengan Firebase';
          this.setupFirebaseSyncListener();
        } else {
          this.user = null;
          localStorage.removeItem('uangnih_user_session');
          this.el.syncIndicator.className = 'sync-dot offline';
          this.el.syncIndicator.title = 'Offline (Penyimpanan Lokal)';
          this.loadTransactions();
        }
        this.updateUserUI();
      });

    } catch (err) {
      console.error('Gagal menginisialisasi Firebase:', err);
      this.isDemoMode = true;
      this.loadTransactions();
    }
  }

  setupFirebaseSyncListener() {
    if (!this.user || !this.firestoreDb) return;

    this.showSkeletonLoading(true);
    this.el.syncIndicator.className = 'sync-dot syncing';

    // Fetch user doc once to get starting balance
    this.firestoreDb.collection('users').doc(this.user.uid).get().then(doc => {
      if (doc.exists && doc.data().startingBalance !== undefined) {
        this.startingBalance = doc.data().startingBalance;
      } else {
        this.startingBalance = 0;
      }
      this.renderDashboard();
    }).catch(err => {
      console.error("Gagal memuat Saldo Awal dari Firestore:", err);
    });

    // Listen to Firestore recurring bills
    this.firestoreDb.collection('users').doc(this.user.uid).collection('recurring_bills')
      .onSnapshot(snapshot => {
        this.recurringBills = [];
        snapshot.forEach(doc => {
          this.recurringBills.push({
            id: doc.id,
            ...doc.data()
          });
        });
        this.renderRecurringBills();
        this.checkAndApplyRecurringBills();
      });

    this.firestoreUnsubscribe = this.firestoreDb.collection('users')
      .doc(this.user.uid)
      .collection('transactions')
      .orderBy('date', 'desc')
      .onSnapshot((snapshot) => {
        this.transactions = [];
        snapshot.forEach((doc) => {
          this.transactions.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Cache in LocalStorage just in case they lose connection later
        localStorage.setItem(`uangnih_cache_${this.user.uid}`, JSON.stringify(this.transactions));

        this.showSkeletonLoading(false);
        this.el.syncIndicator.className = 'sync-dot online';

        // Render view
        this.renderDashboard();
        this.renderTransactions();
        if (this.currentView === 'stats') this.updateStatsView();
      }, (error) => {
        console.error("Firebase read error:", error);
        this.showSkeletonLoading(false);
        // Fallback to cache on error
        const cached = localStorage.getItem(`uangnih_cache_${this.user.uid}`);
        if (cached) {
          this.transactions = JSON.parse(cached);
          this.renderDashboard();
          this.renderTransactions();
        }
      });
  }



  // ================= GOOGLE LOGIN FLOW =================
  loginGoogle() {
    this.hideModal('profile');

    if (this.isDemoMode) {
      // SIMULATE Google Sign-in for seamless testing out-of-the-box
      this.showSkeletonLoading(true);

      setTimeout(() => {
        const mockName = prompt("Masukkan nama Anda untuk Demo Mode:", "Budi Santoso");
        if (!mockName) {
          this.showSkeletonLoading(false);
          return;
        }

        this.user = {
          uid: 'demo_user_123',
          displayName: mockName,
          email: `${mockName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
        };

        localStorage.setItem('uangnih_user_session', JSON.stringify(this.user));
        this.el.syncIndicator.className = 'sync-dot online';
        this.el.syncIndicator.title = 'Terhubung dengan Demo Cloud Sync';

        // Load data from mock cloud storage
        this.loadTransactions();
        this.showSkeletonLoading(false);
        this.updateUserUI();
      }, 1000);

    } else {
      // REAL Google Authentication
      const provider = new firebase.auth.GoogleAuthProvider();
      this.firebaseAuth.signInWithPopup(provider)
        .then(() => {
          // Handled by onAuthStateChanged
          this.showModal('profile');
        })
        .catch(err => {
          console.error("Gagal Google Login:", err);
          alert("Gagal melakukan login Google: " + err.message);
        });
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('uangnih_user_session');

    if (this.isDemoMode) {
      this.el.syncIndicator.className = 'sync-dot offline';
      this.el.syncIndicator.title = 'Offline (Penyimpanan Lokal)';
      this.loadTransactions();
      this.updateUserUI();
    } else {
      this.firebaseAuth.signOut().then(() => {
        // Handled by onAuthStateChanged
        this.updateUserUI();
      });
    }
  }

  updateUserUI() {
    if (this.user) {
      // Logged in UI state
      this.el.offlineBanner.classList.add('hidden');
      this.el.userInfoUnlogged.classList.add('hidden');
      this.el.userInfoLogged.classList.remove('hidden');

      this.el.userAvatar.src = this.user.photoURL || 'https://via.placeholder.com/150';
      this.el.userDisplayName.textContent = this.user.displayName;
      this.el.userEmail.textContent = this.user.email;

      // Update header profile button to show user avatar
      if (this.el.profileAvatar) {
        this.el.profileAvatar.src = this.user.photoURL || 'https://via.placeholder.com/150';
        this.el.profileAvatar.classList.remove('hidden');
      }
      if (this.el.profileIcon) {
        this.el.profileIcon.classList.add('hidden');
      }
    } else {
      // Logged out UI state
      this.el.offlineBanner.classList.remove('hidden');
      this.el.userInfoUnlogged.classList.remove('hidden');
      this.el.userInfoLogged.classList.add('hidden');

      // Update header profile button to show default icon
      if (this.el.profileAvatar) {
        this.el.profileAvatar.src = '';
        this.el.profileAvatar.classList.add('hidden');
      }
      if (this.el.profileIcon) {
        this.el.profileIcon.classList.remove('hidden');
      }
    }
  }

  // ================= DATA LOGISTICS (LOCALSTORAGE) =================
  loadTransactions() {
    this.showSkeletonLoading(true);

    // Load starting balance
    const balanceKey = this.user
      ? `uangnih_demo_starting_balance_${this.user.uid}`
      : 'uangnih_starting_balance';
    this.startingBalance = parseInt(localStorage.getItem(balanceKey)) || 0;

    // Load recurring bills
    const billsKey = this.user
      ? `uangnih_demo_recurring_bills_${this.user.uid}`
      : 'uangnih_recurring_bills';
    const storedBills = localStorage.getItem(billsKey);
    this.recurringBills = storedBills ? JSON.parse(storedBills) : [];

    // Determine storage key depending on user auth state (demo mode or offline mode)
    const storageKey = this.user
      ? `uangnih_demo_cloud_${this.user.uid}`
      : 'uangnih_local_transactions';

    const stored = localStorage.getItem(storageKey);

    setTimeout(() => {
      if (stored) {
        this.transactions = JSON.parse(stored);
      } else {
        // Inject beautiful initial dummy transactions for visual display
        this.transactions = this.getInitialDummyData();
        localStorage.setItem(storageKey, JSON.stringify(this.transactions));
      }

      this.showSkeletonLoading(false);
      this.renderDashboard();
      this.renderTransactions();
      this.checkAndApplyRecurringBills();
      if (this.currentView === 'stats') this.updateStatsView();
    }, 600); // Small delay to enjoy skeleton shimmer
  }

  saveTransaction(newTransaction) {
    if (this.user && !this.isDemoMode) {
      // Save directly to real Firebase Firestore
      this.firestoreDb.collection('users')
        .doc(this.user.uid)
        .collection('transactions')
        .add(newTransaction)
        .catch(err => {
          console.error("Gagal menyimpan ke Firestore:", err);
          alert("Error saat sinkronisasi: " + err.message);
        });
    } else {
      // Local or Demo storage key
      const storageKey = this.user
        ? `uangnih_demo_cloud_${this.user.uid}`
        : 'uangnih_local_transactions';

      // Generate random ID for local transaction
      newTransaction.id = 'loc_' + Date.now() + Math.random().toString(36).substr(2, 5);

      this.transactions.unshift(newTransaction);
      // Sort by date descending
      this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      localStorage.setItem(storageKey, JSON.stringify(this.transactions));

      this.renderDashboard();
      this.renderTransactions();
      if (this.currentView === 'stats') this.updateStatsView();
    }
  }

  deleteTransaction(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;

    if (this.user && !this.isDemoMode) {
      // Delete from real Firebase Firestore
      this.firestoreDb.collection('users')
        .doc(this.user.uid)
        .collection('transactions')
        .doc(id)
        .delete()
        .catch(err => {
          console.error("Gagal menghapus di Firestore:", err);
          alert("Error: " + err.message);
        });
    } else {
      // Local/Demo mock deletion
      const storageKey = this.user
        ? `uangnih_demo_cloud_${this.user.uid}`
        : 'uangnih_local_transactions';

      this.transactions = this.transactions.filter(t => t.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(this.transactions));

      this.renderDashboard();
      this.renderTransactions();
      if (this.currentView === 'stats') this.updateStatsView();
    }
  }

  showSkeletonLoading(show) {
    if (show) {
      this.el.transactionsSkeleton.setAttribute('loading', '');
    } else {
      this.el.transactionsSkeleton.removeAttribute('loading');
    }
  }

  // ================= TEXT PARSING (NLP) =================
  handleNLPInput() {
    const rawText = this.el.nlpInput.value.trim();
    if (!rawText) return;

    // Call parser.js NLP engine
    const parsed = Parser.parse(rawText);

    // Open Drawer and Populate fields for User Preview confirmation
    this.openPreviewDrawer(parsed);
  }

  openPreviewDrawer(parsed) {
    // Set dynamic drawer title back to confirmation
    const drawerTitle = document.querySelector('#drawer-preview .drawer-header h3');
    if (drawerTitle) {
      drawerTitle.textContent = 'Konfirmasi Transaksi';
    }

    this.setPreviewType(parsed.type);
    this.el.previewDesc.value = parsed.description;
    this.el.previewAmount.value = parsed.amount > 0 ? parsed.amount : '';
    this.el.previewCategory.value = parsed.category;
    this.el.previewDate.value = parsed.date;

    this.showDrawer('preview');

    // Auto focus amount if it's empty
    if (!parsed.amount) {
      setTimeout(() => this.el.previewAmount.focus(), 300);
    }
  }

  setPreviewType(type) {
    if (type === 'expense') {
      this.el.previewTypeExpense.classList.add('active');
      this.el.previewTypeIncome.classList.remove('active');
      // Set to generic category options if not matching
      if (this.el.previewCategory.value === 'Gaji') {
        this.el.previewCategory.value = 'Lain-lain';
      }
    } else {
      this.el.previewTypeExpense.classList.remove('active');
      this.el.previewTypeIncome.classList.add('active');
      this.el.previewCategory.value = 'Gaji';
    }
  }

  savePreviewTransaction() {
    const isIncome = this.el.previewTypeIncome.classList.contains('active');
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const trans = {
      type: isIncome ? 'income' : 'expense',
      description: this.el.previewDesc.value.trim() || 'Transaksi Baru',
      amount: parseInt(this.el.previewAmount.value) || 0,
      category: this.el.previewCategory.value,
      date: this.el.previewDate.value || Parser.formatDate(now),
      time: timeStr
    };

    if (trans.amount <= 0) {
      alert("Harap masukkan jumlah nominal yang valid.");
      return;
    }

    this.saveTransaction(trans);
    this.hideDrawer('preview');

    // Reset inputs
    this.el.nlpInput.value = '';
  }

  // ================= VOICE INPUT (WEB SPEECH) =================
  initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'id-ID';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      // Event handlers
      this.recognition.onstart = () => {
        this.isRecording = true;
        this.showModal('voice');
        this.el.voiceTranscriptText.textContent = "...Mulai berbicara...";
        this.el.voiceTranscriptText.classList.remove('voice-placeholder');
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          this.el.voiceTranscriptText.textContent = currentText;
        }
      };

      this.recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          alert("Izin akses mikrofon ditolak. Mohon aktifkan izin mikrofon di pengaturan browser Anda.");
        }
        this.stopVoiceRecognition(true);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.hideModal('voice');
      };

    } else {
      // Hide or disable mic button if Speech API is not supported
      this.el.btnMic.style.opacity = '0.5';
      this.el.btnMic.title = 'Voice Recognition tidak didukung di browser ini';
      this.el.btnMic.addEventListener('click', () => {
        alert("Web Speech API tidak didukung pada browser Anda. Disarankan menggunakan Google Chrome atau Microsoft Edge.");
      });
    }
  }

  startVoiceRecognition() {
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (e) {
      console.warn("Speech recognition already running", e);
    }
  }

  stopVoiceRecognition(isCancelled = false) {
    if (!this.recognition || !this.isRecording) return;

    const text = this.el.voiceTranscriptText.textContent;
    this.recognition.stop();
    this.isRecording = false;
    this.hideModal('voice');

    if (!isCancelled && text && text !== "...Mulai berbicara..." && text.trim().length > 0) {
      // Pass spoken phrase to parser
      const parsed = Parser.parse(text);
      this.openPreviewDrawer(parsed);
    }
  }

  // ================= VIEW RENDERING (DASHBOARD) =================
  renderDashboard() {
    let incomeSum = 0;
    let expenseSum = 0;

    // Filter current month (June 2026 for demonstration, or relative based on input)
    const currentMonthNum = this.currentDate.getMonth();
    const currentYearNum = this.currentDate.getFullYear();

    this.transactions.forEach(t => {
      const tDate = new Date(t.date);
      // Only summarize calculations for current month of active view
      if (tDate.getMonth() === currentMonthNum && tDate.getFullYear() === currentYearNum) {
        if (t.type === 'income') {
          incomeSum += t.amount;
        } else {
          expenseSum += t.amount;
        }
      }
    });

    const balanceSum = this.startingBalance + incomeSum - expenseSum;

    // Animate numbers/text mapping
    this.el.totalBalance.textContent = this.formatIDR(balanceSum);
    this.el.totalIncome.textContent = this.formatIDR(incomeSum);
    this.el.totalExpense.textContent = this.formatIDR(expenseSum);

    // Apply color values to balance based on positive/negative
    if (balanceSum < 0) {
      this.el.totalBalance.style.color = '#fee2e2'; // Light red indicator
    } else {
      this.el.totalBalance.style.color = '#ffffff';
    }
  }

  renderTransactions() {
    // Filter and Search logic
    let listHTML = '';

    const filtered = this.transactions.filter(t => {
      // 1. Filter by Active Tab Segment
      if (this.activeFilter === 'income' && t.type !== 'income') return false;
      if (this.activeFilter === 'expense' && t.type !== 'expense') return false;

      // 2. Filter by search query
      if (this.searchQuery) {
        const matchesDesc = t.description.toLowerCase().includes(this.searchQuery);
        const matchesCat = t.category.toLowerCase().includes(this.searchQuery);
        const matchesAmt = String(t.amount).includes(this.searchQuery);
        return matchesDesc || matchesCat || matchesAmt;
      }
      return true;
    });

    if (filtered.length === 0) {
      listHTML = `
        <div class="empty-state">
          <div class="empty-icon-wrapper">
            <span class="material-icons-round">search_off</span>
          </div>
          <p class="empty-title">Tidak ada transaksi ditemukan</p>
          <p class="empty-subtitle">Silakan coba pencarian lain atau catat transaksi baru.</p>
        </div>
      `;
      this.el.transactionList.innerHTML = listHTML;
      return;
    }

    // Group transactions by date
    const groups = {};
    filtered.forEach(t => {
      if (!groups[t.date]) {
        groups[t.date] = [];
      }
      groups[t.date].push(t);
    });

    // Render groups
    Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).forEach(dateStr => {
      const dateHeaderLabel = this.formatDateHeader(dateStr);
      listHTML += `<div class="date-group"><div class="date-header">${dateHeaderLabel}</div>`;

      groups[dateStr].forEach(t => {
        const sign = t.type === 'income' ? '+' : '-';
        const typeClass = t.type;
        const amountFormatted = this.formatIDR(t.amount);
        const catClass = t.category.toLowerCase().replace(/\s+/g, '-');
        const iconName = this.getCategoryIcon(t.category);

        listHTML += `
          <div class="transaction-card" id="t-card-${t.id}" onclick="app.showTransactionDetail('${t.id}')" style="cursor: pointer;">
            <div class="t-info">
              <div class="t-icon-box ${catClass}">
                <span class="material-icons-round">${iconName}</span>
              </div>
              <div class="t-details">
                <span class="t-title">${t.description}</span>
                <span class="t-subtitle">
                  ${t.category} <span class="bullet">•</span> ${this.formatTime(t.date, t.time)}
                </span>
              </div>
            </div>
            <div class="t-amount-section">
              <span class="t-amount ${typeClass}">${sign} ${amountFormatted}</span>
              <button class="btn-delete-trans" onclick="event.stopPropagation(); app.deleteTransaction('${t.id}')" title="Hapus">
                <span class="material-icons-round" style="font-size: 18px;">delete_outline</span>
              </button>
            </div>
          </div>
        `;
      });

      listHTML += `</div>`;
    });

    this.el.transactionList.innerHTML = listHTML;
  }

  showTransactionDetail(id) {
    const t = this.transactions.find(item => item.id === id);
    if (!t) return;

    const sign = t.type === 'income' ? '+' : '-';
    const typeClass = t.type;
    const typeText = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    const amountFormatted = this.formatIDR(t.amount);
    const catClass = t.category.toLowerCase().replace(/\s+/g, '-');
    const iconName = this.getCategoryIcon(t.category);

    const dateObj = new Date(t.date);
    const dateFormatted = dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const contentHTML = `
      <div class="detail-header-section">
        <div class="detail-icon-wrapper ${catClass}">
          <span class="material-icons-round">${iconName}</span>
        </div>
        <div class="detail-amount ${typeClass}">${sign} ${amountFormatted}</div>
        <div class="detail-desc">${t.description}</div>
      </div>
      <div class="detail-info-list">
        <div class="detail-info-row">
          <span class="detail-info-label">Tipe</span>
          <span class="detail-info-value ${typeClass}">${typeText}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Kategori</span>
          <span class="detail-info-value">${t.category}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Tanggal</span>
          <span class="detail-info-value">${dateFormatted} • ${t.time || '12:00'}</span>
        </div>
      </div>
    `;

    document.getElementById('transaction-detail-content').innerHTML = contentHTML;
    this.el.btnDetailDeleteAction.setAttribute('data-id', t.id);
    this.showDrawer('detail');
  }

  // ================= VIEW RENDERING (STATISTIK) =================
  updateStatsView() {
    // Render Month name display
    const options = { month: 'long', year: 'numeric' };
    this.el.currentMonthDisplay.textContent = this.currentDate.toLocaleDateString('id-ID', options);

    const mTransactions = this.getMonthTransactions();

    // Calculate Monthly summary
    let mIncome = 0;
    let mExpense = 0;

    mTransactions.forEach(t => {
      if (t.type === 'income') mIncome += t.amount;
      else mExpense += t.amount;
    });

    this.el.monthIncome.textContent = this.formatIDR(mIncome);
    this.el.monthExpense.textContent = this.formatIDR(mExpense);

    // Render selected charts
    this.renderDonutChart(mTransactions, mExpense);
    this.renderTrendChart(mTransactions);
    this.renderCategoryBreakdown(mTransactions, mExpense);
  }

  getMonthTransactions() {
    const curMonth = this.currentDate.getMonth();
    const curYear = this.currentDate.getFullYear();

    return this.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });
  }

  changeMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.updateStatsView();
  }

  switchChart() {
    if (this.activeChart === 'categories') {
      this.el.chartCategoriesContainer.classList.remove('hidden');
      this.el.chartTrendContainer.classList.add('hidden');
    } else {
      this.el.chartCategoriesContainer.classList.add('hidden');
      this.el.chartTrendContainer.classList.remove('hidden');
    }
  }

  renderDonutChart(mTransactions, totalExpense) {
    this.el.donutTotal.textContent = this.formatIDR(totalExpense);

    const categorySummary = {};

    // Summarize only expenses for donut breakdown
    mTransactions.forEach(t => {
      if (t.type === 'expense') {
        categorySummary[t.category] = (categorySummary[t.category] || 0) + t.amount;
      }
    });

    const svg = this.el.donutChart;
    svg.innerHTML = ''; // Clear SVG paths

    const categories = Object.keys(categorySummary);
    if (categories.length === 0 || totalExpense === 0) {
      // Render empty circular outline
      svg.innerHTML = `<circle cx="50" cy="50" r="35" fill="none" stroke="var(--bg-tertiary)" stroke-width="8"/>`;
      this.el.categoryLegend.innerHTML = '<div style="grid-column: span 2; text-align: center; color: var(--text-muted); font-size: 11px;">Belum ada pengeluaran bulan ini.</div>';
      return;
    }

    // Sort categories by expenditure amount descending
    const sortedCategories = categories.sort((a, b) => categorySummary[b] - categorySummary[a]);

    // Circumference of a circle with R=35 is 2 * PI * 35 = 219.9
    const radius = 35;
    const circ = 2 * Math.PI * radius; // 219.91
    let cumulativePercent = 0;
    let legendHTML = '';

    sortedCategories.forEach(cat => {
      const amount = categorySummary[cat];
      const pct = amount / totalExpense;
      const color = this.getCategoryColor(cat);

      // Dash length corresponds to percentage of circle
      const strokeLength = pct * circ;
      const strokeOffset = circ - (cumulativePercent * circ);

      // Add circular slice to SVG
      const slice = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      slice.setAttribute('class', 'donut-slice');
      slice.setAttribute('cx', '50');
      slice.setAttribute('cy', '50');
      slice.setAttribute('r', String(radius));
      slice.setAttribute('stroke', color);
      slice.setAttribute('stroke-dasharray', `${strokeLength} ${circ}`);
      slice.setAttribute('stroke-dashoffset', String(strokeOffset));

      svg.appendChild(slice);

      cumulativePercent += pct;

      // Legend Item HTML
      legendHTML += `
        <div class="legend-item">
          <span class="legend-dot" style="background-color: ${color};"></span>
          <span>${cat}</span>
          <span class="legend-pct">${Math.round(pct * 100)}%</span>
        </div>
      `;
    });

    this.el.categoryLegend.innerHTML = legendHTML;
  }

  renderTrendChart(mTransactions) {
    const svg = this.el.barChart;
    svg.innerHTML = ''; // Clear SVG bars

    // Split month into 4 weeks: 1-7, 8-14, 15-21, 22-end
    const weeklyData = [
      { week: 'W1', income: 0, expense: 0 },
      { week: 'W2', income: 0, expense: 0 },
      { week: 'W3', income: 0, expense: 0 },
      { week: 'W4', income: 0, expense: 0 }
    ];

    mTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      let weekIndex = 0;
      if (day <= 7) weekIndex = 0;
      else if (day <= 14) weekIndex = 1;
      else if (day <= 21) weekIndex = 2;
      else weekIndex = 3;

      if (t.type === 'income') {
        weeklyData[weekIndex].income += t.amount;
      } else {
        weeklyData[weekIndex].expense += t.amount;
      }
    });

    // Find highest peak total to scale heights dynamically
    let maxTotal = 100000; // minimum scale threshold to prevent division by zero or super high lines for small values
    weeklyData.forEach(w => {
      if (w.income > maxTotal) maxTotal = w.income;
      if (w.expense > maxTotal) maxTotal = w.expense;
    });

    // Chart Dimensions inside SVG: width=300, height=150
    // Chart area: Y from 10 to 120, X from 20 to 280
    const chartHeight = 110;
    const bottomY = 125;
    const colWidth = 70; // gap distance between columns
    const startX = 45;

    weeklyData.forEach((w, index) => {
      const xCenter = startX + (index * colWidth);

      // Calculate heights relative to highest value (scaled to 100 max height)
      const incomeHeight = (w.income / maxTotal) * chartHeight;
      const expenseHeight = (w.expense / maxTotal) * chartHeight;

      // Draw Income Bar (Green)
      if (w.income > 0) {
        const incBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        incBar.setAttribute('class', 'bar-income');
        incBar.setAttribute('x', String(xCenter - 14));
        incBar.setAttribute('y', String(bottomY - incomeHeight));
        incBar.setAttribute('width', '10');
        incBar.setAttribute('height', String(incomeHeight));
        svg.appendChild(incBar);
      }

      // Draw Expense Bar (Red)
      if (w.expense > 0) {
        const expBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        expBar.setAttribute('class', 'bar-expense');
        expBar.setAttribute('x', String(xCenter + 2));
        expBar.setAttribute('y', String(bottomY - expenseHeight));
        expBar.setAttribute('width', '10');
        expBar.setAttribute('height', String(expenseHeight));
        svg.appendChild(expBar);
      }

      // Draw Week Labels (W1, W2, etc.)
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'bar-label');
      text.setAttribute('x', String(xCenter));
      text.setAttribute('y', String(bottomY + 16));
      text.textContent = `${w.week}`;
      svg.appendChild(text);
    });

    // Add baseline Y-axis line
    const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    baseLine.setAttribute('x1', '20');
    baseLine.setAttribute('y1', String(bottomY));
    baseLine.setAttribute('x2', '280');
    baseLine.setAttribute('y2', String(bottomY));
    baseLine.setAttribute('stroke', 'var(--border-color)');
    baseLine.setAttribute('stroke-width', '1');
    svg.appendChild(baseLine);
  }

  renderCategoryBreakdown(mTransactions, totalExpense) {
    const categorySummary = {};

    // Group only expenses
    mTransactions.forEach(t => {
      if (t.type === 'expense') {
        categorySummary[t.category] = (categorySummary[t.category] || 0) + t.amount;
      }
    });

    const categories = Object.keys(categorySummary);
    if (categories.length === 0 || totalExpense === 0) {
      this.el.categoryBreakdownList.innerHTML = '<div class="empty-breakdown">Tidak ada pengeluaran pada bulan ini.</div>';
      return;
    }

    // Sort descending
    const sorted = categories.sort((a, b) => categorySummary[b] - categorySummary[a]);
    let breakdownHTML = '';

    sorted.forEach(cat => {
      const amount = categorySummary[cat];
      const pct = Math.round((amount / totalExpense) * 100);
      const color = this.getCategoryColor(cat);
      const amountFormatted = this.formatIDR(amount);

      breakdownHTML += `
        <div class="breakdown-item">
          <div class="breakdown-row-info">
            <span class="breakdown-cat">
              <span class="legend-dot" style="background-color: ${color};"></span>
              ${cat}
            </span>
            <div class="breakdown-val-pct">
              <span class="breakdown-val">${amountFormatted}</span>
              <span class="breakdown-pct-tag">${pct}%</span>
            </div>
          </div>
          <div class="breakdown-progress-container">
            <div class="breakdown-progress-bar" style="width: ${pct}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    });

    this.el.categoryBreakdownList.innerHTML = breakdownHTML;
  }

  // ================= EXPORT & IMPORT (JSON) =================
  exportTransactionsJSON() {
    if (this.transactions.length === 0) {
      alert("Belum ada data transaksi untuk diekspor.");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.transactions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);

    // Filename incorporates timestamp
    const dateStr = new Date().toISOString().slice(0, 10);
    dlAnchorElem.setAttribute("download", `UangNih_Backup_${dateStr}.json`);
    dlAnchorElem.click();
  }

  importTransactionsJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (!Array.isArray(importedData)) {
          throw new Error("Format file JSON tidak valid. Data harus berupa array transaksi.");
        }

        // Quick simple validation on properties
        const isValid = importedData.every(item => item.description && item.amount !== undefined && item.type && item.date);
        if (!isValid) {
          throw new Error("Beberapa data transaksi tidak memiliki format atau bidang wajib (description, amount, type, date).");
        }

        if (confirm(`Apakah Anda yakin ingin mengimpor ${importedData.length} transaksi? Tindakan ini akan menimpa/menambah daftar transaksi Anda.`)) {

          this.showSkeletonLoading(true);

          // Re-populate data based on active database target
          if (this.user && !this.isDemoMode) {
            // Upload items sequentially to Cloud Firestore
            let count = 0;
            const batch = this.firestoreDb.batch();
            importedData.forEach(item => {
              // Strip old IDs
              const { id, ...cleanItem } = item;
              const ref = this.firestoreDb.collection('users').doc(this.user.uid).collection('transactions').doc();
              batch.set(ref, cleanItem);
              count++;
            });

            batch.commit().then(() => {
              alert(`Berhasil mengimpor ${count} data transaksi ke Firebase Cloud!`);
              this.showSkeletonLoading(false);
            }).catch(err => {
              console.error("Firestore import batch error:", err);
              alert("Gagal mengimpor ke Firebase: " + err.message);
              this.showSkeletonLoading(false);
            });

          } else {
            // LocalStorage mode
            const storageKey = this.user
              ? `uangnih_demo_cloud_${this.user.uid}`
              : 'uangnih_local_transactions';

            // Generate clean IDs for imported local items
            const cleanedImport = importedData.map(item => {
              return {
                id: item.id || 'loc_' + Date.now() + Math.random().toString(36).substr(2, 5),
                type: item.type,
                description: item.description,
                amount: item.amount,
                category: item.category || 'Lain-lain',
                date: item.date,
                time: item.time || '12:00'
              };
            });

            // Concat or overwrite - let's merge and remove duplicates by ID if exists, or append
            // For safety, let's merge and sort
            const merged = [...cleanedImport, ...this.transactions];
            // Remove duplicates based on ID
            const uniqueMap = {};
            merged.forEach(item => { uniqueMap[item.id] = item; });
            this.transactions = Object.values(uniqueMap);
            this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            localStorage.setItem(storageKey, JSON.stringify(this.transactions));

            setTimeout(() => {
              alert(`Berhasil mengimpor ${cleanedImport.length} transaksi ke penyimpanan lokal!`);
              this.showSkeletonLoading(false);
              this.renderDashboard();
              this.renderTransactions();
              if (this.currentView === 'stats') this.updateStatsView();
            }, 800);
          }
        }
      } catch (err) {
        alert("Gagal memproses file JSON: " + err.message);
      }

      // Reset input value to allow re-uploading same file
      this.el.fileImport.value = '';
    };
    reader.readAsText(file);
  }

  // ================= UTILITIES & HELPERS =================
  formatIDR(value) {
    return 'Rp ' + Math.abs(value).toLocaleString('id-ID');
  }

  formatTime(dateStr, timeStr) {
    if (timeStr) return timeStr;
    return "12:00";
  }

  formatDateHeader(dateStr) {
    const today = Parser.formatDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = Parser.formatDate(yesterday);

    if (dateStr === today) return "Hari Ini";
    if (dateStr === yesterdayStr) return "Kemarin";

    // Format specific date: "14 Juni 2026"
    const parsed = new Date(dateStr);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return parsed.toLocaleDateString('id-ID', options);
  }

  getCategoryColor(category) {
    const colors = {
      'Makanan': 'var(--cat-makanan)',
      'Transportasi': 'var(--cat-transportasi)',
      'Belanja': 'var(--cat-belanja)',
      'Tagihan': 'var(--cat-tagihan)',
      'Hiburan': 'var(--cat-hiburan)',
      'Gaji': 'var(--cat-gaji)',
      'Investasi': 'var(--cat-investasi)',
      'Lain-lain': 'var(--cat-lain)'
    };
    return colors[category] || 'var(--cat-lain)';
  }

  getCategoryIcon(category) {
    const icons = {
      'Makanan': 'restaurant',
      'Transportasi': 'directions_car',
      'Belanja': 'shopping_bag',
      'Tagihan': 'receipt',
      'Hiburan': 'sports_esports',
      'Gaji': 'payments',
      'Investasi': 'trending_up',
      'Lain-lain': 'help_outline'
    };
    return icons[category] || 'help_outline';
  }

  getInitialDummyData() {
    return [
      { id: 'd1', type: 'expense', description: 'Beli Kopi Susu', amount: 22000, category: 'Makanan', date: '2026-06-14', time: '14:25' },
      { id: 'd2', type: 'expense', description: 'Gojek ke Kantor', amount: 15000, category: 'Transportasi', date: '2026-06-14', time: '08:15' },
      { id: 'd3', type: 'income', description: 'Gaji Bulanan', amount: 6500000, category: 'Gaji', date: '2026-06-01', time: '09:00' },
      { id: 'd4', type: 'expense', description: 'Langganan Internet Wifi', amount: 350000, category: 'Tagihan', date: '2026-06-05', time: '10:00' },
      { id: 'd5', type: 'expense', description: 'Makan Malam Seafood', amount: 120000, category: 'Makanan', date: '2026-06-13', time: '19:30' },
      { id: 'd6', type: 'expense', description: 'Beli Sepatu Baru', amount: 450000, category: 'Belanja', date: '2026-06-10', time: '16:45' },
      { id: 'd7', type: 'expense', description: 'Tiket Bioskop', amount: 50000, category: 'Hiburan', date: '2026-06-08', time: '21:15' },
      { id: 'd8', type: 'income', description: 'Keuntungan Jual Saham', amount: 850000, category: 'Investasi', date: '2026-06-12', time: '11:30' },
    ];
  }
}

// Inisialisasi Aplikasi ketika DOM siap
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new UangNihApp();
  // Expose to window for inline onclick triggers
  window.app = app;
});

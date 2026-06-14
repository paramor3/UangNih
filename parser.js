/**
 * UangNih - Natural Language Processing Parser for Indonesian Finance Logging
 */

const Parser = {
  // Indonesian Months Mapping
  months: {
    'januari': 0, 'jan': 0,
    'februari': 1, 'feb': 1,
    'maret': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'mei': 4,
    'juni': 5, 'jun': 5,
    'juli': 6, 'jul': 6,
    'agustus': 7, 'agt': 7, 'agus': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'oktober': 9, 'okt': 9,
    'november': 10, 'nov': 10,
    'desember': 11, 'des': 11
  },

  // Category Keyword Maps
  categoryKeywords: {
    'Makanan': ['makan', 'minum', 'kopi', 'teh', 'bakso', 'nasgor', 'nasi', 'cafe', 'warteg', 'resto', 'snack', 'cemilan', 'roti', 'burger', 'pizza', 'susu', 'jajan', 'kuliner', 'es', 'mie'],
    'Transportasi': ['bensin', 'ojek', 'grab', 'gojek', 'taxi', 'taksi', 'busway', 'kereta', 'mrt', 'lrt', 'parkir', 'tol', 'tiket', 'travel', 'angkot', 'go-ride', 'go-car', 'grabcar', 'indomaret-card'],
    'Belanja': ['beli', 'belanja', 'kaos', 'baju', 'celana', 'sepatu', 'minimarket', 'indomaret', 'alfamart', 'tokopedia', 'shopee', 'lazada', 'supermarket', 'mall', 'tas', 'aksesoris', 'skincare', 'makeup'],
    'Tagihan': ['listrik', 'air', 'wifi', 'internet', 'pulsa', 'kuota', 'sewa', 'kos', 'kontrakan', 'asuransi', 'pajak', 'netflix', 'spotify', 'langganan', 'cicilan', 'kredit', 'indihome'],
    'Hiburan': ['nonton', 'bioskop', 'game', 'topup', 'liburan', 'wisata', 'konser', 'karaoke', 'buku', 'novel', 'jalan-jalan', 'healing', 'timezone'],
    'Gaji': ['gaji', 'salary', 'upah', 'fee', 'honor', 'bonus', 'thr', 'insentif'],
    'Investasi': ['reksadana', 'saham', 'crypto', 'emas', 'investasi', 'nabung', 'reksa dana', 'bibit'],
  },

  // Keywords to determine Pemasukan (Income)
  incomeKeywords: ['gaji', 'dapat', 'terima', 'pemasukan', 'masuk', 'bonus', 'untung', 'jual', 'transferan', 'angpao', 'hibah', 'refund', 'kembalian', 'upah', 'thr', 'insentif', 'sedekah-masuk', 'menang'],

  /**
   * Main parse function
   * @param {string} rawText 
   * @returns {Object} { type, amount, date, description, category }
   */
  parse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return this.getDefaultValues();
    }

    const text = rawText.toLowerCase().trim();
    
    // 1. Parse Amount (Nominal Uang)
    const { amount, amountPhrase } = this.extractAmount(text);
    
    // 2. Parse Date
    const { date, datePhrase } = this.extractDate(text);
    
    // 3. Parse Type (Pemasukan / Pengeluaran)
    const type = this.determineType(text);
    
    // 4. Extract Description (Cleaned Text)
    const description = this.extractDescription(rawText, amountPhrase, datePhrase);
    
    // 5. Determine Category based on Description
    const category = this.determineCategory(description, type);

    return {
      type,
      amount,
      date,
      description,
      category
    };
  },

  /**
   * Extract transaction amount and the text phrase matching it
   */
  extractAmount(text) {
    let amount = 0;
    let amountPhrase = '';

    // Regex to match:
    // - 50rb, 50 ribu, 50k, 50 k, 1.5jt, 1.5 juta, 1,5 juta
    // - 50000, 50.000, 50,000
    // - rp 50.000, rp.50.000
    const moneyPattern = /(?:rp\.?\s*)?(\d+[\d.,]*)\s*(k|rb|ribu|juta|jt)?/gi;
    let matches = [];
    let match;

    while ((match = moneyPattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const numberStr = match[1].replace(/,/g, '.'); // Standardize decimal points
      const multiplier = match[2] ? match[2].toLowerCase() : '';

      // Count dots to check if it's thousands separator or decimal
      const dotsCount = (numberStr.match(/\./g) || []).length;
      let val = 0;

      if (dotsCount > 1) {
        // e.g. 50.000.000 -> thousands separator, remove all dots
        val = parseFloat(numberStr.replace(/\./g, ''));
      } else if (dotsCount === 1) {
        // e.g. 50.000 or 1.5
        // If multiplier is present (like "jt"), it is a decimal (e.g. 1.5jt -> 1500000)
        // If multiplier is not present and digits after dot is exactly 3, it's likely thousands separator (50.000 -> 50000)
        const parts = numberStr.split('.');
        if (multiplier || parts[1].length !== 3) {
          val = parseFloat(numberStr); // Decimal
        } else {
          val = parseFloat(numberStr.replace(/\./g, '')); // Thousands separator
        }
      } else {
        val = parseFloat(numberStr);
      }

      if (isNaN(val)) continue;

      // Apply multipliers
      if (multiplier === 'k' || multiplier === 'rb' || multiplier === 'ribu') {
        val *= 1000;
      } else if (multiplier === 'jt' || multiplier === 'juta') {
        val *= 1000000;
      }

      matches.push({
        value: Math.round(val),
        phrase: fullMatch
      });
    }

    if (matches.length > 0) {
      // Prioritize the largest number or numbers > 100 to avoid matching quantities (e.g. "beli 2 kopi 5000" -> match 5000)
      const likelyMatch = matches.find(m => m.value >= 100) || matches[0];
      amount = likelyMatch.value;
      amountPhrase = likelyMatch.phrase;
    }

    return { amount, amountPhrase };
  },

  /**
   * Extract transaction date and the text phrase matching it
   */
  extractDate(text) {
    const today = new Date();
    let date = this.formatDate(today);
    let datePhrase = '';

    // Relative dates
    if (/\bhari\s*ini\b/i.test(text)) {
      datePhrase = text.match(/\bhari\s*ini\b/i)[0];
      date = this.formatDate(today);
      return { date, datePhrase };
    }
    
    if (/\bkemarin\b/i.test(text)) {
      datePhrase = 'kemarin';
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      date = this.formatDate(yesterday);
      return { date, datePhrase };
    }

    if (/\blusa\b/i.test(text)) {
      datePhrase = 'lusa';
      const lusa = new Date(today);
      lusa.setDate(today.getDate() + 2);
      date = this.formatDate(lusa);
      return { date, datePhrase };
    }

    // Pattern: "tanggal 14 juni 2026", "tgl 14 juni", "tanggal 14", "tgl 14"
    const datePattern = /(?:tanggal|tgl)\s*(\d{1,2})(?:\s*([a-z]+))?(?:\s*(\d{4}))?/i;
    const match = text.match(datePattern);

    if (match) {
      datePhrase = match[0];
      const day = parseInt(match[1]);
      let month = today.getMonth();
      let year = today.getFullYear();

      // Check month if specified
      if (match[2]) {
        const monthName = match[2].toLowerCase();
        if (this.months[monthName] !== undefined) {
          month = this.months[monthName];
        }
      }

      // Check year if specified
      if (match[3]) {
        year = parseInt(match[3]);
      }

      // Construct final date safely
      const parsedDate = new Date(year, month, day);
      // Double check date parts are valid
      if (!isNaN(parsedDate.getTime())) {
        date = this.formatDate(parsedDate);
      }
    }

    return { date, datePhrase };
  },

  /**
   * Determine whether it is an income or expense
   */
  determineType(text) {
    // Search for income keywords
    const hasIncomeWord = this.incomeKeywords.some(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(text);
    });

    return hasIncomeWord ? 'income' : 'expense';
  },

  /**
   * Clean description by removing amount and date phrases
   */
  extractDescription(rawText, amountPhrase, datePhrase) {
    let cleanText = rawText;

    // Remove amount phrase
    if (amountPhrase) {
      const escapedAmount = amountPhrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      cleanText = cleanText.replace(new RegExp(escapedAmount, 'i'), '');
    }

    // Remove date phrase
    if (datePhrase) {
      const escapedDate = datePhrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      cleanText = cleanText.replace(new RegExp(escapedDate, 'i'), '');
    }

    // Clean formatting and connectives/noise words in Indonesian
    const noiseWords = [
      '\\btanggal\\b', '\\btgl\\b', '\\bsebesar\\b', '\\bsebanyak\\b', '\\buntuk\\b', 
      '\\bbuat\\b', '\\bdi\\b', '\\bke\\b', '\\brp\\b', '\\brupiah\\b', '\\bdengan\\b', '\\bnominal\\b'
    ];
    
    noiseWords.forEach(word => {
      cleanText = cleanText.replace(new RegExp(word, 'gi'), '');
    });

    // Remove duplicate/multiple spaces and clean outer padding
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    // Capitalize first letter
    if (cleanText.length > 0) {
      cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    } else {
      cleanText = 'Transaksi Tanpa Judul';
    }

    return cleanText;
  },

  /**
   * Categorize description based on matching keyword lists
   */
  determineCategory(description, type) {
    if (type === 'income') {
      // For income, default to Gaji, or check Investasi/Lain-lain
      const descLower = description.toLowerCase();
      if (this.categoryKeywords['Investasi'].some(kw => descLower.includes(kw))) {
        return 'Investasi';
      }
      return 'Gaji';
    }

    const descLower = description.toLowerCase();

    // Iterate through category keyword map
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (category === 'Gaji') continue; // Skip Gaji for expenses
      
      const isMatch = keywords.some(keyword => descLower.includes(keyword));
      if (isMatch) {
        return category;
      }
    }

    return 'Lain-lain';
  },

  /**
   * Helper to format Date into YYYY-MM-DD
   */
  formatDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get default return values
   */
  getDefaultValues() {
    return {
      type: 'expense',
      amount: 0,
      date: this.formatDate(new Date()),
      description: 'Transaksi Baru',
      category: 'Lain-lain'
    };
  }
};

// Export to window object for browser access
window.Parser = Parser;

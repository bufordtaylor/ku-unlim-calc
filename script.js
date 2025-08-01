let bookCount = 3;
const booksData = new Map();
let revenueChart = null;
let currentChartType = 'cumulative';

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    //loadFromStorage();
    updateRemoveButtons();
    calculateResults();
    //initializeChart();
    
    // Close info popups when clicking anywhere on the page
    document.addEventListener('click', function(event) {
        // Don't close if clicking on an info button
        if (event.target.classList.contains('info-btn')) {
            return;
        }
        
        // Close all open info texts
        document.querySelectorAll('.info-text.show').forEach(el => {
            el.classList.remove('show');
        });
    });
});

function initializeEventListeners() {
    document.getElementById('add-book').addEventListener('click', addNewBook);
    document.getElementById('reset-data').addEventListener('click', resetAllData);
    //document.getElementById('export-data').addEventListener('click', exportData);
    //document.getElementById('import-data').addEventListener('click', () => {
        //document.getElementById('import-file').click();
    //});
    //document.getElementById('import-file').addEventListener('change', importData);
    
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            calculateResults();
            saveToStorage();
        });
    });
    
    document.getElementById('kenp-rate').addEventListener('input', function() {
        calculateResults();
        saveToStorage();
    });
    
    // Chart toggle buttons
    document.querySelectorAll('.chart-toggle').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.chart-toggle').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentChartType = this.dataset.chart;
            updateChart();
            saveToStorage();
        });
    });
}

function initializeBookData(bookNumber) {
    booksData.set(bookNumber, {
        sold: 0,
        pagesRead: 0,
        totalPages: 0
    });
}

function addNewBook() {
    bookCount++;
    const booksContainer = document.getElementById('books-container');
    
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.setAttribute('data-book', bookCount);
    
    const readThroughBadge = bookCount > 1 ? `<span class="readthrough-badge" id="readthrough-${bookCount}">0% Read-through</span>` : '';
    
    bookCard.innerHTML = `
        <div class="book-header">
            <div class="book-number">${bookCount}</div>
            <h3>Book ${bookCount}</h3>
        </div>
        <button class="remove-book" onclick="removeBook(${bookCount})" id="remove-btn-${bookCount}">×</button>
        ${readThroughBadge}
        
        <div class="book-inputs">
            <div class="input-row">
                <div class="input-field">
                    <label for="sold-${bookCount}">
                        Books Sold
                        <button class="info-btn" onclick="toggleInfo('sold-info-${bookCount}')">?</button>
                    </label>
                    <input type="number" id="sold-${bookCount}" placeholder="0" min="0">
                    <div class="info-text" id="sold-info-${bookCount}">
                        Number of copies sold (not borrowed). Find this in your KDP dashboard under "Units Ordered" for the specific title and time period.
                    </div>
                </div>
                <div class="input-field">
                    <label for="pages-read-${bookCount}">
                        Pages Read
                        <button class="info-btn" onclick="toggleInfo('pages-read-info-${bookCount}')">?</button>
                    </label>
                    <input type="number" id="pages-read-${bookCount}" placeholder="0" min="0">
                    <div class="info-text" id="pages-read-info-${bookCount}">
                        Total KENP (Kindle Edition Normalized Pages) read for this book. Find in KDP dashboard under "KENP Read" column. This is the lifetime total of all pages read by KU subscribers.
                    </div>
                </div>
                <div class="input-field">
                    <label for="total-pages-${bookCount}">
                        Total Pages
                        <button class="info-btn" onclick="toggleInfo('total-pages-info-${bookCount}')">?</button>
                    </label>
                    <input type="number" id="total-pages-${bookCount}" placeholder="0" min="1">
                    <div class="info-text" id="total-pages-info-${bookCount}">
                        Your book's KENPC (Kindle Edition Normalized Page Count). Find in KDP dashboard: Bookshelf → 3-dot menu → KDP Select Info → scroll to "Earn royalties from..." section.
                    </div>
                </div>
                <div class="input-field">
                    <label for="book-price-${bookCount}">
                        Book Price
                        <button class="info-btn" onclick="toggleInfo('price-info-${bookCount}')">?</button>
                    </label>
                    <div class="input-wrapper">
                        <span class="currency">$</span>
                        <input type="number" id="book-price-${bookCount}" placeholder="4.99" min="0" step="0.01" value="4.99">
                    </div>
                    <div class="info-text" id="price-info-${bookCount}">
                        The list price of this book. You earn 70% royalty on sales between $2.99-$9.99, and 35% outside this range. This calculator assumes 70% royalty rate.
                    </div>
                </div>
            </div>
        </div>

        <div class="book-metrics">
            <div class="metric-item">
                <span class="metric-label">Estimated Readers</span>
                <span class="metric-value" id="readers-${bookCount}">0</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">KENP Revenue</span>
                <span class="metric-value" id="kenp-revenue-${bookCount}">$0.00</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Sales Revenue</span>
                <span class="metric-value" id="sales-revenue-${bookCount}">$0.00</span>
            </div>
            <div class="metric-item highlight">
                <span class="metric-label">Total Revenue</span>
                <span class="metric-value" id="book-revenue-${bookCount}">$0.00</span>
            </div>
        </div>
    `;
    
    booksContainer.appendChild(bookCard);
    initializeBookData(bookCount);
    updateRemoveButtons();
    
    bookCard.style.opacity = '0';
    bookCard.style.transform = 'translateY(20px)';
    setTimeout(() => {
        bookCard.style.transition = 'all 0.3s ease';
        bookCard.style.opacity = '1';
        bookCard.style.transform = 'translateY(0)';
    }, 10);
    
    bookCard.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            calculateResults();
            saveToStorage();
        });
    });
    
    updateChart();
    saveToStorage();
}

function removeBook(bookNumber) {
    if (bookCount === 1) {
        return;
    }
    
    const bookCard = document.querySelector(`[data-book="${bookNumber}"]`);
    bookCard.style.transition = 'all 0.3s ease';
    bookCard.style.opacity = '0';
    bookCard.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        bookCard.remove();
        booksData.delete(bookNumber);
        renumberBooks();
        updateRemoveButtons();
        calculateResults();
        updateChart();
        saveToStorage();
    }, 300);
}

function renumberBooks() {
    const bookCards = document.querySelectorAll('.book-card');
    bookCount = bookCards.length;
    
    const newBooksData = new Map();
    
    bookCards.forEach((card, index) => {
        const newNumber = index + 1;
        const oldNumber = parseInt(card.getAttribute('data-book'));
        
        card.setAttribute('data-book', newNumber);
        card.querySelector('.book-number').textContent = newNumber;
        card.querySelector('h3').textContent = `Book ${newNumber}`;
        
        const removeBtn = card.querySelector('.remove-book');
        if (removeBtn) {
            removeBtn.setAttribute('onclick', `removeBook(${newNumber})`);
        }
        
        if (newNumber === 1 && removeBtn) {
            removeBtn.remove();
        }
        
        const readthroughBadge = card.querySelector('.readthrough-badge');
        if (readthroughBadge) {
            readthroughBadge.id = `readthrough-${newNumber}`;
        }
        
        if (newNumber === 1 && readthroughBadge) {
            readthroughBadge.remove();
        }
        
        card.querySelectorAll('[id]').forEach(element => {
            const idParts = element.id.split('-');
            idParts[idParts.length - 1] = newNumber;
            element.id = idParts.join('-');
        });
        
        card.querySelectorAll('label[for]').forEach(label => {
            const forParts = label.getAttribute('for').split('-');
            forParts[forParts.length - 1] = newNumber;
            label.setAttribute('for', forParts.join('-'));
        });
        
        if (booksData.has(oldNumber)) {
            newBooksData.set(newNumber, booksData.get(oldNumber));
        }
    });
    
    booksData.clear();
    newBooksData.forEach((value, key) => booksData.set(key, value));
}

function collectBookData() {
    for (let i = 1; i <= bookCount; i++) {
        const sold = parseFloat(document.getElementById(`sold-${i}`)?.value) || 0;
        const pagesRead = parseFloat(document.getElementById(`pages-read-${i}`)?.value) || 0;
        const totalPages = parseFloat(document.getElementById(`total-pages-${i}`)?.value) || 0;
        
        booksData.set(i, { sold, pagesRead, totalPages });
    }
}

function calculateResults() {
    collectBookData();
    
    const kenpRate = parseFloat(document.getElementById('kenp-rate').value) || 0.0045;
    
    if (kenpRate < 0) {
        return;
    }
    
    let totalRevenue = 0;
    let book1Readers = 0;
    const readThroughRates = [];
    
    for (let i = 1; i <= bookCount; i++) {
        const bookData = booksData.get(i);
        if (!bookData) continue;
        
        const { sold, pagesRead, totalPages } = bookData;
        const bookPrice = parseFloat(document.getElementById(`book-price-${i}`)?.value) || 4.99;
        
        if (sold < 0 || pagesRead < 0 || totalPages < 0 || bookPrice < 0) {
            continue;
        }
        
        const estimatedReaders = totalPages > 0 ? Math.round(pagesRead / totalPages) : 0;
        const kenpRevenue = pagesRead * kenpRate;
        const salesRevenue = sold * bookPrice * 0.7;
        const bookRevenue = kenpRevenue + salesRevenue;
        
        totalRevenue += bookRevenue;
        
        document.getElementById(`readers-${i}`).textContent = formatNumber(estimatedReaders);
        document.getElementById(`kenp-revenue-${i}`).textContent = `$${formatNumber(parseFloat(kenpRevenue.toFixed(2)))}`;
        document.getElementById(`sales-revenue-${i}`).textContent = `$${formatNumber(parseFloat(salesRevenue.toFixed(2)))}`;
        document.getElementById(`book-revenue-${i}`).textContent = `$${formatNumber(parseFloat(bookRevenue.toFixed(2)))}`;
        
        if (i === 1) {
            book1Readers = estimatedReaders + sold;
        }
        
        if (i > 1 && book1Readers > 0) {
            const currentReaders = estimatedReaders + sold;
            const readThroughRate = (currentReaders / book1Readers) * 100;
            readThroughRates.push(readThroughRate);
            
            const badge = document.getElementById(`readthrough-${i}`);
            if (badge) {
                badge.textContent = `${readThroughRate.toFixed(1)}% Read-through`;
            }
        }
    }
    
    const avgReadThrough = readThroughRates.length > 0 
        ? readThroughRates.reduce((a, b) => a + b, 0) / readThroughRates.length 
        : 0;
    
    let breakEvenCost = 0;
    if (book1Readers > 0) {
        const revenuePerBook1Reader = totalRevenue / book1Readers;
        breakEvenCost = revenuePerBook1Reader;
    }
    
    document.getElementById('total-revenue').textContent = `$${formatNumber(parseFloat(totalRevenue.toFixed(2)))}`;
    document.getElementById('avg-readthrough').textContent = `${avgReadThrough.toFixed(1)}%`;
    document.getElementById('breakeven-cost').textContent = `$${formatNumber(parseFloat(breakEvenCost.toFixed(2)))}`;
    
    const metricCards = document.querySelectorAll('.metric-card');
    metricCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'scale(1.05)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 150);
        }, index * 100);
    });
    
    updateChart();
}

function toggleInfo(infoId) {
    const infoElement = document.getElementById(infoId);
    if (infoElement) {
        infoElement.classList.toggle('show');
        
        // Close other open info texts
        document.querySelectorAll('.info-text').forEach(el => {
            if (el.id !== infoId) {
                el.classList.remove('show');
            }
        });
    }
}

function resetAllData() {
    // Reset all input fields to 0
    document.querySelectorAll('input[type="number"]').forEach(input => {
        if (input.id === 'kenp-rate') {
            input.value = '0.0045';
        } else if (input.id.startsWith('book-price-')) {
            input.value = '4.99';
        } else {
            input.value = '';
        }
    });
    
    // Reset books data
    booksData.clear();
    for (let i = 1; i <= bookCount; i++) {
        initializeBookData(i);
    }
    
    // Recalculate results
    calculateResults();
    
    // Clear storage
    localStorage.removeItem('kuCalculatorData');
    
    // Visual feedback
    const resetBtn = document.getElementById('reset-data');
    resetBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        resetBtn.style.transform = 'scale(1)';
    }, 200);
}

function formatNumber(num) {
    return num.toLocaleString('en-US');
}

function updateRemoveButtons() {
    // Show/hide remove buttons based on book count
    const allRemoveButtons = document.querySelectorAll('.remove-book');
    allRemoveButtons.forEach(btn => {
        if (bookCount === 1) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
        }
    });
}

function initializeChart() {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Cumulative Revenue Breakdown',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#1e293b'
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + formatNumber(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
                    },
                    grid: {
                        color: '#f1f5f9'
                    }
                },
                x: {
                    grid: {
                        color: '#f1f5f9'
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.3
                },
                point: {
                    radius: 6,
                    hoverRadius: 8
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    updateChart();
}

function updateChart() {
    if (!revenueChart) return;
    
    if (currentChartType === 'cumulative') {
        updateCumulativeChart();
    } else {
        updateIndividualChart();
    }
}

function updateCumulativeChart() {
    const kenpRate = parseFloat(document.getElementById('kenp-rate').value) || 0.0045;
    
    const labels = [];
    const datasets = [];
    const colors = [
        '#6366f1', '#22d3ee', '#10b981', '#f59e0b', 
        '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
    ];
    
    // Create datasets for each book
    for (let bookNum = 1; bookNum <= bookCount; bookNum++) {
        datasets.push({
            label: `Book ${bookNum}`,
            data: [],
            borderColor: colors[(bookNum - 1) % colors.length],
            backgroundColor: colors[(bookNum - 1) % colors.length] + '20',
            fill: false,
            tension: 0.3
        });
    }
    
    // Generate cumulative data points
    for (let dataPoint = 1; dataPoint <= bookCount; dataPoint++) {
        labels.push(`Through Book ${dataPoint}`);
        
        let cumulativeRevenue = 0;
        
        for (let bookNum = 1; bookNum <= dataPoint; bookNum++) {
            const bookData = booksData.get(bookNum);
            if (bookData) {
                const { sold, pagesRead } = bookData;
                const bookPrice = parseFloat(document.getElementById(`book-price-${bookNum}`)?.value) || 4.99;
                const kenpRevenue = pagesRead * kenpRate;
                const salesRevenue = sold * bookPrice * 0.7;
                const bookRevenue = kenpRevenue + salesRevenue;
                
                cumulativeRevenue += bookRevenue;
                datasets[bookNum - 1].data.push(cumulativeRevenue);
            } else {
                datasets[bookNum - 1].data.push(0);
            }
        }
        
        // Fill remaining data points with null for books that don't exist yet
        for (let bookNum = dataPoint + 1; bookNum <= bookCount; bookNum++) {
            datasets[bookNum - 1].data.push(null);
        }
    }
    
    // Ensure chart type is line for cumulative view
    revenueChart.config.type = 'line';
    revenueChart.data.labels = labels;
    revenueChart.data.datasets = datasets;
    revenueChart.options.plugins.title.text = 'Cumulative Revenue Breakdown';
    revenueChart.update();
}

function updateIndividualChart() {
    const kenpRate = parseFloat(document.getElementById('kenp-rate').value) || 0.0045;
    
    const labels = [];
    const kenpData = [];
    const salesData = [];
    
    // Collect individual book data
    for (let bookNum = 1; bookNum <= bookCount; bookNum++) {
        labels.push(`Book ${bookNum}`);
        
        const bookData = booksData.get(bookNum);
        if (bookData) {
            const { sold, pagesRead } = bookData;
            const bookPrice = parseFloat(document.getElementById(`book-price-${bookNum}`)?.value) || 4.99;
            const kenpRevenue = pagesRead * kenpRate;
            const salesRevenue = sold * bookPrice * 0.7;
            
            kenpData.push(kenpRevenue);
            salesData.push(salesRevenue);
        } else {
            kenpData.push(0);
            salesData.push(0);
        }
    }
    
    const datasets = [
        {
            label: 'KENP Revenue',
            data: kenpData,
            backgroundColor: '#6366f1aa',
            borderColor: '#6366f1',
            borderWidth: 2
        },
        {
            label: 'Sales Revenue',
            data: salesData,
            backgroundColor: '#22d3eeaa',
            borderColor: '#22d3ee',
            borderWidth: 2
        }
    ];
    
    // Change chart type to bar for individual comparison
    revenueChart.config.type = 'bar';
    revenueChart.data.labels = labels;
    revenueChart.data.datasets = datasets;
    revenueChart.options.plugins.title.text = 'Individual Book Revenue Comparison';
    revenueChart.update();
}

// Local Storage Functions
function saveToStorage() {
    const data = {
        bookCount: bookCount,
        books: {},
        kenpRate: document.getElementById('kenp-rate').value,
        currentChartType: currentChartType
    };
    
    // Save all book data
    for (let i = 1; i <= bookCount; i++) {
        const sold = document.getElementById(`sold-${i}`)?.value || '';
        const pagesRead = document.getElementById(`pages-read-${i}`)?.value || '';
        const totalPages = document.getElementById(`total-pages-${i}`)?.value || '';
        const bookPrice = document.getElementById(`book-price-${i}`)?.value || '4.99';
        
        data.books[i] = {
            sold: sold,
            pagesRead: pagesRead,
            totalPages: totalPages,
            bookPrice: bookPrice
        };
    }
    
    try {
        localStorage.setItem('kuCalculatorData', JSON.stringify(data));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function loadFromStorage() {
    try {
        const savedData = localStorage.getItem('kuCalculatorData');
        if (!savedData) {
            // If no saved data, initialize with default 3 books
            for (let i = 1; i <= 3; i++) {
                initializeBookData(i);
            }
            return;
        }
        
        const data = JSON.parse(savedData);
        
        // Restore global settings
        document.getElementById('kenp-rate').value = data.kenpRate || '0.0045';
        currentChartType = data.currentChartType || 'cumulative';
        
        // Update chart toggle buttons
        document.querySelectorAll('.chart-toggle').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.chart === currentChartType);
        });
        
        // Restore book count and data
        const savedBookCount = data.bookCount || 3;
        
        // Add books if we need more than the default 3
        while (bookCount < savedBookCount) {
            addNewBookFromStorage();
        }
        
        // Remove books if we need fewer than the current count
        while (bookCount > savedBookCount) {
            const lastBook = document.querySelector(`[data-book="${bookCount}"]`);
            if (lastBook) {
                lastBook.remove();
                booksData.delete(bookCount);
                bookCount--;
            }
        }
        
        // Restore book data
        for (let i = 1; i <= bookCount; i++) {
            const bookData = data.books[i];
            if (bookData) {
                const soldInput = document.getElementById(`sold-${i}`);
                const pagesReadInput = document.getElementById(`pages-read-${i}`);
                const totalPagesInput = document.getElementById(`total-pages-${i}`);
                const bookPriceInput = document.getElementById(`book-price-${i}`);
                
                if (soldInput) soldInput.value = bookData.sold;
                if (pagesReadInput) pagesReadInput.value = bookData.pagesRead;
                if (totalPagesInput) totalPagesInput.value = bookData.totalPages;
                if (bookPriceInput) bookPriceInput.value = bookData.bookPrice || '4.99';
                
                initializeBookData(i);
            }
        }
        
    } catch (error) {
        console.warn('Could not load from localStorage:', error);
        // Fallback to default initialization
        for (let i = 1; i <= 3; i++) {
            initializeBookData(i);
        }
    }
}

function addNewBookFromStorage() {
    // Similar to addNewBook but without animations for loading
    bookCount++;
    const booksContainer = document.getElementById('books-container');
    
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.setAttribute('data-book', bookCount);
    
    const readThroughBadge = bookCount > 1 ? `<span class="readthrough-badge" id="readthrough-${bookCount}">0% Read-through</span>` : '';
    
    bookCard.innerHTML = `
        <div class="book-header">
            <div class="book-number">${bookCount}</div>
            <h3>Book ${bookCount}</h3>
        </div>
        <button class="remove-book" onclick="removeBook(${bookCount})" id="remove-btn-${bookCount}">×</button>
        ${readThroughBadge}
        
        <div class="book-inputs">
            <div class="input-row">
                <div class="input-field">
                    <label for="sold-${bookCount}">
                        Books Sold
                        <button class="info-btn" onclick="toggleInfo('sold-info-${bookCount}')">?</button>
                    </label>
                    <input type="number" id="sold-${bookCount}" placeholder="0" min="0">
                    <div class="info-text" id="sold-info-${bookCount}">
                        Number of copies sold (not borrowed). Find this in your KDP dashboard under "Units Ordered" for the specific title and time period.
                    </div>
                </div>
                <div class="input-field">
                    <label for="pages-read-${bookCount}">
                        Pages Read
                        <button class="info-btn" onclick="toggleInfo('pages-read-info-${bookCount}')">?</button>
                    </label>
                    <input type="number" id="pages-read-${bookCount}" placeholder="0" min="0">
                    <div class="info-text" id="pages-read-info-${bookCount}">
                        Total KENP (Kindle Edition Normalized Pages) read for this book. Find in KDP dashboard under "KENP Read" column. This is the lifetime total of all pages read by KU subscribers.
                    </div>
                </div>
                <div class="input-field">
                    <label for="total-pages-${bookCount}">
                        Total Pages
                        <button class="info-btn" onclick="toggleInfo('total-pages-info-${bookCount}')">?</button>
                    </label>
                    <input type="number" id="total-pages-${bookCount}" placeholder="0" min="1">
                    <div class="info-text" id="total-pages-info-${bookCount}">
                        Your book's KENPC (Kindle Edition Normalized Page Count). Find in KDP dashboard: Bookshelf → 3-dot menu → KDP Select Info → scroll to "Earn royalties from..." section.
                    </div>
                </div>
                <div class="input-field">
                    <label for="book-price-${bookCount}">
                        Book Price
                        <button class="info-btn" onclick="toggleInfo('price-info-${bookCount}')">?</button>
                    </label>
                    <div class="input-wrapper">
                        <span class="currency">$</span>
                        <input type="number" id="book-price-${bookCount}" placeholder="4.99" min="0" step="0.01" value="4.99">
                    </div>
                    <div class="info-text" id="price-info-${bookCount}">
                        The list price of this book. You earn 70% royalty on sales between $2.99-$9.99, and 35% outside this range. This calculator assumes 70% royalty rate.
                    </div>
                </div>
            </div>
        </div>

        <div class="book-metrics">
            <div class="metric-item">
                <span class="metric-label">Estimated Readers</span>
                <span class="metric-value" id="readers-${bookCount}">0</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">KENP Revenue</span>
                <span class="metric-value" id="kenp-revenue-${bookCount}">$0.00</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Sales Revenue</span>
                <span class="metric-value" id="sales-revenue-${bookCount}">$0.00</span>
            </div>
            <div class="metric-item highlight">
                <span class="metric-label">Total Revenue</span>
                <span class="metric-value" id="book-revenue-${bookCount}">$0.00</span>
            </div>
        </div>
    `;
    
    booksContainer.appendChild(bookCard);
    initializeBookData(bookCount);
    
    bookCard.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            calculateResults();
            saveToStorage();
        });
    });
}

// Export/Import Functions
function exportData() {
    const data = {
        bookCount: bookCount,
        books: {},
        kenpRate: document.getElementById('kenp-rate').value,
        currentChartType: currentChartType,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    // Save all book data
    for (let i = 1; i <= bookCount; i++) {
        const sold = document.getElementById(`sold-${i}`)?.value || '';
        const pagesRead = document.getElementById(`pages-read-${i}`)?.value || '';
        const totalPages = document.getElementById(`total-pages-${i}`)?.value || '';
        const bookPrice = document.getElementById(`book-price-${i}`)?.value || '4.99';
        
        data.books[i] = {
            sold: sold,
            pagesRead: pagesRead,
            totalPages: totalPages,
            bookPrice: bookPrice
        };
    }
    
    // Create and download file
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ku-calculator-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Visual feedback
    const exportBtn = document.getElementById('export-data');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Exported!
    `;
    setTimeout(() => {
        exportBtn.innerHTML = originalText;
    }, 2000);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.bookCount || !data.books) {
                throw new Error('Invalid file format');
            }
            
            // Clear existing data
            while (bookCount > 1) {
                const lastBook = document.querySelector(`[data-book="${bookCount}"]`);
                if (lastBook) {
                    lastBook.remove();
                    booksData.delete(bookCount);
                    bookCount--;
                }
            }
            
            // Restore global settings
            document.getElementById('kenp-rate').value = data.kenpRate || '0.0045';
            currentChartType = data.currentChartType || 'cumulative';
            
            // Update chart toggle buttons
            document.querySelectorAll('.chart-toggle').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.chart === currentChartType);
            });
            
            // Add books as needed
            while (bookCount < data.bookCount) {
                addNewBookFromStorage();
            }
            
            // Restore book data
            for (let i = 1; i <= data.bookCount; i++) {
                const bookData = data.books[i];
                if (bookData) {
                    const soldInput = document.getElementById(`sold-${i}`);
                    const pagesReadInput = document.getElementById(`pages-read-${i}`);
                    const totalPagesInput = document.getElementById(`total-pages-${i}`);
                    const bookPriceInput = document.getElementById(`book-price-${i}`);
                    
                    if (soldInput) soldInput.value = bookData.sold;
                    if (pagesReadInput) pagesReadInput.value = bookData.pagesRead;
                    if (totalPagesInput) totalPagesInput.value = bookData.totalPages;
                    if (bookPriceInput) bookPriceInput.value = bookData.bookPrice || '4.99';
                }
            }
            
            // Update everything
            updateRemoveButtons();
            calculateResults();
            updateChart();
            saveToStorage();
            
            // Visual feedback
            const importBtn = document.getElementById('import-data');
            const originalText = importBtn.innerHTML;
            importBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Imported!
            `;
            setTimeout(() => {
                importBtn.innerHTML = originalText;
            }, 2000);
            
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
}

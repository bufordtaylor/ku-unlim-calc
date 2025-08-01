let bookCount = 3;
const booksData = new Map();
let revenueChart = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    // Initialize data for all 3 books
    for (let i = 1; i <= 3; i++) {
        initializeBookData(i);
    }
    updateRemoveButtons();
    calculateResults();
    initializeChart();
    
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
    
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', calculateResults);
    });
    
    document.getElementById('kenp-rate').addEventListener('input', calculateResults);
    document.getElementById('book-price').addEventListener('input', calculateResults);
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
        input.addEventListener('input', calculateResults);
    });
    
    updateChart();
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
    const bookPrice = parseFloat(document.getElementById('book-price').value) || 4.99;
    
    if (kenpRate < 0 || bookPrice < 0) {
        return;
    }
    
    let totalRevenue = 0;
    let book1Readers = 0;
    const readThroughRates = [];
    
    for (let i = 1; i <= bookCount; i++) {
        const bookData = booksData.get(i);
        if (!bookData) continue;
        
        const { sold, pagesRead, totalPages } = bookData;
        
        if (sold < 0 || pagesRead < 0 || totalPages < 0) {
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
        } else if (input.id === 'book-price') {
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
                    text: 'Cumulative Revenue by Book',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + formatNumber(value);
                        }
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
            }
        }
    });
    
    updateChart();
}

function updateChart() {
    if (!revenueChart) return;
    
    const kenpRate = parseFloat(document.getElementById('kenp-rate').value) || 0.0045;
    const bookPrice = parseFloat(document.getElementById('book-price').value) || 4.99;
    
    const labels = [];
    const datasets = [];
    const colors = [
        '#6366f1', // Primary
        '#22d3ee', // Secondary  
        '#10b981', // Success
        '#f59e0b', // Warning
        '#ef4444', // Danger
        '#8b5cf6', // Purple
        '#06b6d4', // Cyan
        '#84cc16'  // Lime
    ];
    
    // Create datasets for each book
    for (let bookNum = 1; bookNum <= bookCount; bookNum++) {
        datasets.push({
            label: `Book ${bookNum}`,
            data: [],
            borderColor: colors[(bookNum - 1) % colors.length],
            backgroundColor: colors[(bookNum - 1) % colors.length] + '20',
            fill: false
        });
    }
    
    // Generate data points for each book combination
    for (let dataPoint = 1; dataPoint <= bookCount; dataPoint++) {
        labels.push(`Book ${dataPoint}`);
        
        let cumulativeRevenue = 0;
        
        for (let bookNum = 1; bookNum <= dataPoint; bookNum++) {
            const bookData = booksData.get(bookNum);
            if (bookData) {
                const { sold, pagesRead } = bookData;
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
    
    revenueChart.data.labels = labels;
    revenueChart.data.datasets = datasets;
    revenueChart.update();
}
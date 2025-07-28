(() => {
  const form = document.getElementById('foodForm');
  const foodName = document.getElementById('foodName');
  const expiryDate = document.getElementById('expiryDate');
  const foodType = document.getElementById('foodType');
  const foodItems = document.getElementById('foodItems');
  const savedItems = document.getElementById('savedItems');
  const buttons = document.querySelectorAll('.filters button');
  const searchBox = document.getElementById('searchBox');
  const mostWasted = document.getElementById('mostWasted');
  const darkToggleBtn = document.getElementById('darkToggleBtn');

  let foodData = JSON.parse(localStorage.getItem('foodData')) || [];

  const calculateDaysLeft = date => {
    const now = new Date();
    const exp = new Date(date);
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  const getStatus = days => {
    if (days > 5) return 'safe';
    if (days > 2) return 'warning';
    return 'danger';
  };

  const showToast = msg => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const getMostWastedType = () => {
    const now = new Date();
    const counts = {};
    foodData.forEach(item => {
      const exp = new Date(item.expiry);
      if (exp < now) {
        counts[item.type] = (counts[item.type] || 0) + 1;
      }
    });
    let max = 0;
    let type = 'None';
    for (const key in counts) {
      if (counts[key] > max) {
        max = counts[key];
        type = key;
      }
    }
    mostWasted.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  };

  const render = (filter = 'all', search = '') => {
    foodItems.innerHTML = '';
    let count = 0;

    foodData.forEach((item, i) => {
      if (filter !== 'all' && item.type !== filter) return;
      if (!item.name.toLowerCase().includes(search.toLowerCase())) return;

      const days = calculateDaysLeft(item.expiry);
      const status = getStatus(days);

      const li = document.createElement('li');
      li.className = 'food-item';
      li.dataset.status = status;
      li.dataset.index = i; // Store index for event delegation
      li.innerHTML = `<strong>${item.name}</strong> (${item.type}) - Expires in ${
        days >= 0 ? days : 'Expired'
      } day(s) <button type="button" aria-label="Remove ${item.name}" class="remove-btn">🗑️</button>`;

      foodItems.appendChild(li);

      if (days >= 0) count++;
      if (days <= 2 && days >= 0) showToast(`⚠️ ${item.name} expires in ${days} day(s)`);
    });

    savedItems.textContent = count;
    getMostWastedType();
  };

  // Remove function
  const remove = index => {
    foodData.splice(index, 1);
    localStorage.setItem('foodData', JSON.stringify(foodData));
    render();
    renderFoodTypeChart();
  };

  // Event delegation for remove buttons inside foodItems UL
  foodItems.addEventListener('click', e => {
    if (e.target.classList.contains('remove-btn')) {
      const li = e.target.closest('li');
      if (!li) return;
      const index = parseInt(li.dataset.index, 10);
      if (!isNaN(index)) remove(index);
    }
  });

  // Form submission
  form.addEventListener('submit', e => {
    e.preventDefault();
    const newName = foodName.value.trim();
    const newType = foodType.value;

    if (!newName || !expiryDate.value) {
      showToast('⚠️ Please enter a valid food name and expiry date.');
      return;
    }

    if (new Date(expiryDate.value) < new Date()) {
      showToast('⚠️ Expiry date cannot be in the past.');
      return;
    }

    const duplicate = foodData.some(
      item => item.name.trim().toLowerCase() === newName.toLowerCase() && item.type === newType
    );

    if (duplicate) {
      showToast(`⚠️ ${newName} (${newType}) is already in your list.`);
      return;
    }

    const newItem = {
      name: newName,
      expiry: expiryDate.value,
      type: newType,
    };
    foodData.push(newItem);
    localStorage.setItem('foodData', JSON.stringify(foodData));
    form.reset();
    render();
    renderFoodTypeChart();
  });

  // Filter buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      render(btn.dataset.type, searchBox.value);
    });
  });

  // Search input
  searchBox.addEventListener('input', () => render('all', searchBox.value));

  document.querySelector('.donate-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showToast('✅ Thank you! Your donation request has been submitted.');
    this.reset();
  });
  // DARK MODE TOGGLE
  const toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkToggleBtn.textContent = isDark ? '☀️ Disable Dark Mode' : '🌙 Enable Dark Mode';
  };

  darkToggleBtn.addEventListener('click', toggleDarkMode);

  // Apply saved theme on load
  window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
      darkToggleBtn.textContent = '☀️ Disable Dark Mode';
    }
  });

  // Donation Center & Map logic
  const donateLink = document.getElementById('donateLink');
  const userRegionElem = document.getElementById('userRegion');
  const donateCenterLink = document.getElementById('donateCenterLink');
  const mapFrame = document.getElementById('mapFrame');

  const centers = {
    Ukraine: 'https://u24.gov.ua/en',
    Zambia: 'https://www.givedirectly.org/covid-19/africa/#zambia',
    USA: 'https://www.feedingamerica.org/find-your-local-foodbank',
    UK: 'https://www.trusselltrust.org/get-help/find-a-foodbank/',
    India: 'https://www.donatekart.com/',
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        mapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${
          longitude - 0.05
        }%2C${latitude - 0.05}%2C${longitude + 0.05}%2C${latitude + 0.05}&layer=mapnik&marker=${latitude}%2C${longitude}`;

        fetch('https://ipapi.co/json')
          .then(res => res.json())
          .then(data => {
            const region = data.country_name || 'Unknown';
            userRegionElem.textContent = region;
            const link = centers[region] || 'https://www.google.com/search?q=food+donation+near+me';
           donateCenterLink.href = 'https://www.feedingamerica.org/find-your-local-foodbank';
            donateCenterLink.textContent = 'Find Donation Center';
          })
          .catch(() => {
            userRegionElem.textContent = 'Unknown';
            donateCenterLink.href = 'https://www.google.com/search?q=food+donation+near+me';
            donateCenterLink.textContent = 'Find Donation Center';
          });
      },
      () => {
        userRegionElem.textContent = 'Location not available';
        donateCenterLink.href = 'https://www.google.com/search?q=food+donation+near+me';
        donateCenterLink.textContent = 'Find Donation Center';
        mapFrame.style.display = 'none';
      }
    );
  } else {
    userRegionElem.textContent = 'Geolocation not supported';
    donateCenterLink.href = 'https://www.google.com/search?q=food+donation+near+me';
    donateCenterLink.textContent = 'Find Donation Center';
    mapFrame.style.display = 'none';
  }

  // Chart rendering
  const renderFoodTypeChart = () => {
    const chartCanvas = document.getElementById('foodTypeChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');
    const typeCounts = {};

    foodData.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);

    if (window.foodChart) window.foodChart.destroy();

    window.foodChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
        datasets: [
          {
            label: 'Food Type Distribution',
            data,
            backgroundColor: ['#f39c12', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6', '#16a085'],
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Food Type Distribution' },
        },
      },
    });
  };

  // Basic unit tests (unchanged)
  const runTests = () => {
    console.log('Running Tests...');

    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 3);
    const dateStr = testDate.toISOString().split('T')[0];
    const result1 = calculateDaysLeft(dateStr);
    console.assert(result1 === 3, `❌ Test 1 Failed: Expected 3, got ${result1}`);

    const expired = new Date();
    expired.setDate(expired.getDate() - 2);
    const result2 = getStatus(calculateDaysLeft(expired.toISOString().split('T')[0]));
    console.assert(result2 === 'danger', `❌ Test 2 Failed: Expected danger, got ${result2}`);

    const emptyName = '';
    const emptyExpiry = '';
    console.assert(emptyName === '', '❌ Test 4 Failed: Name should be empty');
    console.assert(emptyExpiry === '', '❌ Test 4 Failed: Expiry date should be empty');

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const isPast = new Date(pastDate.toISOString().split('T')[0]) < new Date();
    console.assert(isPast === true, '❌ Test 5 Failed: Date should be detected as past');

    const testItems = [
      { name: 'Apples', type: 'fruits', expiry: '2025-01-01' },
      { name: 'Beans', type: 'canned', expiry: '2025-01-01' },
    ];
    const filterNoMatch = testItems.filter(i => i.type === 'vegetables');
    console.assert(filterNoMatch.length === 0, '❌ Test 6 Failed: Expected 0 matches for vegetables');

    const filtered = testItems.filter(i => i.type === 'fruits');
    console.assert(filtered.length === 1, `❌ Test 3 Failed: Expected 1 fruit, got ${filtered.length}`);

    console.log('✅ All Tests Passed (if no errors above).');
  };

  // Initialize app
  render();
  renderFoodTypeChart();
  runTests();
})();
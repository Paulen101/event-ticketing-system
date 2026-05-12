const readSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem('ticketUser') || 'null');
  } catch (error) {
    localStorage.removeItem('ticketUser');
    return null;
  }
};

const state = {
  authMode: 'login',
  user: readSavedUser()
};

const elements = {
  sessionLabel: document.getElementById('sessionLabel'),
  logoutButton: document.getElementById('logoutButton'),
  authPanel: document.getElementById('authPanel'),
  authForm: document.getElementById('authForm'),
  nameField: document.getElementById('nameField'),
  nameInput: document.getElementById('nameInput'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  eventsList: document.getElementById('eventsList'),
  eventCount: document.getElementById('eventCount'),
  bookingsPanel: document.getElementById('bookingsPanel'),
  bookingsList: document.getElementById('bookingsList'),
  adminPanel: document.getElementById('adminPanel'),
  analyticsSummary: document.getElementById('analyticsSummary'),
  capacityRate: document.getElementById('capacityRate'),
  capacityBar: document.getElementById('capacityBar'),
  capacityDetails: document.getElementById('capacityDetails'),
  categoryStats: document.getElementById('categoryStats'),
  adminEventsList: document.getElementById('adminEventsList'),
  toast: document.getElementById('toast')
};

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (state.user?.token) {
    headers.Authorization = `Bearer ${state.user.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
};

const showToast = (message) => {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.add('hidden'), 3500);
};

const runAction = async (action) => {
  try {
    await action();
  } catch (error) {
    showToast(error.message);
  }
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value, time) => {
  const date = value ? new Date(value).toLocaleDateString() : 'TBD';
  return time ? `${date} at ${time}` : date;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const percent = (value, total) => {
  if (!total) return 0;
  return Math.min(Math.round((Number(value || 0) / Number(total || 0)) * 100), 100);
};

const availableSeats = (event) => Math.max((event.seatCapacity || 0) - (event.bookedSeats || 0), 0);

const renderSession = () => {
  if (!state.user) {
    elements.sessionLabel.textContent = 'Signed out';
    elements.logoutButton.classList.add('hidden');
    elements.authPanel.classList.remove('hidden');
    elements.bookingsPanel.classList.add('hidden');
    elements.adminPanel.classList.add('hidden');
    elements.bookingsList.innerHTML = '';
    elements.adminEventsList.innerHTML = '';
    elements.analyticsSummary.innerHTML = '';
    elements.categoryStats.innerHTML = '';
    return;
  }

  elements.sessionLabel.textContent = `${state.user.name} (${state.user.role})`;
  elements.logoutButton.classList.remove('hidden');
  elements.authPanel.classList.add('hidden');
  elements.bookingsPanel.classList.remove('hidden');
  elements.adminPanel.classList.toggle('hidden', state.user.role !== 'admin');
};

const renderEvents = (events) => {
  elements.eventCount.textContent = `${events.length} event${events.length === 1 ? '' : 's'}`;
  elements.eventsList.innerHTML = events
    .map((event) => {
      const seats = availableSeats(event);

      return `
        <article class="event-card">
          <div>
            <h3>${escapeHtml(event.title)}</h3>
            <p class="muted">${escapeHtml(event.description || 'No description provided.')}</p>
          </div>
          <div class="meta">
            <span class="pill">${escapeHtml(event.category || 'General')}</span>
            <span class="pill">${escapeHtml(formatDate(event.date, event.time))}</span>
            <span class="pill">${escapeHtml(event.venue || 'Venue TBD')}</span>
          </div>
          <p class="muted">$${Number(event.price || 0).toFixed(2)} &middot; ${seats} seats left</p>
          <form class="book-row" data-book-event="${event._id}">
            <input aria-label="Ticket quantity" min="1" max="${seats}" name="quantity" type="number" value="1" ${seats ? '' : 'disabled'} />
            <button class="primary" type="submit" ${seats && state.user ? '' : 'disabled'}>Book</button>
          </form>
        </article>
      `;
    })
    .join('');
};

const renderBookings = (bookings) => {
  elements.bookingsList.innerHTML =
    bookings
      .map(
        (booking) => `
          <div class="list-item">
            <strong>${escapeHtml(booking.event?.title || 'Deleted event')}</strong>
            <p class="muted">${escapeHtml(formatDate(booking.event?.date, booking.event?.time))}</p>
            <span>${booking.quantity} ticket${booking.quantity === 1 ? '' : 's'} &middot; QR ${escapeHtml(booking.qrCode)}</span>
          </div>
        `
      )
      .join('') || '<p class="muted">No bookings yet.</p>';
};

const renderAnalytics = (analytics) => {
  const occupancyRate = percent(analytics.totalBookedSeats, analytics.totalSeatCapacity);
  const revenueRate = percent(analytics.totalRevenue, analytics.totalPotentialRevenue);
  const categories = analytics.categoryStats || [];

  const metrics = [
    ['Revenue', formatCurrency(analytics.totalRevenue), `${revenueRate}% of potential`],
    ['Tickets sold', formatNumber(analytics.totalTicketsBooked), `${formatNumber(analytics.totalBookings)} bookings`],
    ['Events', formatNumber(analytics.totalEvents), `${formatNumber(analytics.totalUsers)} users`],
    ['Seats left', formatNumber(analytics.totalAvailableSeats), `${occupancyRate}% occupied`]
  ];

  elements.analyticsSummary.innerHTML = metrics
    .map(
      ([label, value, note]) => `
        <article class="metric-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </article>
      `
    )
    .join('');

  elements.capacityRate.textContent = `${occupancyRate}% occupied`;
  elements.capacityBar.style.width = `${occupancyRate}%`;
  elements.capacityDetails.innerHTML = `
    <span>${formatNumber(analytics.totalBookedSeats)} booked</span>
    <span>${formatNumber(analytics.totalSeatCapacity)} total seats</span>
  `;

  elements.categoryStats.innerHTML =
    categories
      .map((category) => {
        const categoryRate = percent(category.bookedSeats, category.seatCapacity);

        return `
          <div class="category-row">
            <div>
              <strong>${escapeHtml(category.category || 'Uncategorized')}</strong>
              <span>${formatNumber(category.events)} event${category.events === 1 ? '' : 's'} &middot; ${formatNumber(category.bookedSeats)} booked</span>
            </div>
            <div class="category-meter" aria-label="${categoryRate}% occupied">
              <span style="width: ${categoryRate}%"></span>
            </div>
          </div>
        `;
      })
      .join('') || '<p class="muted">No category data yet.</p>';
};

const renderAdminEvents = (events) => {
  elements.adminEventsList.innerHTML =
    events
      .map((event) => {
        const users = event.bookedUsers || [];
        const userRows =
          users
            .map(
              (user) => `
                <div class="user-row">
                  <div>
                    <strong>${escapeHtml(user.name)}</strong>
                    <span>${escapeHtml(user.email)}</span>
                  </div>
                  <span>${user.totalTickets} ticket${user.totalTickets === 1 ? '' : 's'}</span>
                </div>
              `
            )
            .join('') || '<p class="muted">No users have booked this event.</p>';

        return `
          <article class="admin-event">
            <div class="section-heading">
              <div>
                <h3>${escapeHtml(event.title)}</h3>
                <p class="muted">${escapeHtml(formatDate(event.date, event.time))} &middot; ${escapeHtml(event.venue || 'Venue TBD')}</p>
              </div>
              <span class="pill">${event.bookedSeats || 0}/${event.seatCapacity} booked</span>
            </div>
            <div class="booking-users">${userRows}</div>
          </article>
        `;
      })
      .join('') || '<p class="muted">No events found.</p>';
};

const loadEvents = async () => {
  const events = await request('/api/events');
  renderEvents(events);
};

const loadBookings = async () => {
  if (!state.user) return;
  const bookings = await request('/api/bookings');
  renderBookings(bookings);
};

const loadAdminEvents = async () => {
  if (state.user?.role !== 'admin') return;
  const events = await request('/api/admin/dashboard/events');
  renderAdminEvents(events);
};

const loadAnalytics = async () => {
  if (state.user?.role !== 'admin') return;
  const analytics = await request('/api/admin/analytics');
  renderAnalytics(analytics);
};

const refresh = async () => {
  try {
    renderSession();
    await loadEvents();
    await loadBookings();
    await loadAnalytics();
    await loadAdminEvents();
  } catch (error) {
    showToast(error.message);
  }
};

document.querySelectorAll('[data-auth-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    state.authMode = button.dataset.authMode;
    document.querySelectorAll('[data-auth-mode]').forEach((tab) => tab.classList.remove('active'));
    button.classList.add('active');
    elements.nameField.classList.toggle('hidden', state.authMode !== 'register');
    elements.nameInput.required = state.authMode === 'register';
  });
});

elements.authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    email: elements.emailInput.value,
    password: elements.passwordInput.value
  };

  if (state.authMode === 'register') {
    payload.name = elements.nameInput.value;
  }

  try {
    state.user = await request(`/api/auth/${state.authMode}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    localStorage.setItem('ticketUser', JSON.stringify(state.user));
    elements.authForm.reset();
    showToast('Signed in');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
});

elements.eventsList.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.user) {
    showToast('Login before booking tickets.');
    return;
  }

  const form = event.target.closest('[data-book-event]');
  const quantity = Number(new FormData(form).get('quantity'));

  try {
    const result = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        event: form.dataset.bookEvent,
        quantity
      })
    });
    showToast(result.emailSent ? 'Booking created and confirmation email sent.' : 'Booking created. Email is not configured.');
    await refresh();
  } catch (error) {
    showToast(error.message);
  }
});

elements.logoutButton.addEventListener('click', () => {
  state.user = null;
  localStorage.removeItem('ticketUser');
  showToast('Signed out');
  refresh();
});

document.getElementById('refreshEvents').addEventListener('click', refresh);
document.getElementById('refreshBookings').addEventListener('click', () => runAction(loadBookings));
document.getElementById('refreshAdmin').addEventListener('click', () =>
  runAction(async () => {
    await loadAnalytics();
    await loadAdminEvents();
  })
);

refresh();

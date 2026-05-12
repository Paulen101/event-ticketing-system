const state = {
  authMode: 'login',
  user: JSON.parse(localStorage.getItem('ticketUser') || 'null')
};

const elements = {
  sessionLabel: document.getElementById('sessionLabel'),
  logoutButton: document.getElementById('logoutButton'),
  authForm: document.getElementById('authForm'),
  nameField: document.getElementById('nameField'),
  nameInput: document.getElementById('nameInput'),
  roleField: document.getElementById('roleField'),
  roleInput: document.getElementById('roleInput'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  eventsList: document.getElementById('eventsList'),
  eventCount: document.getElementById('eventCount'),
  bookingsPanel: document.getElementById('bookingsPanel'),
  bookingsList: document.getElementById('bookingsList'),
  adminPanel: document.getElementById('adminPanel'),
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

const availableSeats = (event) => Math.max((event.seatCapacity || 0) - (event.bookedSeats || 0), 0);

const renderSession = () => {
  if (!state.user) {
    elements.sessionLabel.textContent = 'Signed out';
    elements.logoutButton.classList.add('hidden');
    elements.bookingsPanel.classList.add('hidden');
    elements.adminPanel.classList.add('hidden');
    return;
  }

  elements.sessionLabel.textContent = `${state.user.name} (${state.user.role})`;
  elements.logoutButton.classList.remove('hidden');
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

const refresh = async () => {
  try {
    renderSession();
    await loadEvents();
    await loadBookings();
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
    elements.roleField.classList.toggle('hidden', state.authMode !== 'register');
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
    payload.role = elements.roleInput.value;
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
document.getElementById('refreshBookings').addEventListener('click', loadBookings);
document.getElementById('refreshAdmin').addEventListener('click', loadAdminEvents);

refresh();

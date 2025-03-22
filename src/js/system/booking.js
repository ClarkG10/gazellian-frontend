import { backendURL, createToast, userId } from "../utils/utils.js";

const tableBody = document.getElementById("bookingsTable");
const confirmationModal = document.getElementById("confirmationModal");
const declineConfirmationModal = document.getElementById(
  "declineConfirmationModal"
);
const acceptConfirmationModal = document.getElementById(
  "acceptConfirmationModal"
);

const CACHE_NAME = "booking-cache";
const CUSTOMERBOOKING_URL = backendURL + "/api/booking/customer/index";
const SPBOOKING_URL = backendURL + "/api/booking/provider/index";

const apiUrl =
  localStorage.getItem("type") === "customer"
    ? CUSTOMERBOOKING_URL
    : SPBOOKING_URL;

// Function to fetch and cache booking data
async function fetchBooking(firstLoad = false) {
  try {
    const cache = await caches.open(CACHE_NAME);

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const bookingData = await response.json();
    await cache.put(apiUrl, new Response(JSON.stringify(bookingData)));

    localStorage.setItem("bookingDataLoaded", "true");

    if (firstLoad) {
      location.reload();
    } else {
      loadCachedBooking();
    }
  } catch (error) {
    console.error("Error fetching booking data:", error);
  }
}

let currentPage = 1;
const rowsPerPage = 10;
let filteredBookings = [];
let bookingData = [];
let bookings = [];

async function loadCachedBooking() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedBooking = await cache.match(apiUrl);

    if (cachedBooking) {
      bookingData = await cachedBooking.json();
      getBookingHTML();
    } else {
      await fetchBooking(true);
    }
  } catch (error) {
    console.error("Error loading cached booking data:", error);
  }
}

// Function to display booking data
async function getBookingHTML() {
  bookings = bookingData;
  filteredBookings = [...bookings];
  renderTable();
}

function renderTable() {
  tableBody.innerHTML = "";

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedBookings = filteredBookings.slice(start, end);

  paginatedBookings.forEach((booking) => {
    const row = `<tr class="bg-white border-b border-gray-300">
      <td class="px-6 py-4 font-medium text-gray-900">${
        booking.event.event_name
      }</td>
      <td class="px-6 py-4">${booking.booking_date}</td>
      <td class="px-6 py-4">${booking.services.service_name}</td>
      <td class="px-6 py-4">₱${booking.requested_amount.toLocaleString()}</td>
      <td class="px-6 py-4">${booking.created_at.split("T")[0]}</td>
      <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs ${
        booking.status === "accepted"
          ? "bg-green-500 text-white"
          : booking.status === "pending"
          ? "bg-yellow-500 text-white"
          : "bg-red-500 text-white"
      }">${booking.status}</span></td>
      <td class="py-4"><span class="px-2 py-1 rounded-full text-xs flex ${
        booking.payment_status === "paid"
          ? "bg-green-500 text-white"
          : booking.payment_status === "pending"
          ? "bg-yellow-500 text-white"
          : "bg-red-500 text-white"
      }" style="width: fit-content">${booking.payment_status}</span></td>
      <td class="py-6 px-6 flex space-x-2">
  ${
    booking.status === "accepted" && localStorage.getItem("type") === "customer"
      ? `<button class="text-blue-600 text-sm font-medium hover:underline payBooking" data-status="Paid">Pay</button>
         <button class="text-red-600 text-sm font-medium hover:underline cancelBooking" data-id="${booking.id}" data-status="cancelled">Cancel</button>`
      : booking.status === "pending" &&
        localStorage.getItem("type") === "customer"
      ? `<button class="text-red-600 text-sm font-medium hover:underline cancelBooking" data-id="${booking.id}" data-status="cancelled">Cancel</button>`
      : booking.status === "pending" &&
        localStorage.getItem("type") === "service provider"
      ? `<button class="text-blue-600 text-sm font-medium hover:underline acceptBooking" data-id="${booking.id}" data-status="accepted">Accept</button>
         <button class="text-red-600 text-sm font-medium hover:underline declineBooking" data-id="${booking.id}" data-status="declined">Decline</button>`
      : booking.status === "accepted" &&
        localStorage.getItem("type") === "service provider"
      ? `<button class="text-red-600 text-sm font-medium hover:underline declineBooking" data-id="${booking.id}" data-status="declined">Decline</button>`
      : `<small>no action.</small>`
  }
</td>

    </tr>`;
    tableBody.innerHTML += row;
  });

  if (filteredBookings.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" class="px-6 py-4 text-center">No bookings found</td></tr>`;
  }
  document.getElementById("startEntry").textContent =
    filteredBookings.length === 0 ? start : start + 1;
  document.getElementById("endEntry").textContent = Math.min(
    end,
    filteredBookings.length
  );
  document.getElementById("totalEntries").textContent = filteredBookings.length;

  updatePaginationButtons();
}

// Function to update pagination buttons
function updatePaginationButtons() {
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled =
    currentPage * rowsPerPage >= filteredBookings.length;
}

// Pagination event listeners
document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage * rowsPerPage < filteredBookings.length) {
    currentPage++;
    renderTable();
  }
});

// Sorting & Filtering function
function sortTable(attr, order, value = "") {
  if (attr === "status" || attr === "payment_status") {
    if (value === "none") {
      filteredBookings = [...bookings]; // Reset
    } else {
      filteredBookings = bookings.filter((booking) => booking[attr] === value);
    }
  } else {
    filteredBookings.sort((a, b) => {
      let aValue = a[attr];
      let bValue = b[attr];

      if (attr === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);

        return order === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string") {
        return order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }

  currentPage = 1;
  renderTable();
}

// Attach event listeners for sorting
document
  .getElementById("sortEventName")
  .addEventListener("change", function () {
    console.log(this.value);

    if (this.value !== "none") sortTable("event", this.value, "");
  });

document
  .getElementById("sortEventDate")
  .addEventListener("change", function () {
    console.log(this.value);
    if (this.value !== "none") sortTable("created_at", this.value, "");
  });

document.getElementById("sortStatus").addEventListener("change", function () {
  console.log(this.value);

  sortTable("status", "asc", this.value);
});

document.getElementById("sortPayment").addEventListener("change", function () {
  console.log(this.value);

  sortTable("payment_status", "asc", this.value);
});

// Load data on page load
loadCachedBooking();

if (localStorage.getItem("type") === "service provider") {
  // SSE (Server-Sent Events) for live updates
  const eventSource = new EventSource(backendURL + "/api/booking/stream", {
    withCredentials: true,
  });

  let previousLength = 0;

  eventSource.onmessage = async (event) => {
    const updatedData = JSON.parse(event.data);
    const updatedLength = Array.isArray(updatedData) ? updatedData.length : 1;

    // if (updatedLength > previousLength && previousLength === 0) {
    //   previousLength = updatedLength;
    //   return;
    // }

    if (previousLength === 0) {
      previousLength = updatedLength;
      return;
    }

    if (
      Array.isArray(updatedData) &&
      updatedData.some(
        (data) =>
          parseInt(data.provider_id) === parseInt(userId) &&
          data.status === "pending"
      )
    ) {
      if (updatedLength !== previousLength) {
        await fetchBooking();
        if (updatedLength > previousLength) {
          createToast("New booking received", "booking");
        }
        previousLength = updatedLength;
      }
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    eventSource.close();
    window.reload();
  };

  declineConfirmationModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("closeModal")) {
      declineConfirmationModal.classList.add("hidden");
    }
  });

  acceptConfirmationModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("closeModal")) {
      acceptConfirmationModal.classList.add("hidden");
    }
  });

  document
    .getElementById("declineButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const bookingId = parseInt(
        document.getElementById("declineButton").dataset.id
      );
      const bookingStatus =
        document.getElementById("declineButton").dataset.status;
      const data = {
        status: bookingStatus,
      };
      await updateBookingStatus(bookingId, data);
    });

  document
    .getElementById("acceptButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const bookingId = parseInt(
        document.getElementById("acceptButton").dataset.id
      );
      const bookingStatus =
        document.getElementById("acceptButton").dataset.status;

      const data = {
        status: bookingStatus,
        payment_status: "pending",
      };
      await updateBookingStatus(bookingId, data);
    });

  tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("declineBooking")) {
      const bookingId = parseInt(e.target.dataset.id);
      const bookingStatus = e.target.dataset.status;

      document
        .getElementById("declineConfirmationModal")
        .classList.remove("hidden");
      document.getElementById("declineButton").dataset.id = bookingId;
      document.getElementById("declineButton").dataset.status = bookingStatus;
    }
  });

  tableBody.addEventListener("click", (e) => {
    console.log("naclick??");

    if (e.target.classList.contains("acceptBooking")) {
      const bookingId = parseInt(e.target.dataset.id);
      const bookingStatus = e.target.dataset.status;

      document
        .getElementById("acceptConfirmationModal")
        .classList.remove("hidden");
      document.getElementById("acceptButton").dataset.id = bookingId;
      document.getElementById("acceptButton").dataset.status = bookingStatus;
    }
  });
} else {
  confirmationModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("closeModal")) {
      confirmationModal.classList.add("hidden");
    }
  });

  document
    .getElementById("cancelButton")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const bookingId = parseInt(
        document.getElementById("cancelButton").dataset.id
      );
      const bookingStatus =
        document.getElementById("cancelButton").dataset.status;

      const data = {
        status: bookingStatus,
      };

      await updateBookingStatus(bookingId, data);
    });
  tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("cancelBooking")) {
      const bookingId = parseInt(e.target.dataset.id);
      const bookingStatus = e.target.dataset.status;

      document.getElementById("confirmationModal").classList.remove("hidden");
      document.getElementById("cancelButton").dataset.id = bookingId;
      document.getElementById("cancelButton").dataset.status = bookingStatus;
    }
  });
}

async function updateBookingStatus(bookingId, data) {
  const request = await fetch(backendURL + "/api/booking/status/" + bookingId, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify(data),
  });

  if (!request.ok) {
    throw new Error(await request.text());
  }

  if (data.status === "cancelled") {
    confirmationModal.classList.add("hidden");
  } else if (data.status === "accepted") {
    acceptConfirmationModal.classList.add("hidden");
  } else {
    declineConfirmationModal.classList.add("hidden");
  }
  fetchBooking();
}

async function updatePaymentStatus() {}

import { backendURL, formatDate } from "../utils/utils.js";

const loader = document.querySelector("#pulseLoader");

const upcomingEventsContainer = document.getElementById(
  "upcoming-events-container"
);
const eventOptions = document.getElementById("event-options");
const budgetTracker = document.getElementById("budget-tracker");
const notificationsContainer = document.getElementById(
  "notification-container"
);
const activeBookingsTable = document.getElementById("active-bookings");

const BUDGET_CACHE_NAME = "allocated-budget-cache";
const EVENT_CACHE_NAME = "events-cache";
const BOOKING_CACHE_NAME = "booking-cache";
const NOTIFICATION_CACHE_NAME = "notification-cache";
const SP_CACHE_NAME = "service-provider-cache";

const BOOKING_URL = backendURL + "/api/booking/customer/index";
const EVENT_URL = backendURL + "/api/event/customer/index";
const BUDGET_URL = backendURL + "/api/budget-allocation/customer/index";
const NOTIFICATION_URL = backendURL + "/api/notification/users/index";
const SERVICE_PROVIDER_URL = backendURL + "/api/service-provider";
const CATEGORY_URL = backendURL + "/api/category";

const cachesMap = {
  [BUDGET_URL]: BUDGET_CACHE_NAME,
  [EVENT_URL]: EVENT_CACHE_NAME,
  [BOOKING_URL]: BOOKING_CACHE_NAME,
  [NOTIFICATION_URL]: NOTIFICATION_CACHE_NAME,
  [SERVICE_PROVIDER_URL]: SP_CACHE_NAME,
  [CATEGORY_URL]: SP_CACHE_NAME,
};

// Open all required caches in parallel
const [budgetcache, eventcache, bookingcache, notificationcache, spcache] =
  await Promise.all([
    caches.open(BUDGET_CACHE_NAME),
    caches.open(EVENT_CACHE_NAME),
    caches.open(BOOKING_CACHE_NAME),
    caches.open(NOTIFICATION_CACHE_NAME),
    caches.open(SP_CACHE_NAME),
  ]);

async function fetchData(firstLoad = false) {
  loader.innerHTML = `<div class="max-w-7xl mx-auto px-6 py-8">
  <h1 class="text-lg font-bold text-gray-900 mb-5">Dashboard</h1>

  <!-- Upcoming Events Skeleton -->
  <div class="bg-white border-gray-300 border shadow-sm rounded-lg p-6 mb-3 animate-pulse">
    <h2 class="text-md font-semibold text-gray-900 mb-4"><div class="h-6 bg-gray-300 rounded w-1/8"></div></h2>
    <ul class="space-y-4">
      <li class="h-6 bg-gray-300 rounded w-full"></li>
      <li class="h-6 bg-gray-300 rounded w-3/4"></li>
    </ul>
  </div>

  <div class="flex flex-col md:flex-row gap-4 mt-8">
    <!-- Budget Tracker Skeleton -->
    <div class="w-full md:w-1/2 bg-white border-gray-300 border shadow-sm rounded-lg p-6 animate-pulse">
      <h2 class="text-md font-semibold text-gray-900 mb-4 flex justify-between">
        <div class="h-6 bg-gray-300 rounded w-1/8"></div>
        <div class="h-8 bg-gray-300 rounded w-36"></div>
      </h2>
      <div class="h-24 bg-gray-300 rounded"></div>
    </div>

    <!-- Notifications Skeleton -->
    <div class="w-full md:w-1/2 bg-white border-gray-300 border shadow-sm rounded-lg p-6 animate-pulse">
      <h2 class="text-md font-semibold text-gray-900 mb-4"><div class="h-6 bg-gray-300 rounded w-1/8"></div></h2>
      <ul class="space-y-3">
        <li class="h-6 bg-gray-300 rounded w-full"></li>
        <li class="h-6 bg-gray-300 rounded w-3/4"></li>
        <li class="h-6 bg-gray-300 rounded w-1/2"></li>
      </ul>
    </div>
  </div>

  <!-- Quick Actions Skeleton -->
  <div class="mt-8 grid grid-cols-1 md:grid-cols-1 gap-6">
    <div class="bg-white border-gray-300 border shadow-sm rounded-lg p-6 animate-pulse">
      <h2 class="text-md font-semibold text-gray-900 mb-4 flex justify-between">
        <div class="h-6 bg-gray-300 rounded w-1/8"></div>
        <div class="h-6 bg-gray-300 rounded w-24"></div>
      </h2>
      <div class="overflow-x-auto sm:rounded-lg">
        <table class="w-full text-sm text-left text-gray-600">
          <thead class="text-xs text-gray-700 uppercase0">
            <tr>
              <th class="px-6 py-3"><div class="h-6 bg-gray-300 rounded w-full"></div></th>
              <th class="px-6 py-3"><div class="h-6 bg-gray-300 rounded w-3/4"></div></th>
              <th class="px-6 py-3"><div class="h-6 bg-gray-300 rounded w-1/2"></div></th>
              <th class="px-6 py-3"><div class="h-6 bg-gray-300 rounded w-full"></div></th>
              <th class="px-6 py-3"><div class="h-6 bg-gray-300 rounded w-3/4"></div></th>
              <th class="px-6 py-3"><div class="h-6 bg-gray-300 rounded w-1/2"></div></th>
              <th class="px-6 py-3"><div class="h-6 bg-gray-300 rounded w-full"></div></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="px-6 py-4"><div class="h-6 bg-gray-300 rounded w-full"></div></td>
              <td class="px-6 py-4"><div class="h-6 bg-gray-300 rounded w-3/4"></div></td>
              <td class="px-6 py-4"><div class="h-6 bg-gray-300 rounded w-1/2"></div></td>
              <td class="px-6 py-4"><div class="h-6 bg-gray-300 rounded w-full"></div></td>
              <td class="px-6 py-4"><div class="h-6 bg-gray-300 rounded w-3/4"></div></td>
              <td class="px-6 py-4"><div class="h-6 bg-gray-300 rounded w-1/2"></div></td>
              <td class="px-6 py-4"><div class="h-6 bg-gray-300 rounded w-full"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`;

  const urls = [
    BUDGET_URL,
    EVENT_URL,
    NOTIFICATION_URL,
    BOOKING_URL,
    SERVICE_PROVIDER_URL,
    CATEGORY_URL,
  ];

  try {
    const responses = await Promise.all(
      urls.map((url) =>
        fetch(url, {
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        })
      )
    );

    // Check if any request failed
    if (responses.some((res) => !res.ok)) {
      throw new Error("One or more requests failed.");
    }

    // Convert responses to JSON in parallel
    const data = await Promise.all(responses.map((res) => res.json()));

    // Store fetched data in respective caches
    await Promise.all(
      urls.map((url, index) => {
        const cacheName = cachesMap[url];
        return caches
          .open(cacheName)
          .then((cache) =>
            cache.put(url, new Response(JSON.stringify(data[index])))
          );
      })
    );

    if (firstLoad) {
      location.reload();
    } else {
      loadCachedData();
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

// Data variables
let budgetData = [];
let eventData = [];
let notificationData = [];
let bookingData = [];
let spData = [];
let categoryData = [];

async function loadCachedData() {
  const cachedBudget = await budgetcache.match(BUDGET_URL);
  const cachedEvent = await eventcache.match(EVENT_URL);
  const cachedNotification = await notificationcache.match(NOTIFICATION_URL);
  const cachedBooking = await bookingcache.match(BOOKING_URL);
  const cachedSP = await spcache.match(SERVICE_PROVIDER_URL);
  const cachedCategory = await spcache.match(CATEGORY_URL); // Intentional

  if (
    cachedBudget &&
    cachedEvent &&
    cachedNotification &&
    cachedBooking &&
    cachedSP &&
    cachedCategory
  ) {
    budgetData = await cachedBudget.json();
    eventData = await cachedEvent.json();
    notificationData = await cachedNotification.json();
    bookingData = await cachedBooking.json();
    spData = await cachedSP.json();
    categoryData = await cachedCategory.json();
  } else {
    fetchData(true);
  }
}

await loadCachedData();

function getEventHTML() {
  let upcomingEventHTML = ``;
  let eventOptionsHTML = "";

  const filterEvents = eventData.sort((a, b) => {
    const order = { Ongoing: 1, Planning: 2, Completed: 3, Cancelled: 4 };
    return order[a.status] - order[b.status];
  });

  for (let i = 0; i < filterEvents.length; i++) {
    if (
      filterEvents[i].status === "Ongoing" ||
      filterEvents[i].status === "Planning"
    ) {
      upcomingEventHTML += `
          <li class="flex items-center justify-between border-b border-gray-300 pb-2">
            <div>
              <p class="text-md font-medium text-gray-800">
                ${filterEvents[i].event_name}
              </p>
              <span class="text-sm text-gray-500"
                >${formatDate(filterEvents[i].event_date).split("at")[0]}| ${
        filterEvents[i].event_type
      }</span
              >
            </div>
            <span
              class="px-3 py-1 text-sm font-medium text-white ${
                filterEvents[i].status === "Completed"
                  ? "customBg"
                  : filterEvents[i].status === "Cancelled"
                  ? "bg-red-500"
                  : filterEvents[i].status === "Ongoing"
                  ? "bg-blue-500"
                  : "bg-yellow-300"
              } rounded-lg"
              >${filterEvents[i].status}</span
            >
          </li>`;
    }
    if (filterEvents[i].status !== "Cancelled") {
      eventOptionsHTML += `<option  ${i == 0 ? "selected" : ``} value="${
        filterEvents[i].id
      }">${filterEvents[i].event_name} ${
        filterEvents[i].status === "Completed" ? `(Completed)` : ``
      }</option>`;
    }
  }

  if (filterEvents.length === 0) {
    upcomingEventHTML = `No upcoming events. Please schedule one. <a href="events.html" class="underline customTextColor">Click here.</a>`;
  }

  upcomingEventsContainer.innerHTML = upcomingEventHTML;
  eventOptions.innerHTML = eventOptionsHTML;
  eventOptions.dispatchEvent(new Event("change"));
}

function getBudgetTrackerHTML(totalBudget, totalSpent) {
  const percentage = Math.min((totalSpent / totalBudget) * 100, 100).toFixed(2);
  const totalRemainingBudget = totalBudget - totalSpent;

  let budgetTrackerHTML = `<p class="text-sm text-gray-500">Total Budget</p>
          <h3 class="text-2xl font-bold text-gray-900">₱${totalBudget.toLocaleString()}</h3>
          <div class="w-full bg-gray-200 rounded-full h-3 mt-3">
            <div class="customBg h-3 rounded-full" id="progress" style="width: 0%"></div>
          </div>
          <div class="flex justify-between mt-2 text-sm text-gray-600">
            <span>Spent: ₱${totalSpent.toLocaleString()}</span>
            <span>Remaining: ₱${totalRemainingBudget.toLocaleString()}</span>
          </div>`;

  budgetTracker.innerHTML = budgetTrackerHTML;

  setTimeout(() => {
    document.getElementById(`progress`).style.width = `${percentage}%`;
  }, 100);
}

eventOptions.addEventListener("change", () => {
  const selectedEventId = parseInt(eventOptions.value);

  const eventTotalBudget = eventData.find(
    (budget) => budget.id === selectedEventId
  ).budget;

  const eventBudget = budgetData.filter(
    (budget) => budget.event_id === selectedEventId
  );

  console.log(eventBudget, budgetData);

  const eventTotalSpent = eventBudget.reduce(
    (total, budget) => total + budget.actual_spent,
    0
  );

  getBudgetTrackerHTML(eventTotalBudget, eventTotalSpent);
});

function getNotificationsHTML() {
  let notificationHTML = "";

  for (let i = 0; i < 2; i++) {
    notificationHTML += `
          <li class="flex items-center justify-between border-b border-gray-300 pb-2">
            <div>
              <p class="text-sm font-medium text-gray-800">
                ${notificationData[i].message}
              </p>
              <span class="text-sm text-gray-500"
                >${formatDate(notificationData[i].created_at)}</span
              >
            </div>
            <span
              class="px-3 py-1 text-sm font-small text-white ${
                notificationData[i].status === 1 ? `` : `bg-yellow-500`
              }  rounded-lg"
              >${notificationData[i].status === 1 ? `` : `New`}</span
            >
          </li>`;
  }
  notificationsContainer.innerHTML = notificationHTML;
}

function getActivebooking() {
  let activeBookingHTML = "";

  const filteredBookings = bookingData
    .filter((booking) => booking.status !== "cancelled")
    .slice(0, 2);

  console.log(filteredBookings);

  for (let i = 0; i < filteredBookings.length; i++) {
    activeBookingHTML += `<tr class="bg-white border-b border-gray-300">
      <td class="px-6 py-4 font-medium text-gray-900">${
        filteredBookings[i]?.event?.event_name
      }</td>
      <td class="px-6 py-4">${filteredBookings[i].booking_date}</td>
      <td class="px-6 py-4">${filteredBookings[i].services.service_name}</td>
      <td class="px-6 py-4">₱${filteredBookings[i].requested_amount}</td>
      <td class="px-6 py-4">${filteredBookings[i].created_at.split("T")[0]}</td>
      <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs ${
        filteredBookings[i].status === "accepted"
          ? "bg-green-500 text-white"
          : filteredBookings[i].status === "pending"
          ? "bg-yellow-500 text-white"
          : "bg-red-500 text-white"
      }">${filteredBookings[i].status}</span></td>
      <td class="py-4"><span class="px-2 py-1 rounded-full text-xs flex ${
        filteredBookings[i].payment_status === "paid"
          ? "bg-green-500 text-white"
          : filteredBookings[i].payment_status === "pending"
          ? "bg-yellow-500 text-white"
          : "bg-red-500 text-white"
      }" style="width: fit-content">${
      filteredBookings[i].payment_status
    }</span></td>
    </tr>`;
  }

  loader.innerHTML = ``;
  activeBookingsTable.innerHTML = activeBookingHTML;
}

getEventHTML();
getNotificationsHTML();
getActivebooking();

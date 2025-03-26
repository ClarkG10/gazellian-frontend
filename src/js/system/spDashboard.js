import { backendURL, formatDate, userId } from "../utils/utils.js";

const calendarEl = document.getElementById("calendar");
const activeBookingsTable = document.getElementById("active-bookings");
const reviewsTable = document.getElementById("reviewsTable");
const totalbookings = document.getElementById("totalBookings");
const totalReviews = document.getElementById("totalReviews");
const totalServices = document.getElementById("totalServices");
const loader = document.getElementById("pulseLoader");

const BOOKING_CACHE_NAME = "booking-cache";
const BOOKING_URL = backendURL + "/api/booking/provider/index";
const REVIEWS_CACHE_NAME = "reviews-cache";
const SERVICES_CACHE_NAME = "services-cache";
const SP_CACHE_NAME = "service-provider-cache";
const PORTFOLIO_CACHE_NAME = "portfolio-cache";

const REVIEWS_URL = backendURL + "/api/provider/review/index";
const SERVICES_URL = backendURL + "/api/services/index";
const SERVICE_PROVIDER_URL = backendURL + "/api/service-provider";
const CATEGORY_URL = backendURL + "/api/category";
const PORTFOLIO_URL = backendURL + "/api/provider/portfolio/index";

const reviewCache = await caches.open(REVIEWS_CACHE_NAME);
const spCache = await caches.open(SP_CACHE_NAME);
const serviceCache = await caches.open(SERVICES_CACHE_NAME);
const bookingCache = await caches.open(BOOKING_CACHE_NAME);
const portfolioCache = await caches.open(PORTFOLIO_CACHE_NAME);

let bookings = [];
let reviewsData = [];
let servicesData = [];

async function getCachedData() {
  loader.innerHTML = `  <div class="max-w-7xl mx-auto px-6 py-8 mb-64">
      <!-- Dashboard Title -->
      <h1
        class="text-lg font-bold text-gray-900 mb-5 animate-pulse bg-gray-300 h-6 w-40 rounded"
      ></h1>

      <!-- Dashboard Stats Skeleton -->
      <div class="flex flex-col md:flex-row justify-between gap-2 mt-3">
        <div
          class="block w-full p-4 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center animate-pulse"
        >
          <div>
            <div class="mb-1 h-5 w-32 bg-gray-300 rounded"></div>
            <div class="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div class="size-8 bg-gray-300 rounded"></div>
        </div>
        <div
          class="block w-full p-4 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center animate-pulse"
        >
          <div>
            <div class="mb-1 h-5 w-32 bg-gray-300 rounded"></div>
            <div class="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div class="size-8 bg-gray-300 rounded"></div>
        </div>
        <div
          class="block w-full p-4 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center animate-pulse"
        >
          <div>
            <div class="mb-1 h-5 w-32 bg-gray-300 rounded"></div>
            <div class="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div class="size-8 bg-gray-300 rounded"></div>
        </div>
        <div
          class="block w-full p-4 bg-white border border-gray-300 rounded-lg shadow-sm flex justify-between items-center animate-pulse"
        >
          <div>
            <div class="mb-1 h-5 w-32 bg-gray-300 rounded"></div>
            <div class="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div class="size-8 bg-gray-300 rounded"></div>
        </div>
      </div>

      <!-- Calendar & Active Bookings Skeleton -->
      <div class="flex flex-col md:flex-row gap-4 mt-5">
        <div
          class="border-gray-300 border shadow-sm p-2 rounded-lg animate-pulse bg-gray-300"
          style="width: 400px; height: 300px"
        ></div>

        <!-- Active Bookings Placeholder -->
        <div
          class="bg-white border-gray-300 border shadow-sm rounded-lg p-4 w-full animate-pulse"
        >
          <div class="flex justify-between">
            <div
              class="text-md font-semibold text-gray-900 mb-4 h-5 w-48 bg-gray-300 rounded"
            ></div>
            <div class="h-5 w-32 bg-gray-300 rounded mb-4"></div>
          </div>
          <div class="overflow-x-auto sm:rounded-lg">
            <table class="w-full text-sm text-left">
              <thead class="text-xs bg-gray-200 h-8">
                <tr class="animate-pulse">
                  <th class="h-10 bg-gray-100 px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </th>
                  <th class="h-10 bg-gray-100 px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </th>
                  <th class="h-10 bg-gray-100 px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="h-10 bg-gray-100 animate-pulse">
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                </tr>
                <tr class="h-10 bg-gray-100 animate-pulse">
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                </tr>
                <tr class="h-10 bg-gray-100 animate-pulse">
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                  <td class="px-4">
                    <div class="w-24 h-4 bg-gray-300 rounded"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
  const cachedResponse = await bookingCache.match(BOOKING_URL);
  const serviceResponse = await serviceCache.match(SERVICES_URL);
  const reviewResponse = await reviewCache.match(REVIEWS_URL);
  const spResponse = await spCache.match(SERVICE_PROVIDER_URL);

  console.log(cachedResponse);

  if (cachedResponse) {
    bookings = await cachedResponse.json();
    servicesData = await serviceResponse.json();
    reviewsData = await reviewResponse.json();
    const spData = await spResponse.json();

    const userData = await spData.find(
      (sp) => parseInt(sp.id) === parseInt(userId)
    );

    document.getElementById(
      "rating"
    ).innerText = `${userData.average_rating}/5`;
    renderReviewsTable();
    displayActiveBookings();

    const bookedDates = await fetchBookedDates(bookings);
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      events: bookedDates,
      height: "100vh",
      width: "400px",
      contentHeight: "auto",
    });

    calendar.render();
  } else {
    await fetchDatas(true);
  }
}

async function fetchDatas(firstLoad = false) {
  try {
    const responses = await Promise.all([
      fetch(REVIEWS_URL, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }),
      fetch(SERVICE_PROVIDER_URL, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }),
      fetch(SERVICES_URL, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }),
      fetch(BOOKING_URL, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }),
      fetch(CATEGORY_URL, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }),
      fetch(PORTFOLIO_URL, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }),
    ]);

    if (!responses.every((response) => response.ok)) {
      throw new Error("One or more requests failed.");
    }

    const [
      reviewsResponse,
      spResponse,
      servicesResponse,
      bookingResponse,
      categoryResponse,
      portfolioResponse,
    ] = await Promise.all(responses.map((res) => res.json()));

    reviewsData = reviewsResponse;
    servicesData = servicesResponse;
    bookings = bookingResponse;
    const portfolioData = portfolioResponse;

    await Promise.all([
      reviewCache.put(REVIEWS_URL, new Response(JSON.stringify(reviewsData))),
      spCache.put(
        SERVICE_PROVIDER_URL,
        new Response(JSON.stringify(spResponse))
      ),
      spCache.put(CATEGORY_URL, new Response(JSON.stringify(categoryResponse))),
      serviceCache.put(
        SERVICES_URL,
        new Response(JSON.stringify(servicesData))
      ),
      bookingCache.put(BOOKING_URL, new Response(JSON.stringify(bookings))),
      portfolioCache.put(
        PORTFOLIO_URL,
        new Response(JSON.stringify(portfolioData))
      ),
    ]);

    if (firstLoad) {
      location.reload();
    } else {
      renderReviewsTable();
      displayActiveBookings();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

async function fetchBookedDates(bookings) {
  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "declined"
  );

  return filteredBookings.map((booking) => {
    const bookingDate = booking.booking_date.split("T")[0];

    return {
      title: "Booked",
      start: booking.booking_date,
      allDay: true,
      backgroundColor: bookingDate >= today ? "#9973ac" : "gray",
      textColor: "#fff",
    };
  });
}

function renderReviewsTable() {
  const reviewLength = reviewsData.length;
  const servicesLength = servicesData.length;

  const paginatedReviews = reviewsData.slice(0, 5);
  let reviewHTML = "";

  paginatedReviews.forEach((review) => {
    let ratingHTML = "";
    for (let i = 0; i < 5; i++) {
      ratingHTML += review.rating > i ? "&#9733;" : "&#9734;";
    }

    reviewHTML += `<tr>
        <td class="px-6 py-4">${review.customer.fullname}</td>
        <td class="px-6 py-4">${review.service.service_name}</td>
        <td class="px-6 py-4">${ratingHTML}</td>
        <td class="px-6 py-4">${review.review_text}</td>
        <td class="px-6 py-4">${formatDate(review.created_at)}</td>
      </tr>`;
  });

  if (reviewsData.length === 0) {
    reviewHTML =
      "<tr><td colspan='6' class='text-center py-4'>No reviews found</td></tr>";
  }

  reviewsTable.innerHTML = reviewHTML;
  totalServices.textContent = servicesLength;
  totalReviews.textContent = reviewLength;
}

function displayActiveBookings() {
  let activeBookingHTML = "";
  console.log("bookings: ", bookings.length);
  const bookingLength = bookings.length;

  const filteredBookings = bookings
    .filter(
      (booking) =>
        booking.status !== "cancelled" && booking.status !== "declined"
    )
    .slice(0, 5);

  console.log("Filtered Bookings:", filteredBookings);

  for (let i = 0; i < filteredBookings.length; i++) {
    activeBookingHTML += `<tr class="bg-white border-b border-gray-300">
      <td class="px-6 py-4 font-medium text-gray-900">${
        filteredBookings[i]?.event?.event_name
      }</td>
      <td class="px-6 py-4">${filteredBookings[i].booking_date}</td>
      <td class="px-6 py-4">${filteredBookings[i].services.service_name}</td>
      <td class="px-6 py-4">₱${filteredBookings[i].requested_amount}</td>
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
  console.log(activeBookingHTML);

  if (filteredBookings.length === 0) {
    activeBookingHTML = `<tr>
        <td colspan="7" class="text-center text-gray-500">No active bookings found.</td>
      </tr>`;
  }
  activeBookingsTable.innerHTML = activeBookingHTML;
  totalbookings.textContent = bookingLength;
  loader.innerHTML = ``;
}

getCachedData();

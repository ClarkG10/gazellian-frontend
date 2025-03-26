import { backendURL, formatDate, getNotif, userId } from "../utils/utils.js";

const notificationsContainer = document.getElementById(
  "notifications_container"
);

const CACHE_NAME = "notification-cache";
const NOTIFICATION_URL = backendURL + "/api/notification/users/index";

const cache = await caches.open(CACHE_NAME);

let notifData = [];

async function fetchNotification(firstLoad = false) {
  try {
    console.log("Fetching fresh data from API...");
    const response = await fetch(NOTIFICATION_URL, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

    // Store new data in the cache
    cache.put(NOTIFICATION_URL, new Response(JSON.stringify(data)));

    if (firstLoad) {
      getNotification(data);
    } else {
      await getNotification(data);
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
}

// Load cached notifications
const cachedNotification = await cache.match(NOTIFICATION_URL);
if (cachedNotification) {
  notifData = await cachedNotification.json();
  getNotification(notifData);
} else {
  await fetchNotification(true);
}

async function getNotification(notifData) {
  let notificationHTML = "";

  notifData.forEach((notif) => {
    notificationHTML += `<div
          class="notification-card bg-white border border-gray-300 shadow-sm rounded-lg p-3 w-full cursor-pointer"
          data-type="${notif.type}"
          data-id="${notif.id}" 
        >
          <div class="flex items-start notification-item">
            <div class="customBg text-white p-1 rounded-lg mr-4 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 18a2.25 2.25 0 1 1-4.5 0m-4.5-2.25h13.5M18 15.75V11a6 6 0 1 0-12 0v4.75M5.25 15.75a1.5 1.5 0 0 1-1.5-1.5v-.75a1.5 1.5 0 0 1 1.5-1.5m13.5 3.75a1.5 1.5 0 0 0 1.5-1.5v-.75a1.5 1.5 0 0 0-1.5-1.5" />
              </svg>
            </div>
            <div class="flex-1 ${
              notif.status == false ? "font-semibold" : "opacity-75"
            }">
              <h6 class="text-sm">${notif.header_text}</h6>
              <p class="text-gray-700 text-xs">${notif.message}.</p>
              <span class="text-xs text-gray-500">${formatDate(
                notif.created_at
              )}</span>
            </div>
          </div>
        </div>`;
  });

  notificationsContainer.innerHTML =
    notifData.length === 0
      ? `<div class="text-center text-gray-700 mt-4">No notifications found.</div>`
      : notificationHTML;
}

// SSE for real-time notifications
let previousLength = 0;
let eventSource = startSSE();

function startSSE() {
  const es = new EventSource(backendURL + "/api/notification/stream", {
    withCredentials: true,
  });

  es.onmessage = async (event) => {
    try {
      const updatedData = JSON.parse(event.data);
      const updatedLength = Array.isArray(updatedData) ? updatedData.length : 1;

      if (previousLength === 0) {
        previousLength = updatedLength;
        return;
      }

      if (updatedLength > previousLength) {
        console.log("New notification received");
        await fetchNotification();
      }

      previousLength = updatedLength;
    } catch (error) {
      console.error("Error processing SSE data:", error);
    }
  };

  es.onerror = () => {
    console.error("SSE connection lost. Reconnecting in 5 seconds...");
    es.close();
    setTimeout(() => {
      eventSource = startSSE();
    }, 5000);
  };

  return es;
}

async function markAsRead(notificationId) {
  try {
    const response = await fetch(
      backendURL + "/api/notification/mark/read/" + notificationId,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      }
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    await fetchNotification();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

document
  .getElementById("notifications_container")
  .addEventListener("click", (event) => {
    const notificationItem = event.target.closest(".notification-item");
    if (notificationItem) {
      const notificationId =
        notificationItem.closest(".notification-card").dataset.id;
      if (notificationId) {
        markAsRead(notificationId);
      }
    }
  });

document
  .getElementById("markAllAsReadBtn")
  .addEventListener("click", async () => {
    try {
      const response = await fetch(
        backendURL + "/api/notifications/mark/read/" + userId,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      getNotif();
      await fetchNotification();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  });

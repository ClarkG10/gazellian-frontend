import { backendURL, userId } from "../utils/utils.js";

const eventContainer = document.getElementById("event_container");
const eventUpDateModal = document.getElementById("updateModal");
const createEventModal = document.getElementById("createModal");
const confirmationModal = document.getElementById("confirmationModal");
const deleteConfirmationModal = document.getElementById("deleteModal");

const CACHE_NAME = "events-cache";
const CATEGORIES_CACHE_NAME = "service-provider-cache";
const EVENT_URL = backendURL + "/api/event/customer/index";
const CATEGORIES_URL = backendURL + "/api/category";

async function fetchEvent(firstLoad = false) {
  try {
    const cache = await caches.open(CACHE_NAME);

    const response = await fetch(EVENT_URL, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const eventData = await response.json();
    await cache.put(EVENT_URL, new Response(JSON.stringify(eventData)));

    localStorage.setItem("eventDataLoaded", "true");

    if (firstLoad) {
      location.reload();
    } else {
      loadCachedEvent();
    }
  } catch (error) {
    console.error("Error fetching event data:", error);
  }
}
let filteredEvents = [];
let eventData = [];

async function loadCachedEvent() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedEvent = await cache.match(EVENT_URL);

    if (cachedEvent) {
      eventData = await cachedEvent.json();

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (eventData.length > 0) {
        for (let i = 0; i < eventData.length; i++) {
          const eventDate = new Date(eventData[i].event_date + "T00:00:00");
          eventDate.setHours(0, 0, 0, 0);

          if (eventData[i].status !== "Cancelled") {
            let newStatus = "";

            if (eventDate.getTime() === currentDate.getTime()) {
              newStatus = "Ongoing";
            } else if (eventDate.getTime() < currentDate.getTime()) {
              newStatus = "Completed";
            } else if (eventDate.getTime() > currentDate.getTime()) {
              newStatus = "Planning";
            } else {
              continue;
            }

            if (eventData[i].status !== newStatus) {
              const data = { status: newStatus };
              updateEventStatus(eventData[i].id, data);
            }
          }
        }
      }
      getEventHTML(eventData);
    } else {
      await fetchEvent(true);
    }
  } catch (error) {
    console.error("Error loading cached event data:", error);
  }
}

function getEventHTML(data) {
  let eventHTML = "";

  for (let i = 0; i < data.length; i++) {
    eventHTML += `<div
          class="bg-white p-5 rounded-lg shadow-lg flex flex-col justify-between h-52"
        >
          <div>
            <h3 class="text-xl font-semibold text-gray-900 truncate">
              ${data[i].event_name}
            </h3>
            <p class="text-gray-600 text-sm">
              Type: <span class="font-medium">${data[i].event_type}</span>
            </p>
            <p class="text-gray-700 text-sm">
              Date: <span class="font-medium">${
                data[i].event_date.split("T")[0]
              }</span>
            </p>
            <p class="text-gray-700 text-sm">
              Budget: <span class="font-medium">₱${data[i].budget}</span>
            </p>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-white px-3 py-1 text-xs rounded-full ${
              data[i].status === "Completed"
                ? "customBg"
                : data[i].status === "Cancelled"
                ? "bg-red-500"
                : data[i].status === "Ongoing"
                ? "bg-blue-500"
                : "bg-yellow-300"
            }">${data[i].status}</span
            >
            <div class="flex space-x-2">
              
              ${
                data[i].status == "Cancelled"
                  ? `<button class="text-red-600 text-sm font-medium hover:underline deleteEvent" data-id="${data[i].id}">
                Delete
              </button>`
                  : `<button class="text-blue-600 text-sm font-medium hover:underline updateEvent" data-id="${data[i].id}">
                Update
              </button><button class="text-red-600 text-sm font-medium hover:underline cancelEvent" data-id="${data[i].id}">
                Cancel
              </button>`
              }
            </div>
          </div>
        </div>
`;
  }
  if (data.length === 0) {
    console.log("No events");
    eventContainer.innerHTML = "No Event Available.";
    return;
  }
  eventContainer.innerHTML = eventHTML;
}

loadCachedEvent();

const cache = await caches.open(CATEGORIES_CACHE_NAME);
const cachedCategories = await cache.match(CATEGORIES_URL);

const categoriesData = cachedCategories.json();

async function allocateBudgetWithGemini(data) {
  const apiKey = "AIzaSyACF3a4t3vX7gl4x2VjPS1izRDcl09BzYk";

  const CData = await categoriesData;

  let categoryHTML = "";
  for (let i = 0; i < CData.length; i++) {
    categoryHTML += `${CData[i].category_name} - `;
  }

  console.log(categoryHTML);

  const prompt = `Distribute your event budget in Philippine pesos across **only** the following categories:  
${categoryHTML}.  

You have a total budget of **${data.budget} PHP** for the event:  
"${data.event_name}" (${data.event_type}).  

 **DO NOT add new categories. Use only those listed above.** 
 **SELECT ONLY A MAXIMUM OF 10 CATEGORIES AND MINIMUM OF 5.**   
 **Format the response exactly as follows (no extra text, no explanations, only category and amount):**  

Example formatting:  
Venue  
1000  
Catering  
1000 
and so on...

 **Rules:**  
 Use only the categories listed.  
 Ensure the total budget does not exceed **${data.budget} PHP**.  
 Do not add explanations or additional text.  

 Prioritize essential expenses and distribute the budget realistically.`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const allocatedBudget = data.candidates[0].content.parts[0].text.trim();
      // console.log(allocatedBudget);

      const allocatedBudgetArray = allocatedBudget.split("\n");

      // console.log(allocatedBudgetArray);

      const listofAllocatedBudget = [];

      for (let i = 0; i < allocatedBudgetArray.length; i += 2) {
        if (allocatedBudgetArray[i + 1]) {
          listofAllocatedBudget.push([
            allocatedBudgetArray[i],
            allocatedBudgetArray[i + 1],
          ]);
        }
      }

      // console.log(listofAllocatedBudget);
      return listofAllocatedBudget;
    }
  } catch (error) {
    console.error("Error fetching Gemini API:", error);
    return;
  }
}

// create an event functionality
document.querySelector(".createEvent").addEventListener("click", (e) => {
  createEventModal.classList.remove("hidden");
});

createEventModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    createEventModal.classList.add("hidden");
  }
});

const createEventForm = document.getElementById("create_form");
createEventForm.onsubmit = async (e) => {
  e.preventDefault();

  createEventForm.querySelector("button").innerText = "Creating...";
  createEventForm.querySelector("button").disabled = true;

  const formData = new FormData(createEventForm);

  formData.append("customer_id", userId);

  const request = await fetch(backendURL + "/api/event", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  const newData = await request.json();

  if (!request.ok) {
    createEventForm.querySelector("button").innerText = "Create";
    createEventForm.querySelector("button").disabled = false;
    throw new Error(await request.text());
  }

  const data = {
    event_name: formData.get("event_name"),
    event_type: formData.get("event_type"),
    budget: parseFloat(formData.get("budget")),
  };

  createEventForm.querySelector("button").innerText = "Allocating budget...";

  // allocate budget for the event
  const allocatedbudget = await allocateBudgetWithGemini(data);

  console.log(allocatedbudget);

  for (let i = 0; i < allocatedbudget.length; i++) {
    const CData = await categoriesData;
    const category = CData.find(
      (cat) =>
        cat.category_name.toLowerCase() === allocatedbudget[i][0].toLowerCase()
    );

    const request = await fetch(backendURL + "/api/budget-allocation", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: userId,
        event_id: newData.id,
        category_id: category?.id,
        allocated_amount: allocatedbudget[i][1],
      }),
    });
    createEventForm.querySelector("button").innerText =
      "Saving allocated budget...";

    // throw error
    if (!request.ok) {
      throw new Error(await request.text());
    }
  }
  await fetchEvent();
  createEventForm.reset();
  createEventForm.querySelector("button").innerText = "Create";
  createEventForm.querySelector("button").disabled = false;
  createEventModal.classList.add("hidden");
};

// update an event functionality
eventContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("updateEvent")) {
    const eventId = parseInt(e.target.dataset.id);
    const event = eventData.find((evnt) => evnt.id === eventId);

    if (event) {
      eventUpDateModal.classList.remove("hidden");
      document.getElementById("event_name").value = event.event_name;
      document.getElementById("event_type").value = event.event_type;
      document.getElementById("event_date").value =
        event.event_date.split("T")[0];
      document.getElementById("event_budget").value = event.budget;
      document.getElementById("updateButton").dataset.id = eventId;
    }
  }
});

const eventForm = document.getElementById("update_form");

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  eventForm.querySelector("button").innerText = "Updating...";
  eventForm.querySelector("button").disabled = true;

  const eventId = parseInt(document.getElementById("updateButton").dataset.id);
  const formData = new FormData(eventForm);

  console.log(formData.get("event_name"));

  formData.append("_method", "PUT");

  const request = await fetch(backendURL + "/api/event/" + eventId, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  if (!request.ok) {
    eventForm.querySelector("button").innerText = "Save Changes";
    eventForm.querySelector("button").disabled = false;
    throw new Error(await request.text());
  }

  eventForm.reset();
  eventForm.querySelector("button").innerText = "Save Changes";
  eventForm.querySelector("button").disabled = false;
  eventUpDateModal.classList.add("hidden");
  await fetchEvent();
});

eventUpDateModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    eventUpDateModal.classList.add("hidden");
  }
});

// cancel event functionality
eventContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("cancelEvent")) {
    const eventId = parseInt(e.target.dataset.id);

    document.getElementById("confirmationModal").classList.remove("hidden");
    document.getElementById("cancelButton").dataset.id = eventId;
  }
});

confirmationModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    confirmationModal.classList.add("hidden");
  }
});

document.getElementById("cancelButton").addEventListener("click", async (e) => {
  e.preventDefault();
  const eventId = parseInt(document.getElementById("cancelButton").dataset.id);
  const data = {
    status: "Cancelled",
  };
  updateEventStatus(eventId, data);
});

async function updateEventStatus(id, status) {
  const request = await fetch(backendURL + "/api/event/status/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify(status),
  });

  if (!request.ok) {
    throw new Error(await request.text());
  }

  if (status === "Cancelled") {
    confirmationModal.classList.add("hidden");
  }
  await fetchEvent();
}

// delete event functionality
eventContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("deleteEvent")) {
    const eventId = parseInt(e.target.dataset.id);

    document.getElementById("deleteModal").classList.remove("hidden");
    document.getElementById("deleteButton").dataset.id = eventId;
  }
});

deleteConfirmationModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    deleteConfirmationModal.classList.add("hidden");
  }
});

document.getElementById("deleteButton").addEventListener("click", async (e) => {
  e.preventDefault();
  const eventId = parseInt(document.getElementById("deleteButton").dataset.id);

  const request = await fetch(backendURL + "/api/event/" + eventId, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!request.ok) {
    throw new Error(await request.text());
  }

  deleteConfirmationModal.classList.add("hidden");
  await fetchEvent();
});

// Sorting & Filtering function
function sortTable(attr, value = "") {
  if (attr === "status") {
    if (value === "none") {
      filteredEvents = [...eventData];
    } else {
      filteredEvents = eventData.filter(
        (event) => event[attr] === value || console.log(event[attr], value)
      );
    }
  }
  getEventHTML(filteredEvents);
}

document.getElementById("sortStatus").addEventListener("change", function () {
  console.log(this.value);

  sortTable("status", this.value);
});

import { backendURL, userId } from "../utils/utils.js";

const servicesTable = document.getElementById("servicesTable");
const updateModal = document.getElementById("updateService");
const deleteConfirmationModal = document.getElementById("deleteModal");

const CACHE_NAME = "services-cache";
const SP_NAME = "service-provider-cache";
const SERVICES_URL = backendURL + "/api/services/index";
const CATEGORY_URL = backendURL + "/api/category";

const cache = await caches.open(CACHE_NAME);

async function fetchServices(firstLoad = false) {
  const response = await fetch(SERVICES_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();

  await cache.put(SERVICES_URL, new Response(JSON.stringify(data)));
  console.log(firstLoad);
  if (firstLoad) {
    location.reload();
  } else {
    loadCachedServices();
  }
}

let data = [];

async function loadCachedServices() {
  try {
    const cachedServices = await cache.match(SERVICES_URL);
    if (cachedServices) {
      data = await cachedServices.json();
      getServicesHTML(data);
    } else {
      fetchServices(true);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

async function getServicesHTML() {
  let servicesHTML = "";

  for (let i = 0; i < data.length; i++) {
    servicesHTML += `
            <tr class="bg-white border-b border-gray-300">
              <td class="px-6 py-4 ">${data[i].service_name}</td>
              <td class="px-6 py-4 ">${data[i].category.category_name}</td>
              <td class="px-6 py-4 ">${data[
                i
              ].price_range_min.toLocaleString()} - ${data[
      i
    ].price_range_max.toLocaleString()}</td>
              <td class="items-center"><span class="shadow-sm border border-gray-300 py-2 px-3 rounded-lg ${
                data[i].availability_status === "Unavailable"
                  ? `text-red-500`
                  : `text-green-500`
              }">${data[i].availability_status}</span></td>
              <td class="px-6 py-4 flex">
                <button
                  type="button"
                  data-modal-target="updateService"
                  data-modal-toggle="updateService"
                  data-id="${data[i].id}"
                  class="font-medium text-blue-600 light:text-blue-500 hover:underline cursor-pointer updateService"
                >
                  Edit
                </button>
                <button
                  type="button"
                  data-id="${data[i].id}"
                  class="ms-2 font-medium text-red-600 light:text-blue-500 hover:underline cursor-pointer deleteService"
                >
                  Delete
                </button>
              </td>
            </tr>`;
  }
  servicesTable.innerHTML = servicesHTML;
}

const cachedSP = await caches.open(SP_NAME);
const cachedCategory = await cachedSP.match(CATEGORY_URL);
const categoryData = await cachedCategory.json();

const categoryOptions = document.getElementById("categoryOptions");

for (let i = 0; i < categoryData.length; ++i) {
  categoryOptions.innerHTML += `<option value="${categoryData[i].id}">${categoryData[i].category_name}</option>`;
}

const createServiceForm = document.getElementById("create_service_form");

createServiceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  createServiceForm.querySelector("button").innerText = "Creating...";
  createServiceForm.querySelector("button").disabled = true;

  const formData = new FormData(createServiceForm);
  formData.append("provider_id", userId);

  const request = await fetch(backendURL + "/api/service", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  if (!request.ok) {
    createServiceForm.querySelector("button").innerText = "Create Service";
    createServiceForm.querySelector("button").disabled = false;
    throw new Error("Service creation failed");
    return;
  }

  createServiceForm.reset();
  createServiceForm.querySelector("button").innerText = "Create Service";
  createServiceForm.querySelector("button").disabled = false;
  await fetchServices();
});

servicesTable.addEventListener("click", (e) => {
  if (e.target.classList.contains("updateService")) {
    const id = e.target.dataset.id;
    updateModal.classList.remove("hidden");
    const serviceData = data.find((s) => parseInt(s.id) === parseInt(id));
    console.log(serviceData);

    for (let i = 0; i < categoryData.length; ++i) {
      document.getElementById(
        "updateCategory"
      ).innerHTML += `<option value="${categoryData[i].id}">${categoryData[i].category_name}</option>`;
    }
    if (serviceData) {
      document.getElementById("service_name").value = serviceData.service_name;
      document.getElementById("updateCategory").value = serviceData.category_id;
      document.getElementById("price_range_min").value =
        serviceData.price_range_min;
      document.getElementById("price_range_max").value =
        serviceData.price_range_max;
      document.getElementById("availability_status").value =
        serviceData.availability_status;
      document.getElementById("updateDescription").value =
        serviceData.description;
      document.getElementById("updateButton").dataset.id = id;
    }
  }
});

// close modal

updateModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    updateModal.classList.add("hidden");
  }
});

// delete service functionality
servicesTable.addEventListener("click", (e) => {
  const serviceId = parseInt(e.target.dataset.id);

  if (e.target.classList.contains("deleteService")) {
    console.log("delete serviceId:", serviceId);

    document.getElementById("deleteModal").classList.remove("hidden");
    document.getElementById("deleteButton").dataset.id = serviceId;
  }
});

deleteConfirmationModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    deleteConfirmationModal.classList.add("hidden");
  }
});

document.getElementById("deleteButton").addEventListener("click", async (e) => {
  e.preventDefault();
  const serviceId = parseInt(
    document.getElementById("deleteButton").dataset.id
  );

  const request = await fetch(backendURL + "/api/service/" + serviceId, {
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
  await fetchServices();
});

const updateServiceForm = document.getElementById("update_service_form");

updateServiceForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const serviceId = parseInt(
    document.getElementById("updateButton").dataset.id
  );

  updateServiceForm.querySelector("button").disabled = true;
  updateServiceForm.querySelector("button").innerText = "Saving...";

  const formData = new FormData(updateServiceForm);
  formData.append("_method", "PUT");

  const response = await fetch(backendURL + "/api/service/" + serviceId, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  updateServiceForm.reset();
  updateServiceForm.querySelector("button").disabled = false;
  updateServiceForm.querySelector("button").innerText = "Save Changes";
  updateModal.classList.add("hidden");

  await fetchServices();
});

loadCachedServices();

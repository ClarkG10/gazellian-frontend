import { backendURL, userId } from "../utils/utils.js";

const allocatedBudgetContainer = document.getElementById(
  "allocated_budget_container"
);
const eventOptions = document.getElementById("event_options");
const categoryOptions = document.getElementById("category_options");
const categories = document.getElementById("categories");
const expensesTable = document.getElementById("expense_table");
const eventBudget = document.getElementById("total_budget");
const totalAllocatedAmount = document.getElementById("total_expenses");
const totalActualSpent = document.getElementById("total_actual_spent");
const selectedCategory = document.getElementById("selected_category");
const totalallocatedBudget = document.getElementById("total_allocated_budget");
// modal var
const updateExpenseModal = document.getElementById("updateExpenseModal");
const deleteConfirmationModal = document.getElementById("deleteModal");
const updateBudgetModal = document.getElementById("updateBudget");
// form var
const categoryForm = document.getElementById("category_form");
const expenseForm = document.getElementById("expense_form");
const updateExpenseForm = document.getElementById("update_form");
const updateBudgetForm = document.getElementById("update_budget_form");

const EVENT_CACHE_NAME = "events-cache";
const BUDGET_CACHE_NAME = "allocated-budget-cache";
const CATEGORY_CACHE_NAME = "service-provider-cache";
const EVENT_URL = backendURL + "/api/event/customer/index";
const BUDGET_URL = backendURL + "/api/budget-allocation/customer/index";
const CATEGORY_URL = backendURL + "/api/category";

const cache = await caches.open(EVENT_CACHE_NAME);
const cachedEvent = await cache.match(EVENT_URL);

if (!cachedEvent) {
  document.getElementById("redirectToEventModal").classList.remove("hidden");
}
let eventId = null;
let budgetId = null;
let totalBudget = null;
let budgetData = [];
let eventData = [];
let expensesByCategoryData = [];
let eventBudgetData = [];

async function fetchBudget(firstLoad = false, action = "") {
  const cache = await caches.open(BUDGET_CACHE_NAME);

  const response = await fetch(BUDGET_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${await response.text()}`);
  }

  const budgetData = await response.json();

  await cache.put(BUDGET_URL, new Response(JSON.stringify(budgetData)));

  if (firstLoad) {
    location.reload();
  } else {
    loadCachedBudget(action);
  }
}

async function fetchEvent() {
  const cache = await caches.open(EVENT_CACHE_NAME);

  const response = await fetch(EVENT_URL, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${await response.text()}`);
  }

  const eventData = await response.json();

  await cache.put(EVENT_URL, new Response(JSON.stringify(eventData)));

  // if (firstLoad) {
  //   location.reload();
  // } else {
  //   loadCachedBudget(action);
  // }
}

async function loadCachedBudget(action) {
  try {
    const cache = await caches.open(BUDGET_CACHE_NAME);
    const cachedBudget = await cache.match(BUDGET_URL);

    if (cachedBudget) {
      budgetData = await cachedBudget.json();
      if (action === "addCategory") {
        getAllocatedBudgetHTML(eventBudgetData, totalBudget);
        eventOptions.dispatchEvent(new Event("change"));
      } else {
        getExpensesHTML(expensesByCategoryData);
        categoryOptions.dispatchEvent(new Event("change"));
      }
    } else {
      await fetchBudget(true);
    }
  } catch (error) {
    console.error("Error loading cached event data:", error);
  }
}

eventData = await cachedEvent.json();

const budgetCache = await caches.open(BUDGET_CACHE_NAME);
const cachedBudget = await budgetCache.match(BUDGET_URL);
if (cachedBudget) {
  budgetData = await cachedBudget.json();
}

function getEventsHTML() {
  let eventOptionsHTML = "";

  for (let i = 0; i < eventData.length; i++) {
    eventOptionsHTML += `<option ${i == 0 ? "selected" : ``} value="${
      eventData[i].id
    }">${eventData[i].event_name}</option>`;
  }
  eventOptions.innerHTML = eventOptionsHTML;
  eventOptions.dispatchEvent(new Event("change"));
  categoryOptions.dispatchEvent(new Event("change"));
}

async function getAllocatedBudgetHTML(data, budget) {
  let allocatedBudgetHTML = "";
  let categoryOptionsHTML = "";
  let finalAllocatedBudget = 0;

  for (let i = 0; i < data.length; i++) {
    const spent =
      data[i].actual_spent === 0
        ? data[i].allocated_amount
        : data[i].actual_spent;

    const percentage = Math.min((spent / budget) * 100, 100).toFixed(2);

    allocatedBudgetHTML += `
    <div>
      <span class="flex items-center justify-between w-full py-3 font-medium rtl:text-right text-gray-500 border-b border-gray-200 light:border-gray-700 light:text-gray-400 gap-3">
        <span class="text-gray-700 text-sm">${
          data[i].category.category_name
        }</span>
        <div class="flex">
          <span class="text-gray-700 text-sm me-3">₱${spent.toLocaleString()}<small class="customTextColor">${
      data[i].actual_spent != 0
        ? `(₱${data[i].actual_spent.toLocaleString()})`
        : ``
    }</small></span>
        </div>
      </span>
      <div class="w-full bg-gray-200 rounded-full h-3">
        <div class="customBg h-3 rounded-full" id="progress-${i}" style="width: 0%;"></div>
        <span class="text-xs">${percentage}%</span>
      </div>
    </div>
`;
    categoryOptionsHTML += `<option ${1 == 0 ? `selected` : ``} value="${
      data[i].id
    }">${data[i].category.category_name}</option>`;

    finalAllocatedBudget += parseFloat(spent);

    // Wait for DOM update, then animate the width
    setTimeout(() => {
      document.getElementById(`progress-${i}`).style.width = `${percentage}%`;
    }, 100);
  }

  allocatedBudgetContainer.innerHTML = allocatedBudgetHTML;
  categoryOptions.innerHTML = categoryOptionsHTML;
  eventBudget.textContent = `₱${budget.toLocaleString()}`;
  totalallocatedBudget.innerHTML = `<span class="font-bold text-gray-500 flex items-center pe-2">Total Allocated Budget: </span>₱${finalAllocatedBudget.toLocaleString()}`;

  const cache = await caches.open(CATEGORY_CACHE_NAME);
  const cachedCategory = await cache.match(CATEGORY_URL);
  const categoryData = await cachedCategory.json();
  let catogoriesHTML = "";

  for (let i = 0; i < categoryData.length; i++) {
    catogoriesHTML += `<option value="${categoryData[i].id}">${categoryData[i].category_name}</option>`;
  }

  categories.innerHTML = catogoriesHTML;
}

function getExpensesHTML(data) {
  console.log(data);
  let expensesHTML = "",
    totalExpense = 0,
    totalExpenseSpent = 0;

  for (let i = 0; i < data.expenses.length; i++) {
    expensesHTML += `                  <tr
                    class="odd:bg-white odd:light:bg-gray-900 even:bg-gray-50 even:light:bg-gray-800 border-b light:border-gray-700 border-gray-200"
                  >
                    <th
                      scope="row"
                      class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap light:text-white"
                    >
                      ${data.expenses[i].expense_name}
                    </th>
                    <td class="px-6 py-4">₱${data.expenses[
                      i
                    ].allocated_amount.toLocaleString()}</td>
                    <td class="px-6 py-4">₱${data.expenses[
                      i
                    ].actual_spent.toLocaleString()}</td>
                    <td class="px-6 py-4 flex">
                      <button
                        type="button"
                        data-modal-target="updateExpense"
                        data-modal-toggle="updateExpense"
                        data-id="${data.id}"
                        data-expense-id="${
                          data.expenses[i].id
                        }"                        
                        class="font-medium text-blue-600 light:text-blue-500 hover:underline cursor-pointer updateExpense"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        data-id="${data.expenses[i].id}"
                        class="ms-2 font-medium text-red-600 light:text-blue-500 hover:underline cursor-pointer deleteExpense"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>`;
    totalExpense += parseFloat(data.expenses[i]?.allocated_amount || 0);
    totalExpenseSpent += parseFloat(data.expenses[i]?.actual_spent || 0);
  }

  if (data.expenses.length === 0) {
    expensesTable.innerHTML = `<tr>
          <td colspan="4" class="px-6 py-4 text-center text-gray-500">No expenses found.</td>
        </tr>`;
    totalAllocatedAmount.innerHTML = `₱0`;
    totalActualSpent.innerHTML = `₱0`;
    return;
  }

  expensesTable.innerHTML = expensesHTML;
  totalAllocatedAmount.innerHTML = `₱${totalExpense.toLocaleString()}`;
  totalActualSpent.innerHTML = `₱${totalExpenseSpent.toLocaleString()}`;
}

// Filter allocated budget and category by event
eventOptions.addEventListener("change", () => {
  const selectedEventId = parseInt(eventOptions.value);
  const eventBudget = budgetData.filter(
    (budget) => budget.event_id === selectedEventId
  );

  const eventTotalBudget = eventData.find(
    (event) => event.id === selectedEventId
  ).budget;

  eventId = selectedEventId;
  eventBudgetData = eventBudget;
  totalBudget = eventTotalBudget;

  document.getElementById("totalEventBudget").value = totalBudget;

  getAllocatedBudgetHTML(eventBudget, eventTotalBudget);
  categoryOptions.dispatchEvent(new Event("change"));
});

// Filter expenses by category
categoryOptions.addEventListener("change", () => {
  const selectedBudgetId = parseInt(categoryOptions.value);
  const eventExpenseByCategory = budgetData.filter(
    (exp) => exp.id === selectedBudgetId
  );

  budgetId = selectedBudgetId;

  expensesByCategoryData = eventExpenseByCategory[0];

  selectedCategory.innerHTML = `${eventExpenseByCategory[0].category.category_name}`;
  getExpensesHTML(eventExpenseByCategory[0]);
});

getEventsHTML();
loadCachedBudget();

// console.log("1", eventId);
// console.log("2", budgetId);
// console.log("3", expensesByCategoryData);
// console.log("3", eventBudgetData);
// console.log("4", totalBudget);

// create new category for budget data
categoryForm.onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(categoryForm);

  // creating...
  categoryForm.querySelector("button").innerText = `Adding...`;

  const data = {
    category_id: formData.get("category_id"),
    event_id: eventId,
    customer_id: userId,
    allocated_amount: parseFloat(formData.get("allocated_amount")),
    actual_spent: parseFloat(formData.get("actual_spent")),
  };

  const request = await fetch(backendURL + "/api/budget-allocation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  // throw error
  if (!request.ok) {
    throw new Error(await request.text());
  }
  categoryForm.reset();
  categoryForm.querySelector("button").innerText = `Add`;
  createCategoryModal.classList.add("hidden");
  await fetchBudget("", "addCategory");
};

// create new expense by category
expenseForm.onsubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData(expenseForm);

  expenseForm.querySelector("button").innerText = `Adding...`;

  const data = {
    budget_id: budgetId,
    expense_name: formData.get("expense_name"),
    allocated_amount: parseFloat(formData.get("allocated_amount")),
    actual_spent: parseFloat(formData.get("actual_spent")),
  };

  const request = await fetch(backendURL + "/api/event-expense", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!request.ok) {
    throw new Error(await request.text());
  }
  expenseForm.reset();
  expenseForm.querySelector("button").innerText = `Add`;

  createCategoryModal.classList.add("hidden");
  await fetchBudget("", "addExpense");
};

expensesTable.addEventListener("click", (e) => {
  if (e.target.classList.contains("updateExpense")) {
    const budgetId = parseInt(e.target.dataset.id);
    const expenseId = parseInt(e.target.dataset.expenseId);
    const budget = budgetData.find((b) => b.id === budgetId);
    const expense = budget.expenses.find((b) => b.id === expenseId);

    console.log(budgetId, expenseId, budget, expense);

    if (expense) {
      updateExpenseModal.classList.remove("hidden");
      document.getElementById("expense_name").value = expense.expense_name;
      document.getElementById("allocated_amount").value =
        expense.allocated_amount;
      document.getElementById("actual_spent").value = expense.actual_spent;
      document.getElementById("updateButton").dataset.id = expenseId;
    }
  }
});

updateExpenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  updateExpenseForm.querySelector("button").innerText = "Updating...";
  updateExpenseForm.querySelector("button").disabled = true;

  const expenseId = parseInt(
    document.getElementById("updateButton").dataset.id
  );
  const formData = new FormData(updateExpenseForm);

  console.log(formData.get("event_name"));

  formData.append("_method", "PUT");

  const request = await fetch(backendURL + "/api/event-expense/" + expenseId, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  if (!request.ok) {
    updateExpenseForm.querySelector("button").innerText = "Save Changes";
    updateExpenseForm.querySelector("button").disabled = false;
    throw new Error(await request.text());
  }

  updateExpenseForm.reset();
  updateExpenseForm.querySelector("button").innerText = "Save Changes";
  updateExpenseForm.querySelector("button").disabled = false;
  updateExpenseModal.classList.add("hidden");
  await fetchBudget();
});

updateExpenseModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    updateExpenseModal.classList.add("hidden");
  }
});

// delete expense functionality
expensesTable.addEventListener("click", (e) => {
  const expenseId = parseInt(e.target.dataset.id);

  if (e.target.classList.contains("deleteExpense")) {
    console.log("delete expense", expenseId);

    document.getElementById("deleteModal").classList.remove("hidden");
    document.getElementById("deleteButton").dataset.id = expenseId;
  }
});

deleteConfirmationModal.addEventListener("click", (e) => {
  if (e.target.classList.contains("closeModal")) {
    deleteConfirmationModal.classList.add("hidden");
  }
});

document.getElementById("deleteButton").addEventListener("click", async (e) => {
  e.preventDefault();
  const expenseId = parseInt(
    document.getElementById("deleteButton").dataset.id
  );

  const request = await fetch(backendURL + "/api/event-expense/" + expenseId, {
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
  await fetchBudget();
});

// update budget
updateBudgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  updateBudgetForm.querySelector("button").innerText = "Updating...";
  updateBudgetForm.querySelector("button").disabled = true;

  const formData = new FormData(updateBudgetForm);

  formData.append("_method", "PUT");

  console.log(eventId);

  const request = await fetch(backendURL + "/api/event/" + eventId, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  const newData = await request.json();

  eventBudget.textContent = `₱${newData.budget}`;

  if (!request.ok) {
    updateBudgetForm.querySelector("button").innerText = "Save Changes";
    updateBudgetForm.querySelector("button").disabled = false;
    throw new Error(await request.text());
  }

  updateBudgetForm.reset();
  updateBudgetForm.querySelector("button").innerText = "Save Changes";
  updateBudgetForm.querySelector("button").disabled = false;
  updateBudgetModal.querySelector(".closeModal").click();
  await fetchEvent();
});

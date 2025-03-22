import { backendURL, createToast, userId } from "../utils/utils.js";

const updateBusinessForm = document.getElementById("update_info_form");
const updatePasswordBtn = document.querySelectorAll("button.mt-4")[1];

console.log(updatePasswordBtn);

let data = [];

async function fetchSpData() {
  const response = await fetch(backendURL + "/api/user/" + userId, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    throw error(await response.text());
  }

  data = await response.json();

  console.log(data);

  if (response.ok) {
    const businessTypeSelect = document.getElementById("businessType");
    const businessTypes = data.provider_data.business_type.split(", ");

    document.getElementById("businessName").value =
      data.provider_data.business_name;
    document.getElementById("businessEmail").value = data.provider_data.email;
    document.getElementById("businessPhone").value = data.phone_number;
    document.getElementById("yearsInBusiness").value =
      data.provider_data.years_in_business;
    document.getElementById("websiteURL").value =
      data.provider_data.website_url;
    document.getElementById("location").value = data.provider_data.location;

    for (let option of businessTypeSelect.options) {
      if (businessTypes.includes(option.value.trim())) {
        option.selected = true;
      }
    }
    document.getElementById("description").value =
      data.provider_data.description;
  }
}

updateBusinessForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  updateBusinessForm.querySelector("button").disabled = true;
  updateBusinessForm.querySelector("button").innerText = "Saving...";

  const formData = new FormData(updateBusinessForm);

  const businessTypeData = formData.getAll("business_type[]");

  let businessTypes = "";

  businessTypeData.forEach((element) => {
    businessTypes += `${element}, `;
  });
  console.log(data.provider_data.id);
  formData.append("business_type", businessTypes);

  await fetch(backendURL + "/api/service-provider/" + data.provider_data.id, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  const userDataForm = new FormData();
  userDataForm.append("phone_number", formData.get("phone_number"));

  await fetch(backendURL + "/api/user/" + userId, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
    body: formData,
  });

  updateBusinessForm.querySelector("button").disabled = false;
  updateBusinessForm.querySelector("button").innerText = "Save Changes";
  createToast("Business information has been updated successfully!");
});

updatePasswordBtn.addEventListener("click", async function () {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("password").value;
  const confirmNewPassword =
    document.getElementById("confirmNewPassword").value;

  // Validate input fields
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    alert("All fields are required!");
    return;
  }

  if (newPassword.length < 8) {
    alert("New password must be at least 8 characters long.");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    alert("New password and confirmation do not match!");
    return;
  }

  updatePasswordBtn.textContent = "Updating...";
  updatePasswordBtn.disabled = true;

  try {
    const response = await fetch(
      backendURL + "/api/user/update-password/" + userId,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmNewPassword,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      alert("Password updated successfully!");
      document.getElementById("currentPassword").value = "";
      document.getElementById("password").value = "";
      document.getElementById("confirmNewPassword").value = "";
    } else {
      alert(
        result.message || "Failed to update password. Please check your input."
      );
    }
  } catch (error) {
    console.error("Error updating password:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    // Re-enable button
    updatePasswordBtn.textContent = "Update Password";
    updatePasswordBtn.disabled = false;
  }
});

fetchSpData();

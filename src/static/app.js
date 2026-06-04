document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsWrapper = document.createElement("div");
        participantsWrapper.className = "participants-section";

        const participantsTitle = document.createElement("div");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants:";

        const ul = document.createElement("ul");
        ul.className = "participants-list";
        (details.participants || []).forEach((email) => {
          const li = document.createElement("li");
          li.className = "participant-item";

          const nameSpan = document.createElement("span");
          nameSpan.textContent = email;

          const delBtn = document.createElement("button");
          delBtn.className = "participant-delete";
          delBtn.title = `Remove ${email}`;
          delBtn.setAttribute('aria-label', `Remove ${email}`);
          delBtn.textContent = "✖";

          delBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            if (!confirm(`Remove ${email} from ${name}?`)) return;
            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const data = await res.json();
              if (res.ok) {
                // Refresh activities to update UI
                fetchActivities();
              } else {
                alert(data.detail || "Failed to remove participant");
              }
            } catch (err) {
              console.error(err);
              alert("Failed to remove participant. Please try again.");
            }
          });

          li.appendChild(nameSpan);
          li.appendChild(delBtn);
          ul.appendChild(li);
        });

        participantsWrapper.appendChild(participantsTitle);
        participantsWrapper.appendChild(ul);
        activityCard.appendChild(participantsWrapper);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the UI shows the new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

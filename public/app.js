const rowsElement = document.querySelector("#student-rows");
const countElement = document.querySelector("#record-count");
const connectionDot = document.querySelector("#connection-dot");
const connectionLabel = document.querySelector("#connection-label");
const form = document.querySelector("#student-form");
const formMessage = document.querySelector("#form-message");

function makeCell(value, className) {
  const cell = document.createElement("td");
  cell.textContent = value;
  if (className) {
    cell.className = className;
  }
  return cell;
}

function setTableMessage(message) {
  const row = document.createElement("tr");
  const cell = makeCell(message, "table-message");
  cell.colSpan = 4;
  row.append(cell);
  rowsElement.replaceChildren(row);
}

async function refreshStudents() {
  try {
    const [healthResponse, studentsResponse] = await Promise.all([
      fetch("/api/health"),
      fetch("/api/students")
    ]);
    if (!healthResponse.ok || !studentsResponse.ok) {
      throw new Error("The database did not return a successful response.");
    }
    const health = await healthResponse.json();
    const { students } = await studentsResponse.json();
    connectionDot.classList.add("is-connected");
    connectionLabel.textContent = "MySQL connected";
    countElement.textContent = health.studentCount;

    if (students.length === 0) {
      setTableMessage("No records yet. Add a student to get started.");
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const student of students) {
      const row = document.createElement("tr");
      row.append(
        makeCell(student.name, "student-name-cell"),
        makeCell(student.email),
        makeCell(student.course),
        makeCell(`#${student.id}`, "id-cell")
      );
      fragment.append(row);
    }
    rowsElement.replaceChildren(fragment);
  } catch (error) {
    connectionDot.classList.remove("is-connected");
    connectionLabel.textContent = "Database unavailable";
    countElement.textContent = "—";
    setTableMessage("Could not load records. Check that MySQL is running, then refresh.");
    console.error("Unable to load student records:", error);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector("button[type=submit]");
  const formData = new FormData(form);
  submitButton.disabled = true;
  formMessage.textContent = "Saving…";
  formMessage.className = "form-message";

  try {
    const response = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Unable to save the student.");
    }
    form.reset();
    formMessage.textContent = `Saved ${result.student.name} as record #${result.student.id}.`;
    formMessage.classList.add("is-success");
    await refreshStudents();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector("#refresh-button").addEventListener("click", refreshStudents);
refreshStudents();

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectDirectory = path.resolve(__dirname, "..");
const baseUrl = process.env.DEMO_URL || "http://localhost:3000";
const verificationEmail = `volume-check-${Date.now()}@example.edu`;
const verificationName = "Docker Volume Verification";
const verificationCourse = "Persistence Lab";

function runCompose(args) {
  const result = spawnSync("docker", ["compose", ...args], {
    cwd: projectDirectory,
    stdio: "inherit"
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`docker compose ${args.join(" ")} exited with status ${result.status}.`);
  }
}

async function waitForStudent() {
  const deadline = Date.now() + 120_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/students`);
      if (response.ok) {
        const { students } = await response.json();
        const student = students.find((entry) => entry.email === verificationEmail);
        if (student) {
          return student;
        }
      } else {
        lastError = new Error(`Website returned HTTP ${response.status}.`);
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  throw new Error(`Timed out waiting for the saved student to return. ${lastError || ""}`);
}

async function main() {
  const response = await fetch(`${baseUrl}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: verificationName,
      email: verificationEmail,
      course: verificationCourse
    })
  });
  if (!response.ok) {
    throw new Error(`Could not create verification student (HTTP ${response.status}).`);
  }
  const { student: savedStudent } = await response.json();
  console.log(`Created verification record #${savedStudent.id}. Removing only the MySQL container…`);

  runCompose(["rm", "-sf", "mysql"]);
  runCompose(["up", "-d", "mysql"]);

  const restoredStudent = await waitForStudent();
  if (restoredStudent.id !== savedStudent.id) {
    throw new Error("The student was found after recreation but its record ID changed.");
  }
  console.log(
    `PASS: ${restoredStudent.name} (#${restoredStudent.id}) survived MySQL container removal and recreation.`
  );
  console.log("The mysql_data named volume remains mounted at /var/lib/mysql.");
}

main().catch((error) => {
  console.error("Persistence verification failed:", error);
  process.exitCode = 1;
});

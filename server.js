const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { validateStudent } = require("./student");

const port = Number(process.env.PORT || 3000);
const publicDirectory = path.join(__dirname, "public");
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "school",
  user: process.env.DB_USER || "school",
  password: process.env.DB_PASSWORD || "school-demo-password",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 8192) {
      const error = new Error("Request body must be 8 KB or smaller.");
      error.status = 413;
      throw error;
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/health" && request.method === "GET") {
    const [rows] = await pool.query("SELECT COUNT(*) AS studentCount FROM students");
    return sendJson(response, 200, { status: "connected", studentCount: rows[0].studentCount });
  }

  if (pathname === "/api/students" && request.method === "GET") {
    const [rows] = await pool.query(
      "SELECT id, name, email, course, created_at AS createdAt FROM students ORDER BY id"
    );
    return sendJson(response, 200, { students: rows });
  }

  if (pathname === "/api/students" && request.method === "POST") {
    const input = await readJson(request);
    const result = validateStudent(input);
    if (result.error) {
      return sendJson(response, 400, { error: result.error });
    }
    const { name, email, course } = result.student;
    const [insert] = await pool.execute(
      "INSERT INTO students (name, email, course) VALUES (?, ?, ?)",
      [name, email, course]
    );
    const [rows] = await pool.execute(
      "SELECT id, name, email, course, created_at AS createdAt FROM students WHERE id = ?",
      [insert.insertId]
    );
    return sendJson(response, 201, { student: rows[0] });
  }

  return sendJson(response, 404, { error: "API endpoint not found." });
}

function serveStatic(response, pathname) {
  const requestedFile = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!["index.html", "app.js", "styles.css"].includes(requestedFile)) {
    response.writeHead(404);
    return response.end("Not found");
  }

  const filePath = path.join(publicDirectory, requestedFile);
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(500);
      return response.end("Unable to load the website.");
    }
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)],
      "Cache-Control": "no-store"
    });
    response.end(contents);
  });
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname.startsWith("/api/")) {
    try {
      await handleApi(request, response, pathname);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return sendJson(response, 409, { error: "A student with that email already exists." });
      }
      if (error.status) {
        return sendJson(response, error.status, { error: error.message });
      }
      console.error("API request failed:", error);
      if (!response.headersSent) {
        sendJson(response, 503, { error: "The database is temporarily unavailable. Try again shortly." });
      } else {
        response.destroy(error);
      }
    }
    return;
  }

  if (request.method !== "GET") {
    response.writeHead(405, { Allow: "GET" });
    return response.end("Method not allowed");
  }
  serveStatic(response, pathname);
});

async function start() {
  await pool.query("SELECT 1");
  server.listen(port, "0.0.0.0", () => {
    console.log(`Student records website listening on port ${port}`);
  });
}

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch(async (error) => {
  console.error("Unable to connect to MySQL:", error);
  await pool.end();
  process.exit(1);
});

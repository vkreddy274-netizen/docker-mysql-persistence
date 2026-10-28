# MySQL Docker Volume Persistence Lab

A student-records website that demonstrates the difference between a replaceable MySQL container and persistent database storage. MySQL stores its data in the Compose named volume `mysql_data`, mounted at `/var/lib/mysql`. Compose scopes the actual Docker volume name to the project, so separate checkouts keep their data isolated.

## Run the website

Install Docker Desktop (or Docker Engine with the Compose plugin), then run from this directory:

```sh
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000). The page shows the records currently stored in MySQL; add a student to create a record of your own. The first database initialization also inserts two example students.

## Prove records survive container removal

The automated check creates a uniquely named student through the website, removes and recreates only the MySQL container, then checks that the same record and ID are still returned:

```sh
npm run verify:persistence
```

The check briefly interrupts the database while the container is recreated. Start the website first with `docker compose up --build -d`. A manual alternative is:

1. Add a student in the website and note their name or record ID.
2. Remove only the MySQL container with `docker compose rm -sf mysql`.
3. Recreate it with `docker compose up -d mysql`.
4. Wait for MySQL to become healthy, refresh the website, and confirm the student is still listed.

The Compose file mounts the named volume at MySQL's data directory:

```yaml
services:
  mysql:
    volumes:
      - mysql_data:/var/lib/mysql
```

`mysql_data` is a named volume. Docker Compose prefixes its actual volume name with the project name. Initialization runs only when MySQL initializes an empty data directory, so recreating a container does not replace existing records with the sample rows.

> **Important:** `docker compose down -v` deletes the named volume and its data. Do not use it during the persistence check. Use that command only when you intentionally want to erase the demo database and start over.

## Configuration

Compose provides local demo defaults for the database name, user, and passwords. Override `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_ROOT_PASSWORD` in the environment when needed. These defaults are for local learning only, not production credentials.

## Run the validation tests

With Node.js 22 or later installed:

```sh
npm ci
npm test
```

The tests cover server-side student input validation. Run `npm run verify:persistence` with Docker and the website running to perform the container-removal check.

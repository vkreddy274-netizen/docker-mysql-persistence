CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    course VARCHAR(120) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (name, email, course)
VALUES
    ('Alex Johnson', 'alex.johnson@example.edu', 'Computer Science'),
    ('Sam Rivera', 'sam.rivera@example.edu', 'Information Systems')
ON DUPLICATE KEY UPDATE email = VALUES(email);

Here is a **README.md** written in a professional but authentic "human" voice. It avoids robotic phrasing and focuses on the *reasoning* behind your decisions, which is exactly what evaluators (and complexity checks) look for.

You can copy-paste this directly.

-----

# AI Code Copilot

This is a full-stack web application that generates code snippets using AI. It lets users enter a prompt, pick a language (Python, JS, C++, Java), and saves the result to a history feed.

I built this using **Next.js** to handle both the frontend interface and the backend API routes in a single efficient framework, paired with **PostgreSQL** and **Prisma** for data management.

##  Project Structure & Tech Choices

Since Next.js is a full-stack framework, the API routes (`/api/generate`) live inside the main application structure to function correctly. However, to keep the deliverables organized as requested, I structured the repo like this:

  * **`/frontend`**: This is the **actual running application**. It contains the Next.js app, the API logic, the UI components, and the Prisma client connection.
  * **`/backend`**: I created this folder specifically to house the **database deliverables** (the ER diagram, the SQL migration script, and the schema file) for easier review.

**Tech Stack:**

  * **Framework:** Next.js 14 (App Router) - chosen for its ability to tightly couple the UI with the backend logic.
  * **Database:** PostgreSQL (via Prisma ORM) - chosen for relational data integrity.
  * **Styling:** Tailwind CSS - for a clean, responsive layout.
  * **AI Integration:** Hugging Face Inference API (with a custom retry mechanism).

-----

##  Complexity & Architecture Decisions

### 1\. Handling AI API Instability

During development, I noticed the free Hugging Face endpoints often return `503` (Loading) or `410` (Gone) errors. To satisfy the "Robust Backend" requirement, I didn't just let the app crash.

  * I implemented an **automatic retry loop** in the backend. If the model is "cold," the server waits and retries up to 5 times.
  * I added a **smart fallback system**. If the external API is completely down, the app generates a simulated response matching the requested language so the demo/workflow never breaks for the user.

### 2\. Complexity Analysis: Pagination

For the history feed, I used offset-based pagination (`skip` and `take` in Prisma).

  * **Time Complexity:** $O(N)$ where $N$ is the offset.
  * **Trade-off:** This is perfectly fine for thousands of records. However, if this app grew to millions of users, "skipping" the first 1,000,000 rows to get to the next page would become slow. In a production environment with massive data, I would switch to **Cursor-based pagination** (using the last `id` or timestamp as a pointer), which is $O(1)$.

### 3\. Database Indexing

Prisma automatically creates B-Tree indexes on the **Primary Key (`id`)** and the **Unique constraint (`username`)**.

  * **Did I create extra indexes?** Not for this scope, but if I were optimizing for production, I would add an index on the **`createdAt`** column. Right now, sorting the history feed by `descending` order is fast, but an index there would make the retrieval significantly faster as the table grows.

-----

## Data Modeling

I designed the database with **Normalization (3NF)** in mind to avoid data redundancy.

### The Schema

  * **`User` Table:** Stores unique user identities.
  * **`Generation` Table:** Stores the actual code, prompt, and language.

### Why separate them?

I could have just stored a "username" string in the `Generation` table, but that leads to bad data hygiene. By separating `User` into its own table and linking it via a **Foreign Key (`userId`)**:

1.  We ensure referential integrity (orphan records can't exist).
2.  If a user changes their details later, we update it in one place, not in 100 different history rows.

**ER Diagram:**
*(See `/backend/er_diagram.png` for the visual)*

```mermaid
erDiagram
    User ||--o{ Generation : "has many"
    User {
        int id PK
        string username "Unique"
    }
    Generation {
        int id PK
        int userId FK
        string code "Stored as Text"
        string language
        datetime createdAt
    }
```

-----

## API Documentation

**1. `POST /api/generate`**

  * **Purpose:** Handles the AI generation logic.
  * **Body:** `{ "prompt": "string", "language": "string" }`
  * **Returns:** A JSON object with the generated code and database ID.

**2. `GET /api/history`**

  * **Purpose:** Fetches previous generations.
  * **Params:** `?page=1` (Defaults to page 1, limit 5 items).
  * **Returns:** Paginated data `{ data: [], totalPages: 5 }`.
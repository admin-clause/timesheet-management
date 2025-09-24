# Internal Timesheet Admin Tool

This project is an internal timesheet management tool built with Next.js and Prisma.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd admin-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## Development Workflow

When starting development, launch the database and the application with the following steps.

### 1. Start the Database

This project uses PostgreSQL in a Docker container as its database.
Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.

Run the following command to start the database in the background:

```bash
docker compose up -d
```

To stop the database, run `docker compose down`.

### 2. Start the Application

Run the following command to start the Next.js development server:

```bash
npm run dev
```

Once started, open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

The database schema is managed by Prisma.

### Changing the Schema

To change the database models (table structure), follow these steps:

1. Edit the `prisma/schema.prisma` file.

2. Run the following command to apply the changes to the database (migration). Replace `<migration-name>` with a short, descriptive name for your change (e.g., `add_notes_to_user`).

   ```bash
   npx prisma migrate dev --name <migration-name>
   ```

### Seeding the Database

To populate the database with initial data (like the project list), run the following command:

```bash
npx prisma db seed
```

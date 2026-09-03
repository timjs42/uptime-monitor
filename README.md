# Uptime Monitor

A full-stack uptime monitoring dashboard built with Next.js.

The application periodically checks a predefined set of websites, records their availability and response times, and presents historical uptime data through a minimal status dashboard.

## Goals

This project is designed to demonstrate:

* Full-stack application development with Next.js
* Backend API design
* PostgreSQL database design and querying
* Scheduled background monitoring
* Error and timeout handling
* Data-driven UI/UX
* Deployment and environment configuration

## Features

### Planned

* Monitor predefined HTTP/HTTPS endpoints
* Run health checks every five minutes
* Record HTTP status codes
* Measure response times
* Store historical check results
* Calculate uptime percentages
* Display recent downtime
* Track incidents and recoveries
* Visualize response-time history
* Expose a read-only status API for external projects

## Architecture

The application is split into four main responsibilities:

1. **Scheduler**
   GitHub Actions triggers the monitoring process every five minutes.

2. **Monitoring API**
   A protected Next.js API endpoint receives the scheduled request and checks each configured monitor.

3. **Database**
   PostgreSQL stores monitor configuration, individual health checks, and downtime incidents.

4. **Dashboard**
   Next.js reads monitoring data and presents current status, uptime history, response times, and incidents.

### Data flow

```text
GitHub Actions
      |
      | every 5 minutes
      V
Next.js monitoring endpoint
      |
      +----> Website A
      +----> Website B
      +----> Website C
      |
      V
PostgreSQL
      |
      V
Next.js dashboard
```

## Tech Stack

* **Framework:** Next.js
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Database:** PostgreSQL
* **Database Platform:** Supabase
* **Deployment:** Vercel
* **Scheduling:** GitHub Actions

## Monitoring Model

Each monitor represents a predefined website or endpoint.

A health check will record data such as:

```text
Monitor
├── name
├── URL
└── active status

Health Check
├── monitor
├── HTTP status code
├── response time
├── availability
├── error
└── timestamp
```

An endpoint is considered operational when the request completes successfully and returns an acceptable HTTP response.

Timeouts, network failures, and unsuccessful responses are recorded so that failures can be displayed and analyzed.

## Incident Tracking

Individual failed checks and downtime incidents are treated separately.

For example:

```text
UP
UP
DOWN  <- incident begins
DOWN
DOWN
UP    <- incident resolves
UP
```

This allows the dashboard to show meaningful downtime events instead of only a list of failed requests.

## Project Structure

The project will evolve toward a structure similar to:

```text
src/
├── app/
│   ├── api/
│   │   ├── check/
│   │   └── status/
│   ├── page.tsx
│   └── layout.tsx
│
├── components/
│
├── lib/
│   ├── database/
│   └── monitoring/
│
└── types/
```

The exact structure may change as implementation requirements become clearer.

## Security

The monitoring endpoint will not be publicly executable without authorization.

Scheduled requests will include a secret stored in environment variables, preventing arbitrary users from triggering monitoring runs.

Database credentials and scheduler secrets will not be committed to the repository.

## Portfolio Integration

The uptime monitor is designed as a standalone application and repository.

A future read-only API will allow the main portfolio site to display a lightweight live status summary without coupling the two projects together.

Example:

```text
Portfolio
    |
    | GET /api/status
    V
Uptime Monitor
    |
    V
Current service status
```

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Before committing changes:

```bash
npm run lint
npm run build
```

## Status

Currently in active development.

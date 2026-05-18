# Coupled Space Weather Impact Model

C-SWIM is a coupled model that assesses the vulnerability of operational
satellites to extreme space weather. It estimates the probability that a
satellite suffers a dose-induced failure during a severe solar energetic
particle event, and it places that estimate in the context of current,
live space weather conditions.

This repository contains the model's data services and an interactive
dashboard. The dashboard is the public face of the work described in
Bor et al.

## What the model finds

C-SWIM analyses the operational satellite fleet under a solar energetic
particle event of the kind expected roughly once per century. For each
analysed satellite it computes a failure probability and assigns a
vulnerability class. Under the one-in-one-hundred-year scenario, of the
analysed fleet, a small number of satellites fall into the Critical and
Elevated classes. These are concentrated in the higher orbital regimes
and at high inclination, where shielding against energetic protons is
weakest. The dashboard makes this structure visible.

## What is in this repository

The repository has two parts.

The backend, under `api/` and `flows/`, is a data service. It serves the
vulnerability results, the satellite catalogue, propagated satellite
trajectories, and live space weather measurements drawn from NOAA SWPC.
It is built with FastAPI and PostgreSQL, with Prefect orchestrating the
scheduled ingestion of live data and the propagation of trajectories.
The whole backend runs under Docker Compose.

The frontend, under `web/`, is the dashboard. It is a single-page
application built with Vite and React. It presents a three-dimensional
globe showing the satellite fleet in motion, coloured by vulnerability
class, a strip of current space weather conditions, and a set of charts
describing the vulnerability results.

## Architecture

The backend exposes a JSON API. Every endpoint sits under `/api`.

The vulnerability endpoints return the static published results: a
summary of counts by class and regime, a log-binned distribution of
failure probability, and the full set of analysed satellites with their
orbital placement.

The live endpoints return current and recent space weather: solar wind,
geomagnetic activity, and GOES proton flux. These are refreshed on a
schedule by a Prefect flow.

The positions endpoints return satellite trajectories. The fleet
endpoint returns a curated set of satellites with sampled trajectories
over a short window, which the dashboard animates locally. The trail
endpoint returns one satellite's full-resolution trajectory.

The dashboard fetches from these endpoints, animates the globe from the
sampled trajectories without further network traffic, and polls the live
endpoints on a short cadence.

## Running the backend

The backend runs under Docker Compose. A `.env` file at the repository
root supplies the database credentials and the Space-Track login used to
fetch orbital elements. With Docker installed:

    docker compose up -d

This starts PostgreSQL, the API, and the Prefect server and flows. The
API is then available on port 8000 and the Prefect interface on port
4200.

Confirm the API is responding:

    curl http://localhost:8000/api/health

## Running the dashboard

The dashboard is in `web/`. It requires Node 24.

    cd web
    npm install
    npm run dev

The development server runs on port 5173 and proxies API requests to the
local backend, so the backend must be running for the dashboard to show
data.

To build the production bundle:

    npm run build
    npm run preview

The production build reads the API location from `web/.env.production`.

## Deployment

The dashboard is deployed to GitHub Pages by the workflow in
`.github/workflows/deploy-pages.yml`, which builds the frontend on every
push to the main branch. The backend is deployed separately and serves
the production API.

## Attribution

C-SWIM and the analysis it implements are the work of Dennies Bor and
collaborators. Live space weather measurements are provided by the NOAA
Space Weather Prediction Center. Orbital elements are provided by
Space-Track.
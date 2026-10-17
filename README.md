# Morrowgrain

A furniture workshop website about giving familiar timber a new use. The name combines “morrow” with wood grain, carrying the idea of something worth keeping into another chapter.

Built with HTML, CSS and JavaScript. Nine standalone pages, local media and fonts, and no build step.

## Run locally

Open `index.html` in a browser. Keep the `assets` folder alongside the HTML files.

## Pages and features

- Home with a muted workshop film and poster fallback.
- Work archive with filters and three individual project stories.
- Process page with timber options and frequently asked questions.
- Workshop page, enquiry page and privacy information.
- Responsive navigation, keyboard focus states, reduced motion and data-saving support.
- Enquiry validation, review, editing, clipboard copying and text download.

## Deploy on Vercel

Import the repository into Vercel. The included `vercel.json` serves the root directory without a build command. No package installation is required.

## Configuration

Edit `assets/site-config.js`:

- `heroVideo`: path to the local background film.
- `contactEmail`: a real address to enable the email-app action.
- `formEndpoint`: an HTTPS endpoint to enable direct enquiry delivery.

Delivery is disabled until an email address or endpoint is configured. The local enquiry review, copy and download functions work independently. An endpoint should accept JSON fields `name`, `email`, `location`, `piece`, `timber`, `story`, `timing`, `website` and `preparedAt`, and return a successful status only after accepting the request. Keep credentials and server-side validation in the form service.

Replace `assets/video/hero.mp4` and `assets/images/hero-poster.jpg` together when changing the film. Brand colors and type roles are defined at the start of `assets/styles.css`.

## Content and credits

This is a portfolio concept. Project stories and client words are illustrative. Media sources and font licenses are recorded in [CREDITS.md](CREDITS.md).

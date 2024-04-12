# BestBuy Product Tracker

This project is a tracker for BestBuy, it will goto the site look for all the items under a certain category. In my case I made it for specifically openbox items however that can be easily disabled within the scraper.js in api. Currently it only shows a website however soon plan on other notification sources.

## Planned features
- [] Remove all manual delays and replace them with network traffic awaits
- [] Add a better way to check for zipcode entered
- [] Docker container it
- [] Webhooks and better notification
- [] Small LLM to parse thru deals and find good ones
- [] Filter system

## Project Structure

- `api/` - Contains the server-side code for fetching product data.
- `public/` - Contains the client-side code for displaying product data.
- `server.js` - The entry point for the server.
- `package.json` - Defines the project dependencies and scripts.

## Setup

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Start the server with `npm start`.

## Usage

Open `http://localhost:3030` in your web browser to view the product data.

## Scripts

- `npm start` - Starts the web server.
- `npm run scrape` - Runs the scraper script to fetch product data.

## Dependencies

- `dotenv` - Used to load environment variables.
- `express` - Used to create the server.
- `puppeteer` and `puppeteer-extra` - Used for web scraping.
- `sqlite3` - Used for the database.

## Contributing

Pull requests are welcome. For major changes make a draft first, so others can see what you're working on!

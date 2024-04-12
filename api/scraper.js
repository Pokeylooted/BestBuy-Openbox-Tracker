const puppeteer = require('puppeteer-extra')
const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require('puppeteer')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { upsertProduct, markProductsAsRemoved } = require('./database.js');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { urlencoded } = require('express');
require('dotenv').config();

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }
 async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight - window.innerHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 250);
        });
    });
}  
puppeteer.use(StealthPlugin(), AdblockerPlugin({interceptResolutionPriority:DEFAULT_INTERCEPT_RESOLUTION_PRIORITY}))
async function scrapeOpenBoxDeals(zipCode, url) {
    const browser = await puppeteer.launch({headless:false, slowmo: 250});
    //const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 2380 });
    await page.goto("https://www.bestbuy.com/site/store-locator", { waitUntil: 'domcontentloaded' });
    await delay(1000)
    await page.waitForSelector('.zip-code-input', { visible: true });
    await page.type('.zip-code-input', zipCode, { delay: 100 });
    await page.waitForSelector('[data-track="Store Locator Results: Search by Location"]', { visible: true });
    await page.click('[data-track="Store Locator Results: Search by Location"]');
    await delay(500)
    await page.waitForSelector('.make-this-your-store', { visible: true });
    await page.click('.make-this-your-store');
    await delay(200)
    console.log('Zip code entered')

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await delay(2500)
    await page.waitForSelector('.fulfillment-fulfillment-summary .c-button-link', { visible: true });
    await page.click('.fulfillment-fulfillment-summary .c-button-link div');
    await page.waitForSelector('.popover-content.spinnable.not-spinning', { visible: true });
    await page.type('.popover-content.spinnable.not-spinning input[placeholder="ZIP or City, State"]', zipCode, { delay: 100 });
    await page.click('.popover-content.spinnable.not-spinning [data-track="Delivery Location Modal: Update Button"]');
    await page.waitForSelector('.component-sku-list .sku-item .open-box-lowest-price');
    await delay(1200)
    await autoScroll(page);
    await delay(3000); // Wait for 3 seconds to ensure all content is loaded
    console.log('Page loaded');
    // console.log('Cookies:', await page.cookies());
    await delay(5000);
    const element = await page.$('.fulfillment-fulfillment-summary .c-button-link div');
    if (element) {
        throw new Error('ZipCode not entered correctly');
    }
    const products = await page.evaluate(() => {
        const scrapedData = [];
        document.querySelectorAll('.sku-item').forEach(item => {
            const skuIdElement = item.querySelector('.sku-value');
            const skuId = skuIdElement?.innerText;
            const imageSrc = item.querySelector('img')?.src;
            const titleElement = item.querySelector('.sku-title a');
            const productTitle = titleElement?.innerText;
            const productLink = titleElement?.href;
            const originalPriceElement = item.querySelector('.priceView-buy-new-option__price-medium');
            const originalPrice = originalPriceElement?.innerText;
            const currentPriceElement = item.querySelector('.open-box-lowest-price');
            const currentPrice = currentPriceElement?.innerText;
            const inStoreAvailabilityElement = item.querySelector('.fulfillment-fulfillment-summary span');
            const inStoreAvailability = inStoreAvailabilityElement?.innerText;

            scrapedData.push({
                skuId,
                imageSrc,
                productTitle,
                productLink,
                originalPrice,
                currentPrice,
                inStoreAvailability
            });
        });

        return scrapedData;
    });
    products.forEach(upsertProduct);
    const skuIds = products.map(p => p.skuId);
    console.log('Products found:', products.length);
    const uniqueSkuIds = [...new Set(skuIds)];
    console.log('Unique products found:', uniqueSkuIds);
    console.log('products found:', uniqueSkuIds.length);
    markProductsAsRemoved(skuIds);
    await browser.close();
}

function isValidUrl(string) {
    try {
        new URL(string);
    } catch (_) {
        return false;  
    }

    return true;
}

const zipCode = process.env.ZIP_CODE;
const url = process.env.URL;

if (isValidUrl(url) == false) {
    console.log('Invalid URL');
    return;
}

(async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            await scrapeOpenBoxDeals(zipCode, url);
            break; // If it succeeds, break the loop
        } catch (error) {
            console.error(`Attempt ${attempts + 1} failed with error: ${error}`);
            attempts++;
            if (attempts === maxAttempts) {
                console.error('All attempts failed. Giving up.');
            }
        }
    }
})();
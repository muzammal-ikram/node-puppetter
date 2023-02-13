const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  // Type search item that we will search on amazon.com
  const type = "candy";
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    //    args: [
    //   '--no-sandbox',
    //   '--disable-setuid-sandbox',
    // ]
  });
  const page = await browser.newPage();

  const items = [];

  await page.goto("https://www.amazon.com");

  await page.waitForSelector("#twotabsearchtextbox");
  await page.focus("#twotabsearchtextbox");
  await page.keyboard.type(type);

  await page.$eval("#nav-search-submit-button", (el) => el.click());

  await page.waitForNavigation();

  await page.waitForSelector(
    "div.s-main-slot.s-result-list.s-search-results.sg-row > div.s-result-item"
  );
  let isBtnDisabled = false;
  while (!isBtnDisabled) {
    const products = await page.$$(
      "div.s-main-slot.s-result-list.s-search-results.sg-row > div.s-result-item"
    );
    for (const product of products) {
      let title = null;
      let price = null;
      let image = null;
      try {
        title = await page.evaluate(
          (el) => el.querySelector("h2 > a > span").textContent,
          product
        );
      } catch (error) {}

      try {
        price = await page.evaluate(
          (el) => el.querySelector(".a-price > .a-offscreen").textContent,
          product
        );
      } catch (error) {}

      try {
        image = await page.evaluate(
          (el) => el.querySelector(".s-image").getAttribute("src"),
          product
        );
      } catch (error) {}

      if (title) {
        fs.appendFile(
          "items.csv",
          `${title.replace(/,/g, ".")},${price},${image}\n`,
          function (err) {
            if (err) throw err;
          }
        );
      }
    }

    await page.waitForSelector(".s-pagination-item.s-pagination-next", {
      visible: true,
    });
    const isDisabled =
      (await page.$(
        "span.s-pagination-item.s-pagination-next.s-pagination-disabled"
      )) !== null;
    isBtnDisabled = isDisabled;
    if (!isDisabled) {
      await Promise.all([
        page.click(".s-pagination-item.s-pagination-next"),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    }
  }
  console.log(items, "@items");

  browser.close();
})();

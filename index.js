const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");

const app = express();
const port = 5000;

app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");

app.post("/", (req, res) => {
	if (req.body.type == 'cover') {
		res.render("cover/template", {
			tag: req.body.tag,
			title: req.body.title,
			subtitle: req.body.subtitle,
			cover: req.body.cover,
		});
	} else if (req.body.type == 'close') {
		res.render("close/template", {
			cover: req.body.cover,
		});
	} else {
		res.render("point/template", {
			tag: req.body.tag,
			subtitle: req.body.subtitle,
			title: req.body.title,
			points: req.body.points,
		});
	}
});

app.post("/render", async (req, res) => {
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		const targetUrl = `http://localhost:${port}/`;

		await page.setRequestInterception(true);

		page.on("request", (interceptedRequest) => {
			if (
				interceptedRequest.isNavigationRequest() &&
				interceptedRequest.url() === targetUrl
			) {
				interceptedRequest.continue({
					method: "POST",
					postData: JSON.stringify(req.body),
					headers: {
						...interceptedRequest.headers(),
						"Content-Type": "application/json",
					},
				});
			} else {
				interceptedRequest.continue();
			}
		});

		await page.goto(targetUrl, {waitUntil: "networkidle0"});

		const screenshotBuffer = await page.screenshot({ fullPage: true });
		await browser.close();

		res.setHeader("Content-Type", "image/png");
		res.send(screenshotBuffer);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error taking screenshot");
	}
});

app.listen(port, () => {
	console.log("Service Running");
});

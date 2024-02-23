<img align="left" src="https://github.com/maffin-io/maffin-app/blob/master/src/assets/images/maffin_logo_sm.png" width="70" height="65">


# Maffin

<p align="center">
  🌍 <a href="https://maffin.io" target="_blank">Landing page</a>&nbsp;&nbsp;
  🍭 <a href="https://demo.maffin.io" target="_blank">Our demo</a>&nbsp;&nbsp;
  📖 <a href="https://blog.maffin.io/docs" target="_blank">Documentation</a>&nbsp;&nbsp;
  📰 <a href="https://blog.maffin.io" target="_blank">Blog</a>
</p>

Maffin is an **accounting software** focused on particulars or small businesses. It allows you to track income, expenses, investments and other types of assets while showing your financials in nice dashboards and reports.

<div align="center">
  <img width="400" alt="Screenshot 2024-02-23 at 2 37 08 PM" src="https://github.com/maffin-io/maffin-blog/assets/3578154/3b842c43-3ed0-4f80-bab3-5d5cbb65a5a5"> <img width="400" alt="Screenshot 2024-02-23 at 2 37 26 PM" src="https://github.com/maffin-io/maffin-blog/assets/3578154/77dff933-7dca-4f38-bd6f-49694f890167">
</div>

## 🍒 Features

- 🔒 We store your data in your Google Drive. _Your data is yours_.
- 🪙 You can track assets in multiple currencies
- 📈 Investment dedicated reports and tracking.
- 📆 Monthly cash flow, balance sheet and other reports to have a better view of your wealth.
- 🐮 Do you need to count cows as part of your assets? You can, we do support _custom commodities_.
- 🔬 Transparency is a must for us, that's why all code is available in our [Github repo](https://github.com/maffin-io/maffin-app).

Do you want to see how it looks like? Visit our <a href="https://demo.maffin.io" blank="_blank">demo page</a>! You can create/update/delete anything you want in there.

## Implementation

Maffin is implemented using <a href="https://typeorm.io/" target="_blank">TypeOrm</a> entities that are stored in the browser. Whenever you do a change, all the data is uploaded to Google Drive. The schemas are extracted from <a href="https://wiki.gnucash.org/wiki/SQL" target="_blank">Gnucash schemas</a>.

> I was a user of Gnucash before building this. The main reason I used the same schemas is because I knew they would be better than anything I can think of and because I wanted to easily migrate the years of data I had.

## Developing

- Clone this repo.
- Install dependencies with `yarn`.
- Run the frontend with `NEXT_PUBLIC_ENV="staging" yarn maffin:dev`. If you don't add the env variable, you'll need Oauth permissions which.. you won't have.
- Run the backend with `yarn stocker:dev`.

Happy coding 🥳.

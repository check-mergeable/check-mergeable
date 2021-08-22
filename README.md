# Check Mergeable

Prevent from accidentally merging a pull request which depends on another pull request.

## Features

If the pull request is not targetting the `main` branch,

* 🔖 Adds 'status: dependent' label to the pull request.

    <img width="300" alt="label" src="https://user-images.githubusercontent.com/931655/130362351-651d99f7-b62e-4988-bfba-079cec720dd3.png">

* ⏳ Sets pull request status as 'pending'.

    <img width="800" alt="status" src="https://user-images.githubusercontent.com/931655/130361943-90114c4d-31a5-4c3a-8396-3b34ef2ab3cc.png">

## Installation

Go to the [app page](https://github.com/apps/check-mergeable) and install the app.

## Configuration

This app is not currently configurable. The values are hardcoded:

* Target branch allowlist: `main`, `develop`, `release/*`, `hotfix/*`
* Custom labels: `status: dependent`

## Development

### Vercel

This app is running on [vercel](https://vercel.com/) using [Serverless Functions](https://vercel.com/docs/serverless-functions/introduction).

#### Environment Variables

* `APP_ID`
* `PRIVATE_KEY`
* `WEBHOOK_SECRET`

You'll be able to find the values in [check-mergeable app settings](https://github.com/organizations/pocketlesson/settings/apps/check-mergeable). (PocketLesson members only!)

### Useful Resources

* [Probot](https://probot.github.io/)
* [Probot - Deployment to Vercel](https://probot.github.io/docs/deployment/#vercel)

## License

check-mergeable is under ISC license. See the [LICENSE](LICENSE) file for more info.

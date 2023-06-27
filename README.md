# maffin.io

# Developing

If you want to add a new user, before starting with the installation you will need few steps:

1. [new maintainers only] Ask a maintainer for the AWS keys and credentials so you can interact with local amplify cli and access AWS console respectively
2. Add the user gmail account to the google console as a test user (for now)


## Installation

Run `nvm use` to set the correct node version.

```
yarn                  # Install frontend dependencies
yarn stocker:install  # Install backend dependencies
```

If not installed yet, install amplify cli with `npm install -g @aws-amplify/cli`. Then if it's your first time, you'll have to pull the amplify project:

> Make sure to select your AWS profile credentials with `export AWS_PROFILE=maffin`

```
10:56 $ amplify pull
? Select the authentication method you want to use: AWS access keys
? accessKeyId:  ********************                           # credentials from maffin account
? secretAccessKey:  ****************************************
? region:  eu-central-1
? Which app are you working on? dkycpktllbi8x
Backend environment 'master' found. Initializing...
? Choose your default editor: Vim (via Terminal, macOS only)
? Choose the type of app that you're building javascript
Please tell us about your project
? What javascript framework are you using react
? Source Directory Path:  src
? Distribution Directory Path: build
? Build Command:  yarn build
? Start Command: yarn start
✖ Failed to sync UI components
? Do you plan on modifying this backend? Yes
```

## Running

Run stocker with `yarn stocker:start` and then the frontend with `yarn maffin:start:`.

## Deploying

The project is deployed automatically everytime there is a merge to master using Amplify pipeline.

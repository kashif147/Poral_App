This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Push notifications (FCM)

The app registers the device token with the **notification service** (`NOTIFICATION_URL` in [`src/constants/api.js`](src/constants/api.js), path `/api/firebase/register-token`). **Delivering** pushes to FCM is done only on that server, using [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) or [FCM HTTP v1](https://firebase.google.com/docs/cloud-messaging/send-message) with **Google service account** credentials—not the mobile user JWT.

### If notification records show `error` about missing OAuth 2 access token

That response comes from Google’s API when the notification service calls FCM **without** valid server credentials (for example missing `GOOGLE_APPLICATION_CREDENTIALS`, broken workload identity, or a code path that omits the auth client). **Fix this in the notification-service repository and deployment**, not in this app:

1. Trace every code path that sends to FCM (`send`, `sendEachForMulticast`, or raw HTTP to `fcm.googleapis.com`) and ensure each uses the same initialized Admin app or OAuth client.
2. In every runtime (containers, workers, serverless), provide credentials: service account JSON via `GOOGLE_APPLICATION_CREDENTIALS`, or [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials) on GCP (metadata / workload identity).
3. In Google Cloud: enable **Firebase Cloud Messaging API** (and related APIs your stack uses); grant the service account roles needed to mint tokens and call FCM.
4. Use the **same Firebase project** as [`ios/GoogleService-Info.plist`](ios/GoogleService-Info.plist) and [`android/app/google-services.json`](android/app/google-services.json) (`PROJECT_ID` / sender).

### iOS delivery after server auth is fixed

- In [Firebase Console](https://console.firebase.google.com): register the iOS app, upload an **APNs authentication key** (or certificates) under Project settings → Cloud Messaging.
- Xcode: **Push Notifications** capability enabled; **Release** builds use [`ios/portal/portalRelease.entitlements`](ios/portal/portalRelease.entitlements) with `aps-environment` **production**; **Debug** uses [`ios/portal/portalDebug.entitlements`](ios/portal/portalDebug.entitlements) with **development** for dev provisioning.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

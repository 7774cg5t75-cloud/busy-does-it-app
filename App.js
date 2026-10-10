/**
 * The isolated staging installation loads ONLY its own Auth inspector at
 * runtime. Metro may include other modules in the export, but importantly
 * the production AppController import is never evaluated on staging.
 * This prevents eager production-module side effects before the mode switch.
 */
const isStaging=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT==="isolated-staging";
const SelectedApp=isStaging
 ? require("./src/staging/StagingSignInScreen").default
 : require("./BusyDoesItApp").default;
export default SelectedApp;

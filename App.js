/**
 * V3.131 stage-only test screen. Production and development app route to the
 * EXISTING BusyDoesItApp unchanged; staging has a separate EAS bundle/channel.
 */
import BusyDoesItApp from "./BusyDoesItApp";
import StagingSignInScreen from "./src/staging/StagingSignInScreen";
const isolated=process.env.EXPO_PUBLIC_BUSY_ENVIRONMENT==="isolated-staging";
export default (isolated?StagingSignInScreen:BusyDoesItApp);

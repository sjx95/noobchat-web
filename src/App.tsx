import { AppNavbar } from "./AppNavbar";
import Call from "./Call";
import { AuthContext, useAzureAuth } from "./hooks/useAzureAuth";

export default function App() {
    return (
        <AuthContext.Provider value={useAzureAuth()}>
            <AppNavbar />
            <Call />
        </AuthContext.Provider>
    )
}



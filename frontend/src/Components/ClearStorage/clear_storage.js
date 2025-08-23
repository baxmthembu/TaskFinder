import { useEffect } from "react";

const ClearStorage = () => {
    useEffect(() => {
        const handleUnload = (event) => {
            // Check if the user is closing the tab or window
            if (window.performance.getEntriesByType("navigation")[0].type !== "reload") { // 1 indicates reload
                localStorage.clear()
            }
        };

        // Attach the `beforeunload` event listener
        window.addEventListener("unload", handleUnload);

        return () => {
            window.removeEventListener("unload", handleUnload);
        };
    }, []);

    return null;
};

export default ClearStorage;

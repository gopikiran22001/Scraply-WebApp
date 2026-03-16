import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_DEFAULT_TITLE, APP_TITLE_SUFFIX } from '../utils/appConfig';

const TITLES = {
    '/': `Home ${APP_TITLE_SUFFIX}`,
    '/awareness': `Awareness ${APP_TITLE_SUFFIX}`,
    '/citizen/dashboard': `Dashboard ${APP_TITLE_SUFFIX}`,
    '/citizen/request-pickup': `Request Pickup ${APP_TITLE_SUFFIX}`,
    '/citizen/pickups': `My Pickups ${APP_TITLE_SUFFIX}`,
    '/citizen/report-dump': `Report Dump ${APP_TITLE_SUFFIX}`,
    '/citizen/centres': `Area Activity ${APP_TITLE_SUFFIX}`,
    '/citizen/points': `My Progress ${APP_TITLE_SUFFIX}`,
    '/collector/dashboard': `Collector Dashboard ${APP_TITLE_SUFFIX}`,
    '/admin/dashboard': `Admin Dashboard ${APP_TITLE_SUFFIX}`,
    '/admin/pickups': `Manage Pickups ${APP_TITLE_SUFFIX}`,
    '/admin/centres': `Zone Analytics ${APP_TITLE_SUFFIX}`,
    '/admin/reports': `System Reports ${APP_TITLE_SUFFIX}`,
};

export default function PageTitleUpdater() {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        let title = TITLES[path];

        if (!title) {
            // Handle dynamic routes
            if (path.startsWith('/collector/route/')) {
                title = `Route Navigation ${APP_TITLE_SUFFIX}`;
            } else {
                title = APP_DEFAULT_TITLE;
            }
        }

        document.title = title;
    }, [location]);

    return null;
}
